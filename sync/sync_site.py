#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NEEL Lab website · Google Sites mirror (동기화 스크립트)
=====================================================
구글 사이트(https://sites.google.com/view/uksim)의 모든 페이지를 읽어서
  • data/content.js   ← 새 홈페이지가 읽는 구조화 데이터 (window.NEEL_DATA)
  • data/content.json ← 같은 내용(JSON)
  • assets/img/*.jpg  ← 사진 원본 (내용 해시로 파일명 고정, 중복 제거)
  • data/images.json  ← 사진 키 ↔ 파일 매핑 (증분 동기화용)
를 다시 생성합니다.  구글 사이트에서 내용을 고친 뒤 이 스크립트를 실행하면
새 디자인 홈페이지에 그대로 반영됩니다.

사용법:
  python3 sync/sync_site.py            # 증분 동기화 (새 사진만 다운로드)
  python3 sync/sync_site.py --full     # 모든 사진을 다시 다운로드
  python3 sync/sync_site.py --site https://sites.google.com/view/uksim --out .

필요: Python 3.8+, beautifulsoup4, lxml (없으면 자동 설치 시도), curl(맥/리눅스 기본 포함)
"""
import argparse
import concurrent.futures as cf
import hashlib
import html as htmlmod
import json
import os
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request
from collections import OrderedDict
from datetime import datetime

# --------------------------------------------------------------------------
# dependencies
# --------------------------------------------------------------------------
try:
    from bs4 import BeautifulSoup, NavigableString, Tag
except ImportError:  # pragma: no cover
    print("[setup] beautifulsoup4 / lxml 설치 중 ...")
    subprocess.call([sys.executable, "-m", "pip", "install", "--user", "beautifulsoup4", "lxml"])
    from bs4 import BeautifulSoup, NavigableString, Tag
try:
    import lxml  # noqa: F401
    PARSER = "lxml"
except ImportError:  # pragma: no cover
    PARSER = "html.parser"

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/128.0 Safari/537.36")
HAS_CURL = shutil.which("curl") is not None


def log(*a):
    print(*a, flush=True)


# --------------------------------------------------------------------------
# HTTP helpers (curl 우선, 없으면 urllib)
# --------------------------------------------------------------------------
def http_get(url, timeout=60):
    """Return bytes or None."""
    if HAS_CURL:
        try:
            r = subprocess.run(
                ["curl", "-sL", "--max-time", str(timeout), "-A", UA, url],
                capture_output=True, timeout=timeout + 10)
            if r.returncode == 0 and r.stdout:
                return r.stdout
        except Exception:
            pass
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except Exception as e:
        log("   ! fetch failed:", url[:80], e)
        return None


def http_get_text(url):
    b = http_get(url)
    return b.decode("utf-8", "replace") if b else None


# --------------------------------------------------------------------------
# image helpers
# --------------------------------------------------------------------------
def sniff_image(b):
    """Return (ext, width, height) or (None,0,0)."""
    if not b or len(b) < 12:
        return None, 0, 0
    if b[:3] == b"\xff\xd8\xff":
        w = h = 0
        i = 2
        try:
            while i < len(b):
                if b[i] != 0xFF:
                    i += 1
                    continue
                marker = b[i + 1]
                if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                    h, w = struct.unpack(">HH", b[i + 5:i + 9])
                    break
                seglen = struct.unpack(">H", b[i + 2:i + 4])[0]
                i += 2 + seglen
        except Exception:
            pass
        return "jpg", w, h
    if b[:8] == b"\x89PNG\r\n\x1a\n":
        try:
            w, h = struct.unpack(">II", b[16:24])
        except Exception:
            w = h = 0
        return "png", w, h
    if b[:6] in (b"GIF87a", b"GIF89a"):
        w, h = struct.unpack("<HH", b[6:10])
        return "gif", w, h
    if b[:4] == b"RIFF" and b[8:12] == b"WEBP":
        return "webp", 0, 0
    return None, 0, 0


try:
    from PIL import Image as _PILImage
    HAS_PIL = True
except Exception:  # pragma: no cover
    HAS_PIL = False

MAX_PX = 1600       # longest edge after optimisation
JPEG_Q = 82


def optimize_image(path):
    """Downscale to MAX_PX and re-encode (JPEG for photos, PNG kept only when
    real transparency is present).  Returns (new_path, w, h).  No-op without PIL."""
    if not HAS_PIL or not os.path.exists(path):
        return path, 0, 0
    try:
        im = _PILImage.open(path)
        im.load()
        w, h = im.size
        has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
        if has_alpha:
            a = im.convert("RGBA").getchannel("A")
            lo, hi = a.getextrema()
            has_alpha = lo < 250
        if max(w, h) > MAX_PX:
            im.thumbnail((MAX_PX, MAX_PX), _PILImage.LANCZOS)
        base = os.path.splitext(path)[0]
        if has_alpha:
            out = base + ".png"
            im.convert("RGBA").save(out, "PNG", optimize=True)
        else:
            out = base + ".jpg"
            im.convert("RGB").save(out, "JPEG", quality=JPEG_Q, optimize=True, progressive=True)
        if out != path and os.path.exists(path):
            os.remove(path)
        return out, im.size[0], im.size[1]
    except Exception as e:
        log("   ! optimise failed:", os.path.basename(path), e)
        return path, 0, 0


def is_site_image(url):
    """구글 사이트 이미지 주소 (예전: lh3.googleusercontent.com/sitesv/…, 2026-10~: sites.google.com/sitesv-images-rt/…)."""
    return "googleusercontent" in url or "/sitesv-images" in url


def normalize_img_url(url):
    """구글 이미지 크기 파라미터 정리 (배너 원본은 1920px로 제한)."""
    url = htmlmod.unescape(url)
    if url.endswith("=w16383"):
        return url[: -len("=w16383")] + "=w1920"
    return url


# --------------------------------------------------------------------------
# inline HTML conversion  (Google Sites span styles → b/i/u/sup/sub/a)
# --------------------------------------------------------------------------
def style_flags(style):
    st = (style or "").lower()
    bold = bool(re.search(r"font-weight\s*:\s*(bold|[6-9]00)", st))
    ital = "font-style: italic" in st or "font-style:italic" in st
    under = "text-decoration: underline" in st or "text-decoration:underline" in st
    sup = "vertical-align: super" in st or "vertical-align:super" in st
    sub = "vertical-align: sub" in st or "vertical-align:sub" in st
    return bold, ital, under, sup, sub


def inline_html(node):
    """Convert an inline container (p / li / heading) into clean HTML."""
    out = []

    def walk(n):
        for ch in n.children:
            if isinstance(ch, NavigableString):
                s = str(ch)
                if s.strip() == "" and "\n" in s:
                    s = " "
                out.append(htmlmod.escape(s, quote=False))
            elif isinstance(ch, Tag):
                name = ch.name
                if name == "br":
                    out.append("<br>")
                    continue
                if name in ("script", "style"):
                    continue
                if name == "a" and ch.get("href"):
                    href = ch["href"]
                    if href.startswith("/view/"):
                        href = "https://sites.google.com" + href
                    out.append('<a href="%s" target="_blank" rel="noopener">' % htmlmod.escape(href, quote=True))
                    walk(ch)
                    out.append("</a>")
                    continue
                if name == "img":
                    continue  # images are handled as blocks
                b, i, u, sp, sb = style_flags(ch.get("style"))
                if name in ("b", "strong"):
                    b = True
                if name in ("i", "em"):
                    i = True
                if name == "u":
                    u = True
                if name == "sup":
                    sp = True
                if name == "sub":
                    sb = True
                opens, closes = [], []
                for flag, tag in ((b, "b"), (i, "i"), (u, "u"), (sp, "sup"), (sb, "sub")):
                    if flag:
                        opens.append("<%s>" % tag)
                        closes.insert(0, "</%s>" % tag)
                # skip formatting on whitespace-only spans
                txt = ch.get_text()
                if txt.strip() == "" and not ch.find(["a", "br", "img"]):
                    out.append(htmlmod.escape(txt, quote=False))
                    continue
                out.extend(opens)
                walk(ch)
                out.extend(closes)

    walk(node)
    h = "".join(out)
    h = re.sub(r"[ \t\r\n]+", " ", h)
    # merge adjacent identical tags  (</b><b>)
    for t in ("b", "i", "u", "sup", "sub"):
        h = h.replace("</%s><%s>" % (t, t), "")
    return h.strip()


def html_to_text(h):
    t = re.sub(r"<br\s*/?>", "\n", h)
    t = re.sub(r"<[^>]+>", "", t)
    return htmlmod.unescape(t).strip()


# --------------------------------------------------------------------------
# Page model extraction
# --------------------------------------------------------------------------
BLOCK_TAGS = {"p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "table", "img", "iframe"}


class PageExtractor:
    def __init__(self, slug, soup, img_registry):
        self.slug = slug
        self.soup = soup
        self.reg = img_registry   # ImageRegistry
        self.img_counter = 0
        self.keys = []

    def add_image(self, url, tile_id, alt="", bg=False):
        self.img_counter += 1
        key = "%s|%s|%d" % (self.slug, tile_id or "", self.img_counter)
        self.keys.append(key)
        ref = self.reg.request(key, normalize_img_url(url))
        return {"t": "img", "key": key, "ref": ref, "alt": alt or "", "bg": bg}

    def extract(self):
        root = self.soup.select_one("div.UtePc") or self.soup.body
        sections = []
        for sec in root.find_all("section", recursive=False):
            sid = sec.get("id", "")
            classes = " ".join(sec.get("class", []))
            banner = None
            bgel = sec.find(attrs={"style": re.compile(r"background-image")}, recursive=True)
            # banner sections: the first section with a title heading + background
            cols = []
            # direct column tiles
            tiles = sec.select("div.jXK9ad[id]")
            if not tiles:
                tiles = [sec]
            handled_bg = set()
            for tile in tiles:
                tid = tile.get("id", sid)
                blocks = self.tile_blocks(tile, tid, handled_bg)
                if blocks:
                    cols.append({"id": tid, "blocks": blocks})
            # background image of the section itself (banner / full-bleed)
            if bgel is not None and id(bgel) not in handled_bg:
                m = re.search(r"url\(['\"]?(https://[^)'\"]+)", bgel.get("style", ""))
                if m and ("LB7kq" in classes or not cols or sec.find(["h1"]) is not None):
                    banner = self.add_image(m.group(1), sid, bg=True)
            sections.append({"id": sid, "banner": banner, "cols": cols,
                             "is_title": ("LB7kq" in classes) or bool(banner)})
        title = self.soup.title.get_text(strip=True) if self.soup.title else self.slug
        return {"slug": self.slug, "title": title, "sections": sections}

    def tile_blocks(self, tile, tid, handled_bg):
        blocks = []
        # carousel / background images inside this tile
        for el in tile.find_all(attrs={"style": re.compile(r"background-image")}):
            handled_bg.add(id(el))
            m = re.search(r"url\(['\"]?(https://[^)'\"]+)", el.get("style", ""))
            if m and is_site_image(m.group(1)):
                blocks.append(self.add_image(m.group(1), tid, bg=True))
        for el in tile.find_all(list(BLOCK_TAGS)):
            # skip nested block inside list items (li handled separately)
            if el.name in ("p", "h1", "h2", "h3", "h4", "h5", "h6") and el.find_parent(["li", "table"]):
                continue
            if el.name in ("ul", "ol"):
                if el.find_parent(["ul", "ol"]):
                    continue
                items = []
                for li in el.find_all("li"):
                    h = inline_html(li)
                    if h:
                        items.append(h)
                if items:
                    blocks.append({"t": "list", "ordered": el.name == "ol", "items": items})
                continue
            if el.name == "table":
                rows = []
                for tr in el.find_all("tr"):
                    rows.append([inline_html(td) for td in tr.find_all(["td", "th"])])
                if rows:
                    blocks.append({"t": "table", "rows": rows})
                continue
            if el.name == "img":
                src = el.get("src") or el.get("data-src") or ""
                if is_site_image(src):
                    blocks.append(self.add_image(src, tid, alt=el.get("alt", "")))
                continue
            if el.name == "iframe":
                src = el.get("src", "")
                if src:
                    blocks.append({"t": "embed", "src": src})
                continue
            h = inline_html(el)
            if not html_to_text(h):
                continue
            if el.name == "p":
                blocks.append({"t": "p", "html": h})
            else:
                blocks.append({"t": "h", "level": int(el.name[1]), "html": h})
        return blocks


# --------------------------------------------------------------------------
# Image registry (stable keys → files, incremental)
# --------------------------------------------------------------------------
class ImageRegistry:
    def __init__(self, out_dir, full=False):
        self.out_dir = out_dir
        self.img_dir = os.path.join(out_dir, "assets", "img")
        self.map_path = os.path.join(out_dir, "data", "images.json")
        os.makedirs(self.img_dir, exist_ok=True)
        os.makedirs(os.path.dirname(self.map_path), exist_ok=True)
        self.full = full
        try:
            self.map = json.load(open(self.map_path, encoding="utf-8"))
        except Exception:
            self.map = {}
        self.pending = OrderedDict()   # key -> url
        self.seen_keys = set()

    def request(self, key, url):
        self.seen_keys.add(key)
        rec = self.map.get(key)
        if rec and not self.full and os.path.exists(os.path.join(self.out_dir, rec["file"])):
            rec["url"] = url
            return rec["file"]
        self.pending[key] = url
        return None  # resolved after download

    def _download_one(self, item):
        key, url = item
        b = http_get(url, timeout=90)
        ext, w, h = sniff_image(b)
        if not ext:
            # retry once with plain size
            base = url.split("=w")[0]
            b = http_get(base + "=w1280", timeout=90)
            ext, w, h = sniff_image(b)
        if not ext:
            return key, None
        sha = hashlib.sha1(b).hexdigest()[:12]
        base = os.path.join(self.out_dir, "assets", "img", sha)
        existing = [base + e for e in (".jpg", ".png", ".gif", ".webp") if os.path.exists(base + e)]
        if existing:
            fpath = existing[0]
            ow, oh = sniff_image(open(fpath, "rb").read())[1:]
            w, h = ow or w, oh or h
        else:
            fpath = "%s.%s" % (base, ext)
            with open(fpath, "wb") as f:
                f.write(b)
            if ext in ("jpg", "png"):
                fpath, nw, nh = optimize_image(fpath)
                w, h = nw or w, nh or h
        fname = os.path.relpath(fpath, self.out_dir).replace(os.sep, "/")
        return key, {"file": fname, "w": w, "h": h, "url": url, "bytes": os.path.getsize(fpath), "opt": True}

    def flush(self, workers=8):
        if not self.pending:
            return
        items = list(self.pending.items())
        self.pending.clear()
        ok = 0
        with cf.ThreadPoolExecutor(workers) as ex:
            for key, rec in ex.map(self._download_one, items):
                if rec:
                    self.map[key] = rec
                    ok += 1
                else:
                    log("   ! image failed:", key)
        log("   images: %d/%d downloaded" % (ok, len(items)))

    def optimize_existing(self):
        """One-time pass for images downloaded before optimisation existed."""
        if not HAS_PIL:
            return
        todo = [(k, r) for k, r in self.map.items() if not r.get("opt")]
        if not todo:
            return
        log("optimising %d existing images ..." % len(todo))
        done = {}
        for k, r in todo:
            src = os.path.join(self.out_dir, r["file"])
            if r["file"] in done:
                r.update(done[r["file"]]); continue
            if not os.path.exists(src):
                r["opt"] = True; continue
            out, w, h = optimize_image(src)
            upd = {"file": os.path.relpath(out, self.out_dir).replace(os.sep, "/"), "w": w or r.get("w", 0),
                   "h": h or r.get("h", 0), "bytes": os.path.getsize(out) if os.path.exists(out) else 0, "opt": True}
            done[r["file"]] = upd
            r.update(upd)
        self.save()

    def resolve(self, key):
        rec = self.map.get(key)
        return rec["file"] if rec else None

    def dims(self, key):
        rec = self.map.get(key)
        return (rec.get("w", 0), rec.get("h", 0)) if rec else (0, 0)

    def save(self):
        json.dump(self.map, open(self.map_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


# --------------------------------------------------------------------------
# Site discovery
# --------------------------------------------------------------------------
def site_prefix(site_url):
    p = urllib.parse.urlparse(site_url)
    return p.path.rstrip("/")  # e.g. /view/uksim


def discover_nav(soup, prefix):
    nav = soup.find(attrs={"role": "navigation"})
    tree, stack = [], []
    seen = set()
    if not nav:
        return tree
    for a in nav.find_all("a", href=True):
        href = a["href"]
        if not href.startswith(prefix):
            continue
        slug = href[len(prefix):].strip("/") or "home"
        if slug in seen:
            continue
        seen.add(slug)
        depth = len([p for p in a.parents if p.name == "ul"])
        node = {"title": a.get_text(" ", strip=True), "slug": slug, "children": []}
        while len(stack) >= depth:
            stack.pop()
        if stack:
            stack[-1]["children"].append(node)
        else:
            tree.append(node)
        stack.append(node)
    return tree


def flatten_nav(tree):
    out = []
    for n in tree:
        out.append(n["slug"])
        out.extend(flatten_nav(n["children"]))
    return out


# --------------------------------------------------------------------------
# Flatten page model into "lines" for the specialised parsers
# --------------------------------------------------------------------------
def page_lines(page, reg):
    lines = []
    for sec in page["sections"]:
        lines.append({"k": "sec", "sec": sec["id"], "tile": "", "text": "", "html": ""})
        if sec.get("banner"):
            b = sec["banner"]
            lines.append({"k": "img", "sec": sec["id"], "tile": "", "text": "", "html": "",
                          "file": b.get("ref") or reg.resolve(b["key"]), "bg": True, "key": b["key"]})
        for col in sec["cols"]:
            for bl in col["blocks"]:
                base = {"sec": sec["id"], "tile": col["id"]}
                if bl["t"] == "img":
                    lines.append(dict(base, k="img", text="", html="",
                                      file=bl.get("ref") or reg.resolve(bl["key"]), bg=bl.get("bg", False), key=bl["key"]))
                elif bl["t"] == "p":
                    for frag in split_br(bl["html"]):
                        lines.append(dict(base, k="p", html=frag, text=html_to_text(frag)))
                elif bl["t"] == "h":
                    for frag in split_br(bl["html"]):
                        lines.append(dict(base, k="h%d" % bl["level"], html=frag, text=html_to_text(frag)))
                elif bl["t"] == "list":
                    for it in bl["items"]:
                        for frag in split_br(it):
                            lines.append(dict(base, k="li", html=frag, text=html_to_text(frag)))
                elif bl["t"] == "embed":
                    lines.append(dict(base, k="embed", html="", text=bl["src"], src=bl["src"]))
                elif bl["t"] == "table":
                    for row in bl["rows"]:
                        lines.append(dict(base, k="p", html=" | ".join(row), text=html_to_text(" | ".join(row))))
    return lines


INLINE_TAGS = ("b", "i", "u", "sup", "sub")


def balance_tags(frag):
    """Make a fragment self-contained: drop stray closers, close unclosed inline tags
    (an unclosed <i> leaks italics into everything rendered after it)."""
    stack = []
    out = []
    for tok in re.split(r"(<[^>]+>)", frag):
        if not tok:
            continue
        m = re.match(r"^<(/?)(b|i|u|sup|sub)>$", tok)
        if not m:
            out.append(tok)
            continue
        closing, tag = m.group(1) == "/", m.group(2)
        if closing:
            if tag in stack:
                while stack:
                    tpop = stack.pop()
                    out.append("</%s>" % tpop)
                    if tpop == tag:
                        break
            # stray closer → drop
        else:
            stack.append(tag)
            out.append(tok)
    while stack:
        out.append("</%s>" % stack.pop())
    h = "".join(out)
    for tg in INLINE_TAGS:  # remove empty pairs
        h = re.sub(r"<%s>\s*</%s>" % (tg, tg), "", h)
    return h.strip()


def split_br(h):
    """Split an inline-HTML string on <br> (Shift+Enter in Google Sites) into separate,
    tag-balanced lines."""
    parts = re.split(r"(?:\s*<br\s*/?>\s*)+", h or "")
    out = []
    for p in parts:
        p = balance_tags(p)
        if html_to_text(p):
            out.append(p)
    return out


def links_in(html):
    return re.findall(r'href="([^"]+)"', html or "")


def text_lines(lines):
    return [l for l in lines if l["k"] in ("p", "li") or l["k"].startswith("h")]


# --------------------------------------------------------------------------
# Specialised parsers
# --------------------------------------------------------------------------
YEAR_RE = re.compile(r"(20\d\d|19\d\d)")


def parse_home(lines):
    d = {"banner": None, "title": "", "notice": [], "intro": [], "images": [], "email": "usim@skku.edu"}
    for l in lines:
        if l["k"] == "img" and l.get("bg") and not d["banner"]:
            d["banner"] = l["file"]
        elif l["k"] == "img" and l["file"]:
            d["images"].append(l["file"])
        elif l["k"] == "h1" and not d["title"]:
            d["title"] = l["text"]
        elif l["k"] in ("p", "li") and l["text"]:
            if re.search(r"[가-힣]", l["text"]):
                d["notice"].append(l["html"])
            else:
                d["intro"].append(l["html"])
            m = re.search(r"[\w.+-]+@[\w.-]+\.\w+", l["text"])
            if m:
                d["email"] = m.group(0)
    return d


def parse_professor(lines):
    d = {"banner": None, "photo": None, "name": "", "title": "", "affiliation": [], "bio": [],
         "education": [], "experience": [], "activities": [], "selected_pubs": [], "email": ""}
    mode = None
    cur_group = None
    saw_name = False
    for l in lines:
        k, t = l["k"], l["text"]
        if k == "img":
            if l.get("bg") and not d["banner"]:
                d["banner"] = l["file"]
            elif l["file"] and not d["photo"]:
                d["photo"] = l["file"]
            continue
        if k == "h1":
            if t.lower() == "professor" and not saw_name:
                continue
            if not d["name"]:
                d["name"] = t
                saw_name = True
            continue
        if k == "h2":
            tl = t.lower()
            if not d["title"] and "education" not in tl and "experience" not in tl and "activit" not in tl and "publication" not in tl:
                d["title"] = t
                mode = "affil"
                continue
            if "education" in tl:
                mode = "edu"
            elif "experience" in tl or "career" in tl:
                mode = "exp"
            elif "activit" in tl:
                mode = "act"
                cur_group = None
            elif "publication" in tl:
                mode = "pub"
            else:
                mode = "other"
            continue
        if not t:
            continue
        if mode == "affil":
            if len(t) > 160:
                mode = "bio"
                d["bio"].append(l["html"])
            else:
                d["affiliation"].append(l["html"])
                m = re.search(r"[\w.+-]+@[\w.-]+\.\w+", t)
                if m:
                    d["email"] = m.group(0)
        elif mode == "bio":
            d["bio"].append(l["html"])
        elif mode in ("edu", "exp"):
            m = re.match(r"^\s*((?:19|20)\d\d[\d.\s\-–~]*(?:Present|present)?)[.\s]*(.*)$", t)
            if m:
                item = {"period": m.group(1).strip(" .-–"), "text": m.group(2).strip(), "html": l["html"]}
            else:
                item = {"period": "", "text": t, "html": l["html"]}
            (d["education"] if mode == "edu" else d["experience"]).append(item)
        elif mode == "act":
            if not YEAR_RE.match(t) and len(t) < 30:
                cur_group = {"title": t, "items": []}
                d["activities"].append(cur_group)
            else:
                if cur_group is None:
                    cur_group = {"title": "", "items": []}
                    d["activities"].append(cur_group)
                m = re.match(r"^\s*((?:19|20)\d\d[\d.\s\-–~]*(?:Present|present)?)[.\s]*(.*)$", t)
                cur_group["items"].append({"period": (m.group(1).strip(" .-–") if m else ""),
                                           "text": (m.group(2).strip() if m else t), "html": l["html"]})
        elif mode == "pub":
            m = re.match(r"^\s*(\d{1,3})\s*\.\s*(.*)$", t, re.S)
            if m:
                d["selected_pubs"].append({"num": int(m.group(1)), "html": re.sub(r"^\s*\d{1,3}\s*\.\s*", "", l["html"], 1),
                                           "text": m.group(2), "cover": "cover" in t.lower()})
            elif d["selected_pubs"]:
                d["selected_pubs"][-1]["html"] += " " + l["html"]
                d["selected_pubs"][-1]["text"] += " " + t
    return d


def parse_research(lines):
    ko, en, intro, overview_imgs = [], [], [], []
    tl = [l for l in lines if l["k"] != "sec"]
    # ---- Korean topics (image-anchored) ----
    # find index of the EN region: first h3 or the "Electrochemical Energy Conversion" list
    en_start = None
    for i, l in enumerate(tl):
        if l["k"] == "h3" or (l["k"] in ("p", "li") and l["text"].startswith("Our laboratory focuses")):
            en_start = i
            break
    if en_start is None:
        en_start = len(tl)
    ko_region = tl[:en_start]
    # iterate: title lines accumulate until an image; after image, description/bullets/papers until next title
    cur = None
    pending_title = []
    for l in ko_region:
        if l["k"] == "img":
            if l.get("bg"):
                continue
            if pending_title:
                cur = {"title_ko": "", "title_en": "", "image": l["file"], "desc": [], "bullets": [], "papers": [], "papers_label": ""}
                tt = [p for p in pending_title if p]
                en_idx = next((i for i, p in enumerate(tt) if p.strip().startswith("(")), None)
                if en_idx is not None:
                    cur["title_en"] = tt[en_idx].strip().strip("()").strip()
                    cur["title_ko"] = " ".join(x.strip() for x in tt[:en_idx])
                else:
                    cur["title_ko"] = " ".join(x.strip() for x in tt)
                ko.append(cur)
                pending_title = []
            else:
                overview_imgs.append(l["file"])
            continue
        if l["k"] in ("h1",):
            continue
        t = l["text"]
        if not t:
            continue
        # is this a new title line?  (short-ish, no link, not a bullet-like sentence)
        is_paper = "href=" in l["html"] or re.search(r"\(\s*(just|Cover)", t, re.I) or re.search(r"\bAccepted\b", t)
        if cur is None:
            pending_title.append(t)
            continue
        if is_paper:
            urls = links_in(l["html"])
            cur["papers"].append({"journal": re.sub(r"\s*\(.*$", "", t).strip(), "html": l["html"],
                                  "cover": "cover" in t.lower(), "url": urls[0] if urls else ""})
            continue
        if re.search(r"(대표 논문|참고문헌)", t):
            cur["papers_label"] = t
            continue
        # decide: description / bullet / next-title
        if cur["papers"] or cur["papers_label"]:
            # after the paper list a new topic title starts
            cur = None
            pending_title.append(t)
            continue
        if not cur["desc"]:
            cur["desc"].append(l["html"])
        elif l["k"] == "li" or len(t) < 80 or cur["bullets"]:
            cur["bullets"].append(l["html"])
        else:
            cur["desc"].append(l["html"])
    # ---- English topics (h3 anchored) ----
    en_region = tl[en_start:]
    cur = None
    imgs_buf = []
    headings_list = []
    for l in en_region:
        if l["k"] == "img":
            if l.get("bg"):
                continue
            if cur and not cur["desc"]:
                cur["images"].append(l["file"])
            else:
                imgs_buf.append(l["file"])
            continue
        t = l["text"]
        if not t:
            continue
        if l["k"] == "h3":
            cur = {"title": t, "images": imgs_buf, "desc": [], "bullets": []}
            imgs_buf = []
            en.append(cur)
            continue
        if cur is None:
            if t.startswith("Our laboratory"):
                intro.append(l["html"])
            else:
                headings_list.append(t)
            continue
        if len(t) > 140 and not cur["desc"]:
            cur["desc"].append(l["html"])
        elif len(t) > 140:
            cur["desc"].append(l["html"])
        else:
            cur["bullets"].append(l["html"])
    return {"ko_topics": ko, "en_topics": en, "intro": intro, "overview_images": overview_imgs, "en_headings": headings_list}


ROLE_WORDS = re.compile(r"(Professor|Scholar|Course|Student|Staff|Researcher|Fellow|Director|Leader|Position|Intern|"
                        r"\bRA\b|Thesis|Completion|Candidate|M\.S\.|Ph\.?\s?D|B\.S\.|Visiting|Chief|Principal|Managing|"
                        r"Development|advisor|interests|Achievement|Scholarship|Publications|Patents|Main author|Co-author|"
                        r"First-Author|Co-Author|Preparations|inventions|Current|KENTECH|Sciences|University|Journal|Award|"
                        r"Grant|Fund|Funding|Program|Programme|Track|Project|Research\s+[A-C]\b|\bNRF\b|\bKIAT\b|\bKETEP\b)", re.I)
NAME_RE = re.compile(r"^(Dr\.\s+)?[A-Z][A-Za-z'\-\.]*(\s+[A-Z][A-Za-z'\-\.]*){0,4}\s*(\([^)]*\))?\s*(,\s*(M\.S\.|Ph\.D\.|Dr\.|Ph\.D))?\.?$")


def strip_order(t):
    """'62. Dr. Joon Young Kim (김준영 박사)' → (62, 'Dr. Joon Young Kim (김준영 박사)')"""
    m = re.match(r"^\s*(\d{1,3})\s*\.\s+(.*)$", t.strip(), re.S)
    if m:
        return int(m.group(1)), m.group(2).strip()
    return None, t.strip()


def looks_like_name(t):
    _, t = strip_order(t)
    if not t or len(t) > 70:
        return False
    if t[0] in "[<•0123456789(-§※":
        return False
    core = re.sub(r"\([^)]*\)", "", t)
    core = re.sub(r",\s*(M\.S\.|Ph\.D\.?|Dr\.)\s*$", "", core)
    if ROLE_WORDS.search(core):
        return False
    return bool(NAME_RE.match(t))


def parse_members(lines):
    groups = []
    cur_group = None
    cur = None
    for l in lines:
        k, t = l["k"], l["text"]
        if k == "img":
            continue
        if k == "h1":
            if t.strip().lower() == "members":
                continue
            cur_group = {"title": t, "members": []}
            groups.append(cur_group)
            cur = None
            continue
        if not t:
            continue
        if looks_like_name(t) and k in ("p", "h2", "h3", "h4"):
            if cur_group is None:
                cur_group = {"title": "Members", "members": []}
                groups.append(cur_group)
            order, tn = strip_order(t)
            tn = re.sub(r"\s+", " ", tn)
            m = re.match(r"^(?:Dr\.\s+)?([^(,]+?)\s*(\(([^)]*)\))?\s*(,\s*(M\.S\.|Ph\.D\.?))?\.?$", tn)
            name_en = m.group(1).strip() if m else tn
            paren = (m.group(3) or "").strip() if m else ""
            name_ko = paren if re.search(r"[가-힣]", paren) else ""
            cur = {"name": tn, "order": order, "name_en": name_en, "name_ko": name_ko, "nick": ("" if name_ko else paren),
                   "is_dr": tn.startswith("Dr."), "roles": [], "details": [], "stats": {},
                   "degree_suffix": (m.group(5) if m and m.group(5) else "")}
            cur_group["members"].append(cur)
            continue
        if cur is None:
            continue
        # roles: short lines directly after the name, before the first detail marker
        if not cur["details"] and len(cur["roles"]) < 5 and len(t) < 110 and not t.startswith(("[", "<", "•")) \
                and not re.match(r"^\d", t) and not re.search(r"(Main author|Co-author|First-Author|Co-Author)", t):
            cur["roles"].append(l["html"])
            continue
        # stats
        m = re.match(r"^(Main author|First-Author|Co-author|Co-Author)[^:]*:\s*(\d+)", t, re.I)
        if m:
            key = "main" if m.group(1).lower().startswith(("main", "first")) else "co"
            cur["stats"][key] = cur["stats"].get(key, 0) + int(m.group(2))
        cur["details"].append({"k": k, "html": l["html"]})
    return groups


def parse_publications(lines, cover_dois):
    items, groups = [], []
    header = ""
    cur = None
    entry_re = re.compile(r"^\s*(\d{1,3})\s*\.\s*$")
    entry_inline_re = re.compile(r"^\s*(\d{1,3})\s*\.\s+(\S.*)$", re.S)
    year_hdr_re = re.compile(r"^\s*(20\d\d)\s*\(.*\)\s*$")
    in_prep_link = ""
    for l in lines:
        k, t = l["k"], l["text"]
        if k == "img":
            if l.get("bg"):
                continue
            if cur is not None and l["file"]:
                cur["images"].append(l["file"])
            continue
        if not t:
            continue
        if k == "h1":
            continue
        m = year_hdr_re.match(t)
        if m:
            groups.append({"year": int(m.group(1)), "label": t})
            if not header:
                header = t
            cur = None
            continue
        if "sites.google.com" in l["html"] and "In prep" in t:
            in_prep_link = links_in(l["html"])[0]
            continue
        m = entry_re.match(t) or entry_inline_re.match(t)
        if m and (entry_re.match(t) or (cur is None or int(m.group(1)) < cur["num"])):
            cur = {"num": int(m.group(1)), "lines": [], "images": [], "group": (groups[-1]["year"] if groups else None)}
            items.append(cur)
            rest = m.group(2).strip() if m.re is entry_inline_re else ""
            if rest:
                cur["lines"].append({"html": re.sub(r"^\s*\d{1,3}\s*\.\s*", "", l["html"], 1), "text": rest})
            continue
        if cur is None:
            continue
        cur["lines"].append({"html": l["html"], "text": t})
    # ---- field extraction ----
    for it in items:
        L = it["lines"]
        it["authors"] = L[0]["html"] if L else ""
        title_i = next((i for i, x in enumerate(L) if x["text"].lstrip().startswith(('"', "“", "&quot;"))), None)
        it["title"] = ""
        if title_i is not None:
            th = L[title_i]["html"]
            tt = L[title_i]["text"]
            # title may continue on next line if quote not closed
            if tt.count('"') + tt.count("“") + tt.count("”") < 2 and title_i + 1 < len(L):
                nt = L[title_i + 1]["text"]
                if '"' in nt or "”" in nt:
                    th += " " + L[title_i + 1]["html"]
                    L.pop(title_i + 1)
            raw = html_to_text(th).strip()
            qm = re.match(r'^["“]\s*(.+?)\s*["”]', raw, re.S)
            it["title"] = (qm.group(1) if qm else re.sub(r"[\[(]\s*PDF\s*[\])]", "", raw).strip('"“”, ')).strip()
            it["title_html"] = th
            if title_i > 1:
                it["authors"] = " ".join(x["html"] for x in L[:title_i])
            journal_line = L[title_i + 1] if title_i + 1 < len(L) else None
        else:
            journal_line = L[1] if len(L) > 1 else None
        it["journal_html"] = journal_line["html"] if journal_line else ""
        it["journal_text"] = journal_line["text"] if journal_line else ""
        jm = re.match(r"^\s*([^,]+?)\s*,", it["journal_text"])
        it["journal"] = jm.group(1).strip() if jm else it["journal_text"][:80]
        ym = YEAR_RE.search(it["journal_text"])
        it["year"] = int(ym.group(1)) if ym else (it["group"] or 0)
        all_html = " ".join(x["html"] for x in L)
        all_text = " ".join(x["text"] for x in L)
        urls = links_in(all_html)
        it["doi"] = next((u for u in urls if "doi.org/" in u), "")
        if not it["doi"]:
            dm = re.search(r"(10\.\d{4,9}/[^\s,)]+)", all_text)
            if dm:
                it["doi"] = "https://doi.org/" + dm.group(1)
        it["pdf"] = next((u for u in urls if "drive.google.com" in u), "")
        it["links"] = [u for u in urls if u != it["doi"] and u != it["pdf"]]
        im = re.search(r"\((?:FWCI[^;]*;\s*)?Impact Factor[^)]*\)", all_text)
        it["impact"] = im.group(0).strip("()") if im else ""
        it["accepted"] = bool(re.search(r"\bAccepted\b", it["journal_text"], re.I))
        it["in_press"] = bool(re.search(r"in press", it["journal_text"], re.I))
        # publisher: short line after impact line without digits
        it["publisher"] = ""
        for i, x in enumerate(L):
            if "Impact Factor" in x["text"] and i + 1 < len(L):
                nx = L[i + 1]["text"]
                if len(nx) < 50 and not re.search(r"\d", nx) and "※" not in nx:
                    it["publisher"] = nx
                break
        # acknowledgment
        ack = []
        news = []
        notes = []
        grab = False
        for x in L:
            tx = x["text"]
            if tx.startswith("※") and "Acknowledg" in tx:
                grab = True
                continue
            if tx.startswith("※"):
                grab = False
                notes.append(x["html"])
                continue
            if grab:
                ack.append(x["html"])
                continue
            if "href=" in x["html"] and re.search(r"[가-힣]", tx) and "doi.org" not in x["html"]:
                for u in links_in(x["html"]):
                    news.append({"title": tx, "url": u})
        it["ack"] = ack
        it["notes"] = notes
        it["news"] = news
        it["cover"] = bool(it["doi"] and it["doi"].lower().replace("https://doi.org/", "") in cover_dois) \
            or bool(re.search(r"\bcover\b", all_text, re.I))
        it["extra_html"] = [x["html"] for x in L if x is not journal_line and x["html"] != it["authors"]
                            and x["html"] != it.get("title_html") and "Impact Factor" not in x["text"]
                            and x["text"] != it["publisher"] and not x["text"].startswith("※")
                            and x["html"] not in ack and x["html"] not in notes
                            and not any(n["title"] == x["text"] for n in news)]
        del it["lines"]
    return {"header": header, "groups": groups, "items": items, "in_prep_link": in_prep_link,
            "count": len(items), "max_num": max([i["num"] for i in items] or [0])}


def parse_cover(lines):
    return [l["file"] for l in lines if l["k"] == "img" and not l.get("bg") and l["file"]]


def parse_patents(lines):
    reg, app, imgs = [], [], []
    mode = "reg"
    cur = None
    num_re = re.compile(r"^\s*(\d{1,3})\s*\.\s*$")
    for l in lines:
        k, t = l["k"], l["text"]
        if k == "img":
            if not l.get("bg") and l["file"]:
                if cur is None:
                    imgs.append(l["file"])
                else:
                    cur["images"].append(l["file"])
            continue
        if not t or k == "h1":
            continue
        if re.match(r"^\s*Patent Applications?\s*$", t, re.I):
            mode = "app"
            cur = None
            continue
        m = num_re.match(t)
        if m:
            cur = {"num": int(m.group(1)), "inventors": "", "title": "", "title_html": "", "numbers": [], "images": [], "extra": []}
            (reg if mode == "reg" else app).append(cur)
            continue
        if cur is None:
            continue
        if not cur["inventors"] and not t.startswith(('"', "“")):
            cur["inventors"] = l["html"]
        elif t.startswith(('"', "“")) or (not cur["title"] and not t.startswith("KR")):
            if cur["title"]:
                cur["extra"].append(l["html"])
            cur["title"] = html_to_text(l["html"]).strip().strip('"“”,').strip()
            cur["title_html"] = l["html"]
        elif re.search(r"Patent", t, re.I):
            kind = "application" if re.search(r"Application", t, re.I) else "registered"
            mm = re.search(r"(\d{2}-\d{4}-\d+|\d{2}-\d{7}|\d{2}-\s?\d+)", t)
            dm = re.search(r"\((\d{4}[./]\s?\d{2}[./]\s?\d{2})\)", t)
            cur["numbers"].append({"kind": kind, "text": t, "html": l["html"],
                                   "number": mm.group(1) if mm else "", "date": (dm.group(1).replace(" ", "") if dm else "")})
        else:
            cur["extra"].append(l["html"])
    for p in reg:
        p["status"] = "registered"
        p["date"] = next((n["date"] for n in p["numbers"] if n["kind"] == "registered"), "")
    for p in app:
        p["status"] = "application"
        p["date"] = next((n["date"] for n in p["numbers"]), "")
    return {"registered": reg, "applications": app, "images": imgs}


def parse_presentations(lines):
    years, cur_year, cur = [], None, None
    ent_re = re.compile(r"^\s*(\d{1,3})\s*\.?\s*(\[([^\]]+)\])?\s*(.*)$", re.S)
    for l in lines:
        k, t = l["k"], l["text"]
        if k == "img" or not t or k == "h1":
            continue
        if re.match(r"^\s*(20\d\d|19\d\d)\s*$", t):
            cur_year = {"year": int(t.strip()), "items": []}
            years.append(cur_year)
            cur = None
            continue
        m = ent_re.match(t)
        if m and (m.group(2) or (cur is None) or (cur and int(m.group(1)) == cur["num"] - 1)):
            if cur_year is None:
                cur_year = {"year": 0, "items": []}
                years.append(cur_year)
            typ = (m.group(3) or "").strip()
            body_html = re.sub(r"^\s*\d{1,3}\s*\.?\s*(\[[^\]]+\])?\s*", "", l["html"], 1)
            cur = {"num": int(m.group(1)), "type": typ, "html": body_html, "text": m.group(4).strip(),
                   "invited": "invited" in typ.lower(), "year": cur_year["year"]}
            ym = re.search(r"(20\d\d|19\d\d)\s*[.\s]", m.group(4))
            cur_year["items"].append(cur)
            continue
        if cur is not None:
            cur["html"] += " " + l["html"]
            cur["text"] += " " + t
    total = sum(len(y["items"]) for y in years)
    return {"years": years, "count": total}


def parse_projects(lines):
    projects, meta = [], []
    cur = None
    sec_id = None
    mode = None
    for l in lines:
        k, t = l["k"], l["text"]
        if k == "sec":
            sec_id = l["sec"]
            cur = None
            mode = None
            continue
        if k == "img" or not t or k == "h1":
            continue
        if re.match(r"^(과제 현황|update)", t):
            meta.append(l["html"])
            continue
        if cur is None:
            cur = {"title_ko": t, "title_en": "", "meta": [], "year": "", "goal": "", "status": "", "papers": [], "patents": [], "other": []}
            projects.append(cur)
            continue
        if t.startswith("(") and not cur["title_en"]:
            cur["title_en"] = t.strip("() ")
            continue
        m = re.match(r"^\[(\d{4})\]", t)
        if m:
            cur["year"] = m.group(1)
            cur["year_note"] = t
            continue
        if t.startswith("목표"):
            cur["goal"] = t
            continue
        if t.startswith("현황"):
            cur["status"] = t
            continue
        if t.startswith("[논문]"):
            mode = "papers"
            continue
        if t.startswith("[특허]"):
            mode = "patents"
            continue
        if mode == "papers":
            cur["papers"].append(l["html"])
        elif mode == "patents":
            cur["patents"].append(l["html"])
        elif not cur["year"] and not cur["goal"]:
            cur["meta"].append(l["html"])
        else:
            cur["other"].append(l["html"])
    projects = [p for p in projects if p["title_ko"] and not p["title_ko"].startswith("[")]
    return {"meta": meta, "items": projects}


def parse_awards(lines):
    items, cur = [], None
    ent_re = re.compile(r"^\s*(\d{1,3})\s*[.\s]\s*(.*)$", re.S)
    for l in lines:
        k, t = l["k"], l["text"]
        if k == "img":
            if not l.get("bg") and l["file"] and cur is not None:
                cur["images"].append(l["file"])
            continue
        if not t or k == "h1":
            continue
        m = ent_re.match(t)
        if m and (cur is None or int(m.group(1)) < cur["num"] or int(m.group(1)) == cur["num"] - 1):
            rest = m.group(2).strip()
            ym = re.match(r"^((?:19|20)\d\d(?:\s*[-–~]\s*(?:19|20)?\d\d)?)[.,\s-]*(.*)$", rest, re.S)
            cur = {"num": int(m.group(1)), "year": (ym.group(1).replace(" ", "") if ym else ""),
                   "headline": (ym.group(2).strip() if ym else rest),
                   "headline_html": re.sub(r"^\s*\d{1,3}\s*[.\s]\s*((?:19|20)\d\d(?:\s*[-–~]\s*(?:19|20)?\d\d)?)?[.,\s-]*", "", l["html"], 1),
                   "details": [], "images": []}
            # recipient guess = text before first ',' or '.'
            rm = re.match(r"^([^,.:]+?)\s*[,.:]", cur["headline"])
            cur["recipient"] = rm.group(1).strip() if rm else ""
            items.append(cur)
            continue
        if cur is not None:
            cur["details"].append(l["html"])
    return {"items": items, "count": len(items)}


def parse_courses(lines):
    groups, cur, level = [], None, None
    for l in lines:
        k, t = l["k"], l["text"]
        if k == "img" or not t or k == "h1":
            continue
        if re.match(r"^At\s", t):
            cur = {"institution": t, "levels": []}
            groups.append(cur)
            level = None
            continue
        if cur is None:
            continue
        m = re.match(r"^\[(.+)\]$", t)
        if m:
            level = {"name": m.group(1), "courses": []}
            cur["levels"].append(level)
            continue
        if level is None:
            level = {"name": "", "courses": []}
            cur["levels"].append(level)
        level["courses"].append(t)
    return groups


def parse_program(lines):
    items, cur = [], None
    for l in lines:
        k, t = l["k"], l["text"]
        if k == "sec":
            continue
        if k == "img":
            if l.get("bg"):
                continue
            if cur is None:
                cur = {"title": "", "lines": [], "images": []}
                items.append(cur)
            cur["images"].append(l["file"])
            continue
        if not t or k == "h1":
            continue
        if re.match(r"^진행 프로그램", t):
            continue
        if cur is None or (cur["images"] and cur["lines"] and not t.startswith("#")):
            cur = {"title": t, "lines": [], "images": []}
            items.append(cur)
        elif not cur["title"]:
            cur["title"] = t
        else:
            cur["lines"].append(l["html"])
    return items


def parse_news(lines):
    d = {"latest_title": "", "latest": [], "latest_images": [], "press": [], "articles": []}
    mode = "latest"
    cur = None
    for l in lines:
        k, t = l["k"], l["text"]
        if k == "sec":
            continue
        if k == "img":
            if l.get("bg"):
                continue
            if mode == "latest":
                d["latest_images"].append(l["file"])
            elif mode == "articles":
                if cur is None or (cur["title"] and cur["images"]):
                    cur = {"title": "", "images": [], "body": [], "source": ""}
                    d["articles"].append(cur)
                cur["images"].append(l["file"])
            continue
        if not t or k == "h1":
            continue
        if re.match(r"^Press Release", t, re.I):
            mode = "press"
            continue
        if re.match(r"^NEWS$", t.strip(), re.I):
            mode = "articles"
            cur = None
            continue
        if mode == "latest":
            if re.match(r"^최신 뉴스", t):
                d["latest_title"] = t
            else:
                d["latest"].append(l["html"])
        elif mode == "press":
            m = re.match(r"^\s*(\d{4}-\d{2}-\d{2})\s*(.*)$", t, re.S)
            urls = links_in(l["html"])
            if m:
                d["press"].append({"date": m.group(1), "title": m.group(2).strip(), "url": urls[0] if urls else ""})
            elif urls:
                d["press"].append({"date": "", "title": t, "url": urls[0]})
        elif mode == "articles":
            if cur is None or (cur["title"] and cur["source"]):
                cur = {"title": "", "images": [], "body": [], "source": ""}
                d["articles"].append(cur)
            if not cur["title"]:
                cur["title"] = t
            elif t.startswith("출처") or ("href=" in l["html"] and len(t) < 120):
                urls = links_in(l["html"])
                cur["source"] = urls[0] if urls else t
            else:
                cur["body"].append(l["html"])
    d["articles"] = [a for a in d["articles"] if a["title"] or a["images"]]
    return d


def parse_research_news(lines):
    arts, cur = [], None
    for l in lines:
        k, t = l["k"], l["text"]
        if k == "sec":
            cur = None
            continue
        if k == "img":
            if l.get("bg"):
                continue
            if cur is None:
                cur = {"title": "", "subtitle": "", "images": [], "body": [], "refs": [], "source": ""}
                arts.append(cur)
            cur["images"].append(l["file"])
            continue
        if not t or k == "h1":
            continue
        if re.match(r"^Research News$", t.strip(), re.I):
            continue
        if cur is None:
            cur = {"title": "", "subtitle": "", "images": [], "body": [], "refs": [], "source": ""}
            arts.append(cur)
        if not cur["title"]:
            cur["title"] = t
        elif not cur["body"] and not cur["subtitle"] and len(t) < 60 and (t.startswith(("(", "-")) or not re.search(r"[.。]$", t)) and not t.startswith("□"):
            cur["subtitle"] = t
        elif t.startswith("출처"):
            urls = links_in(l["html"])
            cur["source"] = urls[0] if urls else re.sub(r"^출처\s*[:：]\s*", "", t)
        elif t.startswith("□") or "doi.org" in l["html"]:
            cur["refs"].append(l["html"])
        else:
            cur["body"].append(l["html"])
    return [a for a in arts if a["title"] or a["images"]]


DATE_FULL = re.compile(r"(?<![\d.])(20\d\d|\d\d)\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{1,2})(?![\d])")
DATE_YM = re.compile(r"(?<![\d.])(20\d\d)\s*[.\-/년]\s*(\d{1,2})(?:\s*월)?(?![\d.])")
DATE_Y = re.compile(r"(?<![\d.])(20\d\d)(?![\d.])")
DATE_MD = re.compile(r"(?<![\d])(\d{1,2})\s*월\s*(\d{1,2})\s*일")


def find_date(text):
    """→ (year, month, day, precision) with None for unknown parts."""
    t = text.replace("\xa0", " ")
    m = DATE_FULL.search(t)
    if m:
        y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if y < 100:
            y += 2000
        if 2000 <= y <= 2100 and 1 <= mo <= 12 and 1 <= d <= 31:
            return y, mo, d, "day"
    m = DATE_YM.search(t)
    if m:
        y, mo = int(m.group(1)), int(m.group(2))
        if 1 <= mo <= 12:
            return y, mo, None, "month"
    m = DATE_MD.search(t)
    if m:
        mo, d = int(m.group(1)), int(m.group(2))
        if 1 <= mo <= 12 and 1 <= d <= 31:
            return None, mo, d, "md"
    m = DATE_Y.search(t)
    if m:
        return int(m.group(1)), None, None, "year"
    return None


def assign_dates(posts):
    """Posts arrive in page order (newest first).  Give every post a sort key and
    a label; undated posts inherit the date of the nearest dated post above."""
    n = len(posts)
    found = []
    for p in posts:
        found.append(find_date(html_to_text(" ".join(p["caption"]))))
    keys = [None] * n
    # pass 1: explicit dates
    for i, f in enumerate(found):
        if f and f[3] == "day":
            keys[i] = (f[0], f[1], f[2])
        elif f and f[3] == "month":
            keys[i] = (f[0], f[1], 15)
    # pass 2: year-only / month-day-only / none → nearest neighbour above (else below)
    def neighbour(i):
        for j in range(i - 1, -1, -1):
            if keys[j]:
                return keys[j]
        for j in range(i + 1, n):
            if keys[j]:
                return keys[j]
        return None
    for i, f in enumerate(found):
        if keys[i]:
            continue
        nb = neighbour(i)
        if f and f[3] == "year":
            keys[i] = nb if (nb and nb[0] == f[0]) else (f[0], 12, 31)
        elif f and f[3] == "md":
            yr = nb[0] if nb else 2018
            keys[i] = (yr, f[1], f[2])
        else:
            keys[i] = nb or (2018, 1, 1)
    first_dated = next((i for i, f in enumerate(found) if f and f[3] in ("day", "month")), n)
    for i, p in enumerate(posts):
        y, mo, d = keys[i]
        f = found[i]
        if i < first_dated and not (f and f[3] in ("day", "month")):
            p["recent"] = True   # newer than the first dated post (page is newest-first)
        p["date"] = "%04d-%02d-%02d" % (y, mo, d)
        p["year"] = y
        p["month"] = mo
        if f and f[3] == "day":
            p["date_label"] = "%04d.%02d.%02d" % (y, mo, d)
        elif f and f[3] == "month":
            p["date_label"] = "%04d.%02d" % (y, mo)
        elif f and f[3] == "md":
            p["date_label"] = "%04d.%02d.%02d" % (y, mo, d)
        elif f and f[3] == "year":
            p["date_label"] = "%04d" % y
        else:
            p["date_label"] = "%04d.%02d" % (y, mo)
            p["date_inferred"] = True
        p["order"] = i
    posts.sort(key=lambda p: (p["date"], -p["order"]), reverse=True)
    return posts


def parse_neelstagram(lines):
    """One Google-Sites section (row) = one post.  A text-only row right after an
    image-only row is treated as that post's caption."""
    posts = []
    cur = None
    for l in lines:
        k = l["k"]
        if k == "sec":
            cur = {"images": [], "slides": [], "caption": [], "sec": l["sec"]}
            posts.append(cur)
            continue
        if cur is None:
            continue
        if k == "img":
            if l.get("bg") and l["tile"] == "":
                continue  # page banner (section-level background)
            if l["file"]:
                (cur["slides"] if l.get("bg") else cur["images"]).append(l["file"])
            continue
        t = l["text"]
        if not t or t.strip().lower().lstrip("#") in ("neelstagram",):
            continue
        cur["caption"].append(l["html"])
    posts = [p for p in posts if p["images"] or p["slides"] or p["caption"]]
    merged = []
    for p in posts:
        has_img = bool(p["images"] or p["slides"])
        if merged and not has_img and p["caption"] and (merged[-1]["images"] or merged[-1]["slides"]) and not merged[-1]["caption"]:
            merged[-1]["caption"].extend(p["caption"])
            continue
        merged.append(p)
    return assign_dates(merged)


# --------------------------------------------------------------------------
# main
# --------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", default="https://sites.google.com/view/uksim")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    ap.add_argument("--full", action="store_true", help="모든 이미지를 다시 다운로드")
    ap.add_argument("--workers", type=int, default=8)
    args = ap.parse_args()
    out = os.path.abspath(args.out)
    site = args.site.rstrip("/")
    prefix = site_prefix(site)
    t0 = time.time()
    log("NEEL site sync →", out)
    log("source:", site)

    reg = ImageRegistry(out, full=args.full)

    # 1) discover pages
    home_html = http_get_text(site)
    if not home_html:
        log("!! 사이트를 불러올 수 없습니다. 인터넷 연결을 확인하세요.")
        sys.exit(1)
    soup = BeautifulSoup(home_html, PARSER)
    nav = discover_nav(soup, prefix)
    slugs = flatten_nav(nav)
    if "home" not in slugs:
        slugs.insert(0, "home")
    log("nav pages:", ", ".join(slugs))

    pages = {}
    queue = list(slugs)
    done = set()
    raw_cache = {"home": home_html}
    while queue:
        slug = queue.pop(0)
        if slug in done:
            continue
        done.add(slug)
        url = site if slug == "home" else site + "/" + slug
        log("• page:", slug)
        html = raw_cache.get(slug) or http_get_text(url)
        if not html:
            continue
        psoup = BeautifulSoup(html, PARSER)
        # internal links inside content → extra pages (e.g. publicationin-prep)
        for a in psoup.select("div.UtePc a[href]"):
            h = a["href"]
            if h.startswith(prefix + "/"):
                s2 = h[len(prefix):].strip("/").split("#")[0].split("?")[0]
                if s2 and s2 not in done and s2 not in queue:
                    queue.append(s2)
        ex = PageExtractor(slug, psoup, reg)
        page = ex.extract()
        # download images NOW (signed URLs expire within a minute or two)
        reg.flush(workers=args.workers)
        # retry failures with a freshly fetched page (new signed URLs)
        full_flag = reg.full
        for attempt in range(3):
            missing = [k for k in ex.keys if reg.resolve(k) is None]
            if not missing:
                break
            log("   retry %d: %d images with fresh URLs" % (attempt + 1, len(missing)))
            html2 = http_get_text(url)
            if not html2:
                break
            reg.full = False
            ex = PageExtractor(slug, BeautifulSoup(html2, PARSER), reg)
            page = ex.extract()
            reg.flush(workers=max(4, args.workers // 2))
        reg.full = full_flag
        # resolve refs
        for sec in page["sections"]:
            if sec.get("banner") and not sec["banner"].get("ref"):
                sec["banner"]["ref"] = reg.resolve(sec["banner"]["key"])
            for col in sec["cols"]:
                for bl in col["blocks"]:
                    if bl["t"] == "img" and not bl.get("ref"):
                        bl["ref"] = reg.resolve(bl["key"])
                    if bl["t"] == "img":
                        bl["w"], bl["h"] = reg.dims(bl["key"])
        pages[slug] = page
        reg.save()

    reg.optimize_existing()
    # re-resolve refs (files may have been re-encoded to .jpg)
    for page in pages.values():
        for sec in page["sections"]:
            if sec.get("banner"):
                sec["banner"]["ref"] = reg.resolve(sec["banner"]["key"])
            for col in sec["cols"]:
                for bl in col["blocks"]:
                    if bl["t"] == "img":
                        bl["ref"] = reg.resolve(bl["key"]); bl["w"], bl["h"] = reg.dims(bl["key"])

    # 2) specialised parsing
    def L(slug):
        return page_lines(pages[slug], reg) if slug in pages else []

    data = {
        "meta": {"synced_at": datetime.now().isoformat(timespec="seconds"), "source": site,
                 "pages": list(pages.keys()), "generator": "sync_site.py"},
        "nav": nav,
        "pages": pages,
    }
    research = None
    cover_dois = set()
    try:
        research = parse_research(L("research"))
        for tpc in research["ko_topics"]:
            for p in tpc["papers"]:
                if p["cover"] and p["url"] and "doi.org/" in p["url"]:
                    cover_dois.add(p["url"].lower().split("doi.org/")[1])
        data["research"] = research
    except Exception as e:
        log("   ! research parse failed:", e)
    parsers = [
        ("home", "home", lambda: parse_home(L("home"))),
        ("professor", "professor", lambda: parse_professor(L("professor"))),
        ("members", "members", lambda: parse_members(L("members"))),
        ("publications", "publication", lambda: parse_publications(L("publication"), cover_dois)),
        ("covers", "publication/cover", lambda: parse_cover(L("publication/cover"))),
        ("patents", "patent", lambda: parse_patents(L("patent"))),
        ("presentations", "presentation", lambda: parse_presentations(L("presentation"))),
        ("projects", "project", lambda: parse_projects(L("project"))),
        ("awards", "award", lambda: parse_awards(L("award"))),
        ("courses", "course", lambda: parse_courses(L("course"))),
        ("programs", "program", lambda: parse_program(L("program"))),
        ("news", "news", lambda: parse_news(L("news"))),
        ("research_news", "news/research-news", lambda: parse_research_news(L("news/research-news"))),
        ("neelstagram", "neelstagram", lambda: parse_neelstagram(L("neelstagram"))),
    ]
    for key, slug, fn in parsers:
        if slug not in pages:
            continue
        try:
            data[key] = fn()
        except Exception as e:  # never let one parser break the sync
            import traceback
            log("   ! %s parse failed: %s" % (key, e))
            traceback.print_exc()

    # stats
    st = {}
    try:
        mx = lambda xs, d=0: max(xs) if xs else d
        st["publications"] = data["publications"]["max_num"]
        st["publications_listed"] = data["publications"]["count"]
        st["patents_registered"] = mx([p["num"] for p in data["patents"]["registered"]], len(data["patents"]["registered"]))
        st["patents_applications"] = mx([p["num"] for p in data["patents"]["applications"]], len(data["patents"]["applications"]))
        st["presentations"] = mx([i["num"] for y in data["presentations"]["years"] for i in y["items"]], data["presentations"]["count"])
        st["awards"] = mx([a["num"] for a in data["awards"]["items"]], data["awards"]["count"])
        st["covers"] = len(data.get("covers", []))
        st["projects"] = len(data["projects"]["items"])
        st["members_current"] = sum(len(g["members"]) for g in data["members"] if "alumni" not in g["title"].lower())
        st["alumni"] = sum(len(g["members"]) for g in data["members"] if "alumni" in g["title"].lower())
        st["neelstagram_posts"] = len(data["neelstagram"])
        st["research_topics"] = len(research["ko_topics"]) if research else 0
        st["images"] = len(reg.map)
    except Exception as e:
        log("   ! stats failed:", e)
    data["stats"] = st
    data["image_dims"] = {r["file"]: [r.get("w", 0), r.get("h", 0)] for r in reg.map.values() if r.get("file")}

    # 3) write
    os.makedirs(os.path.join(out, "data"), exist_ok=True)
    js = "/* generated by sync/sync_site.py — do not edit by hand (edit the Google Site, then re-run sync) */\n"
    js += "window.NEEL_DATA = " + json.dumps(data, ensure_ascii=False) + ";\n"
    with open(os.path.join(out, "data", "content.js"), "w", encoding="utf-8") as f:
        f.write(js)
    with open(os.path.join(out, "data", "content.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    reg.save()
    log("done in %.1fs" % (time.time() - t0))
    log("stats:", json.dumps(st, ensure_ascii=False))


if __name__ == "__main__":
    main()
