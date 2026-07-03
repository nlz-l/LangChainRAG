@echo off
title RAG Knowledge QA System

set "PROJECT_DIR=%~dp0"

echo ========================================
echo   RAG Knowledge QA System Starting...
echo ========================================
echo.

REM Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found!
    pause
    exit /b 1
)

REM Check Node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    pause
    exit /b 1
)

echo [1/4] Setting up Python venv...
cd /d "%PROJECT_DIR%backend"
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create venv!
        pause
        exit /b 1
    )
)

echo [2/4] Installing backend dependencies...
call "%PROJECT_DIR%backend\venv\Scripts\activate.bat"
pip install -q -r "%PROJECT_DIR%backend\requirements.txt" -i https://pypi.tuna.tsinghua.edu.cn/simple --trusted-host pypi.tuna.tsinghua.edu.cn 2>nul
if %errorlevel% neq 0 (
    pip install -q -r "%PROJECT_DIR%backend\requirements.txt" 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Backend dependencies install failed!
        pause
        exit /b 1
    )
)

echo [3/4] Installing frontend dependencies...
cd /d "%PROJECT_DIR%frontend"
if not exist "node_modules\" (
    echo Running npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
)
echo Frontend dependencies OK.

echo [4/4] Starting services...
echo.
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/docs
echo   Frontend : http://localhost:5173
echo   Admin    : admin / 123456
echo ========================================
echo.

REM Start backend
cd /d "%PROJECT_DIR%backend"
start "Backend-API" cmd /k "cd /d %PROJECT_DIR%backend && call venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000"

REM Start frontend
cd /d "%PROJECT_DIR%frontend"
start "Frontend-Web" cmd /k "cd /d %PROJECT_DIR%frontend && npm run dev"

echo Services starting... Open http://localhost:5173 in your browser.
echo.
echo Close this window after the two service windows open.
pause
