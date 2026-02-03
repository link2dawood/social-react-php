# PowerShell script to setup .env files with generated values

Write-Host "Setting up environment files..." -ForegroundColor Cyan

# Generate random keys
function Generate-RandomKey {
    param([int]$Length = 64)
    $chars = (48..57) + (65..90) + (97..122)
    return -join ($chars | Get-Random -Count $Length | ForEach-Object {[char]$_})
}

function Generate-HexKey {
    param([int]$Length = 64)
    $chars = (48..57) + (97..102)
    return -join ($chars | Get-Random -Count $Length | ForEach-Object {[char]$_})
}

$secretKey = Generate-RandomKey 64
$jwtSecret = Generate-HexKey 64

# Create main .env file
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env file" -ForegroundColor Green
} else {
    Write-Host "⚠ .env file already exists" -ForegroundColor Yellow
}

# Update .env with generated keys
$envContent = Get-Content ".env" -Raw
$envContent = $envContent -replace 'SECRET_KEY=change-this-to-a-random-secret-key-in-production', "SECRET_KEY=$secretKey"
$envContent = $envContent -replace 'JWT_SECRET=change-this-jwt-secret-key-in-production', "JWT_SECRET=$jwtSecret"
Set-Content ".env" -Value $envContent -NoNewline

# Create frontend .env file
if (-not (Test-Path "frontend\.env")) {
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "✓ Created frontend/.env file" -ForegroundColor Green
} else {
    Write-Host "⚠ frontend/.env file already exists" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Environment files configured!" -ForegroundColor Green
Write-Host "   - Generated SECRET_KEY and JWT_SECRET" -ForegroundColor Green
Write-Host "   - Files ready for Docker" -ForegroundColor Green
Write-Host ""

