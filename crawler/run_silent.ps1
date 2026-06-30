[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$crawlerDir = "C:\Users\lover\forklift-log\crawler"
$projectDir = "C:\Users\lover\forklift-log"
$logFile    = Join-Path $crawlerDir "update_log.txt"

function Log($msg) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

Log "===== 자동 업데이트 시작 ====="

Set-Location $crawlerDir

# 크롤링
node crawler.js 2>&1 | ForEach-Object { Log $_ }
if ($LASTEXITCODE -ne 0) { Log "크롤링 실패 - 종료"; exit 1 }

if (-not (Test-Path (Join-Path $crawlerDir "new_bulletins.json"))) {
    Log "새 기술회보 없음 - 종료"
    exit 0
}

# 병합
node merge.js 2>&1 | ForEach-Object { Log $_ }
if ($LASTEXITCODE -ne 0) { Log "병합 실패 - 종료"; exit 1 }

# 빌드 + 배포
Set-Location $projectDir
npm run build 2>&1 | ForEach-Object { Log $_ }
if ($LASTEXITCODE -ne 0) { Log "빌드 실패 - 종료"; exit 1 }

git add src/data/bulletin.json 2>&1 | Out-Null
git commit -m "chore: 기술회보 자동 업데이트 $(Get-Date -Format 'yyyy-MM-dd')" 2>&1 | ForEach-Object { Log $_ }
git push origin master 2>&1 | ForEach-Object { Log $_ }

Log "===== 업데이트 완료 ====="