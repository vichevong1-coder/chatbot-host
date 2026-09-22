# Start All Services for Homework AI Ecosystem
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  WEG Homework AI & Socratic Tutoring System " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

Write-Host "`nOptions to start the ecosystem:" -ForegroundColor Yellow
Write-Host "1. Docker (All services: Backend + OCR + Databases)" -ForegroundColor Green
Write-Host "   Run: docker compose up --build" -ForegroundColor White
Write-Host "2. Local Development (Frontend dev server + local Python)" -ForegroundColor Green

# Launch Docker Compose for Backend + OCR + Databases
Write-Host "`nLaunching Docker Compose (Backend + OCR + DBs)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\User\homework_ocr_vlm'; docker compose up"

# Launch Frontend in Dev mode
Write-Host "Launching Frontend Dev Server on http://localhost:5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\User\homework_ocr_vlm\frontend'; npm run dev"

Write-Host "`nServices started! Open http://localhost:5173 in your browser." -ForegroundColor Yellow
