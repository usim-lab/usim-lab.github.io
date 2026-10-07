#!/bin/bash
# ================================================================
#  NEEL Lab 홈페이지 · GitHub 업로드 (맥 · 더블클릭)
#  바뀐 파일을 커밋해서 https://github.com/usim-lab/usim-lab.github.io 로 올립니다.
#  올라가면 GitHub Actions 가 1분 안에 https://usim-lab.github.io 에 배포합니다.
# ================================================================
cd "$(dirname "$0")/.." || exit 1
# Xcode 라이선스 미동의 상태에서도 동작하도록 Command Line Tools 의 git 사용
[ -d /Library/Developer/CommandLineTools ] && export DEVELOPER_DIR=/Library/Developer/CommandLineTools
echo "▶ NEEL-Website → GitHub 업로드"
git pull --rebase --autostash -q origin main || echo "(최신 내용 가져오기 실패 — 그대로 진행)"
git add -A
git commit -q -m "update: $(date '+%Y-%m-%d %H:%M')" || echo "(변경 없음)"
if git push -q origin main; then
  echo "✅ 업로드 완료 — 1분 뒤 https://usim-lab.github.io 에서 확인하세요."
else
  echo "⚠️  업로드 실패 — GitHub 로그인(gh auth login)을 확인하세요."
fi
read -n 1 -s -r -p "아무 키나 누르면 창이 닫힙니다."
