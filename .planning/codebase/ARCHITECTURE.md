---
last_mapped_commit: dbe980a72bf9357010fabf77e4c8695d6ff9d1d2
last_mapped_at: 2026-11-01
---
<!-- refreshed: 2026-11-01 -->
# Architecture

**Analysis Date:** 2026-11-01

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     Next.js App Router (client pages)                │
│  `app/characters/page.tsx`  `app/create/page.tsx`                    │
│  `app/character/[id]/page.tsx`  (all "use client")                   │
└───────────┬───────────────────────────────┬─────────────────────────┘
            │ TanStack Query hooks          │ Zustand store (inline edit)
            ▼                               ▼
┌──────────────────────────────┐   ┌──────────────────────────────────┐
│ `lib/api/queries.ts`         │   │ `lib/store/character.ts`         │
│ `lib/api/client.ts` (hc RPC) │   │ (editing state; saveField stub)  │
└───────────┬──────────────────┘   └──────────────────────────────────┘
            │ HTTP  /api/characters/...
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Hono API  `app/api/[[...route]]/route.ts` (basePath `/api`)         │
│  `app/api/[[...route]]/characters/index.ts` (routes + zValidator)    │
└───────────┬───────────────────────────────┬─────────────────────────┘
            │ zod schemas                    │ pure functions
            ▼                                ▼
┌──────────────────────────────┐   ┌──────────────────────────────────┐
│ `lib/schemas/*.ts`           │   │ `lib/calculations/index.ts`      │
│ `lib/constants/character.ts` │   │ `lib/defaults/character.ts`      │
└──────────────────────────────┘   └──────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Data access: `lib/db/index.ts` (Prisma client singleton)           │
│  Generated client: `lib/generated/prisma` (gitignored)              │
└───────────┬─────────────────────────────────────────────────────────┘
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PostgreSQL, table `characters` (`prisma/schema.prisma`)            │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root layout + providers | HTML shell, Geist fonts, `QueryProvider`, sonner `Toaster` | `app/layout.tsx`, `providers/query-provider.tsx` |
| Root redirect | Middleware sends `/` to `/characters`; `app/page.tsx` is a fallback spinner | `middleware.ts`, `app/page.tsx` |
| Character list page | Search, pagination, delete via query hooks | `app/characters/page.tsx` |
| Character creation page | Form that POSTs a new character | `app/create/page.tsx` |
| Character sheet page | Loads one character, sanitizes arrays/objects, renders tabbed layout | `app/character/[id]/page.tsx` |
| Tabbed sheet layout | Sticky 4-tab nav, modals for skills and attributes | `components/forms/character-layout.tsx` |
| Tab sections | Basic info, skills & kit, spells & talents, notes | `components/character/*-tab.tsx` |
| Inline editable fields | Click-to-edit fields that auto-save via `useUpdateCharacter` | `components/ui/editable-field.tsx`, `components/ui/editable-scaling-field.tsx` |
| Edit-state store | Zustand store for which field is being edited, pending changes | `lib/store/character.ts` |
| API server | Hono app mounted at `/api`, typed routes, error mapping | `app/api/[[...route]]/route.ts`, `app/api/[[...route]]/characters/index.ts` |
| Typed API client | `hc<AppType>` RPC client used by hooks | `lib/api/client.ts` |
| Query/mutation hooks | TanStack Query wrappers around the RPC client | `lib/api/queries.ts` |
| Validation schemas | Zod request/response schemas and inferred types | `lib/schemas/character.ts`, `lib/schemas/calculations.ts` |
| Game rules | Pure calculation functions (attributes, vitality, berkana, skills, XP, level-up) | `lib/calculations/index.ts` |
| Constants and defaults | Attribute/skill lists, labels, XP and berkana formulas, default character payload | `lib/constants/character.ts`, `lib/defaults/character.ts` |
| Prisma singleton | Shared `PrismaClient` with dev-hot-reload caching | `lib/db/index.ts` |

## Pattern Overview

**Overall:** Single Next.js project with a client-rendered UI (App Router, `"use client"` pages) backed by an in-project Hono API under `/api` that is a Next route handler. Business rules live in pure functions in `lib/calculations`. Persistence is a single Prisma model with JSON columns.

**Key Characteristics:**
- Full-stack monolith deployed as one Vercel project (`vercel.json`, function `app/api/[[...route]]/route.ts`, `maxDuration: 30`, region `gru1`).
- Client pages fetch everything over HTTP; there are no server components that query the database. Pages are all `"use client"`.
- End-to-end types: `AppType` exported from `app/api/[[...route]]/route.ts` is consumed by `hc<AppType>` in `lib/api/client.ts`, so the client is typed from the server routes.
- Zod is the single source for validation (`zValidator` on the server, `z.infer` types on the client).
- Character data is stored largely as untyped JSON columns (`attributes`, `vitality`, `skills`, `weapons`, `spells`, `talents`, etc.); shape is enforced in zod, not in the DB.
- UI is in Portuguese (pt-BR); user-facing strings and code comments are Portuguese.

## Layers

**UI pages (routing layer):**
- Purpose: Route entry points and page-level state
- Location: `app/`
- Contains: `page.tsx` files, `layout.tsx`, `globals.css`
- Depends on: `lib/api/queries.ts`, `components/`, `providers/`
- Used by: Next.js router

**Feature components:**
- Purpose: Character sheet UI, split by tab
- Location: `components/character/`, `components/forms/`
- Contains: Tab components, modals, quick-actions bar, `types.ts` (`CharacterTabProps`)
- Depends on: `components/ui/`, `lib/api/queries.ts`, `lib/store/character.ts`, `lib/constants/`
- Used by: `app/character/[id]/page.tsx`

**Generic UI primitives:**
- Purpose: shadcn/ui components and inline-edit building blocks
- Location: `components/ui/`
- Contains: Radix-based primitives (`button.tsx`, `dialog.tsx`, `tabs.tsx`, ...) plus `editable-field.tsx` and `editable-scaling-field.tsx`, which are the only `components/ui` files with domain logic (they call `useUpdateCharacter`)
- Depends on: `lib/store/character.ts`, `lib/api/queries.ts`
- Used by: feature components

**Client data layer:**
- Purpose: Talk to the API and cache server state
- Location: `lib/api/`, `providers/`
- Contains: `client.ts` (hc client, base URL resolution), `queries.ts` (hooks), `providers/query-provider.tsx` (QueryClient, staleTime 60s, retry false)
- Depends on: `app/api/[[...route]]/route.ts` (type-only import of `AppType`)
- Used by: pages and feature components

**Client edit-state layer:**
- Purpose: Track inline edit session state
- Location: `lib/store/character.ts`
- Contains: `useCharacterStore` (Zustand + devtools) and selector hooks (`useIsFieldEditing`, `useHasPendingChanges`, `useFieldValue`, `useCalculatedStats`)
- Depends on: `lib/schemas/character.ts` types
- Used by: `components/ui/editable-field.tsx`, `components/ui/editable-scaling-field.tsx`, `components/character/basic-info-tab.tsx`

**API layer:**
- Purpose: HTTP endpoints, validation, orchestration of DB and calculations
- Location: `app/api/[[...route]]/`
- Contains: `route.ts` (Hono root, `basePath('/api')`, exports GET/POST/PUT/DELETE via `hono/vercel` `handle`), `characters/index.ts` (all character routes)
- Depends on: `lib/schemas/`, `lib/calculations/`, `lib/defaults/`, `lib/db/`
- Used by: `lib/api/client.ts`

**Domain / business logic:**
- Purpose: Game-rule math with no I/O
- Location: `lib/calculations/index.ts`, `lib/constants/character.ts`
- Contains: `calculateAllAttributes`, `calculateVitalityLevels`, `calculateMaxBerkana`, `calculateAllSkills`, `validateSkillDistribution`, `processLevelUp`, `getXPRequiredForNextLevel`, `getTotalXPForLevel`, etc.
- Depends on: nothing app-internal
- Used by: API routes, and the UI through constants

**Data access:**
- Purpose: Prisma client and schema
- Location: `lib/db/index.ts`, `prisma/schema.prisma`, generated output `lib/generated/prisma`
- Contains: Single model `Character` mapped to table `characters`
- Depends on: `DATABASE_URL` env var (value not recorded here)
- Used by: `app/api/[[...route]]/characters/index.ts` only

## Data Flow

### Primary Request Path: load a character sheet

1. `app/character/[id]/page.tsx` reads the `id` param and calls `useCharacter(id)` (`lib/api/queries.ts`).
2. The hook calls `api.characters[':id'].$get` on the `hc` client (`lib/api/client.ts`), which hits `/api/characters/:id`.
3. `app/api/[[...route]]/route.ts` dispatches to the `characters` sub-app (`app/api/[[...route]]/characters/index.ts`). `zValidator('param', getCharacterParamsSchema)` validates the id.
4. The handler calls `db.character.findUnique` (`lib/db/index.ts`) and returns the row through `getCharacterResponseSchema.parse`.
5. The page sanitizes arrays and objects (`weapons`, `spells`, `vitality`, etc.) and passes `character` into `CharacterLayout` (`components/forms/character-layout.tsx`), which renders the four tabs.

### Secondary Flow: inline field edit (auto-save)

1. A user clicks an `EditableField` (`components/ui/editable-field.tsx`). It calls `startEditing(section, field, value)` on `useCharacterStore`.
2. On save, if no custom `onSave` is supplied and a `characterId` is available, it builds a partial payload with `buildUpdateData` and calls `useUpdateCharacter().mutateAsync({ id, data })` (`lib/api/queries.ts`).
3. `PUT /api/characters/:id` validates with `updateCharacterSchema`, confirms the row exists, then runs `db.character.update`.
4. On success, the mutation writes the returned row into the `['character', id]` query cache and invalidates `['characters']`.
5. The fallback branch (no `characterId`) calls `useCharacterStore.getState().updateField` and `saveField()`. `saveField` is a placeholder that waits 500 ms and does not persist (see Anti-Patterns).

### Level-up Flow

1. `POST /api/characters/:id/level-up` loads the character, calls `processLevelUp` (`lib/calculations/index.ts`), and writes `level`, `currentXP`, `maxBerkana`.
2. `useLevelUpCharacter` (`lib/api/queries.ts`) invalidates the character and list queries. No component in the current UI calls this hook; the flow exists as API and hook only.

### Create Flow

1. `app/create/page.tsx` calls `useCreateCharacter`, which POSTs to `/api/characters`.
2. The route merges user input with `getDefaultCharacterData()` (`lib/defaults/character.ts`) and creates the row. Note the defaults are spread after the input, so they override user-supplied fields that share a key.
3. The hook invalidates `['characters']`.

**State Management:**
- Server state: TanStack Query, keys `['characters', params]` and `['character', id]`, staleTime 60 s, retries disabled (`providers/query-provider.tsx`).
- Edit state: Zustand store `lib/store/character.ts` (`editingField`, `pendingChanges`, `isSaving`).
- Local UI state: `useState` in pages and layout (active tab, modal open flags, `isEditMode`).

## Key Abstractions

**Hono typed RPC route tree:**
- Purpose: Share route types between server and client without codegen
- Examples: `app/api/[[...route]]/route.ts` (`export type AppType`), `lib/api/client.ts`
- Pattern: Chained `.get/.post/.put/.delete` on a Hono instance with `zValidator` middleware

**Zod schema triplets:**
- Purpose: Request validation, response shaping, and TypeScript types from one definition
- Examples: `lib/schemas/character.ts` (`createCharacterSchema`, `updateCharacterSchema`, `characterFullSchema`), `lib/schemas/calculations.ts` (`calculateVitalityRequestSchema`, `calculateVitalityResponseSchema`, ...)
- Pattern: `export const xSchema = z.object(...)` then `export type X = z.infer<typeof xSchema>`

**Pure calculation functions:**
- Purpose: Game rules (attribute totals, vitality tiers, berkana, skill points, XP curve)
- Examples: `lib/calculations/index.ts`, `lib/constants/character.ts` (`calculateXPForNextLevel`, `calculateBerkana`, `calculateVitality`)
- Pattern: Plain exported functions taking primitives or records and returning numbers or objects. Two parallel sets exist (see Anti-Patterns).

**Prisma singleton:**
- Purpose: Avoid multiple `PrismaClient` instances under Next dev hot reload
- Examples: `lib/db/index.ts`
- Pattern: `globalThis.prisma` cache when `NODE_ENV !== 'production'`

**Feature tab component:**
- Purpose: Each sheet tab is a self-contained component taking `CharacterTabProps`
- Examples: `components/character/basic-info-tab.tsx`, `components/character/skills-kit-tab.tsx`, `components/character/spells-talents-tab.tsx`, `components/character/notes-tab.tsx`
- Pattern: Barrel export in `components/character/index.ts`; props `character`, `characterId`, `isEditMode`, plus modal open state

## Entry Points

**Root layout:**
- Location: `app/layout.tsx`
- Triggers: Every page request
- Responsibilities: HTML shell (`lang="pt-BR"`), fonts, `QueryProvider`, `Toaster`

**Middleware:**
- Location: `middleware.ts`
- Triggers: Requests that match the matcher, which excludes `api`, `_next/static`, `_next/image`, `favicon.ico`, and image extensions
- Responsibilities: Redirect `/` to `/characters`

**API catch-all:**
- Location: `app/api/[[...route]]/route.ts`
- Triggers: Any `/api/*` request
- Responsibilities: Hono app with `basePath('/api')`, exports the HTTP verbs via `hono/vercel`

**Character list:**
- Location: `app/characters/page.tsx`
- Triggers: Redirect from `/`, navigation
- Responsibilities: Search, pagination, delete

**Character sheet:**
- Location: `app/character/[id]/page.tsx`
- Triggers: Navigation from the list or after creation
- Responsibilities: Fetch, sanitize, and render the tabbed sheet

**Character create:**
- Location: `app/create/page.tsx`
- Triggers: Navigation
- Responsibilities: Collect initial data and POST it

## Architectural Constraints

- **Threading:** Single-threaded Node/edge request handling via Next.js and Vercel functions. No worker threads. Client UI runs on the browser main thread.
- **Global state:** `lib/db/index.ts` caches `PrismaClient` on `globalThis` in non-production. `providers/query-provider.tsx` keeps a module-level `browserQueryClient`. `lib/store/character.ts` is a module-level Zustand store singleton.
- **Circular imports:** None observed. The only server-to-client type dependency is `lib/api/client.ts` importing the type `AppType` from `app/api/[[...route]]/route.ts`, which is type-only and does not create a runtime cycle.
- **Runtime boundary:** Client code must never import `lib/db` or `lib/generated/prisma`. Only `app/api/[[...route]]/characters/index.ts` does.
- **Generated code:** `lib/generated/prisma` is produced by `prisma generate` (run by `postinstall` and `build` in `package.json`). It is gitignored; do not edit it.
- **Deployment window:** The API function has `maxDuration: 30` in `vercel.json`.

## Anti-Patterns

### Edit state that never persists

**What happens:** `saveField` in `lib/store/character.ts` waits 500 ms with a `setTimeout` and clears the editing state. It makes no API call. `components/ui/editable-field.tsx` reaches this path only when no `characterId` is passed.
**Why it's wrong:** A caller that relies on the store fallback sees a success state but nothing is saved. The store's `pendingChanges`, `savePendingChanges`, and `addPendingChange` are also not wired to the API.
**Do this instead:** Persist through `useUpdateCharacter` from `lib/api/queries.ts`, as `editable-field.tsx` does on its main branch. Pass `characterId` or a custom `onSave`.

### Duplicate calculation logic

**What happens:** Vitality, berkana, attribute, and skill math exists in both `lib/calculations/index.ts` (for example `calculateVitalityLevels`, `calculateMaxBerkana`) and `lib/constants/character.ts` (for example `calculateVitality`, `calculateBerkana`, `calculateSkillBonus`). The API uses the first set.
**Why it's wrong:** The two can drift. Hard-coded values also differ: the `recalculate` route passes a literal `100` as `baseValue` to `calculateMaxBerkana`, which ignores the stored character state.
**Do this instead:** Add or change game rules only in `lib/calculations/index.ts`. Import from there in both the server and UI.

### Loosely typed JSON columns

**What happens:** Routes call `character.attributes as any`, `character.vitality as any`, and similar casts before passing values to calculations. `CharacterTabProps.character` is typed `any`.
**Why it's wrong:** Schema drift in the JSON columns is not caught at compile time, and the response parse uses `characterFullSchema` only on reads.
**Do this instead:** Parse stored JSON with the matching zod schema from `lib/schemas/character.ts` before use, and type `character` as `CharacterFull`.

### Stale project docs

**What happens:** `.kiro/steering/tech.md` describes Next.js 15.4.4, Bun-first commands, and a `lib/types/` folder. `.kiro/steering/structure.md` describes a `lib/generated` location that is correct but says `lib/types/` exists. `package.json` pins `next` at `^16.0.7`. `README.md` is the create-next-app template.
**Why it's wrong:** Agents following those files will use the wrong versions and paths.
**Do this instead:** Treat `package.json`, `prisma/schema.prisma`, and the source tree as authoritative. See `STRUCTURE.md` for the actual layout.

## Error Handling

**Strategy:** Each Hono handler wraps its body in `try/catch`, logs with `console.error`, and returns a JSON `{ error }` body with status 500. Known misses return 404 with `{ error: 'Character not found' }`. Validation failures are handled by `zValidator`, which returns 400.

**Patterns:**
- Route-level `try/catch` in `app/api/[[...route]]/characters/index.ts`, with Portuguese error messages
- Client hooks in `lib/api/queries.ts` throw `Error` objects from `response.json().error`, and components show them with `sonner` toasts
- Pages render an error card when `useCharacter` returns an error (`app/character/[id]/page.tsx`)

## Cross-Cutting Concerns

**Logging:** `console.error` in API catch blocks. No logging library is installed.
**Validation:** Zod through `@hono/zod-validator` on the server. Client forms use `react-hook-form` with `@hookform/resolvers` (see `components/ui/form.tsx`).
**Authentication:** None in the app code. `middleware.ts` only performs the root redirect. The API has no auth checks, so any caller who can reach `/api/characters` can read, modify, or delete characters.

---

*Architecture analysis: 2026-11-01*
