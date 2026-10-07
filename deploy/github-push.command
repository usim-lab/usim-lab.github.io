#!/bin/bash
# ================================================================
#  NEEL Lab 홈페이지 · GitHub 업로드 도우미 (맥 · 더블클릭)
#  처음 한 번: 저장소 주소를 붙여넣으면 git 초기화 → 커밋 → 업로드
#  이후: 다시 실행하면 변경분만 커밋·업로드합니다.
#  (비밀번호 대신 GitHub Personal Access Token 을 입력하세요)
# ================================================================
cd "$(dirname "$0")/.." || exit 1
echo "▶ NEEL-Website → GitHub 업로드"
if ! command -v git >/dev/null 2>&1; then echo "git 이 없습니다. 'xcode-select --install' 후 다시 실행하세요."; read -n 1 -s -r; exit 1; fi
if [ ! -d .git ]; then
  read -r -p "GitHub 저장소 주소 (예: https://github.com/계정/neel-website.git): " REMOTE
  [ -z "$REMOTE" ] && { echo "주소가 비었습니다."; read -n 1 -s -r; exit 1; }
  git init -b main
  git remote add origin "$REMOTE"
fi
git add -A
git commit -m "update: $(date '+%Y-%m-%d %H:%M')" || echo "(변경 없음)"
git push -u origin main
STATUS=$?
echo
if [ $STATUS -eq 0 ]; then
  echo "✅ 업로드 완료. GitHub → Settings → Pages 에서 main / root 를 선택하면 사이트가 열립니다."
else
  echo "⚠️  업로드 실패. 저장소 주소, 로그인(토큰)을 확인하세요."
fi
read -n 1 -s -r -p "아무 키나 누르면 창이 닫힙니다."
