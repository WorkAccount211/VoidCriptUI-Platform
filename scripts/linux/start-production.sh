#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
[ -f .env ] || { echo '.env is missing'; exit 1; }
npm install --no-audit --no-fund
npm run check:env
npm run db:generate
npm run db:push
npm run build
pm2 startOrRestart ecosystem.config.cjs --update-env
pm2 save
