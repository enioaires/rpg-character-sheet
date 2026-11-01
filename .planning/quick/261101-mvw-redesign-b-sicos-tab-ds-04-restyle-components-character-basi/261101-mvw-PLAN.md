---
phase: quick-261101-mvw
plan: 01
type: execute
wave: 4                     # ADVISORY ONLY: authoritative wave is recomputed by `quick-batch update` from depends_on
depends_on: ["261101-mvt", "261101-mvv"]   # mvt: SectionCard/NumericDisplay/StatTile/inline-field states/tokens; mvv: useQuickSheet, resource-display maps, vitality/berkana helpers, and its own edits to vitality-card.tsx and berkana-card.tsx
# Scope note: 12 small files. Ten are in the Básicos subsystem. Two are the one-expression alignment of mvv's
# Atributos sheet and its render test, required by the owner's PD-02 decision (Task 2). Tasks 1 and 2 touch
# 6 and 8 files because each adds to the shared view model, its test and the render test. The Task 3 diff gate
# covers only paths that no batch item touches after this item's base.
files_modified:
  - components/character/basic-info/basic-info-model.ts
  - components/character/basic-info/basic-info-model.test.ts
  - components/character/basic-info-tab.render.test.ts
  - components/character/basic-info-tab.tsx
  - components/character/basic-info/vitality-card.tsx
  - components/character/basic-info/berkana-card.tsx
  - components/character/basic-info/attribute-cards.tsx
  - components/character/basic-info/profile-cards.tsx
  - components/character/basic-info/equipment-cards.tsx
  - components/character/basic-info/languages-card.tsx
  - components/character/quick-sheets/reference-sheets.tsx
  - components/character/quick-actions.render.test.ts
autonomous: true
requirements: [DS-04]

must_haves:
  truths:
    - "The Básicos tab renders eight design section cards in the mock order (Vitalidade, Berkana, Armas, Atributos, Experiência e Nível, Armadura, Informações Básicas, Linguagens) as direct children of the layout's 340px column flow"
    - "Vitalidade shows a stage badge (stage icon, stage color, label, 'N/6'), the big current/max total in pt-BR grouping, a 6-segment bar and six per-stage rows with an 'atual' marker on the current stage. Every number comes from 261101-mvv's helpers over calculateVitalityLevels"
    - "Dano and Cura on the Vitalidade card open the vit bottom sheet, and Gastar and Recuperar on the Berkana card open the berk sheet, through useQuickSheet().openSheet. They are visible in both lock modes, and the two cards perform no writes themselves"
    - "Berkana shows the state icon and label, the editable current value large (same max clamp as today), a bar, and editable Máxima and Bônus"
    - "Atributos shows calculateAttributeTotal for each attribute in a totals grid, plus a distribution table that starts collapsed with editable Raça/Classe/Bônus, a Nív. column (getAttributeLevelBonus) and a Total column"
    - "The bottom-bar Atributos sheet shows the same calculateAttributeTotal(attribute, level) numbers as the Atributos card (owner decision 2026-11-01: totals include the level bonus everywhere)"
    - "Experiência e Nível shows the editable level in a 72px box, the editable XP over getXPRequiredForNextLevel(level), a progress bar, and 'Faltam N XP para o nível N+1' (or the canLevelUp / max-level copy)"
    - "Armas shows the name, an 'Nv' level badge and a 5-cell damage grid with a highlighted critical cell. Armadura shows the name, description and current/total with a bar"
    - "Informações Básicas shows the 12 existing fields in a 2-column labeled grid. Linguagens shows toggle chips with check/minus icons, plus 'Outra' and the custom-name editors while unlocked"
    - "Every existing field stays editable through EditableField / EditableNumberField / EditableTextArea with the same section and field paths. Language toggles and add write the same payloads as today"
    - "Locked: every inline field renders read-only, language chips are static, and edit-only controls ('Outra', custom-name editors, empty weapon slots, the 3-weapon hint) are hidden. The four sheet-opening buttons stay visible"
    - "npx tsc --noEmit, bun run lint (0 errors, still exactly 1 warning), bun test and bun run build pass"
  artifacts:
    - path: "components/character/basic-info/basic-info-model.ts"
      provides: "Framework-free view model for the Básicos cards; composes lib/calculations and 261101-mvv helpers, no formulas of its own"
      exports: ["getFillPercent", "buildVitalityView", "buildBerkanaView", "buildExperienceView", "buildAttributeRows", "hasWeaponContent", "buildLanguageChips", "STANDARD_LANGUAGE_LABELS"]
    - path: "components/character/basic-info/basic-info-model.test.ts"
      provides: "bun tests pinning every view-model number and edge case"
    - path: "components/character/basic-info-tab.render.test.ts"
      provides: "renderToString tests of the whole tab, unlocked and locked: card order, numbers, lock behavior, no writes on render"
    - path: "components/character/basic-info-tab.tsx"
      provides: "Tab returning the eight cards as a fragment, in mock order"
      exports: ["BasicInfoTab"]
    - path: "components/character/basic-info/vitality-card.tsx"
      provides: "Vitalidade SectionCard"
      exports: ["VitalityCard"]
    - path: "components/character/basic-info/berkana-card.tsx"
      provides: "Berkana SectionCard"
      exports: ["BerkanaCard"]
    - path: "components/character/basic-info/attribute-cards.tsx"
      provides: "Atributos SectionCard (totals grid + collapsible distribution table)"
      exports: ["AttributesCard"]
    - path: "components/character/basic-info/profile-cards.tsx"
      provides: "Informações Básicas and Experiência e Nível SectionCards"
      exports: ["BasicDetailsCard", "ExperienceCard"]
    - path: "components/character/basic-info/equipment-cards.tsx"
      provides: "Armas and Armadura SectionCards"
      exports: ["WeaponsCard", "ArmorCard"]
    - path: "components/character/basic-info/languages-card.tsx"
      provides: "Linguagens SectionCard with toggle chips"
      exports: ["LanguagesCard"]
    - path: "components/character/quick-sheets/reference-sheets.tsx"
      provides: "Atributos sheet body showing calculateAttributeTotal with the character level (only this expression and its props change)"
      exports: ["AttributesSheetBody", "AttributesSheet"]
    - path: "components/character/quick-actions.render.test.ts"
      provides: "AttributesSheetBody assertions updated to the level-inclusive totals"
  key_links:
    - from: "components/character/quick-sheets/reference-sheets.tsx"
      to: "lib/calculations/index.ts"
      via: "AttributesSheetBody value = calculateAttributeTotal(toAttributeValue(attr), level || 0), with level passed from AttributesSheet's character"
      pattern: "calculateAttributeTotal("
    - from: "components/character/basic-info/vitality-card.tsx"
      to: "components/character/quick-sheets/quick-sheet-context.tsx"
      via: "Dano and Cura onClick call useQuickSheet().openSheet('vit')"
      pattern: "openSheet('vit'"
    - from: "components/character/basic-info/berkana-card.tsx"
      to: "components/character/quick-sheets/quick-sheet-context.tsx"
      via: "Gastar and Recuperar onClick call useQuickSheet().openSheet('berk')"
      pattern: "openSheet('berk'"
    - from: "components/character/basic-info/basic-info-model.ts"
      to: "lib/calculations/index.ts"
      via: "resolveCurrentVitalityLevels, calculateVitalityTotal, getCurrentVitalityStage, resolveBerkanaPool, getBerkanaState, calculateAttributeTotal, getAttributeLevelBonus, getXPRequiredForNextLevel, canLevelUp"
      pattern: "getCurrentVitalityStage("
    - from: "components/character/basic-info/*.tsx"
      to: "components/ui/editable-field.tsx"
      via: "unchanged section/field paths with isEditMode now passed to every field"
      pattern: "isEditMode={isEditMode}"
    - from: "components/character/basic-info/languages-card.tsx"
      to: "lib/api/queries.ts"
      via: "the tab's single useUpdateCharacter instance (updateCharacterMutation prop), same payloads as today's checkboxes and add button"
      pattern: "known: checked"
    - from: "components/character/basic-info-tab.tsx"
      to: "components/forms/character-layout.tsx"
      via: "fragment of SectionCards as direct children of the TabsContent column flow"
      pattern: "<VitalityCard"
---

<objective>
Restyle the Básicos tab (DS-04) to the Ferro & Brasa "basicos" screen. The tab has eight section cards:
- Vitalidade: stage badge, big total, 6-segment bar, Dano/Cura opening the vit sheet, per-stage rows with the current marker
- Berkana: state, big number, bar, Gastar/Recuperar opening the berk sheet, bonus
- Armas: name, level badge, 5-cell damage grid with a highlighted critical cell
- Atributos: totals grid plus a collapsible distribution table
- Experiência e Nível: level box, XP bar, "Faltam N XP para o nível N+1"
- Armadura: name, description, current/total bar
- Informações Básicas: 2-column labeled inline fields
- Linguagens: toggle chips plus "Outra"

Purpose: Básicos is the tab players use most at the table. Every number and every write must stay what the app does today. The redesign changes the look, and moves the in-card damage and Berkana quick buttons into the 261101-mvv bottom sheets.

Output:
- one framework-free view model with tests
- seven restyled card/tab files
- one render test of the whole tab, unlocked and locked
- mvv's Atributos sheet aligned to level-inclusive totals, with its render-test assertion updated (owner decision PD-02)

OWNER RULE (read first): `.planning/design/ferro-brasa/README.md`, section "Important: the design is visual direction, not a functional spec". Take the look from the mock. Keep the current app's behavior: formulas, writes, fields, persisted keys. Add a mock-only feature only when it is a pure UI convenience over existing fields. Every call made for this item is in `<design_behavior_decisions>`. Copy that table into the SUMMARY and add any new call you make.

COORDINATOR RULES:
1. When the sheet is locked, edit-only controls are HIDDEN, not disabled. Play actions keep their current gating.
2. "Cura" now exists: the owner decided, and 261101-mvv's vit sheet offers Dano and Cura by any amount through `applyVitalityHeal`, plus "Restaurar vitalidade máxima". The card keeps both design buttons, and both call openSheet('vit'). mvv's API has no action pre-selection.
3. Do not fix the known custom-language bug (DS4-19).
4. Keep every file at 300 lines or fewer.
5. Owner decision 2026-11-01 (closes PD-02): attribute totals include the level bonus everywhere, via calculateAttributeTotal(attribute, level). The Atributos sheet from 261101-mvv is aligned in Task 2.

Not in scope:
- lib/ (no new formulas; the model only composes existing functions)
- components/ui/* and the shell, bar and sheets owned by 261101-mvv, except the Atributos sheet's total expression (Task 2)
- the other tabs
- prisma and package files
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.claude/CLAUDE.md
@.planning/design/ferro-brasa/README.md
# Ficha.dc.html is 106 KB. Read only these ranges:
#   BÁSICOS markup: 175-325 (Vitalidade 178-205, Berkana 207-221, Armas 223-240, Atributos 242-264,
#   Experiência 266-279, Armadura 281-291, Informações Básicas 293-310, Linguagens 312-321)
#   mock data, look only: 655-666 (stages), 740 (INFO), 747 (LANGS0)
#   mock logic, look only: 776-831 (vitRows, berkState, attrs, weapons, infoFields, langs)
# The mock's pools/stageOf/BERK_MAX/"total: race + klass + 1"/57-80 XP values are illustrative and MUST NOT be copied.
@.planning/design/ferro-brasa/Ficha.dc.html
@.planning/quick/261101-mvt-redesign-foundation-ds-01-implement-the-ferro-brasa-design-s/261101-mvt-PLAN.md
@.planning/quick/261101-mvv-redesign-sheet-shell-and-quick-actions-ds-03-restyle-app-cha/261101-mvv-PLAN.md
# For both: read the <interfaces> block. If 261101-mvt-SUMMARY.md / 261101-mvv-SUMMARY.md exist, their corrected
# interfaces win. mvv has landed (its SUMMARY exists): openSheet(kind) takes only the kind, with no action pre-selection.
@components/character/quick-sheets/reference-sheets.tsx
@components/character/quick-actions.render.test.ts
@lib/calculations/index.ts
@lib/constants/character.ts
@components/character/types.ts
@components/character/basic-info-tab.tsx
@components/character/basic-info/vitality-card.tsx
@components/character/basic-info/berkana-card.tsx
@components/character/basic-info/attribute-cards.tsx
@components/character/basic-info/profile-cards.tsx
@components/character/basic-info/equipment-cards.tsx
@components/character/basic-info/languages-card.tsx
@components/ui/editable-field.tsx
@components/character/notes-tab.render.test.ts

<interfaces>
Consumed, from 261101-mvt (verify the names in its SUMMARY):
- `SectionCard({ title, tone?: 'primary' | 'berkana', action?, headingLevel?, className, children, ...sectionProps })` in components/ui/section-card.tsx.
  - It is a `<section>` with break-inside-avoid, mb-3, bg-card, border, radius, shadow-card, p-4, flex-col and gap-3.5.
  - `data-section` passes through.
- `NumericDisplay({ value, max?, size: 'sm'|'md'|'lg'|'xl'|'hero', className?, maxClassName? })` in components/ui/numeric-display.tsx. It does no math; the caller formats.
- `StatTile({ label, value, variant?: 'tile'|'bare', align?, className?, valueClassName? })` in components/ui/stat-tile.tsx.
- `INLINE_FIELD_LABEL_CLASS` in components/ui/inline-field-state.tsx (12px uppercase muted label).
- EditableField / EditableNumberField / EditableTextArea: props are unchanged. `label` renders with INLINE_FIELD_LABEL_CLASS.
  - Read-only (isEditMode false) renders plain text, or an em dash when empty.
  - Editable idle renders a `role="button"` dashed 44px box that shows the value or the placeholder.
  - `displayClassName` is applied last (tailwind-merge), so callers may override padding, size and alignment.
  - EditableNumberField adds font-numeric tabular-nums, its `min` defaults to 0, and its display formatter is fixed (plain `toString`, no pt-BR grouping).
- Tokens: text-/bg-/border-vitality-{notavel,ferido,grave,condenado,incapacitado,coma}, bg-vitality-track, bg-/text-/border-berkana, bg-berkana-track, bg-chart-5, font-serif, font-numeric (always with tabular-nums).

Consumed, from 261101-mvv (verify in its SUMMARY; the Cura revision may have extended them):
- From '@/lib/calculations':
  - `resolveCurrentVitalityLevels(currentVitality, maxLevels)`
  - `calculateVitalityTotal(levels)`
  - `getCurrentVitalityStage(current, maxLevels): VitalityStageKey | null`
  - `resolveBerkanaPool(character): { current, max }`, which applies the destructuring defaults maxBerkana 100, currentBerkana 100, berkanaBonus 0 to undefined only
  - `getBerkanaState(current, max): 'cheia' | 'metade' | 'esgotada' | 'disponivel'`
  - types `VitalityStageKey`, `CurrentVitalityInput`, `BerkanaStateKey`
- components/character/resource-display.ts:
  - `VITALITY_STAGE_DISPLAY[stage]` = { label, shortLabel, Icon, textClassName, bgClassName, borderClassName }
  - `BERKANA_STATE_DISPLAY[state]` = { label, Icon }
  - `formatGameNumber(n)` (pt-BR grouping, display only)
- components/character/quick-sheets/quick-sheet-context.tsx:
  - `useQuickSheet(): { openSheet(kind: 'vit' | 'berk' | 'arma' | 'atributos' | 'pericias') }`. It throws outside CharacterLayout. There is no action pre-selection (mvv SUMMARY).
  - `QuickSheetContext`. Render tests wrap the tree in `QuickSheetContext.Provider` with `value = { openSheet: fn }`.
- CharacterLayout renders each tab's content inside a column-flow TabsContent. Tabs must return their SectionCards as direct children: a fragment, with no outer grid or space-y wrapper.
- After mvv, vitality-card.tsx and berkana-card.tsx already compute through the helpers above, and still contain the old inline quick buttons. This plan removes those buttons; the sheets own the writes.
- components/character/quick-sheets/reference-sheets.tsx (committed by mvv):
  - `AttributesSheetBody({ attributes })` renders a 3-column StatTile grid in ATTRIBUTES order with the base-only (no level bonus) value.
  - `AttributesSheet({ open, onOpenChange, character })` passes `character.attributes`.
  - `SkillsSheetBody({ skills, level })` already takes `level` the same way. Task 2 mirrors that for the Atributos body.

Produced (informational, for 261101-mvx): basic-info-tab.tsx returns a fragment of SectionCards. mvx reads it as the pattern for its own tab.
</interfaces>
</context>

<design_behavior_decisions>
Copy this table into the SUMMARY. Owner rule: the design is visual direction, and current behavior wins.

| ID | Mock shows | Decision | Why |
|----|-----------|----------|-----|
| DS4-01 | Card order Vitalidade → Linguagens | Adopted. Today Informações Básicas comes first | Layout only. On a phone, the play cards come first |
| DS4-02 | Vitalidade "Dano" + "Cura" buttons | Both kept, and both call useQuickSheet().openSheet('vit'). There is no action pre-selection: mvv's openSheet takes only the kind, so the sheet opens with Dano and Cura side by side. The card's inline damage input and its apply/restore buttons move out: the vit sheet owns Dano, Cura and "Restaurar vitalidade máxima", so every vitality write has one source. The cards never write | Owner decision (Cura exists in the revised mvv sheet) and coordinator instruction |
| DS4-03 | pools/stageOf numbers | Not copied. Totals, stage, "N/6" and row values come from resolveCurrentVitalityLevels / calculateVitalityTotal / getCurrentVitalityStage over calculateVitalityLevels | Real numbers only |
| DS4-04 | Caption "Base: raça 250 + classe 200, × 8 (nível 7 + 1)" | Formula text not shown. The two base fields stay editable, labelled "Base da raça" and "Base da classe", with the caption "O dano desce do Notável até o Coma." | Keeps existing fields. A restated formula could drift from lib/calculations |
| DS4-05 | "3.600"-style numbers everywhere | formatGameNumber only for the Vitalidade hero current/max totals (non-editable). Numbers inside EditableNumberField stay raw, because its formatter is fixed and components/ui is frozen. A max shown next to an editable value is also raw, so a pair never mixes "3600 / 3.600" | Consistency within each pair |
| DS4-06 | 6-segment bar | Each segment fill = getFillPercent(stage current, stage max), clamped 0-100, anchored right as in the mock; aria-hidden | Display only |
| DS4-07 | Berkana Gastar/Recuperar | Both open the berk sheet. The old inline -30/-50/max quick buttons are removed: the sheet's chips +30/+50 with Gastar reproduce -30/-50, and its restore reproduces the max fill. This costs one or two extra taps; the writes are the same | Item text + one source for writes |
| DS4-08 | Footer "Máximo = 100 + 10 × nível + bônus" | Dropped. The footer keeps editable "Máxima" and "Bônus" | A stored maxBerkana overrides the formula (resolveBerkanaPool), so the caption could contradict the number shown |
| DS4-09 | Atributos totals, "inclui +1 de nível" | Owner decision 2026-11-01: totals include the level bonus everywhere; the Atributos sheet is aligned. The card and the bottom-bar Atributos sheet both show calculateAttributeTotal(attribute, level). The card's caption reads "inclui +N de nível" with the real getAttributeLevelBonus(level), and only when N > 0. Closes PD-02 | Owner decision (PD-02 closed) |
| DS4-10 | No expand button on Atributos | The old "expand" (open attributes modal) button is not carried over. The card already shows every total, and the Atributos sheet stays reachable from the bottom bar. The tab stops reading the modal-opener prop | Mock look; no capability lost |
| DS4-11 | Distribution table | Starts collapsed (as today). Raça/Cla./Bôn. stay editable through the same EditableNumberField paths. Nív. = getAttributeLevelBonus; Total = calculateAttributeTotal | Existing fields and numbers |
| DS4-12 | XP 57 / 80, "Faltam 23 XP para o nível 8" | The XP shown is the stored currentXP, which is XP inside the current level (processLevelUp subtracts the used XP), over getXPRequiredForNextLevel(level). Caption: "Faltam N XP para o nível L+1". When canLevelUp: "XP suficiente para o nível L+1". At level ≥ 99: "Nível máximo" (canLevelUp and the level field both cap at 99). Level and XP stay editable. No level-up button is added (none exists today) | Coordinator: XP from existing lib/calculations functions |
| DS4-13 | Armadura bar in chart-5 | Bar = getFillPercent(currentVitality, totalVitality) of the armor. Name, description, current and total stay editable | Existing fields |
| DS4-14 | 11 info fields, labels "Alinhamento", "Terra natal" | All 12 current fields are kept, including Nome do Personagem, which spans both columns. Labels keep today's text (Tendência, Terra Natal, Pontos de Virtude) | Fields and terms come from the app |
| DS4-15 | Locked = read-only | Coordinator lock rule. Weapons, armor and language controls never received isEditMode, so today they stay editable while the sheet is locked. Now every inline field gets isEditMode (locked = read-only text), and language chips are static spans when locked. These edit-only controls are hidden when locked: "Outra", the custom-name editors, empty weapon slots and the "Máximo de 3 armas." hint. Dano/Cura/Gastar/Recuperar stay visible in both modes: they are play actions, and the sheets apply the gating | Coordinator rule for all tabs |
| DS4-16 | Three filled weapons | Locked: only slots with content (hasWeaponContent), or "Nenhuma arma cadastrada." when none. Unlocked: the three fixed slots so any can be filled (same paths). The description renders as text when present (locked) or as the editor (unlocked). The cell label "Crít." comes from the mock; placeholders are unchanged | Pure display convenience |
| DS4-17 | Language toggle chips + "Outra" | Chips toggle `known` with exactly today's checkbox payloads (standard and custom). "Outra" appends `{ name: '', known: false }` like today's add button. Custom names stay editable through the same EditableField path `custom.{index}.name`, listed under the chips while unlocked. Display labels gain accents (Élfico, Sigílico, Anão); persisted keys stay STANDARD_LANGUAGES | Existing writes and keys |
| DS4-18 | — | Language write failures keep their console.error and now also show a fixed pt-BR toast.error, except on conflicts (useUpdateCharacter already shows the conflict toast) | CLAUDE.md: no new silent catch |
| DS4-19 | — | Known bug, NOT fixed. Renaming a custom language turns languages.custom into an index-keyed object (buildUpdateData's 3-segment path). The card reads custom entries only when custom is an array, so those rows stay hidden exactly as today, and "Outra" keeps today's failure on that shape (now logged plus a toast). Also observed and kept: defaults store `anao` while STANDARD_LANGUAGES reads `anão` | Coordinator: do not fix here |
| DS4-20 | Badge when vitality is not configured | getCurrentVitalityStage null → muted Heart badge "Sem vitalidade definida" (same copy as the vit sheet), with no stage color | Consistency with mvv |
</design_behavior_decisions>

<coverage_audit>
| Source | Item | Covered by |
|--------|------|------------|
| GOAL | Vitalidade: stage badge icon + position, big current/max, 6-segment bar, Dano/Cura opening the vit sheet, per-stage rows with current marker | Task 1 (DS4-02..06, DS4-20) |
| GOAL | Berkana: state label, big number, bar, Gastar/Recuperar opening the berk sheet, bonus | Task 1 (DS4-07, DS4-08) |
| GOAL | Atributos: totals grid + collapsible distribution table | Task 2 (DS4-09..11) |
| GOAL | Experiência e Nível: level box, XP bar, "Faltam N XP para o nível N+1" | Task 2 (DS4-12) |
| GOAL | Informações Básicas: 2-column labeled inline fields | Task 2 (DS4-14) |
| GOAL | Armas: name, level badge, 5-cell damage grid, highlighted critical | Task 3 (DS4-16) |
| GOAL | Armadura: name, description, current/total bar | Task 3 (DS4-13) |
| GOAL | Linguagens: toggle chips with icon + "Outra" for custom languages | Task 3 (DS4-17..19) |
| GOAL | All fields editable exactly as today through the existing EditableField components and mutation | Every task: same section/field paths (preservation greps), the language payload statements kept, no field removed |
| GOAL | Numbers from lib/calculations only | Model composes lib/calculations + mvv helpers; model tests; Task 3 scoped gate proves lib/calculations, lib/api and lib/schemas unchanged |
| CONTEXT (coordinator) | depends_on mvt + mvv; build on mvv's versions of vitality/berkana cards | Frontmatter; Task 1 read_first + precondition |
| CONTEXT (coordinator) | Locked: edit-only controls hidden; play actions keep their gating | DS4-15; Task 3 locked render test (no role="button", no "Outra", no aria-pressed; Dano/Cura/Gastar/Recuperar present) |
| CONTEXT (coordinator, revised) | Keep Dano + Cura; both open the vit sheet via openSheet('vit'); no pre-selection (mvv API) | DS4-02; Task 1 |
| CONTEXT (coordinator) | Known custom-language bug: do not fix, may note | DS4-19 |
| CONTEXT (owner decision 2026-11-01) | Totals include the level bonus everywhere; Atributos sheet aligned (closes PD-02) | DS4-09; Task 2 (card + reference-sheets.tsx + quick-actions render test) |
| CONTEXT (coordinator) | XP target/progress from existing level/XP functions | DS4-12; Task 2 |
| CONTEXT (coordinator) | Every file ≤ ~300 lines | Task 3 size gate over all 12 files |
| CONTEXT (owner rule) | Look from mock, behavior from app, decision table in SUMMARY | `<design_behavior_decisions>` + `<output>` |
| CONTEXT (memory) | No auth by design | Nothing adds auth |
| DoD | tsc, lint (no new warnings), bun test, build | Every task verify + `<verification>` |
</coverage_audit>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Tracer — view model + Vitalidade and Berkana cards opening the quick sheets, tab returning cards in mock order, render test</name>
  <files>components/character/basic-info/basic-info-model.ts, components/character/basic-info/basic-info-model.test.ts, components/character/basic-info/vitality-card.tsx, components/character/basic-info/berkana-card.tsx, components/character/basic-info-tab.tsx, components/character/basic-info-tab.render.test.ts</files>
  <precondition>261101-mvt and 261101-mvv are committed: `grep -q 'export function useQuickSheet' components/character/quick-sheets/quick-sheet-context.tsx && grep -q 'export const BERKANA_STATE_DISPLAY' components/character/resource-display.ts && grep -q 'export function getBerkanaState' lib/calculations/index.ts && grep -q 'export function SectionCard' components/ui/section-card.tsx` succeeds.</precondition>
  <read_first>
    - .planning/design/ferro-brasa/README.md (whole file, especially "Important: the design is visual direction, not a functional spec")
    - .planning/quick/261101-mvv-*/261101-mvv-SUMMARY.md (final `<interfaces>`, Cura revision, decisions DB-01..DB-16)
    - .planning/quick/261101-mvt-*/261101-mvt-SUMMARY.md if present (final SectionCard / NumericDisplay / StatTile / EditableField API)
    - components/character/basic-info/vitality-card.tsx and berkana-card.tsx AS LEFT BY 261101-mvv (whole files)
    - components/character/resource-display.ts, components/character/quick-sheets/quick-sheet-context.tsx, components/ui/section-card.tsx, components/ui/numeric-display.tsx
    - lib/calculations/index.ts: the mvv section "RECURSOS EM JOGO" (signatures of the vitality/berkana helpers)
    - Ficha.dc.html lines 178-221 (Vitalidade and Berkana look)
    - components/character/notes-tab.render.test.ts (mock.module pattern for '@/lib/api/queries', process-wide caveat, createElement + renderToString with no JSX)
  </read_first>
  <behavior>
    Model (basic-info-model.test.ts):
    - getFillPercent:
      - (50,100)=50; (0,100)=0; (150,100)=100; (-5,100)=0
      - (5,0)=0; (5,-10)=0; (NaN,100)=0
    - buildVitalityView, input level 7, vitality {race:200, class:250}, currentVitality {notavel:0, ferido:1000}:
      - maxTotal 19200 and currentTotal 13160, both equal to calculateVitalityTotal on the helper outputs
      - stage 'ferido', stagePosition 2
      - rows: 6 entries in VITALITY_LEVELS order
        - the ferido row is { current 1000, max 3440, isCurrent true }
        - notavel: percent 0, isCurrent false
        - gravementeFerido: current = max = 3280, percent 100
        - every row.current equals resolveCurrentVitalityLevels(...)[key]
    - buildVitalityView with vitality {race:0, class:0} and level 0 (stored undefined): stage null, stagePosition null, every percent 0
    - buildVitalityView with level, vitality and currentVitality all undefined does not throw
    - buildBerkanaView:
      - {level 7, maxBerkana 170, currentBerkana 85, berkanaBonus 15} → current 85, max 170, bonus 15, state 'metade', percent 50
      - {level 7, maxBerkana 0, currentBerkana 200, berkanaBonus 15} → max 185, state 'cheia', percent 100
      - {} → current 100, max 100, bonus 0, state 'cheia' (destructuring defaults, same as today's card)
    Render (basic-info-tab.render.test.ts), fixture A unlocked:
    - fixture A: level 7, currentXP 57, vitality {race:200, class:250}, currentVitality {notavel:0, ferido:1000}, maxBerkana 170, currentBerkana 85, berkanaBonus 15; other fields as in Task 3's fixture, or absent for now
    - the html contains "13.160", "19.200", "2/6", "text-vitality-ferido", "atual", "Dano", "Cura", "O dano desce do Notável até o Coma."
    - it contains "Pela metade", "Gastar", "Recuperar" and "width:50%"
    - the section heading texts, in document order, start with "Vitalidade", "Berkana"
    - it contains no `<input` substring: no field is in edit state at render, and the card no longer has an inline amount input
    - the stub mutation and the openSheet mock were never called
    - a character with vitality {race:0, class:0} and level 0 renders "Sem vitalidade definida" and no "text-vitality-coma"
  </behavior>
  <action>
    Step 0, before editing anything: record this item's base commit for the Task 3 diff gate. Run git rev-parse HEAD and write the output to the path printed by git rev-parse --git-path gsd-261101-mvw-base.

    RED:
    1. Create components/character/basic-info/basic-info-model.test.ts (bun:test; single quotes, no semicolons, Portuguese comments) with describe blocks named getFillPercent, buildVitalityView and buildBerkanaView covering the model bullets in `<behavior>`. Compute cross-check values with the real lib/calculations helpers, and also assert the literal numbers listed.
    2. Create components/character/basic-info-tab.render.test.ts:
       - Copy the header comment and the mock.module pattern from notes-tab.render.test.ts: a useUpdateCharacter stub returning a mocked async save, isPending false and error null.
       - Import BasicInfoTab dynamically after mock.module. Import QuickSheetContext statically (it does not import the queries module).
       - Render with createElement(QuickSheetContext.Provider, { value: { openSheet } }, createElement(BasicInfoTab, props)), where openSheet is a bun mock. Use no JSX.
       - Build the fixture as a plain object cast through unknown to CharacterData (no any).
       - Read heading order by matching every h2/h3 element (tolerate nested tags: capture the inner HTML, strip tags, trim).
       - Cover the render bullets.
    Run both test files and see them fail. Commit as test(261101-mvw).

    GREEN:
    1. components/character/basic-info/basic-info-model.ts. No 'use client', no JSX, no React. Single quotes, no semicolons, Portuguese banner comments and short JSDoc as in lib/calculations. Imports come only from '@/lib/calculations' and '@/lib/constants/character'. It defines NO game formula; it only composes existing functions plus display clamping.
       - getFillPercent(current: number, max: number): number. Returns 0 when either value is non-finite or max <= 0; otherwise Math.min(100, Math.max(0, current / max * 100)). Display only.
       - buildVitalityView({ level, vitality, currentVitality }). Input fields are optional and nullable; currentVitality is typed with mvv's CurrentVitalityInput and vitality as a partial VitalityBase.
         - maxLevels = calculateVitalityLevels(toVitalityBase(vitality), level || 0)
         - current = resolveCurrentVitalityLevels(currentVitality, maxLevels)
         - currentTotal and maxTotal via calculateVitalityTotal
         - stage = getCurrentVitalityStage(current, maxLevels)
         - stagePosition = stage ? VITALITY_LEVELS.indexOf(stage) + 1 : null
         - rows = VITALITY_LEVELS mapped to { key, current: current[key], max: maxLevels[key], percent: getFillPercent(...), isCurrent: key === stage }
         - It returns all of these plus maxLevels and current.
       - buildBerkanaView(character), parameter typed as Parameters<typeof resolveBerkanaPool>[0]:
         - pool = resolveBerkanaPool(character)
         - bonus comes from the same destructuring default today's card uses (berkanaBonus = 0, undefined only)
         - returns { current: pool.current, max: pool.max, bonus, state: getBerkanaState(pool.current, pool.max), percent: getFillPercent(pool.current, pool.max) }
    2. components/character/basic-info/vitality-card.tsx, rebuilt on the mvv version:
       - Delete the card's amount input, its apply and restore handlers, both inline buttons and the local amount state. Drop updateCharacterMutation from the props: the card performs no writes (DS4-02). No comment needs to describe the removed write path.
       - Props: Pick of CharacterTabProps for character, characterId and isEditMode. Destructure level, vitality and currentVitality, then view = buildVitalityView({ level, vitality, currentVitality }).
       - const { openSheet } = useQuickSheet().
       - Render a SectionCard with title "Vitalidade" and data-section "vitality" (kept). Its action slot holds the stage badge (mock line 181):
         - an inline-flex, gap-1.5, rounded-(--radius), border, px-2.5, py-1, text-sm, font-semibold span
         - with a stage: the VITALITY_STAGE_DISPLAY border and text classes, Icon size-4 aria-hidden, the full label, and a font-numeric tabular-nums opacity-80 span whose text is ONE template string `${view.stagePosition}/${VITALITY_LEVELS.length}` (React SSR splits adjacent text nodes, and the test matches "2/6")
         - without a stage (DS4-20): border-border, text-muted-foreground, Heart, "Sem vitalidade definida"
       - Body, in order (mock lines 183-204):
         a. NumericDisplay size "hero" with value formatGameNumber(view.currentTotal) and max formatGameNumber(view.maxTotal) (DS4-05).
         b. The 6-segment bar: an aria-hidden div with flex, h-2.5 and gap-[3px]. For each row: a flex-1 div with flex, justify-end, overflow-hidden, rounded-[1px] and bg-vitality-track, holding an inner div with the stage bgClassName and inline style width `${row.percent}%` (DS4-06).
         c. A grid-cols-2 gap-2 row of two shadcn Buttons, type button, variant outline, h-12, font-semibold, each with an 18px icon (DS4-02):
            - "Dano" with Swords: border-destructive, bg-transparent, text-destructive, hover:bg-destructive/10
            - "Cura" with HeartPulse: bg-secondary, text-secondary-foreground
            Each onClick calls openSheet('vit') inline, so the source holds two calls. mvv's API takes only the kind, so there is no action pre-selection (DS4-02); record that in the SUMMARY. Do not edit mvv's sheet files for this. Both buttons render in both lock modes (DS4-15).
         d. Per-stage rows: a flex-col. Each row is a div with grid, grid-cols-[22px_1fr_auto], items-center, gap-2.5, min-h-11, -mx-2, px-2 and rounded-(--radius). The current row adds bg-muted.
            - the stage Icon, size-[18px], in its textClassName
            - a span with the full label: font-bold when current, otherwise font-normal. When current, it is followed by a span "atual" (text-[11px], uppercase, tracking-[0.08em], text-muted-foreground).
            - a right-aligned flex items-baseline gap-1 group: the EditableNumberField with exactly today's section "currentVitality", field = the stage key, value row.current, currentCharacterData character and isEditMode, displayClassName "justify-end px-1 text-[17px] font-semibold", followed by a muted text-sm span "/ {row.max}" (raw number, DS4-05)
         e. A grid-cols-2 gap-3 row with the base fields (DS4-04): EditableNumberField section "vitality", field "race", value vitality.race || 0, label "Base da raça"; and the same with field "class", value vitality.class || 0, label "Base da classe". Both get currentCharacterData character and isEditMode, exactly as today.
         f. The caption "O dano desce do Notável até o Coma." (text-[13px] muted).
       - Imports: SectionCard, NumericDisplay, Button, EditableNumberField, lucide icons, VITALITY_LEVELS, VITALITY_STAGE_DISPLAY, formatGameNumber, useQuickSheet, buildVitalityView. Drop the shadcn Card primitives, Separator, Input, the toast import and every helper import that becomes unused.
    3. components/character/basic-info/berkana-card.tsx, rebuilt on the mvv version:
       - Delete the quick-edit handler and its three buttons, and drop updateCharacterMutation from the props (DS4-07).
       - Props: Pick of CharacterTabProps for character, characterId and isEditMode. view = buildBerkanaView(character); const { openSheet } = useQuickSheet().
       - SectionCard title "Berkana", tone "berkana", data-section "berkana" (kept). The action slot is an inline-flex gap-1.5 text-sm font-semibold text-berkana span with BERKANA_STATE_DISPLAY[view.state].Icon (size-4, aria-hidden) and its label.
       - Body (mock lines 211-220):
         a. A flex items-baseline gap-2 row: EditableNumberField with exactly today's section "berkana", field "current", value view.current, max view.max, currentCharacterData character and isEditMode, displayClassName "text-[44px] leading-none font-semibold". It is followed by a font-numeric tabular-nums text-[20px] text-muted-foreground span "/ {view.max}" (raw).
         b. Bar: an aria-hidden h-2.5 rounded-[1px] bg-berkana-track overflow-hidden div with a bg-berkana inner div, inline style width `${view.percent}%`.
         c. A grid-cols-2 gap-2 row of two outline Buttons, h-12, font-semibold:
            - "Gastar" with Sparkles: border-berkana, bg-transparent, text-berkana, hover:bg-berkana/10
            - "Recuperar" with RotateCcw: bg-secondary
            Each onClick calls openSheet('berk') inline. They are visible in both modes.
         d. Footer, grid-cols-2 gap-3 (DS4-08): EditableNumberField label "Máxima" (section "berkana", field "max", value view.max) and EditableNumberField label "Bônus" (section "berkana", field "bonus", value view.bonus). Both get currentCharacterData character and isEditMode.
    4. components/character/basic-info-tab.tsx:
       - Fix the header comment to the real path. Destructure only character, characterId and isEditMode, and keep one useUpdateCharacter() (still needed by LanguagesCard).
       - Return a fragment (DS4-01) in this order: VitalityCard, BerkanaCard, WeaponsCard, then the two existing attribute cards (Task 2 merges them), ExperienceCard, ArmorCard, BasicDetailsCard, and LanguagesCard (with updateCharacterMutation).
       - Each card gets the shared cardProps.
       - No wrapper div: the cards are direct children of the layout's column flow.
    Run the two test files until green, then the gate. Commit as feat(261101-mvw).
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && M=components/character/basic-info/basic-info-model.ts && V=components/character/basic-info/vitality-card.tsx && K=components/character/basic-info/berkana-card.tsx && grep -q 'export function getFillPercent' $M && grep -q 'export function buildVitalityView' $M && grep -q 'export function buildBerkanaView' $M && grep -q 'resolveCurrentVitalityLevels(' $M && grep -q 'calculateVitalityTotal(' $M && grep -q 'getCurrentVitalityStage(' $M && grep -q 'resolveBerkanaPool(' $M && grep -q 'getBerkanaState(' $M && [ "$(grep -c "openSheet('vit'" $V)" -ge 2 ] && [ "$(grep -c "openSheet('berk'" $K)" -ge 2 ] && grep -q '<SectionCard' $V && grep -q '<SectionCard' $K && grep -q 'VITALITY_STAGE_DISPLAY' $V && grep -q 'BERKANA_STATE_DISPLAY' $K && grep -q 'buildVitalityView(' $V && grep -q 'buildBerkanaView(' $K && ! grep -q 'mutateAsync' $V && ! grep -q 'mutateAsync' $K && grep -q 'section="currentVitality"' $V && grep -q 'section="vitality"' $V && grep -q 'field="current"' $K && grep -q 'field="max"' $K && grep -q 'field="bonus"' $K && bun test components/character/basic-info/basic-info-model.test.ts components/character/basic-info-tab.render.test.ts && npx tsc --noEmit && bun run lint 2>&1 | grep -q '(0 errors, 1 warning)' && bun test && BF=$(git rev-parse --git-path gsd-261101-mvw-base) && B=$(cat "$BF") && git cat-file -e "$B^{commit}" && echo TRACER-OK</automated>
  </verify>
  <done>
    - The view model composes the mvv helpers. Its tests pin 13160 / 19200 / 'ferido' / 2, the null-stage case and the Berkana defaults.
    - The Vitalidade and Berkana cards are SectionCards with the design look. Dano/Cura and Gastar/Recuperar open the vit/berk sheets in both modes. The cards perform no writes, and every inline field keeps its section/field path.
    - The tab returns its cards as a fragment in mock order.
    - The render test passes; tsc, lint (1 warning) and the full bun test pass. TRACER-OK is printed.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Atributos (totals grid + collapsible distribution table) with the Atributos sheet aligned to level-inclusive totals, Experiência e Nível, Informações Básicas</name>
  <files>components/character/basic-info/basic-info-model.ts, components/character/basic-info/basic-info-model.test.ts, components/character/basic-info/attribute-cards.tsx, components/character/basic-info/profile-cards.tsx, components/character/basic-info-tab.tsx, components/character/basic-info-tab.render.test.ts, components/character/quick-sheets/reference-sheets.tsx, components/character/quick-actions.render.test.ts</files>
  <read_first>
    - components/character/basic-info/attribute-cards.tsx and profile-cards.tsx (whole files: the field paths, labels, placeholders and min/max to keep)
    - components/character/quick-sheets/reference-sheets.tsx lines 1-12 (imports), 138-165 (AttributesSheetBody / AttributesSheet) and 170-232 (SkillsSheetBody / SkillsSheet: the `level` prop pattern to mirror)
    - components/character/quick-actions.render.test.ts lines 1-30 (imports, html helper) and 149-160 (the AttributesSheetBody describe block to update)
    - lib/calculations/index.ts lines 36-60 (attribute functions) and 210-242 (XP functions, canLevelUp); processLevelUp lines 283-320 (currentXP is XP inside the level)
    - components/ui/stat-tile.tsx, components/ui/inline-field-state.tsx (INLINE_FIELD_LABEL_CLASS)
    - Ficha.dc.html lines 242-310 (Atributos, Experiência, Armadura, Informações Básicas look)
  </read_first>
  <behavior>
    Model:
    - buildAttributeRows({ agilidade: { race: 8, class: 6, bonus: 1 } }, 7):
      - 14 rows in ATTRIBUTES order, labels from ATTRIBUTE_LABELS
      - agilidade = { race 8, class 6, bonus 1, levelBonus 1, total 16 }
      - carisma (absent) = { 0, 0, 0, levelBonus 1, total 1 }
      - every total equals the frozen expression of today's summary card: calculateAttributeTotal(toAttributeValue(attributes[key] || { race: 0, class: 0, bonus: 0 }), level || 0)
    - buildAttributeRows(undefined, undefined) returns 14 zero rows and does not throw
    - buildExperienceView:
      - (7, 57) → { level 7, xp 57, required 80, remaining 23, percent 71.25, caption 'Faltam 23 XP para o nível 8' }
      - (7, 80) → caption 'XP suficiente para o nível 8', percent 100
      - (7, 200) → percent 100
      - (undefined, undefined) → required 10, caption 'Faltam 10 XP para o nível 1', percent 0
      - (99, 5000) → caption 'Nível máximo'
    Render, fixture A unlocked:
    - attributes as above: contains "inclui +1 de nível", "16", "Distribuição (raça + classe + bônus + nível)" and aria-expanded="false"
    - contains "Faltam 23 XP para o nível 8" and "width:71.25%"
    - contains "Tendência", "Pontos de Virtude" and the fixture class value "Caçador Errante"
    - headings in order: Vitalidade, Berkana, Armas, Atributos, Experiência e Nível, Armadura, Informações Básicas, Linguagens (Armas/Armadura/Linguagens keep their old titles until Task 3; assert only the Atributos, Experiência e Nível and Informações Básicas positions relative to Vitalidade/Berkana, then tighten to the full list in Task 3)
    - a level-0 fixture renders no "inclui +" caption
    Atributos sheet (quick-actions.render.test.ts, owner decision PD-02):
    - AttributesSheetBody with attributes { agilidade: { race: 8, class: 6, bonus: 1 } } and level 7:
      - contains "Agilidade" and ">16<"
      - contains "Carisma" and ">1<" (no data, level bonus 1)
      - the test computes both expected values with calculateAttributeTotal(toAttributeValue(...), 7)
    - The same attributes with level 0 render ">15<" and ">0<" (no bonus below level 5)
    - The test file no longer imports or calls the base-only helper
  </behavior>
  <action>
    RED:
    - Extend basic-info-model.test.ts with describe blocks buildAttributeRows and buildExperienceView. Include a frozen copy of today's summary-card total expression (comment: copied from the base commit recorded in Task 1 Step 0; never edit), and compare every row against it.
    - Extend the render test with the Task 2 bullets.
    - In components/character/quick-actions.render.test.ts, rewrite the AttributesSheetBody describe block to the "Atributos sheet" bullets in `<behavior>`:
      - pass `{ attributes, level }` to AttributesSheetBody
      - compute expectations with calculateAttributeTotal
      - rename the test description to say it shows the total with the level bonus (owner decision 2026-11-01)
      - remove the base-only helper from the import list
      - leave the rest of the file unchanged
    - Run and see them fail. Commit as test(261101-mvw).

    GREEN:
    1. basic-info-model.ts:
       - buildAttributeRows(attributes, level). attributes is a nullable record of partial AttributeValue; level is number | null | undefined. For each key in ATTRIBUTES:
         - attr = attributes?.[key] || { race: 0, class: 0, bonus: 0 } (today's fallback)
         - the row is { key, label: ATTRIBUTE_LABELS[key], race: attr.race || 0, class: attr.class || 0, bonus: attr.bonus || 0, levelBonus: getAttributeLevelBonus(level || 0), total: calculateAttributeTotal(toAttributeValue(attr), level || 0) }
         The field values keep today's `|| 0` expressions (DS4-09, DS4-11).
       - buildExperienceView(level, currentXP), both number | null | undefined:
         - lvl = level || 0, xp = currentXP || 0
         - required = getXPRequiredForNextLevel(lvl), remaining = Math.max(0, required - xp), percent = getFillPercent(xp, required)
         - caption, first match wins (DS4-12):
           1. lvl >= 99 → 'Nível máximo'
           2. canLevelUp(xp, lvl) → template 'XP suficiente para o nível {lvl + 1}'
           3. otherwise → template 'Faltam {remaining} XP para o nível {lvl + 1}'
         Build each caption as ONE string here, so the card renders a single text node.
         Return { level: lvl, xp, required, remaining, percent, caption }.
    2. components/character/basic-info/attribute-cards.tsx: replace both exported cards with one exported AttributesCard({ character, characterId, isEditMode }) (DS4-10: no expand button, no modal-opener prop).
       - rows = buildAttributeRows(attributes, level); levelBonus = getAttributeLevelBonus(level || 0); expanded state via useState(false) (today's default); a useId for aria-controls.
       - SectionCard title "Atributos", className gap-3. The action slot, only when levelBonus > 0, holds a text-[13px] text-muted-foreground span with ONE template string 'inclui +{levelBonus} de nível' (DS4-09).
       - Totals grid: grid, grid-cols-[repeat(auto-fill,minmax(96px,1fr))], gap-1.5, with one StatTile (variant tile) per row: label row.label, value row.total.
       - Toggle: a native button, type button, with flex, h-11, w-full, items-center, justify-between, border-t, bg-transparent, text-[15px] and font-semibold. It has aria-expanded and aria-controls, the text "Distribuição (raça + classe + bônus + nível)", and ChevronUp or ChevronDown (size-[18px], aria-hidden).
       - When expanded, a region with that id and flex-col text-sm.
         - Header row: grid, grid-cols-[minmax(0,1fr)_repeat(3,2.75rem)_2.25rem_2.5rem], gap-0.5, pb-1.5, text-xs, text-muted-foreground, text-center, with the cells Atributo (text-left), Raça, Cla., Bôn., Nív., Total.
         - One row per attribute, same grid, items-center, min-h-11, border-t, text-center:
           - the label: text-left, truncate, with title = label
           - three EditableNumberFields with exactly today's props: section "attributes", fields as the template strings key.race / key.class / key.bonus, values row.race / row.class / row.bonus, currentCharacterData character and isEditMode, with displayClassName "justify-center px-1 text-base"
           - a muted font-numeric tabular-nums span with row.levelBonus
           - a font-numeric tabular-nums font-bold text-primary span with row.total
       - Drop the shadcn Card primitives and unused imports.
    3. components/character/basic-info/profile-cards.tsx:
       - BasicDetailsCard (DS4-14): a module constant BASIC_INFO_FIELDS, a ReadonlyArray of { field, label, placeholder }, where field is the string union of the 12 keys. It holds the exact twelve entries of today's card, in today's order, with today's labels and placeholders: 'characterName', 'playerName', 'class', 'race', 'deity', 'homeland', 'alignment', 'gender', 'age', 'weight', 'height', 'virtuePoints'.
         - Render a SectionCard titled "Informações Básicas" containing a grid-cols-2 gap-x-3.5 gap-y-3 grid that maps the constant to EditableField with section "basic", field, value character[field], label, placeholder and isEditMode (today's props).
         - className is "col-span-2 min-w-0" for characterName and "min-w-0" for the rest.
       - ExperienceCard (DS4-12): view = buildExperienceView(level, currentXP). SectionCard title "Experiência e Nível". Body: a flex items-center gap-4 row with:
         - Level box: flex, size-[72px], shrink-0, flex-col, items-center, justify-center, rounded-(--radius), border, border-primary. Inside: a text-[11px] uppercase tracking-[0.1em] text-muted-foreground span "Nível", then the EditableNumberField with exactly today's props (section "basic", field "level", value level || 0, min 0, max 99, isEditMode), className "w-full", displayClassName "justify-center px-1 text-[34px] leading-none font-semibold text-primary".
         - A flex-1 flex-col gap-2 column:
           - a flex items-baseline justify-between row: "XP" (text-sm muted) on the left; on the right, a flex items-baseline gap-1 group with the EditableNumberField (section "basic", field "currentXP", value currentXP || 0, isEditMode, displayClassName "px-1 text-[20px] font-semibold") and a muted text-[15px] font-numeric tabular-nums span "/ {view.required}"
           - an aria-hidden h-2 rounded-[1px] bg-vitality-track overflow-hidden bar with a bg-primary fill at view.percent
           - a text-[13px] muted span with view.caption
       - Drop the shadcn Card primitives and the direct XP-function import if it becomes unused.
    4. basic-info-tab.tsx: replace the two old attribute cards with one AttributesCard in the same position.
    5. components/character/quick-sheets/reference-sheets.tsx (DS4-09, owner decision 2026-11-01). Change only the Atributos body and sheet:
       - AttributesSheetBody's props become `{ attributes, level }`, with level typed number | null | undefined like SkillsSheetBody.
       - Each StatTile value becomes calculateAttributeTotal(toAttributeValue(attributes?.[attributeKey]), level || 0).
       - AttributesSheet passes level={character.level}.
       - Update the Portuguese comment above the body to say it is the total with the level bonus, by owner decision.
       - Remove the base-only helper from the import list (lint flags an unused import).
       - Leave every other line of the file unchanged.
    Run the tests and the gate. Commit as feat(261101-mvw).
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && M=components/character/basic-info/basic-info-model.ts && A=components/character/basic-info/attribute-cards.tsx && P=components/character/basic-info/profile-cards.tsx && grep -q 'export function buildAttributeRows' $M && grep -q 'export function buildExperienceView' $M && grep -q 'calculateAttributeTotal(' $M && grep -q 'getAttributeLevelBonus(' $M && grep -q 'getXPRequiredForNextLevel(' $M && grep -q 'canLevelUp(' $M && grep -q 'export function AttributesCard' $A && grep -q '<StatTile' $A && grep -q 'aria-expanded' $A && grep -q 'buildAttributeRows(' $A && grep -q '\.race`' $A && grep -q '\.class`' $A && grep -q '\.bonus`' $A && grep -q 'buildExperienceView(' $P && grep -q 'field="level"' $P && grep -q 'field="currentXP"' $P && grep -q "'virtuePoints'" $P && grep -q "'characterName'" $P && grep -q '<SectionCard' $A && grep -q '<SectionCard' $P && grep -q '<AttributesCard' components/character/basic-info-tab.tsx && ! grep -q 'AttributesSummaryCard' components/character/basic-info-tab.tsx $A && R=components/character/quick-sheets/reference-sheets.tsx && grep -q 'calculateAttributeTotal(' $R && [ "$(grep -c 'level={character.level}' $R)" -ge 2 ] && ! grep -q 'calculateAttributeBase(' $R components/character/quick-actions.render.test.ts && grep -q 'calculateAttributeTotal(' components/character/quick-actions.render.test.ts && bun test components/character/basic-info/basic-info-model.test.ts components/character/basic-info-tab.render.test.ts components/character/quick-actions.render.test.ts && npx tsc --noEmit && bun run lint 2>&1 | grep -q '(0 errors, 1 warning)' && bun test && echo ATTR-XP-INFO-OK</automated>
  </verify>
  <done>
    - Atributos shows calculateAttributeTotal tiles (equal to today's summary-card expression in the frozen-copy test). The distribution table starts collapsed, with editable Raça/Cla./Bôn. on the same paths, and the real "inclui +N de nível" caption shows only when N > 0.
    - Experiência e Nível shows the editable level box, the editable XP over getXPRequiredForNextLevel, the bar and the canLevelUp-aware caption.
    - Informações Básicas shows the 12 fields in two columns with today's labels and paths.
    - The bottom-bar Atributos sheet shows calculateAttributeTotal(attribute, level), the same numbers as the card (owner decision 2026-11-01). Its render test asserts the level-inclusive values.
    - Tests, tsc, lint (1 warning) and bun test pass. ATTR-XP-INFO-OK is printed.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Armas, Armadura and Linguagens; lock behavior across the tab; final gates</name>
  <files>components/character/basic-info/basic-info-model.ts, components/character/basic-info/basic-info-model.test.ts, components/character/basic-info/equipment-cards.tsx, components/character/basic-info/languages-card.tsx, components/character/basic-info-tab.render.test.ts</files>
  <read_first>
    - components/character/basic-info/equipment-cards.tsx and languages-card.tsx (whole files: every section/field path, placeholder, min/max, and the three language write handlers to keep statement for statement)
    - components/ui/editable-field.tsx lines 30-170 (buildUpdateData; the languages 3-segment path is the DS4-19 bug, do not touch) and the EditableTextArea wrapper
    - lib/api/character-concurrency.ts (isCharacterConflictError)
    - lib/schemas/character.ts lines 140-215 (weapon, armor and languages shapes)
    - Ficha.dc.html lines 223-240 (Armas), 281-291 (Armadura), 312-321 (Linguagens) and 828-831 (chip colors)
  </read_first>
  <behavior>
    Model:
    - hasWeaponContent:
      - null → false; 'x' → false; {} → false; { name: '', level: 0 } → false
      - { name: 'Adaga' } → true; { damage: { critical: '7000' } } → true; { description: 'x' } → true; { level: 3 } → true
    - buildLanguageChips:
      - { standard: { comum: true }, custom: [{ name: 'Malashin', known: true }, { name: '', known: false }] }:
        - standard = the 6 STANDARD_LANGUAGES in order, labels Comum, Errante, Élfico, Sombrio, Anão, Sigílico; comum known, the others not
        - custom = [{ index 0, name 'Malashin', known true }, { index 1, name '', known false }]
      - custom index-keyed { '0': { name: 'X' } } → custom [] (DS4-19, same as today)
      - a custom array with a null hole keeps the storage index of later entries
      - undefined → 6 standard chips, 0 custom
    Render, full fixture A (adds to Task 1's fields):
    - weapons [{ name: 'Espada Longa', level: 37, damage: { d25: '3000', critical: '7000' }, description: 'Lâmina antiga' }, null, { name: 'Adaga' }]
    - armor { name: 'Traje', description: 'Couro e Aço', totalVitality: 1500, currentVitality: 1125 }
    - languages { standard: { comum: true }, custom: [{ name: 'Malashin', known: true }] }
    - characterName 'Kael', playerName 'Enio', class 'Caçador Errante'
    - Unlocked:
      - headings in order: exactly Vitalidade, Berkana, Armas, Atributos, Experiência e Nível, Armadura, Informações Básicas, Linguagens
      - contains "Espada Longa", "Nv", "3000", "7000", "Crít.", "Lâmina antiga", "Máximo de 3 armas." and "Nome da Arma 2" (the empty slot is editable)
      - contains "Traje", "Couro e Aço", "1125", "1500", "width:75%"
      - contains "Élfico", "Sigílico", "Malashin", "Outra", aria-pressed="true", aria-pressed="false" and role="button"
    - Locked (same fixture, isEditMode false):
      - contains no role="button", no "Outra", no "Máximo de 3 armas.", no "Nome da Arma 2", no aria-pressed
      - contains "Dano", "Cura", "Gastar", "Recuperar", "Espada Longa", "Adaga", "Malashin", "16" and "13.160"
    - Locked with weapons [] → "Nenhuma arma cadastrada."
    - No render (locked or unlocked) calls the stub mutation or openSheet
  </behavior>
  <action>
    RED: add describe blocks hasWeaponContent and buildLanguageChips to the model test. Extend the render test with the full fixture and every Task 3 bullet; replace Task 2's partial heading-order assertion with the full eight-title list. Run and see them fail. Commit as test(261101-mvw).

    GREEN:
    1. basic-info-model.ts:
       - STANDARD_LANGUAGE_LABELS: a Record over the STANDARD_LANGUAGES element type: comum 'Comum', errante 'Errante', elfico 'Élfico', sombrio 'Sombrio', 'anão' 'Anão', sigilico 'Sigílico'. Display only; keys unchanged (DS4-17).
       - hasWeaponContent(weapon: unknown): boolean, narrowed with typeof checks, no any. True when weapon is an object with any of:
         - a non-empty string name
         - a truthy level
         - a non-empty string description
         - a damage object with at least one non-empty string among d25, d50, d75, d100, critical
       - buildLanguageChips(languages). languages is a nullable object with optional standard (record of booleans) and custom typed unknown.
         - standard: STANDARD_LANGUAGES mapped to { key, label, known: Boolean(languages?.standard?.[key]) }, which is today's `|| false` read.
         - custom: only when Array.isArray(languages?.custom) (DS4-19). Map with the storage index, skip entries that are not objects, and return { index, name: string name or '', known: Boolean(entry.known) }.
    2. components/character/basic-info/equipment-cards.tsx (DS4-15, DS4-16):
       - WeaponsCard({ character, characterId, isEditMode }). Keep today's read: weapons defaults to {} and each slot is weapons[index.toString()] || {}.
         - Unlocked: slots 0..2. Locked: only the slots where hasWeaponContent is true.
         - Render a SectionCard titled "Armas" with data-section "weapons" (kept). With no visible slot, it holds a muted text-sm "Nenhuma arma cadastrada."
         - Each slot is a flex-col gap-2 pb-3 border-b, last:border-b-0 last:pb-0 div:
           a. A flex items-center justify-between gap-2 header:
              - an EditableField with exactly today's section "weapons", field as the template string index.name, value weapon.name, placeholder as the template 'Nome da Arma {index + 1}', currentCharacterData character and isEditMode, className "min-w-0 flex-1", displayClassName "font-serif text-[17px] font-semibold". Drop the old "Nome" label.
              - a badge div (flex, shrink-0, items-center, gap-1, rounded-(--radius), bg-secondary, px-2, text-[13px], font-semibold) holding the text "Nv" and the EditableNumberField for index.level (value weapon.level || 0, min 0, max 99, currentCharacterData, isEditMode, displayClassName "px-1 text-[13px] font-semibold"). Drop the old "Nível" label.
           b. A grid grid-cols-5 gap-1 damage grid built from a module constant DAMAGE_CELLS of { key, label, placeholder }:
              - d25 '25%'/'25%', d50 '50%'/'50%', d75 '75%'/'75%', d100 '100%'/'100%', critical 'Crít.'/'Crítico'
              - Each cell is a flex-col items-center gap-0.5 rounded-(--radius) px-0.5 py-1.5 div: bg-muted, or bg-accent for critical. It holds a text-xs muted label and an EditableField with today's field (template index.damage.key), value weapon.damage?.[key], placeholder, currentCharacterData and isEditMode, className "w-full", displayClassName "justify-center px-1 font-numeric tabular-nums text-[17px] font-semibold", plus text-primary for critical.
           c. The description: an EditableTextArea for index.description (placeholder, rows 2 and currentCharacterData as today, plus isEditMode, displayClassName "text-sm text-muted-foreground"). When locked, render it only when the description is a non-empty string.
         - Unlocked only: the muted text-[13px] "Máximo de 3 armas." line.
       - ArmorCard({ character, characterId, isEditMode }), with armor defaulting to {}. Render a SectionCard titled "Armadura" whose action is a Shield icon (size-[18px] text-muted-foreground aria-hidden). Body:
         - A flex items-start justify-between gap-3 row:
           - left, a min-w-0 flex-1 flex-col gap-1 column:
             - an EditableField for "name" (placeholder "Nome da armadura", displayClassName "font-serif text-[17px] font-semibold")
             - an EditableTextArea for "description" (placeholder "Descrição da armadura", rows 2, displayClassName "text-sm text-muted-foreground"). When locked, render it only when non-empty.
           - right, a flex shrink-0 items-baseline gap-1 group:
             - an EditableNumberField for "currentVitality" (value armor.currentVitality || 0, displayClassName "px-1 text-[24px] font-semibold")
             - a muted "/" span
             - an EditableNumberField for "totalVitality" (value armor.totalVitality || 0, displayClassName "px-1 text-base text-muted-foreground")
         - The bar (DS4-13): an aria-hidden h-2 rounded-[1px] bg-vitality-track overflow-hidden div with a bg-chart-5 fill at getFillPercent(armor.currentVitality || 0, armor.totalVitality || 0).
         - Every armor field keeps section "armor" and currentCharacterData character, and gets isEditMode. Drop the old "Nome" / "Vitalidade Total" / "Vitalidade Atual" labels.
       - Drop the shadcn Card primitives.
    3. components/character/basic-info/languages-card.tsx (DS4-15, DS4-17, DS4-18):
       - Props: character, characterId, isEditMode and updateCharacterMutation. Keep `const { languages = {} } = character` and chips = buildLanguageChips(languages).
       - Write handlers, statement for statement as today. Keep the parameter names lang / checked / index and the three updateData expressions:
         - the standard handler spreads languages and languages.standard with the computed key lang set to checked
         - the add handler appends `{ name: '', known: false }` to `languages.custom || []`
         - the custom handler copies languages.custom into updatedCustom and sets updatedCustom[index] to its spread with known: checked
       - Each handler sends that object through the existing save call on updateCharacterMutation (same `{ id: characterId, data: updateData }` argument).
       - Each catch keeps its console.error message unchanged. Then, unless isCharacterConflictError(error), it calls toast.error('Não foi possível salvar a linguagem') from sonner.
       - SectionCard title "Linguagens". Body:
         a. A flex flex-wrap gap-2 chip list: standard chips, then custom chips (label: name or 'Sem nome').
            - Chip classes: inline-flex, min-h-11, items-center, gap-1.5, rounded-(--radius), border, px-3.5, text-[15px], font-medium.
            - known: border-input bg-secondary text-foreground with Check (size-4, aria-hidden)
            - unknown: border-border bg-transparent text-muted-foreground with Minus
            - Unlocked: a button with type button, aria-pressed known and disabled while updateCharacterMutation.isPending. onClick calls the matching handler with !known (custom: its storage index).
            - Locked: a span with the same look and an sr-only "conhecida" / "não conhecida", with no aria-pressed and no handler.
         b. Unlocked only: an "Outra" button (type button, min-h-11, inline-flex, gap-1.5, border, border-dashed, border-input, bg-transparent, px-3.5, text-[15px], text-muted-foreground, Plus icon) that runs the add handler, disabled while pending.
         c. Unlocked only, when chips.custom is not empty: a flex-col gap-2 block headed by an INLINE_FIELD_LABEL_CLASS span "Outras linguagens". Each custom entry gets an EditableField with exactly today's section "languages", field as the template custom.{index}.name, value its name, placeholder "Nome da linguagem", currentCharacterData character and isEditMode.
       - Drop the Checkbox, Separator and shadcn Card primitives.
    4. Run the size check: every file in files_modified is at most 300 lines. If one is longer, extract a sibling card component inside components/character/basic-info/ rather than compressing code, and add it to the SUMMARY.
    Run the full gate. Commit as feat(261101-mvw).
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && M=components/character/basic-info/basic-info-model.ts && E=components/character/basic-info/equipment-cards.tsx && L=components/character/basic-info/languages-card.tsx && grep -q 'export function hasWeaponContent' $M && grep -q 'export function buildLanguageChips' $M && grep -q 'STANDARD_LANGUAGES' $M && grep -q 'hasWeaponContent(' $E && grep -q 'getFillPercent(' $E && grep -q 'bg-chart-5' $E && grep -q '\.damage\.' $E && grep -q 'section="armor"' $E && grep -q '<SectionCard' $E && grep -q 'buildLanguageChips(' $L && grep -q 'aria-pressed' $L && grep -q 'Outra' $L && grep -q "{ name: '', known: false }" $L && grep -q '\[lang\]: checked' $L && grep -q 'known: checked' $L && grep -q 'custom\.\${' $L && grep -q 'isCharacterConflictError' $L && grep -q '<SectionCard' $L && [ "$(grep -l "components/ui/card'" components/character/basic-info/*.tsx | wc -l)" -eq 0 ] && ! grep -rq 'dangerouslySetInnerHTML' components/character/basic-info components/character/basic-info-tab.tsx && for f in components/character/basic-info-tab.tsx components/character/basic-info-tab.render.test.ts components/character/basic-info/*.ts components/character/basic-info/*.tsx components/character/quick-sheets/reference-sheets.tsx components/character/quick-actions.render.test.ts; do [ "$(wc -l < "$f")" -le 300 ] || { echo "too long: $f"; exit 1; }; done && bun test components/character/basic-info/basic-info-model.test.ts components/character/basic-info-tab.render.test.ts && npx tsc --noEmit && bun run lint 2>&1 | grep -q '(0 errors, 1 warning)' && bun test && bun run build && BF=$(git rev-parse --git-path gsd-261101-mvw-base) && B=$(cat "$BF") && git cat-file -e "$B^{commit}" && git diff --quiet "$B" -- lib/calculations lib/api lib/schemas lib/constants lib/defaults lib/store lib/db lib/notes.ts lib/utils.ts prisma package.json bun.lock components/ui components/forms components/character/quick-sheets ':(exclude)components/character/quick-sheets/reference-sheets.tsx' components/character/resource-display.ts components/character/quick-actions-bar.tsx components/character/types.ts components/character/index.ts app && echo BASICOS-OK</automated>
    <human-check>
      Walkthrough with `bun dev`, phone width (390px) and desktop, dark mode, on an existing character:
      1. Básicos shows the eight cards in mock order, flowing in columns on desktop. Each card has a diamond title.
      2. Vitalidade:
         - the badge shows the stage icon, color, label and "N/6"
         - the big total matches the bottom bar
         - the 6 bars drain from Notável
         - the current row is highlighted with "atual"
         - Dano opens the vit sheet; apply 1000 and the numbers drop as before
         - Cura opens the vit sheet
         - editing a stage value inline still saves
      3. Berkana: state label and bar; Gastar/Recuperar open the berk sheet; Atual/Máxima/Bônus edit inline as before (Atual is still clamped to the max).
      4. Atributos: the tiles equal the old card's totals; open "Distribuição", edit a Raça value, and the total updates.
      5. Experiência e Nível: edit the level and XP; the bar and "Faltam N XP para o nível N+1" follow.
      6. Armas and Armadura:
         - at 390px, the 5 damage cells fit and stay tappable, and the critical cell is highlighted
         - edit a damage value and a description
         - the armor bar follows current/total
      7. Linguagens: tap chips to toggle (reload: kept); "Outra" adds an entry; name it below the chips.
      8. Lock the sheet:
         - every field turns into plain text
         - chips stop toggling
         - "Outra", empty weapon slots and the 3-weapon hint disappear
         - Dano/Cura/Gastar/Recuperar still open their sheets, where the writes are disabled
    </human-check>
  </verify>
  <done>
    - Armas, Armadura and Linguagens match the mock look with every field on its old path.
    - Language chips and "Outra" write today's payloads, with a pt-BR toast on non-conflict errors.
    - The locked render has no editable control and no edit-only control, while the four sheet buttons remain.
    - No basic-info file uses the shadcn Card primitives, and every file in files_modified is at most 300 lines.
    - None of the paths that no batch item touches after this item's base changed (scoped diff gate).
    - tsc, lint (0 errors, 1 warning), the full bun test and the build pass. BASICOS-OK is printed.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| stored character JSON → Básicos render | weapons, armor, languages, attributes and vitality are `z.any()` on read, so they may hold legacy shapes (null holes, index-keyed custom languages, missing keys) |
| player input → inline fields / chips → PUT /api/characters/:id | Each write goes through useUpdateCharacter → save core (per-character queue, expectedUpdatedAt, 409 on stale), then the server's Zod updateCharacterSchema |
| card buttons → quick sheets | Dano/Cura/Gastar/Recuperar only open 261101-mvv sheets; the writes and the lock gating live there |

## STRIDE Threat Register

ASVS level 1; block on: high. IDs use this item's namespace (T-mvw-*), following T-mvv-*.

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-mvw-01 | Tampering (wrong persisted data) | Field paths and language payloads in the restyled cards | high | mitigate | Every EditableField keeps today's section/field strings (preservation greps in each task's verify). The three language handlers keep today's statements (greps on `{ name: '', known: false }`, `[lang]: checked`, `known: checked`). buildUpdateData and components/ui stay untouched (Task 3 diff gate). The cards that used to write vitality/Berkana no longer write; the sheets' oracle-tested helpers own those writes |
| T-mvw-02 | Tampering (wrong numbers shown at the table) | Vitalidade, Berkana, Atributos and XP displays | medium | mitigate | basic-info-model only composes lib/calculations and the mvv helpers. Model tests pin literal values and cross-check against the helpers and a frozen copy of today's attribute expression. The Atributos sheet changes only to the owner-decided calculateAttributeTotal(attribute, level), with render-test values. lib/calculations, lib/api and lib/schemas are unchanged since the base commit (Task 3 gate) |
| T-mvw-03 | Denial of service (render crash on legacy JSON) | hasWeaponContent, buildLanguageChips, buildVitalityView, buildAttributeRows | medium | mitigate | typeof narrowing with no any. Tests cover null holes, an index-keyed custom object, non-object entries and fully undefined inputs |
| T-mvw-04 | Elevation of privilege (edit while locked) | Weapons, armor and language controls | low | mitigate | isEditMode now reaches every field, and edit-only controls render only when unlocked. The locked render test asserts no role="button", no aria-pressed and no "Outra". No auth exists by design (owner decision), so the lock is a UI guard, not a security control |
| T-mvw-05 | Information disclosure / injection (stored strings rendered) | Weapon, armor and language names, descriptions | low | mitigate | Text renders through React text nodes only. The Task 3 gate fails if any basic-info file uses raw HTML injection |
| T-mvw-06 | Repudiation (silent failed write) | Language chips / "Outra" | low | mitigate | console.error kept (error object only, never request bodies) plus a fixed pt-BR toast.error. On a 409 the hook's conflict toast and refetch run, and the card skips its own toast so the message is not contradicted |
| T-mvw-07 | Tampering (double writes) | Language chips | low | mitigate | Chips and "Outra" are disabled while the tab's mutation is pending, as today's checkboxes were. The save core serializes per character |
| T-mvw-SC | Tampering | npm/bun installs | low | accept | No packages are installed. The Task 3 diff gate fails if package.json or bun.lock changed since the base commit |
</threat_model>

<verification>
Full gate from the repo root after Task 3:
- `npx tsc --noEmit` exits 0
- `bun run lint` prints "(0 errors, 1 warning)" (only the pre-existing route.ts warning)
- `bun test` exits 0, including basic-info-model.test.ts, basic-info-tab.render.test.ts and the updated quick-actions.render.test.ts
- `bun run build` exits 0
- the scoped diff gate exits 0. `git diff --quiet <mvw base> -- …` checks only paths that no batch item touches after this item's base:
  - lib/{calculations,api,schemas,constants,defaults,store,db}, lib/notes.ts, lib/utils.ts
  - prisma, package.json, bun.lock
  - components/ui, components/forms
  - components/character/quick-sheets, excluding reference-sheets.tsx, which this item owns now
  - components/character/{resource-display.ts,quick-actions-bar.tsx,types.ts,index.ts}
  - app
  It never lists paths owned by this item or by 261101-mvx/mvy/mvz.
- every file in files_modified is at most 300 lines
- Human walkthrough: Task 3 `<human-check>`
</verification>

<success_criteria>
- The Básicos tab matches the Ferro & Brasa basicos screen: eight SectionCards in mock order inside the column flow.
- Vitalidade and Berkana show real stage/state, totals and bars from the existing helpers, and their Dano/Cura and Gastar/Recuperar buttons open the 261101-mvv sheets.
- Every field that is editable today is still editable, on the same path. Language writes are unchanged. Nothing is editable while locked, and edit-only controls are hidden then.
- No new formula: lib/ is unchanged, and the view model only composes existing functions.
- The Atributos card and the bottom-bar Atributos sheet show the same level-inclusive totals (owner decision 2026-11-01).
- tsc, lint (no new warnings), bun test and build pass.
</success_criteria>

<output>
Create `.planning/quick/261101-mvw-redesign-b-sicos-tab-ds-04-restyle-components-character-basi/261101-mvw-SUMMARY.md` when done. Include:
- the `<design_behavior_decisions>` table, plus any new decision taken during execution, including:
  - DS4-02: no vit-sheet pre-selection (mvv's openSheet takes only the kind)
  - any card extracted to stay under 300 lines
- PD-02 as CLOSED: owner decision 2026-11-01, totals include the level bonus everywhere; Atributos sheet aligned in Task 2
- the open question DS4-19 (custom-language index-keyed object bug; `anao` vs `anão` default key)
- the final bun test count, and the line count of each file in files_modified
- a note for 261101-mvx: basic-info-tab.tsx returns a fragment of SectionCards, which is the tab pattern to follow
</output>
