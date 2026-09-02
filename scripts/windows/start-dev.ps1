$ErrorActionPreference='Stop'
Set-Location 'C:\CustomApps\Projects\voidcriptui-platform'
if (!(Test-Path '.env')) { Copy-Item '.env.example' '.env'; Write-Host 'Created .env from .env.example. Fill it before continuing.' -ForegroundColor Yellow; exit 1 }
npm run check:env
npm run db:generate
npm run db:push
npm run dev
