# VoidCriptUI API

Base URL: `http://localhost:8100/api/v1` in local development.

## Core endpoints

- `GET /health`
- `GET /health/ready`
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/mfa/verify`
- `POST /auth/logout`
- `GET /me`
- `POST /2fa/totp/setup`
- `POST /2fa/totp/enable`
- `POST /2fa/challenge`
- `POST /2fa/link`
- `GET /notifications`
- `GET /community/threads`
- `POST /community/threads`
- `POST /admin/roles`
- `POST /admin/users/:uid/role`

Interactive OpenAPI documentation is available at `/api-docs` when the API is running.
