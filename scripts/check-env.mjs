import dotenv from 'dotenv';
import path from 'node:path';

const root = process.cwd();
dotenv.config({ path: path.join(root, '.env') });

const required = [
  'DATABASE_URL', 'WEB_URL', 'API_PUBLIC_URL',
  'ENCRYPTION_KEY', 'BOT_SHARED_SECRET',
  'INITIAL_OWNER_EMAIL', 'INITIAL_OWNER_USERNAME',
  'INITIAL_OWNER_PASSWORD',
  'TURNSTILE_SITE_KEY', 'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'TELEGRAM_BOT_TOKEN', 'TELEGRAM_OWNER_ID',
  'DISCORD_BOT_TOKEN', 'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET',
  'DISCORD_GUILD_ID', 'DISCORD_NOTIFICATION_CHANNEL_ID', 'DISCORD_WEBHOOK_URL',
  'GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'GMAIL_FROM',
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
if (process.env.DEV_BYPASS_CAPTCHA === 'true' && process.env.NODE_ENV === 'production') {
  console.error('DEV_BYPASS_CAPTCHA must be false in production.');
  process.exit(1);
}
console.log('Environment baseline OK.');

const optional = ['GITHUB_TOKEN','API_PORT','DEV_MAILER_DRY_RUN'];
const configuredOptional = optional.filter((key) => process.env[key]);
if (configuredOptional.length) console.log(`Optional configuration detected: ${configuredOptional.join(', ')}`);
