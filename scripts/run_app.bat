@echo off
echo ======================================================================
echo AQUATRACE AI - MARINE PLASTIC POLLUTION MONITORING PLATFORM
echo Starting Backend (FastAPI + YOLOv8) and Frontend (Vite + React)
echo ======================================================================

set PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%

start "AquaTrace AI Backend" cmd /k "cd /d %~dp0\..\backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 3 /nobreak >nul

start "AquaTrace AI Frontend" cmd /k "cd /d %~dp0\..\frontend && npm run dev"

echo.
echo AquaTrace AI is starting!
echo Backend API Docs: http://127.0.0.1:8000/docs
echo Frontend Web App: http://localhost:5173/
echo ======================================================================
pause
