@echo off
chcp 65001 >nul
REM ================================================================
REM  NEEL Lab 홈페이지 · 구글 사이트 동기화 (윈도우에서 더블클릭)
REM  Python 3 가 설치되어 있어야 합니다 (https://www.python.org/downloads/)
REM ================================================================
cd /d "%~dp0"
echo ▶ NEEL Lab 홈페이지 동기화를 시작합니다...
echo.
python sync\sync_site.py %*
if %errorlevel% neq 0 (
  py -3 sync\sync_site.py %*
)
echo.
echo 완료. index.html 을 새로고침하면 반영됩니다.
pause
