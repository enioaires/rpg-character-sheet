---
phase: quick-261101-mvz
plan: 01
type: execute
wave: 7                     # ADVISORY ONLY: authoritative wave is recomputed by `quick-batch update` from depends_on
depends_on: ["261101-mvt", "261101-mvu", "261101-mvv", "261101-mvw", "261101-mvx", "261101-mvy"]   # runs LAST: Task 3 is the whole-batch gate
files_modified:
  - components/character/notes-tab.tsx
  - components/character/notes/notes-header.tsx
  - components/character/notes/notes-list.tsx
  - components/character/notes/note-card.tsx
  - components/character/notes/notes-status-alert.tsx
  - components/character/notes/note-form.tsx
  - components/character/notes/edit-note-dialog.tsx
  - lib/notes-format.ts
  - lib/notes-format.test.ts
  - lib/clipboard.ts
  - lib/clipboard.test.ts
  - components/character/notes-tab.render.test.ts
autonomous: true
requirements: [DS-07]

must_haves:
  truths:
    - "With valid notes, the Anotações tab shows a header with a 7px diamond, the serif title 'Anotações' and the note count ('N de M' while a search is active), a search field with the hint 'Buscar em títulos e textos', and one collapsed card per note with a serif title and a one-line plain-text preview"
    - "Tapping a card expands it (aria-expanded true). The expanded card shows the content rendered by formatNoteHtml (bold, italic, code, headings, lists, paragraphs), the created/edited dates and, when unlocked, 44px Editar and Excluir buttons. Excluir keeps its confirmation dialog. Only one card is open at a time"
    - "When unlocked with writable notes, the header shows a 44px new-note button (aria-label 'Nova Anotação') and, with 2 or more notes, the Ordenar/Concluir toggle. In reorder mode the search is hidden, every note shows a grip icon and 44px up/down arrow buttons, the first up and last down are disabled, and each move is saved right away through moveNote and the single useUpdateCharacter mutation"
    - "Corrupted notes show a destructive alert 'Anotações corrompidas' with a 'Copiar texto original' button. It writes the raw notes string to the clipboard and shows a pt-BR toast on success or failure, plus a separate toast when the Clipboard API is missing. The raw text stays visible, read-only and escaped, and no write control appears"
    - "Legacy notes show a warning status alert (history icon, title 'Anotações em formato antigo') with no migrate button. The automatic one-time migration on entering edit mode is unchanged, and notes-tab.tsx has exactly one claimLegacyMigration( call site, as at HEAD. The alert reads: when locked, 'Desbloqueie a ficha para converter as anotações para o novo formato.'; in edit mode while the write runs, a spinner with 'Convertendo…'; after a failed attempt this session, an error line asking to reload the page. No retry write exists"
    - "Note content reaches the DOM as HTML only through formatNoteHtml: the notes components contain exactly one dangerouslySetInnerHTML. Titles, previews and raw or legacy text render as escaped React text"
    - "lib/notes.ts is unchanged, lib/notes-format.ts only gains getNotePreview (no line removed), and the existing render tests A-H and notes tests pass with their assertions unmodified"
    - "Whole-batch gate after all seven items: npx tsc --noEmit, bun run lint (0 errors, only the pre-existing routes warning), bun test and bun run build all pass"
  artifacts:
    - path: "components/character/notes-tab.tsx"
      provides: "Notes tab state (search, reorder mode, open card, dialogs), all write handlers through one useUpdateCharacter, the unchanged auto-migration effect with a legacy status derived from the mutation state, clipboard handler, layout root that spans the shell columns"
      contains: "column-span:all"
    - path: "components/character/notes/notes-header.tsx"
      provides: "Diamond + serif header with count, Ordenar/Concluir toggle, 44px new-note button with the add Dialog, dev-only clear-corrupted button"
      exports: ["NotesHeader"]
    - path: "components/character/notes/notes-list.tsx"
      provides: "Search field or reorder hint, empty and no-match states, card container (columns in normal mode, single column in reorder mode)"
      exports: ["NotesList"]
    - path: "components/character/notes/note-card.tsx"
      provides: "Collapsible note card (serif title, preview, chevron, formatted body, dates, Editar/Excluir) and reorder row (grip, title, 44px up/down)"
      exports: ["NoteCard"]
    - path: "components/character/notes/notes-status-alert.tsx"
      provides: "Corrupted alert with Copiar texto original, legacy status alert (locked / converting / failed / waiting messages, no button), and the read-only preserved-text block"
      exports: ["NotesStatusAlert", "PreservedNotesText"]
    - path: "components/character/notes/note-form.tsx"
      provides: "Restyled add/edit form: labelled 44px inputs, 16px textarea, collapsible formatting tips, 48px buttons"
      exports: ["NoteForm"]
    - path: "components/character/notes/edit-note-dialog.tsx"
      provides: "Restyled edit Dialog (serif title, scrollable content)"
      exports: ["EditNoteDialog"]
    - path: "lib/notes-format.ts"
      provides: "Unchanged escapeHtml/formatNoteHtml plus the new plain-text getNotePreview"
      exports: ["escapeHtml", "formatNoteHtml", "getNotePreview"]
    - path: "lib/clipboard.ts"
      provides: "Framework-free clipboard copy that never throws and returns copied | unavailable | failed"
      exports: ["copyTextToClipboard", "CopyResult", "ClipboardWriter"]
    - path: "lib/clipboard.test.ts"
      provides: "bun tests for every copy result"
    - path: "components/character/notes-tab.render.test.ts"
      provides: "Existing render-purity tests A-H unchanged, plus appended cases for alerts, header controls, collapsed cards and preview escaping"
  key_links:
    - from: "components/character/notes/note-card.tsx"
      to: "lib/notes-format.ts"
      via: "the single raw-HTML sink renders formatNoteHtml(note.content); the collapsed preview renders getNotePreview(note.content) as React text"
      pattern: "__html: formatNoteHtml("
    - from: "components/character/notes-tab.tsx"
      to: "lib/notes.ts"
      via: "moveNote for reorder, canWriteNotes for the write guard, claimLegacyMigration in the unchanged migration effect (the only call site)"
      pattern: "claimLegacyMigration("
    - from: "components/character/notes-tab.tsx"
      to: "lib/clipboard.ts"
      via: "Copiar texto original calls copyTextToClipboard(parsed.raw, navigator.clipboard) and maps the result to toasts"
      pattern: "copyTextToClipboard("
    - from: "components/character/notes-tab.tsx"
      to: "components/character/notes/notes-status-alert.tsx"
      via: "renders NotesStatusAlert above the header and PreservedNotesText below it for legacy/corrupted values"
      pattern: "<NotesStatusAlert"
    - from: "components/character/notes/notes-header.tsx"
      to: "components/ui/section-card.tsx"
      via: "DiamondMarker before the serif title (261101-mvt contract)"
      pattern: "<DiamondMarker"
    - from: "components/character/notes/note-form.tsx"
      to: "components/ui/inline-field-state.tsx"
      via: "INLINE_FIELD_LABEL_CLASS on the Título/Conteúdo labels (261101-mvt contract)"
      pattern: "INLINE_FIELD_LABEL_CLASS"
---

<objective>
Redesign the Anotações tab (DS-07) to the "Ferro & Brasa" anotacoes screen, then run the final quality gate for the whole batch 261101-mvs.

The tab gets:
- a header with the diamond marker, the serif title and the count
- the Ordenar/Concluir toggle and a 44px new-note button when notes are writable
- a search field
- collapsed cards (serif title plus a one-line preview) that expand to the formatted content with Editar/Excluir
- a reorder mode with a grip icon and 44px up/down buttons that use the existing moveNote
- a corrupted-notes alert with "Copiar texto original"
- a legacy-notes status alert in the design's look. It reports the existing automatic one-time migration (locked, converting, failed). The mock's migrate button is omitted because migration is automatic today (DD-01)

Purpose: the notes tab is the last screen of the redesign. Note bodies are user-written and shared with the play group, and a stored XSS bug was fixed here before (261101-iil). So the redesign must keep every safety guarantee in lib/notes.ts and the escape-then-format renderer in lib/notes-format.ts.

Output: 5 restyled notes components, 1 new alert component, 1 new pure helper in lib/notes-format.ts, 1 new framework-free clipboard helper, new tests, and a green whole-batch gate.

Owner rule (executor: follow it): .planning/design/ferro-brasa/README.md, section "Important: the design is visual direction, not a functional spec". Take look and layout from the mock and behavior from the current app. For this item the owner specifically said to keep the existing notes renderer and every current notes capability, even where the mock simplifies them (for example its bold-only markdown parsing). The recorded cases are DD-01..DD-16 in `<design_decisions>`. Record any further doubtful case in the SUMMARY.

Not in scope:
- no change to lib/notes.ts, to formatNoteHtml/escapeHtml, to the save core, to schemas or to Prisma
- no new packages (lucide-react, sonner and the Radix dialogs are already dependencies)
- no drag-and-drop reordering (DD-03)
- no edits to sibling items' files, except a behavior-preserving fix the Task 3 batch gate forces (see Task 3)
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.claude/CLAUDE.md
@.planning/STATE.md
@.planning/design/ferro-brasa/README.md
# Ficha.dc.html is about 106 KB. Read only: ANOTAÇÕES markup lines 462-529, mock notes logic lines 854-865 and 932-934, delete alert dialog lines 636-650.
@.planning/design/ferro-brasa/Ficha.dc.html
# Foundation contract (exact export names). If its SUMMARY lists a corrected API, the SUMMARY wins.
@.planning/quick/261101-mvt-redesign-foundation-ds-01-implement-the-ferro-brasa-design-s/261101-mvt-PLAN.md
@lib/notes.ts
@lib/notes-format.ts
@lib/notes-format.test.ts
@components/character/notes-tab.tsx
@components/character/notes-tab.render.test.ts
@components/character/notes/notes-header.tsx
@components/character/notes/notes-list.tsx
@components/character/notes/note-card.tsx
@components/character/notes/note-form.tsx
@components/character/notes/edit-note-dialog.tsx
@components/character/types.ts

<interfaces>
Consumed from 261101-mvt (already executed when this item runs; check its SUMMARY for the final names):
- `DiamondMarker({ tone?, className? })` from '@/components/ui/section-card': an aria-hidden 7px square rotated 45°, bg-primary by default.
- `INLINE_FIELD_LABEL_CLASS` from '@/components/ui/inline-field-state': 12px uppercase muted label, tracking 0.06em.
- Tailwind utilities from app/globals.css:
  - font-serif (Spectral) and font-numeric (always paired with tabular-nums)
  - shadow-card and animate-ficha-spin
  - text-/border-/bg-warning and text-success
  - rounded-md = var(--radius) = 4px
  - token CSS variables usable in arbitrary values: --destructive, --warning, --card, --primary, --accent, --input

Existing and unchanged, lib/notes.ts:
- `parseNotes(raw)` returns `ParsedNotes`, one of:
  - empty
  - ok
  - legacy `{ legacyText }`
  - corrupted `{ raw }`. When the column is a string, `raw` is the original untrimmed string.
- `canWriteNotes(parsed)` is true only for ok or empty.
- `createNote`, `serializeNotes` and `migrateLegacyNotes(legacyText)`.
- `moveNote(notes, id, 'up' | 'down')` returns `Note[] | null`. It returns null at the ends or when the id is missing.
- `claimLegacyMigration(characterId, legacyText)` returns true only the first time per pair during the module's lifetime.

Existing and unchanged, lib/notes-format.ts:
- `escapeHtml(text)`
- `formatNoteHtml(text)`: escape first, then a fixed tag set strong/em/code/h1/h2/h3/li/p/br.

New in this item:
- lib/notes-format.ts (Task 1): `getNotePreview(content: string): string`.
  - Takes the first line that has non-whitespace text, splitting on \r?\n.
  - Trims it and removes one leading heading marker (# , ## or ### ) or list marker (- ).
  - Unwraps **x**, *x* and `x` pairs with the same non-greedy patterns the formatter uses.
  - Trims the result and returns '' for empty content.
  - Returns PLAIN TEXT and does not escape it. Callers render it as a React text child, never as HTML.
- lib/clipboard.ts (Task 2), framework-free, single quotes, no semicolons:
  - `type CopyResult = 'copied' | 'unavailable' | 'failed'`
  - `interface ClipboardWriter { writeText(text: string): Promise<void> }`
  - `async function copyTextToClipboard(text: string, clipboard: ClipboardWriter | null | undefined): Promise<CopyResult>`
    - returns 'unavailable' when clipboard is nullish or writeText is not a function
    - returns 'copied' after awaiting writeText(text) with the exact text
    - returns 'failed' when writeText rejects or throws synchronously
    - never throws and never logs
- notes/notes-header.tsx `NotesHeaderProps` (Task 1):
  - countLabel: string | null
  - isEditMode: boolean
  - canWrite: boolean
  - isCorrupted: boolean
  - isSaving: boolean
  - canReorder: boolean
  - isReordering: boolean
  - onToggleReorder: () => void
  - isAddDialogOpen: boolean
  - onAddDialogOpenChange: (open: boolean) => void
  - noteTitle, noteContent: string
  - onNoteTitleChange, onNoteContentChange: (value: string) => void
  - onAddNote: () => void | Promise<void>
  - onClearCorrupted: () => void | Promise<void>
- notes/notes-list.tsx `NotesListProps` (Task 1):
  - notes: Note[] (filtered)
  - allNotes: Note[]
  - searchTerm: string
  - onSearchTermChange: (value: string) => void
  - isEditMode: boolean
  - isSaving: boolean
  - isReordering: boolean
  - openNoteId: string | null
  - onToggleNote: (noteId: string) => void
  - onOpenAddDialog: () => void
  - onMoveUp, onMoveDown: (noteId: string) => void
  - onEdit: (note: Note) => void
  - onDelete: (noteId: string) => void | Promise<void>
- notes/note-card.tsx `NoteCardProps` (Task 1):
  - note: Note
  - isOpen: boolean
  - isReordering: boolean
  - canEdit: boolean
  - isSaving: boolean
  - canMoveUp, canMoveDown: boolean
  - onToggle: (noteId: string) => void
  - onMoveUp, onMoveDown: (noteId: string) => void
  - onEdit: (note: Note) => void
  - onDelete: (noteId: string) => void | Promise<void>
- notes/notes-status-alert.tsx (Task 2):
  - `type NotesStatusAlertProps` is one of:
    - `{ status: 'corrupted'; onCopyOriginal: () => void }`
    - `{ status: 'legacy'; migrationStatus: LegacyMigrationStatus }`
  - `type LegacyMigrationStatus = 'locked' | 'converting' | 'failed' | 'waiting'` (exported). NotesTab derives it with the first matching rule:
    1. !isEditMode → 'locked'
    2. updateCharacterMutation.isPending → 'converting'
    3. updateCharacterMutation.isError → 'failed'
    4. otherwise → 'waiting'
    While the value is legacy, the migration is the only write that can run (guardWrite blocks every other write and their controls are hidden), so the mutation state describes the migration.
  - `NotesStatusAlert(props: NotesStatusAlertProps)`
  - `PreservedNotesText({ text }: { text: string })`
</interfaces>
</context>

<design_decisions>
Rule: the owner's README section "Important: the design is visual direction, not a functional spec", plus the owner's item-specific note: keep the notes renderer and every current notes capability. Look and layout come from the mock. Behavior comes from the current app. Recorded cases:
- DD-01 (coordinator decision after the plan check: the mock's "Migrar anotações" button is omitted because migration is automatic today).
  - Today, migration is AUTOMATIC: a useEffect in NotesTab migrates once per session when isEditMode is true and the value is legacy, guarded by claimLegacyMigration. The effect claims as soon as edit mode starts, and edit mode is the only state where a write button could show. So a button could never migrate anything.
  - The effect, its guards, its toasts and its single claimLegacyMigration( call site stay byte-identical to HEAD.
  - The legacy alert becomes a status message in the design's look: warning border and 10% warning tint, History icon, title "Anotações em formato antigo" (DD-10). Its line depends on LegacyMigrationStatus:
    - locked: "Desbloqueie a ficha para converter as anotações para o novo formato." (no button)
    - converting: a LoaderCircle with animate-ficha-spin plus "Convertendo…"
    - failed: a text-destructive line "Não foi possível converter as anotações. Recarregue a página para tentar de novo." There is no retry write, because the claim is spent for this session.
    - waiting (edit mode, nothing pending, no error): "A conversão é automática no modo de edição. Se esta mensagem não sumir, recarregue a página."
  - Why "waiting" exists: it covers the instant before the effect fires. It also covers a remount after a failure in the same session. Radix Tabs unmounts inactive tabs, which resets the mutation state while the claim stays spent, and lib/notes.ts offers no way to query a claim. So no spinner can ever get stuck.
  - The failure toast is unchanged.
- DD-01b: the existing render test file mocks the hook with only mutateAsync, isPending and error. New tests that need the converting or failed state use mockImplementationOnce inside the test and never change the shared mock declaration.
- DD-02: The renderer is kept. Expanded notes go through formatNoteHtml (bold, italic, code, headings, lists, paragraphs, line breaks). The mock's bold-only paras/lines/spans parser is not copied.
- DD-03: Reorder writes are kept as today. Each up/down tap saves at once through moveNote plus the mutation, and buttons are disabled while a save is pending. The mock reorders only locally. "Concluir" only leaves the mode and writes nothing. The existing success toast stays, with a fixed toast id per character so rapid taps update one toast instead of stacking. The grip icon is decorative (aria-hidden). Drag-and-drop is not added: the mock is static, and drag-and-drop would be a new interaction, not a pure convenience.
- DD-04: Reorder mode shows ALL notes and hides the search. This matches both the mock and today's rule that reordering is offered only on the unfiltered list, because moveNote swaps neighbors in the full list. The search term is kept and applies again after Concluir. Ordenar is shown only with 2 or more notes. With fewer, reorder mode turns off (derived state, no effect).
- DD-05: Created/edited dates are kept (a current capability the mock omits). They appear in the expanded body, using the current formatDate and the "Criado:"/"Editado:" labels.
- DD-06: The delete confirmation is kept (current safety). Task 1 moves it into the expanded body unchanged. Task 3 restyles it after the mock's "excluir" alert dialog: serif title "Excluir “title”?", 2-column 48px Cancelar/Excluir.
- DD-07: The current empty state is kept ("Nenhuma anotação ainda", "Criar primeira anotação"); the mock has none. The no-match state uses the mock text "Nenhuma anotação com “term”." and keeps today's "Limpar busca" button.
- DD-08: The count shows the total like the mock. While a search is active it shows "N de M", which keeps today's filtered-count information.
- DD-09: Legacy and corrupted text stays visible, read-only and escaped, below the header. This follows CLAUDE.md ("shown as-is with a warning") and existing tests F/G, even though the mock shows only the alert.
- DD-10: Copy kept for test compatibility:
  - The legacy alert title stays "Anotações em formato antigo" (test G asserts it); the mock says "no formato antigo".
  - The new-note icon button's aria-label is "Nova Anotação" with a capital A (test H asserts it); the mock uses a lowercase a.
  - The corrupted alert uses the mock's title "Anotações corrompidas". Its body starts with "Não foi possível ler as anotações", which test F asserts.
- DD-11: Add and edit stay centered Dialogs as today; the mock shows no note editor. They are restyled, and their content scrolls instead of being clipped on phones. The formatting tips are kept inside a collapsible details element.
- DD-12: The dev-only "Limpar dados corrompidos" button is kept, with the same condition (development, corrupted, edit mode) and in the same header file, restyled to 44px.
- DD-13: Search semantics are unchanged: a case-insensitive substring match on the title or content, with no trimming. The mock trims; the current app wins.
- DD-14: One card is open at a time (mock). Entering or leaving reorder mode closes the open card. Deleting the open note clears it.
- DD-15: Layout works with or without 261101-mvv's multi-column shell:
  - The tab root carries [column-span:all], so it spans the shell's columns if there are any and has no effect otherwise.
  - The header block is max 720px wide (mock).
  - In normal mode, cards flow in the tab's own columns-[340px] container. In reorder mode they form one column, because column-major order would make up/down confusing.
- DD-16 (coordinator decision for all tabs: locked means edit-only controls are HIDDEN, not disabled):
  - When locked (isEditMode false), these are not rendered at all: the new-note button, Ordenar/Concluir, Editar, Excluir, the reorder arrows, "Criar primeira anotação" and the dev-only clear button. The legacy alert never has a button (DD-01). When locked it shows the unlock message.
  - Unlocking brings each one back.
  - Today's notes tab already hides all of these when locked and renders none of them disabled, so there is no "disabled → hidden when locked" change. The SUMMARY must state that explicitly.
  - "Copiar texto original" stays visible when locked because it is read-only.
  - The only disabled states left are while unlocked: the arrows at the list ends or while a save is pending, and the form submit while saving.
</design_decisions>

<coverage_audit>
| Source | Item | Covered by |
|--------|------|------------|
| GOAL | Header with count | Task 1 (NotesHeader countLabel; DD-08) |
| GOAL | Ordenar/Concluir toggle and new-note button when writable | Task 1 |
| GOAL | Search field | Task 1 (NotesList; DD-04, DD-13) |
| GOAL | Collapsed cards with serif title and one-line preview | Task 1 (getNotePreview + NoteCard); Task 3 tests |
| GOAL | Expand to formatted content plus Editar/Excluir | Task 1 (DD-02, DD-05); delete-dialog restyle in Task 3 (DD-06) |
| GOAL | Reorder mode: grip, 44px up/down, existing moveNote | Task 1 (DD-03, DD-04) |
| GOAL | Corrupted alert with "Copiar texto original" (clipboard of the raw notes string) | Task 2 |
| GOAL | Legacy alert tied to the one-time migration | Task 2. It is a status alert over the unchanged automatic migration. The mock's button is omitted by coordinator decision (DD-01) |
| GOAL | Keep lib/notes.ts guarantees | Gates in Tasks 1-3 (lib/notes.ts unchanged against the item base and the batch base) |
| GOAL | Escape-then-format renderer; never render unescaped HTML | Task 1 gate (one raw-HTML sink, fed by formatNoteHtml); Tasks 2-3 escaping render tests |
| GOAL | Existing tests passing | Every task runs the existing notes tests. Assertions are append-only (numstat deletion gate) |
| GOAL | Final gate for the whole batch | Task 3 |
| CONTEXT (coordinator) | depends_on all six siblings | Frontmatter |
| CONTEXT (coordinator) | Note body keeps going through formatNoteHtml | Task 1; T-mvz-01 |
| CONTEXT (coordinator) | Confirm the migration trigger; keep "runs at most once" and render purity; explain the choice | DD-01 (automatic; single claim call site; status alert); Task 2 gate (exactly one claim call); render tests |
| CONTEXT (coordinator) | Clipboard: navigator.clipboard.writeText on the raw string, pt-BR toasts, guard for a missing API | Task 2 (lib/clipboard.ts + tests) |
| CONTEXT (coordinator) | Final gate: tsc, lint (0 errors, only the routes warning), bun test, build | Task 3 |
| CONTEXT (owner rule, README "Important" + item note) | Mock gives the look, current behavior wins, keep the renderer and all notes capabilities, record decisions | `<design_decisions>` DD-01..DD-16; objective note; SUMMARY |
| CONTEXT (coordinator, all tabs) | Edit-only controls hidden (not disabled) when locked; record "disabled → hidden when locked" if it applies | DD-16 (it does not apply: today's tab already hides them); Task 3 locked render test; SUMMARY |
| RESEARCH (design README) | Diamond marker, serif titles, 44px targets, 4px radius, destructive alert (border, 10% tint, file-warning), dark-first | Tasks 1-2; human check |
| CONTEXT (memory) | No auth by design | Nothing in this plan adds auth |
</coverage_audit>

<tasks>

<task type="tracer">
  <name>Task 1 (tracer): writable notes end-to-end: header with count and controls, collapsed and expandable cards with preview, reorder mode</name>
  <files>lib/notes-format.ts, components/character/notes-tab.tsx, components/character/notes/notes-header.tsx, components/character/notes/notes-list.tsx, components/character/notes/note-card.tsx</files>
  <precondition>261101-mvt is executed: components/ui/section-card.tsx exports DiamondMarker and app/globals.css defines the font-serif and animate-ficha-spin utilities.</precondition>
  <read_first>
    - .planning/design/ferro-brasa/README.md, especially "Important: the design is visual direction, not a functional spec"
    - .planning/design/ferro-brasa/Ficha.dc.html, lines 462-529 (markup) and 854-865 plus 932-934 (state logic)
    - the 261101-mvt SUMMARY (final export names), then components/ui/section-card.tsx
    - lib/notes.ts and lib/notes-format.ts (whole files)
    - components/character/notes-tab.tsx, notes/notes-header.tsx, notes/notes-list.tsx and notes/note-card.tsx (whole files; double quotes and semicolons)
    - components/character/notes-tab.render.test.ts:
      - mock.module replaces '@/lib/api/queries' with ONLY useUpdateCharacter
      - test E requires exactly one hook call per render
      - test H requires the text 'Nova Anotação', 'Nenhuma anotação ainda' and 'Criar primeira anotação' for empty writable notes in edit mode
    - components/forms/character-layout.tsx as committed by 261101-mvv. Confirm that NotesTab still receives character, characterId and isEditMode. Do not depend on the shell's classes (DD-15)
  </read_first>
  <action>
    Step 0: record this item's base commit before editing anything. Run git rev-parse HEAD and write its output to the path printed by git rev-parse --git-path gsd-261101-mvz-base. Tasks 2-3 read it.

    Step 1, lib/notes-format.ts: APPEND getNotePreview after formatNoteHtml. Use the exact behavior in `<interfaces>` and the file's style (single quotes, no semicolons, Portuguese doc comment). The doc comment must say that the result is plain, unescaped text for React text rendering only. Do not modify, reorder or reformat any existing line: escapeHtml and formatNoteHtml stay byte-identical (gate: zero deleted lines).

    Step 2, components/character/notes/note-card.tsx: rebuild the card with the NoteCardProps from `<interfaces>`. Keep formatDate and renderFormattedText exactly as they are, including the single-line dangerouslySetInnerHTML with __html: formatNoteHtml(text). This stays the ONLY raw-HTML sink in the notes components. Never pass title, preview or raw text through it, and do not add comments naming that prop.
    - Frame: a section with mb-2, break-inside-avoid, rounded-md, border, bg-card and shadow-card. The border is border-input when open and border-border otherwise.
    - Normal mode (isReordering false): one full-width toggle button, type="button".
      - It calls onToggle(note.id) and carries aria-expanded={isOpen} and aria-controls pointing at the body id from useId.
      - Grid: minmax(0,1fr) plus 20px; min-h-[60px], px-4, py-2.5, text-left.
      - Left column: the title (font-serif, text-[17px], font-semibold, truncate). When closed and the preview is non-empty, it is followed by getNotePreview(note.content) as a React text child (text-sm, text-muted-foreground, truncate).
      - Right column: ChevronDown when closed and ChevronUp when open (size-[18px], muted, aria-hidden).
    - Open body (rendered only when isOpen): a div with that id; flex-col, gap-2.5, px-4, pb-3.5, text-[15px], leading-[1.55], break-words. It holds:
      1. renderFormattedText(note.content), per DD-02
      2. a dates line in text-xs muted, keeping "Criado: …" and, when updatedAt differs, "Editado: …" (DD-05)
      3. when canEdit, a row with gap-2 and pt-1:
         - Editar: Button variant outline, h-11, px-3.5, Pencil icon, calls onEdit(note).
         - Excluir: Button variant ghost, h-11, px-3.5, border, text-destructive, Trash2 icon. It is the trigger of the existing AlertDialog. Move that AlertDialog here with its current content, copy and onDelete(note.id) wiring unchanged. Task 3 restyles it (DD-06).
    - Reorder mode (isReordering true): one row; grid columns 20px, minmax(0,1fr), 44px, 44px; items-center, gap-1.5, min-h-14, pl-3.5, pr-1.5.
      - GripVertical (aria-hidden, muted, 18px), then the serif 17px truncated title.
      - Two ghost buttons, size-11: ArrowUp with aria-label "Subir: {title}" calling onMoveUp(note.id), and ArrowDown with aria-label "Descer: {title}" calling onMoveDown(note.id).
      - They are disabled when they cannot move or isSaving is true, with disabled:opacity-30.
      - No body, no Editar/Excluir.

    Step 3, components/character/notes/notes-list.tsx: implement NotesListProps.
    - When allNotes is empty, keep today's empty state copy restyled (DD-07): a dashed-border bg-card section, max-w-[720px], centered, py-12.
      - a FileText icon in a 64px bg-muted circle
      - the h3 "Nenhuma anotação ainda" in font-serif text-[19px]
      - the existing description sentence in text-[15px] muted
      - when isEditMode, Button h-12 "Criar primeira anotação" with Plus, calling onOpenAddDialog
    - Otherwise render a top block (flex-col, gap-2.5, max-w-[720px]) and then the cards.
    - Top block, when not reordering: a label element (flex, items-center, gap-2.5, h-[46px], px-3, border-input, rounded-md, bg-card) containing:
      - a Search icon (18px, muted, aria-hidden)
      - an input type="search" with aria-label "Buscar anotações", the `placeholder` attribute "Buscar em títulos e textos", text-base (16px avoids iOS zoom), a borderless transparent background and outline-none, wired to searchTerm/onSearchTermChange
    - Top block, when reordering: the text-sm muted hint "Use as setas para mudar a ordem. Toque em Concluir quando terminar."
    - When not reordering, searchTerm is non-empty and no note matches: a centered muted block with "Nenhuma anotação com “{searchTerm}”." and an outline Button h-11 "Limpar busca" that clears the term (DD-07).
    - Cards render isReordering ? allNotes : notes (DD-04) inside:
      - normal mode: a container with columns-[340px] gap-3
      - reorder mode: flex flex-col max-w-[720px] (DD-15)
    - Each NoteCard gets:
      - isOpen = openNoteId === note.id
      - canEdit = isEditMode
      - canMoveUp/canMoveDown from the note's index in allNotes, as today
    - Subcomponents never call the mutation hook; NotesTab passes handlers down.

    Step 4, components/character/notes/notes-header.tsx: implement NotesHeaderProps.
    - Row: flex, max-w-[720px], items-center, justify-between, gap-2.
    - Left side: DiamondMarker, then an h2 "Anotações" (font-serif text-[21px] font-semibold), then countLabel when non-null (text-sm text-muted-foreground font-numeric tabular-nums).
    - Right side, only when isEditMode and canWrite:
      - When canReorder, the toggle: Button variant outline, h-11, px-3, font-semibold, aria-pressed={isReordering}, calling onToggleReorder.
        - inactive: ArrowUpDown icon + "Ordenar", border-border, bg-transparent
        - active: Check icon + "Concluir", border-primary, bg-accent, text-accent-foreground (merge with cn)
      - Then the existing add Dialog, with the trigger as a Button size-11 that has aria-label="Nova Anotação" and title="Nova Anotação" and a Plus size-5 icon (DD-10).
      - DialogContent: w-[95vw] max-w-2xl max-h-[90dvh] overflow-y-auto. DialogTitle: font-serif text-[22px] font-semibold, "Nova Anotação". Inside, the same NoteForm wiring as today.
    - Keep the dev-only clear-corrupted button with its exact current condition (DD-12). Restyle it as Button variant destructive, h-11, with a Wrench icon and the text "Limpar dados corrompidos", no emoji. Drop the old subtitle line; the mock has none.

    Step 5, components/character/notes-tab.tsx: keep every existing handler, toast and guardWrite as they are, except for what is listed here. The migration useEffect block, from its "// Migra anotações antigas" comment through its deps line, must stay byte-identical, including indentation (DD-01; Task 2 gates it).
    - New state: isReorderRequested (boolean, false) and openNoteId (string or null).
    - Derived values, no effects (react-hooks v7 forbids synchronous setState in effects):
      - canReorder = isEditMode && canWrite && allNotes.length > 1
      - isReordering = isReorderRequested && canReorder
      - countLabel: null unless canWrite. While searchTerm is non-empty and not reordering it is "{notes.length} de {allNotes.length}"; otherwise String(allNotes.length).
    - handleToggleReorder flips isReorderRequested to the opposite of isReordering and clears openNoteId (DD-14).
    - handleToggleNote(id) opens the given id, or closes it when it is already open.
    - In handleDeleteNote, after a successful write, clear openNoteId when it equals the deleted id.
    - In moveNoteBy, pass { id: `notes-move-${characterId}` } as the options of the existing success toast (DD-03).
    - Root element: a div with [column-span:all] flex flex-col gap-3 (DD-15). It renders NotesHeader with the new props, then either the existing read-only Card branch (left untouched here; Task 2 replaces it) or NotesList with the new props, then EditNoteDialog.
    - useUpdateCharacter stays the single hook call and the only import from '@/lib/api/queries'. The render test mock provides nothing else.
    - No log/info/debug console calls; keep the existing console.error of error objects.
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && B=$(cat "$(git rev-parse --git-path gsd-261101-mvz-base)") && git cat-file -e "$B^{commit}" && grep -q 'export function getNotePreview' lib/notes-format.ts && bun -e "import { getNotePreview } from './lib/notes-format.ts'; const r = getNotePreview('\n**Negrito** e texto\nsegunda'); if (r !== 'Negrito e texto') { console.error('preview:', JSON.stringify(r)); process.exit(1) }" && grep -q 'getNotePreview(' components/character/notes/note-card.tsx && grep -q 'GripVertical' components/character/notes/note-card.tsx && grep -q 'aria-expanded' components/character/notes/note-card.tsx && grep -q 'Concluir' components/character/notes/notes-header.tsx && grep -q '<DiamondMarker' components/character/notes/notes-header.tsx && grep -q 'Buscar em títulos e textos' components/character/notes/notes-list.tsx && grep -q 'columns-\[340px\]' components/character/notes/notes-list.tsx && grep -q 'column-span:all' components/character/notes-tab.tsx && [ "$(grep -ro 'dangerouslySetInnerHTML' components/character/notes-tab.tsx components/character/notes/ | wc -l)" -eq 1 ] && grep -rn 'dangerouslySetInnerHTML' components/character/notes/ | grep -q '__html: formatNoteHtml(' && [ "$(grep -rl 'useUpdateCharacter' components/character/notes/ | wc -l)" -eq 0 ] && [ "$(grep -o 'useUpdateCharacter()' components/character/notes-tab.tsx | wc -l)" -eq 1 ] && [ "$(grep -rnE 'console\.(log|info|debug)' components/character/notes-tab.tsx components/character/notes/ | wc -l)" -eq 0 ] && git diff --quiet "$B" -- lib/notes.ts && N=$(git diff --numstat "$B" -- lib/notes-format.ts) && [ "$(printf '%s\n' "$N" | awk '{s+=$2} END{print s+0}')" -eq 0 ] && bun test components/character/notes-tab.render.test.ts lib/notes-format.test.ts lib/notes.test.ts && npx tsc --noEmit && npx eslint --max-warnings 0 components/character/notes-tab.tsx components/character/notes lib/notes-format.ts && echo TRACER-OK</automated>
  </verify>
  <done>
    - Valid notes render, end to end: header (diamond, serif title, count), search field, and collapsed cards with serif title and preview. Tapping expands to the formatNoteHtml body with dates and 44px Editar/Excluir.
    - With 2 or more notes unlocked, Ordenar switches to reorder mode (grip, 44px arrows, each move saved). Concluir leaves it.
    - The existing render tests A-H and the notes tests pass unmodified. lib/notes.ts is unchanged, and lib/notes-format.ts only gained lines.
    - tsc and eslint on the touched files are clean. TRACER-OK is printed.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: corrupted and legacy states: design alerts, "Copiar texto original" through a guarded clipboard helper, a legacy status alert over the unchanged automatic migration</name>
  <files>lib/clipboard.ts, lib/clipboard.test.ts, components/character/notes/notes-status-alert.tsx, components/character/notes-tab.tsx, components/character/notes-tab.render.test.ts</files>
  <read_first>
    - .planning/design/ferro-brasa/Ficha.dc.html, lines 464-476 (both alerts)
    - .planning/design/ferro-brasa/README.md, the "Corrupted notes alert" toast rule
    - components/character/notes-tab.tsx as left by Task 1 (the read-only Card branch, the migration useEffect, guardWrite)
    - components/character/notes-tab.render.test.ts (whole file; new cases are APPENDED and existing lines never change)
    - lib/notes.test.ts (bun:test style to copy for lib/clipboard.test.ts)
  </read_first>
  <behavior>
    - copyTextToClipboard('a\n  b ', writer) calls writer.writeText exactly once with 'a\n  b ' and resolves 'copied'
    - with undefined, null, or an object without a writeText function it resolves 'unavailable' and does not throw
    - when writeText rejects, and when writeText throws synchronously, it resolves 'failed'
    - none of these cases produces console output (spy on log/info/debug/error, expect 0 calls)
    - render, corrupted value '[{"id":' in edit mode and in locked mode: html contains 'Anotações corrompidas' and 'Copiar texto original', does not contain 'Migrar anotações', and mutateAsync is called 0 times
    - render, legacy text in edit mode with the shared mock (waiting): html contains 'Anotações em formato antigo', the legacy text and 'Se esta mensagem não sumir'; it contains none of 'Copiar texto original', 'Migrar anotações' or 'Convertendo'; mutateAsync is called 0 times (effects do not run in renderToString)
    - render, legacy text in locked mode: html contains 'Desbloqueie a ficha para converter as anotações para o novo formato.' and not 'Migrar anotações'
    - render, legacy text in edit mode with useUpdateCharacter.mockImplementationOnce(() => ({ mutateAsync, isPending: true, error: null })) (converting): html contains 'Convertendo…' and 'animate-ficha-spin'
    - render, legacy text in edit mode with a mockImplementationOnce returning { mutateAsync, isPending: false, error: null, isError: true } (failed): html contains 'Recarregue a página para tentar de novo' and not 'Convertendo…'. Use an `as` assertion on that object to the mock's own return type (TypeScript ReturnType applied to typeof useUpdateCharacter). An assertion allows the extra isError key, so tsc passes
  </behavior>
  <action>
    RED: create lib/clipboard.test.ts (bun:test, single quotes, no semicolons, a describe named 'copyTextToClipboard') covering the first four behaviors. Use plain objects as writers and cast the object that has no writeText through unknown to ClipboardWriter. APPEND a describe block 'NotesTab alertas de estado (DS-07)' at the end of components/character/notes-tab.render.test.ts for the five render behaviors. Reuse the file's render helper, constants and beforeEach. Set the converting and failed states with mockImplementationOnce inside those two tests only (DD-01b). Each render calls the hook exactly once, so the queued implementation is used by that render. Do not edit, reorder or reformat any existing line, including the shared mock declarations (gate: zero deleted lines). Run the tests and see them fail. Commit.

    GREEN, part 1: create lib/clipboard.ts exactly as in `<interfaces>`. It must stay framework-free (no React, sonner, Hono or DOM-global access inside the module): the caller passes the clipboard object in. The helper never logs. Add a short Portuguese doc comment saying the copied text is never logged.

    GREEN, part 2: create components/character/notes/notes-status-alert.tsx (double quotes, semicolons, like its siblings) with the two exports from `<interfaces>`.
    - Alert frame (both variants): flex, gap-3, p-3.5, rounded-md, border, max-w-[720px]; an icon at size-[22px] shrink-0; then a flex-col gap-2 column holding a 15px bold title, a 14px muted body and the variant's last line.
    - Export `type LegacyMigrationStatus` from this file as in `<interfaces>`.
    - Corrupted variant:
      - border-destructive, with the background bg-[color-mix(in_oklch,var(--destructive)_10%,var(--card))]
      - FileWarning icon in text-destructive
      - title "Anotações corrompidas"
      - body "Não foi possível ler as anotações desta ficha. Elas estão em somente leitura para não perder nada." (keeps test F's text)
      - action: Button variant outline, h-11, px-3.5, self-start, Copy icon, "Copiar texto original", calling onCopyOriginal. It is shown in edit and locked mode alike, because copying is read-only.
    - Legacy variant:
      - border-warning, with the background bg-[color-mix(in_oklch,var(--warning)_10%,var(--card))]
      - History icon in text-warning
      - title "Anotações em formato antigo" (DD-10)
      - body "Estas anotações são de uma versão antiga. Elas serão convertidas em uma anotação; o conteúdo não muda."
      - No button of any kind (DD-01). The last line depends on migrationStatus. It sits in a div with role="status" and aria-live="polite", so screen readers hear the change:
        - locked: muted 14px "Desbloqueie a ficha para converter as anotações para o novo formato."
        - converting: inline-flex items-center gap-2 text-sm, a LoaderCircle size-4 with animate-ficha-spin (aria-hidden), then "Convertendo…"
        - failed: text-sm text-destructive "Não foi possível converter as anotações. Recarregue a página para tentar de novo."
        - waiting: muted 14px "A conversão é automática no modo de edição. Se esta mensagem não sumir, recarregue a página."
    - PreservedNotesText: a max-w-[720px] block with a 12px uppercase muted caption "Conteúdo salvo (somente leitura)" over a pre element (whitespace-pre-wrap, break-words, font-mono, text-[13px], bg-muted, rounded-md, p-3, max-h-80, overflow-auto). The pre renders text as a React text child only, which escapes it (test F).

    GREEN, part 3: components/character/notes-tab.tsx.
    - Replace the old read-only Card branch, removing the now-unused Card and FileText imports:
      - When parsed.status is corrupted or legacy, render NotesStatusAlert ABOVE NotesHeader (mock order), and render PreservedNotesText (text = parsed.raw or parsed.legacyText) BELOW the header, in place of NotesList.
      - ok and empty values render as in Task 1.
    - Migration, per DD-01:
      - Do NOT touch the migration useEffect. It stays byte-identical to the item base and remains the file's only claimLegacyMigration( call site (both are gated).
      - Add no handler, callback or button that writes the migration.
      - Derive legacyMigrationStatus with the four ordered rules in `<interfaces>`: !isEditMode, then updateCharacterMutation.isPending, then updateCharacterMutation.isError, then waiting. Pass it to NotesStatusAlert. It is derived during render only, with no new state and no effect.
    - Copy: add async handleCopyOriginal. It returns unless parsed.status is corrupted. It awaits copyTextToClipboard(parsed.raw, typeof navigator === "undefined" ? undefined : navigator.clipboard) and maps the result:
      - copied: toast.success("Texto original copiado.")
      - unavailable: toast.error("Não foi possível copiar: a área de transferência não está disponível neste navegador. Selecione o texto abaixo e copie manualmente.")
      - failed: toast.error("Não foi possível copiar o texto original. Selecione o texto abaixo e copie manualmente.")
    - Never log or toast the raw text itself.
    - Keep guardWrite and its messages unchanged.

    REFACTOR if needed, then commit.
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && B=$(cat "$(git rev-parse --git-path gsd-261101-mvz-base)") && grep -q 'export async function copyTextToClipboard' lib/clipboard.ts && ! grep -qE "from ['\"](react|sonner|hono)" lib/clipboard.ts && ! grep -q 'console\.' lib/clipboard.ts && grep -q 'Copiar texto original' components/character/notes/notes-status-alert.tsx && grep -q 'Convertendo…' components/character/notes/notes-status-alert.tsx && grep -q 'export type LegacyMigrationStatus' components/character/notes/notes-status-alert.tsx && grep -q 'FileWarning' components/character/notes/notes-status-alert.tsx && grep -q '<NotesStatusAlert' components/character/notes-tab.tsx && grep -q 'copyTextToClipboard(' components/character/notes-tab.tsx && [ "$(grep -o 'claimLegacyMigration(' components/character/notes-tab.tsx | wc -l)" -eq 1 ] && X='/Migra anotações antigas/{p=1} p{print} p&&/}, \[isEditMode, parsed, characterId, updateCharacter\]\);/{exit}' && EF=$(git show "$B:components/character/notes-tab.tsx") && EA=$(printf '%s\n' "$EF" | awk "$X") && EC=$(awk "$X" components/character/notes-tab.tsx) && [ -n "$EA" ] && [ "$EA" = "$EC" ] && N=$(git diff --numstat "$B" -- components/character/notes-tab.render.test.ts) && [ "$(printf '%s\n' "$N" | awk '{s+=$2} END{print s+0}')" -eq 0 ] && [ "$(grep -ro 'dangerouslySetInnerHTML' components/character/notes-tab.tsx components/character/notes/ | wc -l)" -eq 1 ] && git diff --quiet "$B" -- lib/notes.ts && bun test lib/clipboard.test.ts components/character/notes-tab.render.test.ts lib/notes.test.ts lib/notes-format.test.ts && npx tsc --noEmit && npx eslint --max-warnings 0 components/character/notes-tab.tsx components/character/notes lib/clipboard.ts lib/clipboard.test.ts components/character/notes-tab.render.test.ts && echo STATES-OK</automated>
  </verify>
  <done>
    - Corrupted notes show the destructive alert with "Copiar texto original", which copies the raw string with pt-BR toasts for copied, unavailable and failed. The raw text stays visible and escaped.
    - Legacy notes show the warning status alert with no button. When locked it shows the unlock message. In edit mode it shows "Convertendo…" with a spinner while the write runs, the reload message after a failure, and the waiting message otherwise.
    - The automatic migration effect is byte-identical to the item base, and the file has exactly one claimLegacyMigration( call.
    - The new clipboard and render tests pass, and the existing assertions are untouched. STATES-OK is printed.
  </done>
</task>

<task type="auto">
  <name>Task 3: restyle the add/edit note form and the delete confirmation, lock the preview and collapsed-card behavior with tests, then run the whole-batch gate</name>
  <files>components/character/notes/note-form.tsx, components/character/notes/edit-note-dialog.tsx, components/character/notes/note-card.tsx, lib/notes-format.test.ts, components/character/notes-tab.render.test.ts</files>
  <precondition>components/ui/inline-field-state.tsx exports INLINE_FIELD_LABEL_CLASS (261101-mvt).</precondition>
  <read_first>
    - components/character/notes/note-form.tsx and edit-note-dialog.tsx (whole files)
    - components/character/notes/note-card.tsx as left by Task 1 (the AlertDialog inside the expanded body)
    - .planning/design/ferro-brasa/Ficha.dc.html, lines 636-650 (the mock's delete alert dialog)
    - components/ui/inline-field-state.tsx (exports only)
    - lib/notes-format.test.ts (style: describe/test with single quotes)
    - components/character/notes-tab.render.test.ts as left by Task 2
  </read_first>
  <action>
    Step 1, components/character/notes/note-form.tsx: same props, same callbacks, same submit and cancel behavior. Validation stays in NotesTab.
    - Give the Título and Conteúdo labels htmlFor/id pairs from useId, styled with INLINE_FIELD_LABEL_CLASS.
    - Title Input: h-11 text-base.
    - Keep every formatting tip (bold, italic, code, heading, list, paragraph) but move the tips into a details element. Its summary is a 44px row with an Info icon and "Dicas de formatação" (no emoji). The tip grid sits inside, with the current content (DD-11).
    - Textarea: font-mono, text-base, rows 8, resize-y.
    - Buttons: a 2-column grid with gap-2 and pt-2. Cancelar is outline, h-12, font-semibold, and comes first like the mock dialog. Submit is primary, h-12, font-semibold, shows submitLabel, and while isSaving shows a LoaderCircle with animate-ficha-spin plus "Salvando..." and is disabled.

    Step 2, components/character/notes/edit-note-dialog.tsx: change only the classes.
    - DialogContent: w-[95vw] max-w-2xl max-h-[90dvh] overflow-y-auto, so content scrolls on phones instead of being clipped.
    - DialogTitle: font-serif text-[22px] font-semibold.
    - Same props and wiring.

    Step 2b, components/character/notes/note-card.tsx: restyle only the delete AlertDialog, per DD-06. Its trigger, onDelete(note.id) wiring, and the rest of the card do not change.
    - AlertDialogContent: w-[95vw] max-w-[400px].
    - AlertDialogTitle: font-serif text-[22px] font-semibold, reading Excluir “{note.title}”? (the title renders as a React text child).
    - AlertDialogDescription: text-[15px], "A anotação será apagada. Essa ação não pode ser desfeita."
    - Footer: a 2-column grid with gap-2 and pt-1.5.
      - AlertDialogCancel: h-12 font-semibold, "Cancelar".
      - AlertDialogAction: className cn(buttonVariants({ variant: "destructive" }), "h-12 font-bold"), "Excluir". Use the variant, not hard-coded palette colors.
    - Keep the file's single formatNoteHtml sink line untouched.

    Step 3, tests (APPEND only; zero deleted lines in either file).
    (a) lib/notes-format.test.ts: a describe block 'getNotePreview' with these cases:
      - '**Negrito** e texto\nsegunda' gives 'Negrito e texto'
      - '\n  \n# Título\ncorpo' gives 'Título'
      - '### Sub' gives 'Sub'
      - '- item um\n- item dois' gives 'item um'
      - 'Use `código` e *itálico*' gives 'Use código e itálico'
      - 'linha\r\nsegunda' gives 'linha'
      - '' and '  \n ' give ''
      - '<img src=x onerror=alert(1)>' gives the same string unchanged, because escaping is React's job (document this in the test name)
    (b) components/character/notes-tab.render.test.ts: a describe block 'NotesTab lista redesenhada (DS-07)'. Reuse the render helper and use two valid notes built with the existing note shape. Cases:
      - Edit mode, 2 notes: both titles render. The html contains 'Ordenar', 'aria-label="Nova Anotação"' and 'Buscar em títulos e textos'. aria-expanded="false" appears exactly twice. The first note's content '**Negrito** e texto\nsegunda linha' renders the preview 'Negrito e texto', and the html contains neither '<strong' nor 'segunda linha' (collapsed body not rendered). mutateAsync is called 0 times.
      - Edit mode, 1 note: no 'Ordenar'.
      - Locked, 2 notes: titles and the search render. There is no 'Ordenar', no 'Nova Anotação' and no 'disabled=""' anywhere in the html (DD-16: edit controls are hidden, not disabled).
      - XSS: a note with title '<script>alert(1)</script>' and content '<img src=x onerror=alert(1)>'. The html contains '&lt;script&gt;alert(1)&lt;/script&gt;' and '&lt;img src=x onerror=alert(1)&gt;', and contains neither '<script>alert(1)' nor '<img'.

    Step 4, whole-batch gate (this item runs last). From the repo root run npx tsc --noEmit, bun run lint, bun test and bun run build.
    - lint must report "(0 errors, 1 warning)", and the one warning is the pre-existing 'routes' one in app/api/[[...route]]/route.ts.
    - If a failure is in this item's files, fix it.
    - If it is in a sibling item's file, apply the smallest fix that only touches types, lint or build, never a feature, formula or persisted behavior. Commit it separately as fix(261101-mvz): batch gate — <what>, and list it in the SUMMARY under "Batch-gate fixes".
    - If a fix would need a behavior decision, stop and report it instead of guessing.
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && B=$(cat "$(git rev-parse --git-path gsd-261101-mvz-base)") && grep -q "describe('getNotePreview" lib/notes-format.test.ts && grep -q "NotesTab lista redesenhada (DS-07)" components/character/notes-tab.render.test.ts && grep -q 'INLINE_FIELD_LABEL_CLASS' components/character/notes/note-form.tsx && grep -q 'htmlFor' components/character/notes/note-form.tsx && grep -q '\*\*negrito\*\*' components/character/notes/note-form.tsx && grep -q '<details' components/character/notes/note-form.tsx && grep -q 'font-serif' components/character/notes/edit-note-dialog.tsx && grep -q 'overflow-y-auto' components/character/notes/edit-note-dialog.tsx && grep -q 'max-w-\[400px\]' components/character/notes/note-card.tsx && grep -q 'variant: "destructive"' components/character/notes/note-card.tsx && N=$(git diff --numstat "$B" -- components/character/notes-tab.render.test.ts lib/notes-format.test.ts) && [ "$(printf '%s\n' "$N" | awk '{s+=$2} END{print s+0}')" -eq 0 ] && git diff --quiet e2740820e63cb3a88e91ba8987455d22be22905f -- lib/notes.ts && M=$(git diff --numstat e2740820e63cb3a88e91ba8987455d22be22905f -- lib/notes-format.ts) && [ "$(printf '%s\n' "$M" | awk '{s+=$2} END{print s+0}')" -eq 0 ] && [ "$(grep -ro 'dangerouslySetInnerHTML' components/character/notes-tab.tsx components/character/notes/ | wc -l)" -eq 1 ] && git diff --quiet "$B" -- package.json bun.lock && npx tsc --noEmit && bun run lint 2>&1 | grep -q '(0 errors, 1 warning)' && bun test && bun run build && echo BATCH-GATE-OK</automated>
    <human-check>
      End-of-phase walkthrough with `bun dev`, at a 390px phone width and on desktop, in dark and light themes:
      1. Open a character with 3 or more notes on the Notas tab.
         - The header shows the diamond, the serif "Anotações" and the count.
         - Cards are collapsed with a serif title and a one-line preview.
         - Tapping one expands it: bold, italic, code, headings and lists render, dates show, and Editar and Excluir are 44px.
         - Tapping another collapses the first.
      2. Type in the search: the count reads "N de M". A term with no match shows "Nenhuma anotação com “…”." and "Limpar busca".
      3. Tap Ordenar.
         - The search disappears, the hint shows, and each row has a grip and 44px arrows.
         - The first up and the last down are disabled.
         - Move a note, tap Concluir and reload: the new order persisted. Rapid moves show a single updating toast.
      4. Lock the sheet: Ordenar, the + button, Editar and Excluir disappear. Search and expand still work.
      5. Add a note with empty fields: the validation toast appears. Then add and edit real notes. Labels, 44px inputs, the collapsible tips and the 48px buttons work. On a phone the dialog scrolls.
      6. Create a note whose title is <script>alert(1)</script> and whose content is <img src=x onerror=alert(1)>: no alert fires, and the literal text shows in the preview and the expanded body.
      7. Corrupted value:
         - Run curl -X PUT http://localhost:3000/api/characters/ID -H 'content-type: application/json' -d '{"notes":"[{\"id\":"}', then refresh the sheet.
         - The destructive alert appears with the raw text below it.
         - "Copiar texto original" puts exactly [{"id": on the clipboard and shows a success toast.
         - Opening the app over plain http on a LAN IP shows the "unavailable" toast.
      8. Legacy value:
         - Lock the sheet, PUT {"notes":"Texto antigo"} the same way, and refresh the data.
         - The warning alert (history icon, "Anotações em formato antigo") shows "Desbloqueie a ficha para converter as anotações para o novo formato.", with no button and the text below.
         - Unlock: the migration runs once by itself. The alert briefly shows "Convertendo…" with a spinner, then one note "Anotações Antigas" appears.
         - Failure path: lock again, PUT the legacy text, set DevTools Network to Offline, then unlock. The alert shows "Não foi possível converter as anotações. Recarregue a página para tentar de novo." Go back online and switch tabs: no second write appears in the Network tab, and the alert shows the waiting message. Reload: the conversion succeeds.
    </human-check>
  </verify>
  <done>
    - Add and edit forms are restyled with every current capability, including the formatting tips. The delete confirmation follows the mock's alert-dialog look.
    - getNotePreview and the collapsed-card, header-control and escaping behaviors are locked by tests. Existing assertions are untouched.
    - lib/notes.ts is unchanged and lib/notes-format.ts has only additions since the batch base.
    - The whole-batch gate passes: tsc, lint (0 errors, 1 warning), bun test and bun run build. BATCH-GATE-OK is printed.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| stored notes (any player can write) → browser DOM | Note titles and content are untrusted user input and are shown to every player who opens the sheet |
| notes UI → PUT /api/characters/:id | Every notes write goes through the single useUpdateCharacter mutation (expectedUpdatedAt, 409 handling, per-character serial queue) |
| app → system clipboard | "Copiar texto original" writes the character's raw notes string to the user's clipboard |

## STRIDE Threat Register

ASVS level 1; block on: high. Threat IDs are new for this item; the mvt plan uses T-mvt-*.

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-mvz-01 | Tampering (stored XSS) | Expanded note body in note-card.tsx | high | mitigate | The body reaches the DOM only through renderFormattedText → formatNoteHtml (escape first, fixed tag set), and that code is unchanged. Gates: exactly one dangerouslySetInnerHTML in the notes components, on the formatNoteHtml line; zero deleted lines in lib/notes-format.ts since the batch base; the existing formatNoteHtml XSS unit tests keep passing |
| T-mvz-02 | Tampering (stored XSS) | Collapsed title and getNotePreview output | high | mitigate | getNotePreview returns plain text and is rendered only as a React text child, which React escapes. Task 3's render test puts script/img payloads in the title and content and asserts escaped output with no raw tags |
| T-mvz-03 | Tampering (stored XSS) | Corrupted raw value and legacy text in PreservedNotesText | high | mitigate | Rendered as a React text child inside a pre element, never as HTML. Existing test F asserts the escaped &lt;img…&gt; output and no raw img tag |
| T-mvz-04 | Tampering (data loss) | Writes while notes are legacy or corrupted | high | mitigate | canWriteNotes/guardWrite are unchanged. Create/reorder/edit/delete controls render only when canWrite. Copy is read-only. lib/notes.ts is unchanged (gated against the item base and the batch base). Render tests F/G plus the Task 2 cases assert there are no create controls and no writes |
| T-mvz-05 | Tampering (duplicate migration write) | Legacy migration effect and the legacy status alert | medium | mitigate | The automatic effect is the only write path and claims before writing. Task 2 gates: the effect block is byte-identical to the item base, and the file has exactly one claimLegacyMigration( call. The status alert has no button and derives its state during render from the mutation, with no new state or effect. Render tests assert no write happens during render in the locked, waiting, converting and failed states |
| T-mvz-06 | Information disclosure | Clipboard copy of raw notes | low | accept | Runs only on an explicit click and copies only the current character's notes, which the user can already see on screen, to that user's own clipboard. The helper never logs (gated), and the raw text is never put in a toast or a log |
| T-mvz-07 | Information disclosure | Console output | low | mitigate | No log/info/debug console calls in the notes components (gated). console.error receives error objects only, never note content. Render test D still passes |
| T-mvz-08 | Tampering (lost reorder) | Rapid up/down taps | low | mitigate | Arrow buttons are disabled while the mutation is pending, so each move is computed from the saved list. The save core serializes writes and returns 409 on a stale token |
| T-mvz-SC | Tampering | npm/bun package installs | low | accept | No packages are installed. The Task 3 gate fails if package.json or bun.lock changed since the item base, so there is no package-legitimacy surface |
</threat_model>

<verification>
Run from the repo root after Task 3:
- `npx tsc --noEmit` exits 0
- `bun run lint` prints "(0 errors, 1 warning)", and the warning is the pre-existing routes one
- `bun test` exits 0: the 183 baseline tests, plus the sibling items' tests, plus the clipboard, getNotePreview and appended render tests from this item
- `bun run build` exits 0
- `git diff e2740820e63cb3a88e91ba8987455d22be22905f -- lib/notes.ts` is empty, and lib/notes-format.ts shows only added lines since that batch base
- `grep -rn dangerouslySetInnerHTML components/character/notes-tab.tsx components/character/notes/` returns exactly one line, and it feeds formatNoteHtml
- Human walkthrough (end-of-phase mode): Task 3's `<human-check>`
</verification>

<success_criteria>
- The Anotações tab matches the design: header with count and controls, search, collapsed and expandable cards, reorder mode, corrupted and legacy alerts
- Every current notes capability is kept: create, edit, delete with confirmation, per-move reorder saves, search, dates, the full markdown-like renderer, the empty state and the dev-only clear
- Notes safety is intact: one raw-HTML sink fed by formatNoteHtml, no writes on legacy or corrupted values, migration at most once per session, rendering never writes
- The whole batch 261101-mvs passes tsc, lint (0 errors, 1 warning), bun test and bun run build
</success_criteria>

<output>
Create `.planning/quick/261101-mvz-redesign-anota-es-tab-ds-07-restyle-components-character-not/261101-mvz-SUMMARY.md` when done. Include:
- DD-01..DD-16 as applied. For DD-16 state that the notes tab had no controls rendered disabled while locked, so no "disabled → hidden when locked" change was needed. Also record any further doubtful design-vs-behavior case met, decided by the README "Important" rule (current behavior wins)
- whether the shell from 261101-mvv used a multi-column container, and how the notes layout rendered with it (DD-15)
- "Batch-gate fixes": every fix made in a sibling item's file during Task 3, with file and reason, or "none"
- the final bun test count and the lint summary line
</output>
