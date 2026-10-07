# NEEL Lab 홈페이지 (새 디자인 · 구글 사이트 미러)

성균관대 NEEL(Nanomaterials for Energy & Environment Laboratory) 연구실 홈페이지입니다.
기존 구글 사이트(https://sites.google.com/view/uksim)의 **모든 페이지·글·사진**을 그대로 가져와
Apple 리퀴드 글래스 디자인으로 보여줍니다. 서버·빌드 도구 없이 `index.html` 하나로 동작합니다.

```
NEEL-Website/
├─ index.html              ← 홈페이지 (더블클릭하면 바로 열림)
├─ assets/css/neel.css     ← 디자인 시스템
├─ assets/js/app.js        ← 화면 구성 (라우터 · 각 페이지 · 검색/AI · 편집기)
├─ assets/img/             ← 구글 사이트 사진 626장 (자동 최적화: 최대 1600px · JPEG) + neel-logo.svg
├─ data/content.js         ← 구글 사이트에서 읽어온 모든 데이터 (자동 생성 · 손으로 고치지 마세요)
├─ data/content.json       ← 같은 내용(JSON)     data/images.json ← 사진 매핑(증분 동기화용)
├─ data/overrides.js       ← 디자인 문구 · 연락처 · AI 프록시 주소 ← 직접 편집 가능
├─ sync/sync_site.py       ← 구글 사이트 → 이 폴더 동기화 스크립트
├─ sync.command / sync.bat ← (맥 / 윈도우) 더블클릭 동기화
├─ deploy/cloudflare-worker.js ← AI 어시스턴트를 모든 방문자에게 여는 프록시(선택)
└─ .github/workflows/sync.yml  ← GitHub에 올리면 6시간마다 자동 동기화
```

---

## 1. 보는 방법 · 공유하는 방법
- `index.html` 을 더블클릭하면 바로 열립니다 (Chrome · Safari · Edge · Firefox, 맥/윈도우 모두).
- **다른 사람에게 보낼 때는 폴더 전체(또는 `NEEL-Website.zip`)를 보내세요.** 압축을 풀고 `index.html` 을 열면 모든 기능이 그대로 동작합니다(인터넷 없이도 열림 · AI 모드만 인터넷 필요).
- 주소 뒤의 `#/...` 로 페이지가 바뀝니다. 예) `index.html#/publication`, `#/members`, `#/neelstagram`
- 우측 상단 `KO / EN` 으로 언어(메뉴·안내문)를 바꿉니다. 첫 방문 시 언어 선택 화면이 나옵니다.
- 우측 하단 🔍 버튼(또는 ⌘K / Ctrl+K)으로 **검색** 또는 **✨AI 모드**(아래 4장)로 질문합니다.

## 2. 내용 편집 → **구글 사이트에서 하던 대로** 편집하고, 동기화 한 번
> "보이는 건 새 디자인, 편집은 예전 구글 사이트에서" — 이 폴더는 구글 사이트를 **비추는 거울**입니다.

1. 구글 사이트(https://sites.google.com/view/uksim)에서 평소처럼 글·사진을 추가/수정하고 **게시(Publish)** 합니다.
2. **`sync.command`** (맥) 또는 **`sync.bat`** (윈도우)를 더블클릭합니다. (터미널: `python3 sync/sync_site.py`)
   - 15개 페이지를 읽고 새 사진만 내려받아 자동 최적화합니다 (보통 10~30초, 처음엔 3~4분).
3. `index.html` 을 새로고침하면 반영됩니다. 끝.

자동으로 따라오는 것들
- 논문·특허·발표·수상 **개수**: 페이지 제목과 홈 화면 숫자는 데이터의 최신 번호(예: 논문 #158, 수상 #70)에서 계산되므로 항목이 늘면 저절로 바뀝니다.
- **#NEELstagram**: 게시물 글에 적힌 날짜(`2024.11.24`, `25.08.15`, `2019. 5. 15` …)를 읽어 **최신순으로 자동 정렬**하고 연도별로 묶습니다. 날짜가 없는 게시물은 바로 위 게시물의 날짜를 이어받고(`~2024.11`처럼 표시), 첫 날짜 앞에 있는 최신 글은 "최근"으로 묶입니다.
- 구글 사이트에 **새 페이지**를 만들면 메뉴 "더보기"에 자동으로 나타납니다(전용 디자인이 없는 페이지는 원본 문단·사진 구조 그대로 표시).

필요한 것: Python 3(맥 기본 설치), 인터넷. `beautifulsoup4`·`lxml`·`pillow` 가 없으면 처음 실행 때 자동 설치를 시도합니다.
수동 설치: `python3 -m pip install --user beautifulsoup4 lxml pillow`

| 명령 | 설명 |
|---|---|
| `python3 sync/sync_site.py` | 증분 동기화 (기본) |
| `python3 sync/sync_site.py --full` | 사진을 전부 다시 내려받음 (사진을 교체했는데 반영이 안 될 때) |
| `python3 sync/sync_site.py --site URL --out 폴더` | 다른 구글 사이트/폴더에 적용 |

왜 사진을 미리 내려받나요? 구글 사이트의 사진 주소(`lh3.googleusercontent.com/sitesv/...`)는 페이지를 열 때마다 새로 발급되는
**단기 서명 링크**라서 몇 분 뒤 403 오류가 납니다. 그래서 동기화 때 사진을 `assets/img/` 에 저장하고 홈페이지는 그 파일을 씁니다.

## 3. 디자인 문구(슬로건·연락처) 편집
구글 사이트에 없는 문구 — 첫 화면 슬로건, 철학 문단, 주소, 이메일, AI 프록시 주소 — 는 두 가지 방법으로 바꿉니다.
- 교수 소개(한국어 문단·직함·소속)와 연구 주제 영문 설명도 여기(`professor`, `research_en`)에 있습니다. 구글 사이트에 영문/한글 원문이 없는 부분만 보완한 것입니다.
- **홈페이지에서**: 맨 아래 푸터의 `✎` → 비밀번호(`neel`, `data/overrides.js` 에서 변경) → 수정 →
  **"파일로 저장"**(Chrome/Edge: 폴더 선택 창에서 `NEEL-Website` 폴더를 고르면 `data/overrides.js` 에 바로 저장) 또는 **"다운로드"** 후 덮어쓰기.
- **파일에서**: `data/overrides.js` 를 메모장/VS Code 로 열어 값만 고칩니다.

## 4. AI 어시스턴트 (Claude) · 마우스 올리면 "AI에게 물어보기"
- 논문·연구주제·구성원·수상·특허·발표·과제·뉴스 카드에 **마우스를 올리면 ✨ "AI에게 물어보기 — 항목명" 말풍선**이 뜨고, 누르면 바로 그 항목에 대한 답을 보여줍니다.
- 키가 없어도 **내장 답변 모드**로 동작합니다(항목 요약·통계·최근 논문·구성원·지원 안내 등 사이트 데이터 기반). ⚙︎에서 Claude 를 연결하면 자연어로 자유롭게 답합니다.
- 주소에 `?ask=질문` 을 붙이면 열자마자 질문합니다. 예) `index.html?ask=표지 논문 몇 편이야`

## 4-1. Claude 연결
검색 패널의 **✨AI** 모드는 이 홈페이지의 데이터(논문·구성원·수상·특허·연구주제·뉴스)를 근거로 자유로운 질문에 답하고,
관련 논문의 **DOI / PDF 바로 받기** 링크와 **답변 저장(.md)** 버튼을 함께 보여줍니다. 모델은 Claude Opus 5(`claude-opus-5`, 정책 거절 시 자동 대체 모델 사용).

두 가지 사용 방식
1. **내 브라우저에서만** — ⚙︎ → Anthropic API 키 입력 → 저장. 키는 이 브라우저의 localStorage 에만 저장되고 파일/서버로 전송되지 않습니다.
2. **모든 방문자에게 열기(권장)** — `deploy/cloudflare-worker.js` 를 Cloudflare Workers(무료)에 5분 만에 배포하고, 그 주소를 `data/overrides.js` 의 `ai.endpoint` 에 적습니다. 방문자는 키 없이 AI를 쓰고, 키는 워커에만 보관됩니다. (파일 상단의 설치 순서 참고)

## 5. 인터넷에 올리기 · 도메인 연결 → **자세한 순서는 `deploy/GITHUB.md`** (초보자용 15분 가이드)
정적 파일이라 어디든 올릴 수 있습니다.
- **GitHub Pages** (무료, 추천): 이 폴더를 저장소에 올리고 Settings → Pages → Branch: main → 주소 `https://<계정>.github.io/<저장소>/`.
  `.github/workflows/sync.yml` 이 포함되어 있어 **6시간마다 구글 사이트를 자동 동기화**해 반영합니다(Actions 탭에서 즉시 실행도 가능).
  도메인 연결: Settings → Pages → Custom domain 에 `lab.example.com` 입력 + DNS 에 CNAME(`<계정>.github.io`) 추가.
- **Netlify / Cloudflare Pages / Vercel**: 폴더를 드래그해 올리면 끝. 커스텀 도메인은 각 서비스의 Domain 설정에서 연결.
- **학교 서버**: 폴더 통째로 업로드(서버 설정 필요 없음).

## 6. 문제 해결
- 사진이 안 보임 → `python3 sync/sync_site.py --full`
- `ModuleNotFoundError: bs4` → `python3 -m pip install --user beautifulsoup4 lxml pillow`
- AI 모드 "연결 실패" → 키가 올바른지, 인터넷이 되는지 확인. 프록시를 쓰면 워커에 `ANTHROPIC_API_KEY` 시크릿이 설정됐는지 확인.
- 동기화 후 특정 페이지 레이아웃이 이상함 → 구글 사이트에서 문단 구조가 크게 바뀐 경우입니다. 전용 디자인이 있는 페이지는
  `sync/sync_site.py` 의 `parse_*` 함수가 해석하며, 실패해도 원본 구조 그대로(`pages`) 보여주므로 내용이 사라지지는 않습니다.
- 편집기 "파일로 저장"이 안 됨 → Safari/Firefox 는 폴더 쓰기를 지원하지 않습니다. "다운로드" 후 덮어쓰세요.

## 7. 기술 메모
- 프레임워크·빌드 없음. `index.html` + CSS + JS + `data/content.js` (window.NEEL_DATA). `file://` 로 열어도 동작(fetch/CORS 없음).
- 라우팅은 해시(`#/slug`), 항목 앵커(`#/publication#pub-158`) 지원. 사진은 `loading="lazy"`.
- 데이터 구조: `nav`(메뉴 트리), `pages`(모든 페이지의 원본 블록), `professor, research, members, publications, covers, patents, presentations, projects, awards, courses, programs, news, research_news, neelstagram(date·year·recent 포함), stats, image_dims`.
- AI 호출은 Anthropic Messages API 를 직접(브라우저) 또는 프록시(워커)로 호출하며 스트리밍으로 답을 표시합니다.
