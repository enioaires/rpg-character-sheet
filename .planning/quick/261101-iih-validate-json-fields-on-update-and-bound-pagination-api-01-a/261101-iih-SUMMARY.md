---
phase: quick-261101-iih
plan: 01
subsystem: api
tags: [zod, hono, validation, pagination, bun-test]
requires: [261101-iie, 261101-iig]
provides:
  - tolerant Zod schemas for the 11 JSON columns in updateCharacterSchema
  - exported invalidJsonHook (400 { error: 'Dados inválidos', issues })
  - clamped getCharactersQuerySchema (parseClampedInt)
affects: [261101-iii, 261101-iim, 261101-iin]
key-files:
  modified:
    - lib/schemas/character.ts
    - app/api/[[...route]]/characters/index.ts
    - lib/calculations/index.ts
  created:
    - lib/schemas/character.test.ts
    - app/api/[[...route]]/characters/index.test.ts
decisions:
  - "Every JSON-field object uses .catchall(z.json()) (never strip, never loose) so legacy keys survive and tsc accepts Prisma update"
  - "languages.custom accepts both array and index-keyed object"
  - "No range rules beyond distributed >= 0 and weapons max 3"
requirements: [API-01, API-03]
status: complete
commits: 3
plan_head_before: 8ab3d0eba8f57aa2cfb1112cdedc1474eff91202
plan_head_after: 71401331c30bd48b6e0d08881e30fef4ff6ddf3f
---

# Phase quick-261101-iih Plan 01: Validate JSON fields on update and bound pagination Summary

Tolerant Zod schemas (partial + catchall(z.json())) for all 11 JSON columns now guard PUT /api/characters/:id with a shared 400 hook, and GET /api/characters clamps page to 1..10000 and limit to 1..100.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1 (tracer) weapons end to end: schema, `invalidJsonHook`, route + schema tests | e87bc9c | RED confirmed (stub threw, 500), then GREEN |
| 2 remaining ten JSON fields + UI-shape fixtures + rejection table | 946682a | 30 tests pass |
| 3 pagination clamp (`parseClampedInt`) + full gate | 7140133 | 31 schema tests pass |

## Verification

- `npx tsc --noEmit`: exit 0, no cast at `db.character.update`
- `bun test`: 111 pass, 0 fail (includes 261101-iig suite)
- `bun run build`: exit 0
- Region gates: `z.any()` count inside `updateCharacterSchema` is 0 (was 11); inside `characterFullSchema` still 11
- `bun run lint`: NOT run as a gate. At HEAD the script is `next lint` (removed in Next 16, no ESLint config). It runs at batch end through 261101-iim, which adds the flat config and `eslint .`; 261101-iin reruns it as the final gate.
- Route tests never touched a database: `@/lib/db` is replaced by a throwing Proxy stub before a top-level `await import('./index')`; each test asserts the access log is empty.

## Deviations from Plan

**1. [Rule 3 - Blocking] `VitalityLevels` interface changed to a type alias**
- **Found during:** Task 2 (`tsc`)
- **Issue:** `components/character/basic-info-tab.tsx:123` passes `{ currentVitality: VitalityLevels }` to `useUpdateCharacter`. The new `currentVitality` schema output has a `[x: string]: JSONType` index signature (from catchall); an `interface` has no implicit index signature, so tsc failed. Components must not be edited.
- **Fix:** In `lib/calculations/index.ts`, changed `export interface VitalityLevels {...}` to `export type VitalityLevels = {...}` (same members, type-only, zero runtime change). This file is outside the plan's four `files_modified`.
- **Files modified:** lib/calculations/index.ts
- **Commit:** 946682a

Otherwise the plan was executed as written. The four per-field schemas (`attributeValueSchema`, `vitalityBaseSchema`, `vitalityLevelsSchema`, `skillValueSchema`) are imported from `@/lib/schemas/calculations` (261101-iie kept them there; they are not redefined).

## Follow-ups

1. **Latent UI bug (out of scope):** editing a custom-language name goes through `buildUpdateData`'s three-segment path in `components/ui/editable-field.tsx`, which turns `languages.custom` from an array into an index-keyed object. After that the sheet shows no custom languages and "Adicionar" throws. The schema accepts both shapes; the UI fix belongs in a later item.
2. **No body-size limit** on PUT/POST (T-261101-iih-05, accepted): no `bodyLimit` middleware and no length caps on spells/talents/kit arrays.
3. **Handoff for 261101-iii:** `export const invalidJsonHook = (result: { success: true } | { success: false; error: z.core.$ZodError }, c: Context) => ...` in `app/api/[[...route]]/characters/index.ts`. It returns `c.json({ error: 'Dados inválidos', issues: [{ path, message }] }, 400)` and nothing on success; it is the third argument of `zValidator('json', updateCharacterSchema, invalidJsonHook)`. Do not annotate it with `Hook<..., z.ZodType>` (widens `c.req.valid('json')` to unknown). Route-test DB isolation: mock `@/lib/db` with a throwing stub before a top-level `await import('./index')`. Under Bun 1.3.2 module mocks are not scoped per file; they persist across files in the one `bun test` process and a later `mock.module` replaces the loaded module's exports in place, so this test and iii's fake-db route tests pass in either order.
4. Human check at batch end (against the real DB, `bun run dev`): one edit per JSON column saves with no 400, and `/api/characters?page=0&limit=1000000` returns page 1, limit 100.

## Known Stubs

None.

## Threat Flags

None. The 400 hook returns only `{ path, message }` per issue; a route test asserts a payload marker is absent from the response.

## Self-Check: PASSED

- lib/schemas/character.ts, lib/schemas/character.test.ts, app/api/[[...route]]/characters/index.ts, app/api/[[...route]]/characters/index.test.ts, lib/calculations/index.ts: found
- Commits e87bc9c, 946682a, 7140133 are ancestors of HEAD
