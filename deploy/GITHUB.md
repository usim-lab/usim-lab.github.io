# 배포 현황 · 운영 메모

```
구글 사이트(편집) ──6시간마다 GitHub Actions──▶ usim-lab/usim-lab.github.io ──▶ https://usim-lab.github.io
                       (동기화 → 새 문장 번역 → Pages 배포)                     │ ✨AI
                                                                                 ▼
                                                         https://usim-ai.usim-ai.workers.dev (Cloudflare 무료)
```

## GitHub (조직 `usim-lab`, 소유자: shimjunho)
- 저장소: https://github.com/usim-lab/usim-lab.github.io — 조직 이름 + `.github.io` 저장소라서 주소가 `https://usim-lab.github.io` 입니다.
- Pages: Settings → Pages → Source = **GitHub Actions** (`.github/workflows/site.yml` 이 배포).
- Actions 설정값: Variables `AI_ENDPOINT` = AI 서버 주소, Secrets `I18N_TOKEN` = 자동 번역용 토큰(AI 서버의 같은 이름 비밀값과 일치해야 함).
- 연구실 사람 추가: 조직 → People → Invite. 저장소 관리 권한을 넘길 때는 조직 Owner 로 초대하세요.
- 직접 수정 후 올리기: `deploy/github-push.command` 더블클릭 (또는 `git push`). main 에 올리면 1분 안에 배포됩니다.

## Cloudflare (AI 서버)
- 대시보드: https://dash.cloudflare.com → Workers & Pages → `usim-ai` (로그·사용량 확인).
- 코드: `deploy/ai-worker/src/index.js`, 설정: `deploy/ai-worker/wrangler.toml`.
- 재배포: `cd deploy/ai-worker && npm install && npx wrangler deploy` (처음 한 번 `npx wrangler login`).
- 무료 한도: Workers AI 하루 10,000 neurons(질문 약 60회) · Workers 요청 하루 100,000회. 넘으면 홈페이지가 내장 답변으로 대신합니다.

## 도메인을 바꾸고 싶을 때 (선택)
- 무료: 지금 주소(`usim-lab.github.io`) 그대로 사용.
- 유료 도메인(예: `neel-lab.kr`, 연 1~2만 원) 또는 학교 서브도메인(전산팀에 `CNAME → usim-lab.github.io` 요청):
  저장소 Settings → Pages → Custom domain 에 입력 → DNS 에 CNAME `www → usim-lab.github.io` → "Enforce HTTPS".
  그다음 `deploy/ai-worker/wrangler.toml` 의 `ALLOWED_ORIGINS` 에 새 주소를 추가하고 재배포하세요(안 하면 AI 가 막힙니다).
