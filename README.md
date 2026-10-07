# NEEL Lab 홈페이지 · https://usim-lab.github.io

성균관대 NEEL(Nanomaterials for Energy & Environment Laboratory, 심욱 교수) 연구실 홈페이지입니다.
기존 구글 사이트(https://sites.google.com/view/uksim)의 **모든 페이지·글·사진**을 가져와
Apple 리퀴드 글래스 디자인으로 보여줍니다. 서버·빌드 도구 없이 정적 파일로 동작합니다.

| 무엇 | 어디 |
|---|---|
| 홈페이지 | https://usim-lab.github.io (GitHub Pages · 무료) |
| 저장소 | https://github.com/usim-lab/usim-lab.github.io (조직 `usim-lab`) |
| AI 서버 | https://usim-ai.usim-ai.workers.dev (Cloudflare Workers · 무료) |
| 내용 편집 | 구글 사이트 → 6시간마다 자동 반영 |

```
NEEL-Website/
├─ index.html · manifest.webmanifest   ← 홈페이지 (휴대폰 "홈 화면에 추가" 시 앱처럼 실행)
├─ assets/css/neel.css · assets/js/app.js   ← 디자인 · 화면 구성(라우터 · 페이지 · 검색/AI · 편집기)
├─ assets/img/ · assets/icons/          ← 구글 사이트 사진(자동 최적화) · 앱 아이콘
├─ data/content.js(.json)               ← 구글 사이트에서 읽어온 데이터 (자동 생성 · 손으로 고치지 마세요)
├─ data/i18n.json → data/i18n.js        ← KO⇄EN 번역 사전 (sync/i18n.py 가 관리)
├─ data/overrides.js                    ← 디자인 문구 · 연락처 · 교수 소개(KO) · AI 서버 주소 ← 직접 편집 가능
├─ sync/sync_site.py · sync/i18n.py     ← 구글 사이트 동기화 · 번역 사전
├─ sync.command / sync.bat              ← (맥 / 윈도우) 더블클릭 동기화
├─ deploy/ai-worker/                    ← AI 어시스턴트 서버 (Cloudflare Worker)
└─ .github/workflows/site.yml           ← 6시간마다: 동기화 → 새 문장 자동 번역 → 배포
```

## 1. 내용 편집 → 구글 사이트에서 하던 대로
1. 구글 사이트에서 글·사진을 고치고 **게시(Publish)** 합니다.
2. 끝. GitHub Actions 가 6시간마다 가져와서 배포합니다. 바로 반영하려면 저장소 **Actions → Sync & Deploy → Run workflow**.
   - 내 컴퓨터에서 미리 보려면 `sync.command`(맥) / `sync.bat`(윈도우) 더블클릭 → `index.html` 새로고침.
- 새로 생긴 한국어/영어 문장은 동기화 때 무료 AI 가 자동 번역해 `data/i18n.json` 에 저장합니다.
  번역을 손보고 싶으면 `data/i18n.json` 에서 해당 문장의 `"t"` 값을 고친 뒤 `python3 sync/i18n.py --build`.
- 구글 사이트의 사진 주소는 몇 분 만에 만료되는 서명 링크라서, 동기화 때 사진을 `assets/img/` 에 저장해 씁니다.
  (2026-10 구글이 주소 형식을 `sites.google.com/sitesv-images-rt/…` 로 바꿨고 스크립트가 두 형식을 모두 읽습니다.)

## 2. 언어(KO / EN)
- 상단 `KO / EN` 으로 바꾸면 메뉴·안내문뿐 아니라 **본문(교수 학술활동·경력, 과제, 뉴스, 인스타 캡션, 사사 기관 등)도 번역문**으로 바뀝니다.
  보던 위치는 그대로 유지됩니다. 주소에 `?lang=en` / `?lang=ko` 를 붙여 공유할 수도 있습니다.
- 원칙: EN 모드에서는 한글이 보이지 않게, KO 모드에서는 설명·역할·경력이 한국어로. 논문 제목·저자·저널명 같은 학술 기록은 원문 그대로입니다.
- 교수님 이름은 구글 사이트의 "Dr. Uk Sim"을 화면에서 **"Prof. Uk Sim"** 으로 표시합니다(`app.js` 의 `profName`).

## 3. 휴대폰
- 하단 탭바: 홈 · 연구 · **✨AI** · 논문 · 구성원 (나머지 페이지는 상단 ☰).
- ✨AI → 전체 화면 어시스턴트. **"화면에서 탭해 묻기"** 를 켜면 모든 카드에 ✨ 표시가 붙고, 탭하면 그 항목을 AI 가 설명합니다(PC 에서는 마우스를 올리면 같은 기능).
- Safari 공유 → "홈 화면에 추가" 하면 앱처럼 전체 화면으로 열립니다.

## 4. AI 어시스턴트 (무료)
- **답변**: Llama 3.3 70B · **웹 검색 판단/검색어**: Qwen3 30B — 둘 다 Cloudflare Workers AI 무료 사용량(하루 10,000 neurons ≈ 질문 60회 안팎)으로 동작합니다. API 키·결제 없음.
- 연구실 질문은 홈페이지 데이터로만 답하고(없는 정보는 지어내지 않음), 일반 지식 질문은 위키백과(한/영) · 학술 논문(OpenAlex/Crossref) · DuckDuckGo 를 검색해 출처 링크와 함께 답합니다.
- 하루 무료량을 다 쓰거나 연결이 안 되면 자동으로 **내장 답변**(사이트 데이터 요약)으로 대신합니다.
- 설정은 `deploy/ai-worker/wrangler.toml` (모델·허용 주소·분당 질문 수), 배포는 `cd deploy/ai-worker && npm install && npx wrangler deploy`.
- 선택 사항 (`npx wrangler secret put 이름`):
  - `TAVILY_API_KEY` (월 1,000회 무료) · `NAVER_CLIENT_ID` + `NAVER_CLIENT_SECRET` (하루 25,000회 무료) → 일반 웹/뉴스 검색 강화
  - `ANTHROPIC_API_KEY` → 넣으면 **Claude**(유료, Claude Console 선불 크레딧)로 자동 전환되고 Claude 가 직접 웹 검색합니다. 빼면 다시 무료 모델.
- 관리자용 ⚙︎(개인 API 키 시험)는 푸터 ✎ 편집기 비밀번호를 한 번 입력한 브라우저에서만 보입니다.

## 5. 디자인 문구 편집
구글 사이트에 없는 문구(슬로건, 철학 문단, 연락처, 교수 한국어 소개, AI 서버 주소)는 `data/overrides.js` 에서 고치거나,
홈페이지 맨 아래 `✎` → 비밀번호(`neel`) → 수정 → "파일로 저장/다운로드" 후 저장소에 올립니다.

## 6. 문제 해결
- 사진이 안 보임 → `python3 sync/sync_site.py --full`
- `ModuleNotFoundError: bs4` → `python3 -m pip install --user beautifulsoup4 lxml pillow`
- 구성원 카드에 이상한 이름이 생김 → 구글 사이트의 역할 줄이 이름처럼 보이는 경우입니다. `sync/sync_site.py` 의 `ROLE_WORDS` 에 단어를 추가.
- AI 가 "내장 답변으로 대신했어요"만 보여줌 → 무료량 소진(다음 날 자동 복구) 또는 서버 확인: 브라우저로 AI 서버 주소를 열어 `{"ok":true}` 확인.
- 맥에서 `git` 이 Xcode 라이선스 오류를 내면 → `DEVELOPER_DIR=/Library/Developer/CommandLineTools git …` (deploy/github-push.command 에 반영됨)
