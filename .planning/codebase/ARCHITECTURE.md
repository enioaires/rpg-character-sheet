---
last_mapped_commit: 216d4bd8bdc9621832748458a63bb5e0b24f8795
last_mapped_at: 2026-11-01
---
<!-- refreshed: 2026-11-01 -->
# Architecture

**Analysis Date:** 2026-11-01

## Pattern Overview

**Overall:** Next.js App Router single-app with a client-rendered sheet UI, a Hono HTTP API mounted inside a catch-all route handler, and a single-table PostgreSQL store accessed through Prisma.

**Key Characteristics:**
- Pages are client components (`"use client"`) that fetch through TanStack Query; there are no server components doing data fetching.
- The only server-side surface is the Hono app in `app/api/[[...route]]/`, which validates with Zod (`@hono/zod-validator`) and talks to Prisma via `lib/db/index.ts`.
- The browser calls the API through a typed Hono RPC client (`lib/api/client.ts`) whose type is `AppType` exported from `app/api/[[...route]]/route.ts`.
- Each character is one row in `characters`; most sheet sections are JSON columns (`attributes`, `skills`, `spells`, `talents`, ...) defined in `prisma/schema.prisma`. The notes column is a `String` holding a JSON-encoded array.
- Writes use optimistic concurrency: every PUT carries `expectedUpdatedAt` and the server answers 409 on a stale token. The client-side logic lives in `lib/api/character-concurrency.ts`.
- Game-rule math (attribute totals, vitality levels, Berkana, skill points, XP) is pure TypeScript in `lib/calculations/index.ts`, shared by server schemas, React Query hooks and components.
- Inline editing is done by per-field components (`components/ui/editable-field.tsx`, `components/ui/editable-scaling-field.tsx`) that call the same mutation hook directly.

## Layers

**Routing / Pages (client):**
- Purpose: Route screens and page-level data loading.
- Location: `app/page.tsx`, `app/characters/page.tsx`, `app/create/page.tsx`, `app/character/[id]/page.tsx`, `app/layout.tsx`
- Contains: Page components, loading/error states, navigation via `next/navigation`.
- Depends on: `lib/api/queries.ts`, `components/forms/character-layout.tsx`, `components/ui/*`, `providers/query-provider.tsx` (through the root layout).
- Used by: Next.js router only.

**Sheet layout and tabs (client):**
- Purpose: Renders the four-tab character sheet, the sticky quick-actions bar and the skills/attributes modals.
- Location: `components/forms/character-layout.tsx` (tab shell), `components/character/*-tab.tsx` (one per tab), `components/character/quick-actions-bar.tsx`, `components/character/skills-modal.tsx`, `components/character/attributes-modal.tsx`
- Contains: Tab wiring, `handleNavigate` scroll-to-section logic, `isEditMode` flag passed down.
- Depends on: Tab components, `components/character/types.ts` (`CharacterTabProps`), `lib/calculations`.
- Used by: `app/character/[id]/page.tsx`.

**Section cards (client):**
- Purpose: Each card owns one part of the sheet and its editable fields.
- Location: `components/character/basic-info/*.tsx`, `components/character/spells-talents/*.tsx`, `components/character/notes/*.tsx`, `components/character/skills-kit-tab.tsx` (kit and skills, single file)
- Contains: Presentational cards plus the inline editors. Cards that persist receive an `updateCharacterMutation` prop from their tab; `profile-cards`, `attribute-cards`, `equipment-cards` and `berkana-card` take the shared `characterId`/`character`/`isEditMode` props.
- Depends on: `components/ui/editable-field.tsx`, `lib/calculations`, `lib/constants/character.ts`, `lib/schemas/character.ts` (types), `lib/notes.ts` (notes only).
- Used by: The tab components.

**Editing primitives (client):**
- Purpose: Inline field editing with a shared "one field in edit at a time" state.
- Location: `components/ui/editable-field.tsx`, `components/ui/editable-scaling-field.tsx`, `lib/store/character.ts`
- Contains: `EditableField`, `EditableTextArea`, `EditableNumberField`, `EditableScalingField`. They call `startEditing`/`cancelEditing` on the Zustand store and `mutateAsync` on `useUpdateCharacter`.
- Depends on: `lib/api/queries.ts`, `lib/store/character.ts`, `lib/calculations`.
- Used by: Every section card.

**Data-fetching and mutation hooks (client):**
- Purpose: Bridge React Query to the typed Hono client; own the concurrency protocol for writes.
- Location: `lib/api/queries.ts` (hooks), `lib/api/character-concurrency.ts` (headless save core), `lib/api/client.ts` (typed `hc` client), `providers/query-provider.tsx` (QueryClient, `staleTime` 60s, `retry: false`)
- Contains: `useCharacters`, `useCharacter`, `fetchCharacter`, `useCreateCharacter`, `useUpdateCharacter`, `useDeleteCharacter`, `useCalculateDerivedStats`; `saveCharacterUpdate`, `enqueueCharacterSave`, `handleCharacterSaveError`.
- Depends on: `hono/client`, `@tanstack/react-query`, `sonner` (in `queries.ts` only), `lib/schemas/character.ts` (request types).
- Used by: Pages and section cards.

**API (server):**
- Purpose: HTTP interface for characters under `/api/characters`.
- Location: `app/api/[[...route]]/route.ts` (Hono app, `basePath('/api')`, exports `GET`/`POST`/`PUT`/`DELETE` via `hono/vercel` `handle`), `app/api/[[...route]]/characters/index.ts` (route definitions and the `invalidJsonHook`).
- Contains: Four handlers: list (`GET /`), read (`GET /:id`), create (`POST /`), update (`PUT /:id`), delete (`DELETE /:id`). No other endpoints exist.
- Depends on: `lib/schemas/character.ts`, `lib/defaults/character.ts`, `lib/db/index.ts`.
- Used by: `lib/api/client.ts` only.

**Schemas and domain logic (shared):**
- Purpose: Validation, response shaping and game rules used on both sides.
- Location: `lib/schemas/character.ts` (request/response/entity schemas, inferred types), `lib/schemas/calculations.ts` (per-field schemas), `lib/calculations/index.ts` (pure math), `lib/constants/character.ts` (attribute, skill, vitality constants and pagination limits), `lib/defaults/character.ts` (creation defaults)
- Contains: `getCharactersQuerySchema`, `updateCharacterSchema`, `createCharacterSchema`, `characterFullSchema`, `calculateAttributeTotal`, `calculateVitalityLevels`, `calculateMaxBerkana`, `processLevelUp`, `toAttributeValue`, `getDefaultCharacterData`.
- Depends on: `zod` only.
- Used by: API routes, hooks, cards, the Zustand store.

**Notes pipeline (shared):**
- Purpose: Read, migrate and write the `notes` column safely.
- Location: `lib/notes.ts` (parse/migrate/serialize, `Note` type, `canWriteNotes`, `claimLegacyMigration`), `lib/notes-format.ts` (escape-then-format HTML for note bodies)
- Contains: `parseNotes` returns one of `empty | ok | legacy | corrupted`; corrupted values block writes so the original text is never overwritten.
- Depends on: `zod` (`looseObject` keeps unknown note keys on round-trip).
- Used by: `components/character/notes-tab.tsx` and `components/character/notes/*`.

**Persistence (server):**
- Purpose: Single Prisma client for the app.
- Location: `lib/db/index.ts` (singleton cached on `globalThis` outside production), `prisma/schema.prisma` (generator output `lib/generated/prisma`, datasource `DATABASE_URL`).
- Contains: One model, `Character` (mapped to `characters`).
- Depends on: PostgreSQL via `DATABASE_URL`.
- Used by: `app/api/[[...route]]/characters/index.ts`.

## Data Flow

### Primary Read Path (sheet view)

1. `app/character/[id]/page.tsx` calls `useCharacter(id)` (`lib/api/queries.ts`), which runs `fetchCharacter` against `api.characters[':id'].$get`.
2. `lib/api/client.ts` resolves the base URL (`window.location.origin` in the browser, `VERCEL_URL` or `NEXT_PUBLIC_APP_URL` on the server) and issues the request.
3. `GET /api/characters/:id` in `app/api/[[...route]]/characters/index.ts` validates the param, calls `db.character.findUnique`, and returns `getCharacterResponseSchema.parse({ character })`.
4. The page sanitizes arrays/objects (`weapons`, `spells`, `vitality`, ...) and passes `sanitizedCharacter` to `CharacterLayout` (`components/forms/character-layout.tsx`).
5. Tabs render section cards; each card computes derived values with `lib/calculations` during render (no client store copy of the character is kept).

### Inline Edit and Save Path

1. A user clicks a field; `EditableField` (`components/ui/editable-field.tsx`) calls `startEditing(section, field, value)` on `useCharacterStore` (`lib/store/character.ts`). The store holds only `editingField` and the cancel/start actions.
2. On commit, the field calls `updateCharacterMutation.mutateAsync({ id, data })`. `useUpdateCharacter` (`lib/api/queries.ts`) forwards to `saveCharacterUpdate` (`lib/api/character-concurrency.ts`).
3. `saveCharacterUpdate` reads the base `updatedAt` from the React Query cache synchronously, enqueues the task on a per-character serial queue (`enqueueCharacterSave`), and resolves the token through the device's own version lineage (`resolveOwnVersion`).
4. It calls `api.characters[':id'].$put` with `expectedUpdatedAt` appended to the body.
5. `PUT /api/characters/:id` performs one conditional `db.character.update({ where: { id, updatedAt } })`. On `P2025` it distinguishes 404 (row missing) from 409 (row changed). The response carries the row returned by that same UPDATE.
6. On success, `saveCharacterUpdate` records the sent-to-returned version pair, cancels in-flight GETs for that key, and writes the response into `['character', id]` with `setQueryData`. On 409 it throws `CharacterConflictError`; `handleCharacterSaveError` shows one toast (stable id `character-conflict-<id>`) and invalidates the character query to refetch.
7. `useUpdateCharacter.onSuccess` invalidates `['characters']` so the list stays current.

### List and Search Path

1. `app/characters/page.tsx` calls `useCharacters({ page, limit, search })`, hitting `GET /api/characters`.
2. The handler builds a case-insensitive `OR` filter on `characterName` and `playerName`, selects only summary columns, orders by `updatedAt desc`, and returns `{ characters, total, page, limit }`.
3. Delete goes through `useDeleteCharacter` (`DELETE /api/characters/:id`) and invalidates `['characters']`.

### Create Path

1. `app/create/page.tsx` submits through `useCreateCharacter` (`POST /api/characters`), body validated by `createCharacterSchema`.
2. The handler merges the body with `getDefaultCharacterData()` (`lib/defaults/character.ts`) and creates the row; the response is `createCharacterResponseSchema`.
3. The list cache is invalidated; the page then routes to `/character/[id]`.

### Notes Path

1. `NotesTab` (`components/character/notes-tab.tsx`) runs `parseNotes(character.notes)` in a `useMemo`. Status `legacy` (plain text from older versions) triggers a one-time migration guarded by `claimLegacyMigration`, which is keyed to the character id and the legacy text so Strict Mode remounts do not repeat it.
2. Writes go through `serializeNotes` and `useUpdateCharacter` as the `notes` string field. `guardWrite` refuses writes when the status is `legacy` (until migrated) or `corrupted`.
3. Note bodies render via `formatNoteHtml` (`lib/notes-format.ts`), which escapes HTML before adding the fixed set of tags.

**State Management:**
- Server state: TanStack Query, cache key `['character', id]` for one sheet and `['characters', params]` for the list. `staleTime` 60 s, `retry: false`.
- Editing state: Zustand (`lib/store/character.ts`, `devtools` middleware) holds only `editingField`. Its `character` slice and `setCharacter`/`reset` exist but no component reads or calls them, so the sheet's source of truth is the React Query cache.
- Local UI state: `useState` inside pages and tabs (`isEditMode`, `activeTab`, modal open flags, note dialog state). `isEditMode` defaults to `true` in `app/character/[id]/page.tsx`.

## Key Abstractions

**`CharacterFull` / `CharacterData`:**
- Purpose: The character entity as validated by the server and as received by the client (dates as strings).
- Examples: `lib/schemas/character.ts` (`characterFullSchema`), `components/character/types.ts` (`CharacterData`).
- Pattern: Zod schema with `z.infer`; the client type omits `createdAt`/`updatedAt` and re-adds them as `string`.

**`CharacterTabProps`:**
- Purpose: Common prop contract for every sheet tab and its cards.
- Examples: `components/character/types.ts`, implemented by `basic-info-tab.tsx`, `skills-kit-tab.tsx`, `spells-talents-tab.tsx`, `notes-tab.tsx`.
- Pattern: `{ character, characterId, isEditMode, ...modal flags }`. `UpdateCharacterMutation` (`ReturnType<typeof useUpdateCharacter>`) is the type for the mutation prop passed to cards.

**Calculation functions:**
- Purpose: Derived stats (attribute totals, vitality thresholds, Berkana max, skill points, XP per level).
- Examples: `lib/calculations/index.ts` (`calculateAllAttributes`, `calculateVitalityLevels`, `calculateMaxBerkana`, `processLevelUp`), with the coercion helpers `toAttributeValue`, `toSkillValue`, `toVitalityBase`.
- Pattern: Pure functions with no React or Prisma imports; covered by `lib/calculations/index.test.ts`.

**Concurrency core:**
- Purpose: Headless optimistic-concurrency write path, testable under `bun test`.
- Examples: `lib/api/character-concurrency.ts`, tested in `lib/api/character-concurrency.test.ts`.
- Pattern: Dependency injection. `saveCharacterUpdate` receives `put` and `fetchCharacter` as arguments, so it does not import React, sonner or the Hono client.

**Notes value object:**
- Purpose: Safe round-trip of the `notes` string column.
- Examples: `lib/notes.ts` (`parseNotes`, `serializeNotes`, `migrateLegacyNotes`, `createNote`, `moveNote`), `lib/notes.test.ts`.
- Pattern: Discriminated union `ParsedNotes` (`empty | ok | legacy | corrupted`); functions never throw.

## Entry Points

**Root redirect:**
- Location: `app/page.tsx`
- Triggers: Requests to `/`.
- Responsibilities: Calls `redirect("/characters")`. The former `middleware.ts` is no longer present.

**Character list:**
- Location: `app/characters/page.tsx`
- Triggers: Navigation to `/characters`.
- Responsibilities: Search, pagination, delete, link to create and sheet.

**Character sheet:**
- Location: `app/character/[id]/page.tsx`
- Triggers: Navigation to `/character/:id`.
- Responsibilities: Fetches one character, shows loading/error states, header with refresh, mounts `CharacterLayout`.

**Create character:**
- Location: `app/create/page.tsx`
- Triggers: Navigation to `/create`.
- Responsibilities: Name/player form, `useCreateCharacter`, then redirect to the new sheet.

**HTTP API:**
- Location: `app/api/[[...route]]/route.ts`
- Triggers: Any `GET|POST|PUT|DELETE /api/*` request (Vercel function, `maxDuration` 30 s from `vercel.json`).
- Responsibilities: Mounts `characters` routes; exports `AppType` for the typed client.

**Root layout:**
- Location: `app/layout.tsx`
- Triggers: Every page render.
- Responsibilities: Fonts (Geist, Geist Mono), `lang="pt-BR"`, `QueryProvider`, `Toaster` from `components/ui/sonner.tsx`.

## Architectural Constraints

- **Threading:** Single-threaded JavaScript on the client and in Vercel serverless functions. No worker threads or background jobs exist.
- **Global state:** Module-level singletons: the Prisma client in `lib/db/index.ts` (cached on `globalThis` outside production), the React Query client in `providers/query-provider.tsx` (per-browser singleton), the per-character save queues and version lineage maps in `lib/api/character-concurrency.ts`, the legacy-migration claim set in `lib/notes.ts`, and the Zustand store in `lib/store/character.ts`. The save queues and lineage maps are per browser tab; they do not coordinate across tabs or devices.
- **Circular imports:** `lib/api/client.ts` imports the `AppType` type from `app/api/[[...route]]/route.ts`, and that route imports the character routes. This is type-only in the browser path and does not create a runtime cycle.
- **Server/client boundary:** `lib/schemas/*`, `lib/calculations/*`, `lib/notes*.ts` and `lib/defaults/*` are imported by both sides and must stay free of Node-only or DOM-only APIs.
- **Compatibility branch:** A PUT without `expectedUpdatedAt` is still accepted and writes unconditionally (`app/api/[[...route]]/characters/index.ts`) for tabs opened before the concurrency deploy. A follow-up in the code comment proposes making the token required.
- **Language:** Domain keys (`agilidade`, `notavel`, ...) are Portuguese and persisted as JSON keys; do not rename them.

## Anti-Patterns

### Duplicated persistence hook instances per tab

**What happens:** `BasicInfoTab`, `SpellsTalentsTab`, `NotesTab` and `SkillsKitTab` each call `useUpdateCharacter()` at their top level, and some cards call it again through their own `EditableField` children (`components/ui/editable-field.tsx`).
**Why it's wrong:** Each call creates a separate `useMutation` observer. Pending and error state is not shared, so a save in one field does not disable or inform another. Concurrency still works because the queue and lineage are module-level in `lib/api/character-concurrency.ts`, not per hook.
**Do this instead:** Keep the mutation at the tab (as `BasicInfoTab` does for cards) and pass `updateCharacterMutation` down, as `components/character/spells-talents-tab.tsx` already does for `SpellsCard`/`TalentsCard`. Do not add a new hook instance in leaf components.

### Writing the whole `notes` column for every change

**What happens:** `NotesTab` serializes the full note array and sends it as one `notes` string on each add/edit/move/delete.
**Why it's wrong:** Two devices editing notes race on the same column; the second save gets 409 and the user must redo the change. Notes are not separately addressable.
**Do this instead:** Keep the optimistic-concurrency token path (`lib/api/character-concurrency.ts`) and rely on the 409 toast. Any new list-shaped data should follow the same whole-column pattern only if it is small, otherwise model a separate table.

### Reading the character from the Zustand store

**What happens:** The store (`lib/store/character.ts`) exposes `character`, `setCharacter`, and `reset`, but nothing calls them.
**Why it's wrong:** A future component could read a stale copy that the React Query cache no longer matches.
**Do this instead:** Read the character from `useCharacter(id)` or from the `character` prop passed down through `CharacterLayout`. Use the store only for `editingField`.

## Error Handling

**Strategy:** Server handlers catch errors per route, log with `console.error`, and return a JSON `{ error }` with 400/404/409/500. Client hooks convert non-OK responses into `Error` objects; the conflict path is special-cased.

**Patterns:**
- Request validation failures use `zValidator` and, for PUT bodies, `invalidJsonHook` (`app/api/[[...route]]/characters/index.ts`) returning `{ error: 'Dados inválidos', issues }` with paths and messages only, never the request body.
- Prisma "record not found" is detected by code `P2025` with duck typing (`isRecordNotFoundError`) so tests can use a fake database.
- Conflicts surface as `CharacterConflictError` (409) and a single `toast.error` with id `character-conflict-<id>`, followed by a refetch.
- Toasts (sonner) carry Portuguese messages; mutation `onError` in `useUpdateCharacter` handles only conflicts, leaving other errors to each caller's `catch`.

## Cross-Cutting Concerns

**Logging:** `console.error` in API handlers only. No logging library is present.

**Validation:** Zod on both sides: `zValidator` for route inputs, `safeParse` in `lib/notes.ts`, and `.parse` on response objects before returning them from the API.

**Authentication:** None. The app has no auth layer and no middleware; access control is absent by design (single-group use).

**Internationalization:** None. UI strings are hard-coded Brazilian Portuguese; `lang="pt-BR"` is set in `app/layout.tsx`; `date-fns` uses the `ptBR` locale in `app/characters/page.tsx`.

---

*Architecture analysis: 2026-11-01*
