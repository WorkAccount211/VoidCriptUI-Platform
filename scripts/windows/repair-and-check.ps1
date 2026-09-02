$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $Root

Write-Host 'VoidCriptUI Platform - repair/check' -ForegroundColor Cyan
Write-Host "Root: $Root"

if (-not (Test-Path '.env')) { throw '.env is missing. Restore/create it before continuing.' }
if (-not (Test-Path 'node_modules')) { npm install }

Write-Host '[1/8] Prisma generate' -ForegroundColor Yellow
npm run db:generate

Write-Host '[2/8] Prisma push' -ForegroundColor Yellow
npm run db:push

Write-Host '[3/8] Database seed' -ForegroundColor Yellow
npm run db:seed

Write-Host '[4/8] Environment check' -ForegroundColor Yellow
npm run check:env

Write-Host '[5/8] Typecheck' -ForegroundColor Yellow
npm run typecheck

Write-Host '[6/8] Tests' -ForegroundColor Yellow
npm test

Write-Host '[7/8] QA' -ForegroundColor Yellow
npm run qa

Write-Host '[8/9] Web build' -ForegroundColor Yellow
npm run build:web

Write-Host '[9/9] Full build' -ForegroundColor Yellow
npm run build

Write-Host ''
Write-Host 'All requested checks completed successfully.' -ForegroundColor Green
