---
phase: quick-261101-iii
verified: 2026-11-01T00:00:00Z
status: passed
score: 9/9 must-haves verified
covered_files:
  - ".planning/quick/261101-iii-optimistic-concurrency-api-02-useupdatecharacter-sends-the-u/261101-iii-PLAN.md"
  - ".planning/quick/261101-iii-optimistic-concurrency-api-02-useupdatecharacter-sends-the-u/261101-iii-SUMMARY.md"
  - "app/api/[[...route]]/characters/index.ts"
  - "lib/api/character-concurrency.test.ts"
  - "lib/api/character-concurrency.ts"
  - "lib/api/queries.ts"
  - "lib/schemas/character.ts"
covered_digest: "v4:sha256:de9bf702de38af803ac21756a897378cdf4b849489bd3b1bd1a989168aca00eb"
behavior_unverified: 0
---

# Quick 261101-iii: Optimistic concurrency (API-02) Verification Report

**Goal:** useUpdateCharacter sends the last-seen updatedAt; PUT /api/characters/:id does an atomic compare-and-set and answers 409 on mismatch; UI shows a pt-BR toast and refetches; single-device rapid or concurrent saves never conflict spuriously.
**Status:** passed (automatic must-haves all hold; manual two-tab test deferred, see below)

## Gates (run by the verifier)

| Gate | Result |
| --- | --- |
| `bun test` | 130 pass, 0 fail (4 files, includes iih's schema and route tests) |
| `npx tsc --noEmit` | exit 0 |
| `bun run build` | succeeds; route table printed |
| `grep -cF "zValidator('json', updateCharacterSchema, invalidJsonHook)"` on the route | 1 |
| `git diff --name-only 7140133..6a57d20 -- prisma/ components/` | empty |
| Changed files in range | only the 5 planned files |
| TBD/FIXME/XXX in touched files | none (the one `@ts-ignore` at queries.ts:125 is in a different hook, pre-existing) |

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Token-bearing PUT succeeds; returned updatedAt is cached before the next save reads its token | VERIFIED | `saveCharacterUpdate` does `setQueryData(characterQueryKey(id), result)` inside the queued task (character-concurrency.ts:157); tests (a), (f) pass |
| 2 | Stale token returns 409 and leaves the row unchanged; check and write are one conditional update | VERIFIED | Route: single `db.character.update({ where: { id, updatedAt: new Date(expectedUpdatedAt) }, data: {...updates, updatedAt: new Date()} })`; no read-compare-write; test (b) |
| 3 | Response is the row returned by the conditional update, no post-write re-read | VERIFIED | `character = await db.character.update(...)` feeds `updateCharacterResponseSchema.parse` directly; the only `findUnique` in the token branch is inside the `catch` after P2025. Test (s) guards this |
| 4 | Malformed body (with or without token, including a malformed token) still gets iih's 400 "Dados inválidos"; validator call unchanged | VERIFIED | Preservation grep = 1; schema diff is only +1 optional `expectedUpdatedAt: z.iso.datetime().optional()` key; tests (e), (r) |
| 5 | Rapid and concurrent saves on one device never 409 | VERIFIED | Per-id serial queue plus own-version lineage. Traced and exercised (see "Single-device trace") |
| 6 | Another device's change: the stale save and queued saves built from the same stale data are rejected; one toast; refetch; nothing overwritten | VERIFIED | `CharacterConflictError` on 409; `handleCharacterSaveError` uses a stable toast id `character-conflict-<id>` and invalidates `['character', id]`; wired through `useUpdateCharacter.onError` with `toast.error`; tests (g), (j), (k) |
| 7 | All callers of useUpdateCharacter inherit this with no component edits | VERIFIED | `components/` diff is empty; `mutationFn` delegates to `saveCharacterUpdate`; `$put` is called nowhere else (grep), and the only other writer to the `['character', id]` key is the core |
| 8 | Missing token still writes unconditionally (recorded compatibility exception); unknown id returns 404 | VERIFIED | Legacy branch retained with pt-BR comment and follow-up note; tests (c), (d); 404 vs 409 is decided only inside `catch` after `isRecordNotFoundError` (P2025), other errors are rethrown to the outer 500 |
| 9 | tsc, bun test and build pass; prisma untouched; no auth added | VERIFIED | Gates above |

## Single-device trace

Code read plus an independent simulation (scratchpad `sim.test.ts`, in-memory server with real ms-style versions, random latencies, importing the actual core module; 5/5 pass).

- (a) Two or more rapid saves to different fields: `base` is captured synchronously at call time (all see T0). The tasks run serially. Save 1 sends T0 and gets T1, recorded as T0 to T1. Save 2 resolves T0 to T1 through `resolveOwnVersion` and sends T1. Simulated 4 simultaneous saves gave 4x200, with the last writes winning per field and no 409.
- (b) A save that fails (fetch throws, or 500 where the DB did not commit) followed by another: the queue tail swallows the rejection, so the next task runs. No lineage entry is recorded, so the next save still sends the unchanged T0, which the server still holds. Simulated for both throw and 500: the following saves succeed and no 409 is logged.
- (c) A save right after a refetch: the refetch returns the server's current version, which on a single device equals the device's last own version. That value is a lineage tail (never a key), so it is sent unchanged. `cancelQueries` runs before `setQueryData`, so a GET that was in flight during the PUT cannot regress the cached token. Simulated 30 rounds of overlapping refetch, two concurrent saves, refetch, then another save: zero 409s.
- Conflict path: the stale save and the one queued behind it both send the stale T0 and are rejected (never read from the post-refetch cache), so the other device's edit is not overwritten. After the refetch, a new save succeeds and the other device's field survives. Simulated and passes.

## Residual notes (not gaps, not in the specified scenarios)

1. Response lost after commit. If the server commits a PUT but the client never learns the new updatedAt (connection dropped after the UPDATE, or a post-write 500), the next save from that device sends the old token and gets a 409. Simulated: it appears as a conflict toast plus refetch, and the already-saved edit is visible after the refetch. No write is lost or overwritten, and it self-heals. It is inherent to token-based OCC without idempotency keys. In this route, the only post-commit 500 would be a failure of `updateCharacterResponseSchema.parse`, which is not a realistic path. Informational.
2. Same-millisecond writes from two devices could produce an identical updatedAt (timestamp(3)), so a conflict could be missed. Practically negligible and consistent with the plan's chosen column.
3. The lineage map is per-session and unbounded per character id (tiny entries). Informational.

## Requirements

| Requirement | Status | Evidence |
| --- | --- | --- |
| API-02 | SATISFIED (automatic parts) | Client sends last-seen updatedAt, server answers 409 on change, UI shows a pt-BR toast and refetches |

## Deferred human verification (end-of-batch manual walkthrough)

1. **Two-tab conflict test.** Open the same character in two tabs. Edit and save a field in tab A. In tab B (not refreshed), edit a different field and save. Expected: a single pt-BR toast ("Este personagem foi alterado em outro dispositivo. Recarregamos os dados mais recentes — refaça sua alteração."), tab B refetches and shows tab A's change, and tab B's edit is not applied. Re-doing the edit in tab B then saves. Why human: real browser, real DB, real toast rendering.
2. **Rapid single-tab editing.** Quickly edit several different fields (inline fields plus notes) in one tab. Expected: no conflict toast appears and everything persists after reload.

## Anti-patterns

None blocking. No stubs, no debt markers, no static or hollow data paths; the response flows from the DB row through the schema to the cache.

---
_Verified: 2026-11-01_
_Verifier: Claude (gsd-verifier)_
