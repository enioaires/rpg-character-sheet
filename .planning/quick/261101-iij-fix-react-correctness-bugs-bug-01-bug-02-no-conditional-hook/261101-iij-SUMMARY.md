---
phase: quick-261101-iij
plan: 01
subsystem: react-correctness
tags: [BUG-01, BUG-02, notes-tab, editable-field, render-purity]
requires: ["261101-iie", "261101-iif", "261101-iig", "261101-iii"]
provides: ["render-pure NotesTab", "NotesTab render regression tests"]
key-files:
  created: [components/character/notes-tab.render.test.ts]
  modified: [components/character/notes-tab.tsx]
requirements: [BUG-01, BUG-02]
status: complete
commits: 3
plan_head_before: 6a57d20
plan_head_after: a590812
---

# Phase quick-261101-iij Plan 01: React correctness bugs Summary

NotesTab now parses notes in a pure `useMemo`, derives the corrupted-data flag, and runs the legacy plain-text migration only from a `useRef`-guarded `useEffect`; EditableField already had unconditional hooks (BUG-01 resolved by 261101-iie, verified here).

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1 (RED) | 1bd1927 | components/character/notes-tab.render.test.ts (Tests A-C; Test A and the migration half observed failing: 1 mutation call at HEAD) |
| 1 + 2a/2b (GREEN) | a2211f3 | components/character/notes-tab.tsx |
| 2 (tests D, E) | a590812 | components/character/notes-tab.render.test.ts |

## BUG-01 case

Case 2 applied: 261101-iie already reduced `isSaving` to `updateCharacterMutation.isPending`. No code change and no commit for Task 3. Verified by both Task 3 gates (no hook call inside a conditional/logical expression; all EditableField hooks precede its first top-level if/return) and `npx tsc --noEmit`.

## Verification

- `bun test` (all files): 135 pass, 0 fail across 5 files; also run in both orders with `lib/api/character-concurrency.test.ts` (24 pass each).
- `npx tsc --noEmit`: exit 0. `bun run build`: exit 0.
- Gates: 0 `setHasCorruptedData`/`setHasMigratedOldNotes` matches; 0 log-level console calls in app/components/lib/providers/hooks; `useEffect`/`useMemo`/`useRef` count in notes-tab.tsx = 3.
- Test file path is the planned `components/character/notes-tab.render.test.ts` (no deviation).

## Deviations from Plan

**1. [Ordering] Corrupted flag derivation and debug-log removal landed in the Task 1 GREEN commit.** The Task 1 memo must call no state setter, so the derived `hasCorruptedData` (true only on the outer-catch path, dev env only) and the removal of the four log-level statements were done in the same commit (a2211f3) instead of a separate Task 2 commit. Task 2's commit therefore contains only Tests D and E. Behavior is as planned.

## Human-check still pending (not automatable)

- Strict Mode single migration PUT: with `bun run dev`, open a character whose notes column is plain text in edit mode; expect one "Anotações Antigas" note, one PUT, one toast.
- EditableField inline-edit smoke test (spinner while saving, no hook-order warning).

## Notes

- Bun's `mock.module('@/lib/api/queries')` in `notes-tab.render.test.ts` is process-wide within a `bun test` run; a future test needing the real `@/lib/api/queries` must account for that (the current suite, including `character-concurrency.test.ts`, does not import it).
- Known stubs: none. Threat flags: none.

## Self-Check: PASSED

- components/character/notes-tab.render.test.ts and components/character/notes-tab.tsx present; commits 1bd1927, a2211f3, a590812 are ancestors of HEAD (3 commits since 6a57d20).
