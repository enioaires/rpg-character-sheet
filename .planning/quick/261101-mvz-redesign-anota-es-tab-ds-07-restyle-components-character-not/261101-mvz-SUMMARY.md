---
phase: quick-261101-mvz
plan: 01
subsystem: ui-notes-tab
tags: [ferro-brasa, notes, clipboard, status-alerts, reorder, batch-gate]
requires: [261101-mvt, 261101-mvu, 261101-mvv, 261101-mvw, 261101-mvx, 261101-mvy]
provides:
  - Anotações tab in the Ferro & Brasa look (header, search, collapsed cards, reorder mode, alerts)
  - lib/clipboard.ts, framework-free copy helper
  - getNotePreview in lib/notes-format.ts (addition only)
affects: []
key-files:
  created:
    - lib/clipboard.ts
    - lib/clipboard.test.ts
    - components/character/notes/notes-status-alert.tsx
  modified:
    - lib/notes-format.ts
    - lib/notes-format.test.ts
    - components/character/notes-tab.tsx
    - components/character/notes-tab.render.test.ts
    - components/character/notes/notes-header.tsx
    - components/character/notes/notes-list.tsx
    - components/character/notes/note-card.tsx
    - components/character/notes/note-form.tsx
    - components/character/notes/edit-note-dialog.tsx
decisions:
  - "DD-01..DD-16 applied as written (table below)"
metrics:
  tasks: 3
  files: 12
  commits: 4
status: complete
actuals:
  tasks: 3
  commits: 4
plan_head_before: a7e1c2348036ca40d06e9130d5c23ff120f37bbe
plan_head_after: 1d5830f619dfefe48783c4a833e95d729dc4279a
completed: 2026-11-01
---

# Phase quick-261101-mvz Plan 01: Anotações tab (DS-07) Summary

The Anotações tab now follows the Ferro & Brasa "anotações" screen: a header with diamond, serif title and count, a search field, one-open-at-a-time collapsed cards (serif title plus a one-line plain-text preview) that expand to the `formatNoteHtml` body with dates and 44px Editar/Excluir, an Ordenar/Concluir reorder mode (grip, 44px arrows, each move saved through `moveNote` and the single `useUpdateCharacter`), a destructive "Anotações corrompidas" alert with "Copiar texto original", and a warning status alert for legacy notes. `lib/notes.ts` is untouched, the migration effect is byte-identical to the item base, and the only raw-HTML sink is still the `formatNoteHtml` line in `note-card.tsx`.

## Commits

| Commit | Message |
| --- | --- |
| 64ed7ed | feat(261101-mvz): aba Anotações com cabeçalho, busca, cartões recolhíveis e modo Ordenar |
| 2137f39 | test(261101-mvz): cópia para a área de transferência e alertas de estado das anotações (RED) |
| 3a96099 | feat(261101-mvz): alertas de anotações corrompidas e em formato antigo, com cópia do texto original |
| 1d5830f | feat(261101-mvz): formulário e diálogo de anotações no design, testes de prévia e lista |

`commits: 4` measured with `git rev-list --count a7e1c23..HEAD`. No batch-gate fix commit was needed.

## Design decisions as applied (DD-01..DD-16)

| ID | Outcome |
| --- | --- |
| DD-01 | Mock's "Migrar anotações" button omitted. Migration stays automatic: the `useEffect` block (from "// Migra anotações antigas" through its deps line) is byte-identical to the item base and `claimLegacyMigration(` still has exactly one call site. The legacy alert has no button; its line is derived during render (`locked` / `converting` / `failed` / `waiting`) from `isEditMode`, `isPending`, `isError`. No new state or effect. |
| DD-01b | New converting/failed render tests use `mockImplementationOnce`; the shared mock declaration is unchanged. |
| DD-02 | Renderer kept: expanded body goes through `formatNoteHtml`. Mock's bold-only parser not copied. |
| DD-03 | Reorder saves per tap through `moveNote` + the mutation; arrows disabled while saving; Concluir only leaves the mode. Success toast now has the fixed id `notes-move-<characterId>`. Grip is decorative. No drag-and-drop. |
| DD-04 | Reorder mode shows all notes and hides search; the term is kept. Ordenar needs 2+ notes; reorder turns off by derived state (`isReordering = requested && canReorder`). |
| DD-05 | "Criado:"/"Editado:" dates kept in the expanded body. |
| DD-06 | Delete confirmation kept and restyled (serif "Excluir “title”?", 2-column 48px Cancelar/Excluir using the destructive button variant). |
| DD-07 | Empty state kept (restyled); no-match state "Nenhuma anotação com “term”." with "Limpar busca". |
| DD-08 | Count shows total, or "N de M" while a search is active (not in reorder mode); null when notes are not writable. |
| DD-09 | Legacy/corrupted text stays visible, read-only, escaped (`PreservedNotesText`) below the header. |
| DD-10 | Copy kept for tests: "Anotações em formato antigo", aria-label "Nova Anotação", corrupted body starts with "Não foi possível ler as anotações". |
| DD-11 | Add/edit remain centered Dialogs, `max-h-[90dvh] overflow-y-auto`; formatting tips kept in a collapsible `details`. |
| DD-12 | Dev-only "Limpar dados corrompidos" kept with the same condition, restyled 44px (Wrench icon, no emoji). |
| DD-13 | Search semantics unchanged (case-insensitive substring on title/content, no trimming). |
| DD-14 | One card open at a time; entering/leaving reorder closes it; deleting the open note clears it. |
| DD-15 | See "Layout" below. |
| DD-16 | The notes tab already hid every edit-only control when locked and rendered none of them disabled, so there is no "disabled → hidden when locked" change in this item. Hidden when locked: new-note button, Ordenar/Concluir, Editar, Excluir, reorder arrows, "Criar primeira anotação", dev clear button. "Copiar texto original" stays visible (read-only). A locked render test asserts no `disabled=""` in the html. |

## Layout (DD-15)

261101-mvv's `TAB_CONTENT_CLASS` is `mt-0 mx-auto w-full max-w-[1200px] p-3 [column-width:340px] [column-gap:12px]`, so the shell IS a multi-column container. The notes tab root carries `[column-span:all] flex flex-col gap-3`, so it spans the shell columns; header, alert and search are max 720px wide, and cards flow in the list's own `columns-[340px]` container (single flex column in reorder mode). Unlike mvw/mvx/mvy I kept a single wrapper (as the plan says) rather than fragments, because the list has its own column flow independent of the rest of the sheet.

## Deviations from Plan

1. **[Ordering] Delete-dialog restyle done in Task 1.** I rebuilt note-card.tsx once, including the DD-06 AlertDialog restyle that the plan scheduled for Task 3 step 2b; Task 3 then only verified it (its gate greps pass). No behavior difference.
2. **[Test adaptation] "aria-expanded=false appears exactly twice" is not literally true.** The Radix `DialogTrigger` (new-note button) also renders `aria-expanded="false"`, giving 3 occurrences. The test instead selects the card toggle buttons (`min-h-[60px]`), expects 2, and asserts each has `aria-expanded="false"`. Intent preserved.
3. **[Test file hygiene] Second import line in lib/notes-format.test.ts.** To keep "zero deleted lines" I added `import { getNotePreview } from './notes-format'` as a separate line instead of editing the existing import. Lint is clean.
4. **[Lint] clipboard test mock.** `mock(async () => {})` typed with a rest-args callback so `toHaveBeenCalledWith` type-checks without an unused-var warning.
No further doubtful design-vs-behavior cases were met beyond DD-01..DD-16.

## Verification results (whole-batch final gate)

- `npx tsc --noEmit`: clean.
- `bun run lint`: `✖ 1 problem (0 errors, 1 warning)`, the warning being the pre-existing `routes` one in `app/api/[[...route]]/route.ts`.
- `bun test`: **389 pass, 0 fail**, 15281 expect() calls, 17 files.
- `rm -rf .next && bun run build`: passes (routes listed: /, /character/[id], /characters, /create, /api/[[...route]]).
- Gates: `lib/notes.ts` unchanged since both the item base and batch base e274082; `lib/notes-format.ts` has zero deleted lines since e274082; exactly one `dangerouslySetInnerHTML` in the notes components and it feeds `formatNoteHtml`; `package.json` and `bun.lock` unchanged; one `claimLegacyMigration(` call; migration effect block identical to base; existing render tests A-H and notes tests unmodified (zero deleted lines in both test files since base).
- Not done: Task 3's `<human-check>` walkthrough (`bun dev`, 390px and desktop, dark and light, real saves, corrupted/legacy curl scenarios, clipboard over plain http). It remains to be done at the end of the batch.

## Batch-gate fixes

None. No sibling item's file was touched.

## Line counts

| File | Lines |
| --- | --- |
| components/character/notes-tab.tsx | 361 |
| components/character/notes/note-card.tsx | 216 |
| components/character/notes/notes-list.tsx | 137 |
| components/character/notes/notes-header.tsx | 146 |
| components/character/notes/notes-status-alert.tsx | 111 |
| components/character/notes/note-form.tsx | 121 |
| components/character/notes/edit-note-dialog.tsx | 57 |
| lib/clipboard.ts | 25 |

## Threat Flags

None. No new endpoints, auth paths or schema changes. The clipboard write runs only on an explicit click, never logs or toasts the raw text; titles, previews and preserved text are React text children; no packages installed.

## Known Stubs

None.

## Stale lines in .claude/CLAUDE.md (not edited)

- Testing list: new `lib/clipboard.test.ts`; `components/character/notes-tab.render.test.ts` and `lib/notes-format.test.ts` grew.
- Large files: `notes-tab.tsx` is now 361 lines (CLAUDE.md says 307).
- Architecture, notes layer: `NotesTab` now also renders `notes/notes-status-alert.tsx` and uses `lib/clipboard.ts`; the notes `Card` read-only branch described for corrupted/legacy values is replaced by the alert + `PreservedNotesText`.
- Naming: `lib/clipboard.ts` is a new framework-free module (keep it free of React/sonner like `lib/notes.ts`).
- Carried over from earlier items: Geist fonts, `next-themes` import locations, modal files, `QuickActionsBar` props.

## Self-Check: PASSED

- Files exist: lib/clipboard.ts, lib/clipboard.test.ts, notes-status-alert.tsx, and all modified files (verified by the test runs and line counts above).
- Commits on the branch: 64ed7ed, 2137f39, 3a96099, 1d5830f (`git rev-list --count a7e1c23..HEAD` = 4).
