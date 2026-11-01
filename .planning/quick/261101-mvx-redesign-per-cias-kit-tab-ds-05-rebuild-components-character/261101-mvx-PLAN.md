---
phase: quick-261101-mvx
plan: 01
type: execute
wave: 2                     # ADVISORY ONLY: authoritative wave is recomputed by `quick-batch update` from depends_on
depends_on: ["261101-mvt", "261101-mvv"]   # mvt: SectionCard/StatTile/inline-field-state API; mvv: sheet shell column flow, may edit skills-kit-tab.tsx and the skills-modal props
files_modified:
  - components/character/skills-kit-tab.tsx
  - components/character/skills-kit-tab.render.test.ts
  - components/character/skills-kit/skills-kit-model.ts
  - components/character/skills-kit/skills-kit-model.test.ts
  - components/character/skills-kit/skills-card.tsx
  - components/character/skills-kit/skill-row.tsx
  - components/character/skills-kit/skill-stepper.tsx
  - components/character/skills-kit/finances-card.tsx
  - components/character/skills-kit/adventure-kit-card.tsx
autonomous: true
requirements: [DS-05]

must_haves:
  truths:
    - "The Perícias card shows Disponíveis / Gastos / Restantes computed exactly as the pre-redesign tab did: calculateTotalSkillPoints(level || 0), then calculateUsedSkillPoints and calculateRemainingSkillPoints over the SKILLS keys only. For example, level 7 with percepção 17 and duelo 13 shows 80 / 30 / 50. Restantes is red (destructive) when negative and foreground otherwise."
    - "Every skill row total equals calculateSkillTotal(toSkillValue(skills[key]), level || 0) for its SKILLS key. Stored keys that are not in SKILLS (atuacao, ataqueSurpresa, ...) are still neither counted nor shown, exactly as today (known key mismatch NOT fixed). The mock's '2 + d + b', 'Disponíveis 80' and '+1 de nível' are not used."
    - "Skills appear in six category groups (Combate, Físicas, Mente e Arcano, Sociais, Conhecimentos, Ofícios e Ermos). Each of the 36 SKILLS keys is in exactly one group and keeps SKILLS order within it. An 'Em uso · N' / 'Todas · 36' segmented filter controls the list. Each row shows label, a 'distribuídos + bônus' detail when either is non-zero, and the total."
    - "Tapping a row expands it in both modes. Locked, it shows the values read-only. Unlocked, it shows minus/plus steppers for Distribuídos and Bônus, and typed entry is still possible through the existing EditableNumberField (same section/field paths as today). The steppers write { skills: { ...skills, [key]: { ...skill, [field]: max(0, value ± 1) } } } through the tab's single useUpdateCharacter instance, are disabled while it is pending, and show the saving / saved / error inline states."
    - "The Finanças card shows five tiles (Ouro, Prata, Cobre, Imperano, Joias) editable through EditableNumberField section 'finances' with the same field keys. The card keeps data-section=\"finances\" for quick-action navigation."
    - "Kit de Aventureiro lists custom items (isDefault falsy) first, under 'Personalizados · N', with editable name and quantity and a remove button. 'Adicionar item' appends { name: '', quantity: 1, isDefault: false }. A collapsible 'Itens padrão · N' section (collapsed by default) holds the standard items, with editable quantities and the existing restore action that writes DEFAULT_ADVENTURE_KIT. Every edit and removal uses the item's original storage index, so the display reordering never edits or removes the wrong item."
    - "Nothing under lib/, prisma/, components/ui/, components/forms/, the other tabs' folders, quick-actions-bar.tsx, types.ts, index.ts, package.json or bun.lock changes. Every new non-test file in components/character/skills-kit/ is at most 300 lines, and the tab file is at most 120 lines."
    - "npx tsc --noEmit, bun run lint (0 errors, still exactly 1 warning), bun test and bun run build all pass"
  artifacts:
    - path: "components/character/skills-kit/skills-kit-model.ts"
      provides: "Framework-free presentation model: SKILL_GROUPS, skill point summary, row/group builders, stepper payload builder, kit partition and kit payload builders, total caption"
      exports: ["SKILL_GROUPS", "SkillKey", "SkillFilter", "SkillStepField", "SkillRowModel", "KitEntry", "getSkillPointSummary", "buildSkillRow", "countSkillsInUse", "buildSkillGroups", "buildSkillStepUpdate", "formatSkillTotalCaption", "partitionAdventureKit", "buildAddKitItemUpdate", "buildRemoveKitItemUpdate", "buildResetKitUpdate"]
    - path: "components/character/skills-kit/skills-kit-model.test.ts"
      provides: "Parity tests against the pre-redesign tab formulas and payloads, plus SKILL_GROUPS coverage and order"
    - path: "components/character/skills-kit/skills-card.tsx"
      provides: "Perícias SectionCard: points strip, segmented filter, caption, grouped rows"
      exports: ["SkillsCard"]
    - path: "components/character/skills-kit/skill-row.tsx"
      provides: "Expandable skill row with read-only breakdown and steppers when unlocked"
      exports: ["SkillRow"]
    - path: "components/character/skills-kit/skill-stepper.tsx"
      provides: "44px minus/plus stepper around the existing EditableNumberField, with inline save states"
      exports: ["SkillStepper"]
    - path: "components/character/skills-kit/finances-card.tsx"
      provides: "Finanças SectionCard with five editable tiles"
      exports: ["FinancesCard"]
    - path: "components/character/skills-kit/adventure-kit-card.tsx"
      provides: "Kit de Aventureiro SectionCard: custom first, add item, collapsible standard items, restore"
      exports: ["AdventureKitCard"]
    - path: "components/character/skills-kit-tab.tsx"
      provides: "Thin composition: one useUpdateCharacter() shared by the three cards"
      exports: ["SkillsKitTab"]
    - path: "components/character/skills-kit-tab.render.test.ts"
      provides: "renderToString tests of the tab and of SkillRow (numbers, groups, filter, kit order, locked/unlocked, no writes on render)"
  key_links:
    - from: "components/character/skills-kit-tab.tsx"
      to: "components/character/skills-kit/skills-card.tsx, finances-card.tsx, adventure-kit-card.tsx"
      via: "a single useUpdateCharacter() passed as the updateCharacterMutation prop"
      pattern: "updateCharacterMutation={updateCharacterMutation}"
    - from: "components/character/skills-kit/skills-card.tsx"
      to: "components/character/skills-kit/skills-kit-model.ts"
      via: "getSkillPointSummary + buildSkillGroups + buildSkillStepUpdate"
      pattern: "buildSkillStepUpdate"
    - from: "components/character/skills-kit/skill-stepper.tsx"
      to: "components/ui/inline-field-state.tsx"
      via: "resolveInlineFieldState + InlineFieldStatusIcon + InlineFieldRetry + SAVED_FEEDBACK_MS"
      pattern: "resolveInlineFieldState"
    - from: "components/character/skills-kit/adventure-kit-card.tsx"
      to: "components/ui/editable-field.tsx"
      via: "EditableField / EditableNumberField with section adventureKit and field paths built from the storage index"
      pattern: "entry.index}.name"
    - from: "components/character/skills-kit/skills-card.tsx"
      to: "components/ui/section-card.tsx, components/ui/stat-tile.tsx"
      via: "SectionCard title Perícias; StatTile variant bare in the points strip"
      pattern: "variant=\"bare\""
---

<objective>
Rebuild the Perícias & Kit tab (DS-05) to the Ferro & Brasa `pericias` screen. Split the 467-line components/character/skills-kit-tab.tsx into section cards under components/character/skills-kit/, with each file under about 300 lines:
- Perícias: points summary, "Em uso / Todas" filter, grouped and expandable skill rows with steppers
- Finanças: five tiles
- Kit de Aventureiro: custom items first, add item, collapsible standard items

Purpose: the tab gets the design look, and every number and every write stays what it is today. The skill-point pool ((level+1)*10), the totals, the SKILLS keys (including the known `atuação`/`ataqueSupresa` mismatch) and every persisted field path are preserved. Parity tests against the pre-redesign formulas prove it.

Output:
- a framework-free presentation model with parity tests
- five card/row/stepper components
- a thin tab
- a render test

**Design rule for the executor (owner guidance, see .planning/design/ferro-brasa/README.md, "Important: the design is visual direction, not a functional spec"):**
- Follow the mock's look and layout.
- Keep the current app's behavior wherever the mock differs: formulas, what each write changes, available fields and actions, validation, ordering and persisted keys.
- Add a mock-only feature only when it is a pure UI convenience over existing fields.
- Record every such decision in the SUMMARY. The decisions already taken by this plan are listed in `<decisions>` below; copy them into the SUMMARY and add any new ones.
- For this item specifically, ignore the mock's skill-total formula ("Total = 1 + distribuídos + bônus + 1 de nível", "2 + d + b") and its "Disponíveis 80". Show what the current tab computes.

Not in scope:
- fixing the SKILLS key mismatch or the (level+1)*10 vs level*10 pool question (open questions; do not touch)
- any change to lib/ (calculations, constants, schemas, defaults), components/ui/ (foundation and generated shadcn files), components/forms/character-layout.tsx, quick-actions-bar.tsx, components/character/types.ts or components/character/index.ts
- the `pericias` bottom sheet, which belongs to 261101-mvv
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.claude/CLAUDE.md
@.planning/design/ferro-brasa/README.md
# Ficha.dc.html is ~106 KB: read only lines 327-391 (Perícias, Finanças, Kit markup), 671-678 (GROUPS) and 793-807 (row derivation).
@.planning/design/ferro-brasa/Ficha.dc.html
# Foundation contract: prefer the corrected <interfaces> block in 261101-mvt-SUMMARY.md when it exists; otherwise use the PLAN's <interfaces> block.
@.planning/quick/261101-mvt-redesign-foundation-ds-01-implement-the-ferro-brasa-design-s/261101-mvt-PLAN.md
@components/character/skills-kit-tab.tsx
@components/character/types.ts
@components/forms/character-layout.tsx
@components/character/notes-tab.render.test.ts
@components/ui/editable-field.tsx
@lib/constants/character.ts
@lib/calculations/index.ts
@lib/schemas/character.ts
@lib/defaults/character.ts

<interfaces>
Foundation pieces this item consumes (names from 261101-mvt; import each file directly, no barrel):
- components/ui/section-card.tsx: `SectionCard({ title, tone?, action?, headingLevel?, className, children, ...sectionProps })`. It renders a section with break-inside-avoid, mb-3, card surface, border, shadow-card, p-4 and gap-3.5, a 7px diamond and a serif 19px title, and passes data-section and id through.
- components/ui/stat-tile.tsx: `StatTile({ label, value, variant = 'tile' | 'bare', align?, className?, valueClassName?, ...divProps })`. The 'bare' variant is meant for the Disponíveis/Gastos/Restantes strip, where the parent draws the borders.
- components/ui/inline-field-state.tsx: `type SaveStatus = 'idle' | 'saved' | 'error'`, `resolveInlineFieldState({ isEditing, canEdit, isSaving, saveStatus })`, `InlineFieldStatusIcon({ state, className? })`, `InlineFieldRetry({ onRetry, keepFocus? })`, `SAVED_FEEDBACK_MS`, `INLINE_FIELD_LABEL_CLASS`. The foundation names "skill steppers" as a consumer.
- components/ui/editable-field.tsx: `EditableField` and `EditableNumberField`. Their props are unchanged by the foundation. EditableNumberField's `min` defaults to 0, and its display formatter is fixed (no formatDisplay prop). Locked (isEditMode false), the fields render plain read-only text. Unlocked, they render the dashed 44px idle box.
- components/character/types.ts: `CharacterTabProps`, `CharacterData`, `UpdateCharacterMutation`. Read the version that exists after 261101-mvv; this item does not edit it.

Model contract created by Task 1 (components/character/skills-kit/skills-kit-model.ts). It is framework-free: it imports only from '@/lib/constants/character', '@/lib/calculations' and, as types, '@/lib/schemas/character'. No React, sonner or Hono. It uses single quotes and no semicolons.
- `type SkillKey = (typeof SKILLS)[number]`; `type SkillFilter = 'uso' | 'todas'`; `type SkillStepField = 'distributed' | 'bonus'`
- `type StoredSkills = Record<string, Partial<SkillValue> | null | undefined>`. This is the loose stored JSON; extra keys survive because objects are spread, never rebuilt.
- `SKILL_GROUPS: ReadonlyArray<{ name: string; skills: readonly SkillKey[] }>`. Membership and group order come from the mock GROUPS. The keys are the SKILLS spellings, and within a group skills follow SKILLS order (the current list order). Exact content, in this order:
  1. Combate: ataqueSupresa, combateDesarmado, duelo
  2. Físicas: acrobacia, cavalgar, escalar, equilibrio, nadar, suportar, velocidade
  3. Mente e Arcano: concentração, controleArcano, controleEmocional, discernir, percepção, prontidão
  4. Sociais: atuação, blefar, dissuadir, diplomacia, dissimulação, empatia, persuadir
  5. Conhecimentos: conhecimentoArcano, conhecimentoPolitico, conhecimentoHistorico, conhecimentoReligioso, conhecimentoNatureza, conhecimentoMilitar
  6. Ofícios e Ermos: avaliar, cura, furtar, furtividade, oficios, sobrevivência, salvar
  (3+7+6+7+6+7 = 36)
- `getSkillPointSummary(skills: StoredSkills | null | undefined, level: number | null | undefined): { available: number; used: number; remaining: number }`. It computes `available = calculateTotalSkillPoints(level || 0)`. It then builds a skillValues record from SKILLS keys only, mapping each key to `toSkillValue(skills[key])`, and sets `used = calculateUsedSkillPoints(skillValues)` and `remaining = calculateRemainingSkillPoints(skillValues, available)`. Null or undefined skills behave as {}.
- `interface SkillRowModel { key: SkillKey; label: string; distributed: number; bonus: number; total: number; inUse: boolean; detail: string }`. Its fields:
  - label = SKILL_LABELS[key]
  - distributed and bonus come from toSkillValue(skills[key])
  - total = calculateSkillTotal(toSkillValue(skills[key]), level || 0)
  - inUse = distributed !== 0 || bonus !== 0
  - detail = the template string "{distributed} + {bonus}" when inUse, otherwise ''
- `buildSkillRow(skills, key, level): SkillRowModel`
- `countSkillsInUse(skills): number`, counted over SKILLS keys.
- `buildSkillGroups(skills, level, filter: SkillFilter, openSkill: SkillKey | null): Array<{ name: string; rows: SkillRowModel[] }>`. With filter 'todas' it returns every row. With 'uso' it returns rows that are inUse OR whose key equals openSkill, so a row being edited does not vanish when it drops to 0. Groups with no rows are dropped.
- `buildSkillStepUpdate(skills, key, field: SkillStepField, delta: number)`. It reproduces the legacy quick-add expression for any field. Let `skill = skills[key] || { distributed: 0, bonus: 0 }`. The result is `{ skills: { ...skills, [key]: { ...skill, [field]: Math.max(0, (skill[field] || 0) + delta) } } }`. It never mutates its input. Type the result so it is accepted as `UpdateCharacterRequest` by mutateAsync without any `any`, ts-ignore or ts-expect-error. A single narrow cast of the merged record to `UpdateCharacterRequest['skills']` is acceptable, because it sends exactly what the legacy code sent.
- `formatSkillTotalCaption(level): string` returns the template string "Total = 1 + distribuídos + bônus + {getSkillLevelBonus(level || 0)} de nível". The base 1 is the constant inside calculateSkillTotal, which the old tab displayed as "Base: 1".
- `type KitEntry = { item: AdventureKitItem; index: number }`. `index` is the position in the stored array.
- `partitionAdventureKit(kit: unknown): { custom: KitEntry[]; standard: KitEntry[] }`. A non-array kit gives two empty lists, and non-object entries are skipped. `custom` holds entries whose item.isDefault is falsy, matching today's "Item customizado" rule, so items without the flag (for example after a restore) still count as custom. `standard` holds isDefault-truthy entries. Both keep storage order.
- `buildAddKitItemUpdate(kit: AdventureKitItem[] | null | undefined)` returns `{ adventureKit: [...(kit || []), { name: '', quantity: 1, isDefault: false }] }`.
- `buildRemoveKitItemUpdate(kit: AdventureKitItem[], index: number)` returns `{ adventureKit: kit.filter((_, i) => i !== index) }`.
- `buildResetKitUpdate()` returns `{ adventureKit: DEFAULT_ADVENTURE_KIT }`.
</interfaces>
</context>

<decisions>
Decisions this plan takes under the owner rule. The executor copies them into the SUMMARY.
1. Numbers. Disponíveis, Gastos, Restantes and every total come from the pre-redesign tab's expressions, using the (level+1)*10 pool and SKILLS keys only. The caption shows the real level bonus (getSkillLevelBonus), not the mock's fixed "+1". The mock's "2 + d + b" and "80" are ignored.
2. Typed entry kept. Today Distrib and Bônus are typed through EditableNumberField. That stays, in the center of each stepper with the same section/field paths, and `min` keeps its default of 0.
   - The design's ±1 steppers are added around it.
   - The distributed stepper reuses today's quick-add payload (Math.max(0, …)).
   - The bonus stepper is a mock-only UI convenience over an existing field. It floors at 0, the same as today's bonus input (its min defaults to 0).
   - Today's +1/+2/+3 quick-add buttons are replaced by ±1 plus typed entry. No capability is lost.
3. Rows expand when locked too. The old "Distribuição" section could be opened in view mode, and the mock only expands when unlocked. Locked rows therefore expand to a read-only breakdown.
4. Labels and order. Row labels stay SKILL_LABELS (full "Conhecimento Arcano"); the mock's short "Arcano" is a hard-coded mock label and is not adopted. Category membership and group order follow the mock, as the item asks. Within a group, the current SKILLS order is kept.
5. Default filter. The tab opens on "Em uso" when at least one skill is in use, otherwise on "Todas". This avoids an empty list on a new character. An open row stays visible under "Em uso".
6. Kit:
   - Custom items are listed first, as the item asks. This is display order only; the stored order and the storage-index field paths are unchanged.
   - Standard items keep editable quantities, as today.
   - Today's Reset action is kept, with the same payload and one tap, as "Restaurar kit padrão" at the end of the expanded "Itens padrão" list. The mock omits it, and dropping it would remove a capability.
   - The "Itens padrão · N" toggle always renders, even with N = 0, so the restore action stays reachable.
   - Edit-only controls: disabled → hidden when locked. Today the custom item's remove (×), "+ Adicionar Item" and Reset render disabled when the sheet is locked. Here they follow the design and the cross-tab rule from the coordinator: they are hidden when locked and render only when unlocked. While unlocked, they are disabled only while the tab's mutation is pending. No capability is lost, because every action is available once the sheet is unlocked.
7. Write path and pending guard. There are two kinds of write instance, as today:
   - Steppers and kit add/remove/restore use the tab's single useUpdateCharacter() instance, passed down as updateCharacterMutation. They are disabled while that instance is pending, the guard today's quick-add buttons used. This keeps two taps from building their payloads from the same stale props.
   - Typed fields keep their own instance. Each EditableField / EditableNumberField calls useUpdateCharacter() internally (components/ui/editable-field.tsx). That covers the stepper's center value, the Finanças tiles and kit names/quantities. The tab's isPending does not see these saves.
   - Across all instances, lib/api/character-concurrency.ts serializes writes per character at module level: a module-level saveQueues Map keyed by character id, used by every saveCharacterUpdate through enqueueCharacterSave. The own-version lineage then keeps them from raising spurious 409s. This was verified at planning time.
   - Accepted residual risk, unchanged from today: a stepper tap made while a typed save is still pending builds its payload from props that save has not refreshed yet. That can overwrite the typed value.
   - No new serialization machinery is added. The stepper keeps only the tab-instance pending guard.
8. Skills overview button. Today the tab has a Maximize2 button that opens the skills modal. After 261101-mvv, read types.ts and character-layout.tsx:
   - If the tab still receives an opener callback (setIsSkillsModalOpen or mvv's replacement), keep the button as the Perícias card action: a ghost icon Button, size-11, aria-label "Ver perícias", rendered only when the callback is defined.
   - If mvv removed the callback, omit the button and record that.
   - Do not edit types.ts or character-layout.tsx.
9. Finances. The label "Jóias" becomes "Joias" (design spelling); the persisted key `joias` is unchanged. Values show unformatted, because EditableNumberField's display formatter is fixed. The mock's pt-BR thousands formatting is not adopted.
10. Kit errors. Add, remove and restore failures keep the existing console.error, and also show a pt-BR toast.error unless isCharacterConflictError(error) is true. The conflict toast already comes from useUpdateCharacter.
</decisions>

<coverage_audit>
| Source | Item | Covered by |
|--------|------|------------|
| GOAL | Rebuild skills-kit-tab.tsx to the design pericias screen, split into components/character/skills-kit/ cards, each file under ~300 lines | Tasks 1-3; line-count gate in Task 3 |
| GOAL | Skill points summary Disponíveis/Gastos/Restantes with the remaining color | Task 1 (SkillsCard strip, model summary, parity test) |
| GOAL | "Em uso / Todas" segmented filter | Task 1 |
| GOAL | Skills grouped by category, expandable rows with distributed+bonus detail and total | Task 1 (groups, rows, detail), Task 2 (row extraction + expansion content) |
| GOAL | Minus/plus steppers for distributed and bonus when unlocked | Task 2 |
| GOAL | Finanças tiles | Task 3 |
| GOAL | Kit: custom items first, add item, collapsible "Itens padrão · N" | Task 3 (+ model helpers and tests in Task 1) |
| GOAL | Keep pool, totals and persisted keys exactly; do not fix the SKILLS key mismatch or pool question | Task 1 parity tests + Task 3 diff gate (lib untouched) |
| GOAL | Writes through the existing mutation | Steppers and kit actions use the tab's single useUpdateCharacter(); typed fields use EditableField's own instance, as today (Tasks 1-3, `<decisions>` 7) |
| CONTEXT (coordinator) | depends_on mvt (+ mvv: shell, skills-modal props, possible tab edit) | frontmatter |
| CONTEXT (coordinator) | Parity check proving Disponíveis/Gastos/Restantes and every total unchanged | Task 1 model test (legacy transcription + literal values) and render test |
| CONTEXT (coordinator) | Grouping constant from the mock GROUPS; every SKILLS key in exactly one group, tested | Task 1 (SKILL_GROUPS in the new folder + test) |
| CONTEXT (coordinator) | Mock data/formulas illustrative; real values from lib/calculations | `<decisions>` 1; Task 1 |
| CONTEXT (owner guidance) | Look from the mock, behavior from the app; decisions recorded for the SUMMARY; note to executor | `<objective>` design rule + `<decisions>` + `<output>` |
| CONTEXT (coordinator) | DoD tsc / lint (0 errors, no new warnings) / bun test / build | Task 3 verify + `<verification>` |
| RESEARCH (design README) | 44px touch targets, 12px uppercase labels, diamond card titles, font-numeric + tabular-nums for numbers, inline field states | Tasks 1-3 (via foundation components) |
| CONTEXT (memory) | No auth by design | Nothing here adds auth |
</coverage_audit>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Tracer — presentation model with parity tests, Perícias card wired into the tab, render test</name>
  <files>components/character/skills-kit/skills-kit-model.ts, components/character/skills-kit/skills-kit-model.test.ts, components/character/skills-kit/skills-card.tsx, components/character/skills-kit-tab.tsx, components/character/skills-kit-tab.render.test.ts</files>
  <read_first>
    - The pre-redesign tab at the batch base commit. Run `git show e2740820e63cb3a88e91ba8987455d22be22905f:components/character/skills-kit-tab.tsx`. This is the parity source; 261101-mvv may have edited the working copy. Lines to transcribe:
      - 316-322: summary
      - 74-76: row total
      - 358-369: quick-add payload
      - 191-197: reset
      - 210-215: add
      - 280-283: remove
    - components/character/skills-kit-tab.tsx as it is now (after 261101-mvv), plus components/character/types.ts and components/forms/character-layout.tsx. Check which props the tab receives, and whether a skills-overview opener still exists (`<decisions>` 8). Also check how the layout flows the cards of a tab (mvv: a multi-column flow with column-width 340px). components/character/basic-info-tab.tsx (mvw) shows how a tab returns its cards inside that flow.
    - .planning/quick/261101-mvt-…/261101-mvt-SUMMARY.md, the corrected interfaces block, if present. Then components/ui/section-card.tsx, stat-tile.tsx and inline-field-state.tsx as built.
    - .planning/design/ferro-brasa/Ficha.dc.html lines 327-347 (Perícias markup) and 671-678 (GROUPS)
    - lib/calculations/index.ts lines 125-205 and 335-345 (skill functions, toSkillValue); lib/constants/character.ts (SKILLS, SKILL_LABELS, DEFAULT_ADVENTURE_KIT)
    - components/character/notes-tab.render.test.ts (mock.module pattern for '@/lib/api/queries', process-wide caveat, createElement + renderToString, no JSX)
  </read_first>
  <behavior>
    Model (skills-kit-model.test.ts, bun:test, framework-free):
    - SKILL_GROUPS:
      - The flattened keys are a permutation of SKILLS: 36 entries, no duplicates, each SKILLS key exactly once.
      - The group names are exactly, in order: Combate, Físicas, Mente e Arcano, Sociais, Conhecimentos, Ofícios e Ermos.
      - Within each group, the SKILLS index strictly increases.
    - Summary parity: for every level in [undefined, null, 0, 1, 4, 5, 9, 10, 23] and every fixture, getSkillPointSummary deep-equals legacySummary. legacySummary is a verbatim transcription of base lines 316-322 inside the test.
      - fixture 1: {}
      - fixture 2: getDefaultCharacterData().skills (unaccented keys)
      - fixture 3: mixed. 'percepção' {distributed 17, bonus 0}; percepcao {distributed 3, bonus 2}; duelo {distributed 13, bonus 7, extra 'x'}; salvar null; 'sobrevivência' {bonus 5}; atuacao {distributed 5}; ataqueSurpresa {distributed 4}
    - Summary literals:
      - level 7 with the mixed fixture gives { available 80, used 30, remaining 50 }. atuacao, ataqueSurpresa and percepcao are not counted.
      - level 0 with {} gives { 10, 0, 10 }
      - level 0 with { duelo: { distributed: 25 } } gives remaining -15
    - Row parity: for every SKILLS key, level and fixture, buildSkillRow(...).total equals legacyTotal. legacyTotal is the transcription of base lines 75-76: the `|| { distributed: 0, bonus: 0 }` fallback, then calculateSkillTotal(toSkillValue(skill), level || 0).
      - Literals, mixed fixture at level 7:
        - percepção total 19, detail '17 + 0', inUse true
        - duelo total 22, detail '13 + 7'
        - ataqueSupresa total 2, detail '', inUse false. This is the known key mismatch, preserved.
      - Literal: level 10, acrobacia total 3
    - countSkillsInUse: mixed fixture gives 3 (percepção, duelo, sobrevivência); getDefaultCharacterData().skills gives 0
    - buildSkillGroups:
      - 'todas' gives 6 groups, 36 rows in total
      - 'uso' on the mixed fixture gives only the groups Combate, Mente e Arcano and Ofícios e Ermos
      - 'uso' with openSkill 'acrobacia' also includes Físicas with exactly the acrobacia row
    - buildSkillStepUpdate:
      - For distributed with delta +1, +2, +3 and -1, on existing, missing and null skill keys, the result deep-equals legacyQuickAdd(skills, key, delta). legacyQuickAdd is the transcription of base lines 358-369.
      - Other top-level keys (atuacao, percepcao) and extra fields (duelo.extra) are preserved, and the input object is not mutated (deep-equal to a structuredClone taken before the call).
      - Bonus: duelo +1 gives bonus 8 with distributed 13 and extra kept. Bonus -1 at 0 gives 0. Missing key, bonus +1, gives { distributed: 0, bonus: 1 }.
    - formatSkillTotalCaption: level 7 ends with '+ 1 de nível'; level 4 with '+ 0 de nível'; level 10 with '+ 2 de nível'; null with '+ 0 de nível'
    - Kit:
      - partitionAdventureKit([d0, c1, d2, noFlag3]): custom has indexes [1, 3] and standard [0, 2]. d = isDefault true, c = isDefault false, noFlag = no isDefault key.
      - partitionAdventureKit(undefined) and partitionAdventureKit({}) return two empty lists.
      - buildAddKitItemUpdate(kit) deep-equals the legacy add expression from base lines 211-215; buildAddKitItemUpdate(undefined) gives one new item.
      - buildRemoveKitItemUpdate(kit, 3) deep-equals the legacy filter from base line 280 and leaves the input untouched.
      - buildResetKitUpdate() deep-equals { adventureKit: DEFAULT_ADVENTURE_KIT }.
    Render (skills-kit-tab.render.test.ts):
    - fixture A: level 7 and the mixed skills; isEditMode true and false
      - html contains '80 disponíveis, 30 gastos, 50 restantes'
      - html contains 'aria-label="Percepção, total 19"' and 'aria-label="Duelo, total 22"'
      - html contains 'Em uso · 3' and 'Todas · 36'
      - html contains 'Combate'; html does not contain 'Acrobacia, total'. The default filter is 'uso'.
    - fixture B: level 10, skills { atuacao: { distributed: 5 }, ataqueSurpresa: { distributed: 4 } }
      - html contains '110 disponíveis, 0 gastos, 110 restantes'
      - html contains 'aria-label="Ataque Surpresa, total 3"' and 'aria-label="Atuação, total 3"'. The default filter is 'todas' because nothing is in use.
      - html contains '+ 2 de nível'
    - Rendering never calls mutateAsync.
  </behavior>
  <action>
    Step 0, before editing anything: run git rev-parse HEAD and write the output to the path printed by git rev-parse --git-path gsd-261101-mvx-base. Task 3's invariant gate reads it.

    RED: write components/character/skills-kit/skills-kit-model.test.ts with bun:test covering every model behavior above.
    - Import from './skills-kit-model', '@/lib/calculations', '@/lib/constants/character' and '@/lib/defaults/character'. Do NOT import '@/lib/api/queries'.
    - Put the legacy* transcriptions in a section banner (`// ===` line plus `// PARIDADE COM A ABA ANTERIOR (e274082)`). Each carries a Portuguese comment naming the base line range it copies.
    - Run it, see it fail, and commit as test(261101-mvx).

    GREEN: create components/character/skills-kit/skills-kit-model.ts with exactly the contract in `<interfaces>`.
    - Use section banners: GRUPOS DE PERÍCIAS, PONTOS E LINHAS, GRAVAÇÕES DE PERÍCIA, KIT DE AVENTUREIRO.
    - Add a Portuguese comment on SKILL_GROUPS: presentation only, keys are the SKILLS spellings, and the key mismatch is deliberately not fixed here.
    - No `any` in signatures; `import type` for type-only imports.
    - Run the test until green, then commit as feat(261101-mvx).

    Then create components/character/skills-kit/skills-card.tsx. Use single quotes and no semicolons, and import each foundation file directly.
    - Props: character, characterId and isEditMode (Pick of CharacterTabProps from '@/components/character/types'), updateCharacterMutation (UpdateCharacterMutation), and optional onOpenSkillsOverview.
    - State:
      - filter: useState with a lazy initializer, 'uso' when countSkillsInUse(skills) > 0, otherwise 'todas' (`<decisions>` 5)
      - openSkill: SkillKey or null, initially null
      - level and skills are read from character with the same defaults the old tab used (skills default {})
    - Render a SectionCard with title "Perícias", data-section "skills", className gap-3 (mock gap 12). `action` is the overview button from `<decisions>` 8, only when onOpenSkillsOverview is defined. Inside, in order:
      1. Points strip: a div with role "group", aria-label as the single template string "Pontos de perícia: {available} disponíveis, {used} gastos, {remaining} restantes", and classes grid grid-cols-3 rounded-(--radius) border. It holds three StatTile variant "bare": Disponíveis, Gastos, and Restantes. Gastos and Restantes get className border-l. Restantes gets valueClassName text-destructive when remaining < 0, otherwise text-foreground. Values come from getSkillPointSummary only.
      2. Segmented filter: a div (grid grid-cols-2 rounded-(--radius) bg-muted p-[3px]) with two type="button" buttons, each with aria-pressed and h-11 rounded-(--radius) text-[15px] font-semibold. Active: bg-card text-foreground shadow-card. Inactive: text-muted-foreground. Labels are single template strings, "Em uso · {count}" and "Todas · {SKILLS.length}". React SSR splits adjacent text nodes with comment markers, and the render test matches these strings.
      3. Caption: a text-[13px] text-muted-foreground span with formatSkillTotalCaption(level).
      4. Groups from buildSkillGroups(skills, level, filter, openSkill):
         - Group header: flex justify-between pt-2.5 pb-1 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground, with an h3 for the name and a span for the row count.
         - Each row is a type="button" element with aria-expanded and aria-controls ("skill-detail-" plus the key) and aria-label as the template string "{label}, total {total}". It toggles openSkill. Classes: grid w-full grid-cols-[minmax(0,1fr)_auto_44px] items-center gap-2.5 min-h-[46px] border-t text-left; text-foreground when inUse, otherwise text-muted-foreground.
         - Row content: label in text-[15px] truncate; detail in text-[13px] text-muted-foreground font-numeric tabular-nums; total in font-numeric tabular-nums text-[21px] font-semibold text-right.
         - When open, a detail region with that id: two labeled EditableNumberField for Distribuídos and Bônus, with exactly today's props (section "skills", fields "{key}.distributed" and "{key}.bonus", value from the row model, distributed min 0, currentCharacterData character, isEditMode), plus a muted text-xs line built as the template string "Base 1 · Nível +{getSkillLevelBonus(level || 0)}". Task 2 moves this into SkillRow and adds the steppers.
      5. When filter is 'uso' and no group remains: a muted text-sm "Nenhuma perícia em uso." and a ghost button "Ver todas" that sets the filter to 'todas'.

    Rewire components/character/skills-kit-tab.tsx:
    - Keep `export function SkillsKitTab(props: CharacterTabProps)` and the single `const updateCharacterMutation = useUpdateCharacter()`.
    - Delete the old "Perícias - Resumo" card and the "Distribuição de Pontos de Perícia" card (and their now-unused imports and state).
    - Render SkillsCard first, passing updateCharacterMutation and the overview opener per `<decisions>` 8.
    - Leave the existing Finanças and Kit card JSX exactly as it is for now (Task 3 replaces it), so the tab keeps working at this commit.
    - Follow the layout flow found in read_first: if character-layout provides the column-flow container, return the cards the way basic-info-tab.tsx does; otherwise wrap them in a div with columns-[340px] gap-3.

    Create components/character/skills-kit-tab.render.test.ts. Copy the mock.module pattern and the process-wide header comment from notes-tab.render.test.ts: a useUpdateCharacter stub returning mutateAsync, isPending false and error null, the same shape as there. Import the tab dynamically after mock.module, render with createElement and no JSX, and cover the render behaviors above. Commit as feat(261101-mvx).
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && test -s "$(git rev-parse --git-path gsd-261101-mvx-base)" && bun test components/character/skills-kit/skills-kit-model.test.ts components/character/skills-kit-tab.render.test.ts && grep -q 'SkillsCard' components/character/skills-kit-tab.tsx && grep -q 'getSkillPointSummary' components/character/skills-kit/skills-card.tsx && grep -q 'buildSkillGroups' components/character/skills-kit/skills-card.tsx && grep -q 'variant="bare"' components/character/skills-kit/skills-card.tsx && npx tsc --noEmit && bun run lint 2>&1 | grep -q '(0 errors, 1 warning)' && echo TRACER-OK</automated>
  </verify>
  <done>
    - The model parity tests pass. They prove the summary, every SKILLS total, the stepper payload and the kit payloads match the pre-redesign expressions, and SKILL_GROUPS covers all 36 keys exactly once in SKILLS order.
    - The tab renders the new Perícias card with the right numbers for both fixtures, and the old Finanças and Kit cards still work.
    - tsc passes and lint still reports exactly 1 warning. TRACER-OK is printed.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: SkillRow and SkillStepper — design rows with minus/plus steppers and inline save states</name>
  <files>components/character/skills-kit/skill-row.tsx, components/character/skills-kit/skill-stepper.tsx, components/character/skills-kit/skills-card.tsx, components/character/skills-kit-tab.render.test.ts</files>
  <read_first>
    - components/character/skills-kit/skills-card.tsx (Task 1 output: the inline row and detail to extract)
    - components/ui/inline-field-state.tsx as built by 261101-mvt, and the saveStatus and saved-timer effect pattern in components/ui/editable-field.tsx (it was lint-probed clean)
    - .planning/design/ferro-brasa/Ficha.dc.html lines 341-357 (row and stepper markup)
  </read_first>
  <behavior>
    - SkillRow, rendered directly with isOpen true and isEditMode true for row percepção (distributed 17, bonus 0, total 19):
      - html contains 'aria-label="Aumentar distribuídos de Percepção"' and 'aria-label="Diminuir bônus de Percepção"'
      - the "Diminuir bônus" button is disabled (bonus is 0) and 'aria-label="Diminuir distribuídos de Percepção"' is not disabled
      - html contains 'aria-expanded="true"'
    - SkillRow with isOpen true and isEditMode false: no 'Aumentar' or 'Diminuir' labels; the breakdown values still render (contains '17')
    - SkillRow with isOpen false: no element with id "skill-detail-percepção"
    - With isStepDisabled true, both "Aumentar" buttons are disabled
    - The Task 1 render assertions still pass, and rendering never calls mutateAsync
  </behavior>
  <action>
    Create components/character/skills-kit/skill-stepper.tsx, exporting SkillStepper.
    - Props:
      - label ('Distribuídos' or 'Bônus')
      - skillLabel
      - characterId, character
      - section "skills" and the field path for the EditableNumberField
      - value, isEditMode
      - disabled: the shared mutation is pending
      - onStep(delta: number), returning Promise of void
    - State: saveStatus (SaveStatus, 'idle') and isSaving (false).
    - handleStep(delta):
      - set isSaving true, then await onStep(delta)
      - on success set 'saved'
      - in catch, call console.error('Erro ao ajustar perícia:', error) and set 'error'
      - in finally set isSaving false
    - Add the saved-timer effect copied from the foundation's editable-field pattern: keyed on saveStatus; when it is 'saved', a setTimeout of SAVED_FEEDBACK_MS sets 'idle', cleared in the cleanup. Never set state synchronously in an effect body. If lint still flags it, use the foundation's documented fallback.
    - state = resolveInlineFieldState({ isEditing: false, canEdit: isEditMode, isSaving, saveStatus }).
    - Layout:
      - flex flex-col gap-1
      - a label row holding the text-xs muted label and InlineFieldStatusIcon for state
      - then the control: grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-1
        - minus: shadcn Button variant outline size icon className size-11, Minus icon, aria-label as the template string "Diminuir {label lowercased} de {skillLabel}". Disabled when disabled, isSaving or value <= 0. The floor stays 0, and the button avoids a no-op write.
        - center: the existing EditableNumberField with the same section/field/value/min props Task 1 used, displayClassName justify-center text-center text-[19px] font-semibold. Typed entry stays (`<decisions>` 2).
        - plus: same Button with Plus and aria-label "Aumentar {label lowercased} de {skillLabel}", disabled when disabled or isSaving.
      - When isEditMode is false: no buttons, only the label and the EditableNumberField, which renders read-only text.
      - When state is 'error': InlineFieldRetry with onRetry re-running the last delta (keep it in a ref or state).
    - The stepper does not write directly. It only calls onStep, so the payload stays in the model.

    Create components/character/skills-kit/skill-row.tsx, exporting SkillRow.
    - Props:
      - row (SkillRowModel)
      - isOpen, onToggle
      - levelBonus
      - isEditMode
      - characterId, character
      - isStepDisabled
      - onStep(field: SkillStepField, delta: number), returning Promise of void
    - Move the row button and detail region from skills-card.tsx unchanged: same aria-label, aria-expanded, aria-controls, id and classes.
    - The open detail region: grid grid-cols-2 gap-2.5 pt-1 pb-3, with two SkillStepper. Distribuídos uses field "{key}.distributed" with min 0. Bônus uses field "{key}.bonus" with no min, so it keeps EditableNumberField's default min of 0, as today. Below them, spanning both columns, the "Base 1 · Nível +{levelBonus}" line.

    Update skills-card.tsx:
    - Render SkillRow for each row.
    - Define handleStep(key, field, delta), which awaits updateCharacterMutation.mutateAsync with id characterId and data buildSkillStepUpdate(skills, key, field, delta). Errors propagate to the stepper.
    - Pass isStepDisabled = updateCharacterMutation.isPending.
    - Pass levelBonus = getSkillLevelBonus(level || 0).

    Extend skills-kit-tab.render.test.ts with the SkillRow cases. Import SkillRow dynamically after the existing mock.module, and build the row model with buildSkillRow. Run the tests and the gate, then commit as feat(261101-mvx).
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && bun test components/character/skills-kit-tab.render.test.ts components/character/skills-kit/skills-kit-model.test.ts && grep -q 'resolveInlineFieldState' components/character/skills-kit/skill-stepper.tsx && grep -q 'InlineFieldRetry' components/character/skills-kit/skill-stepper.tsx && grep -q 'SkillStepper' components/character/skills-kit/skill-row.tsx && grep -q 'buildSkillStepUpdate' components/character/skills-kit/skills-card.tsx && grep -q 'isPending' components/character/skills-kit/skills-card.tsx && grep -q '<SkillRow' components/character/skills-kit/skills-card.tsx && npx tsc --noEmit && bun run lint 2>&1 | grep -q '(0 errors, 1 warning)' && echo STEPPER-OK</automated>
  </verify>
  <done>
    - Expanded rows show the Distribuídos and Bônus steppers only when unlocked, around the unchanged EditableNumberField.
    - Each step sends the parity-tested payload through the tab's shared mutation, is disabled while it is pending, and shows the saving / saved / error states with retry.
    - Locked rows expand to a read-only breakdown.
    - Render tests, tsc and lint (exactly 1 warning) pass. STEPPER-OK is printed.
  </done>
</task>

<task type="auto">
  <name>Task 3: Finanças tiles and Kit de Aventureiro card; final tab composition and full gate</name>
  <files>components/character/skills-kit/finances-card.tsx, components/character/skills-kit/adventure-kit-card.tsx, components/character/skills-kit-tab.tsx, components/character/skills-kit-tab.render.test.ts</files>
  <read_first>
    - components/character/skills-kit-tab.tsx: the old Finanças and Kit JSX that Task 1 left in place. It is the behavioral source for field keys, labels, payloads and the error handling to move.
    - .planning/design/ferro-brasa/Ficha.dc.html lines 361-388 (Finanças and Kit markup)
    - lib/api/character-concurrency.ts (isCharacterConflictError export)
  </read_first>
  <action>
    Create components/character/skills-kit/finances-card.tsx, exporting FinancesCard.
    - Props: character, characterId, isEditMode.
    - SectionCard: title "Finanças", data-section "finances" (character-layout's navigation target, kept), action a Coins icon (size-[18px] text-muted-foreground aria-hidden).
    - Body: a grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-1.5 of five tiles in today's order: ouro, prata, cobre, imperano, joias. Labels: Ouro, Prata, Cobre, Imperano, Joias (`<decisions>` 9).
    - Each tile: a div with flex flex-col gap-0.5 rounded-(--radius) border bg-muted px-2.5 py-2. It holds a text-[13px] text-muted-foreground label and the existing EditableNumberField with exactly today's props: section "finances", that field key, value finances[key] || 0, currentCharacterData character and isEditMode. Use displayClassName text-[22px] font-semibold and className w-full.
    - Do not use StatTile here: its value is a span, and the field renders a div.

    Create components/character/skills-kit/adventure-kit-card.tsx, exporting AdventureKitCard.
    - Props: character, characterId, isEditMode, updateCharacterMutation.
    - Local state isStandardOpen, default false.
    - Compute { custom, standard } = partitionAdventureKit(adventureKit).
    - A `run(update, errorMessage, logLabel)` helper:
      - awaits mutateAsync with id characterId and data update
      - in catch, keeps console.error with today's Portuguese label ('Erro ao adicionar item:', 'Erro ao remover item:', 'Erro ao resetar kit:')
      - shows toast.error(errorMessage) from sonner unless isCharacterConflictError(error) (`<decisions>` 10)
      - messages: 'Não foi possível adicionar o item', 'Não foi possível remover o item', 'Não foi possível restaurar o kit'
    - SectionCard: title "Kit de Aventureiro", className gap-2.5, action a Backpack icon (size-[18px] text-muted-foreground aria-hidden). Body, in order:
      1. When the stored kit is empty (both lists empty): the muted text-sm "Nenhum item no kit" (today's text).
      2. When custom is non-empty: a section label (text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground pt-1) with the single template string "Personalizados · {custom.length}". Then one row per entry: flex items-center gap-2 min-h-11 border-t, holding:
         - EditableField: section "adventureKit", field as the template string "{entry.index}.name", value entry.item.name, placeholder "Nome do item", currentCharacterData character, isEditMode, className flex-1 min-w-0
         - a muted "×" span
         - EditableNumberField: field "{entry.index}.quantity", value entry.item.quantity || 1, min 0, className w-16, displayClassName text-[17px] font-semibold
         - only when isEditMode (hidden when locked, `<decisions>` 6): a ghost Button size-11 text-destructive with an X icon and aria-label as the template string "Remover {entry.item.name || 'item'}". It runs buildRemoveKitItemUpdate(adventureKit, entry.index) and is disabled while updateCharacterMutation.isPending.
         The field paths and removal MUST use entry.index, the storage index, never the display position.
      3. When isEditMode: an "Adicionar item" button, h-11 w-full border border-dashed border-input rounded-(--radius) text-muted-foreground, flex center gap-1.5, with a Plus icon. It runs buildAddKitItemUpdate(adventureKit) and is disabled while pending.
      4. A type="button" toggle with aria-expanded and aria-controls "kit-standard-items": h-11 flex items-center justify-between border-t, the same uppercase label classes, text as the single template string "Itens padrão · {standard.length}", and ChevronDown or ChevronUp (size-[18px]). It always renders (`<decisions>` 6).
      5. When isStandardOpen: a div with id "kit-standard-items" and one row per standard entry: flex items-center justify-between gap-2.5 min-h-10 border-t, the name as plain text-[15px] (standard names are not editable today), and "×" plus the EditableNumberField for "{entry.index}.quantity" (value || 1, min 0, displayClassName text-base font-semibold text-muted-foreground).
         After the rows, when isEditMode: a ghost Button h-11 with a RotateCcw icon, "Restaurar kit padrão". It runs buildResetKitUpdate() in one tap (today's Reset, same payload) and is disabled while pending.

    Finalize components/character/skills-kit-tab.tsx:
    - Remove the old Finanças and Kit JSX and every import it alone used.
    - Render SkillsCard, FinancesCard and AdventureKitCard in that order, inside the layout wrapper chosen in Task 1. The mutation cards receive the single updateCharacterMutation.
    - The file stays a thin composition of at most 120 lines, with a header comment matching its path.

    Extend skills-kit-tab.render.test.ts:
    - Fixture A gets adventureKit [{ name 'Cantil 3 Litros', quantity 1, isDefault true }, { name 'Espelho', quantity 1, isDefault true }, { name 'Lamparina de Cinto', quantity 1, isDefault false }] and finances { ouro: 100 }.
    - Unlocked:
      - html contains 'data-section="finances"', 'Joias', 'Personalizados · 1', 'Itens padrão · 2' and 'Adicionar item'
      - the index of 'Lamparina de Cinto' is lower than the index of 'Itens padrão · 2'
      - html does not contain 'Cantil 3 Litros' (collapsed by default)
    - Locked: html contains neither 'Adicionar item' nor 'Remover Lamparina'. Edit-only controls are hidden when locked (`<decisions>` 6).
    - A fixture with adventureKit [] contains 'Nenhum item no kit'.
    - mutateAsync is still never called on render.

    Run the full gate and record the final bun test count, then commit as feat(261101-mvx).
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && for f in skills-kit-model.ts skills-card.tsx skill-row.tsx skill-stepper.tsx finances-card.tsx adventure-kit-card.tsx; do test -f "components/character/skills-kit/$f" || { echo "missing $f"; exit 1; }; [ "$(wc -l < "components/character/skills-kit/$f")" -le 300 ] || { echo "too long: $f"; exit 1; }; done && [ "$(wc -l < components/character/skills-kit-tab.tsx)" -le 120 ] && grep -q 'data-section="finances"' components/character/skills-kit/finances-card.tsx && grep -q 'partitionAdventureKit' components/character/skills-kit/adventure-kit-card.tsx && grep -q 'entry.index}.name' components/character/skills-kit/adventure-kit-card.tsx && grep -q 'entry.index}.quantity' components/character/skills-kit/adventure-kit-card.tsx && grep -q 'buildRemoveKitItemUpdate(adventureKit, entry.index)' components/character/skills-kit/adventure-kit-card.tsx && grep -q 'buildResetKitUpdate' components/character/skills-kit/adventure-kit-card.tsx && grep -q 'isCharacterConflictError' components/character/skills-kit/adventure-kit-card.tsx && grep -q 'FinancesCard' components/character/skills-kit-tab.tsx && grep -q 'AdventureKitCard' components/character/skills-kit-tab.tsx && [ "$(grep -c 'useUpdateCharacter()' components/character/skills-kit-tab.tsx)" -eq 1 ] && ! grep -rq 'dangerouslySetInnerHTML' components/character/skills-kit components/character/skills-kit-tab.tsx && bun test components/character/skills-kit-tab.render.test.ts components/character/skills-kit/skills-kit-model.test.ts && B=$(cat "$(git rev-parse --git-path gsd-261101-mvx-base)") && git cat-file -e "$B^{commit}" && D=$(git diff --name-only "$B" -- lib prisma package.json bun.lock components/ui components/forms components/character/quick-actions-bar.tsx components/character/types.ts components/character/index.ts components/character/basic-info components/character/spells-talents components/character/notes components/character/basic-info-tab.tsx components/character/spells-talents-tab.tsx components/character/notes-tab.tsx) && [ -z "$D" ] && npx tsc --noEmit && bun run lint 2>&1 | grep -q '(0 errors, 1 warning)' && bun test && bun run build && echo SKILLS-KIT-OK</automated>
    <human-check>
      End-of-phase walkthrough, using `bun dev`. Open a character that already has distributed skill points, then open the Perícias tab.
      1. Disponíveis, Gastos and Restantes match what the tab showed before this batch for the same character: (level+1)*10, and the sum of distributed over the SKILLS keys. Restantes turns red when negative.
      2. "Em uso · N" lists only skills with points, grouped under the six category headers. "Todas · 36" lists every skill. Each total matches the old tab's total for that skill.
      3. Locked: tap a row. It expands to show Distribuídos, Bônus and "Base 1 · Nível +N" as plain text, with no steppers.
      4. Unlocked:
         - Tap plus on Distribuídos: a spinner, then a check. The row total and Gastos/Restantes go up by 1.
         - Tap the number and type 5, then Enter: it saves as before.
         - Minus is disabled at 0.
         - The row stays visible under "Em uso" while it is open, even at 0.
      5. Offline (DevTools): a stepper tap shows the error state and "Não salvou · tentar de novo". Back online, retry saves.
      6. Finanças:
         - Five tiles. Edit Ouro.
         - The quick-actions "Finanças" navigation, if 261101-mvv kept it, still scrolls to the card.
      7. Kit:
         - Custom items appear first under "Personalizados · N".
         - "Adicionar item" appends an empty custom item; rename it.
         - Remove a custom item that is not the last in storage, and confirm the right item disappears.
         - "Itens padrão · N" expands, and quantities are editable.
         - "Restaurar kit padrão" restores the 23 default items, as Reset did.
      8. Toggle dark/light: every card uses the design tokens, and touch targets are at least 44px.
    </human-check>
  </verify>
  <done>
    - The tab is a thin composition of SkillsCard, FinancesCard and AdventureKitCard sharing one useUpdateCharacter(). Every non-test file in the new folder is at most 300 lines.
    - Finanças and Kit keep every field key, payload and capability, including the restore action. Kit edits and removals use storage indexes.
    - lib/, components/ui/, components/forms/, the other tabs, types.ts, index.ts, prisma and the package files are unchanged since the item's base commit.
    - tsc, lint (exactly 1 warning), the full bun test suite and the build pass. SKILLS-KIT-OK is printed.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| stored character JSON → tab render | skills, adventureKit and finances are loosely typed Json columns (CharacterFull uses z.any for reads) and may hold legacy keys, null entries or extra fields |
| inline UI (steppers, kit actions, editable fields) → PUT /api/characters/:id | every write goes through useUpdateCharacter (save queue, expectedUpdatedAt, 409 handling), and the server validates skills, adventureKit and finances with the API-01 Zod schemas |

## STRIDE Threat Register

ASVS level 1; block on: high.

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-mvx-01 | Tampering (lost or stale writes) | SkillStepper, kit add/remove/restore, typed EditableField saves | medium | mitigate (residual accepted) | The parity-tested model helpers build the payloads from props.<br>Steppers and kit actions use the tab's useUpdateCharacter instance and are disabled while it is pending (today's quick-add guard, extended), so two of those taps cannot both build from stale props.<br>Typed fields (stepper center value, Finanças tiles, kit name/quantity) keep EditableField's own internal instance, as today.<br>Every instance's write passes through the module-level per-character save queue in lib/api/character-concurrency.ts with expectedUpdatedAt, so writes never run concurrently.<br>Accepted residual risk, unchanged from today: a stepper tap during a pending typed save builds its payload from props that save has not refreshed yet, and can overwrite the typed value. No new serialization machinery is added (`<decisions>` 7). |
| T-mvx-02 | Tampering (wrong item edited or removed) | AdventureKitCard, with custom items shown first | medium | mitigate | partitionAdventureKit carries each item's storage index. EditableField paths and buildRemoveKitItemUpdate use entry.index, never the display position. The model test checks the indexes and the removal parity, and the Task 3 gate greps the entry.index field paths |
| T-mvx-03 | Tampering (data loss from rebuilt objects or renamed keys) | buildSkillStepUpdate, kit builders | medium | mitigate | The helpers spread the existing skills object and skill entry, exactly like the legacy code, so unknown stored keys (atuacao, ataqueSurpresa) and extra fields survive. SKILLS keys and field paths are unchanged. The tests assert preservation and no input mutation, and the Task 3 diff gate proves lib/ is untouched |
| T-mvx-04 | Tampering / Information disclosure (stored XSS via item or skill names) | AdventureKitCard, SkillRow | low | mitigate | Names render as React text only. The Task 3 gate fails on any dangerouslySetInnerHTML in the new folder or the tab |
| T-mvx-05 | Denial of service (tab crash on malformed stored JSON) | skills-kit-model | low | mitigate | toSkillValue normalizes null, missing and NaN skill values. partitionAdventureKit treats a non-array kit as empty and skips non-object entries. The tests cover null entries, {} and undefined |
| T-mvx-06 | Information disclosure (error text) | SkillStepper, kit toasts | low | accept | The UI shows fixed pt-BR messages, never the server error text. console.error keeps the error object, as CLAUDE.md allows. No auth by design (project decision) |
| T-mvx-SC | Tampering | npm/bun package installs | low | accept | No packages are installed. lucide-react, sonner and the shadcn Button already exist. The Task 3 diff gate fails if package.json or bun.lock change |
</threat_model>

<verification>
Full gate, run from the repo root after Task 3:
- `npx tsc --noEmit` exits 0
- `bun run lint` prints "(0 errors, 1 warning)", the pre-existing route.ts warning only
- `bun test` exits 0, including skills-kit-model.test.ts and skills-kit-tab.render.test.ts
- `bun run build` exits 0
- `git diff --name-only <mvx base> -- lib prisma package.json bun.lock components/ui components/forms components/character/{quick-actions-bar.tsx,types.ts,index.ts,basic-info,spells-talents,notes,basic-info-tab.tsx,spells-talents-tab.tsx,notes-tab.tsx}` is empty
- Every non-test file in components/character/skills-kit/ is at most 300 lines, and skills-kit-tab.tsx is at most 120
- Human walkthrough (end-of-phase mode): Task 3's `<human-check>`
</verification>

<success_criteria>
- The Perícias & Kit tab matches the design pericias screen: points strip, segmented filter, grouped expandable rows with steppers, Finanças tiles, and a kit with custom items first and collapsible standard items
- The skill-point pool, totals, SKILLS keys and every persisted field path are identical to the pre-redesign tab, proven by parity tests
- Every write goes through the existing useUpdateCharacter mutation. Steppers and kit add/remove/restore use the tab's single instance and are guarded by its isPending. Typed fields keep EditableField's own internal instance. All instances are serialized per character by the module-level save queue in lib/api/character-concurrency.ts.
- No change outside the tab file and the new components/character/skills-kit/ folder
- tsc, lint (no new warnings), bun test and build pass
</success_criteria>

<output>
Create `.planning/quick/261101-mvx-redesign-per-cias-kit-tab-ds-05-rebuild-components-character/261101-mvx-SUMMARY.md` when done. Include:
- the `<decisions>` list, plus any new design-vs-behavior decision taken during execution (owner rule: look from the mock, behavior from the app)
- whether the skills-overview button was kept or omitted after 261101-mvv (`<decisions>` 8), and why
- whether the stepper saved-timer fallback was needed
- the final line count of each new file and the final bun test count
- the open questions left untouched: the SKILLS key mismatch (`atuação`/`ataqueSupresa`/`concentração`/… vs stored `atuacao`/`ataqueSurpresa`/…) and the (level+1)*10 vs level*10 pool
- the observation that a restore writes DEFAULT_ADVENTURE_KIT items without isDefault, so they then list as custom items. This is today's behavior, kept.
- the write-path note from `<decisions>` 7:
  - steppers and kit actions use the tab's instance; typed fields use EditableField's own
  - lib/api/character-concurrency.ts serializes all instances per character through a module-level queue
  - the accepted residual risk: a stepper tap during a pending typed save builds from props that save has not refreshed yet
</output>
