import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(scriptDir, '..');
const root = path.resolve(dbDir, '../..');
const envPath = path.join(root, '.env');

if (!fs.existsSync(envPath)) {
  console.error(`[prisma-env] Missing root .env: ${envPath}`);
  process.exit(1);
}

dotenv.config({ path: envPath, override: false });

if (!process.env.DATABASE_URL) {
  console.error('[prisma-env] DATABASE_URL is not set in the root .env');
  process.exit(1);
}

const prismaCli = path.join(root, 'node_modules', 'prisma', 'build', 'index.js');
if (!fs.existsSync(prismaCli)) {
  console.error(`[prisma-env] Prisma CLI not found: ${prismaCli}`);
  console.error('[prisma-env] Run npm install from the repository root first.');
  process.exit(1);
}

const args = process.argv.slice(2);
if (!args.includes('--schema')) args.push('--schema', 'prisma/schema.prisma');

const result = spawnSync(process.execPath, [prismaCli, ...args], {
  cwd: dbDir,
  env: { ...process.env },
  stdio: 'inherit',
  windowsHide: false,
});

if (result.error) {
  console.error(`[prisma-env] Failed to start Prisma: ${result.error.message}`);
  process.exit(1);
}

if (typeof result.status === 'number') process.exit(result.status);
if (result.signal) console.error(`[prisma-env] Prisma exited because of signal: ${result.signal}`);
process.exit(1);
