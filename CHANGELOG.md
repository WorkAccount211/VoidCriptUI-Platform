# Changelog

## 2026-09-02

- Fixed Prisma CLI environment loading for root `.env` in workspace commands.
- Fixed Fastify bootstrap so the API no longer relies on CommonJS-incompatible top-level `await`.
- Added `@types/qrcode` for strict TypeScript builds.
- Fixed Next.js documentation card typing.
- Fixed setup sidebar tuple typing.
- Fixed Telegram `ctx.from` strictness errors.
- Improved Discord notification-channel configuration visibility.
- Made environment loading robust for workspace scripts and direct execution.
- Switched transactional email configuration to Gmail API OAuth 2.0.
- Updated local Web port to 4080 and API port to 8100.
- Added a first-run Windows bootstrap script.
- Added current `.env.example` entries for Discord OAuth and Gmail OAuth.
