# PowerShell script to launch all 4 microservices locally

$root = $PSScriptRoot

# Detect virtual environment python if present
if (Test-Path "$root\.venv\Scripts\python.exe") {
    $python = "$root\.venv\Scripts\python.exe"
    Write-Host "Using virtual environment: $python" -ForegroundColor Gray
} else {
    $python = "python"
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Launching all Science Chatbot Services (9000 Series)..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Homework Scanner (Port 9003)
Write-Host "Starting Homework Scanner on http://localhost:9003/docs ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\services\homework_scanner'; Write-Host '--- Homework Scanner (Port 9003) ---' -ForegroundColor Green; & '$python' run.py"

# 2. Math Service (Port 9001)
Write-Host "Starting Math Service on http://localhost:9001/docs ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\services\math_service'; Write-Host '--- Math Service (Port 9001) ---' -ForegroundColor Green; & '$python' -m uvicorn app.main:app --port 9001 --reload"

# 3. Science Service (Port 9002)
Write-Host "Starting Science Service on http://localhost:9002/docs ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\services\science_service'; Write-Host '--- Science Service (Port 9002) ---' -ForegroundColor Green; & '$python' -m uvicorn app.main:app --port 9002 --reload"

# 4. Orchestrator Gateway (Port 9000)
Write-Host "Starting Orchestrator Gateway on http://localhost:9000/docs ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\orchestrator'; Write-Host '--- Orchestrator Gateway (Port 9000) ---' -ForegroundColor Green; & '$python' -m uvicorn app.main:app --port 9000 --reload"

Write-Host ""
Write-Host "✅ All 4 microservices have been launched in separate terminal windows!" -ForegroundColor Green
Write-Host "You can open any of the following in your browser:"
Write-Host "  1. Orchestrator Gateway: http://localhost:9000/docs" -ForegroundColor Cyan
Write-Host "  2. Homework Scanner:     http://localhost:9003/docs" -ForegroundColor Cyan
Write-Host "  3. Math Service:         http://localhost:9001/docs" -ForegroundColor Cyan
Write-Host "  4. Science Service:      http://localhost:9002/docs" -ForegroundColor Cyan
