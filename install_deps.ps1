#!/usr/bin/env pwsh
# Installation script for StockIQ project

Write-Host "StockIQ Project Installation" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Check Python
Write-Host "`n1. Checking Python installation..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
Write-Host "   Found: $pythonVersion" -ForegroundColor Green

# Create virtual environment
Write-Host "`n2. Creating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "   Virtual environment already exists" -ForegroundColor Gray
} else {
    python -m venv venv
    Write-Host "   Created: venv/" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "`n3. Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"
Write-Host "   Virtual environment activated" -ForegroundColor Green

# Install requirements
Write-Host "`n4. Installing dependencies..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray
pip install --upgrade pip setuptools wheel > $null 2>&1
pip install -r requirements.txt
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "   Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Test imports
Write-Host "`n5. Testing imports..." -ForegroundColor Yellow
python -c "import src.config; print('   ✓ Config module')" 2>&1
python -c "import src.database; print('   ✓ Database module')" 2>&1
python -c "import src.calculations; print('   ✓ Calculations module')" 2>&1

# Create .env
Write-Host "`n6. Setting up environment..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   .env already exists" -ForegroundColor Gray
} else {
    Copy-Item ".env.example" ".env"
    Write-Host "   Created .env from template" -ForegroundColor Green
    Write-Host "   Note: Update .env with your API keys and database URL" -ForegroundColor Cyan
}

Write-Host "`n✓ Installation Complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Edit .env with your configuration" -ForegroundColor White
Write-Host "  2. Run: python scripts/init_db.py" -ForegroundColor White
Write-Host "  3. Run: python -m src.main" -ForegroundColor White
Write-Host "`nAccess API at: http://localhost:8000/api/docs" -ForegroundColor Cyan
