---
phase: quick-261101-iik
plan: 01
subsystem: notes
tags: [notes, zod, react, migration, data-integrity]
requires: [261101-iig, 261101-iii, 261101-iij]
provides: [lib/notes.ts shared util for the notes String column]
affects: [components/character/notes-tab.tsx]
key-files:
  created: [lib/notes.ts, lib/notes.test.ts]
  modified: [components/character/notes-tab.tsx, components/character/notes-tab.render.test.ts]
decisions:
  - "Legacy migration claim lives in module scope (claimLegacyMigration), replacing iij's per-mount ref, so remounts during an in-flight PUT cannot duplicate it"
  - "Note items require all five string fields; z.looseObject keeps unknown keys"
  - "Failed migration does not auto-retry; a toast tells the user to reload"
status: complete
commits: 2
plan_head_before: a590812
plan_head_after: 4e43493
actuals:
  tasks: 2
  commits: 2
---

# Phase quick-261101-iik Plan 01: Centralize notes logic (NOTE-01) Summary

Shared `lib/notes.ts` owns parsing (ok/empty/legacy/corrupted), legacy migration, serialization, write guard and reorder for the `notes` String column; notes-tab consumes it, migrates legacy text once per page session, and never overwrites unreadable data.

## Commits

- 9f531b6 feat: lib/notes util (noteSchema, parseNotes, serializeNotes, createNote, migrateLegacyNotes, claimLegacyMigration) + effect-driven migration wiring
- 4e43493 feat: canWriteNotes/moveNote, guarded writes, notice card for corrupted/legacy data, Render Tests F-H

## What changed

- `lib/notes.ts` (new) and `lib/notes.test.ts` (21 tests, every export covered).
- `notes-tab.tsx`: local `Note` and inline parser removed; `parsed = useMemo(parseNotes)`; one `useEffect` migrates legacy text gated by `claimLegacyMigration`, writing through `useUpdateCharacter().mutateAsync` (same `{ id, data }` convention as other handlers); success toast unchanged, new pt-BR error toast on failure.
- All writes use `serializeNotes`; add/edit/delete/move are refused with a toast when `!canWriteNotes(parsed)`. No `JSON.parse`/`JSON.stringify` remain in the component.
- When not writable the list area shows only a notice card (raw/legacy text as a React text child of a `pre`, so it is escaped); the "Nova Anotação" dialog block renders only when `isEditMode && canWrite`; the empty state and "Criar primeira anotação" are unreachable in that case.
- `moveNoteUp`/`moveNoteDown` kept as thin wrappers over a shared `moveNoteBy` using `moveNote` (same no-op rules).
- Render Tests F-H added to `notes-tab.render.test.ts`; iij's Test E needed no change (it never asserted UI copy).

## Verification

- `bun test`: 159 pass / 0 fail across 6 files
- `npx tsc --noEmit`: exit 0
- `bun run build`: exit 0
- `prisma/schema.prisma` untouched (`notes String?` count = 1); no packages added; `renderFormattedText` untouched
- `bun run lint` is not a gate for this item (deferred to 261101-iim)
- Pending manual UAT (human-check in plan Task 2): Strict Mode single PUT, corrupted notice in dev server.

## Deviations from Plan

None - plan executed as written. The plan's reference to iij's `hasCorruptedData` memo flag and ref were replaced as specified (`migrationAttemptedRef` and `useRef` import removed).

## Known Stubs

None.

## Threat Flags

None. T-261101-iik-01..04 mitigations implemented (write guard, escaped notice, safe parse, claim-gated migration).

## Self-Check: PASSED

Files lib/notes.ts, lib/notes.test.ts exist; commits 9f531b6 and 4e43493 are ancestors of HEAD.
