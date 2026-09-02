$ErrorActionPreference='Stop'
Set-Location 'C:\CustomApps\Projects\voidcriptui-platform'
pm2 status
pm2 stop ecosystem.config.cjs
pm2 save
