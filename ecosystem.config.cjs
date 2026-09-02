module.exports = {
  apps: [
    { name: 'voidcriptui-web', cwd: './apps/web', script: 'npm', args: 'run start', env: { NODE_ENV: 'production' } },
    { name: 'voidcriptui-api', cwd: './apps/api', script: 'npm', args: 'run start', env: { NODE_ENV: 'production' } },
    { name: 'voidcriptui-worker', cwd: './apps/worker', script: 'npm', args: 'run start', env: { NODE_ENV: 'production' } },
    { name: 'voidcriptui-telegram', cwd: './apps/telegram-bot', script: 'npm', args: 'run start', env: { NODE_ENV: 'production' } },
    { name: 'voidcriptui-discord', cwd: './apps/discord-bot', script: 'npm', args: 'run start', env: { NODE_ENV: 'production' } }
  ]
};
