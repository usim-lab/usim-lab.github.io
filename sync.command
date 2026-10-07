#!/bin/bash
# ================================================================
#  NEEL Lab 홈페이지 · 구글 사이트 동기화 (맥에서 더블클릭)
#  구글 사이트(sites.google.com/view/uksim)에서 내용을 고친 뒤
#  이 파일을 더블클릭하면 새 홈페이지 데이터(data/content.js)와
#  사진(assets/img)이 최신 상태로 갱신됩니다.
# ================================================================
cd "$(dirname "$0")"
echo "▶ NEEL Lab 홈페이지 동기화를 시작합니다..."
echo
python3 sync/sync_site.py "$@"
STATUS=$?
echo
if [ $STATUS -eq 0 ]; then
  echo "✅ 완료! index.html 을 새로고침하면 반영됩니다."
else
  echo "⚠️  문제가 발생했습니다. 위 메시지를 확인하세요. (인터넷 연결 / python3 설치 여부)"
fi
echo
read -n 1 -s -r -p "아무 키나 누르면 창이 닫힙니다."
