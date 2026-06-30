@echo off
chcp 65001 >nul
title 두산 기술회보 자동 업데이트

echo ============================================
echo  두산 포털 기술회보 자동 업데이트
echo ============================================
echo.

cd /d "%~dp0"

echo [1/3] 크롤링 시작...
node crawler.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ 크롤링 실패. 오류 내용을 확인하세요.
    pause
    exit /b 1
)

echo.
if not exist new_bulletins.json (
    echo 새 기술회보가 없습니다. 업데이트 완료.
    pause
    exit /b 0
)

echo [2/3] bulletin.json 병합 중...
node merge.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ 병합 실패.
    pause
    exit /b 1
)

echo.
echo [3/3] 앱 빌드 및 배포 중...
cd /d "%~dp0.."
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 빌드 실패.
    pause
    exit /b 1
)

git add src/data/bulletin.json
git commit -m "chore: 기술회보 자동 업데이트"
git push origin master

echo.
echo ============================================
echo  ✅ 완료! Vercel 자동 배포가 시작됩니다.
echo ============================================
pause
