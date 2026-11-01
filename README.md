# RPG Character Sheet

Digital character sheet, in Brazilian Portuguese (pt-BR), for a homebrew tabletop RPG system. It covers Berkana (mana), six-stage vitality, 14 attributes, 36 skills, spells and talents with level scaling, the adventure kit, finances and notes. The owner and their play group use it at the table to create characters and edit any field inline, with each change saved as it is made.

## Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16.4.3 (App Router, Turbopack in dev) |
| UI | React 19.1.0, Tailwind CSS 4.1.11, shadcn/ui (Radix), lucide-react, sonner |
| Language | TypeScript 5.8.3 (strict) |
| API | Hono 4.8.9 mounted at `/api` through `app/api/[[...route]]/route.ts`, validated with `@hono/zod-validator` |
| Database | PostgreSQL through Prisma 6.12.0 (client generated into `lib/generated/prisma`) |
| Client data | TanStack Query 5.83.0 (server state), Zustand 5.0.6 (inline edit state) |
| Validation | Zod 4.0.10, shared by the API and the client |
| Lint | ESLint 9.39.5 flat config (`eslint.config.mjs`) extending `eslint-config-next` (core-web-vitals + typescript) |
| Tests | `bun test` |

## Requirements

- Bun 1.2.9 (the version pinned for deployment in `vercel.json`; `bun.lock` is verified to install with `--frozen-lockfile` under it)
- Node 24 (declared in `mise.toml`)
- A reachable PostgreSQL database

## Setup

1. Install dependencies with `bun install`. Its `postinstall` step runs `prisma generate`.
2. Copy `env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL connection string.
3. Create the tables with `bunx prisma db push` (the repository has no `prisma/migrations` directory).
4. Start the dev server with `bun dev`. Opening http://localhost:3000 redirects to `/characters`.

## Commands

| Command | What it does |
| --- | --- |
| `bun dev` | Dev server with Turbopack |
| `bun run build` | `prisma generate` followed by `next build` |
| `bun start` | Serve the production build |
| `bun run lint` | ESLint (`eslint .`) with the flat config |
| `bun test` | Unit tests (calculations, schemas, API concurrency, notes) |
| `npx tsc --noEmit` | Type check |

The definition of done is `npx tsc --noEmit`, `bun run lint`, `bun test` and `bun run build` all passing.

## Project layout

```text
app/
  api/[[...route]]/       Hono app (route.ts) and character routes (characters/)
  character/[id]/         Character sheet page
  characters/             Character list
  create/                 New character form
  page.tsx                Server redirect from / to /characters
components/
  character/              Sheet tabs, modals and quick actions bar
  forms/                  Tabbed sheet layout
  ui/                     shadcn/ui primitives and the two inline editors
hooks/                    Shared React hooks
lib/
  api/                    Typed Hono client, TanStack Query hooks, save concurrency
  calculations/           Pure game-rule math
  constants/              Attribute and skill lists, labels, formulas
  db/                     Prisma client singleton
  defaults/               Default payload for new characters
  schemas/                Zod schemas and inferred types
  store/                  Zustand edit-state store
  generated/              Prisma client output (git-ignored)
prisma/schema.prisma      Single Character model
providers/                TanStack Query provider
```

## API

All routes live under `/api/characters`:

| Method and path | Purpose |
| --- | --- |
| `GET /api/characters` | Paginated list; `page`, `limit` and `search` query parameters |
| `GET /api/characters/:id` | One character |
| `POST /api/characters` | Create a character |
| `PUT /api/characters/:id` | Partial update |
| `DELETE /api/characters/:id` | Delete a character |

`PUT` accepts an optional `expectedUpdatedAt` token with the `updatedAt` the client last saw. The update is a single conditional write: if another session saved first, the API answers `409` ("Character was modified by another session") and the client refetches. A missing character answers `404`. Requests without the token still write unconditionally, for tabs opened before the token existed.

## Notes

- Bun is the only package manager (`bun.lock` is the only lockfile), so use Bun commands only.
- There is no authentication, by design: this is a sheet for a trusted play group.
- Character notes are stored as a JSON string in a `String` column.
- Persisted JSON keys are Portuguese (for example `notavel`, `agilidade`) and must not be renamed, because existing rows depend on them.
- UI text is pt-BR; code identifiers are English.

## Deployment

The app deploys to Vercel (region `gru1`), configured in `vercel.json`:

- install command `bun install` and build command `bun run build`
- the API function `app/api/[[...route]]/route.ts` has a 30 second `maxDuration`
- set `DATABASE_URL` in the Vercel project settings

Vercel uses the `BUN_VERSION` from `vercel.json` (1.2.9). `bun.lock` was verified to install with `bun install --frozen-lockfile` under that version. When the local Bun that writes `bun.lock` is upgraded, repeat that check or bump `BUN_VERSION` to match.
