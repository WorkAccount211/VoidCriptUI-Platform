$ErrorActionPreference='Stop'
Set-Location 'C:\CustomApps\Projects\voidcriptui-platform'
if (!(Test-Path '.env')) { throw '.env is missing. Create and fill it first.' }
$env:NODE_ENV='production'
npm ci --no-audit --no-fund
npm run check:env
npm run db:generate
npm run db:push
npm run build
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) { npm install -g pm2 }
pm run install:pm2
pm2 startOrRestart ecosystem.config.cjs --update-env
pm2 save
pm2 status
