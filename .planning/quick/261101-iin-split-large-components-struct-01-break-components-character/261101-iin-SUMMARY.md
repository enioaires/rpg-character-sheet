---
phase: quick-261101-iin
plan: 01
subsystem: components/character
tags: [refactor, STRUCT-01, components]
requires: [261101-iie, 261101-iif, 261101-iig, 261101-iih, 261101-iii, 261101-iij, 261101-iik, 261101-iil, 261101-iim]
provides:
  - per-tab subcomponent folders (basic-info/, notes/, spells-talents/)
  - UpdateCharacterMutation type alias in components/character/types.ts
affects: [components/character]
key-files:
  created:
    - components/character/spells-talents/spells-card.tsx
    - components/character/spells-talents/talents-card.tsx
    - components/character/basic-info/profile-cards.tsx
    - components/character/basic-info/attribute-cards.tsx
    - components/character/basic-info/vitality-card.tsx
    - components/character/basic-info/berkana-card.tsx
    - components/character/basic-info/equipment-cards.tsx
    - components/character/basic-info/languages-card.tsx
    - components/character/notes/note-form.tsx
    - components/character/notes/notes-header.tsx
    - components/character/notes/edit-note-dialog.tsx
    - components/character/notes/notes-list.tsx
    - components/character/notes/note-card.tsx
  modified:
    - components/character/types.ts
    - components/character/spells-talents-tab.tsx
    - components/character/basic-info-tab.tsx
    - components/character/notes-tab.tsx
requirements: [STRUCT-01]
status: complete
commits: 3
plan_head_before: f06ec03908b2b9246cd4a91956983e2b1b6c77e3
plan_head_after: 8ca5bb46580ef156bad94d6287d8018e4e5e7f36
actuals:
  tasks: 3
  commits: 3
---

# Phase quick-261101-iin Plan 01: Split large tab components Summary

Three oversized character-sheet tabs split into single-responsibility subcomponents (verbatim move), with identical rendered output, exports and props.

## Commits

- 7ac79d9: SpellsTalentsTab split into SpellsCard / TalentsCard, plus UpdateCharacterMutation type alias (Task 1, tracer)
- 4c88db1: BasicInfoTab split into nine cards (Task 2)
- 8ca5bb4: NotesTab split into NotesHeader, NotesList, NoteCard, NoteForm, EditNoteDialog (Task 3)

## Final line counts

| File | Lines (baseline) |
|------|------------------|
| spells-talents-tab.tsx | 30 (546) |
| basic-info-tab.tsx | 52 (1044) |
| notes-tab.tsx | 307 (689) |
| largest new file: basic-info/vitality-card.tsx | 245 |

All files in basic-info/, notes/, spells-talents/ are under 400 lines. notes-tab.tsx is 307 lines, so the `use-notes-actions.ts` size fallback did NOT fire and was not created.

## Design notes

- Each tab calls `useUpdateCharacter` exactly once and hands the instance down as `updateCharacterMutation` (typed `UpdateCharacterMutation`), so pending-state disabling across sections is unchanged. No file under the three subfolders calls the hook.
- NotesTab keeps all state, the `parseNotes` derivation, the legacy-migration effect with `claimLegacyMigration` guard, the `guardWrite`/`canWriteNotes` corrupted-data protection, the search filter and every note-writing handler. The legacy/corrupted notice card also stays in NotesTab. notes/ files contain no effects, refs or mutation calls.
- The only raw-HTML render in components/character is in notes/note-card.tsx, fed by `formatNoteHtml` from lib/notes-format.ts (unchanged; lib/notes-format.ts and its test not touched).
- data-section anchors (vitality, berkana, weapons) each appear once, on the same Card elements, in basic-info/.
- Cards destructure from `character` only the fields they use, with the same defaults as before; props are narrowed to what each card reads (for example WeaponsCard/ArmorCard/LanguagesCard take no `isEditMode`, as their fields never received it).
- No eslint-disable directives were moved or added.

## Verification

- `npx tsc --noEmit`, `bun run lint` (0 errors, the 1 accepted warning in route.ts), `bun test` (183 pass), `bun run build`: all exit 0.
- components/character/index.ts, components/forms/character-layout.tsx, prisma/schema.prisma, package.json: no diff against this item's starting commit f06ec03.
- Extra parity check (temporary, removed): server-rendered HTML of old (f06ec03) vs new BasicInfoTab, NotesTab and SpellsTalentsTab was byte-identical for sample data in both edit and view mode, including an empty-notes case and an `<img onerror>` note body.
- Human walkthrough from the plan (`bun dev`, interactive checks) was not run; pending-save interactions and dialogs are covered only by the code-level single-mutation gates.

## Deviations from Plan

None - plan executed as written. Minor note: two row-comment labels in basic-info-tab.tsx were adjusted ("Armas e Armadura") since the comments are not behavior.

## Known Stubs

None.

## Self-Check: PASSED

All created files present; commits 7ac79d9, 4c88db1, 8ca5bb4 are ancestors of HEAD.
