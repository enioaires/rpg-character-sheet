---
phase: quick-261101-iii
plan: 01
subsystem: api
tags: [optimistic-concurrency, hono, prisma, tanstack-query, sonner, bun-test]
requires: [261101-iie, 261101-iif, 261101-iig, 261101-iih]
provides:
  - "PUT /api/characters/:id atomic compare-and-set on updatedAt (409 on conflict)"
  - "lib/api/character-concurrency.ts headless save core (queue, lineage, conflict UX handler)"
affects: [261101-iik, 261101-iim]
key-files:
  created:
    - lib/api/character-concurrency.ts
    - lib/api/character-concurrency.test.ts
  modified:
    - lib/schemas/character.ts
    - app/api/[[...route]]/characters/index.ts
    - lib/api/queries.ts
decisions:
  - "Token is one optional key (expectedUpdatedAt) on iih's updateCharacterSchema; iih's validator call with invalidJsonHook is unchanged"
  - "Server uses a single conditional db.character.update (where id + updatedAt); response is that statement's returned row, never a re-read"
  - "Client token advances only through this device's own successful saves (per-character serial queue + own-version lineage)"
status: complete
commits: 3
plan_head_before: 71401331c30bd48b6e0d08881e30fef4ff6ddf3f
plan_head_after: 6a57d20f971bd9aa75e0540e8c353ad58ec07782
requirements: [API-02]
actuals:
  tasks: 3
  commits: 3
---

# Phase quick-261101-iii Plan 01: Optimistic concurrency (API-02) Summary

Character saves now carry the `updatedAt` the user last saw. The PUT route does an atomic compare-and-set and answers 409 when another device changed the row. The UI shows one pt-BR sonner toast and refetches, and single-device rapid saves never conflict.

## What was built

- **Schema** (`lib/schemas/character.ts`): one optional `expectedUpdatedAt: z.iso.datetime()` key added to iih's `updateCharacterSchema`. No iih rule changed.
- **Route** (`app/api/[[...route]]/characters/index.ts`): the validator call `zValidator('json', updateCharacterSchema, invalidJsonHook)` is untouched. The handler destructures the token out of the body, then runs one `db.character.update({ where: { id, updatedAt: new Date(expectedUpdatedAt) }, data: { ...updates, updatedAt: new Date() } })`. P2025 is mapped to 404 (row gone) or 409 (fixed message, no row data) by a duck-typed `isRecordNotFoundError` plus an existence check on the failure path only. The response is the row returned by that update.
- **Core** (`lib/api/character-concurrency.ts`): `characterQueryKey`, `CHARACTER_CONFLICT_MESSAGE`, `CharacterConflictError`, `isCharacterConflictError`, `readUpdatedAt`, `enqueueCharacterSave` (per-id serial queue, failures do not block), `saveCharacterUpdate` (base token captured synchronously, resolved through own-version lineage, `cancelQueries` then `setQueryData` inside the queued task, missing cache fetched), `handleCharacterSaveError` (one toast with stable id `character-conflict-<id>` + `invalidateQueries`).
- **Hook** (`lib/api/queries.ts`): exported `fetchCharacter`; `useUpdateCharacter` delegates to `saveCharacterUpdate`, `onError` calls `handleCharacterSaveError` with `toast.error`. The old `@ts-ignore` in that hook is gone. No component files changed.

## Recorded decisions and caveats

1. **Mechanism choice:** token is one optional key on iih's `updateCharacterSchema`, so iih's validator/hook call and every iih JSON-field rule apply to token-bearing bodies by construction (test (r)).
2. **Accepted compatibility exception:** a PUT without `expectedUpdatedAt` still writes unconditionally (tabs opened before the deploy run the old bundle). The 409 guarantee covers token-bearing saves only. **Follow-up:** once a deploy has passed and pre-deploy tabs have reloaded, make `expectedUpdatedAt` required (missing -> 400) and delete the unconditional branch.
3. **Double-toast side effect:** callers that already toast on failure (notes add/edit/move, damage/restore in basic-info) show their generic error toast next to the conflict toast. Components were left untouched on purpose (file overlap with 261101-iij/iik/iil/iin); the generic toast is accurate because the save did fail.
4. **Tests:** 19 new tests in `lib/api/character-concurrency.test.ts` (a-s: route contract 6, single-save client 3, queue/lineage 7, conflict UX 3). Full suite: 130 pass, 0 fail across 4 files, together with iig's and iih's suites.

## Deviations from Plan

- **[Minor] No-cache path re-reads the cache inside the queued task before fetching:** when no base token existed at call time, the task first checks the cache (a predecessor in the queue may have populated it) and only then calls `fetchQuery`. The plan said "otherwise fetchQuery". This avoids a redundant GET and a possible newer-version token; tests (m) and (h) pass.
- Otherwise none; plan executed as written. TDD RED was confirmed for (h), (m), (n) before the Task 2 implementation.

## Verification

- `bun test`: 130 pass, 0 fail
- `npx tsc --noEmit`: exit 0
- `bun run build`: exit 0
- Greps: `P2025`, `updatedAt: new Date(expectedUpdatedAt)`, `409`, `saveCharacterUpdate`, `handleCharacterSaveError`, `from 'sonner'`, `outro dispositivo` all present; `zValidator('json', updateCharacterSchema, invalidJsonHook)` count is 1; `git diff HEAD -- prisma components` empty.
- Human check (two browser tabs conflict toast; rapid single-tab edits with no toast) was NOT performed by the executor. It remains for the end-of-phase manual verification.

## Known Stubs

None.

## Threat Flags

None. No new endpoints or trust boundaries beyond the planned optional body field.

## Commits

- 58d01b7 feat: optimistic concurrency on PUT /api/characters/:id (tracer)
- 568244f feat: serialize saves per character and track own-version lineage
- 6a57d20 feat: pt-BR conflict toast and refetch in useUpdateCharacter

## Self-Check: PASSED

All created files exist and the three commits are ancestors of HEAD.
