/* ================================================================
   NEEL Lab · app.js  (v2)
   Renders the whole site from data/content.js (mirrored from the
   Google Site by sync/sync_site.py) + data/overrides.js (design texts).
   Hash router  →  #/professor  #/publication  #/news/research-news …
   Unknown Google-Sites pages fall back to a generic block renderer,
   so new pages/sections added on Google Sites still show up here.
   ================================================================ */
(function () {
  "use strict";

  const D = window.NEEL_DATA || { pages: {}, nav: [], stats: {} };
  const OV_DEFAULT = window.NEEL_OVERRIDES || {};
  let O = mergeOverrides();
  const LOGO = "assets/img/neel-logo.svg";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const txt = (h) => String(h || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").trim();
  const yearOf = (s) => { const m = String(s || "").match(/(19|20)\d\d/); return m ? m[0] : ""; };
  const PAL = [["#a8c6ff", "#5e5ce6", "#bf5af2"], ["#ffb3e6", "#bf5af2", "#5e5ce6"], ["#b4f4c8", "#34c759", "#00c7be"], ["#fff0a6", "#ff9500", "#ff2d55"], ["#a8c6ff", "#00c7be", "#34c759"], ["#ffc3a0", "#ff2d55", "#bf5af2"], ["#c6b3ff", "#0a84ff", "#00c7be"], ["#fff0a6", "#ffb3e6", "#bf5af2"]];
  const pal = (i) => { const p = PAL[i % PAL.length]; return `--c1:${p[0]};--c2:${p[1]};--c3:${p[2]}`; };
  const DIMS = D.image_dims || {};
  const aspectOf = (file, fallback) => { const d = DIMS[file]; return d && d[0] && d[1] ? d[0] / d[1] : (fallback || 1); };

  function mergeOverrides() {
    let draft = {};
    try { draft = JSON.parse(localStorage.getItem("neel-overrides-draft") || "{}"); } catch (e) { draft = {}; }
    const out = JSON.parse(JSON.stringify(OV_DEFAULT));
    Object.keys(draft).forEach((k) => { out[k] = Object.assign({}, out[k] || {}, draft[k]); });
    return out;
  }

  /* ---------------- i18n (UI chrome only; content stays as authored) ---------------- */
  let LANG = localStorage.getItem("neel-lang") || "";
  const T = {
    ko: {
      home: "홈", professor: "교수", research: "연구", members: "구성원", publication: "논문", "publication/cover": "표지논문", patent: "특허",
      presentation: "학회발표", project: "연구과제", award: "수상", course: "강의", program: "프로그램", news: "뉴스", "news/research-news": "연구뉴스",
      neelstagram: "#NEELstagram", contact: "문의 · 지원", "publicationin-prep": "준비 중인 논문", more: "더보기", join: "지원하기",
      explore: "연구 살펴보기 →", papers: "논문 보기 →", stat_pubs: "논문", stat_pat: "특허", stat_pres: "학회 발표", stat_award: "수상",
      stat_pubs_hint: "peer-reviewed · 최신 번호 기준", stat_pat_hint: "등록 + 출원", stat_pres_hint: "국내외 학회 · 초청강연", stat_award_hint: "수상 · 장학",
      latest_news: "최신 소식", whats_new: "새로운 소식", pi: "연구책임자", meet_prof: "교수님을 소개합니다.", view_profile: "프로필 전체 보기 →",
      research_areas: "연구 분야", research_title: "연구 주제", research_lead: "전기화학 · 광화학 · 계산과학을 오가며 지속가능한 에너지 시스템의 모든 층위를 연구합니다.",
      view_all: "전체 보기 →", recent_pubs: "최근 논문", pubs_title: "논문", pub_lead: "국제 학술지에 게재된 NEEL Lab의 연구 성과입니다.",
      cover_articles: "표지 논문", covers_lead: "저널 표지로 선정된 연구들", people: "사람들", members_title: "구성원", members_lead: "우리의 연구는 한 사람 한 사람의 호기심과 협업에서 시작됩니다.",
      alumni: "동문", current: "현재 구성원", gram_lead: "살아 숨쉬는 연구실의 순간들 · 날짜순 자동 정렬", join_neel: "함께하기", cta_title: "당신의 다음 질문을,<br>함께 던져봅시다.",
      details: "자세히 →", email: "이메일", affiliation: "소속", address: "주소", google_site: "구글 사이트(원본)", search: "검색", all: "전체", invited: "초청",
      conference: "학회", registered: "등록", application: "출원", inventors: "발명자", no_results: "검색 결과가 없습니다", results: "건", year: "연도",
      cover_only: "표지 논문만", press: "언론 보도", articles: "뉴스", research_news: "연구 뉴스", read_source: "기사 원문 →", show_details: "상세 보기", hide_details: "접기",
      main_author: "주저자", co_author: "공저자", education: "학력", experience: "경력", activities: "학술 활동", selected_pubs: "대표 논문", bio: "소개",
      goal: "목표", status: "현황", papers_out: "논문", patents_out: "특허", past_projects: "이전 과제", ongoing: "진행 과제", updated: "업데이트",
      certificates: "특허증 · 증서", topics_ko: "연구 주제", topics_en: "Research Areas (English)", rep_papers: "대표 논문", posts: "게시물", photos: "사진", since: "since",
      recent: "최근", synced: "구글 사이트에서 동기화됨", source_note: "원본: Google Sites", generic_note: "이 페이지는 구글 사이트의 내용을 그대로 비춥니다.",
      in_prep: "준비 중 · 투고 중인 논문 목록 →", assistant_hello: "안녕하세요! NEEL Lab 안내 도우미입니다. 논문·구성원·수상·특허·연구주제를 검색하거나, ✨AI 모드로 자유롭게 질문해 보세요.",
      assistant_none: "관련 항목을 찾지 못했어요. 다른 키워드로 검색해 보세요. (예: 암모니아, 수전해, 2025, Cover)",
      assistant_found: "관련 항목을 찾았어요:", edit_title: "사이트 설정", edit_desc: "구글 사이트에 없는 디자인용 문구와 AI 어시스턴트 설정만 여기서 바꿉니다. 연구실 데이터(논문·구성원 등)는 구글 사이트에서 편집한 뒤 동기화하세요.",
      save_file: "파일로 저장 (data/overrides.js)", download: "다운로드", apply: "적용(미리보기)", reset: "초기화", close: "닫기", pw: "편집 비밀번호",
      saved: "저장되었습니다", downloaded: "overrides.js 를 다운로드했습니다 — data/ 폴더에 덮어쓰세요", applied: "적용되었습니다 (이 브라우저에만 임시 저장)",
      wrong_pw: "비밀번호가 틀렸습니다", pick_folder: "NEEL-Website 폴더를 선택하세요", lab_lines: "연구실", outputs: "성과", more_links: "더보기",
      ai_mode: "AI", search_mode: "검색", ai_setup: "AI 설정", ai_key: "Anthropic API 키 (이 브라우저에만 저장)", ai_endpoint: "프록시 주소 (선택 · 모두에게 AI를 열 때)",
      ai_model: "모델", ai_save: "저장", ai_test: "연결 테스트", ai_ok: "연결 성공 ✓", ai_fail: "연결 실패", ai_need: "AI 모드를 쓰려면 API 키 또는 프록시 주소를 설정하세요.",
      ai_thinking: "생각 중…", ai_related: "관련 자료", ai_save_answer: "답변 저장", ai_note: "답변은 이 홈페이지의 데이터(논문·구성원·수상·연구주제 등)를 근거로 생성됩니다.",
      ai_refused: "요청이 정책상 거절되었습니다. 다른 방식으로 질문해 주세요.", ai_pdf: "PDF 받기", ai_doi: "DOI", ai_clear: "대화 지우기",
    },
    en: {
      home: "Home", professor: "Professor", research: "Research", members: "Members", publication: "Publications", "publication/cover": "Covers", patent: "Patents",
      presentation: "Presentations", project: "Projects", award: "Awards", course: "Courses", program: "Programs", news: "News", "news/research-news": "Research News",
      neelstagram: "#NEELstagram", contact: "Contact · Join", "publicationin-prep": "In-prep papers", more: "More", join: "Join Us",
      explore: "Explore Research →", papers: "View Papers →", stat_pubs: "Publications", stat_pat: "Patents", stat_pres: "Presentations", stat_award: "Awards",
      stat_pubs_hint: "peer-reviewed · latest number", stat_pat_hint: "registered + applications", stat_pres_hint: "conferences · invited talks", stat_award_hint: "awards · scholarships",
      latest_news: "Latest News", whats_new: "What's New", pi: "Principal Investigator", meet_prof: "Meet the Professor.", view_profile: "Full profile →",
      research_areas: "Research Areas", research_title: "Research", research_lead: "Spanning electrochemistry, photochemistry and computation — every layer sustainable energy needs.",
      view_all: "View all →", recent_pubs: "Recent Papers", pubs_title: "Publications", pub_lead: "Peer-reviewed research output of NEEL Lab.",
      cover_articles: "Cover Articles", covers_lead: "Work selected for journal covers", people: "People", members_title: "Members", members_lead: "Our research begins with the curiosity and collaboration of every person here.",
      alumni: "Alumni", current: "Current members", gram_lead: "Moments from a living laboratory · sorted by date", join_neel: "Join NEEL", cta_title: "Let's ask your<br>next question together.",
      details: "Details →", email: "Email", affiliation: "Affiliation", address: "Address", google_site: "Google Site (source)", search: "Search", all: "All", invited: "Invited",
      conference: "Conference", registered: "Registered", application: "Application", inventors: "Inventors", no_results: "No results", results: "results", year: "Year",
      cover_only: "Cover articles only", press: "Press", articles: "News", research_news: "Research News", read_source: "Read source →", show_details: "Show details", hide_details: "Hide",
      main_author: "Main author", co_author: "Co-author", education: "Education", experience: "Experience", activities: "Academic Activities", selected_pubs: "Selected Publications", bio: "Biography",
      goal: "Goal", status: "Status", papers_out: "Papers", patents_out: "Patents", past_projects: "Past projects", ongoing: "Ongoing projects", updated: "updated",
      certificates: "Certificates", topics_ko: "Research Topics", topics_en: "Research Areas", rep_papers: "Representative papers", posts: "posts", photos: "photos", since: "since",
      recent: "Recent", synced: "Synced from Google Sites", source_note: "Source: Google Sites", generic_note: "This page mirrors the Google Site content as-is.",
      in_prep: "In-prep & submitted papers →", assistant_hello: "Hi! I'm the NEEL Lab guide. Search papers, members, awards, patents and topics — or switch to ✨AI mode and ask anything.",
      assistant_none: "Nothing found. Try another keyword (e.g. ammonia, electrolysis, 2025, cover).",
      assistant_found: "Here is what I found:", edit_title: "Site settings", edit_desc: "Only design texts that do not exist on the Google Site and the AI assistant settings are edited here. Lab data (papers, members…) is edited on Google Sites and then synced.",
      save_file: "Save to file (data/overrides.js)", download: "Download", apply: "Apply (preview)", reset: "Reset", close: "Close", pw: "Editor password",
      saved: "Saved", downloaded: "overrides.js downloaded — replace the one in data/", applied: "Applied (temporary, this browser only)",
      wrong_pw: "Wrong password", pick_folder: "Select the NEEL-Website folder", lab_lines: "Lab", outputs: "Outputs", more_links: "More",
      ai_mode: "AI", search_mode: "Search", ai_setup: "AI settings", ai_key: "Anthropic API key (stored in this browser only)", ai_endpoint: "Proxy URL (optional · to open AI to everyone)",
      ai_model: "Model", ai_save: "Save", ai_test: "Test connection", ai_ok: "Connected ✓", ai_fail: "Connection failed", ai_need: "Set an API key or a proxy URL to use AI mode.",
      ai_thinking: "Thinking…", ai_related: "Related items", ai_save_answer: "Save answer", ai_note: "Answers are grounded in this site's data (papers, members, awards, topics…).",
      ai_refused: "The request was declined by policy. Please rephrase.", ai_pdf: "Get PDF", ai_doi: "DOI", ai_clear: "Clear chat",
    },
  };
  const t = (k) => (T[LANG || "ko"] && T[LANG || "ko"][k] != null ? T[LANG || "ko"][k] : (T.ko[k] != null ? T.ko[k] : k));
  const L2 = (ko, en) => (LANG === "en" ? en : ko);

  /* ---------------- content translation (data/i18n.js, built by sync/i18n.py) ----------------
     The mirrored Google-Sites data keeps its original wording; on a language switch every displayed
     string is swapped for its translation (looked up by a hash of the original) and restored again. */
  const I18N = window.NEEL_I18N || { en: {}, ko: {} };
  const I18N_SKIP = new Set(["key", "ref", "file", "src", "href", "url", "doi", "pdf", "image", "images", "banner", "photo", "slides", "thumb", "id", "slug", "date", "name", "name_ko", "name_en", "nick", "title_ko", "title_en", "image_dims"]);
  const ENC = new TextEncoder(), HCACHE = new Map(), ORIG = new WeakMap();
  function hkey(s) {
    let h = HCACHE.get(s); if (h) return h;
    let x = 0x811c9dc5; for (const b of ENC.encode(String(s).replace(/\s+/g, " ").trim())) { x ^= b; x = Math.imul(x, 0x01000193) >>> 0; }
    h = x.toString(16).padStart(8, "0"); HCACHE.set(s, h); return h;
  }
  const tr = (s) => { const d = I18N[LANG === "en" ? "en" : "ko"] || {}; return (s && d[hkey(s)]) || s; };
  function applyLang() {
    const dict = I18N[LANG === "en" ? "en" : "ko"] || {};
    const swap = (o, k) => {
      let rec = ORIG.get(o); const orig = rec && k in rec ? rec[k] : o[k];
      const next = dict[hkey(orig)] || orig;
      if (next !== o[k]) { if (!rec) { rec = {}; ORIG.set(o, rec); } if (!(k in rec)) rec[k] = orig; o[k] = next; }
    };
    const walk = (o) => {
      if (Array.isArray(o)) { for (let i = 0; i < o.length; i++) { const v = o[i]; if (typeof v === "string") swap(o, i); else if (v && typeof v === "object") walk(v); } return; }
      for (const k of Object.keys(o)) { if (I18N_SKIP.has(k)) continue; const v = o[k]; if (typeof v === "string") swap(o, k); else if (v && typeof v === "object") walk(v); }
    };
    walk(D);
  }

  /* ---------------- data helpers ---------------- */
  const PUBS = (D.publications && D.publications.items) || [];
  const MEMBERS = D.members || [];
  const AWARDS = (D.awards && D.awards.items) || [];
  const PATS = D.patents || { registered: [], applications: [], images: [] };
  const PRES = (D.presentations && D.presentations.years) || [];
  const PROJ = (D.projects && D.projects.items) || [];
  const RES = D.research || { ko_topics: [], en_topics: [], intro: [], overview_images: [] };
  const NEWS = D.news || { latest: [], latest_images: [], press: [], articles: [] };
  const RNEWS = D.research_news || [];
  const GRAM = (D.neelstagram || []).slice().sort((a, b) => (b.recent ? 1 : 0) - (a.recent ? 1 : 0) || (b.date || "").localeCompare(a.date || "") || (a.order || 0) - (b.order || 0));
  const COVERS = D.covers || [];
  const PROF = D.professor || {};
  const HOME = D.home || {};
  const ST = D.stats || {};
  const currentGroups = MEMBERS.filter((g) => !/alumni/i.test(g.title));
  const alumniGroups = MEMBERS.filter((g) => /alumni/i.test(g.title));
  const pageTitle = (slug) => { const p = D.pages && D.pages[slug]; if (!p) return slug; for (const s of p.sections) for (const c of s.cols) for (const b of c.blocks) { if (b.t === "h" && b.level === 1) return txt(b.html); } return p.title || slug; };
  const hl = (s) => String(s || "").replace(/(Uk Sim|U\. Sim|Sim, U\.|Uk sim)/g, '<span class="self">$1</span>');
  const initials = (name) => name.replace(/^Dr\.\s*/, "").split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const slugify = (s) => txt(s).toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "");
  const maxNum = (arr) => arr.reduce((m, x) => Math.max(m, x.num || 0), 0);
  const stats = {
    pubs: ST.publications || maxNum(PUBS) || PUBS.length,
    patsReg: ST.patents_registered || maxNum(PATS.registered || []) || (PATS.registered || []).length,
    patsApp: ST.patents_applications || maxNum(PATS.applications || []) || (PATS.applications || []).length,
    pres: ST.presentations || PRES.reduce((a, y) => Math.max(a, maxNum(y.items)), 0),
    awards: ST.awards || maxNum(AWARDS) || AWARDS.length,
    members: ST.members_current || currentGroups.reduce((a, g) => a + g.members.length, 0),
    alumni: alumniGroups.reduce((a, g) => a + g.members.length, 0),
    covers: COVERS.length,
    gramPosts: GRAM.length,
    gramPhotos: GRAM.reduce((a, p) => a + p.images.length + p.slides.length, 0),
  };
  stats.pats = stats.patsReg + stats.patsApp;
  const GROUP_PHOTO = (HOME.images && HOME.images[0]) || HOME.banner || "";

  /* ---- professor: KO/EN aware text ---- */
  // The Google Site heading reads "Dr. Uk Sim (…)"; on this site the PI is always shown as "Prof.".
  const profName = () => { const n = String(PROF.name || "Prof. Uk Sim").replace(/^\s*Dr\.?\s+/i, "Prof. "); return LANG === "en" ? n.replace(/\s*\([^)]*[가-힣][^)]*\)\s*$/, "") : n; };
  // Member-group headings come from the Google Site in English; KO mode shows a Korean label.
  const GROUP_KO = { "research professor & postdoctoral scholars": "연구교수 · 박사후연구원", "students": "학생", "researchers & research staffs": "연구원 · 연구직원", "alumni": "졸업생" };
  const groupTitle = (s) => (LANG !== "en" && GROUP_KO[String(s || "").trim().toLowerCase()]) || s;
  const dispName = (n) => (LANG === "en" ? String(n || "").replace(/\s*\([^)]*[가-힣][^)]*\)/g, "") : n);
  const memberNames = (m) => (LANG !== "en" && m.name_ko ? [m.name_ko, m.name_en] : [m.name_en, m.name_ko || m.nick || ""]);
  const koParen = (s) => { const m = String(s || "").match(/\(([^()]*[가-힣][^()]*)\)\s*$/); return m ? m[1].trim() : ""; };
  const stripKoParen = (s) => String(s || "").replace(/\s*\(([^()]*[가-힣][^()]*)\)\s*$/, "").trim();
  const koDegree = (s) => s.replace(/Ph\.?\s?D\.?/, "박사").replace(/M\.S\./, "석사").replace(/B\.S\./, "학사");
  const perLabel = (p) => (LANG !== "en" ? String(p || "").replace(/Present/i, "현재") : String(p || ""));
  function profBio() {
    const P = O.professor || {};
    if (LANG !== "en" && P.bio_ko) { const arr = (Array.isArray(P.bio_ko) ? P.bio_ko : String(P.bio_ko).split(/\n\s*\n/)).map((x) => x.trim()).filter(Boolean); if (arr.length) return arr.map(esc); }
    return PROF.bio || [];
  }
  function profTitle() { const P = O.professor || {}; return LANG !== "en" && P.title_ko ? esc(P.title_ko) : esc(PROF.title || ""); }
  function profAffil() { const P = O.professor || {}; return LANG !== "en" && P.affiliation_ko ? esc(P.affiliation_ko) : ((PROF.affiliation || []).slice(0, 1).join("")); }
  const stripPer = (h) => h.replace(/^\s*(?:19|20)\d\d[\d.\s\-–~]*(?:Present|present)?[.\s]*/, "").replace(/^[\s.,-]+/, "");
  function tlItem(e, kind) {
    const en = e.period ? stripPer(e.html) : e.html;
    const enText = txt(en);
    const ko = koParen(enText);
    if (LANG !== "en" && ko) {
      let title = ko;
      if (kind === "edu") { const deg = (enText.match(/^(Ph\.?\s?D\.?|M\.S\.|B\.S\.)/) || [""])[0]; if (deg) title = `${ko} · ${koDegree(deg)}`; }
      return `<div class="timeline-item"><div class="timeline-date">${esc(perLabel(e.period))}</div><div class="timeline-title">${esc(title)}</div><div class="timeline-sub">${esc(stripKoParen(enText))}</div></div>`;
    }
    return `<div class="timeline-item"><div class="timeline-date">${esc(perLabel(e.period))}</div><div class="timeline-title rich">${en}</div></div>`;
  }
  /* ---- research: pick the English write-up that matches a Korean topic (EN mode) ---- */
  const STOP = new Set(["development", "research", "reaction", "reactions", "system", "systems", "high", "efficiency", "production", "design", "application", "driving", "mechanism", "next", "generation", "using", "toward", "towards", "and", "for", "the", "of", "with", "based", "materials", "material", "electrochemical", "study", "studies"]);
  const words = (str) => txt(str).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)).map((w) => w.slice(0, 7));
  function enTopicFor(tp) {
    const en = RES.en_topics || []; if (!en.length) return null;
    const tw = new Set(words(tp.title_en + " " + (tp.bullets || []).join(" ")));
    let best = null, bestS = 0;
    en.forEach((e) => { const titleW = words(e.title), bodyW = words((e.bullets || []).concat(e.desc || []).join(" ")); let sc = 0; titleW.forEach((w) => { if (tw.has(w)) sc += 2; }); bodyW.forEach((w) => { if (tw.has(w)) sc += 0.5; }); if (sc > bestS) { bestS = sc; best = e; } });
    return bestS >= 4 ? best : null;
  }
  function topicText(tp) {
    if (LANG === "en") {
      const ov = (O.research_en || {})[tp.title_en] || (O.research_en || {})[txt(tp.title_en).trim()];
      if (ov && (ov.desc || (ov.bullets && ov.bullets.length))) return { desc: ov.desc ? [esc(ov.desc)] : [], bullets: (ov.bullets || []).map(esc), en: true };
      const e = enTopicFor(tp); if (e) return { desc: e.desc || [], bullets: e.bullets || [], en: true };
    }
    return { desc: tp.desc || [], bullets: tp.bullets || [], en: false };
  }
  const aiAttr = (ref, label) => ` data-ai="${esc(ref)}" data-ai-label="${esc(String(label || "").slice(0, 70))}"`;

  /* ---------------- lightbox ---------------- */
  let LB = { list: [], i: 0, caps: [] };
  function openLightbox(list, i, caps) { LB = { list, i, caps: caps || [] }; showLb(); $("#lightbox").classList.add("show"); document.body.style.overflow = "hidden"; }
  function showLb() {
    $("#lb-img").src = LB.list[LB.i];
    $("#lb-count").textContent = (LB.i + 1) + " / " + LB.list.length;
    $("#lb-cap").textContent = LB.caps[LB.i] || "";
    $("#lb-prev").style.display = LB.list.length > 1 ? "" : "none";
    $("#lb-next").style.display = LB.list.length > 1 ? "" : "none";
  }
  function closeLb() { $("#lightbox").classList.remove("show"); document.body.style.overflow = ""; }
  function bindLightbox() {
    $("#lb-close").onclick = closeLb;
    $("#lightbox").onclick = (e) => { if (e.target.id === "lightbox") closeLb(); };
    $("#lb-prev").onclick = (e) => { e.stopPropagation(); LB.i = (LB.i - 1 + LB.list.length) % LB.list.length; showLb(); };
    $("#lb-next").onclick = (e) => { e.stopPropagation(); LB.i = (LB.i + 1) % LB.list.length; showLb(); };
    document.addEventListener("keydown", (e) => {
      if (!$("#lightbox").classList.contains("show")) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") $("#lb-prev").click();
      if (e.key === "ArrowRight") $("#lb-next").click();
    });
    document.addEventListener("click", (e) => {
      const el = e.target.closest("[data-lb]");
      if (!el) return;
      const group = el.getAttribute("data-lb");
      const all = $$(`[data-lb="${CSS.escape(group)}"]`);
      openLightbox(all.map((x) => x.getAttribute("data-src")), all.indexOf(el), all.map((x) => x.getAttribute("data-cap") || ""));
    });
  }

  /* ---------------- components ---------------- */
  const blobs = (a, b, c) => `<div class="blob ${a || "ba"}" style="width:560px;height:560px;top:-120px;left:-140px;"></div><div class="blob ${b || "bb"}" style="width:480px;height:480px;top:60px;right:-120px;"></div>${c ? `<div class="blob ${c}" style="width:420px;height:420px;bottom:-80px;left:40%;"></div>` : ""}`;
  function hero(o) {
    return `<section class="page-hero">
      ${o.photo ? `<div class="wash" style="background-image:url('${esc(o.photo)}')"></div>` : ""}
      ${blobs(o.b1, o.b2, o.b3 || "be")}<div class="grid-bg"></div>
      <div class="container">
        ${o.kicker ? `<p class="reveal kicker">${o.kicker}</p>` : ""}
        <h1 class="reveal d-1 display ink-grad">${o.title}</h1>
        ${o.lead ? `<p class="reveal d-2 lead">${o.lead}</p>` : ""}
        ${o.extra || ""}
      </div></section>`;
  }
  function secHead(kicker, title, lead, opts) {
    opts = opts || {};
    return `<div class="sec-head ${opts.center ? "center" : ""} ${opts.link ? "row" : ""}"><div>
      <p class="reveal kicker">${kicker}</p><h2 class="reveal d-1 display ink-grad">${title}</h2>${lead ? `<p class="reveal d-2 lead">${lead}</p>` : ""}</div>
      ${opts.link ? `<a href="${opts.link}" class="reveal d-2 btn btn-ghost">${opts.linkText || t("view_all")}</a>` : ""}</div>`;
  }
  function tile(src, opts) {
    opts = opts || {};
    if (!src) return `<div class="img-tile ${opts.cls || ""}" style="${pal(opts.i || 0)}"><span class="glyph">${esc(opts.glyph || "N")}</span></div>`;
    const lb = opts.lb ? ` data-lb="${esc(opts.lb)}" data-src="${esc(src)}" data-cap="${esc(opts.cap || "")}"` : "";
    return `<div class="img-tile ${opts.cls || ""} ${opts.lb ? "zoomable" : ""}" style="${pal(opts.i || 0)}"${lb}><img loading="lazy" decoding="async" src="${esc(src)}" alt="${esc(opts.alt || "")}"></div>`;
  }
  function gallery(imgs, group, opts) {
    opts = opts || {};
    if (!imgs || !imgs.length) return "";
    return `<div class="gallery ${opts.cls || ""}">${imgs.map((s, i) => `<div class="g" data-lb="${esc(group)}" data-src="${esc(s)}" data-cap="${esc((opts.caps || [])[i] || "")}"><img loading="lazy" decoding="async" src="${esc(s)}" alt=""></div>`).join("")}</div>`;
  }
  function statCards(cls) {
    const items = [
      ["#/publication", t("stat_pubs"), stats.pubs, t("stat_pubs_hint")],
      ["#/patent", t("stat_pat"), stats.pats, t("stat_pat_hint")],
      ["#/presentation", t("stat_pres"), stats.pres, t("stat_pres_hint")],
      ["#/award", t("stat_award"), stats.awards, t("stat_award_hint")],
    ];
    const keys = ["pubs", "pats", "pres", "awards"];
    return `<div class="grid grid-4 ${cls || ""}">${items.map(([h, l, v, s], i) => `<a href="${h}" class="stat-card reveal d-${i + 1}"${aiAttr("stat:" + keys[i], l)}><div class="stat-label">${l}</div><div class="stat-value ink-grad" data-count="${v}">${v}</div><div class="stat-hint">${s}</div></a>`).join("")}</div>`;
  }

  /* ---------------- generic Google-Sites block renderer ---------------- */
  function renderBlocks(page) {
    if (!page) return `<div class="empty">—</div>`;
    let html = "";
    page.sections.forEach((sec, si) => {
      if (sec.is_title) return;
      const cols = sec.cols.filter((c) => c.blocks.length);
      if (!cols.length) return;
      const n = Math.min(cols.length, 4);
      html += `<div class="gs-section reveal"><div class="gs-cols n${n}">${cols.map((c) => `<div class="gs-col rich">${c.blocks.map((b) => blockHTML(b, `${page.slug}-${si}-${c.id}`)).join("")}</div>`).join("")}</div></div>`;
    });
    return html || `<div class="empty">—</div>`;
  }
  function blockHTML(b, group) {
    switch (b.t) {
      case "h": { const l = Math.min(3, Math.max(1, b.level)); return `<h${l}>${b.html}</h${l}>`; }
      case "p": return `<p>${b.html}</p>`;
      case "list": return `<${b.ordered ? "ol" : "ul"}>${b.items.map((i) => `<li>${i}</li>`).join("")}</${b.ordered ? "ol" : "ul"}>`;
      case "img": return b.ref ? `<div class="img-tile zoomable" data-lb="${esc(group)}" data-src="${esc(b.ref)}"><img loading="lazy" decoding="async" src="${esc(b.ref)}" alt="${esc(b.alt || "")}"></div>` : "";
      case "embed": return `<div class="embed"><iframe src="${esc(b.src)}" allowfullscreen loading="lazy"></iframe></div>`;
      case "table": return `<table>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>`;
      default: return "";
    }
  }

  /* ================================================================
     PAGES
     ================================================================ */
  function pageHome() {
    const H = O.hero || {}, P = O.philosophy || {};
    const latest = PUBS[0];
    const newsCards = newsHighlights();
    return `
<section class="home-hero">
  ${blobs("ba", "bb", "bc")}<div class="blob be" style="width:380px;height:380px;top:200px;left:40%;"></div>
  <div class="container">
    <a href="#/contact" class="reveal hero-chip"><span class="pulse-dot"></span><span>${L2(H.chip_ko, H.chip_en)}</span></a>
    <h1 class="reveal d-1 display ink-grad">${L2(H.line1_ko, H.line1_en)}</h1>
    <h1 class="reveal d-2 display rainbow">${L2(H.line2_ko, H.line2_en)}</h1>
    <p class="reveal d-3 tagline">${L2(H.tagline_ko, H.tagline_en)}</p>
    <div class="reveal d-4 hero-actions"><a href="#/research" class="btn btn-pri btn-lg">${t("explore")}</a><a href="#/publication" class="btn btn-ghost btn-lg">${t("papers")}</a></div>
    <div class="hero-stats">${statCards("")}</div>
    <div class="reveal d-6 hero-frame">
      <div class="lg lg-thick refract frame shine"><div class="img">${GROUP_PHOTO ? `<img src="${esc(GROUP_PHOTO)}" alt="NEEL Lab" fetchpriority="high">` : ""}</div></div>
      ${latest ? `<div class="lg spec float" style="top:-18px;left:-22px;--r:-3deg"><div class="lbl">${L2("최신 논문", "Latest paper")}</div><div class="val ink-grad" style="font-size:16px;line-height:1.3">${esc(latest.journal)}</div><div class="sub">${latest.year} · #${latest.num}</div></div>` : ""}
      <div class="lg spec float" style="bottom:-22px;right:-18px;--r:2deg;animation-delay:-2s"><div class="lbl">${t("cover_articles")}</div><div class="val green-grad">${stats.covers}</div><div class="sub">${L2("저널 표지", "journal covers")}</div></div>
      <div class="lg spec float" style="top:44%;right:-30px;--r:4deg;animation-delay:-4s;width:160px"><div class="lbl">${t("members")}</div><div class="val blue-grad">${stats.members}</div><div class="sub">${L2("현재 구성원", "current")}</div></div>
    </div>
  </div>
</section>

<section class="sec" style="padding-top:40px">
  <div class="blob be" style="width:520px;height:520px;top:10%;left:-10%;"></div><div class="blob bd" style="width:440px;height:440px;bottom:0;right:-5%;"></div>
  <div class="container narrow" style="text-align:center">
    <p class="reveal kicker">${esc(L2(P.kicker_ko || "연구 철학", P.kicker || "Our Philosophy"))}</p>
    <p class="reveal d-1 display ink-grad" style="font-size:clamp(30px,5vw,68px);margin:16px 0 0">${L2(P.title1_ko, P.title1_en)}</p>
    <p class="reveal d-2 display" style="font-size:clamp(30px,5vw,68px);margin:4px 0 0;color:rgba(29,29,31,.34)">${L2(P.title2_ko, P.title2_en)}</p>
    <p class="reveal d-3 rich" style="margin:40px auto 0;font-size:17px;line-height:1.75;color:var(--ink-2);max-width:760px">${LANG === "en" ? (HOME.intro || []).join(" ") : esc(P.body_ko || "")}</p>
  </div>
</section>

${newsCards.length ? `<section class="sec tight">
  <div class="blob bd" style="width:480px;height:480px;top:10%;right:-8%;"></div>
  <div class="container">
    ${secHead(t("latest_news"), t("whats_new"), "", { link: "#/news" })}
    <div class="album-wrap reveal"><div class="album-container" id="album"></div>
      <div class="album-nav"><button class="album-nav-btn" id="album-prev">‹</button><div class="album-dots" id="album-dots"></div><button class="album-nav-btn" id="album-next">›</button></div></div>
  </div></section>` : ""}

<section class="sec alt">
  <div class="blob ba" style="width:520px;height:520px;top:5%;right:-10%;"></div><div class="blob bc" style="width:420px;height:420px;bottom:10%;left:-5%;"></div>
  <div class="container">
    ${secHead(t("pi"), t("meet_prof"))}
    <div class="split even">
      <div class="reveal"><div class="lg lg-thick refract prof-photo lift" style="max-width:440px"${aiAttr("professor:0", profName())}>${tile(PROF.photo, { cls: "portrait", glyph: "US", alt: "Prof. Uk Sim", lb: "prof" })}
        <div style="padding:18px 10px 8px"><h3 class="subhead" style="font-size:24px;margin:0">${esc(profName())}</h3><p class="muted small" style="margin:4px 0 0">${profTitle()} · ${L2((O.contact || {}).affiliation_ko, (O.contact || {}).affiliation_en)}</p><p class="small" style="margin:6px 0 0"><a href="mailto:${esc(PROF.email || (O.contact || {}).email)}" style="color:var(--blue)">${esc(PROF.email || (O.contact || {}).email)}</a></p></div></div></div>
      <div>
        <div class="reveal d-1 lg card flat rich" style="padding:30px"><p style="margin:0;font-size:16px;line-height:1.75;color:var(--ink-2)">${profBio().slice(0, 2).join("</p><p style='margin:12px 0 0;font-size:16px;line-height:1.75;color:var(--ink-2)'>")}</p></div>
        <div class="grid grid-2" style="margin-top:16px">
          <div class="reveal d-2 lg card flat"><p class="kicker" style="margin:0 0 10px">${t("education")}</p>${(PROF.education || []).map((e) => { const ko = koParen(e.text); const deg = (e.text.match(/^(Ph\.?\s?D\.?|M\.S\.|B\.S\.)/) || [""])[0]; return `<div class="small" style="margin:0 0 8px;line-height:1.5"><span class="mono" style="color:var(--blue);font-size:11px;font-weight:700">${esc(e.period)}</span><br>${LANG !== "en" && ko ? `${esc(ko)}<span class="muted"> · ${esc(koDegree(deg))}</span>` : `${esc(e.text.split(",")[0])}<span class="muted"> · ${esc(stripKoParen(e.text.split(",").slice(1, 3).join(",")))}</span>`}</div>`; }).join("")}</div>
          <div class="reveal d-3 lg card flat"><p class="kicker" style="margin:0 0 10px">${t("experience")}</p>${(PROF.experience || []).slice(0, 5).map((e) => { const ko = koParen(e.text); const en = e.text.replace(/^\s*(?:Present|present)?[.\s]*/, ""); return `<div class="small" style="margin:0 0 8px;line-height:1.5"><span class="mono" style="color:var(--blue);font-size:11px;font-weight:700">${esc(perLabel(e.period))}</span><br>${LANG !== "en" && ko ? esc(ko) : esc(stripKoParen(en))}</div>`; }).join("")}</div>
        </div>
        <div style="margin-top:18px"><a href="#/professor" class="reveal d-4 link-arrow">${t("view_profile")}</a></div>
      </div>
    </div>
  </div>
</section>

<section class="sec">
  <div class="blob bc" style="width:480px;height:480px;top:10%;left:-5%;"></div><div class="blob bb" style="width:480px;height:480px;bottom:5%;right:-5%;"></div>
  <div class="container">
    ${secHead(t("research_areas"), `${RES.ko_topics.length}${L2("개의 연구 주제,<br>하나의 목표.", " topics,<br>one goal.")}`, t("research_lead"), { link: "#/research" })}
    <div class="grid grid-3">${RES.ko_topics.slice(0, 6).map((tp, i) => researchCard(tp, i)).join("")}</div>
  </div>
</section>

<section class="sec alt">
  <div class="blob be" style="width:480px;height:480px;top:-5%;right:-10%;"></div><div class="blob ba" style="width:420px;height:420px;bottom:5%;left:-5%;"></div>
  <div class="container">
    ${secHead(t("recent_pubs"), L2("최근 논문", "Latest publications."), "", { link: "#/publication", linkText: `${t("all")} ${stats.pubs} →` })}
    <div class="lg reveal d-2 pub-list" style="padding:6px 22px">${PUBS.slice(0, 6).map((p) => pubRow(p, true)).join("")}</div>
  </div>
</section>

${COVERS.length ? `<section class="sec tight" style="padding-top:64px">
  <div class="container">${secHead(t("cover_articles"), L2("표지를 장식한 연구.", "On the cover."), "", { link: "#/publication/cover" })}</div>
  <div style="overflow:hidden;padding:10px 0 20px"><div class="marquee-track">${COVERS.concat(COVERS).map((c) => `<div class="g" data-lb="covers-home" data-src="${esc(c)}" style="width:170px;aspect-ratio:3/4;border-radius:12px;overflow:hidden;flex-shrink:0;box-shadow:0 12px 30px -12px rgba(15,23,42,.35);cursor:zoom-in;background:#fff"><img loading="lazy" decoding="async" src="${esc(c)}" alt="cover"></div>`).join("")}</div></div>
</section>` : ""}

<section class="sec">
  <div class="blob bd" style="width:520px;height:520px;top:5%;left:-10%;"></div><div class="blob be" style="width:440px;height:440px;bottom:10%;right:-5%;"></div>
  <div class="container">
    ${secHead(t("people"), L2("사람이 곧 연구입니다.", "People are the research."), "", { link: "#/members" })}
    <div class="grid grid-4" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${currentGroups.flatMap((g) => g.members).map((m, i) => memberMini(m, i)).join("")}</div>
  </div>
</section>

${GRAM.length ? `<section class="sec alt">
  <div class="blob bb" style="width:520px;height:520px;top:5%;right:-10%;"></div>
  <div class="container">
    ${secHead("#NEELstagram", L2("살아 숨쉬는 연구실.", "A living laboratory."), t("gram_lead"), { link: "#/neelstagram" })}
    ${gallery(GRAM.flatMap((p) => p.images.concat(p.slides)).slice(0, 12), "gram-home", { cls: "cols-6" })}
  </div></section>` : ""}

${contactCTA()}`;
  }

  function newsHighlights() {
    const cards = [];
    (NEWS.latest || []).forEach((cap, i) => { const img = NEWS.latest_images[i * 2] || NEWS.latest_images[i]; if (img) cards.push({ tag: L2("하이라이트", "HIGHLIGHT"), title: txt(cap), img, date: yearOf(cap), href: "#/news" }); });
    (NEWS.articles || []).forEach((a, i) => { if (a.images[0]) cards.push({ tag: L2("뉴스", "NEWS"), title: a.title, img: a.images[0], date: "", href: "#/news#news-" + i }); });
    RNEWS.slice(0, 4).forEach((a, i) => { if (a.images[0]) cards.push({ tag: L2("연구 성과", "RESEARCH"), title: a.title, img: a.images[0], date: "", href: "#/news/research-news#rn-" + i }); });
    return cards.slice(0, 8);
  }
  function mountAlbum() {
    const wrap = $("#album"); if (!wrap) return;
    const cards = newsHighlights(); let cur = 0;
    wrap.innerHTML = cards.map((c, i) => `<div class="album-card" data-i="${i}" style="${pal(i)}"><div class="ph"><img loading="lazy" decoding="async" src="${esc(c.img)}" alt=""></div><div class="txt"><span class="album-tag">${esc(c.tag)}</span><h3 class="album-title">${esc(c.title)}</h3>${c.date ? `<p class="album-date">${esc(c.date)}</p>` : ""}</div></div>`).join("");
    $("#album-dots").innerHTML = cards.map((_, i) => `<i data-i="${i}"></i>`).join("");
    const els = $$(".album-card", wrap);
    function upd() {
      els.forEach((el, i) => { el.classList.remove("center", "left", "right"); const r = (i - cur + cards.length) % cards.length; if (r === 0) el.classList.add("center"); else if (r === 1) el.classList.add("right"); else if (r === cards.length - 1) el.classList.add("left"); });
      $$("#album-dots i").forEach((d, i) => d.classList.toggle("on", i === cur));
    }
    els.forEach((el, i) => el.addEventListener("click", () => { if (i === cur) location.hash = cards[i].href; else { cur = i; upd(); } }));
    $("#album-prev").onclick = () => { cur = (cur - 1 + cards.length) % cards.length; upd(); };
    $("#album-next").onclick = () => { cur = (cur + 1) % cards.length; upd(); };
    $$("#album-dots i").forEach((d) => d.onclick = () => { cur = +d.dataset.i; upd(); });
    upd();
  }
  function researchCard(tp, i) {
    const tags = (tp.papers || []).slice(0, 3).map((p) => p.journal).filter(Boolean);
    const tx = topicText(tp);
    return `<a href="#/research#topic-${i + 1}" class="rc reveal d-${(i % 3) + 1}"${aiAttr("research:" + i, LANG === "en" ? tp.title_en : tp.title_ko)}>${tile(tp.image, { i, glyph: String(i + 1).padStart(2, "0"), alt: tp.title_en })}
      <div class="rc-num">${String(i + 1).padStart(2, "0")}${tp.papers && tp.papers.some((p) => p.cover) ? ' · <span style="color:#d48800">★ cover</span>' : ""}</div>
      <div class="rc-title">${esc(LANG === "en" && tp.title_en ? tp.title_en : tp.title_ko)}</div>
      ${LANG === "en" ? "" : `<div class="rc-sub">${esc(tp.title_en)}</div>`}
      <div class="rc-desc rich">${(tx.desc || [])[0] || ""}</div>
      <div class="rc-tags">${tags.map((x) => `<span class="rc-tag">${esc(x)}</span>`).join("")}</div></a>`;
  }
  function memberMini(m, i) {
    return `<a href="#/members#mem-${slugify(m.name_en)}" class="lg card reveal d-${(i % 6) + 1}" style="padding:16px;text-align:center"><div class="mem-avatar" style="${pal(i)};width:64px;height:64px;font-size:20px;margin:0 auto 10px">${esc(initials(m.name_en))}</div><div class="mem-name" style="font-size:14px">${esc(memberNames(m)[0])}</div><div class="mem-ko" style="font-size:12px">${esc(memberNames(m)[1])}</div><div class="mem-role" style="font-size:9.5px;margin-top:6px">${txt((m.roles || [])[0] || "")}</div></a>`;
  }
  function contactCTA() {
    const C = O.contact || {};
    return `<section class="sec">
  <div class="blob bb" style="width:520px;height:520px;top:-10%;right:-5%;"></div><div class="blob be" style="width:480px;height:480px;bottom:-20%;left:-5%;"></div>
  <div class="container"><div class="lg lg-thick refract cta-box reveal shine" id="contact">
    <p class="kicker">${t("join_neel")}</p><h2 class="display ink-grad">${t("cta_title")}</h2>
    <div class="notice rich">${(HOME.notice || []).join("<br>")}</div>
    <div class="hero-actions"><a href="mailto:${esc(C.email)}" class="btn btn-pri btn-lg">✉ ${esc(C.email)}</a><a href="${esc(C.google_site)}" target="_blank" rel="noopener" class="btn btn-ghost btn-lg">${t("google_site")} ↗</a></div>
    <div class="info-grid">
      <div class="lg"><div class="lbl">${t("affiliation")}</div><div class="val">${L2(C.affiliation_ko, C.affiliation_en)}<br><a href="${esc(C.saint)}" target="_blank" rel="noopener" style="color:var(--blue)">saint.skku.edu ↗</a></div></div>
      <div class="lg"><div class="lbl">${t("email")}</div><div class="val"><a href="mailto:${esc(C.email)}" style="color:var(--blue)">${esc(C.email)}</a><br><span class="muted small">${L2("연구원 · 대학원생 지원 문의", "Researcher / graduate applications")}</span></div></div>
      <div class="lg"><div class="lbl">${t("address")}</div><div class="val">${L2(C.address_ko, C.address_en)}</div></div>
    </div>
  </div></div></section>`;
  }

  /* ---------- Professor ---------- */
  function pageProfessor() {
    const C = O.contact || {};
    const tl = (arr, kind) => `<div class="timeline">${arr.map((e) => tlItem(e, kind)).join("")}</div>`;
    return hero({ kicker: t("pi"), title: esc(profName()), lead: `${profTitle()}<br>${profAffil()}`, b1: "ba", b2: "bb" }) + `
<section class="sec tight" style="padding-top:20px">
  <div class="container"><div class="split">
    <div class="sticky reveal"><div class="lg lg-thick refract prof-photo"${aiAttr("professor:0", profName())}>${tile(PROF.photo, { cls: "portrait", glyph: "US", alt: "Prof. Uk Sim", lb: "prof" })}
      <div style="padding:18px 10px 8px"><h3 class="subhead" style="font-size:22px;margin:0">${esc(profName())}</h3><p class="muted small rich" style="margin:6px 0 0;line-height:1.55">${LANG !== "en" && (O.professor || {}).affiliation_ko ? `${profTitle()}<br>${profAffil()}<br>${(PROF.affiliation || []).slice(1).join("<br>")}` : (PROF.affiliation || []).join("<br>")}</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding:6px 10px 10px"><a href="mailto:${esc(PROF.email || C.email)}" class="btn btn-pri btn-sm">✉ ${esc(PROF.email || C.email)}</a><a href="#/publication" class="btn btn-ghost btn-sm">${t("publication")}</a></div></div></div>
    <div>
      <div class="reveal d-1"><p class="kicker">${t("bio")}</p>${profBio().map((b) => `<p class="rich" style="font-size:16px;line-height:1.75;color:var(--ink-2);margin:10px 0">${b}</p>`).join("")}${LANG !== "en" && (O.professor || {}).bio_ko ? `<details class="bio-en"><summary>English</summary>${(PROF.bio || []).map((b) => `<p class="rich small muted" style="line-height:1.7;margin:8px 0">${b}</p>`).join("")}</details>` : ""}</div>
      <div class="divider"></div>
      <div class="grid grid-2">
        <div class="reveal lg card flat"><p class="kicker" style="margin:0 0 16px">${t("education")}</p>${tl(PROF.education || [], "edu")}</div>
        <div class="reveal d-1 lg card flat"><p class="kicker" style="margin:0 0 16px">${t("experience")}</p>${tl(PROF.experience || [], "exp")}</div>
      </div>
      <div class="divider"></div>
      <p class="reveal kicker" style="margin:0 0 18px">${t("activities")}</p>
      <div class="grid grid-2">${(PROF.activities || []).map((g, i) => `<div class="reveal d-${i + 1} act-group"><h4>${esc(g.title || "")}</h4><ul>${g.items.map((it) => `<li><span class="per">${esc(perLabel(it.period))}</span><span class="rich">${it.period ? stripPer(it.html) : it.html}</span></li>`).join("")}</ul></div>`).join("")}</div>
      <div class="divider"></div>
      <p class="reveal kicker" style="margin:0 0 18px">${t("selected_pubs")} · ${(PROF.selected_pubs || []).length}</p>
      <div class="lg pub-list reveal" style="padding:4px 22px">${(PROF.selected_pubs || []).map((p) => `<div class="pub-row"><div class="pub-num">${String(p.num).padStart(2, "0")}</div><div class="pub-body"><div class="rich" style="font-size:13.5px;line-height:1.6;color:var(--ink-2)">${hl(p.html)}</div>${p.cover ? `<div style="margin-top:6px"><span class="tag gold">★ Cover</span></div>` : ""}</div></div>`).join("")}</div>
    </div>
  </div></div>
</section>
<section class="sec"><div class="blob bb" style="width:520px;height:520px;top:10%;left:10%;"></div><div class="blob be" style="width:420px;height:420px;bottom:0;right:10%;"></div>
  <div class="container quote-block"><p class="reveal q display ink-grad">${L2("“ 재생 가능한 에너지는 소재에서 시작해,<br>원자 수준의 이해로 완성됩니다. ”", "“ Renewable energy begins with materials<br>and is completed through atomic-level understanding. ”")}</p><p class="reveal d-1 kicker" style="margin-top:24px">${L2("— 심욱 교수", "— Prof. Uk Sim")}</p></div></section>`;
  }

  /* ---------- Research ---------- */
  function pageResearch() {
    const ko = RES.ko_topics || [], en = RES.en_topics || [];
    return hero({ kicker: t("research_areas"), title: `${ko.length} ${L2("개의 연구 주제.", "Research Topics.")}`, lead: t("research_lead"), photo: RES.overview_images && RES.overview_images[0], b1: "bc", b2: "ba" }) + `
<section class="sec tight"><div class="container">
  ${RES.intro && RES.intro.length ? `<div class="lg card flat reveal rich" style="max-width:900px;margin:0 auto 40px;padding:28px;font-size:15.5px;line-height:1.75;color:var(--ink-2)">${LANG !== "en" && (O.philosophy || {}).body_ko ? `${esc(O.philosophy.body_ko)}<details class="bio-en"><summary>English</summary><p class="small muted" style="line-height:1.7;margin:8px 0 0">${RES.intro.join("<br><br>")}</p></details>` : RES.intro.join("<br><br>")}</div>` : ""}
  ${RES.overview_images && RES.overview_images[0] ? `<div class="reveal lg lg-thick refract" style="padding:10px;border-radius:30px;max-width:1000px;margin:0 auto 48px">${tile(RES.overview_images[0], { cls: "auto contain", lb: "res-ov" })}</div>` : ""}
  <div class="grid grid-3">${ko.map((tp, i) => researchCard(tp, i)).join("")}</div>
</div></section>
<section class="sec alt"><div class="container">
  <p class="reveal kicker" style="margin:0 0 14px">${t("topics_ko")}</p><h2 class="reveal d-1 display" style="font-size:clamp(30px,4vw,48px);margin:0 0 48px">${L2("세부 연구 내용", "Detailed topics")}</h2>
  ${ko.map((tp, i) => { const tx = topicText(tp); return `<div class="topic-detail reveal ${i % 2 ? "flip" : ""}" id="topic-${i + 1}"${aiAttr("research:" + i, LANG === "en" ? tp.title_en : tp.title_ko)}>
     <div class="img-side">${tile(tp.image, { cls: "auto contain", i, glyph: String(i + 1).padStart(2, "0"), lb: "topic-" + i, cap: tp.title_en })}</div>
     <div><div class="rc-num">${String(i + 1).padStart(2, "0")} / ${ko.length}</div><h3 class="display">${esc(LANG === "en" && tp.title_en ? tp.title_en : tp.title_ko)}</h3>${LANG === "en" ? "" : `<div class="en">${esc(tp.title_en)}</div>`}
       ${(tx.desc || []).map((d) => `<p class="desc rich">${d}</p>`).join("")}
       ${tx.bullets && tx.bullets.length ? `<ul class="bul">${tx.bullets.map((b) => `<li class="rich">${b}</li>`).join("")}</ul>` : ""}
       ${tp.papers && tp.papers.length ? `<p class="kicker" style="margin:18px 0 0;font-size:10px">${LANG === "en" ? t("rep_papers") : esc(tp.papers_label || t("rep_papers"))}</p><div class="paper-links">${tp.papers.map((p) => `<a href="${esc(p.url || "#")}" target="_blank" rel="noopener" class="${p.cover ? "cover" : ""}" title="${esc(txt(p.html))}">${esc(p.journal)}</a>`).join("")}</div>` : ""}
     </div></div>`; }).join("")}
</div></section>
${en.length && LANG === "en" ? `<section class="sec"><div class="container">
  <p class="reveal kicker" style="margin:0 0 14px">${t("topics_en")}</p><h2 class="reveal d-1 display" style="font-size:clamp(30px,4vw,48px);margin:0 0 40px">Research Areas</h2>
  <div class="grid grid-2">${en.map((tp, i) => `<div class="lg card flat reveal d-${(i % 2) + 1}" id="en-topic-${i + 1}">
     ${tp.images && tp.images.length ? `<div class="gallery cols-3" style="margin-bottom:16px;grid-template-columns:repeat(${Math.min(2, tp.images.length)},1fr)">${tp.images.map((s) => `<div class="g" style="aspect-ratio:16/10" data-lb="en-${i}" data-src="${esc(s)}"><img loading="lazy" decoding="async" src="${esc(s)}" alt=""></div>`).join("")}</div>` : ""}
     <h3 class="subhead" style="font-size:21px;margin:0 0 10px">${esc(tp.title)}</h3>${(tp.desc || []).map((d) => `<p class="rich small" style="color:var(--ink-2);line-height:1.7;margin:0 0 8px">${d}</p>`).join("")}
     ${tp.bullets && tp.bullets.length ? `<ul class="bul">${tp.bullets.map((b) => `<li class="rich">${b}</li>`).join("")}</ul>` : ""}</div>`).join("")}</div>
</div></section>` : ""}`;
  }

  /* ---------- Members ---------- */
  function pageMembers() {
    let html = hero({ kicker: t("people"), title: `${t("members_title")}.`, lead: t("members_lead"), photo: GROUP_PHOTO, b1: "bc", b2: "bb" });
    html += `<section class="sec tight"><div class="container"><div class="chips hscroll reveal" style="justify-content:center;margin-bottom:40px">${MEMBERS.map((g) => `<a href="#g-${slugify(g.title)}" class="chip">${esc(groupTitle(g.title))} · ${g.members.length}</a>`).join("")}</div>`;
    currentGroups.forEach((g, gi) => {
      html += `<div id="g-${slugify(g.title)}" style="margin-bottom:64px;scroll-margin-top:80px">
        <div class="sec-head row" style="margin-bottom:22px"><h2 class="reveal display" style="font-size:clamp(24px,3.4vw,38px);margin:0">${esc(groupTitle(g.title))}</h2><span class="mono muted small">${String(g.members.length).padStart(2, "0")}</span></div>
        <div class="grid grid-4" data-group="${gi}">${g.members.map((m, i) => memberCard(m, i, `${gi}-${i}`)).join("")}</div></div>`;
    });
    alumniGroups.forEach((g, gi) => {
      html += `<div id="g-${slugify(g.title)}" style="margin-bottom:64px;scroll-margin-top:80px">
        <div class="sec-head row" style="margin-bottom:12px"><h2 class="reveal display" style="font-size:clamp(24px,3.4vw,38px);margin:0">${esc(groupTitle(g.title))}</h2><span class="mono muted small">${g.members.length}</span></div>
        <div class="lg reveal" style="padding:6px 22px">${g.members.map((m, i) => `<div class="alumni-row" data-toggle="al-${gi}-${i}" id="mem-${slugify(m.name_en)}"${aiAttr("member:" + slugify(m.name_en), m.name_en)}><div class="mem-avatar" style="${pal(i)}">${esc(initials(m.name_en))}</div><div style="flex:1;min-width:0"><div class="nm">${m.order ? `<span class="mono muted" style="font-size:11px;margin-right:8px">${m.order}</span>` : ""}${esc(dispName(m.name))}</div><div class="rl rich">${(m.roles || []).join(" · ")}</div><div class="detail-panel lg hidden" id="al-${gi}-${i}" style="margin-top:14px;padding:20px">${memberDetails(m)}</div></div><span class="mem-more">${m.details.length ? "▾" : ""}</span></div>`).join("")}</div></div>`;
    });
    html += `</div></section>`;
    return html;
  }
  function memberCard(m, i, id) {
    const st = m.stats || {};
    const isTopic = (r) => /interests|position|advisor|thesis/i.test(txt(r));
    const roleLines = (m.roles || []).filter((r) => !isTopic(r)), topicLines = (m.roles || []).filter(isTopic);
    return `<div class="lg card mem-card reveal d-${(i % 4) + 1}" data-toggle="mem-${id}" id="mem-${slugify(m.name_en)}"${aiAttr("member:" + slugify(m.name_en), m.name_en)}><div class="mem-avatar" style="${pal(i)}">${esc(initials(m.name_en))}</div>
      <div><div class="mem-name">${esc(memberNames(m)[0])}</div><div class="mem-ko">${esc(memberNames(m)[1])}</div></div>
      <div class="mem-role rich">${roleLines.slice(0, 2).join("<br>")}</div>
      ${roleLines.slice(2).concat(topicLines).length ? `<div class="mem-topic rich">${roleLines.slice(2).concat(topicLines).join("<br>")}</div>` : ""}
      ${st.main != null || st.co != null ? `<div class="mem-stats">${st.main != null ? `<span class="tag">${t("main_author")} ${st.main}</span>` : ""}${st.co != null ? `<span class="tag gray">${t("co_author")} ${st.co}</span>` : ""}</div>` : ""}
      ${m.details && m.details.length ? `<span class="mem-more">${t("show_details")} ▾</span>` : ""}</div>
      <div class="detail-panel lg hidden" id="mem-${id}">${memberDetails(m)}</div>`;
  }
  function memberDetails(m) {
    if (!m.details || !m.details.length) return `<div class="muted small">—</div>`;
    return `<div class="rich">${m.details.map((d) => {
      const tx = txt(d.html);
      if (/^\[.*\]$/.test(tx) || /^<.*>$/.test(tx)) return `<span class="lbl">${esc(tx.replace(/^[\[<]|[\]>]$/g, ""))}</span><br>`;
      if (d.k === "li") return `<li>${hl(d.html)}</li>`;
      if (d.k.startsWith("h")) return `<span class="lbl">${d.html}</span><br>`;
      return `<p>${hl(d.html)}</p>`;
    }).join("")}</div>`;
  }

  /* ---------- Publications ---------- */
  function pubRow(p, compact) {
    const link = p.doi || (p.links && p.links[0]) || "";
    const thumbs = p.images && p.images.length ? `<div class="pub-thumbs">${p.images.slice(0, 2).map((s) => `<div class="g" data-lb="pub-${p.num}" data-src="${esc(s)}" data-cap="#${p.num} ${esc(p.title)}"><img loading="lazy" decoding="async" src="${esc(s)}" alt=""></div>`).join("")}</div>` : "";
    return `<div class="pub-row" id="pub-${p.num}"${aiAttr("pub:" + p.num, "#" + p.num + " " + (p.title || p.journal))}><div class="pub-num">#${String(p.num).padStart(3, "0")}</div><div class="pub-body">
      <div class="pub-title">${link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${esc(p.title || txt(p.journal_html))}</a>` : esc(p.title || txt(p.journal_html))}${p.cover ? ` <span class="tag gold">★ Cover</span>` : ""}${p.accepted ? ` <span class="tag green">Accepted</span>` : ""}</div>
      <div class="pub-authors rich">${hl(p.authors)}</div>
      <div class="pub-meta"><span class="journal">${esc(p.journal)}</span><span class="year">${p.year || ""}</span>${p.impact ? `<span>${esc(p.impact)}</span>` : ""}${p.publisher ? `<span>${esc(p.publisher)}</span>` : ""}${p.doi ? `<a href="${esc(p.doi)}" target="_blank" rel="noopener">DOI</a>` : ""}${p.pdf ? `<a href="${esc(p.pdf)}" target="_blank" rel="noopener">PDF</a>` : ""}${(p.links || []).filter((u) => !/doi\.org|drive\.google/.test(u) && !(p.news || []).some((n) => n.url === u)).slice(0, 1).map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener">Link</a>`).join("")}</div>
      ${!compact && ((p.ack && p.ack.length) || (p.notes && p.notes.length)) ? `<div class="pub-extra">${p.notes && p.notes.length ? `<div class="rich">${p.notes.join("<br>")}</div>` : ""}${p.ack && p.ack.length ? `<div><span class="lbl">Acknowledgment</span><span class="rich">${p.ack.join(" ")}</span></div>` : ""}</div>` : ""}
      ${!compact && p.news && p.news.length ? `<div class="pub-news">${p.news.map((n) => `<a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.title)}</a>`).join("")}</div>` : ""}
    </div>${thumbs}</div>`;
  }
  function pagePublication() {
    const years = Array.from(new Set(PUBS.map((p) => p.year).filter(Boolean))).sort((a, b) => b - a);
    const hdr = (D.publications && D.publications.header) || "";
    const inprep = D.publications && D.publications.in_prep_link ? (D.pages["publicationin-prep"] ? "#/publicationin-prep" : D.publications.in_prep_link) : "";
    return hero({ kicker: t("pubs_title"), title: `${stats.pubs} ${L2("편의 논문.", "Papers.")}`, lead: `${esc(hdr)}${inprep ? `<br><a href="${esc(inprep)}" class="link-arrow" style="margin-top:8px">${t("in_prep")}</a>` : ""}`, b1: "ba", b2: "be" }) + `
<section class="sec tight"><div class="container">
  <div class="toolbar reveal"><div class="searchbar"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" stroke-linecap="round"/></svg><input id="pub-q" type="text" placeholder="${t("search")} · title, author, journal, year…" autocomplete="off"></div>
    <label class="chip" id="pub-cover" style="user-select:none"><input type="checkbox" id="pub-cover-cb" style="margin:0"> ★ ${t("cover_only")}</label></div>
  <div class="chips hscroll reveal d-1" id="pub-years" style="margin-bottom:32px"><button class="chip active" data-y="all">${t("all")}</button>${years.map((y) => `<button class="chip" data-y="${y}">${y}</button>`).join("")}</div>
  <div id="pub-host"></div><p class="count-note" id="pub-count"></p>
</div></section>`;
  }
  function mountPublication() {
    const host = $("#pub-host"); if (!host) return;
    const q = $("#pub-q"), cb = $("#pub-cover-cb"); let year = "all";
    const params = new URLSearchParams((location.hash.split("?")[1] || ""));
    if (params.get("q")) q.value = params.get("q");
    function render() {
      const terms = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let list = PUBS;
      if (year !== "all") list = list.filter((p) => String(p.year) === year);
      if (cb.checked) list = list.filter((p) => p.cover);
      if (terms.length) list = list.filter((p) => { const hay = (p.title + " " + txt(p.authors) + " " + p.journal + " " + p.year + " " + p.num).toLowerCase(); return terms.every((x) => hay.includes(x)); });
      const byYear = {};
      list.forEach((p) => { (byYear[p.year] = byYear[p.year] || []).push(p); });
      const ys = Object.keys(byYear).sort((a, b) => b - a);
      host.innerHTML = ys.map((y) => `<div class="year-head"><h3 class="display">${y}</h3><div class="line"></div><span class="cnt">${byYear[y].length} PAPERS</span></div><div class="lg pub-list" style="padding:6px 22px">${byYear[y].map((p) => pubRow(p)).join("")}</div>`).join("") || `<div class="empty">${t("no_results")}</div>`;
      $("#pub-count").textContent = `${list.length} / ${PUBS.length}`;
      scrollToHashAnchor();
    }
    q.addEventListener("input", render); cb.addEventListener("change", render);
    $("#pub-years").addEventListener("click", (e) => { const b = e.target.closest(".chip[data-y]"); if (!b) return; $$("#pub-years .chip").forEach((c) => c.classList.remove("active")); b.classList.add("active"); year = b.dataset.y; render(); });
    render();
  }
  function pageCovers() {
    return hero({ kicker: t("cover_articles"), title: `${COVERS.length} ${L2("개의 표지.", "Covers.")}`, lead: t("covers_lead"), photo: COVERS[0], b1: "bd", b2: "bb" }) +
      `<section class="sec tight"><div class="container reveal">${gallery(COVERS, "covers", { cls: "covers" })}</div></section>`;
  }

  /* ---------- Patents ---------- */
  function patRow(p) {
    return `<div class="row-item" id="pat-${p.status}-${p.num}"${aiAttr("patent:" + p.status + "-" + p.num, p.title)}><div class="row-date">${String(p.num).padStart(3, "0")}</div><div class="row-body">
      <div class="row-title">${esc(p.title)} ${p.status === "registered" ? `<span class="tag green">${t("registered")}</span>` : `<span class="tag orange">${t("application")}</span>`}</div>
      <div class="row-sub rich"><span class="muted">${t("inventors")}:</span> ${hl(p.inventors)}</div>
      <div class="row-sub" style="margin-top:4px">${(p.numbers || []).map((n) => `<span class="mono" style="font-size:12px;display:inline-block;margin-right:14px">${esc(n.text)}</span>`).join("")}${(p.extra || []).map((x) => `<div class="rich small">${x}</div>`).join("")}</div>
    </div>${p.images && p.images[0] ? `<div class="row-thumb" data-lb="pat-${p.num}" data-src="${esc(p.images[0])}"><img loading="lazy" decoding="async" src="${esc(p.images[0])}" alt=""></div>` : ""}</div>`;
  }
  function pagePatent() {
    return hero({ kicker: t("patent"), title: `${stats.pats} ${L2("건의 특허.", "Patents.")}`, lead: `${t("registered")} ${stats.patsReg} · ${t("application")} ${stats.patsApp}`, b1: "bd", b2: "ba" }) + `
<section class="sec tight"><div class="container">
  ${PATS.images && PATS.images.length ? `<p class="reveal kicker" style="margin:0 0 14px">${t("certificates")}</p>${gallery(PATS.images, "pat-certs", { cls: "cols-6 contain" })}<div class="divider"></div>` : ""}
  <div class="chips reveal" id="pat-tabs" style="margin-bottom:24px"><button class="chip active" data-k="registered">${t("registered")} · ${PATS.registered.length}</button><button class="chip" data-k="applications">${t("application")} · ${PATS.applications.length}</button></div>
  <div class="lg reveal d-1" style="padding:6px 22px" id="pat-host"></div>
</div></section>`;
  }
  function mountPatent() {
    const host = $("#pat-host"); if (!host) return;
    const render = (k) => { host.innerHTML = (PATS[k] || []).map(patRow).join("") || `<div class="empty">—</div>`; };
    $("#pat-tabs").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; $$("#pat-tabs .chip").forEach((c) => c.classList.remove("active")); b.classList.add("active"); render(b.dataset.k); });
    render("registered");
  }

  /* ---------- Presentations ---------- */
  function pagePresentation() {
    return hero({ kicker: t("presentation"), title: `${stats.pres} ${L2("건의 발표.", "Presentations.")}`, lead: L2("국내외 학회 발표와 초청 강연 목록입니다.", "Conference presentations and invited talks."), b1: "be", b2: "bc" }) + `
<section class="sec tight"><div class="container">
  <div class="toolbar reveal"><div class="searchbar"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" stroke-linecap="round"/></svg><input id="pres-q" type="text" placeholder="${t("search")} · presenter, title, venue…" autocomplete="off"></div>
    <div class="chips" id="pres-type"><button class="chip active" data-k="all">${t("all")}</button><button class="chip" data-k="invited">★ ${t("invited")}</button><button class="chip" data-k="conf">${t("conference")}</button></div></div>
  <div id="pres-host"></div><p class="count-note" id="pres-count"></p>
</div></section>`;
  }
  function mountPresentation() {
    const host = $("#pres-host"); if (!host) return;
    const q = $("#pres-q"); let kind = "all";
    function render() {
      const terms = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let total = 0;
      host.innerHTML = PRES.map((y) => {
        let items = y.items;
        if (kind === "invited") items = items.filter((i) => i.invited);
        if (kind === "conf") items = items.filter((i) => !i.invited);
        if (terms.length) items = items.filter((i) => { const hay = (i.text + " " + i.type).toLowerCase(); return terms.every((x) => hay.includes(x)); });
        if (!items.length) return "";
        total += items.length;
        return `<div class="year-head"><h3 class="display">${y.year || "—"}</h3><div class="line"></div><span class="cnt">${items.length}</span></div><div class="lg" style="padding:6px 22px">${items.map((i) => `<div class="row-item" id="pres-${i.num}"${aiAttr("pres:" + i.num, i.text.slice(0, 60))}><div class="row-date">${String(i.num).padStart(3, "0")}</div><div class="row-body"><div class="row-sub rich" style="color:var(--ink);font-size:14px">${i.type ? `<span class="tag ${i.invited ? "gold" : "gray"}" style="margin-right:6px">${esc(i.type.replace(/Conference Presentation/, "Conference"))}</span>` : ""}${hl(i.html)}</div></div></div>`).join("")}</div>`;
      }).join("") || `<div class="empty">${t("no_results")}</div>`;
      $("#pres-count").textContent = `${total} / ${stats.pres}`;
    }
    q.addEventListener("input", render);
    $("#pres-type").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; $$("#pres-type .chip").forEach((c) => c.classList.remove("active")); b.classList.add("active"); kind = b.dataset.k; render(); });
    render();
  }

  /* ---------- Projects ---------- */
  function projCard(p, i) {
    const kpi = [];
    if (p.year) kpi.push(`<span class="tag">${esc(p.year)}</span>`);
    if (p.goal) kpi.push(`<span class="tag gray">${esc(p.goal)}</span>`);
    if (p.status) kpi.push(`<span class="tag green">${esc(p.status)}</span>`);
    const body = [];
    if (p.papers && p.papers.length) body.push(`<span class="lbl kicker" style="font-size:10px">${t("papers_out")} ${p.papers.length}</span>${p.papers.map((x) => `<p>${hl(x)}</p>`).join("")}`);
    if (p.patents && p.patents.length) body.push(`<span class="lbl kicker" style="font-size:10px">${t("patents_out")} ${p.patents.length}</span>${p.patents.map((x) => `<p>${x}</p>`).join("")}`);
    if (p.other && p.other.length) body.push(p.other.map((x) => `<p>${x}</p>`).join(""));
    return `<div class="lg card proj-card reveal d-${(i % 3) + 1}"${aiAttr("project:" + PROJ.indexOf(p), LANG === "en" ? p.title_en || tr(p.title_ko) : p.title_ko)}><div class="ttl">${esc(LANG === "en" ? p.title_en || tr(p.title_ko) : p.title_ko)}</div>${p.title_en && LANG !== "en" ? `<div class="en">${esc(p.title_en)}</div>` : ""}<div class="agency rich">${(p.meta || []).join("<br>")}</div>${kpi.length ? `<div class="kpi">${kpi.join("")}</div>` : ""}${body.length ? `<details><summary>${t("show_details")} ▾</summary><div class="rich">${body.join("")}</div></details>` : ""}</div>`;
  }
  function pageProject() {
    const ongoing = PROJ.filter((p) => p.year), past = PROJ.filter((p) => !p.year);
    return hero({ kicker: t("project"), title: `${PROJ.length} ${L2("개의 연구과제.", "Projects.")}`, lead: ((D.projects && D.projects.meta) || []).map(txt).join(" · "), b1: "bc", b2: "bd" }) + `
<section class="sec tight"><div class="container">
  ${ongoing.length ? `<p class="reveal kicker" style="margin:0 0 16px">${t("ongoing")} · ${ongoing.length}</p><div class="grid grid-3">${ongoing.map(projCard).join("")}</div>` : ""}
  ${past.length ? `<div class="divider"></div><p class="reveal kicker" style="margin:0 0 16px">${t("past_projects")} · ${past.length}</p><div class="grid grid-3">${past.map(projCard).join("")}</div>` : ""}
</div></section>`;
  }

  /* ---------- Awards ---------- */
  function pageAward() {
    return hero({ kicker: t("award"), title: `${stats.awards} ${L2("건의 수상.", "Awards.")}`, lead: L2("학생 · 연구원 · 교수의 수상 및 장학 내역", "Awards and scholarships of students, researchers and the PI"), b1: "bd", b2: "bf" }) + `
<section class="sec tight"><div class="container">
  <div class="toolbar reveal"><div class="searchbar"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" stroke-linecap="round"/></svg><input id="aw-q" type="text" placeholder="${t("search")} · recipient, award, year…" autocomplete="off"></div></div>
  <div class="lg reveal d-1" style="padding:6px 22px" id="aw-host"></div><p class="count-note" id="aw-count"></p>
</div></section>`;
  }
  function mountAward() {
    const host = $("#aw-host"); if (!host) return; const q = $("#aw-q");
    function render() {
      const terms = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const list = AWARDS.filter((a) => !terms.length || terms.every((x) => (a.headline + " " + a.year + " " + a.details.map(txt).join(" ")).toLowerCase().includes(x)));
      host.innerHTML = list.map((a) => `<div class="row-item" id="award-${a.num}"${aiAttr("award:" + a.num, a.headline)}><div class="row-date">${esc(a.year)}<br><span class="muted">#${a.num}</span></div><div class="row-body"><div class="row-title rich">${a.headline_html}</div>${a.details.length ? `<div class="row-sub rich">${a.details.join("<br>")}</div>` : ""}</div>${a.images && a.images[0] ? `<div class="row-thumb" data-lb="award-${a.num}" data-src="${esc(a.images[0])}" data-cap="${esc(a.headline)}"><img loading="lazy" decoding="async" src="${esc(a.images[0])}" alt=""></div>` : ""}</div>`).join("") || `<div class="empty">${t("no_results")}</div>`;
      $("#aw-count").textContent = `${list.length} / ${AWARDS.length}`;
    }
    q.addEventListener("input", render); render();
  }

  /* ---------- Courses / Programs ---------- */
  function pageCourse() {
    return hero({ kicker: t("course"), title: `${t("course")}.`, lead: L2("교수님이 개설한 학부 · 대학원 강의", "Undergraduate and graduate courses taught by Prof. Sim"), b1: "bc", b2: "be" }) +
      `<section class="sec tight"><div class="container"><div class="grid grid-3">${(D.courses || []).map((g, i) => `<div class="lg card course-card reveal d-${i + 1}"${aiAttr("course:" + i, g.institution)}><h3 class="subhead">${esc(g.institution)}</h3>${g.levels.map((l) => `<div class="lvl">${esc(l.name)}</div><ul>${l.courses.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`).join("")}</div>`).join("")}</div></div></section>`;
  }
  function pageProgram() {
    const first = ((D.programs || [])[0] || {}).images || [];
    return hero({ kicker: t("program"), title: `${t("program")}.`, lead: L2("연구실이 진행한 교육 · 인턴 프로그램", "Education and internship programs run by the lab"), photo: first[0], b1: "bd", b2: "bb" }) +
      `<section class="sec tight"><div class="container">${(D.programs || []).map((p, i) => `<div class="lg card flat reveal" style="margin-bottom:24px"><h3 class="subhead" style="font-size:22px;margin:0 0 6px">${esc(p.title)}</h3>${p.lines.length ? `<div class="rich muted" style="margin-bottom:14px">${p.lines.join(" · ")}</div>` : ""}${gallery(p.images, "prog-" + i, { cls: "cols-3", caps: p.images.map(() => p.title) })}</div>`).join("")}</div></section>`;
  }

  /* ---------- News ---------- */
  function pageNews() {
    const latestImgs = NEWS.latest_images || [];
    const caps = latestImgs.map((_, i) => txt(NEWS.latest[Math.floor(i / Math.max(1, latestImgs.length / Math.max(1, NEWS.latest.length)))] || ""));
    return hero({ kicker: t("news"), title: `${t("news")}.`, lead: esc(NEWS.latest_title || ""), photo: latestImgs[0], b1: "ba", b2: "bb" }) + `
<section class="sec tight"><div class="container">
  ${latestImgs.length ? `<div class="reveal">${gallery(latestImgs, "news-latest", { caps })}<div class="grid grid-2" style="margin-top:14px">${(NEWS.latest || []).map((c) => `<div class="lg card flat rich small" style="padding:16px 18px">${c}</div>`).join("")}</div></div><div class="divider"></div>` : ""}
  ${NEWS.articles && NEWS.articles.length ? `<p class="reveal kicker" style="margin:0 0 16px">${t("articles")}</p><div class="grid grid-3" style="margin-bottom:56px">${NEWS.articles.map((a, i) => `<div class="lg card news-card reveal d-${(i % 3) + 1}" id="news-${i}" data-toggle="news-body-${i}"${aiAttr("news:" + i, a.title)}>${tile(a.images[0], { i, glyph: "N", lb: "news-" + i })}<div class="body"><div class="ttl">${esc(a.title)}</div><div class="exc rich" id="news-exc-${i}">${a.body.join(" ")}</div><div class="hidden rich small" id="news-body-${i}" style="color:var(--ink-2);line-height:1.7">${a.body.map((b) => `<p>${b}</p>`).join("")}</div>${a.source ? `<a href="${esc(a.source)}" target="_blank" rel="noopener" class="link-arrow small">${t("read_source")}</a>` : ""}</div></div>`).join("")}</div>` : ""}
  <div class="sec-head row" style="margin-bottom:16px"><div><p class="reveal kicker">${t("press")}</p><h2 class="reveal d-1 display" style="font-size:clamp(26px,3.6vw,40px)">${t("press")} · ${NEWS.press.length}</h2></div><a href="#/news/research-news" class="btn btn-ghost">${t("research_news")} →</a></div>
  <div class="lg reveal" style="padding:6px 22px">${(NEWS.press || []).map((p) => `<div class="press-row"><span class="dt">${esc(p.date)}</span><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)}</a></div>`).join("")}</div>
</div></section>`;
  }
  function pageResearchNews() {
    return hero({ kicker: t("news"), title: `${t("research_news")}.`, lead: L2(`연구 성과 보도 · ${RNEWS.length}건`, `${RNEWS.length} research highlights`), photo: (RNEWS[0] || {}).images && RNEWS[0].images[0], b1: "bc", b2: "ba" }) + `
<section class="sec tight"><div class="container">
  <div class="grid grid-3" style="margin-bottom:56px">${RNEWS.map((a, i) => `<a href="#/news/research-news#rn-${i}" class="lg card news-card reveal d-${(i % 3) + 1}"${aiAttr("rnews:" + i, a.title)}>${tile(a.images[0], { i, glyph: "R" })}<div class="body"><div class="ttl">${esc(a.title)}</div>${a.subtitle ? `<div class="sub">${esc(a.subtitle)}</div>` : ""}<div class="exc rich">${txt((a.body || [])[0] || "")}</div></div></a>`).join("")}</div>
  <div class="divider"></div>
  ${RNEWS.map((a, i) => `<article class="article reveal" id="rn-${i}"${aiAttr("rnews:" + i, a.title)}>${a.images.length ? `<div class="img-tile zoomable" data-lb="rn-${i}" data-src="${esc(a.images[0])}"><img loading="lazy" decoding="async" src="${esc(a.images[0])}" alt=""></div>` : ""}<h3 class="display">${esc(a.title)}</h3>${a.subtitle ? `<div class="sub">${esc(a.subtitle)}</div>` : ""}<div class="body rich">${a.body.map((b) => `<p>${b}</p>`).join("")}</div>${a.refs.length ? `<div class="refs rich">${a.refs.map((r) => `<p>${r}</p>`).join("")}</div>` : ""}${a.source ? `<div class="src">${L2("출처", "Source")}: <a href="${esc(a.source)}" target="_blank" rel="noopener" style="color:var(--blue)">${esc(a.source)}</a></div>` : ""}${a.images.length > 1 ? gallery(a.images.slice(1), "rn-" + i + "-more", { cls: "cols-3" }) : ""}</article>`).join("")}
</div></section>`;
  }

  /* ---------- NEELstagram (instagram-style, date-sorted masonry) ---------- */
  const gramKey = (p) => (p.recent ? "recent" : String(p.year || ""));
  function pageGram() {
    const years = Array.from(new Set(GRAM.map((p) => p.year).filter(Boolean))).sort((a, b) => b - a);
    const hasRecent = GRAM.some((p) => p.recent);
    const firstYear = years.length ? years[years.length - 1] : "";
    return hero({ kicker: "Lab life", title: "#NEELstagram", lead: t("gram_lead"), photo: GROUP_PHOTO, b1: "bb", b2: "be" }) + `
<section class="sec tight"><div class="container">
  <div class="lg lg-thick refract ig-profile reveal">
    <div class="story-ring"><div><div class="logo"><img src="${LOGO}" alt="NEEL"></div></div></div>
    <div style="flex:1;min-width:0"><div class="ig-top"><div class="ig-handle">neel_lab_official</div><a class="btn btn-blue btn-sm" href="${esc((O.contact || {}).google_site || "#")}" target="_blank" rel="noopener">${L2("원본 보기", "Source")}</a><a class="btn btn-ghost btn-sm" href="#/contact">${L2("메시지", "Message")}</a></div>
      <div class="ig-stats"><span><b>${stats.gramPosts}</b> ${t("posts")}</span><span><b>${stats.gramPhotos}</b> ${t("photos")}</span>${firstYear ? `<span><b>${t("since")}</b> ${firstYear}</span>` : ""}</div>
      <div class="ig-bio"><b>NEEL Laboratory · ${esc((O.brand || {}).org || "SKKU SAINT")}</b><br>🔬 Nanomaterials for Energy & Environment<br>⚡ Green H₂ · NH₃ · Batteries · PEC<br>📧 ${esc((O.contact || {}).email || "")}</div>
      <div class="ig-highlights">${(hasRecent ? [{ k: "recent", l: t("recent"), s: "✦" }] : []).concat(years.slice(0, 8).map((y) => ({ k: String(y), l: String(y), s: String(y).slice(2) }))).map((h) => `<a href="#gram-${h.k}" class="hl"><span class="ring"><span>${h.s}</span></span><small>${h.l}</small></a>`).join("")}</div>
    </div>
  </div>
  <div class="chips hscroll reveal d-1" id="gram-years" style="margin:26px 0 8px"><button class="chip active" data-y="all">${t("all")} · ${GRAM.length}</button>${hasRecent ? `<button class="chip" data-y="recent">${t("recent")} · ${GRAM.filter((p) => p.recent).length}</button>` : ""}${years.map((y) => `<button class="chip" data-y="${y}">${y} · ${GRAM.filter((p) => p.year === y && !p.recent).length}</button>`).join("")}</div>
  <div id="gram-feed"></div>
</div></section>`;
  }
  function gramPost(p, i) {
    const imgs = p.images.concat(p.slides);
    const cap = p.caption.filter((c) => txt(c));
    if (!imgs.length && !cap.length) return "";
    const ar = Math.min(1.5, Math.max(0.8, aspectOf(imgs[0], 1)));
    const capText = cap.map(txt).join(" · ");
    const dateLabel = p.recent ? t("recent") : (p.date_label || "");
    const ph = imgs.length ? `<div class="ph" style="aspect-ratio:${ar.toFixed(3)}"><img loading="lazy" decoding="async" src="${esc(imgs[0])}" alt="" data-lb="gram-${i}" data-src="${esc(imgs[0])}" data-cap="${esc(capText)}">${imgs.length > 1 ? `<span class="multi">1/${imgs.length}</span><button class="arr l" data-dir="-1" aria-label="prev">‹</button><button class="arr r" data-dir="1" aria-label="next">›</button><div class="dots">${imgs.map((_, k) => `<i class="${k === 0 ? "on" : ""}"></i>`).join("")}</div>` : ""}</div>` : "";
    return `<article class="ig-post" data-imgs='${esc(JSON.stringify(imgs))}' data-cap="${esc(capText)}">
      <header class="ig-head"><img class="ig-av" src="${LOGO}" alt=""><div class="who"><b>neel_lab_official</b><span class="ig-date ${p.date_inferred && !p.recent ? "approx" : ""}">${esc(dateLabel)}</span></div></header>
      ${ph}
      ${cap.length ? `<div class="cap">${cap.map((c) => `<p class="rich">${c}</p>`).join("")}</div>` : ""}
    </article>`;
  }
  function mountGram() {
    const feed = $("#gram-feed"); if (!feed) return;
    let year = "all";
    let colsN = 0;
    function layout() {
      const list = GRAM.filter((p) => year === "all" || gramKey(p) === year);
      const w = feed.clientWidth || 1000;
      colsN = w > 980 ? 3 : (w > 620 ? 2 : 1);
      const colW = (w - 16 * (colsN - 1)) / colsN;
      const groups = [];
      list.forEach((p) => { const k = gramKey(p); let g = groups.find((x) => x.k === k); if (!g) { g = { k, posts: [] }; groups.push(g); } g.posts.push(p); });
      let html = "";
      groups.forEach((g) => {
        const cols = Array.from({ length: colsN }, () => ({ h: 0, items: [] }));
        g.posts.forEach((p) => {
          const imgs = p.images.concat(p.slides);
          const ar = imgs.length ? Math.min(1.5, Math.max(0.8, aspectOf(imgs[0], 1))) : 0;
          const capLen = p.caption.map(txt).join(" ").length;
          const est = 56 + (ar ? colW / ar : 0) + (capLen ? 30 + Math.ceil(capLen / 32) * 22 : 0);
          const c = cols.reduce((m, x) => (x.h < m.h ? x : m), cols[0]);
          c.items.push(p); c.h += est + 16;
        });
        html += `<div class="year-head" id="gram-${g.k}"><h3 class="display">${g.k === "recent" ? t("recent") : g.k}</h3><div class="line"></div><span class="cnt">${g.posts.length} POSTS</span></div>
          <div class="ig-cols" style="grid-template-columns:repeat(${colsN},1fr)">${cols.map((c) => `<div class="ig-col">${c.items.map((p) => gramPost(p, GRAM.indexOf(p))).join("")}</div>`).join("")}</div>`;
      });
      feed.innerHTML = html || `<div class="empty">${t("no_results")}</div>`;
      bindGramCards();
    }
    function bindGramCards() {
      $$(".ig-post", feed).forEach((post) => {
        const imgs = JSON.parse(post.getAttribute("data-imgs") || "[]");
        const ph = $(".ph", post); if (!ph) return;
        const img = $("img", ph), multi = $(".multi", ph), dots = $$(".dots i", ph);
        let i = 0;
        const go = (d) => { i = (i + d + imgs.length) % imgs.length; img.src = imgs[i]; img.setAttribute("data-src", imgs[i]); if (multi) multi.textContent = `${i + 1}/${imgs.length}`; dots.forEach((x, k) => x.classList.toggle("on", k === i)); };
        $$(".arr", ph).forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); go(+b.dataset.dir); }));
        img.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); openLightbox(imgs, i, imgs.map(() => post.getAttribute("data-cap") || "")); }, true);
        let sx = 0;
        ph.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
        ph.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40 && imgs.length > 1) go(dx < 0 ? 1 : -1); }, { passive: true });
      });
    }
    $("#gram-years").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; $$("#gram-years .chip").forEach((c) => c.classList.remove("active")); b.classList.add("active"); year = b.dataset.y; layout(); });
    let tmr = null;
    window.addEventListener("resize", () => { clearTimeout(tmr); tmr = setTimeout(() => { if (!document.body.contains(feed)) return; const w = feed.clientWidth; const n = w > 980 ? 3 : (w > 620 ? 2 : 1); if (n !== colsN) layout(); }, 150); });
    layout();
  }

  /* ---------- Contact ---------- */
  function pageContact() {
    return hero({ b1: "bb", b2: "be", kicker: t("join_neel"), title: t("contact"), lead: L2("연구원 · 대학원생 지원 문의는 이메일로 연락 주세요.", "Contact us by email for researcher and graduate-student applications."), photo: GROUP_PHOTO }) + contactCTA();
  }

  /* ---------- Generic mirror page ---------- */
  function pageGeneric(slug) {
    const page = D.pages && D.pages[slug];
    if (!page) return hero({ title: esc(slug), lead: "" }) + `<section class="sec tight"><div class="container"><div class="empty">Page not found</div></div></section>`;
    return hero({ kicker: t("source_note"), title: esc(pageTitle(slug)), lead: t("generic_note") }) +
      `<section class="sec tight"><div class="container">${renderBlocks(page)}</div></section>`;
  }

  /* ================================================================
     ROUTER / SHELL
     ================================================================ */
  const ROUTES = {
    "": pageHome, home: pageHome, professor: pageProfessor, research: pageResearch, members: pageMembers,
    publication: pagePublication, "publication/cover": pageCovers, patent: pagePatent, presentation: pagePresentation,
    project: pageProject, award: pageAward, course: pageCourse, program: pageProgram, news: pageNews,
    "news/research-news": pageResearchNews, neelstagram: pageGram, contact: pageContact,
  };
  const MOUNT = { publication: mountPublication, patent: mountPatent, presentation: mountPresentation, award: mountAward, neelstagram: mountGram, home: mountAlbum, "": mountAlbum };
  const PRIMARY = ["professor", "research", "members", "publication", "news", "award", "neelstagram"];

  function parseHash() {
    let h = location.hash.replace(/^#\/?/, "");
    let anchor = "";
    const ai = h.indexOf("#"); if (ai >= 0) { anchor = h.slice(ai + 1); h = h.slice(0, ai); }
    const qi = h.indexOf("?"); if (qi >= 0) h = h.slice(0, qi);
    return { slug: h.replace(/\/$/, ""), anchor };
  }
  let currentSlug = null;
  function render(opts) {
    const keepY = opts && opts.keepScroll != null ? opts.keepScroll : null;
    const { slug } = parseHash();
    const fn = ROUTES[slug] || (D.pages && D.pages[slug] ? () => pageGeneric(slug) : null);
    const app = $("#app");
    app.innerHTML = fn ? fn() : pageGeneric(slug);
    if (keepY == null) { app.classList.remove("page-enter"); void app.offsetWidth; app.classList.add("page-enter"); }
    currentSlug = slug;
    document.title = (slug ? `${t(slug) === slug ? pageTitle(slug) : t(slug)} · ` : "") + "NEEL Lab";
    if (MOUNT[slug]) MOUNT[slug]();
    afterRender();
    setActiveNav(slug);
    setActiveTab(slug);
    if (keepY != null) {
      // language switch: stay where the reader was, with the visible blocks already shown
      window.scrollTo({ top: keepY, behavior: "instant" });
      $$(".reveal").forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < window.innerHeight * 1.5) el.classList.add("in"); });
      return;
    }
    if (!parseHash().anchor) window.scrollTo({ top: 0, behavior: "instant" });
    scrollToHashAnchor();
  }
  function scrollToHashAnchor() {
    const { anchor } = parseHash(); if (!anchor) return;
    const el = document.getElementById(anchor); if (!el) return;
    setTimeout(() => { el.classList.add("in"); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" }); if (el.hasAttribute("data-toggle")) togglePanel(el.getAttribute("data-toggle"), true); }, 60);
  }
  function afterRender() {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.05, rootMargin: "0px 0px -4% 0px" });
    $$(".reveal").forEach((el) => io.observe(el));
    setTimeout(() => $$(".reveal:not(.in)").forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < window.innerHeight * 1.2) el.classList.add("in"); }), 2500);
    $$("[data-count]").forEach((el) => {
      const target = +el.getAttribute("data-count") || 0; const t0 = performance.now();
      const tick = (now) => { const p = Math.min(1, (now - t0) / 1100); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); else el.textContent = target; };
      requestAnimationFrame(tick);
      setTimeout(() => { el.textContent = target; }, 1400);
    });
    $$("[data-toggle]").forEach((el) => el.addEventListener("click", (e) => { if (e.target.closest("a, [data-lb], .arr")) return; togglePanel(el.getAttribute("data-toggle")); }));
  }
  function togglePanel(id, force) {
    const p = document.getElementById(id); if (!p) return;
    const show = force === true ? true : p.classList.contains("hidden");
    p.classList.toggle("hidden", !show);
    const btn = document.querySelector(`[data-toggle="${id}"] .mem-more`); if (btn) btn.textContent = show ? t("hide_details") + " ▴" : t("show_details") + " ▾";
    const exc = document.getElementById(id.replace("news-body", "news-exc")); if (exc) exc.classList.toggle("hidden", show);
  }

  /* ---------- nav ---------- */
  function navLabel(n) { const k = n.slug === "home" ? "home" : n.slug; const v = t(k); return v === k ? n.title : v; }
  function buildNav() {
    const flat = []; (D.nav || []).forEach((n) => { flat.push(n); (n.children || []).forEach((c) => flat.push(Object.assign({}, c, { parent: n.slug }))); });
    const known = new Set(flat.map((n) => n.slug));
    const extra = Object.keys(D.pages || {}).filter((s) => !known.has(s)).map((s) => ({ slug: s, title: pageTitle(s), children: [] }));
    const prim = PRIMARY.map((s) => flat.find((n) => n.slug === s)).filter(Boolean);
    const more = flat.filter((n) => n.slug !== "home" && !PRIMARY.includes(n.slug)).concat(extra);
    const B = O.brand || {};
    $("#nav").innerHTML = `<div class="nav-inner">
      <a href="#/" class="brand"><img class="brand-logo" src="${LOGO}" alt="N"><span><span class="brand-text">${esc(B.name || "NEEL Lab")}</span><span class="brand-sub">${esc(B.org || "")}</span></span></a>
      <div class="nav-links">${prim.map((n) => `<a href="#/${n.slug}" data-slug="${n.slug}">${esc(navLabel(n))}</a>`).join("")}
        <div class="nav-more"><button>${t("more")} <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke-linecap="round"/></svg></button>
          <div class="nav-drop">${more.map((n) => `<a href="#/${n.slug}" data-slug="${n.slug}">${esc(navLabel(n))}${n.parent ? `<small>${esc(navLabel({ slug: n.parent, title: n.parent }))}</small>` : ""}</a>`).join("")}<a href="#/contact" data-slug="contact">${t("contact")}</a></div></div>
        <span class="nav-indicator"></span></div>
      <div class="nav-right">
        <button class="nav-search" id="nav-search" aria-label="Search"><svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" stroke-linecap="round"/></svg></button>
        <div class="lang-toggle ${LANG === "en" ? "en" : ""}"><span class="thumb"></span><button data-set-lang="ko" class="${LANG !== "en" ? "on" : ""}">KO</button><button data-set-lang="en" class="${LANG === "en" ? "on" : ""}">EN</button></div>
        <a href="#/contact" class="btn btn-pri btn-sm nav-join" id="nav-join">${t("join")}</a>
        <button class="hamburger" id="hamburger" aria-label="Menu"><svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round"/></svg></button>
      </div></div>`;
    $("#mobile-menu").innerHTML = [{ slug: "home", title: "Home" }].concat(prim, more).map((n) => `<a href="#/${n.slug === "home" ? "" : n.slug}" class="${n.parent ? "sub" : ""}">${esc(navLabel(n))}</a>`).join("") + `<a href="#/contact">${t("contact")}</a>`;
    $("#hamburger").onclick = () => $("#mobile-menu").classList.toggle("show");
    $$("#mobile-menu a").forEach((a) => a.addEventListener("click", () => $("#mobile-menu").classList.remove("show")));
    $$("[data-set-lang]").forEach((b) => b.onclick = () => setLang(b.dataset.setLang));
    $("#nav-search").onclick = () => openChat("search");
    const links = $$(".nav-links > a"), ind = $(".nav-indicator"), parent = $(".nav-links");
    const move = (el) => { if (!el) { ind.style.opacity = 0; return; } const r = el.getBoundingClientRect(), pr = parent.getBoundingClientRect(); ind.style.left = (r.left - pr.left) + "px"; ind.style.width = r.width + "px"; ind.style.opacity = 1; };
    links.forEach((l) => l.addEventListener("mouseenter", () => move(l)));
    parent.addEventListener("mouseleave", () => move(parent.querySelector(":scope > a.active")));
    window.addEventListener("resize", () => move(parent.querySelector(":scope > a.active")));
    setActiveNav(currentSlug || "");
  }
  function setActiveNav(slug) {
    $$(".nav-links a, .nav-drop a").forEach((a) => a.classList.toggle("active", a.dataset.slug === slug || (slug.startsWith(a.dataset.slug + "/") && a.dataset.slug)));
    const more = $(".nav-more"); if (more) more.classList.toggle("active", !!$(".nav-drop a.active"));
    const act = $(".nav-links > a.active"), ind = $(".nav-indicator"), parent = $(".nav-links");
    if (ind && parent) { if (act) { const r = act.getBoundingClientRect(), pr = parent.getBoundingClientRect(); ind.style.left = (r.left - pr.left) + "px"; ind.style.width = r.width + "px"; ind.style.opacity = 1; } else ind.style.opacity = 0; }
  }
  function buildFooter() {
    const C = O.contact || {}, B = O.brand || {};
    const flat = []; (D.nav || []).forEach((n) => { flat.push(n); (n.children || []).forEach((c) => flat.push(c)); });
    const col = (title, slugs) => `<div class="footer-col"><h4>${title}</h4>${slugs.map((s) => { const n = flat.find((x) => x.slug === s) || { slug: s, title: s }; return `<a href="#/${s}">${esc(navLabel(n))}</a>`; }).join("")}</div>`;
    $("#footer").innerHTML = `<div class="blob ba" style="width:520px;height:520px;bottom:-120px;right:-160px;opacity:.28"></div><div class="blob be" style="width:480px;height:480px;top:-80px;left:-140px;opacity:.22"></div>
      <div class="container"><div class="footer-grid">
        <div class="footer-col brandcol"><a href="#/" class="brand" style="margin-bottom:14px"><img class="brand-logo" src="${LOGO}" alt="N"><span class="brand-text" style="font-size:16px">${esc(B.full || "NEEL Laboratory")}</span></a>
          <p class="small muted" style="margin:0 0 12px;max-width:320px;line-height:1.65">${L2("지속 가능한 미래를 위한 나노 에너지 과학의 최전선.", "At the frontier of nano-energy science for a sustainable future.")}</p>
          <p class="small" style="margin:0">📧 <a href="mailto:${esc(C.email)}" style="color:var(--blue)">${esc(C.email)}</a></p>
          <p class="sync-note" style="margin-top:14px" title="${esc((D.meta || {}).source || "")}">${t("synced")} · ${esc(((D.meta || {}).synced_at || "").replace("T", " ").slice(0, 16))}</p></div>
        ${col(t("lab_lines"), ["professor", "research", "members", "course", "program"])}
        ${col(t("outputs"), ["publication", "publication/cover", "patent", "presentation", "project", "award"])}
        ${col(t("more_links"), ["news", "news/research-news", "neelstagram", "contact"])}
      </div><div class="footer-bottom"><span>© ${new Date().getFullYear()} NEEL Laboratory · Prof. Uk Sim · ${esc(B.org || "")}</span><span><a href="${esc(C.google_site)}" target="_blank" rel="noopener">${t("google_site")} ↗</a> · <a href="#" id="edit-open" title="${t("edit_title")}">✎</a></span></div></div>`;
    $("#edit-open").onclick = (e) => { e.preventDefault(); openEditor(); };
  }

  /* ---------- language ---------- */
  function setLang(l) {
    const first = !LANG;
    if (l === LANG) return;
    const y = window.scrollY;
    $$(".lang-toggle").forEach((tg) => { tg.classList.toggle("en", l === "en"); $$("button", tg).forEach((b) => b.classList.toggle("on", b.dataset.setLang === l)); });
    LANG = l; try { localStorage.setItem("neel-lang", l); } catch (e) {}
    document.documentElement.lang = l;
    applyLang(); INDEX = null;
    // keep a shared ?lang= link in sync so a reload doesn't flip the language back
    const u = new URL(location.href); if (u.searchParams.has("lang")) { u.searchParams.set("lang", l); history.replaceState(null, "", u); }
    $("#lang-modal").classList.add("hide"); setTimeout(() => { $("#lang-modal").style.display = "none"; }, 800);
    setTimeout(() => { buildNav(); buildFooter(); buildTabbar(); render(first ? null : { keepScroll: y }); buildChat(); }, first ? 0 : 160);
  }

  /* ================================================================
     ASSISTANT  (offline search  +  Claude AI mode)
     ================================================================ */
  function buildIndex() {
    const idx = [];
    PUBS.forEach((p) => idx.push({ k: "publication", label: `#${p.num} · ${p.journal} ${p.year}`, title: p.title || txt(p.journal_html), hay: `${p.title} ${txt(p.authors)} ${p.journal} ${p.year} ${p.num} ${p.cover ? "__cover__" : ""}`, href: `#/publication#pub-${p.num}`, pdf: p.pdf, doi: p.doi,
      ctx: `[Paper #${p.num}] "${p.title}" — ${txt(p.authors)}. ${p.journal}, ${p.year}.${p.impact ? " " + p.impact + "." : ""}${p.cover ? " (Cover article)" : ""}${p.doi ? " DOI: " + p.doi : ""}${p.pdf ? " PDF: " + p.pdf : ""}` }));
    MEMBERS.forEach((g) => g.members.forEach((m) => idx.push({ k: "member", label: g.title, title: `${m.name_en} ${m.name_ko || ""}`, hay: `${m.name} ${m.name_ko} ${m.roles.map(txt).join(" ")} ${g.title}`, href: `#/members#mem-${slugify(m.name_en)}`,
      ctx: `[Member · ${g.title}] ${m.name}${m.name_ko ? " (" + m.name_ko + ")" : ""}: ${m.roles.map(txt).join("; ")}${m.stats && m.stats.main != null ? ` (main-author papers: ${m.stats.main}, co-author: ${m.stats.co || 0})` : ""}` })));
    AWARDS.forEach((a) => idx.push({ k: "award", label: `${a.year} · #${a.num}`, title: a.headline, hay: `${a.headline} ${a.year} ${a.details.map(txt).join(" ")}`, href: `#/award#award-${a.num}`, ctx: `[Award #${a.num}, ${a.year}] ${a.headline}${a.details.length ? " — " + a.details.map(txt).join(" ") : ""}` }));
    (PATS.registered || []).concat(PATS.applications || []).forEach((p) => idx.push({ k: "patent", label: `${p.status} · #${p.num}`, title: p.title, hay: `${p.title} ${txt(p.inventors)} ${p.numbers.map((n) => n.text).join(" ")}`, href: `#/patent#pat-${p.status}-${p.num}`, ctx: `[Patent ${p.status} #${p.num}] "${p.title}" — ${txt(p.inventors)}. ${p.numbers.map((n) => n.text).join("; ")}` }));
    PRES.forEach((y) => y.items.forEach((i) => idx.push({ k: "presentation", label: `${y.year} · #${i.num} ${i.type}`, title: i.text.slice(0, 140), hay: `${i.text} ${i.type} ${y.year}`, href: `#/presentation#pres-${i.num}`, ctx: `[Presentation #${i.num}, ${y.year}${i.type ? ", " + i.type : ""}] ${i.text}` })));
    PROJ.forEach((p) => idx.push({ k: "project", label: p.year || "project", title: LANG === "en" ? p.title_en || tr(p.title_ko) : p.title_ko, hay: `${p.title_ko} ${p.title_en} ${p.meta.map(txt).join(" ")}`, href: `#/project`, ctx: `[Project${p.year ? " " + p.year : ""}] ${p.title_ko}${p.title_en ? " (" + p.title_en + ")" : ""} — ${p.meta.map(txt).join("; ")}${p.goal ? " " + p.goal : ""}${p.status ? " " + p.status : ""}` }));
    (RES.ko_topics || []).forEach((tp, i) => idx.push({ k: "research", label: `topic ${i + 1}`, title: LANG === "en" ? tp.title_en || tp.title_ko : tp.title_ko, hay: `${tp.title_ko} ${tp.title_en} ${tp.desc.map(txt).join(" ")} ${tp.bullets.map(txt).join(" ")} ${tp.papers.map((p) => p.journal).join(" ")}`, href: `#/research#topic-${i + 1}`, ctx: `[Research topic ${i + 1}] ${tp.title_ko} / ${tp.title_en}: ${tp.desc.map(txt).join(" ")} Key directions: ${tp.bullets.map(txt).join("; ")}. Representative journals: ${tp.papers.map((p) => p.journal + (p.cover ? " (cover)" : "")).join(", ")}` }));
    (RES.en_topics || []).forEach((tp, i) => idx.push({ k: "research", label: `area ${i + 1}`, title: tp.title, hay: `${tp.title} ${tp.desc.map(txt).join(" ")} ${tp.bullets.map(txt).join(" ")}`, href: `#/research#en-topic-${i + 1}`, ctx: `[Research area] ${tp.title}: ${tp.desc.map(txt).join(" ")} ${tp.bullets.map(txt).join("; ")}` }));
    RNEWS.forEach((a, i) => idx.push({ k: "research news", label: "news", title: a.title, hay: `${a.title} ${a.subtitle} ${a.body.map(txt).join(" ")}`, href: `#/news/research-news#rn-${i}`, ctx: `[Research news] ${a.title}${a.subtitle ? " — " + a.subtitle : ""}: ${a.body.map(txt).join(" ").slice(0, 600)}` }));
    (NEWS.press || []).forEach((p) => idx.push({ k: "press", label: p.date, title: p.title, hay: `${p.title} ${p.date}`, href: p.url, ext: true, ctx: `[Press ${p.date}] ${p.title} (${p.url})` }));
    (D.courses || []).forEach((g) => g.levels.forEach((l) => l.courses.forEach((c) => idx.push({ k: "course", label: g.institution, title: c, hay: `${c} ${g.institution} ${l.name}`, href: "#/course", ctx: `[Course] ${c} — ${l.name}, ${g.institution}` }))));
    idx.forEach((x) => x.hay = x.hay.toLowerCase());
    return idx;
  }
  let INDEX = null;
  const SEARCH_STOP = new Set(["알려줘", "알려", "해줘", "뭐야", "무엇", "어떻게", "그리고", "하나", "몇", "편", "있어", "대해", "대해서", "설명", "소개", "what", "how", "many", "the", "and", "tell", "about", "me", "is", "are", "of", "a", "an", "in", "on", "for", "please", "show"]);
  function search(q, limit) {
    if (!INDEX) INDEX = buildIndex();
    const terms = q.toLowerCase().replace(/[?？!.,]/g, " ")
      .replace(/표지\s*논문|커버\s*논문|\bcover\s+(?:articles?|papers?)\b|\bcovers?\b/g, " __cover__ ").replace(/특허/g, " 특허 patent ")
      .split(/\s+/)
      .map((x) => (/[가-힣]{2,}/.test(x) ? x.replace(/(이야|에서|으로|에게|은|는|이|가|을|를|의|도|야|요|와|과|로|에)$/, "") : x))
      .filter((x) => x.length > 1 && !SEARCH_STOP.has(x)); if (!terms.length) return [];
    const scored = [];
    INDEX.forEach((x) => { let s = 0, hits = 0; for (const tm of terms) { if (x.hay.includes(tm)) { hits++; s += (x.title.toLowerCase().includes(tm) ? 3 : 1); } } if (hits && (hits === terms.length || hits >= 2)) scored.push([s + hits * 2, x]); });
    scored.sort((a, b) => b[0] - a[0]);
    return scored.slice(0, limit || 10).map((x) => x[1]);
  }
  const SUG = { ko: ["암모니아 촉매", "수전해", "Cover", "최근 논문", "심준호", "2024 수상", "high entropy"], en: ["ammonia catalyst", "electrolysis", "cover", "recent papers", "Uk Sim", "awards 2024", "high entropy"] };
  const AI_SUG = { ko: ["연구실을 한 줄로 소개해줘", "암모니아 합성 관련 대표 논문 3개 알려줘", "표지 논문은 몇 편이야?", "대학원 지원은 어떻게 해?"], en: ["Summarize the lab in one line", "Top 3 papers on ammonia synthesis?", "How many cover articles?", "How do I apply as a graduate student?"] };
  let chatMode = "ai";
  let aiHistory = [];

  /* ---- resolve a data-ai reference ("pub:158") into an item ---- */
  function resolveItem(ref) {
    if (!ref) return null;
    const i = ref.indexOf(":"); const kind = ref.slice(0, i), id = ref.slice(i + 1);
    const link = (h, txtL) => `[${txtL}](${h})`;
    const pubLine = (p) => `- **${p.title || txt(p.journal_html)}** — ${p.journal}, ${p.year}${p.cover ? " ★cover" : ""}${p.doi ? " · " + link(p.doi, "DOI") : ""}${p.pdf ? " · " + link(p.pdf, "PDF") : ""}`;
    const byPerson = (name) => PUBS.filter((p) => txt(p.authors).toLowerCase().includes(name.toLowerCase())).slice(0, 5);
    switch (kind) {
      case "pub": { const p = PUBS.find((x) => String(x.num) === id); if (!p) return null;
        return { kind, label: `#${p.num} ${p.title}`, href: `#/publication#pub-${p.num}`, q: L2(`논문 #${p.num} "${p.title}"에 대해 설명해줘`, `Tell me about paper #${p.num} "${p.title}"`), ctx: `[Paper #${p.num}] "${p.title}" — ${txt(p.authors)}. ${p.journal}, ${p.year}. ${p.impact || ""}${p.doi ? " DOI: " + p.doi : ""}${p.pdf ? " PDF: " + p.pdf : ""}${p.news && p.news.length ? " Press: " + p.news.map((n) => n.title).join(" / ") : ""}`,
          md: `### ${p.title}\n**${p.journal}** · ${p.year}${p.cover ? " · ★ Cover article" : ""}${p.accepted ? " · Accepted" : ""}\n\n${txt(p.authors)}\n\n${p.impact ? `- ${p.impact}\n` : ""}${p.publisher ? `- ${p.publisher}\n` : ""}${p.doi ? `- ${link(p.doi, "DOI · " + p.doi.replace("https://doi.org/", ""))}\n` : ""}${p.pdf ? `- ${link(p.pdf, L2("📥 PDF 받기", "📥 Get PDF"))}\n` : ""}${p.ack && p.ack.length ? `- Acknowledgment: ${p.ack.map(txt).join(" ")}\n` : ""}${p.news && p.news.length ? `\n${L2("언론 보도", "Press")}:\n${p.news.map((n) => `- ${link(n.url, n.title)}`).join("\n")}\n` : ""}` }; }
      case "research": { const tp = RES.ko_topics[+id]; if (!tp) return null; const tx = topicText(tp);
        return { kind, label: LANG === "en" ? tp.title_en : tp.title_ko, href: `#/research#topic-${+id + 1}`, q: L2(`"${tp.title_ko}" 연구에 대해 설명해줘`, `Explain the research topic "${tp.title_en}"`), ctx: `[Research topic ${+id + 1}] ${tp.title_ko} / ${tp.title_en}: ${tp.desc.map(txt).join(" ")} Directions: ${tp.bullets.map(txt).join("; ")}. Papers: ${tp.papers.map((p) => p.journal + (p.cover ? " (cover)" : "") + (p.url ? " " + p.url : "")).join("; ")}`,
          md: `### ${LANG === "en" ? tp.title_en || tp.title_ko : `${tp.title_ko}\n*${tp.title_en}*`}\n\n${tx.desc.map(txt).join("\n\n")}\n\n${tx.bullets.length ? tx.bullets.map((b) => `- ${txt(b)}`).join("\n") + "\n" : ""}${tp.papers.length ? `\n${L2("대표 논문", "Representative papers")}:\n${tp.papers.slice(0, 8).map((p) => `- ${p.url ? link(p.url, p.journal) : p.journal}${p.cover ? " ★cover" : ""}`).join("\n")}\n` : ""}` }; }
      case "member": { let m = null, grp = ""; MEMBERS.forEach((g) => g.members.forEach((x) => { if (slugify(x.name_en) === id) { m = x; grp = g.title; } })); if (!m) return null; const pubs = byPerson(m.name_en.split(" ").slice(-1)[0] === "Sim" ? m.name_en : m.name_en);
        return { kind, label: m.name_en, href: `#/members#mem-${id}`, q: L2(`${m.name_en}(${m.name_ko || ""}) 연구원에 대해 알려줘`, `Tell me about ${m.name_en}`), ctx: `[Member · ${groupTitle(grp)}] ${dispName(m.name)}: ${m.roles.map(txt).join("; ")}. Papers with this author: ${pubs.map((p) => "#" + p.num + " " + p.title).join(" / ")}`,
          md: `### ${dispName(m.name)}\n${groupTitle(grp)}\n\n${m.roles.map((r) => `- ${txt(r)}`).join("\n")}${m.stats && m.stats.main != null ? `\n- ${L2("주저자", "Main author")} ${m.stats.main} · ${L2("공저자", "Co-author")} ${m.stats.co || 0}` : ""}${pubs.length ? `\n\n${L2("최근 논문", "Recent papers")}:\n${pubs.map(pubLine).join("\n")}` : ""}\n\n${link(`#/members#mem-${id}`, L2("상세 보기 →", "Details →"))}` }; }
      case "award": { const a = AWARDS.find((x) => String(x.num) === id); if (!a) return null;
        return { kind, label: a.headline, href: `#/award#award-${a.num}`, q: L2(`수상 "${a.headline}"에 대해 알려줘`, `Tell me about the award "${a.headline}"`), ctx: `[Award #${a.num}, ${a.year}] ${a.headline} ${a.details.map(txt).join(" ")}`, md: `### ${a.headline}\n${a.year} · #${a.num}\n\n${a.details.map(txt).join("\n\n")}` }; }
      case "patent": { const p = (PATS.registered || []).concat(PATS.applications || []).find((x) => x.status + "-" + x.num === id); if (!p) return null;
        return { kind, label: p.title, href: `#/patent#pat-${id}`, q: L2(`특허 "${p.title}"에 대해 알려줘`, `Tell me about the patent "${p.title}"`), ctx: `[Patent ${p.status} #${p.num}] ${p.title} — ${txt(p.inventors)} ${p.numbers.map((n) => n.text).join("; ")}`, md: `### ${p.title}\n${p.status === "registered" ? L2("등록 특허", "Registered patent") : L2("출원 특허", "Patent application")} · #${p.num}\n\n${L2("발명자", "Inventors")}: ${txt(p.inventors)}\n\n${p.numbers.map((n) => `- ${n.text}`).join("\n")}` }; }
      case "pres": { let it = null, yr = ""; PRES.forEach((y) => y.items.forEach((x) => { if (String(x.num) === id) { it = x; yr = y.year; } })); if (!it) return null;
        return { kind, label: it.text.slice(0, 60), href: `#/presentation#pres-${it.num}`, q: L2(`발표 #${it.num}에 대해 알려줘`, `Tell me about presentation #${it.num}`), ctx: `[Presentation #${it.num}, ${yr}, ${it.type}] ${it.text}`, md: `### ${L2("학회 발표", "Presentation")} #${it.num} · ${yr}\n${it.type ? `*${it.type}*\n\n` : ""}${it.text}` }; }
      case "project": { const p = PROJ[+id]; if (!p) return null;
        return { kind, label: LANG === "en" ? p.title_en || tr(p.title_ko) : p.title_ko, href: "#/project", q: L2(`연구과제 "${p.title_ko}"에 대해 알려줘`, `Tell me about the project "${p.title_en || p.title_ko}"`), ctx: `[Project] ${p.title_ko} (${p.title_en}) ${p.meta.map(txt).join("; ")} ${p.goal} ${p.status} Papers: ${p.papers.map(txt).join(" / ")}`, md: `### ${LANG === "en" ? p.title_en || tr(p.title_ko) : p.title_ko}\n${p.title_en && LANG !== "en" ? `*${p.title_en}*\n\n` : "\n"}${p.meta.map((m) => `- ${txt(m)}`).join("\n")}${p.year ? `\n- ${p.year}` : ""}${p.goal ? `\n- ${p.goal}` : ""}${p.status ? `\n- ${p.status}` : ""}${p.papers.length ? `\n\n${L2("관련 논문", "Papers")}:\n${p.papers.map((x) => `- ${txt(x)}`).join("\n")}` : ""}` }; }
      case "news": { const a = NEWS.articles[+id]; if (!a) return null; return { kind, label: a.title, href: `#/news#news-${id}`, q: L2(`뉴스 "${a.title}" 요약해줘`, `Summarize the news "${a.title}"`), ctx: `[News] ${a.title}: ${a.body.map(txt).join(" ")}`, md: `### ${a.title}\n\n${a.body.map(txt).join("\n\n")}${a.source ? `\n\n${link(a.source, L2("기사 원문 →", "Source →"))}` : ""}` }; }
      case "rnews": { const a = RNEWS[+id]; if (!a) return null; return { kind, label: a.title, href: `#/news/research-news#rn-${id}`, q: L2(`연구 뉴스 "${a.title}" 요약해줘`, `Summarize the research news "${a.title}"`), ctx: `[Research news] ${a.title} ${a.subtitle}: ${a.body.map(txt).join(" ")} ${a.refs.map(txt).join(" ")}`, md: `### ${a.title}\n${a.subtitle ? `*${a.subtitle}*\n\n` : ""}${a.body.map(txt).join("\n\n")}${a.refs.length ? `\n\n${a.refs.map((r) => `- ${txt(r)}`).join("\n")}` : ""}${a.source ? `\n\n${link(a.source, L2("기사 원문 →", "Source →"))}` : ""}` }; }
      case "course": { const g = (D.courses || [])[+id]; if (!g) return null; return { kind, label: g.institution, href: "#/course", q: L2(`${g.institution.replace(/^At\s+/, "")} 강의 목록 알려줘`, `List the courses ${g.institution.toLowerCase()}`), ctx: `[Courses] ${g.institution}: ${g.levels.map((l) => l.name + ": " + l.courses.join(", ")).join(" | ")}`, md: `### ${g.institution}\n\n${g.levels.map((l) => `**${l.name}**\n${l.courses.map((c) => `- ${c}`).join("\n")}`).join("\n\n")}` }; }
      case "professor": return { kind, label: profName(), href: "#/professor", q: L2("심욱 교수님에 대해 소개해줘", "Introduce Prof. Uk Sim"), ctx: labFacts(), md: `### ${profName()}\n${profTitle()} · ${txt(profAffil())}\n\n${profBio().map(txt).join("\n\n")}\n\n- ✉ ${PROF.email || (O.contact || {}).email}\n- ${link("#/professor", L2("프로필 전체 보기 →", "Full profile →"))}` };
      case "stat": { const map = { pubs: [t("stat_pubs"), stats.pubs, "#/publication", L2("최근 논문", "Recent papers"), PUBS.slice(0, 5).map(pubLine).join("\n")], pats: [t("stat_pat"), stats.pats, "#/patent", L2("등록 · 출원", "Registered · applications"), `- ${L2("등록", "Registered")} ${stats.patsReg}\n- ${L2("출원", "Applications")} ${stats.patsApp}`], pres: [t("stat_pres"), stats.pres, "#/presentation", L2("연도별", "By year"), PRES.slice(0, 6).map((y) => `- ${y.year}: ${y.items.length}`).join("\n")], awards: [t("stat_award"), stats.awards, "#/award", L2("최근 수상", "Recent awards"), AWARDS.slice(0, 5).map((a) => `- ${a.year} · ${a.headline}`).join("\n")] }; const m = map[id]; if (!m) return null;
        return { kind, label: m[0], href: m[2], q: L2(`${m[0]} 현황을 알려줘`, `Give me an overview of ${m[0].toLowerCase()}`), ctx: labFacts(), md: `### ${m[0]}: ${m[1]}\n\n${m[3]}:\n${m[4]}\n\n${link(m[2], L2("전체 보기 →", "View all →"))}` }; }
    }
    return null;
  }

  /* ---- offline answer composer (works without any API key) ---- */
  function composeOffline(q, focus) {
    const ql = q.toLowerCase();
    const C = O.contact || {};
    const link = (h, l) => `[${l}](${h})`;
    const pubLine = (p) => `- **${p.title || txt(p.journal_html)}** — ${p.journal}, ${p.year}${p.cover ? " ★cover" : ""}${p.doi ? " · " + link(p.doi, "DOI") : ""}${p.pdf ? " · " + link(p.pdf, "PDF") : ""}`;
    if (focus && focus.md) return focus.md;
    const has = (re) => re.test(ql);
    if (has(/지원|입학|apply|admission|recruit|모집|연락|contact|이메일|e-?mail|주소|address|찾아/)) {
      return `${L2("**지원 · 문의 안내**", "**How to apply / contact**")}\n\n${(HOME.notice || []).map(txt).join("\n\n")}\n\n- ✉ ${C.email}\n- ${L2("소속", "Affiliation")}: ${L2(C.affiliation_ko, C.affiliation_en)}\n- ${L2("주소", "Address")}: ${L2(C.address_ko, C.address_en)}\n- ${link("#/contact", L2("문의 페이지 →", "Contact page →"))}`;
    }
    if (has(/몇 ?편|몇 ?개|몇 ?건|몇 ?명|how many|number of|count|통계|현황/)) {
      return `${L2("**NEEL Lab 현황**", "**NEEL Lab at a glance**")}\n\n- ${t("stat_pubs")}: **${stats.pubs}** (${L2("표지 논문", "cover articles")} ${stats.covers})\n- ${t("stat_pat")}: **${stats.pats}** (${L2("등록", "registered")} ${stats.patsReg} · ${L2("출원", "applications")} ${stats.patsApp})\n- ${t("stat_pres")}: **${stats.pres}**\n- ${t("stat_award")}: **${stats.awards}**\n- ${t("members")}: **${stats.members}** · ${t("alumni")} ${stats.alumni}\n- ${L2("연구 주제", "Research topics")}: ${RES.ko_topics.length} · ${L2("연구 과제", "Projects")}: ${PROJ.length}`;
    }
    if (has(/최근|latest|recent|new(est)?\b/) && has(/논문|paper|publication/)) {
      return `${L2("**최근 논문**", "**Latest papers**")}\n\n${PUBS.slice(0, 6).map(pubLine).join("\n")}\n\n${link("#/publication", L2("전체 논문 →", "All papers →"))}`;
    }
    if (has(/표지|cover/)) {
      const cv = PUBS.filter((p) => p.cover).slice(0, 8);
      return `${L2(`**표지 논문** — 표지 이미지 ${stats.covers}개, 표지 표시 논문 ${PUBS.filter((p) => p.cover).length}편`, `**Cover articles** — ${stats.covers} cover images, ${PUBS.filter((p) => p.cover).length} papers marked as cover`)}\n\n${cv.map(pubLine).join("\n")}\n\n${link("#/publication/cover", L2("표지 갤러리 →", "Cover gallery →"))}`;
    }
    if (has(/교수|professor|심욱|uk sim|pi\b|지도/)) return resolveItem("professor:0").md;
    if (has(/연구 ?분야|연구 ?주제|research (area|topic|field)|무슨 연구|what.*(research|study)|어떤 연구/)) {
      return `${L2("**연구 주제**", "**Research topics**")}\n\n${RES.ko_topics.map((tp, i) => `${i + 1}. ${link("#/research#topic-" + (i + 1), LANG === "en" ? tp.title_en : tp.title_ko)}${tp.papers.some((p) => p.cover) ? " ★" : ""}`).join("\n")}\n\n${(RES.intro || []).map(txt).join(" ")}`;
    }
    if (has(/구성원|members?|who (is|are)|누구|사람|학생|student/)) {
      return `${L2("**현재 구성원**", "**Current members**")}\n\n${currentGroups.map((g) => `**${g.title}**\n${g.members.map((m) => `- ${link("#/members#mem-" + slugify(m.name_en), m.name_en + (m.name_ko ? " (" + m.name_ko + ")" : ""))} — ${txt(m.roles[0] || "")}`).join("\n")}`).join("\n\n")}\n\n${L2("동문", "Alumni")}: ${stats.alumni}${L2("명", "")} · ${link("#/members", L2("구성원 페이지 →", "Members page →"))}`;
    }
    const hits = search(q, 12);
    if (!hits.length) return t("assistant_none");
    const groups = {};
    hits.forEach((h) => { (groups[h.k] = groups[h.k] || []).push(h); });
    const out = [L2(`**"${q}"** 관련 항목 ${hits.length}건을 찾았어요.`, `Found ${hits.length} items related to **"${q}"**.`)];
    Object.keys(groups).forEach((k) => { out.push(`\n**${k}**\n` + groups[k].slice(0, 5).map((h) => `- ${link(h.href, h.title)}${h.doi ? " · " + link(h.doi, "DOI") : ""}${h.pdf ? " · " + link(h.pdf, "PDF") : ""}`).join("\n")); });
    const top = hits[0];
    if (top && top.k === "publication") { const p = PUBS.find((x) => `#/publication#pub-${x.num}` === top.href); if (p) out.push("\n" + resolveItem("pub:" + p.num).md); }
    else if (top && top.k === "research") { const m = top.href.match(/topic-(\d+)/); if (m) out.push("\n" + resolveItem("research:" + (+m[1] - 1)).md); }
    return out.join("\n");
  }

  /* ---- "Ask AI" on page items: hover pill (mouse) + AI tap mode (touch and mouse) ---- */
  let pillRef = null, pillTimer = null, lensOn = false;
  function positionPill(el) { const pill = $("#ai-pill"); const r = el.getBoundingClientRect(); pill.style.left = Math.max(90, Math.min(window.innerWidth - 90, r.left + r.width / 2)) + "px"; pill.style.top = Math.max(60, r.top) + "px"; }
  let lensObs = null;
  function syncLensBadges() {
    if (!lensOn) { $$(".lens-badge").forEach((b) => b.remove()); return; }
    $$("#app [data-ai]").forEach((el) => { if (!el.querySelector(":scope > .lens-badge")) el.insertAdjacentHTML("beforeend", '<span class="lens-badge" aria-hidden="true">✨</span>'); });
  }
  function setLens(on) {
    lensOn = !!on;
    if (!lensObs) lensObs = new MutationObserver(() => requestAnimationFrame(syncLensBadges));
    if (lensOn) lensObs.observe($("#app"), { childList: true, subtree: true }); else lensObs.disconnect();
    syncLensBadges();
    document.body.classList.toggle("ai-lens", lensOn);
    $("#lens-bar").classList.toggle("show", lensOn);
    $("#lens-bar").innerHTML = `<span class="ai-spark">✨</span><span>${L2("궁금한 항목을 탭하면 AI가 설명해 드려요", "Tap any item and AI will explain it")}</span><button id="lens-off">${L2("끄기", "Done")}</button>`;
    $("#lens-off").onclick = () => setLens(false);
    const lt = $("#lens-toggle"); if (lt) lt.classList.toggle("on", lensOn);
    if (lensOn) closeChat();
  }
  function bindPill() {
    const pill = $("#ai-pill"); if (!pill) return;
    // AI tap mode: every [data-ai] item shows a ✨ badge and a tap asks the assistant about it
    document.addEventListener("click", (e) => {
      if (!lensOn || e.target.closest("#chat-panel, #tabbar, #lens-bar, .nav")) return;
      const el = e.target.closest("[data-ai]"); if (!el) return;
      e.preventDefault(); e.stopPropagation();
      el.classList.add("ai-hot"); setTimeout(() => el.classList.remove("ai-hot"), 600);
      askAbout(el.getAttribute("data-ai"));
    }, true);
    if (!window.matchMedia("(hover: hover)").matches) return;
    document.addEventListener("mouseover", (e) => {
      const el = e.target.closest("[data-ai]"); if (!el || lensOn) return;
      if (pillRef && pillRef !== el) pillRef.classList.remove("ai-hot");
      clearTimeout(pillTimer); pillRef = el; el.classList.add("ai-hot");
      $("#ai-pill-text").textContent = (LANG === "en" ? "Ask AI — " : "AI에게 물어보기 — ") + (el.getAttribute("data-ai-label") || "");
      positionPill(el); pill.classList.add("show");
    });
    document.addEventListener("mouseout", (e) => {
      const el = e.target.closest("[data-ai]"); if (!el || el !== pillRef) return;
      if (e.relatedTarget && (el.contains(e.relatedTarget) || pill.contains(e.relatedTarget))) return;
      pillTimer = setTimeout(() => { if (!pill.matches(":hover")) { pill.classList.remove("show"); el.classList.remove("ai-hot"); pillRef = null; } }, 280);
    });
    pill.addEventListener("mouseenter", () => clearTimeout(pillTimer));
    pill.addEventListener("mouseleave", () => { pill.classList.remove("show"); if (pillRef) pillRef.classList.remove("ai-hot"); pillRef = null; });
    pill.addEventListener("click", () => { if (!pillRef) return; const ref = pillRef.getAttribute("data-ai"); pill.classList.remove("show"); pillRef.classList.remove("ai-hot"); askAbout(ref); });
    window.addEventListener("scroll", () => { if (pillRef && pill.classList.contains("show")) positionPill(pillRef); }, { passive: true });
  }
  function askAbout(ref) {
    const item = resolveItem(ref); if (!item) return;
    openChat("ai");
    askAI(item.q, item);
  }

  /* ---- AI config: the shared proxy (deploy/ai-worker) comes from overrides; a personal key lives only in this browser ---- */
  function aiCfg() {
    let local = {}; try { local = JSON.parse(localStorage.getItem("neel-ai") || "{}"); } catch (e) { local = {}; }
    const base = O.ai || {};
    return { key: local.key || "", endpoint: local.endpoint || base.endpoint || "", model: local.model || base.model || "claude-opus-5-5" };
  }
  function aiReady() { const c = aiCfg(); return !!(c.key || c.endpoint); }
  function saveAiCfg(c) { localStorage.setItem("neel-ai", JSON.stringify(c)); }
  // ⚙︎ (personal key / proxy URL) is for lab admins: shown when no shared proxy is set, or after the ✎ editor password
  function isAdmin() { try { return localStorage.getItem("neel-admin") === "1"; } catch (e) { return false; } }

  function buildChat() {
    $("#chat-sub").textContent = chatMode === "ai" ? (aiReady() ? t("ai_note") : L2("내장 답변 모드 · 홈페이지 데이터에서 바로 찾아 답합니다", "Built-in answers from this site's data")) : L2("논문 · 구성원 · 수상 · 특허 · 연구주제 검색", "Search papers · members · awards · patents · topics");
    $("#chat-input").placeholder = chatMode === "ai" ? L2("무엇이든 물어보세요… (예: 표지 논문이 몇 편이야?)", "Ask anything… (e.g. how many cover articles?)") : L2("검색어를 입력하세요…", "Type to search…");
    const sugs = chatMode === "ai" ? (LANG === "en" ? AI_SUG.en : AI_SUG.ko) : (LANG === "en" ? SUG.en : SUG.ko);
    $("#chat-sug").innerHTML = sugs.map((s) => `<button>${esc(s)}</button>`).join("") + (chatMode === "ai" ? `<button class="ghost" id="ai-clear">${t("ai_clear")}</button>` : "");
    $$("#chat-sug button").forEach((b) => b.onclick = () => (b.id === "ai-clear" ? clearChat() : ask(b.textContent)));
    const modes = $("#chat-modes");
    const showSetup = !(O.ai || {}).endpoint || isAdmin();
    modes.innerHTML = `<button class="${chatMode === "search" ? "on" : ""}" data-m="search">🔍 ${t("search_mode")}</button><button class="${chatMode === "ai" ? "on" : ""}" data-m="ai">✨ ${t("ai_mode")}</button>${showSetup ? `<button data-m="setup" title="${t("ai_setup")}">⚙︎</button>` : ""}`;
    $$("#chat-modes button").forEach((b) => b.onclick = () => { if (b.dataset.m === "setup") return openAiSetup(); chatMode = b.dataset.m; buildChat(); });
    const lt = $("#lens-toggle");
    lt.innerHTML = `<span>👆</span>${L2("화면에서 탭해 묻기", "Tap to ask")}`; lt.classList.toggle("on", lensOn);
    lt.onclick = () => setLens(!lensOn);
    const sc = $("#chat-scroll");
    // greeting follows the language until the visitor has actually asked something
    if (!sc.dataset.ready || (sc.dataset.lang !== (LANG || "ko") && !$(".msg.user", sc))) { sc.innerHTML = `<div class="msg bot">${t("assistant_hello")}</div>`; sc.dataset.ready = "1"; }
    sc.dataset.lang = LANG || "ko";
  }
  function clearChat() { aiHistory = []; $("#chat-scroll").innerHTML = `<div class="msg bot">${t("assistant_hello")}</div>`; }
  function hitHTML(h) {
    const dl = (h.pdf ? `<a class="dl" href="${esc(h.pdf)}" target="_blank" rel="noopener">📥 ${t("ai_pdf")}</a>` : "") + (h.doi ? `<a class="dl" href="${esc(h.doi)}" target="_blank" rel="noopener">🔗 ${t("ai_doi")}</a>` : "");
    return `<div class="hit" data-href="${esc(h.href)}" data-ext="${h.ext ? 1 : 0}"><span class="k">${esc(h.k)} · ${esc(h.label)}</span>${esc(h.title)}${dl ? `<div class="dls">${dl}</div>` : ""}</div>`;
  }
  function bindHits(root) {
    $$(".hit", root).forEach((el) => el.onclick = (e) => { if (e.target.closest("a.dl")) return; const href = el.dataset.href; if (el.dataset.ext === "1") window.open(href, "_blank"); else { closeChat(); location.hash = href; if (location.hash === href) render(); } });
  }
  function ask(q) {
    q = q.trim(); if (!q) return;
    $("#chat-input").value = "";
    if (chatMode === "ai") return askAI(q);
    const sc = $("#chat-scroll");
    sc.insertAdjacentHTML("beforeend", `<div class="msg user">${esc(q)}</div>`);
    const hits = search(q);
    const html = hits.length ? `${t("assistant_found")}${hits.map(hitHTML).join("")}` : t("assistant_none");
    sc.insertAdjacentHTML("beforeend", `<div class="msg bot">${html}</div>`);
    bindHits(sc); sc.scrollTop = sc.scrollHeight;
  }

  /* ---- markdown-lite renderer for AI answers ---- */
  function md(s) {
    let h = esc(s);
    h = h.replace(/```([\s\S]*?)```/g, (_, c) => `<pre>${c}</pre>`);
    h = h.replace(/`([^`]+)`/g, "<code>$1</code>");
    h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    h = h.replace(/(^|[\s(])((https?:\/\/)[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
    h = h.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/(^|\s)\*([^*\n]+)\*/g, "$1<i>$2</i>");
    const lines = h.split("\n"); let out = "", inList = null;
    const closeList = () => { if (inList) { out += `</${inList}>`; inList = null; } };
    lines.forEach((ln) => {
      const m1 = ln.match(/^\s*[-•*]\s+(.*)$/), m2 = ln.match(/^\s*\d+[.)]\s+(.*)$/), m3 = ln.match(/^\s*#{1,3}\s+(.*)$/);
      if (m1) { if (inList !== "ul") { closeList(); out += "<ul>"; inList = "ul"; } out += `<li>${m1[1]}</li>`; }
      else if (m2) { if (inList !== "ol") { closeList(); out += "<ol>"; inList = "ol"; } out += `<li>${m2[1]}</li>`; }
      else if (m3) { closeList(); out += `<h4>${m3[1]}</h4>`; }
      else if (!ln.trim()) { closeList(); out += "<br>"; }
      else { closeList(); out += `<p>${ln}</p>`; }
    });
    closeList();
    return out.replace(/(<br>){2,}/g, "<br>");
  }
  function labFacts() {
    const C = O.contact || {};
    return [
      `Lab: ${(O.brand || {}).full || "NEEL Laboratory"} (Nanomaterials for Energy & Environment Laboratory), ${C.affiliation_en || ""}. PI: ${profName()}, ${PROF.title || ""}. Email: ${C.email || ""}. Address: ${C.address_en || ""}. Website source: ${C.google_site || ""}.`,
      `Numbers: ${stats.pubs} peer-reviewed papers (latest #${PUBS[0] ? PUBS[0].num : ""}: "${PUBS[0] ? PUBS[0].title : ""}", ${PUBS[0] ? PUBS[0].journal + " " + PUBS[0].year : ""}), ${stats.covers} journal covers, ${stats.patsReg} registered + ${stats.patsApp} pending patents, ${stats.pres} presentations, ${stats.awards} awards/scholarships, ${stats.members} current members and ${stats.alumni} alumni, ${RES.ko_topics.length} research topics, ${PROJ.length} projects.`,
      `Cover articles (journal covers, most recent first): ${PUBS.filter((p) => p.cover).slice(0, 6).map((p) => `#${p.num} "${p.title}" (${p.journal}, ${p.year}${p.doi ? ", " + p.doi : ""})`).join("; ")}.`,
      `Research topics: ${RES.ko_topics.map((tp, i) => `${i + 1}. ${tp.title_ko} (${tp.title_en})`).join("; ")}.`,
      `Current members: ${currentGroups.map((g) => g.title + ": " + g.members.map((m) => m.name_en + (m.name_ko ? "(" + m.name_ko + ")" : "")).join(", ")).join(" | ")}.`,
      `Recruiting notice: ${(HOME.notice || []).map(txt).join(" ")}`,
      `PI bio: ${(PROF.bio || []).map(txt).join(" ")}`,
    ].join("\n");
  }
  async function askAI(q, focus) {
    const sc = $("#chat-scroll");
    sc.insertAdjacentHTML("beforeend", `<div class="msg user">${esc(q)}</div>`);
    const hits = search(focus ? focus.label + " " + q : q, 14);
    if (!aiReady()) {
      const bubble = document.createElement("div"); bubble.className = "msg bot ai"; sc.appendChild(bubble);
      const ans = composeOffline(q, focus);
      const related = hits.slice(0, 4);
      bubble.innerHTML = md(ans) + (related.length ? `<div class="rel"><span class="k">${t("ai_related")}</span>${related.map(hitHTML).join("")}</div>` : "") +
        `<div class="tools"><button class="mini" data-save>📄 ${t("ai_save_answer")}</button>${focus && focus.href ? `<a class="mini" href="${esc(focus.href)}" data-go>${L2("페이지에서 보기 →", "Open on page →")}</a>` : ""}<span class="offline-note">${L2("내장 답변", "Built-in answer")}</span></div>`;
      bindHits(bubble); bindAnswerTools(bubble, q, ans, related);
      sc.scrollTop = sc.scrollHeight; return;
    }
    const recent = PUBS.slice(0, 5).map((p) => `[Paper #${p.num}] "${p.title}" — ${p.journal}, ${p.year}${p.doi ? " DOI: " + p.doi : ""}`).join("\n");
    const context = labFacts() + (focus ? "\n\nItem the user is asking about:\n" + focus.ctx : "") + "\n\nMost recent papers:\n" + recent + (hits.length ? "\n\nRelevant items for this question:\n" + hits.map((h) => h.ctx).join("\n") : "");
    const system = `You are the friendly assistant of the NEEL Lab website (Prof. Uk Sim, SKKU SAINT). Answer using ONLY the site data given in the user's <site_data> block; if something is not there, say you don't have that information and suggest where to look (a page of the site or the email ${(O.contact || {}).email || ""}). Reply in the language of the question (Korean or English). Be concise and well-formatted: short paragraphs, bullet lists for multiple items, bold for key names. When you cite a paper, give its title, journal, year and any DOI/PDF link as a markdown link. Never invent papers, numbers, names or links.`;
    const bubble = document.createElement("div"); bubble.className = "msg bot ai"; bubble.innerHTML = `<span class="typing"><i></i><i></i><i></i></span>`;
    sc.appendChild(bubble); sc.scrollTop = sc.scrollHeight;
    const userMsg = `<site_data>\n${context}\n</site_data>\n\nQuestion: ${q}`;
    const messages = aiHistory.slice(-8).concat([{ role: "user", content: userMsg }]);
    let answer = "", stop = "", note = "", sources = [];
    try {
      await streamClaude({ system, messages, onText: (tx) => { answer += tx; bubble.innerHTML = md(answer); sc.scrollTop = sc.scrollHeight; }, onStop: (s) => { stop = s; },
        onStatus: (st) => { if (!answer) { bubble.innerHTML = `<span class="status">${esc(st)}</span> <span class="typing"><i></i><i></i><i></i></span>`; sc.scrollTop = sc.scrollHeight; } },
        onSources: (items) => { sources = sources.concat(items).filter((x, i, a) => x.url && a.findIndex((y) => y.url === x.url) === i).slice(0, 8); } });
      if (stop === "refusal" && !answer) answer = t("ai_refused");
      if (!answer) answer = t("assistant_none");
      aiHistory.push({ role: "user", content: q }, { role: "assistant", content: answer });
    } catch (e) {
      // quota / network trouble: never leave the visitor with an error — fall back to the built-in answer
      console.warn("[NEEL AI]", e);
      if (!answer) answer = composeOffline(q, focus);
      note = e && e.status === 429 ? L2("질문이 많아 잠시 내장 답변으로 대신했어요. 1분 뒤 다시 시도해 주세요.", "Lots of questions right now — showing a built-in answer. Try again in a minute.") : L2("AI 연결이 원활하지 않아 내장 답변으로 대신했어요.", "AI is unavailable right now — showing a built-in answer.");
    }
    const related = hits.slice(0, 4);
    const srcHTML = sources.length ? `<div class="sources"><span class="k">${L2("웹 출처", "Web sources")}</span>${sources.map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener" title="${esc(x.url)}">${esc(x.title || x.url)}</a>`).join("")}</div>` : "";
    bubble.innerHTML = md(answer) + srcHTML + (related.length ? `<div class="rel"><span class="k">${t("ai_related")}</span>${related.map(hitHTML).join("")}</div>` : "") +
      `<div class="tools"><button class="mini" data-save>📄 ${t("ai_save_answer")}</button>${focus && focus.href ? `<a class="mini" href="${esc(focus.href)}" data-go>${L2("페이지에서 보기 →", "Open on page →")}</a>` : ""}${note ? `<span class="offline-note">${note}</span>` : ""}</div>`;
    bindHits(bubble); bindAnswerTools(bubble, q, answer, related);
    sc.scrollTop = sc.scrollHeight;
  }
  function bindAnswerTools(bubble, q, answer, related) {
    const sv = $("[data-save]", bubble); if (sv) sv.onclick = () => { const blob = new Blob([`# NEEL Lab AI\n\n**Q:** ${q}\n\n${answer}\n\n---\n${related.map((h) => `- ${h.title}${h.doi ? " " + h.doi : ""}${h.pdf ? " " + h.pdf : ""}`).join("\n")}\n`], { type: "text/markdown" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "neel-answer.md"; a.click(); };
    const go = $("[data-go]", bubble); if (go) go.onclick = (e) => { e.preventDefault(); const href = go.getAttribute("href"); closeChat(); location.hash = href; if (location.hash === href) render(); };
    $$(".msg.ai a[href^='#/']", bubble).forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); const href = a.getAttribute("href"); closeChat(); location.hash = href; if (location.hash === href) render(); }));
  }
  /* Raw Messages-API streaming (this is a no-build static site, so no SDK bundle).
     Direct-from-browser calls need the `anthropic-dangerous-direct-browser-access` header;
     with a proxy endpoint (deploy/cloudflare-worker.js) the key never reaches the browser. */
  async function streamClaude({ system, messages, onText, onStop, onStatus, onSources, maxTokens }) {
    const c = aiCfg();
    const body = { model: c.model || "claude-opus-5-5", max_tokens: maxTokens || 4096, stream: true, system, messages, output_config: { effort: "low" }, fallbacks: "default" };
    const url = c.endpoint || "https://api.anthropic.com/v1/messages";
    const headers = { "Content-Type": "application/json" };
    if (!c.endpoint) { headers["x-api-key"] = c.key; headers["anthropic-version"] = "2023-06-01"; headers["anthropic-dangerous-direct-browser-access"] = "true"; headers["anthropic-beta"] = "server-side-fallback-2026-07-01"; }
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) { let msg = res.status + " " + res.statusText; try { const j = await res.json(); msg = (j.error && j.error.message) || msg; } catch (e) {} const err = new Error(msg); err.status = res.status; throw err; }
    const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n\n")) >= 0) {
        const chunk = buf.slice(0, idx); buf = buf.slice(idx + 2);
        const dataLine = chunk.split("\n").find((l) => l.startsWith("data:")); if (!dataLine) continue;
        let ev; try { ev = JSON.parse(dataLine.slice(5).trim()); } catch (e) { continue; }
        if (ev.type === "content_block_delta" && ev.delta && ev.delta.type === "text_delta") onText(ev.delta.text);
        else if (ev.type === "status" && onStatus) onStatus(ev.text);
        else if (ev.type === "sources" && onSources) onSources(ev.items || []);
        else if (ev.type === "content_block_start" && ev.content_block && ev.content_block.type === "server_tool_use" && onStatus) onStatus(L2("🔎 웹 검색 중…", "🔎 Searching the web…"));
        else if (ev.type === "content_block_start" && ev.content_block && ev.content_block.type === "web_search_tool_result" && Array.isArray(ev.content_block.content) && onSources) onSources(ev.content_block.content.filter((x) => x.url).map((x) => ({ title: x.title, url: x.url })));
        else if (ev.type === "message_delta" && ev.delta && ev.delta.stop_reason && onStop) onStop(ev.delta.stop_reason);
        else if (ev.type === "error") throw new Error((ev.error && ev.error.message) || "stream error");
      }
    }
  }
  function openAiSetup() {
    const c = aiCfg();
    const sc = $("#chat-scroll");
    const old = $("#ai-setup", sc); if (old) old.remove();
    sc.insertAdjacentHTML("beforeend", `<div class="msg bot setup" id="ai-setup"><b>${t("ai_setup")}</b>
      <label>${t("ai_key")}</label><input type="password" id="ai-key" value="${esc(c.key)}" placeholder="sk-ant-…" autocomplete="off">
      <label>${t("ai_endpoint")}</label><input type="text" id="ai-ep" value="${esc(c.endpoint)}" placeholder="https://xxx.workers.dev">
      <label>${t("ai_model")}</label><select id="ai-model">${["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-4-5"].map((m) => `<option ${c.model === m ? "selected" : ""}>${m}</option>`).join("")}</select>
      <div class="tools"><button class="mini pri" id="ai-save">${t("ai_save")}</button><button class="mini" id="ai-test">${t("ai_test")}</button></div>
      <small class="muted">${L2("키는 이 브라우저(localStorage)에만 저장되며 파일이나 서버로 전송되지 않습니다. 방문자용 AI는 deploy/ai-worker 프록시가 담당합니다.", "The key is stored only in this browser (localStorage) and never written to files. Visitors use the shared deploy/ai-worker proxy.")}</small></div>`);
    sc.scrollTop = sc.scrollHeight;
    const collect = () => ({ key: $("#ai-key").value.trim(), endpoint: $("#ai-ep").value.trim(), model: $("#ai-model").value });
    $("#ai-save").onclick = () => { saveAiCfg(collect()); toast(t("saved")); if (aiReady()) { chatMode = "ai"; buildChat(); } $("#ai-setup").remove(); };
    $("#ai-test").onclick = async () => { saveAiCfg(collect()); const b = $("#ai-test"); b.textContent = "…"; try { let got = ""; await streamClaude({ system: "Reply with OK.", messages: [{ role: "user", content: "ping" }], onText: (x) => { got += x; }, maxTokens: 16 }); b.textContent = t("ai_ok"); toast(t("ai_ok") + " " + got.slice(0, 20)); } catch (e) { b.textContent = t("ai_fail"); toast(t("ai_fail") + ": " + e.message); } };
  }
  function openChat(mode) {
    if (mode && mode !== chatMode) { chatMode = mode; buildChat(); }
    $("#chat-panel").classList.add("show"); $("#chat-toggle").classList.add("open"); document.body.classList.add("chat-open");
    // phones: don't throw the keyboard over the suggestions; desktop: ready to type
    if (window.matchMedia("(hover: hover)").matches) setTimeout(() => $("#chat-input").focus(), 200);
  }
  function closeChat() { $("#chat-panel").classList.remove("show"); $("#chat-toggle").classList.remove("open"); document.body.classList.remove("chat-open"); }

  /* ---- phone tab bar (Home · Research · ✨AI · Papers · Members) ---- */
  const TAB_ICONS = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    research: '<path d="M9 3h6"/><path d="M10 3v6l-5.4 9.6A1.6 1.6 0 0 0 6 21h12a1.6 1.6 0 0 0 1.4-2.4L14 9V3"/><path d="M7.5 15h9"/>',
    publication: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h6"/>',
    members: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2A4.5 4.5 0 0 1 21 18.5"/>',
    ai: '<path d="M12 3l1.9 4.9L19 9.8l-5.1 1.9L12 16.6l-1.9-4.9L5 9.8l5.1-1.9z"/><path d="M18.5 15l.8 2.1 2.2.9-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.9z"/>',
  };
  function buildTabbar() {
    const ic = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${TAB_ICONS[k]}</svg>`;
    const tab = (slug, key) => `<a href="#/${slug}" class="tab" data-slug="${slug}">${ic(key)}<span>${esc(t(key))}</span></a>`;
    $("#tabbar").innerHTML = tab("", "home") + tab("research", "research") +
      `<button class="tab tab-ai" id="tab-ai" aria-label="AI"><span class="ai-orb">${ic("ai")}</span><span>AI</span></button>` +
      tab("publication", "publication") + tab("members", "members");
    $("#tab-ai").onclick = () => ($("#chat-panel").classList.contains("show") ? closeChat() : openChat("ai"));
    $$("#tabbar a.tab").forEach((a) => a.addEventListener("click", () => { closeChat(); if (a.getAttribute("href") === location.hash || (a.dataset.slug === "" && !parseHash().slug)) window.scrollTo({ top: 0, behavior: "smooth" }); }));
    setActiveTab(currentSlug || "");
  }
  function setActiveTab(slug) {
    $$("#tabbar a.tab").forEach((a) => { const s = a.dataset.slug; a.classList.toggle("active", s === "" ? !slug || slug === "home" : slug === s || slug.startsWith(s + "/")); });
  }
  function bindChat() {
    $("#chat-toggle").onclick = () => ($("#chat-panel").classList.contains("show") ? closeChat() : openChat());
    $("#chat-close").onclick = closeChat;
    $("#chat-send").onclick = () => ask($("#chat-input").value);
    $("#chat-input").addEventListener("keydown", (e) => { if (e.key === "Enter") ask($("#chat-input").value); });
    document.addEventListener("keydown", (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openChat(); } if (e.key === "Escape" && $("#chat-panel").classList.contains("show")) closeChat(); });
    bindPill();
  }

  /* ================================================================
     EDITOR for design texts (data/overrides.js)
     ================================================================ */
  const FIELDS = [
    ["hero", "chip_ko", "Hero chip (KO)"], ["hero", "chip_en", "Hero chip (EN)"],
    ["hero", "line1_ko", "Hero line 1 (KO)"], ["hero", "line1_en", "Hero line 1 (EN)"],
    ["hero", "line2_ko", "Hero line 2 (KO)"], ["hero", "line2_en", "Hero line 2 (EN)"],
    ["hero", "tagline_ko", "Tagline (KO)", "ta"], ["hero", "tagline_en", "Tagline (EN)", "ta"],
    ["philosophy", "title1_ko", "Philosophy title 1 (KO)"], ["philosophy", "title1_en", "Philosophy title 1 (EN)"],
    ["philosophy", "title2_ko", "Philosophy title 2 (KO)"], ["philosophy", "title2_en", "Philosophy title 2 (EN)"],
    ["philosophy", "body_ko", "Philosophy body (KO)", "ta"],
    ["contact", "email", "Email"], ["contact", "google_site", "Google Site URL"],
    ["contact", "affiliation_ko", "Affiliation (KO)"], ["contact", "affiliation_en", "Affiliation (EN)"],
    ["contact", "address_ko", "Address (KO)"], ["contact", "address_en", "Address (EN)"],
    ["brand", "name", "Brand name"], ["brand", "org", "Organization"],
    ["professor", "title_ko", "교수 직함 (KO)"], ["professor", "affiliation_ko", "교수 소속 (KO)"], ["professor", "bio_ko", "교수 소개 (KO · 빈 줄로 문단 구분)", "ta"],
    ["ai", "endpoint", "AI proxy URL (shared with all visitors · deploy/ai-worker)"], ["ai", "model", "Model for a personal API key in ⚙︎ (claude-opus-5-5 / claude-sonnet-5-5 / claude-haiku-4-5)"],
  ];
  function openEditor() {
    const pw = prompt(t("pw")); if (pw == null) return;
    if (pw !== (OV_DEFAULT.editor_password || "neel")) { toast(t("wrong_pw")); return; }
    try { localStorage.setItem("neel-admin", "1"); } catch (e) {}
    const sheet = $("#edit-sheet");
    sheet.innerHTML = `<h3>${t("edit_title")}</h3><p class="desc">${t("edit_desc")}</p>
      ${FIELDS.map(([g, k, label, ta]) => `<label>${esc(label)}</label>${ta ? `<textarea data-g="${g}" data-k="${k}">${esc(Array.isArray((O[g] || {})[k]) ? (O[g] || {})[k].join("\n\n") : ((O[g] || {})[k] || ""))}</textarea>` : `<input data-g="${g}" data-k="${k}" value="${esc((O[g] || {})[k] || "")}">`}`).join("")}
      <div class="actions"><button class="btn btn-ghost" id="ed-reset">${t("reset")}</button><button class="btn btn-ghost" id="ed-apply">${t("apply")}</button><button class="btn btn-ghost" id="ed-dl">${t("download")}</button><button class="btn btn-pri" id="ed-save">${t("save_file")}</button><button class="btn btn-ghost" id="ed-close">${t("close")}</button></div>`;
    $("#edit-panel").classList.add("show");
    const collect = () => { const out = JSON.parse(JSON.stringify(OV_DEFAULT)); $$("[data-g]", sheet).forEach((el) => { out[el.dataset.g] = out[el.dataset.g] || {}; out[el.dataset.g][el.dataset.k] = el.value; }); return out; };
    const fileText = (obj) => `/* NEEL Lab website · 사이트 설정 (홈페이지 ✎ 편집기로 저장됨 ${new Date().toISOString().slice(0, 16)}) */\nwindow.NEEL_OVERRIDES = ${JSON.stringify(obj, null, 2)};\n`;
    $("#ed-close").onclick = () => $("#edit-panel").classList.remove("show");
    $("#edit-bg").onclick = () => $("#edit-panel").classList.remove("show");
    $("#ed-reset").onclick = () => { localStorage.removeItem("neel-overrides-draft"); O = mergeOverrides(); rerenderAll(); $("#edit-panel").classList.remove("show"); };
    $("#ed-apply").onclick = () => { const obj = collect(); localStorage.setItem("neel-overrides-draft", JSON.stringify(obj)); O = mergeOverrides(); rerenderAll(); toast(t("applied")); };
    $("#ed-dl").onclick = () => { const obj = collect(); const blob = new Blob([fileText(obj)], { type: "text/javascript" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "overrides.js"; a.click(); toast(t("downloaded")); };
    $("#ed-save").onclick = async () => {
      const obj = collect();
      if (!window.showDirectoryPicker) { $("#ed-dl").click(); return; }
      try {
        toast(t("pick_folder"));
        const dir = await window.showDirectoryPicker({ mode: "readwrite" });
        const dataDir = await dir.getDirectoryHandle("data", { create: true });
        const fh = await dataDir.getFileHandle("overrides.js", { create: true });
        const w = await fh.createWritable(); await w.write(fileText(obj)); await w.close();
        localStorage.removeItem("neel-overrides-draft"); window.NEEL_OVERRIDES = obj; Object.assign(OV_DEFAULT, obj); O = mergeOverrides(); rerenderAll();
        toast(t("saved")); $("#edit-panel").classList.remove("show");
      } catch (e) { if (e && e.name !== "AbortError") { console.warn(e); $("#ed-dl").click(); } }
    };
  }
  function rerenderAll() { buildNav(); buildFooter(); render(); }
  let toastTimer = null;
  function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2800); }

  /* ================================================================
     BOOT
     ================================================================ */
  function boot() {
    const qpLang = new URLSearchParams(location.search).get("lang");
    if (qpLang === "ko" || qpLang === "en") { LANG = qpLang; try { localStorage.setItem("neel-lang", LANG); } catch (e) {} }
    document.documentElement.lang = LANG || "ko";
    applyLang();
    document.addEventListener("mousemove", (e) => { const el = e.target.closest && e.target.closest(".lg, .card, .rc, .stat-card"); if (!el) return; const r = el.getBoundingClientRect(); el.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%"); el.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%"); });
    let pTick = false;
    window.addEventListener("scroll", () => { if (pTick) return; pTick = true; requestAnimationFrame(() => { const y = window.scrollY; $$(".page-hero .blob, .home-hero .blob").forEach((b, i) => { b.style.transform = `translate3d(0, ${y * (((i % 3) + 1) * 0.05)}px, 0)`; }); pTick = false; }); }, { passive: true });
    bindLightbox(); bindChat();
    buildNav(); buildFooter(); buildChat(); buildTabbar();
    window.addEventListener("hashchange", () => { const { slug } = parseHash(); if (slug !== currentSlug) render(); else { scrollToHashAnchor(); setActiveNav(slug); } });
    render();
    if (!LANG) { $("#lang-modal").classList.remove("hide"); $$(".lang-choice").forEach((b) => b.onclick = () => setLang(b.dataset.lang)); }
    else $("#lang-modal").style.display = "none";
    const askQ = new URLSearchParams(location.search).get("ask");
    if (askQ) setTimeout(() => { chatMode = "ai"; buildChat(); openChat(); ask(askQ); }, 300);
    document.addEventListener("click", (e) => { const a = e.target.closest("a[href^='#']"); if (!a) return; const href = a.getAttribute("href"); if (href.startsWith("#/")) return; if (href.length < 2) return; const el = document.getElementById(href.slice(1)); if (el) { e.preventDefault(); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 76, behavior: "smooth" }); } });
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
