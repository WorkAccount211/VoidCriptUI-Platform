$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "../..")

Write-Host "== VoidCriptUI Platform first-run ==" -ForegroundColor Cyan

if (-not (Test-Path .env)) {
  Write-Host "[FAIL] .env is missing. Create it from .env.example first." -ForegroundColor Red
  exit 1
}

Write-Host "[1/8] Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "[2/8] Generating Prisma Client..." -ForegroundColor Yellow
npm run db:generate

Write-Host "[3/8] Applying database schema..." -ForegroundColor Yellow
npm run db:push

Write-Host "[4/8] Seeding roles and owner..." -ForegroundColor Yellow
npm run db:seed

Write-Host "[5/8] Checking environment..." -ForegroundColor Yellow
npm run check:env

Write-Host "[6/8] Type checking..." -ForegroundColor Yellow
npm run typecheck

Write-Host "[7/8] Running tests..." -ForegroundColor Yellow
npm test

Write-Host "[8/8] Building production bundles..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "READY: start development with 'npm run dev'" -ForegroundColor Green
Write-Host "Web: http://localhost:4080" -ForegroundColor Green
Write-Host "API: http://localhost:8100" -ForegroundColor Green
