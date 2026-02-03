# PowerShell script to create .env files from examples

Write-Host "Creating .env files from examples..." -ForegroundColor Cyan

# Create main .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env file" -ForegroundColor Green
} else {
    Write-Host "⚠ .env file already exists, skipping..." -ForegroundColor Yellow
}

# Create frontend .env file if it doesn't exist
if (-not (Test-Path "frontend\.env")) {
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "✓ Created frontend/.env file" -ForegroundColor Green
} else {
    Write-Host "⚠ frontend/.env file already exists, skipping..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Environment files created!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Edit .env and frontend/.env files with your configuration values" -ForegroundColor Yellow
Write-Host "   - Change SECRET_KEY and JWT_SECRET to random values" -ForegroundColor Yellow
Write-Host "   - Update APP_URL for your environment" -ForegroundColor Yellow
Write-Host "   - Configure database settings if needed" -ForegroundColor Yellow
Write-Host ""

