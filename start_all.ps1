# PowerShell script to launch all Science Chatbot & Frontend services locally

$root = $PSScriptRoot

# Detect virtual environment python if present
if (Test-Path "$root\.venv\Scripts\python.exe") {
    $python = "$root\.venv\Scripts\python.exe"
    Write-Host "Using virtual environment: $python" -ForegroundColor Gray
} else {
    $python = "python"
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Launching all Science Chatbot & Frontend Services...   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Homework Scanner (Port 9003)
Write-Host "Starting Homework Scanner on http://localhost:9003/docs ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend\homework_ocr_vlm'; Write-Host '--- Homework Scanner (Port 9003) ---' -ForegroundColor Green; & '$python' run.py"

# 2. Math Service (Port 9001)
Write-Host "Starting Math Service on http://localhost:9001/docs ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend\services\math_service'; Write-Host '--- Math Service (Port 9001) ---' -ForegroundColor Green; & '$python' -m uvicorn app.main:app --port 9001 --reload"

# 3. Science Service (Port 9002)
Write-Host "Starting Science Service on http://localhost:9002/docs ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend\services\science_service'; Write-Host '--- Science Service (Port 9002) ---' -ForegroundColor Green; & '$python' -m uvicorn app.main:app --port 9002 --reload"

# 4. Orchestrator Gateway (Port 9000)
Write-Host "Starting Orchestrator Gateway on http://localhost:9000/docs ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend\orchestrator'; Write-Host '--- Orchestrator Gateway (Port 9000) ---' -ForegroundColor Green; & '$python' -m uvicorn app.main:app --port 9000 --reload"

# 5. Frontend Web UI (Port 5173)
if (Test-Path "$root\frontend\package.json") {
    Write-Host "Starting Frontend Dev Server on http://localhost:5173 ..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; Write-Host '--- Frontend Dev Server (Port 5173) ---' -ForegroundColor Green; npm run dev"
}

Write-Host ""
Write-Host "✅ All services have been launched in separate terminal windows!" -ForegroundColor Green
Write-Host "You can open any of the following in your browser:"
Write-Host "  1. Frontend Web App:     http://localhost:5173" -ForegroundColor Cyan
Write-Host "  2. Orchestrator Gateway: http://localhost:9000/docs" -ForegroundColor Cyan
Write-Host "  3. Homework Scanner:     http://localhost:9003/docs" -ForegroundColor Cyan
Write-Host "  4. Math Service:         http://localhost:9001/docs" -ForegroundColor Cyan
Write-Host "  5. Science Service:      http://localhost:9002/docs" -ForegroundColor Cyan
