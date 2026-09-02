#!/usr/bin/env bash
set -euo pipefail
cd /home/ploi/voidcriptui-platform
npm install --no-audit --no-fund
npm run db:generate
npm run db:push
npm run build
pm2 startOrRestart ecosystem.config.cjs --update-env
pm2 save
