---
phase: quick-261101-iii
plan: 01
type: execute
wave: 5  # advisory; recomputed by `quick-batch update` from depends_on / files_modified (iie 1 → iif 2 → iig 3 → iih 4 → iii 5)
depends_on: ["261101-iie", "261101-iif", "261101-iig", "261101-iih"]
files_modified:
  - "lib/schemas/character.ts"
  - "app/api/[[...route]]/characters/index.ts"
  - "lib/api/character-concurrency.ts"
  - "lib/api/character-concurrency.test.ts"
  - "lib/api/queries.ts"
autonomous: true
requirements: [API-02]

must_haves:
  truths:
    - "A PUT /api/characters/:id that carries the updatedAt the client last saw succeeds, and the returned updatedAt is written into the ['character', id] query cache before the next save from that device reads its token"
    - "A PUT whose expectedUpdatedAt differs from the stored updatedAt returns 409 and leaves the row unchanged; the check and the write are one conditional db.character.update (where id + updatedAt), so two devices cannot both pass the check"
    - "The updatedAt a successful PUT returns, and that the client caches as its next token, is the one THIS write produced: the response is the row returned by the conditional update itself, never a later re-read that could carry another device's version"
    - "After this item a malformed PUT body, with or without a token (including a malformed token), still answers 261101-iih's 400 { error: 'Dados inválidos', issues }: the PUT keeps iih's zValidator('json', updateCharacterSchema, invalidJsonHook) call unchanged, and updateCharacterSchema keeps every iih JSON-field rule plus one optional expectedUpdatedAt key"
    - "Rapid consecutive saves and concurrent saves from different fields or tabs of the same sheet on one device all succeed with no 409: saves for a character are serialized, and each one sends the version its predecessor produced"
    - "When another device changed the character, the stale save and every save queued behind it that was built from the same stale data are rejected. The user sees one pt-BR sonner toast and the sheet refetches the character, so nothing is overwritten"
    - "Every existing caller of useUpdateCharacter (tabs, EditableField, EditableScalingField, notes) gets this behavior with no component changes"
    - "A PUT without expectedUpdatedAt still writes unconditionally. This is a recorded, accepted compatibility exception for tabs loaded before the deploy (the 409 guarantee covers token-bearing saves, i.e. every save from the new app), with a recorded follow-up to make the token required. An unknown id returns 404"
    - "npx tsc --noEmit, bun test and bun run build pass; prisma/schema.prisma is untouched and no authentication is added"
  artifacts:
    - path: "lib/api/character-concurrency.ts"
      provides: "Headless save core: characterQueryKey, CHARACTER_CONFLICT_MESSAGE, CharacterConflictError, isCharacterConflictError, readUpdatedAt, enqueueCharacterSave, saveCharacterUpdate, handleCharacterSaveError"
      contains: "class CharacterConflictError"
    - path: "lib/api/character-concurrency.test.ts"
      provides: "bun:test suite: route contract (200/409/404/400 incl. iih hook for token-bearing bodies/legacy, returned token is this write's) + client core (rapid saves, conflict cascade, cache refresh, UX handler)"
      contains: "409"
    - path: "lib/schemas/character.ts"
      provides: "updateCharacterSchema as rewritten by 261101-iih, plus one optional expectedUpdatedAt key (ISO datetime); no iih rule changed"
      contains: "expectedUpdatedAt"
    - path: "app/api/[[...route]]/characters/index.ts"
      provides: "PUT /:id compare-and-set: conditional db.character.update on id + updatedAt, P2025 mapped to 409/404, iih's 400 hook kept"
      contains: "P2025"
    - path: "lib/api/queries.ts"
      provides: "useUpdateCharacter delegating to saveCharacterUpdate + conflict toast/refetch; exported fetchCharacter"
      contains: "saveCharacterUpdate"
  key_links:
    - from: "lib/api/queries.ts (useUpdateCharacter mutationFn)"
      to: "lib/api/character-concurrency.ts saveCharacterUpdate"
      via: "mutationFn delegates every update, so all callers inherit the version token"
      pattern: "saveCharacterUpdate\\("
    - from: "lib/api/queries.ts (useUpdateCharacter onError)"
      to: "lib/api/character-concurrency.ts handleCharacterSaveError -> sonner toast + invalidate ['character', id]"
      via: "onError handler"
      pattern: "handleCharacterSaveError\\("
    - from: "app/api/[[...route]]/characters/index.ts PUT /:id"
      to: "lib/schemas/character.ts updateCharacterSchema (post-261101-iih, + expectedUpdatedAt) and iih's exported invalidJsonHook ('Dados inválidos' 400)"
      via: "zValidator('json', updateCharacterSchema, invalidJsonHook) — kept exactly as 261101-iih left it, so iih's own key link stays true"
      pattern: "zValidator\\('json', updateCharacterSchema, invalidJsonHook\\)"
    - from: "app/api/[[...route]]/characters/index.ts PUT /:id"
      to: "Postgres characters row"
      via: "db.character.update where { id, updatedAt } (single conditional UPDATE; its returned row is the response)"
      pattern: "updatedAt: new Date\\(expectedUpdatedAt\\)"
    - from: "lib/api/character-concurrency.ts saveCharacterUpdate"
      to: "TanStack cache ['character', id]"
      via: "cancelQueries + setQueryData with the PUT response inside the queued task"
      pattern: "setQueryData"
---

<objective>
Add optimistic concurrency to character updates (API-02). useUpdateCharacter sends the `updatedAt` it last saw. `PUT /api/characters/:id` does an atomic compare-and-set on the existing `updatedAt` column and returns 409 when the stored value differs. On a 409 the UI shows a pt-BR sonner toast and refetches the character instead of overwriting the other device's edit. Single-device editing never hits a spurious conflict: saves for a character are serialized, and each successful response updates the cached `updatedAt` the next save uses.

Purpose: Core value is "no lost edits". Today two devices editing the same sheet silently overwrite each other (CONCERNS.md, "Lost updates on whole-array and whole-object writes"). Following the ROADMAP Phase 2 note, all of this lives in `useUpdateCharacter` and the PUT route, so every tab, both editable fields, and the notes migration from 261101-iik get it with no component edits.

Output: a new headless module `lib/api/character-concurrency.ts` with a bun test suite, one optional token key on `updateCharacterSchema`, a compare-and-set PUT handler, and a rewired `useUpdateCharacter`.

Ordering: this plan runs after 261101-iie, 261101-iif, 261101-iig and 261101-iih (all in `depends_on`). It builds on the post-iih `updateCharacterSchema` and keeps iih's PUT validator call and its `'Dados inválidos'` 400 hook exactly as iih left them.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/codebase/CONCERNS.md
@.planning/codebase/CONVENTIONS.md
@lib/api/queries.ts
@lib/schemas/character.ts
@app/api/[[...route]]/characters/index.ts
@lib/defaults/character.ts
@prisma/schema.prisma

Interfaces the executor works against. These were extracted at planning time from HEAD 832fa9b. Anchor every edit on the symbol names below, not on line numbers.

Sibling state guaranteed by `depends_on` (all four have landed before this plan starts):
- 261101-iie deleted the dead calculation routes from the router and their hooks from `lib/api/queries.ts`. The router keeps only GET /, GET /:id, POST /, PUT /:id and DELETE /:id.
- 261101-iif replaced the body of `useCalculateDerivedStats` in `lib/api/queries.ts`. Do not touch it.
- 261101-iig added bun test typings and the `test` script.
- 261101-iih rewrote the eleven JSON-field entries of `updateCharacterSchema` (the `jsonObject` / `.catchall(jsonExtra)` field schemas) and added the exported route-level constant `invalidJsonHook`, passed as the third argument of the PUT json validator: `zValidator('json', updateCharacterSchema, invalidJsonHook)`. When validation fails, the hook returns `c.json({ error: 'Dados inválidos', issues }, 400)`. Its structural signature is schema-agnostic; iih verified tsc with it on `updateCharacterSchema` and on an extended schema. iih also added `lib/schemas/character.test.ts` and `app/api/[[...route]]/characters/index.test.ts`. That route test mocks `@/lib/db` with a throwing stub, then loads the route via `await import('./index')`, and sends only malformed bodies. iih's key link is the literal `zValidator('json', updateCharacterSchema, invalidJsonHook)`. This plan keeps that call byte for byte, does not re-implement the hook, and all of iih's tests must still pass.
- 261101-iim edits the router and `lib/api/queries.ts` after this item.

- `lib/api/queries.ts` `useUpdateCharacter()` returns `useMutation` with `mutationFn: ({ id, data }: { id: string; data: UpdateCharacterRequest })` calling `api.characters[':id'].$put({ param: { id }, json: data })`. Its `onSuccess` does `queryClient.setQueryData(['character', variables.id], data)` and then `invalidateQueries({ queryKey: ['characters'] })`. `useCharacter(id)` uses query key `['character', id]`, and its queryFn GETs `api.characters[':id'].$get({ param: { id } })`. That queryFn throws `Error('Character not found')` on 404 and `Error('Failed to fetch character')` otherwise.
- The cached `['character', id]` payload is `{ character: { ..., updatedAt: string } }` from GET, or `{ character, message }` from PUT. Dates arrive as ISO strings with milliseconds, e.g. `2026-11-01T12:34:56.789Z`.
- `lib/schemas/character.ts` exports `updateCharacterSchema` (a top-level z.object with every field optional; after 261101-iih its JSON fields use iih's tolerant field schemas), `UpdateCharacterRequest = z.infer<typeof updateCharacterSchema>`, and `updateCharacterResponseSchema`.
- In the route after 261101-iih: `.put('/:id', zValidator('param', getCharacterParamsSchema), zValidator('json', updateCharacterSchema, invalidJsonHook), handler)`. The handler does `const updates = c.req.valid('json')`, then a `findUnique` (404 if missing), then `db.character.update({ where: { id }, data: updates })`, then `updateCharacterResponseSchema.parse({ character, message: 'Personagem atualizado com sucesso' })`. `try/catch` maps errors to 500.
- In Prisma, `Character.updatedAt DateTime @updatedAt` maps to `timestamp(3)`, i.e. millisecond precision. In the generated client (6.12.0), `CharacterWhereUniqueInput` accepts `updatedAt` next to `id` (`lib/generated/prisma/index.d.ts`). The Prisma Client reference ("Filter on non-unique fields with UserWhereUniqueInput", optimistic concurrency control) documents `update({ where: { id, version }, data })` as the OCC pattern. `update` throws a known request error with code `P2025` when no record matches.
- Callers that must NOT be edited (they only call `mutateAsync({ id, data })` and read `isPending` / `error`): `components/character/{basic-info,skills-kit,spells-talents,notes}-tab.tsx`, `components/ui/editable-field.tsx`, `components/ui/editable-scaling-field.tsx`.

Verified while planning (bun 1.3.2):
- In bun:test, `mock.module(<absolute path of lib/db/index.ts>, ...)` intercepts the route's aliased `@/lib/db` import. The route module then loads with no Prisma client and no database.
- `new QueryClient()` from `@tanstack/react-query` runs headless under bun test. `setQueryData`, `cancelQueries`, `invalidateQueries` (sets `isInvalidated`) and `fetchQuery` all work.
- In zod 4.0.10, an object key `expectedUpdatedAt: z.iso.datetime().optional()` accepts `new Date().toJSON()` output, rejects `'ontem'`, and accepts a missing field.
- At HEAD, `npx tsc --noEmit` and `bun run build` both exit 0. No `@types/bun` is installed, so test typings come from 261101-iig.
</context>

## Source coverage audit

| SOURCE | ID | Item | Task | Status |
|---|---|---|---|---|
| GOAL | Phase 2 SC#2 | Stale save on second device → 409, toast, refetch, no overwrite | 1, 2, 3 | COVERED |
| GOAL | Phase 2 SC#3 | Single-device inline editing saves every edit with no spurious conflict; each success refreshes the token | 1, 2 | COVERED |
| REQ | API-02 | Client sends last-seen updatedAt; server 409 if row changed; UI toast + refetch | 1, 2, 3 | COVERED |
| CATALOG | 261101-iii | Rapid consecutive saves, plus concurrent mutations from different fields/tabs on one device, never conflict | 2 | COVERED |
| ROADMAP note | Phase 2 | Handled once in useUpdateCharacter + PUT route so every tab (and iik's notes migration) inherits it | 1, 3 | COVERED |
| SIBLING | 261101-iih | iih's 400 contract `{ error: 'Dados inválidos', issues }` and every JSON-field rule still apply to token-bearing PUT bodies | 1 | COVERED |
| CONSTRAINT | PROJECT | No auth added; Prisma column types unchanged (reuse `updatedAt`); behavior identical on one device | 1–3 | COVERED |
| CONSTRAINT | gates | `npx tsc --noEmit`, `bun test`, `bun run build` (`bun run lint` not a gate until 261101-iim) | 3 | COVERED |

Planner hooks: the assumption-delta probe returned `skipped` (phase_unresolved) because this is a quick item, so no checkpoint. The schema gate did not fire because `prisma/schema.prisma` is not edited and no db push is needed. The security hook is satisfied by the `<threat_model>` below (ASVS L1, block_on high).

Claude's-discretion choices (no CONTEXT.md exists; they are recorded here so the executor does not re-decide them):
- **Wire format.** The token is an optional JSON body field `expectedUpdatedAt`, declared as one extra optional key on 261101-iih's `updateCharacterSchema` itself rather than on a separate versioned schema. Because of that, the PUT keeps iih's exact `zValidator('json', updateCharacterSchema, invalidJsonHook)` call, every iih JSON-field rule and the `'Dados inválidos'` 400 contract apply to token-bearing bodies by construction, and iih's key link stays literally true. As a side effect, `UpdateCharacterRequest` gains an optional `expectedUpdatedAt`. Components never set it, and saveCharacterUpdate overwrites it. The app's own hook always sends it.
- **Accepted compatibility exception (recorded decision).** A PUT without `expectedUpdatedAt` keeps today's unconditional write. Tabs opened before the deploy run the old bundle and never send a token, and requiring the token would turn every one of their saves into a 400. The 409 guarantee therefore covers token-bearing saves, i.e. every save from the new app, but not pre-deploy tabs or hand-made requests (any client can already write anything; there is no auth, by owner decision). Follow-up, recorded in the SUMMARY: once a deploy has passed and open tabs have reloaded, make the token required (missing → 400) and delete the unconditional branch.
- **Server check.** The server uses a single conditional `db.character.update({ where: { id, updatedAt }, ... })`. That is the optimistic-concurrency pattern in the Prisma Client reference (non-unique fields in the unique `where`, generally available since Prisma 5). Postgres evaluates the `updatedAt` condition inside the UPDATE under the row lock, and the row Prisma returns is the one this statement wrote, so the response's `updatedAt` is this write's version. A `P2025` error means no row matched. Only on that failure path does an existence check distinguish 404 from 409. Neither a read-compare-write sequence nor a bulk conditional write followed by a separate re-read is acceptable. The first leaves a race window between two devices. The second can hand this client another device's newer version as its token, which would let a later stale save pass.
- **Client token.** The client token is the version the user's edit was built from, captured when mutate is called. It advances only through this device's own successful saves, and saves for a character run one at a time.

<tasks>

<task type="tracer">
  <name>Task 1: Tracer — one versioned save end to end (hook → core → PUT compare-and-set → cache)</name>
  <precondition>261101-iie, 261101-iif, 261101-iig and 261101-iih have merged into this checkout. Checks: a test file that imports `bun:test` passes `npx tsc --noEmit` (bun test typings are present in package.json, e.g. `@types/bun`), and `bun test` runs. `grep -c "Dados inválidos" "app/api/[[...route]]/characters/index.ts"` prints at least 1 and `grep -c "export const invalidJsonHook" "app/api/[[...route]]/characters/index.ts"` prints 1 (iih's hook). `grep -c "catchall" lib/schemas/character.ts` prints at least 1 (iih's schema rewrite). `bun install` has been run in this worktree, so `lib/generated/prisma` exists. If any check fails, halt: this plan builds on iih's schema and hook.</precondition>
  <reversibility rating="reversible">Only this app's own hook sends the optional `expectedUpdatedAt` body field. Renaming or removing it touches three source files and no stored data.</reversibility>
  <files>lib/schemas/character.ts, app/api/[[...route]]/characters/index.ts, lib/api/character-concurrency.ts, lib/api/queries.ts, lib/api/character-concurrency.test.ts</files>
  <read_first>lib/schemas/character.ts, app/api/[[...route]]/characters/index.ts (the `.put('/:id'` handler and the import block), lib/api/queries.ts (useCharacter, useUpdateCharacter), lib/defaults/character.ts, prisma/schema.prisma (Character columns)</read_first>
  <action>
Build the thinnest complete path for API-02: one save, with its token, through every layer.

1. Schema in lib/schemas/character.ts. This step builds on the `updateCharacterSchema` that 261101-iih rewrote. Add exactly one key to it, after `notes`: `expectedUpdatedAt: z.iso.datetime().optional()`. Above the key, add a short pt-BR comment covering four points: the key is the `updatedAt` the client last saw; it is not a column; the route removes it before writing; and it is optional because of the accepted compatibility exception for tabs opened before the deploy. Keep every iih field schema, the `jsonObject` / `jsonExtra` helpers, `characterFullSchema` and the response schemas exactly as iih left them. Do not create a separate versioned schema. Keeping one schema means the route's validator call (and iih's hook on it) needs no edit, so every iih rule and iih's 400 contract apply to token-bearing bodies (see the Wire format note). `UpdateCharacterRequest` is still `z.infer<typeof updateCharacterSchema>` and now carries an optional `expectedUpdatedAt`.

2. Route PUT `/:id` in app/api/[[...route]]/characters/index.ts.
   - Leave the validator chain exactly as 261101-iih left it: the param validator, then `zValidator('json', updateCharacterSchema, invalidJsonHook)` with iih's exported hook as the third argument. Do not swap the schema, drop, wrap or re-implement the hook, or reorder the middlewares.
   - In the handler, replace `const updates = c.req.valid('json')` with `const { expectedUpdatedAt, ...updates } = c.req.valid('json')`, so the token never reaches Prisma's `data`. Prisma would reject an unknown argument, and tsc does not catch it because `updates` is not a fresh object literal.
   - When the token is present, do an atomic compare-and-set with a single `db.character.update`, using `where: { id, updatedAt: new Date(expectedUpdatedAt) }` and `data: { ...updates, updatedAt: new Date() }`. This is the optimistic-concurrency pattern documented in the Prisma Client reference. It is one conditional UPDATE, evaluated by Postgres under the row lock, so two devices cannot both win. Set updatedAt explicitly so every write advances the version.
     - Build the response from the row this call returns. Do not read the row again after a successful write: another device's write can land in between, its updatedAt would become this client's token, and a later stale save would then pass. Return `updateCharacterResponseSchema.parse({ character, message: 'Personagem atualizado com sucesso' })` as today.
     - Add a module-private helper `isRecordNotFoundError(error: unknown): boolean`. It returns true when `error` is a non-null object whose `code` property equals `'P2025'`. It is duck-typed so that the tests' fake db can raise it without the Prisma runtime; Prisma's known request error exposes the same `code`.
     - Wrap only the conditional update in a try/catch that handles the P2025 case. On that failure path, and only there, run `findUnique({ where: { id }, select: { id: true } })`. If it returns null, respond 404 with `{ error: 'Character not found' }`. Otherwise respond 409 with `{ error: 'Character was modified by another session' }`; the 409 body carries no character data.
     - Rethrow any other error so the outer catch answers 500.
     - Do not replace this with a read-compare-then-update sequence, which leaves a race window, or with a bulk conditional write followed by a separate re-read, which can return another device's version.
   - When the token is absent, keep today's existence check plus the `db.character.update({ where: { id }, data: updates })` path unchanged. This is the legacy unconditional write. Mark it with a short pt-BR comment as the accepted compatibility exception, with the follow-up to make the token required.
   - Keep the outer try/catch, the `console.error('Error updating character:', error)` call and the 500 response.
   - Do not edit prisma/schema.prisma: the existing `updatedAt` column is the version (the "column types must not change" decision). Do not add any auth (owner decision).

3. New headless core in lib/api/character-concurrency.ts. It must not import React, sonner, `lib/api/client` or anything that touches `window`, so bun can test it. It imports only types from `@/lib/schemas/character` and the `QueryClient` type from `@tanstack/react-query`. Exports:
   - `characterQueryKey(id)` returns `['character', id] as const`. This is the same key useCharacter uses.
   - `CHARACTER_CONFLICT_MESSAGE` is the pt-BR text: Este personagem foi alterado em outro dispositivo. Recarregamos os dados mais recentes — refaça sua alteração.
   - `CharacterConflictError` extends Error, with name `'CharacterConflictError'` and message `CHARACTER_CONFLICT_MESSAGE`.
   - `isCharacterConflictError(error: unknown)` is a type guard.
   - `readUpdatedAt(data: unknown): string | undefined` reads `data.character.updatedAt` from a cached GET or PUT payload. It accepts an ISO string or a Date (converted with toISOString) and returns undefined for anything else.
   - `saveCharacterUpdate({ queryClient, id, data, put, fetchCharacter })`. `data` is `UpdateCharacterRequest`. `put` is a function that takes `UpdateCharacterRequest & { expectedUpdatedAt: string }` and resolves to an object with `ok: boolean`, `status: number` and `json(): Promise<unknown>`. `fetchCharacter` is `(id: string) => Promise<unknown>`; Task 2 uses it.

   In this task `saveCharacterUpdate` follows one path:
   1. Read the token with `readUpdatedAt(queryClient.getQueryData(characterQueryKey(id)))`. If it is missing, throw `Error('Failed to update character')`.
   2. Call `put` with the data spread plus `expectedUpdatedAt`.
   3. On status 409, throw a new `CharacterConflictError`.
   4. On any other non-ok status, read the body as `{ error?: string }` using a typed cast and tolerating a JSON parse failure, then throw `Error(body.error || 'Failed to update character')`.
   5. On success, parse the JSON, call `queryClient.setQueryData(characterQueryKey(id), result)` (this is how each successful response refreshes the cached updatedAt), and return the result.

4. Hook in lib/api/queries.ts.
   - Move the body of useCharacter's queryFn into an exported `fetchCharacter(id: string)` function with the same 404 and error behavior, and have useCharacter use it.
   - Rewrite only `useUpdateCharacter`. It keeps the same `{ id, data }` variables, so callers are untouched. Its mutationFn delegates to `saveCharacterUpdate`, passing `queryClient`, `id`, `data`, `fetchCharacter`, and a `put` that calls `api.characters[':id'].$put({ param: { id }, json: body })`.
   - Its onSuccess keeps only the `['characters']` list invalidation. The cache write now lives in the core so it happens before the next save reads the token.
   - Do not add any new ts-ignore directive; the existing one disappears along with the old mutationFn body.
   - Do not touch the other hooks in this file. 261101-iie and 261101-iif already edited them before this item runs, and 261101-iim edits this file afterwards.

5. Tests in lib/api/character-concurrency.test.ts, using bun:test.
   - Before dynamically importing the route module with top-level await (`await import('@/app/api/[[...route]]/characters')`), install an in-memory fake db with `mock.module`. Mock `@/lib/db`. If Bun does not intercept the alias, mock the absolute path built from `import.meta.dir` plus `/../db/index.ts`; mocking by absolute path was confirmed during planning.
   - `bun test` runs every file in one process with one shared module registry. 261101-iih verified with Bun 1.3.2 that module mocks persist across files and that a later `mock.module('@/lib/db', …)` replaces an already-loaded module's exports in place. iih's route test, which uses a throwing-stub db, and this suite, which uses a fake db, therefore pass together in either file order. Load the route only through the top-level dynamic import placed after `mock.module`, never with a static import, because static imports are hoisted above the mock. Do not add a preload, a bunfig.toml or `mock.restore()` calls. Task 3's full `bun test` run confirms both suites pass together.
   - The fake `db.character` provides two methods:
     - `findUnique` looks up by `where.id`, ignores `select`, and returns a shallow copy or null.
     - `update({ where, data })` checks the row first. If the row is missing, or `where.updatedAt` is present and `row.updatedAt.getTime() !== where.updatedAt.getTime()`, it throws `Object.assign(new Error('Record to update not found.'), { code: 'P2025' })`. Otherwise it applies `data`, sets `updatedAt` to `data.updatedAt ?? new Date()` (simulating `@updatedAt`) and captures a shallow copy as its return value. Then, if a test-controlled module-level `afterUpdate` callback is set, it calls it with the stored row; this simulates another device writing right after this statement. It returns the captured copy.
   - Seed rows by spreading `getDefaultCharacterData()` and adding: id, characterName, every nullable String column from prisma/schema.prisma set to null, notes null, createdAt, and `updatedAt` fixed in the past (2026-01-01T00:00:00.000Z) so the first write always produces a different timestamp.
   - Use a fresh character id in every test. Task 2 adds module-level state keyed by id.
   - Put only scalar fields (characterName, level, currentBerkana) in success payloads. The one deliberate exception is test (r), which sends `weapons: {}`; iih's weapons schema rejects it.
   - The core's `put` helper sends `characters.request('/' + id, ...)` with method PUT, a JSON content-type header and a JSON body. `fetchCharacter` is a GET through `characters.request` that parses the JSON.
   - Use `new QueryClient()` from `@tanstack/react-query`, seeded with `setQueryData(characterQueryKey(id), { character: { ...row, updatedAt: row.updatedAt.toISOString() } })`.
   - Write these tests:
     - (a) A PUT with the current token returns 200, characterName is updated, and the returned `character.updatedAt` differs from the token that was sent.
     - (b) A PUT with a stale token returns 409 and the row is unchanged.
     - (c) An unknown id with a token returns 404 (the fake raises P2025 and the existence check finds nothing).
     - (d) A PUT with no token returns 200 and the write is applied (legacy path, accepted compatibility exception).
     - (e) A malformed token ('ontem') returns 400, and the JSON body's `error` is 'Dados inválidos' (iih's `invalidJsonHook`).
     - (f) With a seeded cache, `saveCharacterUpdate` resolves, the fake row is updated, and `readUpdatedAt` of the cache equals `row.updatedAt.toISOString()`.
     - (g) After simulating another device by setting the row's updatedAt to +60s and changing characterName, `saveCharacterUpdate` rejects with an error for which `isCharacterConflictError` is true, and the row keeps the other device's characterName.
     - (r) A PUT with the current, valid token plus `weapons: {}` returns 400. Its JSON has `error === 'Dados inválidos'` and an `issues` entry whose path starts with 'weapons'. The row's updatedAt and characterName are unchanged. This proves iih's `invalidJsonHook` and JSON-field rules still run for token-bearing bodies.
     - (s) Set `afterUpdate` once to simulate another device writing right after this save's statement: it bumps the row's updatedAt by 60s and sets characterName to 'Outro dispositivo'. Then run these steps:
       1. `saveCharacterUpdate` resolves, and `readUpdatedAt` of the cache equals the updatedAt this write set, not the other device's later value.
       2. Clear `afterUpdate`.
       3. A second `saveCharacterUpdate` rejects with CharacterConflictError, and the row keeps 'Outro dispositivo'.
       A follow-up re-read after the write would fail step 1, so this test guards the returned-row rule.
  </action>
  <verify>
    <automated>bun test lib/api/character-concurrency.test.ts ./lib/schemas/character.test.ts "./app/api/[[...route]]/characters/index.test.ts" && npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - `bun test lib/api/character-concurrency.test.ts` exits 0 with at least 9 passing tests and 0 failures, including (a)–(g), (r) and (s)
    - 261101-iih's `./lib/schemas/character.test.ts` and `"./app/api/[[...route]]/characters/index.test.ts"` still pass in the same run
    - `npx tsc --noEmit` exits 0
    - `grep -c "expectedUpdatedAt" lib/schemas/character.ts` >= 1 (baseline 0 at 832fa9b; iih does not add it)
    - `grep -c "P2025" "app/api/[[...route]]/characters/index.ts"` >= 1 (baseline 0 at 832fa9b; iie and iih do not add it)
    - `grep -c "updatedAt: new Date(expectedUpdatedAt)" "app/api/[[...route]]/characters/index.ts"` >= 1 (baseline 0)
    - `grep -c "409" "app/api/[[...route]]/characters/index.ts"` >= 1 (baseline 0)
    - `grep -c "saveCharacterUpdate" lib/api/queries.ts` >= 1 (baseline 0)
    - Preservation gate, not a progress gate: `grep -cF "zValidator('json', updateCharacterSchema, invalidJsonHook)" "app/api/[[...route]]/characters/index.ts"` prints 1. It prints 0 at 832fa9b and 1 after 261101-iih, and it must still print 1. Test (r) is the behavioral proof.
    - `git diff --name-only HEAD -- prisma/` prints nothing
  </acceptance_criteria>
  <done>A save from the sheet sends the cached updatedAt. The server writes only if that value still matches the stored one, and otherwise answers 409. The response's updatedAt is the one this write produced, and it lands in the ['character', id] cache. Malformed bodies, with or without a token, still get iih's 'Dados inválidos' 400. The route contract (200/409/404/400/legacy) and the single-save client path are proven by bun tests without a database.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Rapid and concurrent saves on one device never conflict; stale queued saves always do</name>
  <files>lib/api/character-concurrency.ts, lib/api/character-concurrency.test.ts</files>
  <read_first>lib/api/character-concurrency.ts, lib/api/character-concurrency.test.ts (as written in Task 1)</read_first>
  <behavior>
    - (h) Three saveCharacterUpdate calls are started in the same tick from one seeded cache, with no await between them. Two change different scalar fields and one repeats a field. All three resolve, none is a CharacterConflictError, the row holds all changes (the last write wins on the repeated field), and the cached updatedAt equals the row's. This test is RED before this task: the 2nd and 3rd calls get 409.
    - (i) A save is awaited, then a second save runs. Both succeed (regression guard for sequential inline edits).
    - (j) After another device bumps the row, two saves are started in the same tick. Both reject with CharacterConflictError, and the row keeps the other device's values.
    - (k) After a conflict, the cache is refreshed via `queryClient.fetchQuery({ queryKey: characterQueryKey(id), queryFn: () => fetchCharacter(id) })` (simulating the refetch), and a new save succeeds.
    - (l) The fake update throws a plain Error (no `code`) once, so the route answers 500. That save rejects with a plain Error (not a conflict), and the next save queued behind it still runs and succeeds.
    - (m) With no cached character, saveCharacterUpdate fetches it through fetchCharacter and the save succeeds. This test is RED before this task.
    - (n) A character fetch is started before the save with a slow queryFn that resolves after ~50ms with the pre-save payload; swallow its rejection. The save is awaited, then the test waits 80ms. readUpdatedAt of the cache still equals the row's updatedAt. This test is RED before this task.
  </behavior>
  <action>
First write tests (h) through (n) and confirm that (h), (m) and (n) fail. Then implement the following in lib/api/character-concurrency.ts.

1. A per-character serial queue: exported `enqueueCharacterSave<T>(id, task: () => Promise<T>): Promise<T>`, backed by a module-level Map from character id to the tail promise.
   - A task starts only after the previous task for the same id has settled, whether it fulfilled or rejected. A failed save must never block later saves.
   - Different ids run independently.
   - Delete the map entry once the tail settles and nothing newer is queued.
   - Why: two saves from one device sent concurrently would carry the same token, and the second would get a spurious 409.

2. Own-version lineage, internal to the module: a module-level Map from character id to a Map of sent token → returned updatedAt.
   - Record an entry for every own successful save. Skip the entry when the two values are equal (a same-millisecond write), because that would create a self-loop.
   - A helper resolves the token to send by following the lineage from a base version to its last own successor, using a visited set to guard against cycles.
   - Why: the token is the version the user's edit was built from, and only this device's own successful saves advance it. Saves queued behind each other therefore send the version their predecessor produced, so there is no spurious conflict on one device (catalog requirement). A save built from data that another device has since changed still sends its stale version and gets a 409, even if the post-conflict refetch lands before that queued save runs. Reading the cache at send time instead would let such a save overwrite the other device's edit.

3. Restructure saveCharacterUpdate.
   - Capture the base token synchronously at call time, before enqueueing, with `readUpdatedAt(queryClient.getQueryData(characterQueryKey(id)))`.
   - Return `enqueueCharacterSave(id, task)`. The task does the following:
     1. If a base exists, the expected token is the lineage-resolved base. Otherwise it is `readUpdatedAt` of `await queryClient.fetchQuery({ queryKey: characterQueryKey(id), queryFn: () => fetchCharacter(id) })`. If it is still missing, throw `Error('Failed to update character')`.
     2. Call put. Status 409 throws CharacterConflictError; any other non-ok status throws a plain Error, as in Task 1.
     3. On success, record the lineage entry from the expected token to `readUpdatedAt(result)`.
     4. `await queryClient.cancelQueries({ queryKey: characterQueryKey(id), exact: true })`, so a character GET started before or during this PUT cannot later overwrite the cache with older data. A regressed cache would give the next save a wrong token.
     5. Call setQueryData with the result and return it.
   - The cache write stays inside the queued task, so the next queued save starts only after the cache holds this response.
   - Keep the lineage helpers unexported; tests exercise them through saveCharacterUpdate.
  </action>
  <verify>
    <automated>bun test lib/api/character-concurrency.test.ts && npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - `bun test lib/api/character-concurrency.test.ts` exits 0 with at least 16 passing tests and 0 failures, including (h)–(n)
    - `npx tsc --noEmit` exits 0
    - `grep -c "enqueueCharacterSave" lib/api/character-concurrency.ts` >= 2
    - `grep -c "cancelQueries" lib/api/character-concurrency.ts` >= 1
  </acceptance_criteria>
  <done>Any number of saves fired quickly from one device, on the same or different fields, persist with no 409. Once another device has changed the character, every save built from the old view is rejected, including saves already queued. A failed save does not block the queue. A missing cache entry is fetched. An in-flight GET cannot roll back the cached token.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Conflict UX (pt-BR toast + refetch) wired into useUpdateCharacter, plus the full gate</name>
  <files>lib/api/character-concurrency.ts, lib/api/queries.ts, lib/api/character-concurrency.test.ts</files>
  <read_first>lib/api/character-concurrency.ts, lib/api/queries.ts (useUpdateCharacter), app/layout.tsx (Toaster is mounted), components/ui/editable-field.tsx (how isPending/error are read — read only, do not edit)</read_first>
  <behavior>
    - (o) Calling handleCharacterSaveError with a new CharacterConflictError, id, a QueryClient seeded for that id, and a recording notify calls notify exactly once, with CHARACTER_CONFLICT_MESSAGE and `{ id: 'character-conflict-' + id }`. Afterwards `queryClient.getQueryState(characterQueryKey(id))?.isInvalidated` is true.
    - (p) Calling it with a plain Error does not call notify and leaves the query not invalidated.
    - (q) CHARACTER_CONFLICT_MESSAGE contains the text "outro dispositivo".
  </behavior>
  <action>
1. In lib/api/character-concurrency.ts, export `handleCharacterSaveError(error, id, { queryClient, notify })`, where notify has the signature `(message: string, options: { id: string }) => void`.
   - When `isCharacterConflictError(error)` is true:
     - Call `notify(CHARACTER_CONFLICT_MESSAGE, { id: 'character-conflict-' + id })`. The toast id is stable so that several queued saves rejected by the same conflict produce one toast.
     - Then call `queryClient.invalidateQueries({ queryKey: characterQueryKey(id), exact: true })` without awaiting it. The active sheet query refetches, the user sees the other device's data, and nothing is overwritten.
   - For any other error, do nothing. Callers' existing catch blocks keep handling those exactly as today.

2. In lib/api/queries.ts, import `toast` from 'sonner' (already a dependency; the Toaster is mounted in app/layout.tsx). Give useUpdateCharacter an `onError(error, variables)` that calls `handleCharacterSaveError(error, variables.id, { queryClient, notify: (message, options) => toast.error(message, options) })`.
   - mutateAsync still rejects on a conflict. Callers' try/catch blocks therefore keep the field in edit mode or log, as they do today.
   - EditableField's inline error shows the pt-BR text, because the error message is CHARACTER_CONFLICT_MESSAGE.
   - Accepted side effect: callers that already raise their own generic error toast (notes add/edit/move, damage/restore in basic-info) show that toast next to the conflict toast. Leaving those components untouched avoids file overlap with 261101-iij, iik, iil and iin, and the generic toast is accurate because the save did fail. Record this in the SUMMARY.

3. Run the full gate for this item: the whole `bun test` suite (including 261101-iig's tests and any added by siblings), `npx tsc --noEmit` and `bun run build`. `bun run lint` is not a gate until 261101-iim.
  </action>
  <verify>
    <automated>bun test && npx tsc --noEmit && bun run build</automated>
    <human-check>Open the same /character/&lt;id&gt; in two browser tabs. Edit a field in tab A and let it save. Without reloading tab B, edit a field there. Tab B should show the pt-BR toast "Este personagem foi alterado em outro dispositivo…" and reload the sheet with A's value, and A's value should still be there after reloading tab A. Then, in a single tab, edit several fields in quick succession (Enter/blur back to back, including fields on two different sheet tabs). Every edit should persist after a reload, with no conflict toast.</human-check>
  </verify>
  <acceptance_criteria>
    - `bun test` exits 0 with 0 failures, and the suite includes (a)–(s) from this item plus all of 261101-iih's tests
    - `npx tsc --noEmit` exits 0
    - `bun run build` exits 0 (baseline at 832fa9b: exit 0)
    - `grep -c "handleCharacterSaveError" lib/api/queries.ts` >= 1 (baseline 0)
    - `grep -c "from 'sonner'" lib/api/queries.ts` >= 1 (baseline 0)
    - `grep -c "outro dispositivo" lib/api/character-concurrency.ts` >= 1
  </acceptance_criteria>
  <done>When a save conflicts, the user sees one pt-BR sonner toast, the sheet refetches the latest character, and the other device's edit is kept. Single-device editing behaves exactly as before. All gates for this item pass.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser → `PUT /api/characters/:id` | Untrusted JSON body, including the new `expectedUpdatedAt`. There is no auth, by owner decision. |
| API route → Postgres (`characters` row) | Concurrent writers from several devices hit the same row |
| server response → TanStack cache | Response data becomes the version token for the next save |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-iii-01 | Tampering | PUT /:id write path (lost update between devices) | high | mitigate | A single conditional `db.character.update` with `where: { id, updatedAt }` (Task 1). A P2025 error returns 409 (or 404 when the row is gone), and nothing is written. There is no read-then-write window. The response, and so the client's next token, is the row returned by that same statement, never a re-read that could carry another device's version. Covered by tests (b), (g) and (s). |
| T-iii-02 | Tampering | `expectedUpdatedAt` input | medium | mitigate | `z.iso.datetime()` on `updateCharacterSchema` returns iih's 400 `{ error: 'Dados inválidos', issues }` through `invalidJsonHook` on malformed input (test (e)). The token is destructured out of `updates`, so it never reaches Prisma `data`. Prisma parameterizes the filter. |
| T-iii-03 | Information Disclosure | 409 response body | low | mitigate | The body is a fixed message with no row data and no internal error text. Details stay in the server `console.error`. |
| T-iii-04 | Spoofing / Elevation | Any client can omit the token, or GET then PUT, to overwrite | low | accept | No authentication is an accepted owner decision (PROJECT.md). The token protects honest clients from lost updates; it is not an access control. The no-token unconditional write is the recorded accepted compatibility exception for pre-deploy tabs (see the discretion notes). Follow-up in the SUMMARY: make the token required once pre-deploy tabs are gone. |
| T-iii-05 | Denial of Service | Client per-character save queue | low | accept | A hung PUT delays later saves for that one character only. The Vercel function `maxDuration: 30` bounds it, a rejection releases the queue (test (l)), and the queue is per browser tab. |
| T-iii-06 | Tampering | Client cache regression (stale GET landing after a PUT) | medium | mitigate | `cancelQueries` before writing the PUT response, inside the queued task (Task 2, test (n)), plus own-version lineage, so a stale GET cannot produce a spurious or wrong token. |
| T-iii-07 | Tampering | PUT /:id JSON-field validation for token-bearing bodies | high | mitigate | The PUT keeps 261101-iih's unchanged `zValidator('json', updateCharacterSchema, invalidJsonHook)` call, and the token is one optional key on that same schema, so no iih JSON-field rule is bypassed by adding a token. Covered by test (r) and iih's own suites in the same run. |
| T-iii-SC | Tampering | npm/pip/cargo installs | low | accept | This plan installs no packages; the bun test typings come from 261101-iig, which owns any install and its legitimacy check. |
</threat_model>

<verification>
- `bun test` passes, including lib/api/character-concurrency.test.ts and 261101-iih's suites in the same process. The iii suite covers the route contract (200 / 409 / 404 / 400 via iih's `invalidJsonHook`, including token-bearing bodies / legacy no-token write / returned token is this write's own) and the client core: single save, rapid concurrent saves without conflict, conflict cascade, recovery after refetch, the queue surviving failures, missing-cache fetch, in-flight GET cancellation, and the conflict toast + invalidate handler.
- `npx tsc --noEmit` exits 0.
- `bun run build` exits 0.
- `zValidator('json', updateCharacterSchema, invalidJsonHook)` is still present verbatim in the route, so 261101-iih's key link holds after this item.
- `git diff --name-only` for this plan's commits lists only the five files in `files_modified`. Nothing under components/ or prisma/ changes.
- Human check (end-of-phase): the two-tab conflict produces a toast and refetch, and rapid single-tab edits produce no toast.
</verification>

<success_criteria>
- Every save from the sheet sends the `updatedAt` the user last saw. The server rejects stale saves with 409, atomically, using the existing `updatedAt` column, and returns the `updatedAt` its own write produced.
- Malformed PUT bodies, with or without a token, still get 261101-iih's 400 `{ error: 'Dados inválidos', issues }`.
- The no-token unconditional write remains only as the recorded, accepted compatibility exception, with its follow-up recorded.
- On a 409 the user gets one pt-BR sonner toast, the sheet shows the latest data, and the other device's edit is preserved.
- Rapid consecutive saves and concurrent saves from different fields or tabs on one device never hit a 409. Each successful response refreshes the cached `updatedAt`.
- No component file, Prisma schema, auth or dependency changes are made in this item.
</success_criteria>

<output>
Create `.planning/quick/261101-iii-optimistic-concurrency-api-02-useupdatecharacter-sends-the-u/261101-iii-SUMMARY.md` when done. Record:
1. The mechanism choice: the token is one optional key on 261101-iih's `updateCharacterSchema`, and iih's validator call with `invalidJsonHook` is unchanged.
2. The accepted compatibility exception: a PUT without `expectedUpdatedAt` still writes unconditionally, so the 409 guarantee covers token-bearing saves only. Add this follow-up: once a deploy has passed and pre-deploy tabs have reloaded, make `expectedUpdatedAt` required (missing → 400) and delete the unconditional branch.
3. The double-toast side effect for callers that already toast.
4. The test count.
</output>
