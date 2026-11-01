---
phase: quick-261101-mvy
plan: 01
type: execute
wave: 6                     # ADVISORY ONLY: authoritative wave is recomputed by `quick-batch update` from depends_on
depends_on: ["261101-mvt", "261101-mvv"]   # mvt: SectionTitle/DiamondMarker/tokens/restyled editable primitives; mvv: the sheet column flow this tab sits in
files_modified:
  - lib/spells-talents.ts
  - lib/spells-talents.test.ts
  - components/character/spells-talents/magic-list.tsx
  - components/character/spells-talents/spells-card.tsx
  - components/character/spells-talents/spell-body.tsx
  - components/character/spells-talents/talents-card.tsx
  - components/character/spells-talents/talent-body.tsx
  - components/character/spells-talents-tab.tsx
  - components/character/spells-talents.render.test.ts
autonomous: true
requirements: [DS-06]

must_haves:
  truths:
    - "The Magias & Talentos tab shows a segmented toggle 'Magias · N' / 'Talentos · N' (aria-pressed). It shows one list at a time, and each count is the stored array length"
    - "Each list has a search field, 'Todos / Nv N' level chips built from the levels present, and a count line. Spell search covers name, type and description; talent search covers name and description; both ignore case and accents. Toggle, search, chip and open/edit state live only in local React state and are never written"
    - "Entries render in cards grouped by level in ascending order. Each card has a 'Nível N' title with a diamond marker and a count, and keeps stored array order inside the group. Every field path, delete, used-today toggle and once-per-day toggle uses the entry's ORIGINAL array index, never its position in the filtered list"
    - "A collapsed row shows the name, a sub line and a chevron. Spell sub line: type · 'Dano <scaled total>' · range. Talent sub line: first non-empty description line. Spells also show a Berkana cost badge, and talents with oncePerDay true show a '1× ao dia' badge. Several rows can be open at once (current multi-expand kept)"
    - "An expanded spell row shows a 'Dano' highlight with the same total and formula EditableScalingField shows for those inputs (calculateScaledValue over normalizeScalingData, spell.level || 0, character.level || 0). Below it: a 2-column Tipo / Alcance / Duração / Preparo / Resistência / Concentração grid, then the description as plain text with preserved line breaks. An expanded talent row shows its description the same way"
    - "When unlocked: 'Nova magia' / 'Novo talento' appends the same default object as today, then clears the filters and opens the new row in edit view. Editar switches a row to the existing inline fields: the same Editable* components with the same section, field path and props, so level-scaling editing of damage and duration is kept. Concluir returns to the read view. Excluir removes the entry with the same payload as today. When locked, Nova/Novo, Editar, Excluir and the once-per-day toggle are hidden, not rendered disabled (decision 8)"
    - "Talent capabilities the mock does not show keep their current writes and availability: the 'usado hoje' checkbox (locked or unlocked), 'Novo dia' (shown when a once-per-day talent is used) and the once-per-day toggle in edit view"
    - "Nothing under lib/calculations, lib/schemas, lib/api, lib/store, components/ui, components/forms, quick-actions-bar.tsx, types.ts, index.ts, prisma, package.json or bun.lock changes. npx tsc --noEmit, bun run lint (same summary as the item's baseline: 0 errors, no new warnings), bun test and bun run build pass"
  artifacts:
    - path: "lib/spells-talents.ts"
      provides: "Framework-free filter/group/label helpers for the tab"
      exports: ["MagicView", "LevelFilter", "MagicEntry", "MagicLevelGroupData", "toEntryLevel", "listLevels", "resolveLevelFilter", "normalizeSearchText", "matchesQuery", "groupEntriesByLevel", "countGroupedEntries", "magicCountNoun", "magicResultLabel", "firstLine", "isBlankScaledTotal", "spellSubLine", "removeIndexFromSet"]
    - path: "lib/spells-talents.test.ts"
      provides: "bun tests for every helper"
    - path: "components/character/spells-talents/magic-list.tsx"
      provides: "Presentational toolbar, level group card, collapsible row, row actions, badges and empty state shared by both lists"
      exports: ["MagicListToolbar", "MagicLevelGroup", "MagicEntryRow", "MagicEntryActions", "MagicCostBadge", "MagicOncePerDayBadge", "MagicEmptyState"]
    - path: "components/character/spells-talents/spell-body.tsx"
      provides: "Spell read view (damage highlight, stats grid, pre-line description), the existing inline field grid, and the shared scaled-value helper"
      exports: ["getSpellScaledValues", "SpellDetails", "SpellEditFields"]
    - path: "components/character/spells-talents/talent-body.tsx"
      provides: "Talent read view and the existing inline field grid with the once-per-day toggle"
      exports: ["TalentDetails", "TalentEditFields"]
    - path: "components/character/spells-talents/spells-card.tsx"
      provides: "Spells list: local search/level/expanded/editing state plus the add and delete writes"
    - path: "components/character/spells-talents/talents-card.tsx"
      provides: "Talents list: local state plus the add, delete, used-today, reset and once-per-day writes"
    - path: "components/character/spells-talents-tab.tsx"
      provides: "Magias/Talentos segmented toggle and the column-span wrapper"
    - path: "components/character/spells-talents.render.test.ts"
      provides: "renderToString smoke tests: grouping order, scaled damage in the sub line, badges, locked/unlocked actions, no fetch on render"
  key_links:
    - from: "components/character/spells-talents/spells-card.tsx"
      to: "lib/spells-talents.ts"
      via: "groupEntriesByLevel + listLevels + resolveLevelFilter + magicResultLabel + removeIndexFromSet"
      pattern: "groupEntriesByLevel"
    - from: "components/character/spells-talents/talents-card.tsx"
      to: "lib/spells-talents.ts"
      via: "same helpers, with talent search fields"
      pattern: "groupEntriesByLevel"
    - from: "components/character/spells-talents/spell-body.tsx"
      to: "components/ui/editable-scaling-field.tsx"
      via: "normalizeScalingData + calculateScaledValue (imported, never re-implemented)"
      pattern: "calculateScaledValue"
    - from: "components/character/spells-talents/magic-list.tsx"
      to: "components/ui/section-card.tsx"
      via: "SectionTitle (tone berkana for spells, primary for talents) on each level group"
      pattern: "SectionTitle"
    - from: "components/character/spells-talents-tab.tsx"
      to: "components/character/spells-talents/spells-card.tsx"
      via: "segmented toggle renders SpellsCard or TalentsCard, sharing the one useUpdateCharacter instance"
      pattern: "aria-pressed"
---

<objective>
Redesign the Magias & Talentos tab (DS-06) to the Ferro & Brasa "magias" screen:
- a Magias/Talentos segmented toggle
- a search field, plus a "Nova" button when unlocked
- horizontal level filter chips
- cards grouped by level
- collapsible rows: name, sub line, Berkana cost badge, and a "1× ao dia" badge for talents
- an expanded read view: damage highlight, 2-column stats, description with preserved line breaks, and Editar/Excluir when unlocked

All persisted fields, write payloads and the EditableScalingField level scaling stay exactly as they are.

Purpose: at the table, players need to find a spell fast (search, level chips) and read its scaled damage at a glance, without losing the inline editing, scaling editing and daily-use tracking they have today.

Output:
- a framework-free helper module with tests
- one presentational list module
- two body modules (spell, talent)
- the restyled spells and talents cards
- the restyled tab
- a render smoke test

OWNER RULE: follow it, and record every application in the SUMMARY. It is in .planning/design/ferro-brasa/README.md, section "Important: the design is visual direction, not a functional spec":
- Follow the mock's LOOK and LAYOUT.
- Keep the CURRENT app's BEHAVIOR wherever the mock differs: formulas, what each write changes, available fields and actions, validation, ordering, persisted keys.
- Add a mock-only feature only when it is a pure UI convenience over existing fields.
- Never drop an existing capability to match the mock.
- Record each such decision in the SUMMARY.

The decisions already made for this item are listed in `<mock_vs_current_decisions>`. Copy that table into the SUMMARY, and add any new case you hit.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.claude/CLAUDE.md
@.planning/design/ferro-brasa/README.md
# Ficha.dc.html is ~106 KB: read ONLY lines 393-460 (magias markup) and 828-852 (magGroups/levelChips/magTabs derivation).
# The mock data (SPELLS/TALENTS around lines 704-724) is illustrative only.
@.planning/design/ferro-brasa/Ficha.dc.html
# Foundation contract: read its <interfaces> block. If 261101-mvt-SUMMARY.md exists, its copy of the block wins.
@.planning/quick/261101-mvt-redesign-foundation-ds-01-implement-the-ferro-brasa-design-s/261101-mvt-PLAN.md
@components/character/spells-talents-tab.tsx
@components/character/spells-talents/spells-card.tsx
@components/character/spells-talents/talents-card.tsx
@components/character/types.ts
@components/ui/editable-scaling-field.tsx
@components/ui/section-card.tsx
@lib/schemas/character.ts
@lib/notes.ts
@components/character/notes-tab.render.test.ts

<interfaces>
Facts the executor needs. They were checked against the tree at planning time.

Data shapes (lib/schemas/character.ts). characterFullSchema types spells and talents as z.any(), so `character.spells` and `character.talents` are `any`. Guard them with Array.isArray.
- Spell (spellSchema, every key optional, unknown keys preserved):
  - strings: name, type, concentration, prepTime, resistance, range, description
  - numbers: level, berkanaCost
  - damage and duration are ScalingValue: an object { base?: number|string, perLevel?: number|null }, a LEGACY STRING like "5000 + 1000 P/N", a number, or null
  - The preparation key is `prepTime`. No `preparationTime` key exists anywhere in the code.
- Talent (talentSchema): name, description, level, oncePerDay (boolean), usedToday (boolean).

Scaling (components/ui/editable-scaling-field.tsx). Restyled by 261101-mvt; its pure functions are byte-identical and MUST NOT be edited:
- `normalizeScalingData(data: ScalingValue, type: 'damage' | 'duration'): ScalingData`. It handles the object, legacy string, number and null shapes; null falls back to base 0 for damage or '' for duration.
- `calculateScaledValue(base, perLevel, spellLevel, characterLevel): { total: string; bonus: number; formula: string }`.
- `EditableScalingField` props: characterId, currentCharacterData, section, field, scalingData, spellLevel, characterLevel, label, type, isEditMode, className.
- Current call sites pass:
  - `scalingData={spell.damage || { base: 0, perLevel: null }}`
  - `scalingData={spell.duration || { base: '', perLevel: null }}`
  - `spellLevel={spell.level || 0}` and `characterLevel={character.level || 0}`
- Its read-only view shows calculated.total, then "(formula)" when normalized perLevel > 0.

Foundation (261101-mvt), components/ui/section-card.tsx:
- `SectionTitle({ children, tone?: 'primary' | 'berkana', headingLevel?: 'h2' | 'h3', className? })`
- `DiamondMarker({ tone, className })`
- Tokens/utilities: text-berkana, bg-berkana, border-primary, text-primary, shadow-card, font-numeric, animate-ficha-spin, rounded-(--radius).

Current write payloads. They are the behavior contract and MUST stay identical:
- Spell add: `[...spells, newSpell]` with newSpell = { name: '', level: 0, berkanaCost: 0, type: '', concentration: '', duration: { base: '', perLevel: null }, prepTime: '', resistance: '', range: '', damage: { base: 0, perLevel: null }, description: '' }
- Spell delete: `spells.filter((_, i) => i !== index)`
- Talent add: `[...talents, { name: '', level: 0, description: '', oncePerDay: false, usedToday: false }]`
- Talent delete: filter by index
- toggleTalentUsed(index, currentValue): maps the talent to `{ ...t, usedToday: !currentValue }`
- resetAllTalentsUsage: maps every talent to `{ ...t, usedToday: false }`
- Once-per-day: maps the talent to `{ ...t, oncePerDay: checked, usedToday: checked ? t.usedToday : false }`, guarded by `if (!isEditMode) return`
- Every write is `updateCharacterMutation.mutateAsync({ id: characterId, data: { spells | talents: ... } })` inside try/catch with the existing console.error message
- mutateAsync call-site count: spells-card 2, talents-card 5. Keep these counts, and keep all writes in the card files. The body files perform no writes of their own; inline fields write through their own primitives as today. Do not name the mutation method in source comments: the call-site gates count it on non-comment lines.

Existing inline field set. Keep it EXACTLY: the same component, `section`, `field` template (with the variable named `index`), value expression, placeholder, label, type, rows and isEditMode props.
- Spells, 11 paths (`${index}.<key>`): name (EditableField), level (EditableNumberField), berkanaCost (EditableNumberField), type, concentration, prepTime, resistance, range (EditableField), damage and duration (EditableScalingField), description (EditableTextArea, rows 2).
- Talents: name, level, description, plus the Checkbox with id `talent-${index}-oncePerDay`.
- Only layout wrappers (grid classes) may change.

Render-test constraint: components/character/notes-tab.render.test.ts calls mock.module('@/lib/api/queries') process-wide and asserts useUpdateCharacter call counts. The new render test MUST NOT mock that module. Instead:
- render SpellsTalentsTab inside QueryClientProvider with a fresh QueryClient. This works with either the real or the mocked module.
- render TalentsCard directly, with a fake updateCharacterMutation object ({ mutateAsync: mock, isPending: false }) cast to UpdateCharacterMutation.
- Import the components dynamically, as the notes test does.
</interfaces>
</context>

<mock_vs_current_decisions>
Apply the owner rule (README "Important: the design is visual direction, not a functional spec"). Copy this table into the SUMMARY.

| # | Mock shows | Current app | Decision |
|---|-----------|-------------|----------|
| 1 | One row open at a time (openMag single id) | Many rows open at once (Set of indices) | Keep multi-expand (current capability) |
| 2 | "1× ao dia" detected by regex on description, spells included | Real persisted `oncePerDay` on talents only | Badge from `talent.oncePerDay` only; spells show no once badge |
| 3 | No "usado hoje", "Novo dia" or once-per-day toggle | All three exist and write | Keep all three with identical writes and availability (owner: never drop them) |
| 4 | Damage/duration as fixed strings | Level-scaled via normalizeScalingData + calculateScaledValue; editable via EditableScalingField | Display uses the existing functions; scaling editing kept in edit view |
| 5 | Preparo hard-coded "Inst.", Concentração "50%" | prepTime / concentration fields | Show the real fields ("—" when empty) |
| 6 | Read view + Editar | Fields always inline-editable when expanded and unlocked | Editar switches the row to the SAME inline fields; Concluir returns. No new edit mechanism |
| 7 | (item text) "keep the existing create/edit/delete dialogs" | No such dialogs exist: create appends a blank entry, edit is inline, delete is immediate | The item text assumed dialogs that do not exist (coordinator mistake, confirmed). The owner rule resolves it as "keep current flows": append a blank entry, edit inline, delete immediately. No confirm dialog is added, because it would change delete behavior. Suggest a confirm as a follow-up in the SUMMARY |
| 8 | Edit-only controls absent when locked | Edit-only controls rendered but disabled when locked | Coordinator decision for all tabs: edit-only controls are HIDDEN when the sheet is locked, as in the design, instead of rendered disabled. Each capability is unchanged whenever the sheet is unlocked. Per control: (a) "+ Adicionar Magia" / "+ Adicionar Talento", now the "Nova magia" / "Novo talento" button: disabled → hidden; (b) the row delete "×", now "Excluir": disabled → hidden; (c) "Editar" / "Concluir": new, not rendered when locked (locked rows show the read view, as the fields were read-only before); (d) the once-per-day "Uso limitado" checkbox: disabled → hidden (it lives in the edit view, which only exists when unlocked). Not edit-only, so unchanged and visible while locked: the "usado hoje" checkbox and "Novo dia". "Excluir" is still disabled while a save is pending, as today |
| 9 | Grouped by level | Flat list in stored order | Group by level for display only (item asks for it); stored array order never changes; stored order kept inside a group |
| 10 | Search / chips / toggle | Not present | Add: pure UI conveniences over existing fields, local state only |
| 11 | Chips 38px tall | n/a | 44px (README touch-target rule) |
| 12 | Spell sub line "Dano X · alcance" | "Nível N • Custo: C" | type · Dano <scaled total> · range (the item says "type/sub line"); damage omitted when the total is blank or "0" |
| 13 | Spells and talents one at a time | Side by side on xl | Follow the item's segmented toggle (layout) |
| 14 | No fixed-height scroll box | 70vh / 24rem scroll box per card | Remove the scroll box; the page scrolls in the column flow (layout) |
| 15 | n/a | Selected level filter may disappear after an edit or delete | Fall back to "Todos" (resolveLevelFilter) |
| 16 | n/a | New entry appears collapsed at the end | After a successful add: clear the filters and open the new row in edit view (UI convenience; payload unchanged) |
</mock_vs_current_decisions>

<coverage_audit>
| Source | Item | Covered by |
|--------|------|------------|
| GOAL | Magias/Talentos segmented toggle | Task 1 (tab) |
| GOAL | Search field | Task 1 (toolbar + matchesQuery) |
| GOAL | "Nova" button when unlocked | Task 1 (spells), Task 2 (open new row in edit view), Task 3 (talents) |
| GOAL | Horizontal level filter chips | Task 1 (listLevels/resolveLevelFilter + chips) |
| GOAL | Cards grouped by level | Task 1 (groupEntriesByLevel + MagicLevelGroup) |
| GOAL | Collapsible rows: name, type/sub line, Berkana cost badge, "1× ao dia" for talents | Task 1 (spells), Task 3 (talents) |
| GOAL | Expanded body: damage highlight, 2-column stats, pre-line description | Task 2 (SpellDetails), Task 3 (TalentDetails) |
| GOAL | Editar/Excluir when unlocked | Task 1 (Excluir), Task 2 (Editar/Concluir), Task 3 (talents) |
| GOAL | Keep create/edit/delete flows, EditableScalingField scaling, all persisted fields | Tasks 1-3 payload/field-path/mutateAsync-count gates; decision 7 |
| CONTEXT (coordinator) | Real data shapes incl. legacy damage strings and null; talents oncePerDay/usedToday | Task 2 getSpellScaledValues via normalizeScalingData; Task 3 render test (legacy string + null) |
| CONTEXT (coordinator) | Descriptions white-space pre-line, plain text only | Tasks 2-3 (whitespace-pre-line, never inject HTML) + T-mvy-02 gate |
| CONTEXT (coordinator) | Search/chips/toggle local state; pure helper + bun test | Task 1 (lib/spells-talents.ts + test) |
| CONTEXT (coordinator) | spells-card.tsx under ~300 lines | Task 2 gate (all files < 300) |
| CONTEXT (coordinator) | Don't edit mvv/mvt files; reuse editable-scaling-field unchanged | Task 3 final diff gate |
| CONTEXT (coordinator) | DoD tsc/lint/test/build | Task 3 verify + `<verification>` |
| CONTEXT (owner guidance) | Follow look; keep behavior; keep "usado hoje" and scaling editing; record decisions | `<mock_vs_current_decisions>` + Task 3 + SUMMARY |
| RESEARCH (design README) | Diamond markers, 4px radius, 44px targets, font-numeric numbers, dark-first tokens | Tasks 1-3 styling instructions |
| CONTEXT (memory) | No auth by design | Nothing here adds auth |
</coverage_audit>

<tasks>
<!-- planner-discipline-allow: mutateAsync -->

<task type="tracer" tdd="true">
  <name>Task 1: Tracer — tested filter/group helpers wired end-to-end into the toggle, toolbar, chips and grouped spell rows</name>
  <files>lib/spells-talents.ts, lib/spells-talents.test.ts, components/character/spells-talents/magic-list.tsx, components/character/spells-talents/spells-card.tsx, components/character/spells-talents-tab.tsx</files>
  <precondition>261101-mvt has landed: components/ui/section-card.tsx exports SectionTitle, and components/ui/editable-scaling-field.tsx still exports normalizeScalingData and calculateScaledValue (check: grep -q 'export function SectionTitle' components/ui/section-card.tsx && grep -q 'export function calculateScaledValue' components/ui/editable-scaling-field.tsx)</precondition>
  <read_first>
    - .planning/design/ferro-brasa/Ficha.dc.html lines 393-460 and 828-852 only
    - .planning/design/ferro-brasa/README.md, the "Important: the design is visual direction" section
    - the 261101-mvt `<interfaces>` block, or its SUMMARY copy if 261101-mvt-SUMMARY.md exists
    - components/character/spells-talents-tab.tsx, components/character/spells-talents/spells-card.tsx (whole files)
    - components/forms/character-layout.tsx as left by 261101-mvv. Only check whether the TabsContent sits inside a multi-column container; do not edit it
    - lib/notes.ts (style of a framework-free lib module) and lib/notes.test.ts (bun:test style)
  </read_first>
  <behavior>
    - toEntryLevel: 3 → 3; undefined → 0; null → 0; '4' → 4; 'abc' → 0; NaN → 0; 2.5 → 2.5
    - listLevels([{level:2},{level:0},{},{level:2},{level:5},null]) → [0, 2, 5]. Missing level and null count as 0.
    - resolveLevelFilter: (3, [0,2]) → 'todos'; (2, [0,2]) → 2; ('todos', []) → 'todos'
    - normalizeSearchText('  Alteração  ') → 'alteracao'. Lower-case, NFD, strip U+0300–U+036F, trim.
    - matchesQuery:
      - ['Alteração de Combate'] with 'alteracao' → true
      - ['Fogo', undefined, 3] with 'fogo' → true. Non-strings are ignored.
      - ['Fogo'] with '   ' → true. A blank query matches everything.
      - ['Fogo'] with 'gelo' → false
    - groupEntriesByLevel(items, { level, query, searchFields }):
      - groups sorted by ascending level; entries inside a group keep stored order
      - each entry carries its ORIGINAL index: an item stored at index 3 with level 1 shows up in group 1 with index 3
      - a missing level is grouped under 0
      - a numeric level filter keeps only that level
      - the query matches via searchFields; query and level combine
      - empty input → []
      - groups with no entries are omitted
    - countGroupedEntries(groups) → total number of entries
    - magicCountNoun: ('magias',1) → '1 magia'; ('magias',2) → '2 magias'; ('talentos',1) → '1 talento'; ('talentos',0) → '0 talentos'
    - magicResultLabel:
      - ('magias', 4, 4) → '4 magias, por nível · toque para ver detalhes'
      - ('talentos', 1, 1) → '1 talento, por nível · toque para ver detalhes'
      - ('magias', 2, 4) → '2 de 4'
    - firstLine('\n  Combate +4\nDuelo +4') → 'Combate +4'; firstLine(undefined) → ''; firstLine(42) → ''
    - isBlankScaledTotal: '' → true; '  ' → true; '0' → true; '4000' → false; '1d6' → false
    - spellSubLine:
      - ({ type: 'Alteração de Combate', range: '4 Metros' }, '5000') → 'Alteração de Combate · Dano 5000 · 4 Metros'
      - ({ type: '', range: 'Pessoal' }, '0') → 'Pessoal'
      - ({}, '') → ''
      - non-string type or range is ignored
    - removeIndexFromSet:
      - ({0,2,3}, 2) → {0,2}. The removed index is dropped, and later indices shift down by one.
      - ({0,1}, 0) → {0}
      - ({1}, 5) → {1}
      - the input set is not mutated
  </behavior>
  <action>
    Step 0, before editing anything, record the baselines:
    - Write `git rev-parse HEAD` to the path printed by `git rev-parse --git-path gsd-261101-mvy-base`.
    - Write the output of `bun run lint` (stdout and stderr) to the path printed by `git rev-parse --git-path gsd-261101-mvy-lint-base`.

    RED: create lib/spells-talents.test.ts (bun:test; single quotes, no semicolons, like lib/notes.test.ts). Cover every `<behavior>` bullet, importing from '@/lib/spells-talents'. Run it, see it fail, and commit as test(261101-mvy).

    GREEN: create lib/spells-talents.ts. It must be framework-free: no React, no '@/components/*' imports, no '@/lib/api/*' imports, so `bun test` loads it directly. Style: single quotes, no semicolons, Portuguese section banners and comments as in lib/notes.ts. Export exactly the names in must_haves.artifacts:
    - `type MagicView = 'magias' | 'talentos'`
    - `type LevelFilter = 'todos' | number`
    - `interface MagicEntry<T> { item: T; index: number; level: number }`
    - `interface MagicLevelGroupData<T> { level: number; entries: MagicEntry<T>[] }`
    - The functions behave as specified in `<behavior>`. groupEntriesByLevel takes `(items: readonly T[], options: { level: LevelFilter; query: string; searchFields: (item: T) => readonly unknown[] })`. It reads the level through toEntryLevel on `(item as { level?: unknown } | null)?.level`, so a null element never throws.
    - Use the explicit U+0300–U+036F range for diacritics. A Unicode property escape needs ES2018, and tsconfig targets ES2017, so tsc would reject it.
    - Run the tests (green) and commit as feat(261101-mvy).

    Then create components/character/spells-talents/magic-list.tsx. It is presentational only and holds no persistence. Style: single quotes, no semicolons, 2 spaces, cn from '@/lib/utils', icons from lucide-react. All values come from mock lines 395-455, and every touch target is at least 44px. Exports:
    - `MagicListToolbar({ query, onQueryChange, placeholder, actions?, levels, activeLevel, onLevelChange, countLabel? })` renders a column with gap-2.5 and max-w-[720px]:
      - Search row: a label (flex-1, min-w-0, h-[46px], flex, items-center, gap-2.5, px-3, border, border-input, rounded-(--radius), bg-card, focus-within:border-ring, focus-within:ring-[3px], focus-within:ring-ring/30). Inside it: a Search icon (size-[18px], muted, aria-hidden) and an input (type search, aria-label = placeholder, value/onChange, flex-1, min-w-0, border-0, bg-transparent, outline-none, text-base so iOS does not zoom). Then the `actions` node.
      - Chips row, rendered only when levels is non-empty: flex, gap-1.5, overflow-x-auto, -mx-3, px-3, [scrollbar-width:none]. First a "Todos" chip, then one "Nv N" chip per level. Each chip is a button type button with aria-pressed, h-11, px-3.5, rounded-full, border, font-numeric, tabular-nums, text-[15px], font-semibold, whitespace-nowrap. Active: bg-foreground, text-background, border-foreground. Inactive: bg-transparent, text-foreground, border-border.
      - countLabel, when given: a text-[13px] muted span.
    - `MagicLevelGroup({ level, tone, countLabel, children })` renders a section: break-inside-avoid, mb-3, flex, flex-col, rounded-(--radius), border, bg-card, text-card-foreground, shadow-card. No padding, because rows run edge to edge; this is why it is not SectionCard.
      - Header: flex, items-center, justify-between, gap-2, px-4, py-2.5. It holds SectionTitle (tone; children is ONE template-literal string `Nível ${level}`) and the countLabel span (text-[13px], muted).
    - `MagicEntryRow({ name, sub?, isOpen, onToggle, badges?, leading?, muted?, children })` renders:
      - A wrapper div: border-t, border-border, plus bg-muted when open.
      - Inside it, a flex items-stretch row: the optional `leading` node, then a button type button (aria-expanded, aria-controls = body id from useId) with flex-1, grid, grid-cols-[minmax(0,1fr)_auto_20px], items-center, gap-3, min-h-[60px], py-2, pr-4, text-left. Use pl-4, or pl-1 when leading is present.
        - Name span: text-base, font-semibold, truncate. With `muted`, add line-through and text-muted-foreground.
        - Optional sub span: text-[13px], muted, truncate.
        - Badges column: flex, flex-col, items-end, gap-0.5.
        - ChevronUp when open, ChevronDown when closed: size-[18px], muted, aria-hidden.
      - When open: the body div with that id, flex, flex-col, gap-3, px-4, pb-4, holding children.
      - Nothing interactive is nested inside the toggle button.
    - `MagicEntryActions({ mode: 'view' | 'edit', onEdit?, onDone?, onDelete, deleteDisabled? })` renders a flex gap-2 row of shadcn Buttons, each h-11 px-3.5 with gap-1.5 and a size-4 icon:
      - view mode: "Editar" (variant outline, bg-card, Pencil icon), shown when onEdit is given
      - edit mode: "Concluir" (variant outline, Check icon)
      - always: "Excluir" (variant outline, bg-transparent, text-destructive, Trash2 icon), disabled by deleteDisabled
    - `MagicCostBadge({ cost })`: an inline-flex span, items-center, gap-1, text-berkana, font-numeric, tabular-nums, text-lg, font-semibold. It holds an sr-only "Custo de Berkana: " prefix, an aria-hidden Sparkles size-3.5, and the cost.
    - `MagicOncePerDayBadge()`: a span reading "1× ao dia", with text-xs, px-[7px], py-px, border, border-primary, text-primary, rounded-(--radius), font-semibold, whitespace-nowrap.
    - `MagicEmptyState({ title, hint? })`: a centered muted block, px-3, py-8, text-[15px], with the hint at text-[13px].

    Rewrite components/character/spells-talents/spells-card.tsx. Keep the props interface and the add/delete handler bodies, including their payloads and console.error messages; layout only changes.
    - Remove the card-header button, the Collapsible wrapper and the fixed-height scroll-area primitive, and drop their imports.
    - Read the list as `const spells: Spell[] = Array.isArray(character.spells) ? character.spells : []`.
    - Local state:
      - query (string)
      - level (LevelFilter, 'todos')
      - expanded: Set<number> (multi-expand kept, decision 1)
    - Derived values:
      - levels = listLevels(spells)
      - activeLevel = resolveLevelFilter(level, levels)
      - groups = groupEntriesByLevel(spells, { level: activeLevel, query, searchFields: s => [s?.name, s?.type, s?.description] })
      - shown = countGroupedEntries(groups)
    - Render a column with gap-2.5:
      - MagicListToolbar with placeholder "Buscar magia, tipo ou efeito" and countLabel magicResultLabel('magias', shown, spells.length).
      - actions: when isEditMode, a 46px square primary Button (aria-label "Nova magia", Plus size-5), disabled while updateCharacterMutation.isPending. Its handler is the existing add handler, unchanged.
      - When spells is empty: MagicEmptyState with the current texts 'Nenhuma magia ou habilidade cadastrada' / 'As magias aparecerão aqui conforme forem adicionadas'.
      - Else, when shown is 0: MagicEmptyState 'Nada encontrado com esse filtro.'
      - Otherwise a container with columns-[340px] and gap-x-3, holding one MagicLevelGroup per group. Use tone berkana and countLabel magicCountNoun('magias', n). Inside each group, one MagicEntryRow per entry, keyed by entry.index:
        - name: spell.name || 'Nova Magia'
        - sub: spellSubLine(spell, damageTotal). Compute damageTotal inline for now with normalizeScalingData(spell.damage || { base: 0, perLevel: null }, 'damage') and calculateScaledValue(base, perLevel, spell.level || 0, character.level || 0), both imported from '@/components/ui/editable-scaling-field'. Task 2 moves this into a helper.
        - badges: MagicCostBadge with spell.berkanaCost || 0
        - the row toggles entry.index in `expanded`
    - Row body for this task:
      - the CURRENT eleven inline fields, moved here verbatim with the variable still named `index` (bind it from entry.index). Only the wrapper grid classes change. Put the two scaling fields full width (grid-cols-1), because columns are 340px wide.
      - When isEditMode: MagicEntryActions in view mode, without onEdit (Editar arrives in Task 2). Excluir runs the existing delete handler, disabled while isPending.
    - This file is temporarily over 300 lines. Task 2 brings it under.

    Rewrite components/character/spells-talents-tab.tsx:
    - Keep the single useUpdateCharacter() instance and the props.
    - Local state view: MagicView, initially 'magias'.
    - The root div has [column-span:all] (it spans 261101-mvv's column container if one exists, and is harmless otherwise) plus flex, flex-col, gap-2.5.
    - Segmented toggle: a div with grid, grid-cols-2, p-[3px], bg-muted, rounded-(--radius), max-w-[720px]. It holds two buttons, type button with aria-pressed, each h-[42px], rounded-(--radius), font-semibold, text-[15px], flex, items-center, justify-center, gap-2.
      - Active: bg-card, text-foreground, shadow-card. Inactive: bg-transparent, text-muted-foreground.
      - Icons: Sparkles and Award, size-4, aria-hidden.
      - Labels are single template-literal strings: `Magias · ${spellCount}` and `Talentos · ${talentCount}`. Each count is the Array.isArray-guarded array length.
    - Below it, render SpellsCard or TalentsCard (unchanged until Task 3) for the active view. Keying them by view resets their local state when switching, as the mock does.
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && test -s "$(git rev-parse --git-path gsd-261101-mvy-base)" && test -s "$(git rev-parse --git-path gsd-261101-mvy-lint-base)" && bun test lib/spells-talents.test.ts && ! grep -qE "from '@/(components|lib/api)" lib/spells-talents.ts && grep -q 'groupEntriesByLevel' components/character/spells-talents/spells-card.tsx && grep -q 'MagicListToolbar' components/character/spells-talents/spells-card.tsx && grep -q 'Nova magia' components/character/spells-talents/spells-card.tsx && grep -q 'aria-pressed' components/character/spells-talents-tab.tsx && grep -q 'SectionTitle' components/character/spells-talents/magic-list.tsx && grep -q '1× ao dia' components/character/spells-talents/magic-list.tsx && ! grep -q 'ScrollArea' components/character/spells-talents/spells-card.tsx && [ "$(grep -vE '^\s*(//|\*|\{/\*)' components/character/spells-talents/spells-card.tsx | grep -o 'mutateAsync(' | wc -l)" -eq 2 ] && for f in name level berkanaCost type concentration prepTime resistance range damage duration description; do grep -qF "{index}.$f\`" components/character/spells-talents/spells-card.tsx || { echo "missing field path $f"; exit 1; }; done && npx tsc --noEmit && LB="$(git rev-parse --git-path gsd-261101-mvy-lint-base)" && LN="$(git rev-parse --git-path gsd-261101-mvy-lint-now)" && bun run lint > "$LN" 2>&1 && [ "$(grep -oE '\([0-9]+ errors?, [0-9]+ warnings?\)' "$LN")" = "$(grep -oE '\([0-9]+ errors?, [0-9]+ warnings?\)' "$LB")" ] && bun run build && echo TRACER-OK</automated>
  </verify>
  <done>
    - Helper tests pass, and lib/spells-talents.ts imports no component or API module.
    - The tab shows the segmented toggle. The Magias view shows search, chips, the count line, level-grouped cards and collapsible rows with the cost badge and the scaled-damage sub line. Rows still expand to the unchanged eleven inline fields plus Excluir when unlocked, and "Nova magia" appends the same default object.
    - The Talentos view still renders the old TalentsCard.
    - tsc passes, the lint summary equals the baseline, the build passes, and TRACER-OK is printed. Committed as feat(261101-mvy).
  </done>
</task>

<task type="auto">
  <name>Task 2: Spell read view (damage highlight, 2-column stats, pre-line description) with Editar/Concluir over the unchanged inline fields</name>
  <files>components/character/spells-talents/spell-body.tsx, components/character/spells-talents/spells-card.tsx</files>
  <read_first>
    - .planning/design/ferro-brasa/Ficha.dc.html lines 425-447 (expanded body markup)
    - components/character/spells-talents/spells-card.tsx as left by Task 1
    - components/ui/editable-scaling-field.tsx: only the normalizeScalingData and calculateScaledValue signatures, and the read-only render block (total plus "(formula)" when perLevel > 0)
  </read_first>
  <action>
    Create components/character/spells-talents/spell-body.tsx (single quotes, no semicolons). Exports:

    1. `getSpellScaledValues(spell: Spell, characterLevel: number)` returns `{ damage: ScaledDisplay; duration: ScaledDisplay }`, where ScaledDisplay is `{ total: string; formula: string; hasScaling: boolean }`.
       - Each value is calculateScaledValue(n.base, n.perLevel, spell.level || 0, characterLevel), where n = normalizeScalingData(spell.damage || { base: 0, perLevel: null }, 'damage'), and the same for duration with `{ base: '', perLevel: null }` and 'duration'.
       - hasScaling = Boolean(n.perLevel && n.perLevel > 0).
       - Import both functions from '@/components/ui/editable-scaling-field'. Never re-implement the formula: the numbers must equal what EditableScalingField shows for the same props (decision 4).

    2. `SpellDetails({ spell, characterLevel })` is the read view, with values from mock lines 427-437:
       - Damage highlight: a div with flex, items-baseline, justify-between, gap-2.5, px-3, py-2.5, bg-background, border, rounded-(--radius).
         - Label "Dano": text-[13px], muted.
         - Value span: font-numeric, tabular-nums, text-xl, font-semibold, text-right. It shows damage.total, or '—' when isBlankScaledTotal(total) && !hasScaling.
         - When hasScaling, follow the value with a muted text-[13px] font-medium span showing `(${formula})`.
       - Stats: a grid with grid-cols-2, gap-x-3.5, gap-y-2. Six cells in this order: Tipo (type), Alcance (range), Duração (duration.total), Preparo (prepTime), Resistência (resistance), Concentração (concentration).
         - Each cell is a flex-col min-w-0 div: a text-xs muted label, then a text-[15px] font-medium break-words value.
         - Show '—' for an empty or whitespace value, and for a blank duration with no scaling.
       - Description: a p with m-0, text-[15px], leading-[1.55], whitespace-pre-line, text-pretty. Render spell.description as a React text child only, never as injected HTML. When empty, show a muted "Sem descrição." instead.

    3. `SpellEditFields({ spell, index, character, characterId, isEditMode })`: MOVE the eleven inline fields from spells-card.tsx here verbatim. Keep the same components, `section="spells"` literal on each, the `${index}.<key>` field templates, value expressions, placeholders, labels, className, rows and isEditMode. Only the wrapper grid classes may change, and the scaling fields stay full width. This component performs no writes of its own.

    Type props with Spell from '@/lib/schemas/character' and CharacterTabProps['character'] from '../types', with no new `any`.

    Update components/character/spells-talents/spells-card.tsx:
    - Add local state `editing: Set<number>`.
    - The row sub line now uses getSpellScaledValues(spell, character.level || 0).damage.total. Remove the inline computation and its imports.
    - Row body:
      - When isEditMode && editing.has(entry.index): SpellEditFields, then MagicEntryActions in mode 'edit'. onDone removes the index from `editing`; onDelete is the delete handler.
      - Otherwise: SpellDetails, then, only when isEditMode, MagicEntryActions in mode 'view'. onEdit adds the index to `editing`; onDelete is the delete handler.
      - Excluir is disabled while isPending.
    - The delete handler keeps its payload and console.error. After a successful mutateAsync, it sets expanded and editing to removeIndexFromSet(prev, index), so open rows stay on the same entries.
    - The add handler keeps its payload and console.error. Capture newIndex = spells.length before the await. After success (decision 16): set query to '', level to 'todos', and add newIndex to both expanded and editing.
    - spells-card.tsx and spell-body.tsx must each end under 300 lines.
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && S=components/character/spells-talents/spell-body.tsx && C=components/character/spells-talents/spells-card.tsx && test -f "$S" && grep -q 'whitespace-pre-line' "$S" && grep -q 'calculateScaledValue' "$S" && grep -q 'normalizeScalingData' "$S" && grep -q 'export function getSpellScaledValues' "$S" && grep -q 'export function SpellDetails' "$S" && grep -q 'export function SpellEditFields' "$S" && [ "$(grep -o 'section="spells"' "$S" | wc -l)" -eq 11 ] && for f in name level berkanaCost type concentration prepTime resistance range damage duration description; do grep -qF "{index}.$f\`" "$S" || { echo "missing field path $f"; exit 1; }; done && ! grep -vE '^\s*(//|\*|\{/\*)' "$S" | grep -q 'mutateAsync(' && [ "$(grep -vE '^\s*(//|\*|\{/\*)' "$C" | grep -o 'mutateAsync(' | wc -l)" -eq 2 ] && grep -qF "damage: { base: 0, perLevel: null }," "$C" && grep -qF "duration: { base: '', perLevel: null }," "$C" && grep -q 'removeIndexFromSet' "$C" && grep -q 'getSpellScaledValues' "$C" && [ "$(wc -l < "$C")" -lt 300 ] && [ "$(wc -l < "$S")" -lt 300 ] && ! cat components/character/spells-talents/*.tsx | grep -q 'dangerouslySetInnerHTML' && npx tsc --noEmit && LB="$(git rev-parse --git-path gsd-261101-mvy-lint-base)" && LN="$(git rev-parse --git-path gsd-261101-mvy-lint-now)" && bun run lint > "$LN" 2>&1 && [ "$(grep -oE '\([0-9]+ errors?, [0-9]+ warnings?\)' "$LN")" = "$(grep -oE '\([0-9]+ errors?, [0-9]+ warnings?\)' "$LB")" ] && bun test && echo SPELLS-OK</automated>
  </verify>
  <done>
    - Expanded spell rows show the Dano highlight: the scaled total, plus the formula when scaling. Below it are the six-cell stats grid with real fields and the description with preserved line breaks as plain text.
    - When unlocked, Editar swaps in the unchanged eleven inline fields (scaling editing included), and Concluir returns to the read view. Excluir deletes with the same payload and keeps the other open rows correct.
    - "Nova magia" opens the new spell in edit view with the filters cleared.
    - Both files are under 300 lines. tsc passes, the lint summary equals the baseline, bun test passes, and SPELLS-OK is printed. Committed as feat(261101-mvy).
  </done>
</task>

<task type="auto">
  <name>Task 3: Talents list on the shared pieces (badge, "usado hoje", Novo dia, once-per-day toggle kept), render smoke test, final gate</name>
  <files>components/character/spells-talents/talent-body.tsx, components/character/spells-talents/talents-card.tsx, components/character/spells-talents.render.test.ts</files>
  <read_first>
    - components/character/spells-talents/talents-card.tsx (whole file: every handler payload listed in `<interfaces>`)
    - components/character/spells-talents/spells-card.tsx and magic-list.tsx as left by Task 2 (the pattern to mirror)
    - components/character/notes-tab.render.test.ts (renderToString + dynamic import pattern; it mocks '@/lib/api/queries' process-wide, so the new test must NOT mock that module)
  </read_first>
  <action>
    Create components/character/spells-talents/talent-body.tsx (single quotes, no semicolons). Exports:
    - `TalentDetails({ talent })`: the description in the same pre-line p as SpellDetails, as a React text child only, or a muted "Sem descrição.".
    - `TalentEditFields({ talent, index, character, characterId, isEditMode, isPending, onOncePerDayChange })`: the current name (EditableField), level (EditableNumberField) and description (EditableTextArea, rows 2) fields, moved verbatim with `section="talents"` and the `${index}.<key>` templates. Between level and description goes the once-per-day row:
      - a Checkbox with id `talent-${index}-oncePerDay`, checked={talent.oncePerDay || false}, onCheckedChange={onOncePerDayChange}, disabled={!isEditMode || isPending}
      - its label "Uso limitado (1× ao dia)" in a 44px-high flex row
      - this component performs no writes of its own; the card owns the handler

    Rewrite components/character/spells-talents/talents-card.tsx to mirror spells-card:
    - Read the list with Array.isArray.
    - Local state: query, level, expanded, editing.
    - groupEntriesByLevel with searchFields t => [t?.name, t?.description]; tone primary; countLabel magicCountNoun('talentos', n); placeholder "Buscar talento ou efeito"; magicResultLabel('talentos', …).
    - Empty texts stay the current 'Nenhum talento cadastrado' / 'Os talentos aparecerão aqui conforme forem adicionados'.
    - Keep all five write handlers with identical payloads, guards and console.error messages: toggleTalentUsed, resetAllTalentsUsage, add, delete, and the once-per-day handler. Lift the once-per-day handler into a named function in this file and pass it as onOncePerDayChange. Its parameter type is `boolean | 'indeterminate'`; the body stays the same, including `if (!isEditMode) return`. The file keeps exactly five mutateAsync call sites.
    - Delete and add use removeIndexFromSet and the post-add open/edit behavior from Task 2.
    - Toolbar actions:
      - Keep "Novo dia" (decision 3): when hasUsedTalents (unchanged expression), an outline Button h-[46px], px-3, gap-1.5, with RotateCcw size-4, label "Novo dia", title "Resetar usos diários", onClick resetAllTalentsUsage, disabled while isPending. It shows whether locked or unlocked, as today.
      - Then, when isEditMode, the 46px primary "Novo talento" (aria-label) Plus button.
    - Rows:
      - name: talent.name || 'Novo Talento'
      - sub: firstLine(talent.description)
      - muted when talent.oncePerDay && talent.usedToday (current line-through cue)
      - badges: MagicOncePerDayBadge when talent.oncePerDay (decision 2)
      - leading, when talent.oncePerDay: a label with grid, size-11, place-items-center, cursor-pointer, wrapping the existing used-today Checkbox. It keeps checked={talent.usedToday || false}, onCheckedChange calling toggleTalentUsed(index, talent.usedToday || false), disabled while isPending (NOT gated by isEditMode, as today) and the current title texts, and adds aria-label "Usado hoje". The leading cell is a sibling of the toggle button, so stopPropagation is no longer needed.
    - Body: TalentEditFields plus MagicEntryActions 'edit' when isEditMode && editing.has(index); otherwise TalentDetails plus, when isEditMode, MagicEntryActions 'view'.
    - Remove the hard-coded orange icon color, the old Zap/ChevronRight icons, the Collapsible wrapper and the fixed-height scroll-area primitive, with their imports.

    Create components/character/spells-talents.render.test.ts (bun:test, createElement, renderToString, no JSX). Import components dynamically. Do NOT call mock.module for '@/lib/api/queries'. Start the file with a short Portuguese header comment, in the style of the notes test header, explaining the interplay: notes-tab.render.test.ts replaces '@/lib/api/queries' for the whole `bun test` process and asserts useUpdateCharacter call counts, so this file does not mock it again. Instead it wraps the tab in QueryClientProvider, which works whether the real or the mocked module is loaded, and passes a fake mutation to TalentsCard. In beforeEach, spyOn(globalThis, 'fetch'); after each render, assert it was never called. Strip React text separators from the HTML before asserting (replace every `<!-- -->`).
    1. SpellsTalentsTab inside QueryClientProvider (new QueryClient()). Character level 3, isEditMode true. Spells, in stored order:
       - A: { name: 'Desvastar', level: 1, berkanaCost: 30, type: 'Alteração de Combate', range: 'Pessoal', damage: { base: 2000, perLevel: 1000 }, description: 'Linha 1\nLinha 2' }
       - B: { name: 'Velocidade Alterada', level: 0, berkanaCost: 25, damage: '2000 + 500 P/N', range: 'Pessoal' } (legacy string)
       - C: { name: 'Catoação', level: 1, berkanaCost: 30, damage: null, range: 'Raio 30 Metros' }
       Talents: [{ name: 'Lutador' }]. Assert the HTML:
       - contains 'Magias · 3' and 'Talentos · 1'
       - 'Nível 0' comes before 'Nível 1'
       - 'Velocidade Alterada' comes before 'Desvastar', which comes before 'Catoação' (group order, then stored order)
       - contains 'Alteração de Combate · Dano 4000 · Pessoal' (2000 + 1000 × (3 − 1))
       - contains 'Dano 3500 · Pessoal' (legacy 2000 + 500 × 3)
       - contains 'Raio 30 Metros' and NOT 'Dano 0'
       - contains 'Todos', 'Nv 0', 'Nv 1', '3 magias, por nível · toque para ver detalhes', and aria-label="Nova magia"
       - has exactly 3 aria-expanded="false"
    2. Same character with isEditMode false: no aria-label="Nova magia" (hidden, not disabled; decision 8).
    3. Character with spells: null: contains 'Nenhuma magia ou habilidade cadastrada' and does not throw.
    4. TalentsCard rendered directly with a fake updateCharacterMutation ({ mutateAsync: mock(async () => ({})), isPending: false } cast through unknown to UpdateCharacterMutation), isEditMode false. Talents:
       - { name: 'Golpe Acorrentado', level: 5, oncePerDay: true, usedToday: true, description: '\nDuelo +3\n\nUma vez ao dia, desarma.' }
       - { name: 'Sangue Frio', level: 5, description: 'Controle Emocional +5' }
       Assert:
       - '1× ao dia' appears exactly once
       - contains 'Novo dia', 'line-through', 'Duelo +3', 'Nível 5' and '2 talentos'
       - aria-label="Usado hoje" appears exactly once
       - no aria-label="Novo talento"
       - the fake mutateAsync was never called

    Finally, run the full gate. Write the SUMMARY with the `<mock_vs_current_decisions>` table (plus any new cases), the final line counts, and the bun test count.
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && T=components/character/spells-talents/talents-card.tsx && TB=components/character/spells-talents/talent-body.tsx && bun test components/character/spells-talents.render.test.ts && test -f "$TB" && grep -q 'whitespace-pre-line' "$TB" && for f in name level description; do grep -qF "{index}.$f\`" "$TB" || { echo "missing talent field path $f"; exit 1; }; done && grep -qF 'talent-${index}-oncePerDay' "$TB" && ! grep -vE '^\s*(//|\*|\{/\*)' "$TB" | grep -q 'mutateAsync(' && [ "$(grep -vE '^\s*(//|\*|\{/\*)' "$T" | grep -o 'mutateAsync(' | wc -l)" -eq 5 ] && grep -qF 'oncePerDay: checked, usedToday: checked ? t.usedToday : false' "$T" && grep -qF 'usedToday: !currentValue' "$T" && grep -q 'groupEntriesByLevel' "$T" && grep -q 'MagicOncePerDayBadge' "$T" && grep -q 'Novo dia' "$T" && grep -q 'Usado hoje' "$T" && grep -q 'removeIndexFromSet' "$T" && ! grep -q 'ScrollArea' "$T" && ! grep -rqE '\b(bg|text|border|ring|from|to|fill|stroke)-(red|green|blue|yellow|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|black|white)(-[0-9]{2,3})?\b' components/character/spells-talents components/character/spells-talents-tab.tsx && ! cat components/character/spells-talents/*.tsx components/character/spells-talents-tab.tsx | grep -q 'dangerouslySetInnerHTML' && for f in components/character/spells-talents/*.tsx components/character/spells-talents-tab.tsx; do [ "$(wc -l < "$f")" -lt 300 ] || { echo "too long: $f"; exit 1; }; done && B=$(cat "$(git rev-parse --git-path gsd-261101-mvy-base)") && git cat-file -e "$B^{commit}" && D=$(git diff --name-only "$B" -- lib/calculations lib/schemas lib/api lib/store components/ui components/forms components/character/quick-actions-bar.tsx components/character/types.ts components/character/index.ts prisma package.json bun.lock) && [ -z "$D" ] && npx tsc --noEmit && LB="$(git rev-parse --git-path gsd-261101-mvy-lint-base)" && LN="$(git rev-parse --git-path gsd-261101-mvy-lint-now)" && bun run lint > "$LN" 2>&1 && [ "$(grep -oE '\([0-9]+ errors?, [0-9]+ warnings?\)' "$LN")" = "$(grep -oE '\([0-9]+ errors?, [0-9]+ warnings?\)' "$LB")" ] && bun test && bun run build && echo MAGIAS-OK</automated>
    <human-check>
      End-of-batch walkthrough with `bun dev`, in dark mode at 390px and at desktop width:
      1. Open a character → the Magias tab. Check the toggle ("Magias · N" / "Talentos · N"), the search field, the "Todos / Nv N" chips and the count line. Typing "alteracao" finds "Alteração de Combate" spells. Choosing a chip narrows the list.
      2. Spells appear in "Nível N" cards, lowest level first. A collapsed row shows the Berkana cost. Expanding it shows the Dano highlight: compare it with the same spell's value in edit view and with the character level. Below it are the 2-column stats and a description with its line breaks.
      3. Unlocked: Editar shows the inline fields, and editing damage base/per-level still saves and updates the highlight. Concluir returns. "Nova magia" opens a blank spell in edit view. Excluir removes only that spell.
      4. Talentos: "1× ao dia" shows only on once-per-day talents. The "usado hoje" checkbox works while locked, and "Novo dia" resets it. The once-per-day toggle in edit view still works.
      5. Locked: no Nova, Editar or Excluir; rows still expand.
    </human-check>
  </verify>
  <done>
    - The Talentos view uses the shared toolbar, groups and rows. It shows the "1× ao dia" badge from oncePerDay, and keeps the "usado hoje" checkbox, "Novo dia" and the once-per-day toggle with byte-identical writes (five mutateAsync call sites).
    - The render smoke test passes, and no hard-coded palette colors or fixed-height scroll boxes remain in the tab.
    - Every tab file is under 300 lines. No file outside this item's list changed since the base commit.
    - tsc passes, the lint summary equals the baseline, bun test and bun run build pass, and MAGIAS-OK is printed.
    - The SUMMARY records the mock-vs-current decisions. Committed as feat(261101-mvy).
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Stored character JSON → React render | spells/talents are `z.any()` on read and may hold legacy shapes (string damage, null, extra keys) or user-typed text, including markup-like text in descriptions |
| Local UI state (search, level filter, expanded/editing sets) → write path | Filtering changes a row's visual position. Writes must still target the stored array index |
| Inline fields / row actions → PUT /api/characters/:id | Every write still goes through the shared useUpdateCharacter instance (expectedUpdatedAt, 409 handling, serial queue) |

## STRIDE Threat Register

ASVS level 1; block on: high.

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-mvy-01 | Tampering (write to the wrong entry) | Grouped/filtered rows in spells-card.tsx and talents-card.tsx | high | mitigate | groupEntriesByLevel returns each entry's ORIGINAL index, and the Task 1 tests assert it. Field paths, delete, used-today and once-per-day all use entry.index. Every gate checks the `${index}.<key>` templates, and the render test checks group and stored order |
| T-mvy-02 | Tampering / XSS (stored script in description) | SpellDetails, TalentDetails | medium | mitigate | Descriptions render as React text children with whitespace-pre-line, and no HTML is injected. Task 2 and Task 3 gates fail if the HTML-injection prop appears in any tab file |
| T-mvy-03 | Tampering (stale open/edit state after delete) | expanded/editing index sets | medium | mitigate | removeIndexFromSet (unit-tested) shifts the indices after a successful delete, so an open edit view never moves to a different entry |
| T-mvy-04 | Tampering (lost/duplicate writes) | Add, delete, used-today, reset, once-per-day | medium | mitigate | The payloads stay byte-identical (gates grep the default objects and map expressions). The mutateAsync call-site counts are fixed (spells 2, talents 5, bodies 0). All writes go through the shared useUpdateCharacter with optimistic concurrency, and the add/delete buttons are disabled while isPending |
| T-mvy-05 | Denial of service (crash on legacy data) | Tab render with non-array or null-element lists, null/legacy damage | low | mitigate | Lists are read through Array.isArray, toEntryLevel tolerates null elements, and normalizeScalingData handles the string/number/null shapes. The render test covers spells: null, legacy string damage and null damage |
| T-mvy-06 | Repudiation / data loss (accidental Excluir tap) | MagicEntryActions | medium | accept | Current behavior is immediate delete with no confirm, and per the owner rule it is kept (decision 7). Excluir only appears in an expanded row while unlocked, is 44px, and is disabled while a save is pending. A confirm dialog is recorded in the SUMMARY as a suggested follow-up |
| T-mvy-SC | Tampering | npm/bun package installs | low | accept | No packages are installed. lucide-react, Radix checkbox and @tanstack/react-query are existing deps. The Task 3 diff gate fails if package.json or bun.lock change |
</threat_model>

<verification>
Full gate, run from the repo root after Task 3 (the Task 3 `<automated>` command runs all of it):
- `bun test` exits 0. It includes lib/spells-talents.test.ts and components/character/spells-talents.render.test.ts, and the existing notes render test still passes because this item does not mock '@/lib/api/queries'.
- `npx tsc --noEmit` exits 0.
- `bun run lint` exits 0, and its summary line equals the baseline recorded in Task 1 Step 0 (0 errors, no new warnings).
- `bun run build` exits 0.
- `git diff --name-only <base> -- lib/calculations lib/schemas lib/api lib/store components/ui components/forms components/character/quick-actions-bar.tsx components/character/types.ts components/character/index.ts prisma package.json bun.lock` is empty.
- The payload, field-path and mutateAsync-count gates pass.
- Human walkthrough: Task 3 `<human-check>`.
</verification>

<success_criteria>
- DS-06: the toggle, search, Nova (unlocked), level chips, level-grouped cards, collapsible rows with cost and "1× ao dia" badges, and the expanded read view (damage highlight, 2-column stats, pre-line description) with Editar/Excluir all match the mock's look.
- Every persisted field, write payload, inline field and the EditableScalingField level scaling are unchanged. "Usado hoje", "Novo dia" and the once-per-day toggle are kept.
- The pure filter/group logic lives in lib/spells-talents.ts with bun tests, and every tab file is under 300 lines.
- tsc, lint (no new warnings), bun test and build pass.
- The SUMMARY records every mock-vs-current decision.
</success_criteria>

<output>
Create `.planning/quick/261101-mvy-redesign-magias-talentos-tab-ds-06-restyle-components-charac/261101-mvy-SUMMARY.md` when done. Include:
- the `<mock_vs_current_decisions>` table, updated with any new case met during execution
- whether 261101-mvv's layout wraps the tab in a column container (and so whether [column-span:all] was load-bearing)
- the final line counts of every tab file
- the final bun test count
- the suggested follow-up: a confirm step for Excluir (decision 7 / T-mvy-06)
</output>
