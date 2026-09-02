import CopyCode from '@/components/CopyCode';
import SetupSidebar from '@/components/SetupSidebar';

type SetupSection = readonly [string, string];

const sections: readonly SetupSection[] = [
 ['overview','Обзор'],['requirements','Requirements'],['project','Распаковка'],['postgres','PostgreSQL'],['env','.env'],['secrets','Секреты'],['github','GitHub'],['turnstile','Cloudflare'],['telegram','Telegram 2FA'],['discord','Discord 2FA'],['email','Gmail API / Email'],['local','Локальный запуск'],['checks','Проверки'],['production','Production'],['ploi','Ploi'],['nginx','NGINX + HTTPS'],['pm2','PM2'],['troubleshooting','Ошибки'],['security','Security'],['commands','Команды']
];
function Section({id,title,children}:{id:string;title:string;children:React.ReactNode}){return <section id={id} className="setup-card surface rounded-2xl p-6 md:p-8 mb-5"><h2 className="text-2xl font-semibold tracking-tight">{title}</h2><div className="prose mt-4">{children}</div></section>}
export default function SetupPage(){return <div className="container py-8 md:py-12"><div className="setup-hero"><div className="text-xs uppercase tracking-[.18em] text-cyan-300">VoidCriptUI Platform • Setup Guide</div><h1 className="mt-3 max-w-4xl text-4xl md:text-6xl font-semibold tracking-[-.04em]">Полный запуск <span className="accent-text">без Docker</span>.</h1><p className="mt-5 max-w-3xl text-lg leading-8 muted">Инструкция для <code>C:\CustomApps\Projects\voidcriptui-platform</code>. Архитектура: native PostgreSQL + Node.js + PM2 + NGINX/Ploi. Docker-компоненты удалены из проекта.</p></div><div className="setup-grid"><SetupSidebar sections={sections}/><main>
<Section id="overview" title="1. Обзор"><div className="note"><b>Результат:</b> Web + API + PostgreSQL + Worker/QA + Telegram Bot + Discord Bot, запускаемые без Docker.</div><p>GitHub остаётся источником истины для VoidCriptUI. Пользовательские аккаунты, community, MFA и Owner-функции живут в API/PostgreSQL.</p></Section>
<Section id="requirements" title="2. Requirements"><p>Установи Node.js 22+, Git, PostgreSQL 16+, VS Code. Для production добавятся VPS, Ploi/NGINX и домен.</p><CopyCode>{`node -v
npm -v
git --version
psql --version`}</CopyCode></Section>
<Section id="project" title="3. Распаковка"><p>Распакуй проект:</p><CopyCode>C:\CustomApps\Projects\voidcriptui-platform</CopyCode><p>Переход:</p><CopyCode>cd C:\CustomApps\Projects\voidcriptui-platform</CopyCode><p>В корне должны быть <code>package.json</code>, <code>.env.example</code>, <code>apps</code>, <code>packages</code>, <code>docs</code>, <code>deploy</code>.</p></Section>
<Section id="postgres" title="4. PostgreSQL — без Docker"><p>Установи PostgreSQL native. Используй порт 5432. Создай отдельную БД и пользователя:</p><CopyCode>{`CREATE USER voidcriptui WITH PASSWORD 'CHANGE_THIS_PASSWORD';
CREATE DATABASE voidcriptui OWNER voidcriptui;
GRANT ALL PRIVILEGES ON DATABASE voidcriptui TO voidcriptui;`}</CopyCode><p>Строка подключения:</p><CopyCode>DATABASE_URL=postgresql://voidcriptui:CHANGE_THIS_PASSWORD@localhost:5432/voidcriptui</CopyCode></Section>
<Section id="env" title="5. .env"><p>Создай рабочий файл:</p><CopyCode>{`Copy-Item .env.example .env
notepad .env`}</CopyCode><p>Чистый вариант без дублей:</p><CopyCode>{`NODE_ENV=development

WEB_URL=http://localhost:4080
API_URL=http://localhost:8100
API_PUBLIC_URL=http://localhost:8100
NEXT_PUBLIC_API_URL=http://localhost:8100
API_INTERNAL_URL=http://localhost:8100

DATABASE_URL=postgresql://voidcriptui:CHANGE_THIS_PASSWORD@localhost:5432/voidcriptui

SESSION_COOKIE_NAME=vcu_session
SESSION_TTL_DAYS=30

INITIAL_OWNER_EMAIL=you@example.com
INITIAL_OWNER_USERNAME=owner
INITIAL_OWNER_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
INITIAL_OWNER_TELEGRAM_ID=
INITIAL_OWNER_DISCORD_ID=

GITHUB_REPOSITORY_URL=https://github.com/WorkAccount211/VoidCriptUI_lib-Final-
GITHUB_TOKEN=

NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

TELEGRAM_BOT_TOKEN=
TELEGRAM_OWNER_ID=

DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
DISCORD_NOTIFICATION_CHANNEL_ID=
DISCORD_WEBHOOK_URL=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

STORAGE_DIR=./storage
UPLOAD_DIR=./uploads

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
MFA_MAX_ATTEMPTS=5

ALLOW_UNVERIFIED_LOGIN=false
DEV_BYPASS_CAPTCHA=false

ENCRYPTION_KEY=
API_INTERNAL_SECRET=
BOT_SHARED_SECRET=`}</CopyCode></Section>
<Section id="secrets" title="6. Секреты"><p>Сгенерируй отдельные значения для <code>ENCRYPTION_KEY</code>, <code>API_INTERNAL_SECRET</code> и <code>BOT_SHARED_SECRET</code>.</p><CopyCode>{`[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))`}</CopyCode><div className="dangerbox"><b>Не публикуй:</b> .env, bot tokens, Turnstile secret, DB password, SMTP password или service secrets.</div></Section>
<Section id="github" title="7. GitHub"><CopyCode>GITHUB_REPOSITORY_URL=https://github.com/WorkAccount211/VoidCriptUI_lib-Final-</CopyCode><p>Для публичного репозитория <code>GITHUB_TOKEN</code> можно оставить пустым. Для private/расширенного доступа token должен оставаться только server-side.</p></Section>
<Section id="turnstile" title="8. Cloudflare Turnstile"><p>Создай Turnstile widget в Cloudflare Dashboard, возьми Site Key и Secret Key.</p><CopyCode>{`NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x...
TURNSTILE_SITE_KEY=0x...
TURNSTILE_SECRET_KEY=0x...`}</CopyCode><p>Поток должен быть:</p><CopyCode>Browser → Turnstile → token → API → Cloudflare Siteverify → success/failure</CopyCode><p>Если UI пишет <code>Please verify the captcha</code> после challenge, проверяй backend Siteverify, token expiry/reuse и hostname.</p></Section>
<Section id="telegram" title="9. Telegram 2FA"><p>В Telegram открой <code>@BotFather</code> → <code>/newbot</code>. Новый token:</p><CopyCode>{`TELEGRAM_BOT_TOKEN=YOUR_NEW_TOKEN
TELEGRAM_OWNER_ID=YOUR_NUMERIC_TELEGRAM_ID`}</CopyCode><p>Запуск:</p><CopyCode>npm run dev:telegram</CopyCode><p>Пользователь сначала должен открыть бота и нажать Start. Linking выполняется через короткоживущий challenge, а не через постоянный код.</p></Section>
<Section id="discord" title="10. Discord 2FA"><p>Discord Developer Portal → New Application → Bot. Установи бота на свой сервер с минимальными permissions.</p><CopyCode>{`DISCORD_BOT_TOKEN=YOUR_NEW_TOKEN
DISCORD_GUILD_ID=YOUR_SERVER_ID
DISCORD_NOTIFICATION_CHANNEL_ID=YOUR_CHANNEL_ID`}</CopyCode><p>В Discord включи Developer Mode и используй Copy User ID / Copy Server ID / Copy Channel ID. Запуск:</p><CopyCode>npm run dev:discord</CopyCode></Section>
<Section id="email" title="11. Gmail API / Email"><p>Для настоящих verification/password reset нужен реальный Gmail API OAuth 2.0:</p><CopyCode>{`SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=YOUR_SMTP_USER
SMTP_PASSWORD=YOUR_SMTP_PASSWORD
SMTP_FROM=no-reply@yourdomain.example`}</CopyCode></Section>
<Section id="local" title="12. Локальный запуск"><CopyCode>{String.raw`cd C:\CustomApps\Projects\voidcriptui-platform
Copy-Item .env.example .env
notepad .env
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run check:env
npm run dev`}</CopyCode><div className="grid gap-3 sm:grid-cols-2"><div className="mini"><b>Web</b><br/><code>http://localhost:4080</code></div><div className="mini"><b>API</b><br/><code>http://localhost:8100</code></div><div className="mini"><b>OpenAPI</b><br/><code>http://localhost:8100/api-docs</code></div><div className="mini"><b>Health</b><br/><code>http://localhost:8100/api/v1/health</code></div></div></Section>
<Section id="checks" title="13. Проверки"><CopyCode>{`npm run typecheck
npm run test
npm run qa
npm run build`}</CopyCode><p>Production нельзя считать готовым только по внешнему виду. Typecheck, tests, build и QA должны реально завершиться.</p></Section>
<Section id="production" title="14. Production без Docker"><CopyCode>{`Internet
  ↓
NGINX / Ploi
  ├── docs.example.com → 127.0.0.1:4080
  └── api.example.com  → 127.0.0.1:8100
       ↓
      PM2
       ├── web
       ├── api
       ├── worker
       ├── telegram bot
       └── discord bot

PostgreSQL: native/managed`}</CopyCode></Section>
<Section id="ploi" title="15. Ploi"><p>Ploi поддерживает создание собственного сервера с provider, region и plan; при создании сервера можно выбрать PostgreSQL и обычный NGINX. Для Node.js Ploi поддерживает PM2 или Supervisor.</p><h3>Новый сервер</h3><ol><li>Открой Ploi → Servers → Create.</li><li>Выбери provider credential.</li><li>Выбери region.</li><li>Выбери plan.</li><li>OS: Ubuntu LTS.</li><li>Database: PostgreSQL, если БД будет на этом VPS.</li><li>Webserver: NGINX, не nginx-docker.</li></ol><h3>Существующий VPS</h3><p>Выбери Custom Server. Ploi выдаёт SSH-команду; выполни её от root и запусти installation. Не вмешивайся в сервер во время установки.</p><h3>Site</h3><p>В Sites создай домен, project directory и нужный project type/template.</p><p>Deployment script проекта:</p><CopyCode>{`cd /home/ploi/voidcriptui-platform
npm ci
npm run db:generate
npm run db:push
npm run build
pm2 startOrRestart ecosystem.config.cjs --update-env
pm2 save`}</CopyCode><p className="warning">Вставляй две последние команды отдельно:</p><CopyCode>pm2 startOrRestart ecosystem.config.cjs --update-env</CopyCode><CopyCode>pm2 save</CopyCode><p>Этот проект содержит <code>deploy/ploi/deploy.sh</code> для аналогичного workflow.</p></Section>
<Section id="nginx" title="16. NGINX + HTTPS"><p>Рекомендуй разделить Web и API:</p><CopyCode>{`https://docs.yourdomain.example → http://127.0.0.1:4080
https://api.yourdomain.example  → http://127.0.0.1:8100`}</CopyCode><p>В NGINX передавай Host, X-Real-IP, X-Forwarded-For и X-Forwarded-Proto. После DNS проверь сайт и включи SSL/HTTPS через Ploi/Cloudflare.</p></Section>
<Section id="pm2" title="17. PM2"><CopyCode>npm install -g pm2</CopyCode><CopyCode>npm run build</CopyCode><CopyCode>pm2 startOrRestart ecosystem.config.cjs --update-env</CopyCode><CopyCode>pm2 save</CopyCode><CopyCode>{`pm2 status
pm2 logs`}</CopyCode></Section>
<Section id="troubleshooting" title="18. Типичные ошибки"><h3>5432 занят</h3><p>Используй существующий PostgreSQL либо другой порт, затем исправь <code>DATABASE_URL</code>.</p><h3>Captcha</h3><p>Проверяй token → API → Cloudflare Siteverify. Не отключай production validation.</p><h3>Telegram</h3><p>Проверь token, API URL, BOT_SHARED_SECRET и что пользователь первым открыл бот.</p><h3>Discord</h3><p>Проверь token, Guild ID, installation, permissions и gateway connectivity.</p><h3>PM2</h3><p>Проверь, что <code>npm run build</code> завершился и PM2 запущен из корня проекта.</p></Section>
<Section id="security" title="19. Security"><div className="dangerbox">Ранее раскрытые bot tokens/Turnstile secrets считай скомпрометированными и замени перед production.</div><ul><li>Owner/Admin: обязательная MFA.</li><li>RBAC проверяется server-side.</li><li>Recovery codes одноразовые.</li><li>Challenges имеют TTL и replay protection.</li><li>Secrets не логируются.</li><li>Не выполняй произвольный Lua/plugin code на сервере.</li></ul></Section>
<Section id="commands" title="20. Команды"><CopyCode>{String.raw`cd C:\CustomApps\Projects\voidcriptui-platform
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run check:env
npm run dev`}</CopyCode><p>Отдельно:</p><CopyCode>{`npm run dev:web
npm run dev:api
npm run dev:worker
npm run dev:telegram
npm run dev:discord`}</CopyCode></Section>
 </main></div></div>}
