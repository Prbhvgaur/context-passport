# ContextPassport

ContextPassport is a production-oriented Chrome extension plus backend API for capturing, compressing, storing, and restoring AI chat context across Claude, ChatGPT, Gemini, Perplexity, Copilot, and Grok.

## Architecture

```text
Chrome Extension (MV3)
  |- Content scripts scrape chat state + detect limits
  |- Background worker authenticates, caches, syncs, injects
  |- Popup dashboard manages sessions and resumes work
  `- Options page controls export, privacy, and automation
                |
                v
      Express + TypeScript API on Vercel
  |- Firebase Admin token verification
  |- AES-256-GCM encrypted session storage
  |- Firestore persistence + Upstash caching
  |- Claude compression fallback pipeline
  `- Swagger docs at /api/docs
                |
                v
       Firebase Auth / Firestore / Storage
```

## Monorepo

```text
backend/    Express API, docs, tests, Vercel entrypoint
extension/  Chrome extension, React popup/options, content scripts
shared/     Shared types, schemas, constants, passport formatter
scripts/    Build helpers for icons, asset copy, release zip
docs/       Product and store documentation
```

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | GitHub repository and release automation |
| `FIREBASE_TOKEN` | Firebase CLI automation |
| `VERCEL_TOKEN` | Vercel deployment automation |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin private key |
| `ANTHROPIC_API_KEY` | Claude compression API key |
| `ENCRYPTION_KEY` | 32-byte hex AES-256-GCM key |
| `UPSTASH_REDIS_URL` | Upstash Redis URL |
| `UPSTASH_REDIS_TOKEN` | Upstash Redis token |
| `EXTENSION_CHROME_ID` | Extension ID for strict CORS |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_FIREBASE_API_KEY` | Firebase web API key for the extension |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase web project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase web app ID |
| `VITE_API_BASE_URL` | Backend API base URL for extension runtime |

## Local Setup

1. Install dependencies with `pnpm install`.
2. Generate icons with `pnpm icons`.
3. Build everything with `pnpm build`.
4. Run the backend locally with `pnpm --filter @context-passport/backend dev`.
5. Load the unpacked extension from `extension/dist` in Chrome developer mode.

## Extension Load Instructions

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose `Load unpacked`.
4. Select `extension/dist`.
5. Copy the generated extension ID into `.env` as `EXTENSION_CHROME_ID` for strict production CORS.

## API Reference

Base URL: `/api/v1`

- `POST /sessions`
- `GET /sessions`
- `GET /sessions/:id`
- `PUT /sessions/:id`
- `DELETE /sessions/:id`
- `POST /sessions/:id/resume`
- `POST /sessions/compress`
- `GET /user/profile`
- `PUT /user/preferences`
- `GET /health`

Interactive Swagger docs are served at `/api/docs`.

## Security

- Firebase Admin verifies Google-authenticated Firebase ID tokens.
- Session payloads are encrypted with AES-256-GCM before Firestore writes.
- Firestore and Storage rules enforce per-user isolation.
- Helmet, gzip, CORS allowlists, Zod validation, and rate limiting are enabled.

## CI/CD

- `.github/workflows/ci.yml` runs lint, typecheck, tests, and build on every push and PR.
- `.github/workflows/deploy-backend.yml` deploys the backend to Vercel on `main`.
- `.github/workflows/deploy-extension.yml` builds the extension zip and publishes `v1.0.0`.
