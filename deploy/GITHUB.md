# GitHub Pages 로 인터넷에 올리기 · 도메인 연결 (초보자용, 15분)

**결론부터**: GitHub Pages 를 쓰면 **별도 서버가 필요 없습니다.** GitHub 가 무료로 호스팅해 주고,
도메인은 DNS 설정(CNAME 한 줄)만 하면 연결됩니다. 구글 사이트를 고치면 6시간마다 자동으로 반영됩니다.

```
구글 사이트(편집) ──(6시간마다 자동 동기화 · GitHub Actions)──▶ GitHub 저장소 ──▶ GitHub Pages(무료 호스팅)
                                                                                     │
                                                                            내 도메인(예: neel-lab.kr) ──▶ DNS CNAME
```

---

## 1단계. GitHub 계정 · 저장소 만들기 (3분)
1. https://github.com 가입/로그인 (연구실 공용 계정을 하나 만드는 것을 권장: 예 `neel-lab`)
2. 오른쪽 위 **+ → New repository**
   - Repository name: `neel-website` (원하는 이름)
   - **Public** 선택 (무료 Pages 는 Public 저장소에서 동작)
   - "Add a README" 는 체크하지 않음 → **Create repository**

## 2단계. 이 폴더 올리기 (5분) — 두 방법 중 하나
### 방법 A. GitHub Desktop (가장 쉬움, 권장)
1. https://desktop.github.com 설치 → 로그인
2. **File → Add Local Repository** → `NEEL-Website` 폴더 선택 → "create a repository" 안내가 나오면 **Create** (이름 그대로)
3. 왼쪽 아래 Summary 에 `first upload` 입력 → **Commit to main**
4. 상단 **Publish repository** → 1단계에서 만든 이름 입력, **"Keep this code private" 체크 해제** → Publish
   (사진 600여 장, 약 110MB 라 몇 분 걸립니다)

### 방법 B. 터미널 (git 이 익숙하면)
`deploy/github-push.command` 를 더블클릭하고 저장소 주소(`https://github.com/계정/neel-website.git`)를 붙여넣으면
초기화 → 커밋 → 업로드까지 진행합니다. 비밀번호 대신 **Personal Access Token** 을 넣어야 합니다
(GitHub → Settings → Developer settings → Personal access tokens → Generate, `repo` 권한).

## 3단계. Pages 켜기 (1분)
1. 저장소 페이지 → **Settings → Pages**
2. Build and deployment → Source: **Deploy from a branch** → Branch: **main** / **/(root)** → **Save**
3. 1~2분 뒤 상단에 주소가 뜹니다: `https://<계정>.github.io/neel-website/`
   (처음엔 404 가 잠깐 보일 수 있습니다. 새로고침하세요.)

## 4단계. 자동 동기화 켜기 (1분) — 구글 사이트만 고치면 홈페이지가 저절로 갱신
1. **Settings → Actions → General → Workflow permissions → "Read and write permissions"** 선택 → Save
   (동기화 봇이 새 데이터를 저장소에 커밋할 수 있게 하는 설정)
2. **Actions 탭 → "Sync from Google Sites" → Run workflow** 로 즉시 한 번 실행해 보세요.
   이후 6시간마다 자동으로 돌고, 변경이 있으면 커밋 → Pages 가 다시 배포됩니다.
   (주기 변경: `.github/workflows/sync.yml` 의 `cron: "0 */6 * * *"` — 예: 매일 새벽 3시 KST = `0 18 * * *`)

## 5단계. 도메인 연결 (선택, 10분)
도메인이 없다면 가비아 · 호스팅케이알 · Cloudflare Registrar 등에서 구입합니다(연 1~2만 원).
1. GitHub 저장소 → **Settings → Pages → Custom domain** 에 `www.neel-lab.kr` 처럼 입력 → Save
   (저장소에 `CNAME` 파일이 자동 생성됩니다)
2. 도메인 업체의 **DNS 관리**에서 레코드 추가
   | 종류 | 호스트 | 값 |
   |---|---|---|
   | CNAME | `www` | `<계정>.github.io` |
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
3. 10분~1시간 뒤 GitHub Pages 화면에 "DNS check successful" 이 뜨면 **Enforce HTTPS** 체크
4. 끝. `https://www.neel-lab.kr` 로 접속됩니다. (`neel-lab.kr` 로 들어와도 자동으로 www 로 이동)

> 학교 서브도메인(예: `neel.skku.edu`)을 쓰고 싶으면 학교 전산팀에 "CNAME `neel` → `<계정>.github.io`" 를 요청하면 됩니다.

## 6단계. AI 어시스턴트를 방문자 모두에게 열기 (선택, 5분)
홈페이지의 ✨AI 모드는 키 없이도 내장 답변으로 동작하지만, Claude 로 자연어 답변을 주려면 프록시가 필요합니다
(API 키를 웹에 노출하면 안 되기 때문). `deploy/cloudflare-worker.js` 상단의 4단계를 따라 Cloudflare Workers(무료)에 올리고,
워커 주소를 `data/overrides.js` 의 `"ai": { "endpoint": "https://xxx.workers.dev" }` 에 적은 뒤 커밋하면 됩니다.

## 자주 묻는 질문
- **서버를 따로 빌려야 하나요?** 아니요. GitHub Pages(정적 호스팅)로 충분합니다. 동적 서버가 필요한 부분(AI 프록시)만 Cloudflare Worker(무료)를 씁니다.
- **비용은?** GitHub Pages 무료, Actions 무료 한도 내(월 2,000분; 동기화 1회 ≈ 1분), Cloudflare Workers 무료(일 10만 요청). 도메인만 유료.
- **용량 제한?** Pages 사이트 1GB, 저장소 권장 1GB. 현재 약 110MB.
- **사진을 바꿨는데 안 바뀌어요** → Actions 에서 워크플로 실행 후 브라우저 강력 새로고침(⌘⇧R). 그래도 안 되면 로컬에서 `python3 sync/sync_site.py --full` 후 커밋.
- **구글 사이트를 비공개로 바꾸면?** 동기화가 실패합니다. 구글 사이트는 "게시(공개)" 상태를 유지해야 합니다.
