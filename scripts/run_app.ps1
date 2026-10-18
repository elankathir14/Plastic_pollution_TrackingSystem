Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "AQUATRACE AI - MARINE PLASTIC POLLUTION MONITORING PLATFORM" -ForegroundColor White
Write-Host "Starting Backend (FastAPI + YOLOv8) and Frontend (Vite + React)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

$nodePath = "$env:LOCALAPPDATA\Programs\nodejs"
$env:PATH = "$nodePath;$env:PATH"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\backend'; python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
Start-Sleep -Seconds 3

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\frontend'; `$env:PATH = '$nodePath;' + `$env:PATH; npm run dev"

Write-Host ""
Write-Host "AquaTrace AI is launching!" -ForegroundColor Green
Write-Host "Backend API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "Frontend Web App: http://localhost:5173/" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
