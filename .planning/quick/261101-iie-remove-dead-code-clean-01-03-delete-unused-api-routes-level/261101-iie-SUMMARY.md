---
phase: 261101-iie
plan: 01
subsystem: cleanup
tags: [dead-code, hono, zustand, bun, dependencies]
requires: []
provides:
  - CRUD-only characters Hono router (5 routes)
  - Store with edit-UI state only
  - EditableField that persists only via the real API
  - Pruned package.json and bun.lock in sync
affects: [261101-iif, 261101-iig, 261101-iih, 261101-iii, 261101-iij, 261101-iim, 261101-iin]
key-files:
  modified:
    - package.json
    - bun.lock
    - "app/api/[[...route]]/characters/index.ts"
    - lib/api/queries.ts
    - lib/schemas/calculations.ts
    - lib/store/character.ts
    - components/ui/editable-field.tsx
  deleted:
    - components/ui/calendar.tsx
    - components/ui/carousel.tsx
    - components/ui/chart.tsx
    - components/ui/command.tsx
    - components/ui/drawer.tsx
    - components/ui/form.tsx
    - components/ui/input-otp.tsx
    - components/ui/resizable.tsx
requirements-completed: [CLEAN-01, CLEAN-02, CLEAN-03]
status: complete
commits: 3
plan_head_before: 832fa9b6b7ad451b203f30b5f834ad06dc406b31
plan_head_after: 02c311b2bd0821adaad36d7c3eed0b44d38a8046
---

# Phase 261101-iie Plan 01: Remove dead code (CLEAN-01..03) Summary

Removed the 8 unused calculation/level-up API routes with their hooks and schemas, the simulated (setTimeout) save path in the Zustand store and EditableField's fallback to it, and 10 never-imported packages (plus peer-only `@hookform/resolvers`) with the 8 shadcn files that imported them.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 9bef045 | Remove 11 packages and 8 components/ui files, sync bun.lock (CLEAN-03) |
| 2 | 7fa8abd | Delete 8 dead routes, client hooks, route schemas (CLEAN-01) |
| 3 | 02c311b | Remove simulated save path from store and EditableField (CLEAN-02) |

## Verification

- Usage re-verified before deleting: no importer of the 11 packages or the 8 files outside the files themselves.
- `bun install --frozen-lockfile`, `npx tsc --noEmit`, `bun run build` all exit 0 (after each task as applicable).
- Router route table is exactly `DELETE /:id, GET /, GET /:id, POST /, PUT /:id`.
- Store keys are exactly `cancelEditing, character, editingField, reset, setCharacter, startEditing`.
- `git diff` against lib/calculations, prisma, lib/schemas/character.ts, lib/constants, components/character, editable-scaling-field.tsx is empty.
- Not run: the Task 3 human-check (manual save + reload against a live database); it needs a running app and DB.

## Notes for siblings and the orchestrator

1. **bun.lock was stale.** The committed lockfile pinned `next@15.4.4`; `bun remove` re-resolved it to **next 16.4.3** (read from node_modules/next/package.json). No version ranges in package.json changed. Tool used: **Bun 1.3.2**; the bun.lock header (`lockfileVersion: 1`, `configVersion: 0`) is unchanged.
2. **package-lock.json is now out of sync** with package.json until 261101-iim deletes it (TOOL-02).
3. **For 261101-iij:** EditableField's conditional store-hook call no longer exists; `isSaving` and `error` now come only from `useUpdateCharacter` (`isPending`, `error?.message`). BUG-01 needs verification, not a re-fix. The store no longer has `isSaving` or `error`. The `console.error` in the catch block was left for iij.
4. **For 261101-iih:** `attributeValueSchema`, `vitalityBaseSchema`, `vitalityLevelsSchema` and `skillValueSchema` are still exported unchanged from `@/lib/schemas/calculations`.
5. **For 261101-iif:** `useCalculatedStats` (store, byte-identical), `useCalculateDerivedStats` (queries.ts) and the inline formula in `EditableAttributeField` were deliberately left untouched for CALC-01. `lib/calculations/index.ts` is untouched.
6. **For all dependent siblings (esp. 261101-iig, 261101-iim, which also change package.json):** rebase on this item's commits; if bun.lock conflicts, regenerate it with `bun install` rather than hand-merging.
7. `characterId` is now a required prop of `EditableField` (also flows into `EditableNumberField`, `EditableTextArea`, `EditableAttributeField`); all call sites already passed it, tsc is green.
8. `components/character/basic-info-tab.tsx` still has an unused `useCharacterStore` import (left for lint cleanup / iim).

## Deviations from Plan

None - plan executed as written. (During Task 2 a transient sed range error removed the `db` import; it was restored before any verification or commit.)

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- Commits 9bef045, 7fa8abd, 02c311b exist on HEAD; 8 deleted files absent; modified files present.
