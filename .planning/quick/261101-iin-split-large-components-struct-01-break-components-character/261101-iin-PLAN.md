---
phase: quick-261101-iin
plan: 01
type: execute
wave: 2                     # ADVISORY ONLY: authoritative wave is recomputed by `quick-batch update` from depends_on
depends_on:
  - 261101-iie   # removes the EditableField store fallback / store API the extracted cards consume
  - 261101-iif   # rewrites basic-info-tab formulas to lib/calculations imports
  - 261101-iig   # adds the calc test suite + "test" script (part of the final bun test gate)
  - 261101-iih   # tightens the update payload types the tab mutations send (spells/talents/languages)
  - 261101-iii   # changes useUpdateCharacter (updatedAt / 409 handling) that every tab passes down
  - 261101-iij   # moves notes-tab render-time setState/migration into effects, drops console.log
  - 261101-iik   # moves notes parse/migrate/serialize into a shared lib util with once-only guard
  - 261101-iil   # HTML-escapes the note-body formatter + adds its unit test
  - 261101-iim   # ESLint flat config (bun run lint gate) and lint fixes inside all three tab files
# Scope exception (coordinator-accepted, do not split): 17 files because this is a pure verbatim
# move-refactor of three tabs into per-tab subfolders, plus 1 conditional file (use-notes-actions.ts,
# created only if the Task 3 size fallback fires).
files_modified:
  - components/character/types.ts
  - components/character/spells-talents-tab.tsx
  - components/character/spells-talents/spells-card.tsx
  - components/character/spells-talents/talents-card.tsx
  - components/character/basic-info-tab.tsx
  - components/character/basic-info/profile-cards.tsx
  - components/character/basic-info/attribute-cards.tsx
  - components/character/basic-info/vitality-card.tsx
  - components/character/basic-info/berkana-card.tsx
  - components/character/basic-info/equipment-cards.tsx
  - components/character/basic-info/languages-card.tsx
  - components/character/notes-tab.tsx
  - components/character/notes/note-form.tsx
  - components/character/notes/notes-header.tsx
  - components/character/notes/edit-note-dialog.tsx
  - components/character/notes/notes-list.tsx
  - components/character/notes/note-card.tsx
  - components/character/notes/use-notes-actions.ts   # conditional: only if the Task 3 size fallback fires
autonomous: true
requirements: [STRUCT-01]

must_haves:
  truths:
    - "basic-info-tab.tsx, notes-tab.tsx and spells-talents-tab.tsx are each under 400 lines, and every new file under components/character/basic-info/, notes/ and spells-talents/ is under 400 lines"
    - "BasicInfoTab, NotesTab and SpellsTalentsTab keep their file paths, export names and props, so this item changes neither components/character/index.ts nor components/forms/character-layout.tsx (diffed against this item's own starting commit, recorded at the start of Task 1, so sibling edits made before this item are not counted)"
    - "Each tab still calls the update-mutation hook exactly once and hands that one mutation to its sections, so a pending save in one section still disables the other sections' action buttons exactly as before"
    - "The sheet renders the same cards, fields, labels, pt-BR texts and data-section anchors (vitality, berkana, weapons), and every inline edit, damage/heal, Berkana quick edit, language toggle, spell/talent add/remove/expand/use/reset and note add/edit/delete/reorder/search behaves as before the split"
    - "Note bodies are still rendered only through formatNoteHtml from lib/notes-format.ts (261101-iil; script / img-onerror payloads stay literal text), and the legacy-migration effect with its claimLegacyMigration once-guard and the corrupted-data protection from 261101-iij/iik (lib/notes.ts) still live in NotesTab"
    - "npx tsc --noEmit, bun run lint, bun test and bun run build all exit 0"
  artifacts:
    - path: "components/character/types.ts"
      provides: "UpdateCharacterMutation type alias (return type of the tabs' update hook) shared by all extracted cards"
      contains: "UpdateCharacterMutation"
    - path: "components/character/spells-talents/spells-card.tsx"
      provides: "SpellsCard — 'Magias e Habilidades' card with add/remove/expand spell list"
      exports: ["SpellsCard"]
    - path: "components/character/spells-talents/talents-card.tsx"
      provides: "TalentsCard — 'Talentos' card with add/remove/expand, once-per-day use and 'Novo Dia' reset"
      exports: ["TalentsCard"]
    - path: "components/character/basic-info/profile-cards.tsx"
      provides: "Basic details and experience/level cards"
      exports: ["BasicDetailsCard", "ExperienceCard"]
    - path: "components/character/basic-info/attribute-cards.tsx"
      provides: "Attribute summary and attribute distribution cards"
      exports: ["AttributesSummaryCard", "AttributesDistributionCard"]
    - path: "components/character/basic-info/vitality-card.tsx"
      provides: "Vitality card with damage/heal system (data-section vitality)"
      exports: ["VitalityCard"]
      contains: "data-section=\"vitality\""
    - path: "components/character/basic-info/berkana-card.tsx"
      provides: "Berkana card with quick edits (data-section berkana)"
      exports: ["BerkanaCard"]
      contains: "data-section=\"berkana\""
    - path: "components/character/basic-info/equipment-cards.tsx"
      provides: "Weapons (data-section weapons) and armor cards"
      exports: ["WeaponsCard", "ArmorCard"]
      contains: "data-section=\"weapons\""
    - path: "components/character/basic-info/languages-card.tsx"
      provides: "Standard and custom languages card"
      exports: ["LanguagesCard"]
    - path: "components/character/notes/note-form.tsx"
      provides: "Shared add/edit note form body"
      exports: ["NoteForm"]
    - path: "components/character/notes/notes-header.tsx"
      provides: "Notes heading, add-note dialog, corrupted-data control"
      exports: ["NotesHeader"]
    - path: "components/character/notes/edit-note-dialog.tsx"
      provides: "Controlled edit-note dialog"
      exports: ["EditNoteDialog"]
    - path: "components/character/notes/notes-list.tsx"
      provides: "Empty/no-results states, search bar, counter and note grid"
      exports: ["NotesList"]
    - path: "components/character/notes/note-card.tsx"
      provides: "Single note card with reorder/edit/delete controls and escaped formatted body"
      exports: ["NoteCard"]
  key_links:
    - from: "components/character/spells-talents-tab.tsx"
      to: "components/character/spells-talents/spells-card.tsx"
      via: "renders SpellsCard and TalentsCard, passing the tab's single update mutation"
      pattern: "updateCharacterMutation=\\{updateCharacterMutation\\}"
    - from: "components/character/basic-info-tab.tsx"
      to: "components/character/basic-info/vitality-card.tsx"
      via: "renders VitalityCard / BerkanaCard / LanguagesCard with the tab's single update mutation"
      pattern: "<VitalityCard"
    - from: "components/forms/character-layout.tsx"
      to: "components/character/basic-info/vitality-card.tsx"
      via: "scroll-to-section querySelector on data-section anchors that now live in the extracted cards"
      pattern: "data-section=\"(vitality|berkana|weapons)\""
    - from: "components/character/notes-tab.tsx"
      to: "components/character/notes/notes-list.tsx"
      via: "parent owns state/effects/handlers and passes notes + callbacks + isSaving to presentational children"
      pattern: "<NotesList"
    - from: "components/character/notes/note-card.tsx"
      to: "lib/notes-format.ts (created by 261101-iil)"
      via: "note body raw-HTML render fed only by formatNoteHtml, imported from @/lib/notes-format"
      pattern: "__html: formatNoteHtml\\("
---

<objective>
Split the three oversized character-sheet tabs (STRUCT-01) into small, single-responsibility subcomponents in per-tab subfolders, so that `basic-info-tab.tsx`, `notes-tab.tsx` and `spells-talents-tab.tsx` (and every new file) stay under 400 lines while the sheet looks and behaves identically and the tab props/exports are unchanged.

Purpose: these files are the hardest part of the codebase to review. This item runs last in the batch so it splits the already-fixed code (formula unification, concurrency, hook/render fixes, notes util, XSS escape, lint fixes). As the batch's final item, it also runs the milestone definition-of-done gate: `npx tsc --noEmit`, `bun run lint`, `bun test`, `bun run build`.

Output: 3 slimmed tab files, 13 new subcomponent files (2 in spells-talents/, 6 in basic-info/, 5 in notes/), and one `UpdateCharacterMutation` type alias in `components/character/types.ts`. Only if the Task 3 size fallback fires is there one more file, `components/character/notes/use-notes-actions.ts`.

Scope note: 17 files_modified is a coordinator-accepted exception for a pure verbatim move-refactor. Do not split this item into several plans.

Not in scope: no behavior, styling, text or data-shape changes; no Prisma schema edits (schema gate not triggered); no new dependencies; `skills-kit-tab.tsx` and `editable-field.tsx` are not split by this item.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.claude/CLAUDE.md
@.planning/codebase/CONVENTIONS.md
@.planning/codebase/STRUCTURE.md
@components/character/types.ts
@components/character/index.ts
@components/forms/character-layout.tsx

# Re-read these at execution time. Sibling items rewrote or created them, so this plan
# describes sections by responsibility and visible pt-BR title, not by line number.
@components/character/spells-talents-tab.tsx
@components/character/basic-info-tab.tsx
@components/character/notes-tab.tsx
@lib/api/queries.ts
@lib/notes.ts
@lib/notes-format.ts

<interfaces>
Current tab contract (must stay identical; it may have been narrowed by 261101-iim/iih, so use whatever is in the file at execution time):
- components/character/types.ts exports `CharacterTabProps { character; characterId: string; isEditMode: boolean; isSkillsModalOpen?; setIsSkillsModalOpen?; isAttributesModalOpen?; setIsAttributesModalOpen? }`
- `BasicInfoTab({ character, characterId, isEditMode, isAttributesModalOpen = false, setIsAttributesModalOpen })`
- `SpellsTalentsTab({ character, characterId, isEditMode })`
- `NotesTab({ character, characterId, isEditMode })` (file starts with the client directive, uses double quotes + semicolons)
- components/character/index.ts re-exports the three tabs; components/forms/character-layout.tsx renders them and scrolls to `[data-section="${section}"]`.

Shared-mutation fact (load-bearing for "identical behavior"): each tab calls `useUpdateCharacter` once. Many buttons in different sections are disabled by that one instance's `isPending`: damage/heal/Berkana quick-edit/language checkboxes in basic info; add/remove/use/reset/add-talent in spells-talents; save/reorder buttons in notes. Inline `EditableField`s each own their own mutation internally, and that stays as it is.
</interfaces>
</context>

<coverage_audit>
| Source | Item | Covered by |
|--------|------|------------|
| GOAL (catalog row 261101-iin) | Split basic-info-tab.tsx into subcomponents, < ~400 lines each | Task 2 |
| GOAL | Split notes-tab.tsx into subcomponents, < ~400 lines each | Task 3 |
| GOAL | Split spells-talents-tab.tsx into subcomponents, < ~400 lines each | Task 1 |
| GOAL | Identical behavior and props | Move rules (Task 1, applied to all tasks); invariant gates on index.ts/character-layout.tsx; single-mutation gates; human-check in Task 3 |
| GOAL | Runs after the notes/XSS/hook fixes and splits the fixed code | depends_on (iij, iik, iil, plus iie/iif/iih/iii/iim that also touch these files or their APIs); Task 3 keeps iik/iij logic in the parent and iil's formatter unchanged |
| GOAL | Final gate: tsc, lint, test, build | Task 3 verify + `<verification>` |
| REQ STRUCT-01 | No file over ~400 lines, smaller subcomponents, identical behavior | Tasks 1-3 line-count gates |
| ROADMAP Phase 4 SC5 | Same as STRUCT-01 plus full gate green | Task 3 |
| CONTEXT / project decisions | No auth added; Prisma column types unchanged; Bun only | Nothing in this plan touches auth, prisma/schema.prisma or package manifests |
</coverage_audit>

<tasks>

<task type="tracer">
  <name>Task 1 (tracer): shared mutation prop type + split SpellsTalentsTab into SpellsCard and TalentsCard</name>
  <files>components/character/types.ts, components/character/spells-talents-tab.tsx, components/character/spells-talents/spells-card.tsx, components/character/spells-talents/talents-card.tsx</files>
  <precondition>Every quick id in depends_on is merged into this worktree's base (git log --oneline shows their commits) and the package.json "lint" script runs eslint (261101-iim).</precondition>
  <read_first>components/character/spells-talents-tab.tsx, components/character/types.ts, lib/api/queries.ts (the update hook as left by 261101-iii), components/forms/character-layout.tsx, eslint.config.mjs</read_first>
  <action>
Re-read components/character/spells-talents-tab.tsx in its current state. Siblings edited it, so ignore line numbers seen during planning. This task sets the split pattern that Tasks 2 and 3 reuse, on the smallest tab, and proves it end to end with tsc, lint and build.

Step 0 (before any file edit or commit of this item): record this item's starting commit so the invariant gates measure only this item's changes. Run `git rev-parse HEAD > "$(git rev-parse --git-path gsd-261101-iin-base)"`. This writes into the per-worktree git dir, which is untracked and never committed. Do not compare against the batch base 832fa9b: earlier siblings may legitimately touch components/character/index.ts or components/forms/character-layout.tsx. Every verify in this plan reads this file back. If the file is missing, the gate fails. That is intended. Never recreate the file after this item has committed anything.

Step 1: in components/character/types.ts, add an exported type alias `UpdateCharacterMutation` equal to the return type of the update hook the tabs call. Use a type-only import of `useUpdateCharacter` from @/lib/api/queries and alias it through ReturnType of typeof. If 261101-iii renamed or wrapped the hook, alias the hook the tab files actually call. Leave `CharacterTabProps` untouched.

Step 2: create components/character/spells-talents/spells-card.tsx exporting `SpellsCard`. It takes over the whole 'Magias e Habilidades' Card:
- the header and its add-spell button, with the new-spell default object moved verbatim (including the damage/duration {base, perLevel} shapes)
- the ScrollArea list of Collapsible spell items: the compact header with level/cost summary and remove button, and the expanded content with every Editable* field, including the two EditableScalingField usages that receive the character level
- the empty state
- the expanded-spells Set state and its toggle function

Create components/character/spells-talents/talents-card.tsx exporting `TalentsCard`. It takes over the 'Talentos' Card:
- the 'Novo Dia' reset button, shown only when a once-per-day talent was used
- the add-talent button, with its default object verbatim
- the expandable talent list with the once-per-day checkbox
- the expanded-talents state and its toggle, the toggle-used handler, the reset-all handler and the has-used-talents flag

Props: `SpellsCardProps` / `TalentsCardProps` = `Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'>` plus `updateCharacterMutation: UpdateCharacterMutation`. Each card destructures spells or talents from `character` with the same default (`[]`) the parent uses today.

Step 3: reduce `SpellsTalentsTab` to:
- the same export name, props interface and parameter destructuring
- exactly one call of the update hook (the only call in this tab and its subfolder)
- the same outer wrapper div and grid div with identical classNames
- `SpellsCard` then `TalentsCard`, both receiving that one mutation object as `updateCharacterMutation={updateCharacterMutation}`

Why one shared instance: today a pending save in either card disables the other card's buttons through the single pending flag. A separate hook call per card would silently change that.

MOVE RULES (Tasks 2 and 3 apply these too):
(a) Move JSX and handlers verbatim: same element tree, classNames, keys, ids, titles, placeholders, pt-BR strings, toast and console.error messages, and disabled conditions.
(b) Never add or drop a prop on a moved element.
(c) An extracted card returns its Card element directly, with no new wrapper element, so grid layout is unchanged. Grid and row wrapper divs stay in the parent.
(d) Component-local UI state may move into the card that uses it only because the parent always renders that card, so its lifetime is unchanged.
(e) The only permitted restructuring is turning an inline IIFE block into plain statements at the top of the extracted component. Do not otherwise reorder, memoize, dedupe or "fix" logic.
(f) Carry eslint-disable comments along with the code they cover, keeping only those still needed in the new file.
(g) Match the parent file's quote/semicolon style and client-directive convention. Start new files with the same path header comment style the tabs use.
(h) Use @/ aliases for ui and lib imports. The parent imports its subcomponents relatively (for example ./spells-talents/spells-card). Do not add an index.ts barrel in the subfolder.
(i) Do not edit components/character/index.ts or components/forms/character-layout.tsx. Subcomponents are internal and are not re-exported.
(j) Add no new explicit any in new prop types (use the CharacterTabProps Pick). Moved code keeps whatever typing it has now.
(k) Remove imports from the parent only when the move leaves them unused.
  </action>
  <verify>
    <automated>test -d components/character/spells-talents && [ "$(grep -c 'useUpdateCharacter(' components/character/spells-talents-tab.tsx)" -eq 1 ] && ! grep -rn 'useUpdateCharacter(' components/character/spells-talents && grep -q 'UpdateCharacterMutation' components/character/types.ts && grep -q 'updateCharacterMutation={updateCharacterMutation}' components/character/spells-talents-tab.tsx && wc -l components/character/spells-talents-tab.tsx components/character/spells-talents/*.tsx | awk '$2 != "total" && $1 >= 400 {bad=1; print "too long:", $2} END {exit bad}' && BASE=$(cat "$(git rev-parse --git-path gsd-261101-iin-base)") && git cat-file -e "$BASE^{commit}" && git diff --quiet "$BASE" -- components/character/index.ts components/forms/character-layout.tsx && npx tsc --noEmit && bun run lint && bun run build</automated>
  </verify>
  <done>spells-talents-tab.tsx is under 400 lines and renders SpellsCard and TalentsCard from components/character/spells-talents/. Both cards receive the tab's single update mutation, and neither subfolder file calls the hook itself. `UpdateCharacterMutation` is exported from types.ts. This item's starting commit is recorded in the git dir, and index.ts and character-layout.tsx do not differ from it. tsc, lint (unconditional; the precondition guarantees 261101-iim's eslint script) and build exit 0. Baseline at planning time: spells-talents-tab.tsx was 545 lines and the subfolder did not exist, so this gate failed before the change.</done>
</task>

<task type="auto">
  <name>Task 2: split BasicInfoTab into section cards under components/character/basic-info/</name>
  <files>components/character/basic-info-tab.tsx, components/character/basic-info/profile-cards.tsx, components/character/basic-info/attribute-cards.tsx, components/character/basic-info/vitality-card.tsx, components/character/basic-info/berkana-card.tsx, components/character/basic-info/equipment-cards.tsx, components/character/basic-info/languages-card.tsx</files>
  <read_first>components/character/basic-info-tab.tsx (current state), components/character/types.ts, components/ui/editable-field.tsx (props as left by 261101-iie), the lib/calculations exports the tab now imports (261101-iif), components/forms/character-layout.tsx (data-section scroll targets)</read_first>
  <action>
Re-read components/character/basic-info-tab.tsx in its current state. 261101-iif replaced its inline formulas with lib/calculations imports. 261101-iie, 261101-iii and 261101-iim may have changed EditableField props, save/error handling and lint suppressions. Apply the Task 1 MOVE RULES. Extract by responsibility, using the visible pt-BR card titles to locate each section:

- basic-info/profile-cards.tsx:
  - `BasicDetailsCard`: the 'Informações Básicas' card with the twelve basic-section EditableFields.
  - `ExperienceCard`: the 'Experiência e Nível' card with the level and current-XP number fields and the XP-to-next-level display. It uses whichever calculation function the parent imports now.
- basic-info/attribute-cards.tsx:
  - `AttributesSummaryCard`: the 'Atributos - Resumo' card with the per-attribute total rows and the expand button that opens the attributes modal. Pass the tab's `setIsAttributesModalOpen` prop through unchanged.
  - `AttributesDistributionCard`: the 'Distribuição de Atributos' card. It owns the attributes-expanded boolean state and the chevron toggle, plus the race/class/bonus number fields per attribute and the level-bonus note.
- basic-info/vitality-card.tsx: `VitalityCard`, the 'Vitalidade' Card carrying the vitality data-section anchor. It includes:
  - the race/class base fields
  - the current/total vitality sums
  - the 'Sistema de Dano/Cura' panel with its damage-input string state and the apply-damage and restore-full-health handlers, moved verbatim with their toasts
  - the per-stage current-vitality fields with their '/ max' labels
- basic-info/berkana-card.tsx: `BerkanaCard`, the 'Berkana' Card carrying the berkana data-section anchor. It includes the computed max with its existing fallback, the fill/-30/-50 quick-edit handler and buttons, and the current/max/bonus fields.
- basic-info/equipment-cards.tsx:
  - `WeaponsCard`: the 'Armas (Máximo 3)' Card carrying the weapons data-section anchor. It has three weapon slots with name, level, five damage fields and description.
  - `ArmorCard`: the 'Armadura' card.
- basic-info/languages-card.tsx: `LanguagesCard`, the 'Linguagens' card with standard-language checkboxes, the add-custom-language button and custom-language rows (checkbox plus name field).

Props:
- VitalityCard, BerkanaCard and LanguagesCard receive `updateCharacterMutation: UpdateCharacterMutation` from the parent. The other cards neither use nor receive it.
- Every card's props are `Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'>` plus the extras named above.
- Each card destructures the fields it reads from `character` with exactly the defaults the parent destructuring uses today. Examples: the maxBerkana/currentBerkana/berkanaBonus numeric defaults, and the empty-object defaults for attributes, vitality, currentVitality, weapons, armor and languages. Copy them; do not re-derive them.
- Elements that today receive no edit-mode prop (the weapon, armor and custom-language fields) stay without one.

Reduce `BasicInfoTab` to:
- the unchanged export name, props interface and destructured signature, including the attributes-modal props and their defaults
- exactly one call of the update hook, shared by the three mutating cards. Same reason as Task 1: damage, heal, Berkana quick-edit and the language checkboxes currently disable each other through one pending flag.
- the same outer div and the same row grid divs with identical classNames, in the same order:
  - row 1: BasicDetailsCard + ExperienceCard
  - row 2: AttributesSummaryCard + AttributesDistributionCard
  - row 3: VitalityCard + BerkanaCard
  - row 4: WeaponsCard + ArmorCard
  - then LanguagesCard outside any grid, as today

The three data-section anchors must sit on the same Card elements as before, because components/forms/character-layout.tsx scrolls to them.

File count note: this task touches 7 files, above the usual 5-file heuristic. This is deliberate. Every new file is a verbatim move out of one source file, so the context cost is bounded by that source file's size. Splitting the tab across two tasks would make both rewrite the same parent.
  </action>
  <verify>
    <automated>test -d components/character/basic-info && [ "$(grep -c 'useUpdateCharacter(' components/character/basic-info-tab.tsx)" -eq 1 ] && ! grep -rn 'useUpdateCharacter(' components/character/basic-info && [ "$(grep -rhoE 'data-section="(vitality|berkana|weapons)"' components/character/basic-info | sort -u | wc -l)" -eq 3 ] && [ "$(grep -rhoE 'data-section="(vitality|berkana|weapons)"' components/character/basic-info-tab.tsx components/character/basic-info | wc -l)" -eq 3 ] && wc -l components/character/basic-info-tab.tsx components/character/basic-info/*.tsx | awk '$2 != "total" && $1 >= 400 {bad=1; print "too long:", $2} END {exit bad}' && BASE=$(cat "$(git rev-parse --git-path gsd-261101-iin-base)") && git cat-file -e "$BASE^{commit}" && git diff --quiet "$BASE" -- components/character/index.ts components/forms/character-layout.tsx && npx tsc --noEmit && bun run lint</automated>
  </verify>
  <done>basic-info-tab.tsx is under 400 lines (1057 at planning baseline) and composes the nine cards from components/character/basic-info/ in the original row order with the original grid wrappers. Each of the vitality/berkana/weapons anchors appears exactly once, inside the subfolder. Only the parent calls the update hook, and VitalityCard, BerkanaCard and LanguagesCard share its instance. Every subfolder file is under 400 lines. index.ts and character-layout.tsx do not differ from this item's recorded starting commit. tsc and lint exit 0.</done>
</task>

<task type="auto">
  <name>Task 3: split NotesTab into presentational subcomponents under components/character/notes/ and run the full definition-of-done gate</name>
  <files>components/character/notes-tab.tsx, components/character/notes/note-form.tsx, components/character/notes/notes-header.tsx, components/character/notes/edit-note-dialog.tsx, components/character/notes/notes-list.tsx, components/character/notes/note-card.tsx, components/character/notes/use-notes-actions.ts (conditional: size fallback only)</files>
  <precondition>lib/notes.ts and lib/notes.test.ts exist (261101-iik) and notes-tab.tsx imports from @/lib/notes. lib/notes-format.ts exports formatNoteHtml and escapeHtml, and lib/notes-format.test.ts exists (261101-iil). notes-tab.tsx feeds its note-body raw-HTML render from formatNoteHtml.</precondition>
  <read_first>components/character/notes-tab.tsx (current state), lib/notes.ts and lib/notes.test.ts (261101-iik), lib/notes-format.ts and lib/notes-format.test.ts (261101-iil), components/character/types.ts</read_first>
  <action>
Re-read components/character/notes-tab.tsx in its current state. Sibling changes to expect:
- 261101-iij moved the corrupted-data flag and legacy migration out of render and removed stray logging.
- 261101-iik created lib/notes.ts and moved parsing, legacy migration and serialization into it, with a once-only migration guard and a non-destructive corrupted-data state. Its planned exports are noteSchema, Note, ParsedNotes, parseNotes, serializeNotes, createNote, migrateLegacyNotes, claimLegacyMigration, canWriteNotes and moveNote.
- 261101-iil created lib/notes-format.ts, which exports formatNoteHtml (escapes, then formats) and escapeHtml. It kept a small renderFormattedText(text) wrapper in notes-tab.tsx that returns the formatted-content div whose raw-HTML prop is fed by formatNoteHtml.
- 261101-iii may have changed save and conflict handling.

Those names come from the sibling plans. Re-read lib/notes.ts and lib/notes-format.ts now and use what they actually export.

Apply the Task 1 MOVE RULES.

The split is presentational only. NotesTab keeps ALL of the following:
- all state: the add-dialog open flag, the note being edited, the title/content inputs, the search term, and every flag or ref the siblings added
- the parsed-notes derivation through parseNotes from lib/notes.ts
- the legacy-migration React effect and its claimLegacyMigration once-only guard
- the corrupted-data handling (canWriteNotes and whatever status flags iik left)
- the search filter
- every handler that writes or reorders notes: add, edit, delete, open/close edit, move up, move down, and clear/repair corrupted data (whichever exist now)

None of these move into the subfolder. Moving the migration effect or its guard into a child would bind it to that child's mount lifecycle, which could re-fire the legacy migration or bypass the corrupted-data protection. The size fallback below has exactly one exception: the note-writing handlers may move into a hook that NotesTab itself calls. That exception does not apply to the effect, the guard, state, the parse or the search filter.

Create these files in components/character/notes/. Each exported component gets a `<Name>Props` interface and receives data and callbacks via props. The parent passes the mutation's pending flag down as `isSaving: boolean`.

- note-form.tsx, `NoteForm`: the shared dialog body. It contains the 'Título' input, the 'Conteúdo' label, the formatting-tips panel, the monospace textarea, and the submit and cancel buttons with the 'Salvando...' pending label. The add and edit dialogs currently render identical bodies except for three things: the submit handler, the submit label ('Salvar Anotação' vs 'Salvar Alterações') and the cancel handler. Both dialogs therefore use NoteForm with those three as props, and the rendered DOM must stay identical.
- notes-header.tsx, `NotesHeader`: the 'Anotações' heading and subtitle; the edit-mode-only add-note Dialog (controlled by the parent's open flag, with its 'Nova Anotação' trigger button and NoteForm); and the corrupted-data control or notice exactly where it renders today, if it sits in the header area. If 261101-iik placed its corrupted-data notice somewhere else, leave it in that position in the parent.
- edit-note-dialog.tsx, `EditNoteDialog`: the controlled 'Editar Anotação' Dialog. It is open while a note is being edited, closing it calls the parent's close handler, and it renders NoteForm.
- notes-list.tsx, `NotesList`: the three-way branch.
  - No notes at all: the empty-state card, with the edit-mode-only 'Criar primeira anotação' button that opens the add dialog.
  - Search with no matches: the no-results card with 'Limpar busca'.
  - Otherwise: the search input, the 'X de Y anotação/anotações' badge and the grid.

  It computes per-note index, can-move-up, can-move-down and show-reorder-buttons exactly as today: reorder buttons appear only in edit mode with an empty search term.
- note-card.tsx, `NoteCard`: one note Card. It contains:
  - the title
  - the created/edited dates (move the pt-BR date formatter here as a module-level function)
  - the edit-mode controls: reorder buttons, edit button, and the delete AlertDialog with its confirmation text
  - the note body, rendered through the HTML-escaping formatter from 261101-iil with the same wrapper elements and classes

  Move the renderFormattedText wrapper verbatim from notes-tab.tsx into note-card.tsx, and import formatNoteHtml from @/lib/notes-format (double quotes, semicolon). NoteCard does not need escapeHtml. Do not edit, rename or relocate lib/notes-format.ts or lib/notes-format.test.ts. That test imports from ./notes-format, so it does not depend on notes-tab.tsx. Fallback only if the formatting chain is somehow still declared inside notes-tab.tsx: move it verbatim into note-card.tsx, and if a test imports it from notes-tab.tsx, re-export it from notes-tab.tsx under the same name so the test still resolves.

For the Note type, import `Note` from @/lib/notes (261101-iik). If it is still local to notes-tab.tsx, export it from note-card.tsx and import it from there.

`NotesTab` becomes: the unchanged export name, props and client directive; one update-hook call; the state, derivation, effect and handlers listed above; and a JSX tree of the same outer div containing NotesHeader, then NotesList, then EditNoteDialog.

Size estimate and fallback. The under-400-line gate is hard, so measure; do not assume. The planning estimate for notes-tab.tsx after this split is about 300–360 lines:
- At baseline 832fa9b, notes-tab.tsx is 794 lines. Lines 1–353 are imports, state, parsing and handlers. The JSX return is about 380 lines.
- 261101-iik moves about 100 lines of migration and parse code into lib/notes.ts, but adds a memoized parse, a migration effect and write guards.
- This split drops about 30 UI-only import lines and shrinks the JSX to about 40–60 lines.
- If iik's non-destructive notice stays in the parent, add roughly 20–40 lines.

After the presentational split, run `wc -l components/character/notes-tab.tsx`. If it is under 400, stop: do not create use-notes-actions.ts. If it is 400 or more, apply this fallback:
- Create components/character/notes/use-notes-actions.ts exporting `useNotesActions`, with a `UseNotesActionsParams` interface (no explicit any).
- Move into it, verbatim per the MOVE RULES, only the note-writing handlers that exist: add, edit, delete, move up, move down and clear/repair corrupted data. They keep their toasts, console.error messages, write guards and serializeNotes/moveNote calls exactly as they are.
- NotesTab calls `useNotesActions` exactly once, unconditionally, at the top level, after its state and parsed-notes derivation. It passes the tab's single update mutation object (typed `UpdateCharacterMutation`), characterId, the parsed notes and status values the handlers read, and the state values, setters and parent functions the handlers use (for example the close-edit handler). The hook returns the handlers.
- The hook calls the passed-in mutation object's async mutate method, exactly as the moved handlers do today, but calls no React hook itself: no update-hook call and no state, effect or ref hook. State stays declared in NotesTab. The legacy-migration effect, its claimLegacyMigration guard, the parse, the search filter and the open/close-edit UI handlers stay in NotesTab.
- Lifecycle is unchanged because the hook runs inside NotesTab's own render, not in a child component that could mount or unmount separately.

Either way, record in the SUMMARY the final `wc -l` of notes-tab.tsx and whether the fallback fired. If notes-tab.tsx is still 400 lines or more even with the fallback, do not weaken the gate. Stop and report the measured line counts as a blocker in the SUMMARY.

File count note: this task touches 6 files (7 if the fallback fires) for the same reason as Task 2. Every file is a verbatim move out of notes-tab.tsx.

After the split, run the full milestone definition-of-done gate in the verify step. Every step runs unconditionally, and any failure fails the task:
- npx tsc --noEmit
- bun run lint (the ESLint flat config from 261101-iim, a declared dependency, so there is no skip branch)
- bun test (includes lib/notes-format.test.ts from 261101-iil, lib/notes.test.ts from 261101-iik and the 261101-iig calculation suite)
- bun run build
  </action>
  <verify>
    <automated>test -d components/character/notes && [ "$(grep -c 'useUpdateCharacter(' components/character/notes-tab.tsx)" -eq 1 ] && ! grep -rnE 'useUpdateCharacter\(|useEffect|useRef' components/character/notes && [ -z "$(grep -rl mutateAsync components/character/notes | grep -v '/use-notes-actions\.ts$')" ] && ! grep -nE 'useState|useReducer' components/character/notes/use-notes-actions.ts 2>/dev/null && case "$(grep -rl dangerouslySetInnerHTML components/character)" in "components/character/notes/note-card.tsx"|"") true;; *) false;; esac && wc -l components/character/basic-info-tab.tsx components/character/notes-tab.tsx components/character/spells-talents-tab.tsx $(find components/character/basic-info components/character/notes components/character/spells-talents -type f -name '*.ts*') | awk '$2 != "total" && $1 >= 400 {bad=1; print "too long:", $2} END {exit bad}' && BASE=$(cat "$(git rev-parse --git-path gsd-261101-iin-base)") && git cat-file -e "$BASE^{commit}" && git diff --quiet "$BASE" -- components/character/index.ts components/forms/character-layout.tsx prisma/schema.prisma package.json && npx tsc --noEmit && bun run lint && bun test && bun run build</automated>
    <human-check>Run `bun dev` and open an existing character. Basic info: apply damage, then 'Vida Máxima'; press Berkana '-30' and 'Berkana Máxima'; toggle a standard language; add a custom language; expand 'Distribuição de Atributos'; use the quick-actions bar to scroll to vitality, Berkana and weapons. Spells/talents: add, expand and remove a spell and a talent; mark a once-per-day talent used and press 'Novo Dia'. Notes: add, edit, search, reorder and delete a note, and confirm that a note body containing an img tag with an onerror attribute shows as literal text. Everything must look and behave as it did before the split. Buttons are disabled while a save is pending, exactly as before.</human-check>
  </verify>
  <done>notes-tab.tsx is under 400 lines (794 at planning baseline) and composes NotesHeader, NotesList and EditNoteDialog. The notes/ files hold no effects, refs or update-hook calls. No .tsx file in notes/ makes a mutation call; only the fallback hook use-notes-actions.ts may, through the passed-in mutation, and only if the fallback fired, in which case it declares no state. The only raw-HTML render in components/character is in notes/note-card.tsx, fed by formatNoteHtml from lib/notes-format.ts. All three tabs and all 13 new files (14 with the fallback) are under 400 lines. index.ts, character-layout.tsx, prisma/schema.prisma and package.json do not differ from this item's recorded starting commit. The SUMMARY records notes-tab.tsx's final line count and whether the fallback fired. npx tsc --noEmit, bun run lint (unconditional), bun test and bun run build all exit 0.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| stored note text → browser DOM | Note bodies come from the DB `notes` String column. With no auth (accepted decision), any client can write them, so they are untrusted when rendered as HTML |
| tab UI → PUT /api/characters/:id | Every section write goes through the update mutation. After 261101-iii it carries updatedAt for optimistic concurrency |

## STRIDE Threat Register

ASVS level 1; block on: high.

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-iin-01 | Tampering (stored XSS regression) | notes/note-card.tsx note-body render | high | mitigate | NoteCard renders the body only through formatNoteHtml, imported unchanged from lib/notes-format.ts (261101-iil). lib/notes-format.ts and lib/notes-format.test.ts are not edited. The Task 3 gate requires the raw-HTML prop to appear only in notes/note-card.tsx (or nowhere). `bun test` runs iil's script/img-onerror formatter test |
| T-iin-02 | Tampering (notes data integrity: duplicate legacy migration / overwritten corrupted data) | NotesTab migration effect, once-guard, corrupted-data handling | high | mitigate | Migration effect, claimLegacyMigration once-guard, corrupted-data detection and all state stay in NotesTab. notes/ .tsx children are presentational. Note-writing handlers stay in NotesTab, or, only under the size fallback, in a useNotesActions hook that NotesTab calls once with its own mutation, so the lifecycle is NotesTab's. The Task 3 gate fails if any notes/ file contains effect or ref hooks or an update-hook call, if any file other than use-notes-actions.ts makes a mutation call, or if that hook declares state |
| T-iin-03 | Tampering (lost update via concurrency bypass) | subcomponents that save character sections | medium | mitigate | Each tab keeps exactly one update-hook call and passes that instance down. The Task 1-3 gates fail if any subfolder file calls the hook, so every write still goes through the 261101-iii concurrency-aware path |
| T-iin-04 | Information disclosure (debug logging reintroduced) | handlers moved into subcomponents | low | mitigate | Handlers are moved verbatim from post-261101-iij code (no new console.log). The `bun run lint` gate runs on all new files |
| T-iin-SC | Tampering | npm/bun package installs | low | accept | This plan installs no packages and does not edit package.json or bun.lock, so there is no package-legitimacy surface |
</threat_model>

<verification>
Full gate, run from the repo root after Task 3:
- `npx tsc --noEmit` exits 0
- `bun run lint` exits 0 (ESLint flat config from 261101-iim). It runs unconditionally, with no skip branch
- `bun test` exits 0 (calculation suite from 261101-iig, lib/notes-format.test.ts from 261101-iil, lib/notes.test.ts from 261101-iik)
- `bun run build` exits 0
- `wc -l` shows basic-info-tab.tsx, notes-tab.tsx, spells-talents-tab.tsx and every .ts/.tsx file in components/character/{basic-info,notes,spells-talents}/ under 400 lines
- `git diff "$(cat "$(git rev-parse --git-path gsd-261101-iin-base)")" -- components/character/index.ts components/forms/character-layout.tsx prisma/schema.prisma package.json` is empty. That is a diff against this item's own starting commit, recorded in Task 1 Step 0, not the batch base, so sibling edits made earlier are not counted
- SUMMARY records notes-tab.tsx's final line count and whether the use-notes-actions.ts fallback fired
- Human check (end-of-phase mode): the walkthrough in Task 3's `<human-check>`
</verification>

<success_criteria>
- STRUCT-01: the three tabs are composed of smaller subcomponents, and no file involved exceeds 400 lines
- Tab exports, props and barrel are unchanged. Each tab keeps exactly one shared update mutation, and pending-state disabling behaves as before
- The data-section scroll anchors, all pt-BR texts, field wiring and handlers are preserved verbatim
- Note bodies are still escaped. Legacy migration and corrupted-data protection still live in NotesTab
- `npx tsc --noEmit`, `bun run lint`, `bun test`, `bun run build` all pass
</success_criteria>

<output>
Create `.planning/quick/261101-iin-split-large-components-struct-01-break-components-character/261101-iin-SUMMARY.md` when done
</output>
