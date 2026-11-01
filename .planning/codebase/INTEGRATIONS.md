---
last_mapped_commit: dbe980a72bf9357010fabf77e4c8695d6ff9d1d2
last_mapped_at: 2026-11-01
---
# External Integrations

**Analysis Date:** 2026-11-01

## APIs & External Services

**Internal HTTP API (first-party, same origin):**
- Hono application served under `/api` from `app/api/[[...route]]/route.ts` (GET, POST, PUT, DELETE exported through `hono/vercel` `handle()`)
  - Characters router: `app/api/[[...route]]/characters/index.ts` (list with pagination and search, get by id, create, update, delete)
  - Typed client: `lib/api/client.ts` (`hc<AppType>`), query helpers in `lib/api/queries.ts`
  - No third-party API calls were found in `app/`, `lib/`, `components/`, or `providers/`

**Fonts:**
- Google Fonts via `next/font/google` - Geist and Geist Mono loaded in `app/layout.tsx`. Fonts are downloaded and self-hosted at build time by Next.js; no runtime request from the app code.

**Documentation tooling (declared, not wired):**
- `@scalar/hono-api-reference` and `@hono/zod-openapi` are in `package.json`. No OpenAPI document or Scalar UI route was found under `app/api/`.

## Data Storage

**Databases:**
- PostgreSQL
  - Connection: `DATABASE_URL` env var (read in `prisma/schema.prisma`; documented in `env.example`)
  - Client: Prisma 6.12.0 (`@prisma/client`), generated into `lib/generated/prisma`
  - Singleton: `lib/db/index.ts` (`export const db = new PrismaClient()`, cached on `globalThis` outside production)
  - Schema: `prisma/schema.prisma` - model `Character` mapped to table `characters`, with `id` as cuid, `createdAt`, `updatedAt`, and the character sheet fields (basic info, level and XP, attributes, skills, spells, notes)
  - Query usage: `app/api/[[...route]]/characters/index.ts` (case-insensitive `contains` search on `characterName` and `playerName`)
  - Migrations: no `prisma/migrations` directory was found; schema changes are applied with `prisma migrate` or `prisma db push` per `.kiro/steering/tech.md`

**File Storage:**
- Local filesystem only for static assets in `public/` (SVG placeholders from the Next.js template, `app/favicon.ico`). No upload or object storage integration.

**Caching:**
- None at the infrastructure level
- Client-side: TanStack Query in-memory cache, `staleTime` 60 seconds (`providers/query-provider.tsx`)
- Next.js default fetch and route caching only

## Authentication & Identity

**Auth Provider:**
- None. No authentication library (NextAuth, Clerk, Supabase Auth, etc.) is in `package.json`.
- The API routes in `app/api/[[...route]]/` do not check identity.
- `middleware.ts` only redirects `/` to `/characters`.

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Bugsnag, or similar SDK in `package.json`)

**Logs:**
- `console` usage only; errors are logged inside try/catch blocks in `app/api/[[...route]]/characters/index.ts`
- Development-only branches in `components/character/notes-tab.tsx` (`process.env.NODE_ENV === "development"`)

**Analytics:**
- None detected

## CI/CD & Deployment

**Hosting:**
- Vercel (`vercel.json` with Next.js framework preset)
- Function region: `gru1`
- API route `maxDuration`: 30 seconds for `app/api/[[...route]]/route.ts`
- Build command: `bun run build` (runs `prisma generate && next build`)
- Install command: `bun install`
- Bun version pinned via `BUN_VERSION` = `1.2.9` in `vercel.json`

**CI Pipeline:**
- None detected (no `.github/workflows/` directory or other CI config in the repo root)

**Git hosting:**
- Repository is a git repo with remote activity on GitHub (commit history in the local repo; `gh` CLI is used for PR operations by the tooling)

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string, required by Prisma at runtime and at `prisma generate` time

**Optional env vars:**
- `VERCEL_URL` - automatically set by Vercel; used by `lib/api/client.ts` for server-side base URL
- `NEXT_PUBLIC_APP_URL` - explicit base URL fallback for server-side calls in `lib/api/client.ts`
- `NODE_ENV` - standard Node/Next variable controlling Prisma client caching in `lib/db/index.ts`

**Secrets location:**
- `.env` file at the repo root holds `DATABASE_URL` locally. It is git-ignored (`.gitignore`: `.env*`). Contents were intentionally not read for this document.
- `env.example` at the repo root is a template with the key name only.
- Production values are expected in the Vercel project environment settings (inferred from `vercel.json` and the Vercel hosting setup). The repo does not record where they are stored.

## Webhooks & Callbacks

**Incoming:**
- None. The only inbound HTTP surface is the first-party Hono API at `/api/characters` (see `app/api/[[...route]]/characters/index.ts`).

**Outgoing:**
- None. No outbound calls to third-party webhooks were found.

---

*Integration audit: 2026-11-01*
