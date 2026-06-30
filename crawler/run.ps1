Set-Location $PSScriptRoot

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  두산 기술회보 자동 업데이트" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] 크롤링 시작..." -ForegroundColor Yellow
node crawler.js
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "크롤링 실패. 위 오류를 확인하세요." -ForegroundColor Red
    Read-Host "엔터를 누르면 닫힙니다"
    exit 1
}

if (-not (Test-Path "new_bulletins.json")) {
    Write-Host ""
    Write-Host "새 기술회보가 없습니다. 이미 최신 상태입니다." -ForegroundColor Green
    Read-Host "엔터를 누르면 닫힙니다"
    exit 0
}

Write-Host ""
Write-Host "[2/3] bulletin.json 병합 중..." -ForegroundColor Yellow
node merge.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "병합 실패." -ForegroundColor Red
    Read-Host "엔터를 누르면 닫힙니다"
    exit 1
}

Write-Host ""
Write-Host "[3/3] 앱 빌드 및 배포 중..." -ForegroundColor Yellow
Set-Location ".."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "빌드 실패." -ForegroundColor Red
    Read-Host "엔터를 누르면 닫힙니다"
    exit 1
}

git add src/data/bulletin.json
git commit -m "chore: 기술회보 자동 업데이트"
git push origin master

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  완료! Vercel 자동 배포가 시작됩니다." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Read-Host "엔터를 누르면 닫힙니다"