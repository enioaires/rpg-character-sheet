---
last_mapped_commit: 216d4bd8bdc9621832748458a63bb5e0b24f8795
last_mapped_at: 2026-11-01
---
<!-- refreshed: 2026-11-01 -->
# External Integrations

**Analysis Date:** 2026-11-01

## APIs & External Services

**Third-party APIs:**
- None detected. No outbound `fetch`, SDK, or HTTP client calls to external services exist in `app/`, `lib/`, `components/`, `providers/`, or `hooks/`. The only HTTP calls are the app's own API through the Hono client (`lib/api/client.ts`, `lib/api/queries.ts`).

**Build-time font download:**
- Google Fonts (Geist and Geist Mono) via `next/font/google` in `app/layout.tsx`. Fonts are fetched and self-hosted at build time by Next.js; no runtime call to Google from the app code.

**Internal API (same deployment):**
- Hono app at `/api` in `app/api/[[...route]]/route.ts`, consumed by the browser through the typed client `lib/api/client.ts` (`hc<AppType>`)
  - Base URL: `window.location.origin` in the browser; on the server, `https://${VERCEL_URL}`, then `NEXT_PUBLIC_APP_URL`, then `http://localhost:3000`
  - Auth: none (intentional; the app is for a trusted play group)

## Data Storage

**Databases:**
- PostgreSQL - the only persistent store
  - Connection: `DATABASE_URL` (read by `prisma/schema.prisma` via `env("DATABASE_URL")`)
  - Client: Prisma 6.12.0, generated into `lib/generated/prisma` (git-ignored)
  - Access: singleton `db` exported from `lib/db/index.ts`; imported by the server route `app/api/[[...route]]/characters/index.ts`
  - Table: `characters` (model `Character`, `@@map("characters")`)
  - JSON columns hold structured sheet data: `attributes`, `vitality`, `currentVitality`, `skills`, `weapons`, `armor`, `adventureKit`, `finances`, `languages`, `spells`, `talents`. Notes are a `String?` column named `notes`.
  - Free-text search uses Prisma `mode: 'insensitive'` on `characterName` and `playerName` (PostgreSQL-specific behavior)
  - Persisted JSON keys are Portuguese and must not be renamed (see `README.md`)

**File Storage:**
- Local filesystem only for static assets in `public/` (SVG icons, `favicon.ico` in `app/`). No user file uploads.

**Caching:**
- No server-side cache layer (no Redis, KV, or Data Cache configuration).
- Client-side cache: TanStack Query in-memory cache, `staleTime` 60 seconds, `retry: false` (`providers/query-provider.tsx`).

## Authentication & Identity

**Auth Provider:**
- None. This is an intentional owner decision: the sheet is for a trusted play group and is not meant to have authentication.
  - Implementation: no login, session, token, or `middleware.ts` exists. Every `/api/characters` route is open to any caller who can reach the deployment.
  - Edits are guarded by optimistic concurrency, not identity: `PUT /api/characters/:id` accepts an optional `expectedUpdatedAt` and answers `409` on conflict (`lib/api/character-concurrency.ts`, `app/api/[[...route]]/characters/index.ts`).

## Monitoring & Observability

**Error Tracking:**
- None detected. No Sentry, Datadog, Rollbar, or similar SDK in `package.json`.

**Analytics:**
- None detected.

**Logs:**
- Default Next.js and Vercel function logs. No logging library is declared. API error responses are JSON; the request body is not echoed back (see `invalidJsonHook` in `app/api/[[...route]]/characters/index.ts`).

## CI/CD & Deployment

**Hosting:**
- Vercel. `vercel.json` sets framework `nextjs`, install `bun install`, build `bun run build`, region `gru1`, and the API function `maxDuration` of 30 seconds.
- Bun version for the build is pinned through `BUN_VERSION: "1.2.9"` in `vercel.json`.

**CI Pipeline:**
- None detected. No `.github/workflows/` or other CI configuration is tracked in the repository. Quality checks are run manually per `README.md` (`npx tsc --noEmit`, `bun run lint`, `bun test`, `bun run build`).

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string (Prisma datasource; required for the API to serve data)

**Optional env vars read by code:**
- `VERCEL_URL` - set automatically on Vercel; used for the server-side API base URL in `lib/api/client.ts`
- `NEXT_PUBLIC_APP_URL` - optional override for the server-side API base URL in `lib/api/client.ts`
- `NODE_ENV` - standard Next.js variable; controls Prisma client caching in `lib/db/index.ts` and dev-only UI in `components/character/notes/notes-header.tsx`

**Secrets location:**
- Local: `.env` in the repository root (git-ignored via `.env*` in `.gitignore`). Only `env.example` is tracked; it lists `DATABASE_URL` as the sole variable. The contents of `.env` are intentionally not recorded in this document.
- Deployed: Vercel project environment variables (`DATABASE_URL`).

## Webhooks & Callbacks

**Incoming:**
- None. The only inbound HTTP surface is the Hono API under `/api/characters` (`GET`, `POST`, `PUT /:id`, `DELETE /:id`), with no signature verification, since no webhooks are used. `GET /` redirects to `/characters` through `app/page.tsx`.

**Outgoing:**
- None. The server makes no outbound HTTP calls; Prisma connects only to PostgreSQL.

---

*Integration audit: 2026-11-01*
