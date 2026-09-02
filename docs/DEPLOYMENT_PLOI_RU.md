# Ploi + VoidCriptUI без Docker

## Новый сервер

1. Ploi → Servers → Create.
2. Provider/Credential: выбери подключённого VPS/cloud provider.
3. Region: ближайший стабильный регион к аудитории/БД.
4. Plan: минимум 2 vCPU / 4 GB RAM для комфортного Node.js + PostgreSQL + worker/bots; для production выбирай по реальной нагрузке.
5. OS: Ubuntu LTS.
6. Database: PostgreSQL, если БД будет на том же VPS; иначе `none` и используй managed PostgreSQL.
7. Webserver: `nginx`.
8. Не выбирай `nginx-docker`.

## Existing VPS

Ploi → Servers → Create → Custom Server. Выполни выданную Ploi SSH-команду от root. После начала установки не вмешивайся в процесс до завершения.

## Site

Создай Site с доменом и project directory, затем настрой Node.js/PM2 deployment.

## Deploy script

Use `deploy/ploi/deploy.sh`.

```bash
npm ci
npm run db:generate
npm run db:push
npm run build
pm2 startOrRestart ecosystem.config.cjs --update-env
pm2 save
```

## Public routing

- docs/site → `127.0.0.1:4080`
- API → `127.0.0.1:8100`

## SSL

После DNS/HTTP проверки включи SSL certificate через Ploi/Cloudflare и принудительный HTTPS redirect.
