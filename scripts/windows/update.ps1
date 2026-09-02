$ErrorActionPreference='Stop'
Set-Location 'C:\CustomApps\Projects\voidcriptui-platform'
git pull --ff-only
npm ci --no-audit --no-fund
npm run check:env
npm run db:generate
npm run db:push
npm run build
pm2 startOrRestart ecosystem.config.cjs --update-env
pm2 save
pm2 status
