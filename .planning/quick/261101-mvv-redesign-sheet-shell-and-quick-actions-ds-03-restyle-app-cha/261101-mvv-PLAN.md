---
phase: quick-261101-mvv
plan: 01
type: execute
wave: 3                     # ADVISORY ONLY: authoritative wave is recomputed by `quick-batch update` from depends_on
depends_on: ["261101-mvt", "261101-mvu"]   # mvt: BottomSheet/NumericDisplay/StatTile/Toaster styling/tokens; mvu: shares app/character/[id]/page.tsx (owns its early returns)
# Scope note: 14 touched files + 2 deletions. Seven are new and small (sheets, display map, context, one test).
# The risky part (damage/spend writes) is isolated in pure lib/calculations helpers proven against frozen copies
# of the current card code (oracle tests), before any UI uses them.
files_modified:
  - lib/calculations/index.ts
  - lib/calculations/index.test.ts
  - components/character/resource-display.ts
  - components/character/quick-sheets/quick-sheet-context.tsx
  - components/character/quick-sheets/vitality-sheet.tsx
  - components/character/quick-sheets/berkana-sheet.tsx
  - components/character/quick-sheets/reference-sheets.tsx
  - components/character/quick-actions.render.test.ts
  - components/character/basic-info/vitality-card.tsx
  - components/character/basic-info/berkana-card.tsx
  - components/forms/character-layout.tsx
  - components/character/quick-actions-bar.tsx
  - components/character/index.ts
  - "app/character/[id]/page.tsx"
files_deleted:
  - components/character/skills-modal.tsx
  - components/character/attributes-modal.tsx
autonomous: true
requirements: [DS-03]

must_haves:
  truths:
    - "The sheet page shows the design shell: 44px back button, serif character name, subtitle 'jogador · classe · Nv N' (missing parts skipped), 44px refresh button, four underline tabs (Básicos/Perícias/Magias/Notas, long labels Dados Básicos/Perícias & Kit/Magias & Talentos/Anotações from the sm breakpoint), and the 'Modo edição · as alterações são salvas sozinhas' banner only while unlocked"
    - "Tab content flows in CSS columns with column-width 340px and a 12px gap inside a 1200px max-width container"
    - "The bottom bar shows: a vitality button (stage icon + stage color + short stage label + current total), a Berkana button (state icon + current/max), Armas, Perícias, Atributos, and a lock toggle labelled Bloqueado/Desbloqueado that flips the existing isEditMode. The existing hide/show toggle is kept"
    - "Each bar button opens its bottom sheet (vit, berk, arma, pericias, atributos) instead of scrolling to a card or opening a Dialog; the two Dialog modals no longer exist"
    - "Dano in the vit sheet writes exactly the currentVitality object the old 'Aplicar Dano' button wrote, because both now call applyVitalityDamage, which an oracle test proves equal to the frozen base-commit loop over a grid of levels, bases, stored shapes and amounts"
    - "'Restaurar vitalidade máxima' writes currentVitality = calculateVitalityLevels(...) (the old 'Vida Máxima' payload); 'Restaurar Berkana ao máximo' writes currentBerkana = maxBerkana || calculateMaxBerkana(...) (the old 'Berkana Máxima' payload)"
    - "Gastar writes max(0, current - n), which reproduces the old -30/-50 buttons for n = 30/50 (oracle test); Recuperar writes min(max, current + n) and never lowers a value already above max"
    - "Cura in the vit sheet (DB-01, owner decision) writes currentVitality = applyVitalityHeal(...), which undoes damage in reverse order. It refills the deepest drained stage first, up to that stage's calculateVitalityLevels max, then moves up toward Notável. No stage exceeds its max and leftover is discarded. Tests prove heal(damage(full, n), n) = full for every n <= total across the oracle grid, and that heal on a full sheet is a no-op"
    - "The vit sheet shows amount input, chips, a preview of both results (Dano → total (stage) · Cura → total (stage)), Dano and Cura side by side, and below them a prominent full-width 'Restaurar vitalidade máxima'"
    - "With unconfigured vitality (calculateVitalityTotal of the maxima <= 0), Dano and Cura are disabled and the sheet shows 'Vitalidade não configurada · defina Raça e Classe em Básicos → Vitalidade.'; they never write or show a success toast (DB-16)"
    - "While locked (DB-15), the vit and berk sheets still open and show values; their play actions stay visible but disabled, exactly as the current card buttons are gated on isEditMode. Arma, atributos and pericias sheets are read-only in both modes"
    - "Atributos shows calculateAttributeBase per attribute (same numbers as the removed modal); Perícias shows calculateSkillTotal per skill in SKILLS order, in-use skills by default, with a 'Todas · 36' toggle so every skill stays visible"
    - "A save conflict from a sheet shows only the design conflict toast (no extra generic error toast); other failures show a fixed pt-BR toast.error"
    - "Inside CharacterLayout, useQuickSheet().openSheet(kind) opens any of the five sheets, ready for 261101-mvw's Vitalidade/Berkana cards"
    - "npx tsc --noEmit, bun run lint (0 errors, still exactly 1 warning), bun test and bun run build pass"
  artifacts:
    - path: "lib/calculations/index.ts"
      provides: "Pure resource helpers: resolveCurrentVitalityLevels, calculateVitalityTotal, applyVitalityDamage, applyVitalityHeal, getCurrentVitalityStage, resolveBerkanaPool, spendBerkana, recoverBerkana, getBerkanaState"
      contains: "export function applyVitalityHeal"
    - path: "lib/calculations/index.test.ts"
      provides: "Oracle tests against frozen copies of the base-commit card logic, damage/heal round-trip tests, plus behavior tests; TESTED_FUNCTIONS extended to 35"
      contains: "TESTED_FUNCTIONS.length).toBe(35)"
    - path: "components/character/resource-display.ts"
      provides: "Stage/state display map (label, short label, lucide icon, token classes) and pt-BR number formatter"
      exports: ["VITALITY_STAGE_DISPLAY", "BERKANA_STATE_DISPLAY", "formatGameNumber"]
    - path: "components/character/quick-sheets/quick-sheet-context.tsx"
      provides: "Sheet-opening API for cards inside CharacterLayout"
      exports: ["QuickSheetKind", "QuickSheetApi", "QuickSheetContext", "useQuickSheet"]
    - path: "components/character/quick-sheets/vitality-sheet.tsx"
      provides: "vit bottom sheet: amount, 4 chips, Dano/Cura preview, Dano and Cura side by side, prominent restore"
      exports: ["VitalitySheet"]
    - path: "components/character/quick-sheets/berkana-sheet.tsx"
      provides: "berk bottom sheet: amount, 4 chips, preview, Gastar, Recuperar, restore"
      exports: ["BerkanaSheet"]
    - path: "components/character/quick-sheets/reference-sheets.tsx"
      provides: "arma, atributos, pericias bottom sheets plus their render-testable bodies"
      exports: ["WeaponsSheet", "AttributesSheet", "SkillsSheet", "WeaponsSheetBody", "AttributesSheetBody", "SkillsSheetBody"]
    - path: "components/character/quick-actions-bar.tsx"
      provides: "Design bottom bar"
      exports: ["QuickActionsBar"]
    - path: "components/forms/character-layout.tsx"
      provides: "Sticky header slot + underline tabs + edit banner + column card flow + sheet state/context + bar"
      exports: ["CharacterLayout"]
    - path: "components/character/quick-actions.render.test.ts"
      provides: "renderToString tests for the bar and the three reference sheet bodies"
  key_links:
    - from: "components/character/quick-sheets/vitality-sheet.tsx"
      to: "lib/calculations/index.ts"
      via: "applyVitalityDamage / applyVitalityHeal for the Dano / Cura payloads and the preview; calculateVitalityLevels for the restore payload"
      pattern: "applyVitalityHeal("
    - from: "components/character/basic-info/vitality-card.tsx"
      to: "lib/calculations/index.ts"
      via: "the card's existing Aplicar Dano calls the same helper (single source)"
      pattern: "applyVitalityDamage("
    - from: "components/character/quick-sheets/berkana-sheet.tsx"
      to: "lib/calculations/index.ts"
      via: "resolveBerkanaPool + spendBerkana + recoverBerkana"
      pattern: "spendBerkana("
    - from: "components/character/basic-info/berkana-card.tsx"
      to: "lib/calculations/index.ts"
      via: "the card's -30/-50/Berkana Máxima use spendBerkana/resolveBerkanaPool"
      pattern: "spendBerkana("
    - from: "components/character/quick-sheets/vitality-sheet.tsx"
      to: "lib/api/queries.ts"
      via: "updateCharacterMutation.mutateAsync (prop from CharacterLayout's single useUpdateCharacter) -> save core with expectedUpdatedAt"
      pattern: "mutateAsync"
    - from: "components/character/quick-actions-bar.tsx"
      to: "components/forms/character-layout.tsx"
      via: "onOpenSheet(kind) prop sets the layout's openSheet state"
      pattern: "onOpenSheet('vit')"
    - from: "components/forms/character-layout.tsx"
      to: "components/character/quick-sheets/quick-sheet-context.tsx"
      via: "QuickSheetContext.Provider wraps the tabs so cards can call useQuickSheet().openSheet"
      pattern: "QuickSheetContext.Provider"
    - from: "app/character/[id]/page.tsx"
      to: "components/forms/character-layout.tsx"
      via: "header slot prop + isEditMode/onToggleEditMode"
      pattern: "header={"
---

<objective>
Redesign the character sheet shell and quick actions (DS-03) to the Ferro & Brasa look:
- the page header and the CharacterLayout tabs, edit banner and column card flow
- the quick-actions bar rebuilt as the design bottom bar
- five design bottom sheets (vit, berk, arma, atributos, pericias) replacing the bar's scroll-to-card actions and the skills/attributes Dialog modals

Purpose: this is the riskiest redesign item because it touches the damage and Berkana writes used during play. Every number and every write must stay what the app does today. The plan first extracts the current inline write logic into pure lib/calculations helpers, proven equal to frozen copies of the current card code, and only then builds UI on top of them.

Output:
- 9 new pure helpers with oracle and round-trip tests (including applyVitalityHeal, added by owner decision DB-01)
- a display map and number formatter
- a sheet-opening context for 261101-mvw
- five sheets
- the rebuilt bar, layout and page header
- a render test
- the two modal files deleted

OWNER RULE (read first): follow `.planning/design/ferro-brasa/README.md`, section "Important: the design is visual direction, not a functional spec". Follow the mock's look and layout. Keep the current app's behavior (formulas, what each write changes, fields, actions, validation, ordering, persisted keys). Add a mock-only feature only when it is a pure UI convenience over existing fields and clearly makes sense. Record every such call in the SUMMARY. The decisions already taken for this item are in `<design_behavior_decisions>`; copy that table into the SUMMARY and add any new call you make.

Not in scope:
- the Básicos/Perícias/Magias/Notas tab bodies (261101-mvw..mvz restyle them)
- the loading/not-found/network-error early returns and handleRefresh in page.tsx (261101-mvu)
- lib/api, lib/schemas, prisma, package.json, components/ui/* (unchanged)
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.claude/CLAUDE.md
@.planning/design/ferro-brasa/README.md
# Ficha.dc.html is 106 KB. Read only these ranges:
#   header + tabs + edit banner + column container: 153-173
#   segmented filter look (used by the Perícias sheet toggle): 336-339
#   bottom bar: 533-553
#   bottom sheets: 566-635 (frame 568-575, vit/berk 577-602, arma 604-615, atributos 617-623, pericias 625-632)
#   mock logic for sheets, look only: 867-887; toast copy: 889-895; lock state: 935-936; stage list: 659-666
# The mock's pools/stageOf/BERK_MAX math is illustrative and MUST NOT be copied.
@.planning/design/ferro-brasa/Ficha.dc.html
@.planning/quick/261101-mvt-redesign-foundation-ds-01-implement-the-ferro-brasa-design-s/261101-mvt-PLAN.md
# (read its <interfaces> block; if 261101-mvt-SUMMARY.md exists, its corrected interfaces win)
@lib/calculations/index.ts
@lib/constants/character.ts
@components/character/quick-actions-bar.tsx
@components/forms/character-layout.tsx
@components/character/skills-modal.tsx
@components/character/attributes-modal.tsx
@components/character/basic-info/vitality-card.tsx
@components/character/basic-info/berkana-card.tsx
@components/character/types.ts
@components/character/index.ts
@app/character/[id]/page.tsx
@lib/api/queries.ts
@lib/api/character-concurrency.ts

<interfaces>
DOWNSTREAM CONTRACT for 261101-mvw (Básicos), 261101-mvx (Perícias) and later items. Do not rename these without updating this block and the SUMMARY.

Existing APIs this plan consumes (from 261101-mvt, verify they exist before Task 1):
- `BottomSheet({ open, onOpenChange, title, description?, className?, children })` in components/ui/bottom-sheet.tsx: controlled, side="bottom", 480px max width, handle, serif title, 44px Fechar.
- `NumericDisplay({ value, max?, size: 'sm'|'md'|'lg'|'xl'|'hero', className?, maxClassName? })` in components/ui/numeric-display.tsx (no math, caller formats).
- `StatTile({ label, value, variant?: 'tile'|'bare', align?, className?, valueClassName? })` in components/ui/stat-tile.tsx.
- Token utilities: text-/bg-/border-vitality-{notavel,ferido,grave,condenado,incapacitado,coma}, bg-vitality-track, bg-/text-berkana, text-berkana-foreground, bg-berkana-track, text-success, text-warning, font-numeric (always with tabular-nums), font-serif, shadow-card, shadow-lg, animate-ficha-spin.
- `toast.warning` is used by useUpdateCharacter for 409 conflicts (mvt Task 3). Toasts are styled by the Toaster configured in app/layout.tsx by 261101-mvt; this item adds no toaster wrapper.
- `isCharacterConflictError(error)` from lib/api/character-concurrency.ts.
- `UpdateCharacterMutation` type from components/character/types.ts.

New in lib/calculations/index.ts (pure, framework-free, exported from '@/lib/calculations'):
- `type VitalityStageKey = keyof VitalityLevels` (the six persisted keys, VITALITY_LEVELS order).
- `type CurrentVitalityInput = Partial<Record<VitalityStageKey, number | null>> | null | undefined` (the stored currentVitality JSON may also carry unknown keys at runtime).
- `resolveCurrentVitalityLevels(currentVitality: CurrentVitalityInput, maxLevels: VitalityLevels): VitalityLevels`: per stage, the stored value when it is neither undefined nor null, otherwise the stage maximum. This is the fallback the Vitalidade card and the old bar use today.
- `calculateVitalityTotal(levels: VitalityLevels): number`: sum of the six stages, each `|| 0`. Use it for both the current total (on resolved levels) and the max total (on calculateVitalityLevels output).
- `applyVitalityDamage(currentVitality: CurrentVitalityInput, maxLevels: VitalityLevels, damageAmount: number): VitalityLevels`: the old "Aplicar Dano" algorithm unchanged:
  1. copy the stored object (unknown keys are kept)
  2. fill missing/null stages with their maximum
  3. drain the damage stage by stage in VITALITY_LEVELS order (notavel first), never below 0
  It does not validate damageAmount; callers only call it with a positive integer. The result is the exact `currentVitality` payload to write.
- `applyVitalityHeal(currentVitality: CurrentVitalityInput, maxLevels: VitalityLevels, healAmount: number): VitalityLevels`: Cura by amount (owner decision DB-01). It undoes damage in reverse order:
  1. copy the stored object (unknown keys are kept)
  2. fill missing/null stages with their maximum (the same init as applyVitalityDamage)
  3. walk the stages from the deepest (coma) up to notavel. For each stage, missing = Math.max(0, maxLevels[stage] - current[stage]) and gained = Math.min(remaining, missing); add gained to the stage and subtract it from remaining. Stop when remaining <= 0.
  Rules that follow from this:
  - the deepest drained stage refills first
  - no stage ever exceeds its max
  - a stage already at or above its max (manual edit) is never lowered
  - a stage whose max is <= 0 never changes
  - leftover healing is discarded
  maxLevels is the same calculateVitalityLevels result that "Restaurar vitalidade máxima" writes. Callers only call it with a positive integer. The result is the exact `currentVitality` payload to write.
  Worked example (base {200,250}, level 7): damage 8000 leaves notavel 0, ferido 0, gravementeFerido 2320, and every deeper stage full.
  - Cura 500 → gravementeFerido 2820; notavel and ferido stay 0.
  - Cura 2000 → gravementeFerido 3280, ferido 1040, notavel 0.
- `getCurrentVitalityStage(current: VitalityLevels, maxLevels: VitalityLevels): VitalityStageKey | null`:
  - null when calculateVitalityTotal(maxLevels) <= 0 (vitality not configured)
  - otherwise the first stage, in the order damage drains (VITALITY_LEVELS), whose resolved current value is > 0
  - 'coma' when every stage is at 0 or below
  - Stage position for "N/6" displays = VITALITY_LEVELS.indexOf(stage) + 1.
- `type BerkanaStateKey = 'cheia' | 'metade' | 'esgotada' | 'disponivel'`
- `type BerkanaPool = { current: number; max: number }`
- `resolveBerkanaPool({ level, maxBerkana, currentBerkana, berkanaBonus }): BerkanaPool`: the Berkana card's values today.
  - Destructuring defaults, applied to undefined only: maxBerkana 100, currentBerkana 100, berkanaBonus 0.
  - max = maxBerkana || calculateMaxBerkana(level || 0, getBaseBerkana(), berkanaBonus || 0)
  - current = currentBerkana (persisted value, no fallback to max)
  - Pass the character object directly.
- `spendBerkana(current: number, amount: number): number` = Math.max(0, (current || 0) - amount). This is the old -30/-50 rule.
- `recoverBerkana(current: number, max: number, amount: number): number` = Math.max(current || 0, Math.min(max, (current || 0) + amount)). It is capped at the same max the inline "Atual" field clamps to, and it never lowers a value already above max.
- `getBerkanaState(current: number, max: number): BerkanaStateKey`: README thresholds, first match wins:
  1. current <= 0 → 'esgotada'
  2. current >= max → 'cheia'
  3. current / max <= 0.5 → 'metade'
  4. otherwise → 'disponivel'
- Restore-to-max payloads (no helper, write these exactly):
  - vitality: `{ currentVitality: calculateVitalityLevels(toVitalityBase(vitality), level || 0) }`
  - Berkana: `{ currentBerkana: resolveBerkanaPool(character).max }`

components/character/resource-display.ts (no 'use client'; no JSX; safe to import anywhere):
- `VITALITY_STAGE_DISPLAY: Record<VitalityStageKey, { label: string; shortLabel: string; Icon: LucideIcon; textClassName: string; bgClassName: string; borderClassName: string }>`
  - label comes from VITALITY_LABELS. shortLabel equals label except gravementeFerido → 'Grav. Ferido'.
  - Icons: notavel Heart, ferido HeartCrack, gravementeFerido Droplets, condenado Skull, incapacitado Link, coma Moon.
  - Classes are literal token utilities, e.g. 'text-vitality-notavel'. gravementeFerido uses the 'grave' tokens.
- `BERKANA_STATE_DISPLAY: Record<BerkanaStateKey, { label: string; Icon: LucideIcon }>`
  - cheia: 'Cheia', Sparkles
  - metade: 'Pela metade', Sparkle
  - esgotada: 'Esgotada', CircleOff
  - disponivel: 'Disponível', Sparkles
- `formatGameNumber(value: number): string`: pt-BR grouping ("13.160"), display only. Non-finite input → '0'.

components/character/quick-sheets/quick-sheet-context.tsx ('use client'):
- `type QuickSheetKind = 'vit' | 'berk' | 'arma' | 'atributos' | 'pericias'`
- `interface QuickSheetApi { openSheet: (kind: QuickSheetKind) => void }`
- `QuickSheetContext = createContext<QuickSheetApi | null>(null)`. CharacterLayout provides it around all tabs and the bar. In render tests, wrap with `QuickSheetContext.Provider value={{ openSheet: fn }}`.
- `useQuickSheet(): QuickSheetApi` throws `Error('useQuickSheet must be used inside CharacterLayout')` without a provider.
- 261101-mvw:
  - the Vitalidade card's damage button calls `openSheet('vit')`
  - the Berkana card's Gastar/Recuperar call `openSheet('berk')`
  - the vit sheet offers Dano, Cura (applyVitalityHeal, DB-01) and "Restaurar vitalidade máxima". The card's Dano and Cura buttons both call `openSheet('vit')`; the player picks the action in the sheet
  - the card numbers must come from the helpers above (resolveCurrentVitalityLevels, calculateVitalityTotal, getCurrentVitalityStage, resolveBerkanaPool, getBerkanaState) and VITALITY_STAGE_DISPLAY / BERKANA_STATE_DISPLAY
  - after this plan, vitality-card.tsx and berkana-card.tsx already call the helpers; do not re-inline any formula
  - lock mode (DB-15): buttons that only open a sheet are play actions, not edit-only controls. Keep them visible in both modes; the sheets apply the current gating (writes disabled while locked). Hide only true edit-only controls when locked

CharacterLayout (components/forms/character-layout.tsx) after this plan:
- Props: `CharacterTabProps & { onToggleEditMode?: () => void; header?: React.ReactNode }`. The header renders inside the sticky top block, above the tabs.
- Tab values are unchanged: basicos, pericias, magias, anotacoes.
- Each TabsContent is the card-flow container: 1200px max width, p-3, `[column-width:340px] [column-gap:12px]`. Tab components (261101-mvw..mvz) must render their SectionCards as direct children: return a fragment, or a wrapper with the `contents` class. Do not use an outer grid or space-y wrapper. SectionCard already has break-inside-avoid and mb-3. A toolbar that must span every column uses `[column-span:all]`.
- Compatibility: CharacterTabProps keeps isSkillsModalOpen / setIsSkillsModalOpen / isAttributesModalOpen / setIsAttributesModalOpen. The layout maps them to the 'pericias' and 'atributos' sheets, so SkillsKitTab and AttributesSummaryCard keep working unchanged. New code should call useQuickSheet().openSheet instead.
- One `useUpdateCharacter()` instance in the layout is passed to VitalitySheet and BerkanaSheet as `updateCharacterMutation`.

QuickActionsBar props after this plan: `{ character: CharacterData; isEditMode: boolean; onToggleEditMode?: () => void; onOpenSheet: (kind: QuickSheetKind) => void }`.
</interfaces>
</context>

<design_behavior_decisions>
Copy this table into the SUMMARY (owner rule: the design is visual direction; current behavior wins).

| ID | Mock shows | Decision | Why |
|----|-----------|----------|-----|
| DB-01 | vit sheet "Cura" (heal by amount) | Cura por valor adicionada por decisão do dono (ordem inversa do dano): applyVitalityHeal refills the deepest drained stage first, up to each stage's calculateVitalityLevels max, then moves up toward Notável; leftover is discarded. Dano and Cura sit side by side, with a prominent "Restaurar vitalidade máxima" below them | Owner decision (2026-11-01): the table mostly applies damage and usually heals with "vitalidade máxima", but players must be able to damage or heal by any amount. The mock's pools math is not used |
| DB-02 | "Restaurar vitalidade máxima" | Kept: writes `currentVitality = calculateVitalityLevels(...)`, byte-for-byte the old "Vida Máxima" payload | Existing action |
| DB-03 | "Restaurar Berkana ao máximo" | Kept: writes `currentBerkana = maxBerkana \|\| calculated` (old "Berkana Máxima") | Existing action |
| DB-04 | Gastar by amount | Kept: `max(0, current - n)` generalizes the old -30/-50 buttons. Chips 30 and 50 plus Gastar reproduce them exactly (oracle test) | Existing rule |
| DB-05 | Recuperar by amount | Added: `min(max, current + n)`, never lowering a value above max | Pure convenience over currentBerkana: the inline "Atual" field already accepts any 0..max value and clamps to the same max |
| DB-06 | pools/stageOf stage math | Not copied. The stage comes from real per-stage currentVitality (card fallback rule): the first stage in damage-drain order with a value > 0, else Coma; no stage when vitality is not configured | Follows the app's own damage order and stored per-stage values |
| DB-07 | bar Berkana number | Shows the persisted currentBerkana, like the Berkana card. The old bar fell back to max when current was 0, which hid an empty pool | The card and the spend/recover writes use the persisted value; the bar now agrees with them |
| DB-08 | atributos "totals" | Shows calculateAttributeBase (race + class + bonus, no level bonus), exactly like the removed AttributesModal | Same numbers as today. Open question PD-02 from 261101-iif stays open; restate it in the SUMMARY |
| DB-09 | pericias: in-use only | In-use list by default, plus a "Todas · 36" toggle. Order is SKILLS (the old modal order); totals use calculateSkillTotal; the caption "as outras valem N" uses calculateSkillTotal with zero distribution | Keeps the old modal's ability to see every skill |
| DB-10 | bar without hide toggle | Hide/show kept: a 44px chevron at the end of the first row, and a floating 44px button when hidden | Existing capability |
| DB-11 | bar buttons scroll to cards | Replaced by sheets, per the item description. The sheets show the same data, and the cards stay in the Básicos tab | Item requirement |
| DB-12 | lock label "Editando" | "Desbloqueado"/"Bloqueado" as the item text says. Toggle toasts use the design copy ("Ficha bloqueada" / "Ficha desbloqueada") | Item text |
| DB-13 | numbers "3.600" | formatGameNumber (pt-BR grouping) for display only; written values are unchanged | Look |
| DB-14 | old bar colors (<=30% red, <=60% yellow) | Replaced by stage color (vitality) and the Berkana token | Look; the color is never the only signal (icon + label) |
| DB-15 | locked sheet | Coordinator decision for all tabs: edit-only controls are HIDDEN when locked. Play actions in the quick sheets are not edit-only, so they are NOT hidden. They keep the current app's gating: today Aplicar Dano, Vida Máxima, Berkana Máxima, -30 and -50 are all disabled while locked. So Dano, Cura, restore, Gastar and Recuperar stay visible and are disabled while locked (Cura is new and follows Dano's gating), with the "Ficha bloqueada · desbloqueie para alterar." hint. The bar's sheet buttons and the read-only reference sheets work in both modes. The edit banner shows only while unlocked | Coordinator decision + current gating kept as is |
| DB-16 | vit sheet with unconfigured vitality | When calculateVitalityTotal(maxima) <= 0 (getCurrentVitalityStage returns null, e.g. a new character with Raça/Classe 0), Dano and Cura are disabled. The sheet shows the hint "Vitalidade não configurada · defina Raça e Classe em Básicos → Vitalidade." Nothing is written and no success toast appears. "Restaurar vitalidade máxima" keeps the old Vida Máxima behavior (enabled when unlocked) | A damage or heal on zero/negative maxima would write unchanged zeros and toast a misleading success (checker Info 4). Restore is existing behavior and stays as it is |
</design_behavior_decisions>

<coverage_audit>
| Source | Item | Covered by |
|--------|------|------------|
| GOAL | Header: back, serif name, "jogador · classe · Nv N", refresh | Task 3 |
| GOAL | 4 underline tabs with long labels on wide screens | Task 3 |
| GOAL | "Modo edição · as alterações são salvas sozinhas" banner when unlocked | Task 3 |
| GOAL | Multi-column card flow, column-width 340px | Task 3 |
| GOAL | Bottom bar: vitality (stage icon/color/short label), Berkana current/max, Armas, Perícias, Atributos, lock toggle driving isEditMode | Task 1 (vit button → sheet), Task 2 (berk), Task 3 (full rebuild) |
| GOAL | vit sheet: amount + 4 chips + preview + Dano/Cura + restore | Task 1 (Cura via applyVitalityHeal per DB-01; restore per DB-02) |
| GOAL | berk sheet: amount + chips + Gastar/Recuperar + restore | Task 2 (DB-03..05) |
| GOAL | arma sheet (damage grid), atributos (3-col totals), pericias (in-use with totals) | Task 3 (DB-08, DB-09) |
| GOAL | Replace quick-action navigation and skills/attributes modals | Tasks 1-3; modals deleted in Task 3 |
| GOAL | Every value/write through existing calculation functions, mutation hook, current semantics; numbers identical | Tasks 1-2 oracle tests + card adoption; single useUpdateCharacter |
| GOAL | Conflict and error toasts in design style | Sheets skip their own toast on conflict (mvt's warning toast shows); fixed pt-BR toast.error otherwise. Toasts are styled by the Toaster configured in app/layout.tsx by 261101-mvt; this item adds no toaster wrapper |
| CONTEXT (coordinator) | Extract inline damage/heal/spend into pure lib helpers with bun tests | Tasks 1-2 |
| CONTEXT (coordinator) | Restore writes only what existing paths write | DB-02, DB-03 |
| CONTEXT (coordinator) | Export a sheet-opening API for 261101-mvw and document it | quick-sheet-context.tsx + `<interfaces>` |
| CONTEXT (coordinator) | files_deleted + update components/character/index.ts when removing the modals | Task 3, frontmatter |
| CONTEXT (coordinator) | depends_on mvt and mvu; mvu owns page early returns | Frontmatter; Task 3 leaves those regions untouched |
| CONTEXT (owner rule) | Look from mock, behavior from app; note the rule for the executor | `<objective>` + `<design_behavior_decisions>` |
| CONTEXT (memory) | No auth by design | Nothing adds auth |
| DoD | tsc, lint (no new warnings), bun test, build | Every task verify + `<verification>` |
</coverage_audit>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Tracer: bar vitality button → vit bottom sheet → extracted damage helper + heal helper → useUpdateCharacter</name>
  <files>lib/calculations/index.ts, lib/calculations/index.test.ts, components/character/resource-display.ts, components/character/quick-sheets/quick-sheet-context.tsx, components/character/quick-sheets/vitality-sheet.tsx, components/forms/character-layout.tsx, components/character/quick-actions-bar.tsx</files>
  <precondition>261101-mvt and 261101-mvu are committed: components/ui/bottom-sheet.tsx, numeric-display.tsx and stat-tile.tsx exist, and `grep -q 'export function BottomSheet' components/ui/bottom-sheet.tsx` succeeds.</precondition>
  <read_first>
    - .planning/design/ferro-brasa/README.md (whole file, especially "Important: the design is visual direction, not a functional spec")
    - components/character/basic-info/vitality-card.tsx lines 29-98 (applyDamage + restoreFullHealth: the logic to freeze and extract) and 134-161, 216-240 (display fallbacks)
    - components/character/quick-actions-bar.tsx lines 49-62 (old bar totals)
    - lib/calculations/index.ts lines 1-130 (types, vitality, berkana) and lib/calculations/index.test.ts lines 1-45 and 655-end (header and TESTED_FUNCTIONS guard)
    - lib/constants/character.ts lines 156-173 (VITALITY_LEVELS, VITALITY_LABELS; this file has no imports, so lib/calculations may import it without a cycle)
    - components/ui/bottom-sheet.tsx, numeric-display.tsx (from 261101-mvt)
    - Ficha.dc.html lines 568-602 (sheet frame and vit sheet look) and 659-666 (stage icons/short labels)
  </read_first>
  <behavior>
    - applyVitalityDamage equals the frozen base-commit loop for every combination of:
      - levels 0, 1, 4, 5, 7, 10
      - bases {0,0}, {30,30}, {200,250}, {999,1}
      - stored currentVitality: undefined, null, {}, all six 0, {notavel:5}, {notavel:null, ferido:12}, the explicit maxima, notavel = max+50, the maxima plus an unknown key
      - damage 1, 7, 100, 3600, 1000000
      In every case the input object is not mutated
    - applyVitalityDamage drains notavel before ferido, spills the remainder into the next stage, never writes a negative value, and keeps unknown stored keys
    - The negative-maximum case (base {30,30}, level 0, damage 1000000) equals the oracle (the quirk is pinned, not fixed)
    - resolveCurrentVitalityLevels equals the card's per-stage fallback over the same grid; null/undefined input → the maxima
    - calculateVitalityTotal equals the old bar reduce for maxima and for resolved currents; base {200,250} level 7 maxima total 19200
    - getCurrentVitalityStage:
      - {200,250} level 7, stored undefined → 'notavel'
      - {notavel:0, ferido:1000} → 'ferido'
      - {notavel:0, ferido:0, gravementeFerido:5} → 'gravementeFerido'
      - {notavel:10, ferido:0} → 'notavel'
      - all six 0 → 'coma'
      - the result of a 1000000 damage → 'coma'
      - base {0,0} level 0 (stored undefined or all zero) → null
    - applyVitalityHeal (DB-01):
      - Round-trip: for every level/base in the grid and the full stored shapes (undefined, the explicit maxima, the maxima plus an unknown key), and every damage amount n in the grid with 0 < n <= calculateVitalityTotal(maxima), plus n = that total: heal(damage(stored, n), n) has every stage equal to its max, and the unknown key is kept. A planning simulation of this exact rule passed all 246 such checks
      - Heal on a full sheet (stored undefined or the maxima) is a no-op for every heal amount in the damage grid
      - Never exceeds the max: for every grid case whose stored stages are all <= max, every result stage is <= its max. A stored stage above its max (notavel = max+50) keeps its value. A stage whose max is <= 0 is unchanged
      - Deepest drained first: base {200,250} level 7, after damage 8000 (notavel 0, ferido 0, gravementeFerido 2320):
        - heal 500 → gravementeFerido 2820, notavel and ferido 0
        - heal 2000 → gravementeFerido 3280, ferido 1040, notavel 0
        - heal 1000000 → every stage at its max (leftover discarded)
      - Stored {notavel:100, ferido:0} with the other stages full, heal 50 → ferido 50 and notavel 100
      - The input object is not mutated
    - The TESTED_FUNCTIONS guard lists the 5 new names; count 31
  </behavior>
  <action>
    Step 0: before editing anything, record this item's base commit for later gates. Run git rev-parse HEAD and write the output to the path printed by git rev-parse --git-path gsd-261101-mvv-base.

    RED, in lib/calculations/index.test.ts. Keep the file's style: single quotes, no semicolons, Portuguese comments.
    - Insert a new banner section "RECURSOS EM JOGO: VITALIDADE" right before the "COBERTURA DOS EXPORTS" banner.
    - Add the frozen oracles, with a comment stating they are copied from the base commit recorded in Step 0 and must never be edited:
      - legacyApplyDamage(currentVitality, calculatedVitality, damageAmount): reproduces, statement for statement and with the same local variable names, the body of the base-commit applyDamage in vitality-card.tsx between the calculatedVitality line and the updateData line: the object spread copy, the loop that fills undefined/null stages from calculatedVitality, and the drain loop. The only additions are the strict-mode TypeScript annotations: Record<string, unknown> plus number casts, never any. Iterate the imported VITALITY_LEVELS, as the card does.
      - legacyResolve: the card's per-stage fallback expression (stored value unless undefined or null, else the calculated value).
      - legacyTotal: the old bar's reduce with || 0.
    - Add describe blocks named exactly applyVitalityDamage, applyVitalityHeal, resolveCurrentVitalityLevels, calculateVitalityTotal and getCurrentVitalityStage, covering every bullet in `<behavior>`. applyVitalityHeal has no legacy code to freeze (it is new, DB-01). Its tests are the round-trip against applyVitalityDamage, the no-op, max-cap and order cases, with the literal expected numbers from `<behavior>`.
      - Compute maxima with calculateVitalityLevels(toVitalityBase(base), level).
      - Pass structuredClone inputs to both the helper and the oracle and compare with toEqual.
      - Assert non-mutation by comparing the original against a clone taken before the call.
    - Add the five names to TESTED_FUNCTIONS (keep it sorted) and change the length assertion from 26 to 31. Do not touch any existing expected value (file header rule).
    - Run bun test lib/calculations/index.test.ts and see it fail on missing exports. Commit as test(261101-mvv).

    GREEN, in lib/calculations/index.ts:
    - Import VITALITY_LEVELS from '@/lib/constants/character'.
    - Add a banner section "RECURSOS EM JOGO: VITALIDADE E BERKANA" after the Berkana section.
    - Export VitalityStageKey, CurrentVitalityInput and the five functions with the exact signatures and semantics in `<interfaces>`. Each gets a short Portuguese JSDoc stating its rule, as the module already does.
    - Place applyVitalityHeal right after applyVitalityDamage. It shares the copy-and-fill step and walks the stages in reverse VITALITY_LEVELS order, as specified in `<interfaces>`. Its JSDoc says "Cura por valor: ordem inversa do dano, decisão do dono".
    - applyVitalityDamage moves the frozen loop unchanged (copy → fill → drain). Do not "fix" the negative-maximum quirk. Its return type is VitalityLevels, the alias already assignable to the update schema's currentVitality.
    - resolveCurrentVitalityLevels returns a fresh object with only the six keys.
    - Run the test until green. Commit as feat(261101-mvv).

    UI slice:
    1. components/character/resource-display.ts (single quotes, no semicolons, no client directive, no JSX): export VITALITY_STAGE_DISPLAY, BERKANA_STATE_DISPLAY and formatGameNumber exactly as in `<interfaces>`.
       - Use type-only imports for LucideIcon, VitalityStageKey and BerkanaStateKey. BerkanaStateKey is added in Task 2, so in this task declare only the vitality map and the formatter, and add BERKANA_STATE_DISPLAY in Task 2.
       - Labels come from VITALITY_LABELS.
       - formatGameNumber uses one module-level Intl.NumberFormat('pt-BR').
    2. components/character/quick-sheets/quick-sheet-context.tsx ('use client'): QuickSheetKind, QuickSheetApi, QuickSheetContext and useQuickSheet, exactly as in `<interfaces>`.
    3. components/character/quick-sheets/vitality-sheet.tsx ('use client'):
       - Export VitalitySheet({ open, onOpenChange, character, characterId, isEditMode, updateCharacterMutation }), typed with CharacterData and UpdateCharacterMutation. It renders a BottomSheet titled "Vitalidade". Look from mock lines 577-602.
       - Values:
         - maxLevels = calculateVitalityLevels(toVitalityBase(vitality), level || 0)
         - current = resolveCurrentVitalityLevels(currentVitality, maxLevels)
         - totals via calculateVitalityTotal
         - stage via getCurrentVitalityStage
       - Header row: NumericDisplay size lg with the formatted current total and the formatted max total. On the right, a stage badge (Icon size-4 + full label + muted "N/6", in the stage text class). When stage is null: a muted Heart and "Sem vitalidade definida".
       - Amount input, using shadcn Input:
         - inputMode numeric, autoComplete off, aria-label "Valor do dano", hint text "0"
         - onChange keeps digits only
         - h-[72px], text-center, font-numeric, tabular-nums, text-[44px], md:text-[44px], font-semibold
         - amountValue = parseInt(amount, 10) || 0
       - Chips: a 4-column grid of 44px secondary bordered buttons labelled "+" + formatGameNumber(v) for v in 100, 500, 1000, 5000. Each adds v to the amount. They are an input convenience only.
       - Preview (text-sm muted, aria-live polite):
         - amount > 0, showing the result of both actions:
           "Dano → {formatted total of resolveCurrentVitalityLevels(applyVitalityDamage(currentVitality, maxLevels, amountValue), maxLevels)} ({stage label after damage}) · Cura → {formatted total of resolveCurrentVitalityLevels(applyVitalityHeal(currentVitality, maxLevels, amountValue), maxLevels)} ({stage label after heal})"
           Use 'Vitalidade' when a stage is null.
         - otherwise: "Digite o valor ou use os atalhos."
       - Action row (DB-01): a 2-column grid, gap-2, Dano and Cura side by side (mock lines 597-600). Both are h-14, text-[17px], font-bold, and disabled when !isEditMode (DB-15), when amountValue <= 0, when updateCharacterMutation.isPending, or when stage is null (unconfigured vitality, DB-16). In the unconfigured case, show the muted hint "Vitalidade não configurada · defina Raça e Classe em Básicos → Vitalidade." above the row, and skip the preview text. While pending, the clicked button shows LoaderCircle with animate-ficha-spin.
         - Dano: destructive Button, Swords icon.
           - On click: compute applyVitalityDamage(currentVitality, maxLevels, amountValue), then await updateCharacterMutation.mutateAsync({ id: characterId, data: { currentVitality: that result } }).
           - On success: toast.success(formatGameNumber(amountValue) + ' de dano aplicado!'), clear the amount, call onOpenChange(false).
           - In catch: if isCharacterConflictError(error), return; the hook already shows the design conflict toast and refetches, and the sheet stays open with fresh numbers. Otherwise console.error('Erro ao aplicar dano:', error) and toast.error('Erro ao aplicar dano').
         - Cura: secondary Button with a border, HeartPulse icon. Also disabled when no resolved stage is below its max (nothing to heal).
           - On click: compute applyVitalityHeal(currentVitality, maxLevels, amountValue) and write { currentVitality: that result } through the same updateCharacterMutation.mutateAsync path.
           - On success: toast.success(formatGameNumber(amountValue) + ' de vitalidade curada!'), clear the amount, close.
           - In catch: return on a conflict; otherwise console.error('Erro ao curar vitalidade:', error) and toast.error('Erro ao curar vitalidade').
       - Restore (DB-02), the common heal, so it is prominent: below the action row, a full-width outline Button, h-12, border-primary, text-primary, font-semibold, Heart icon, "Restaurar vitalidade máxima".
         - Disabled when locked or pending.
         - Writes { currentVitality: maxLevels } (the old Vida Máxima payload).
         - Success toast 'Vitalidade restaurada ao máximo!'; on error (non-conflict): console.error('Erro ao restaurar vitalidade:', error) and toast.error('Erro ao restaurar vitalidade').
       - When !isEditMode, show a muted line with a Lock icon: "Ficha bloqueada · desbloqueie para alterar."
       - Wrap onOpenChange so closing also clears the amount. Event handlers only, never an effect.
    4. components/forms/character-layout.tsx, minimal wiring (Task 3 restyles the file):
       - Add openSheet state (QuickSheetKind | null) and one useUpdateCharacter() instance.
       - Add a memoized QuickSheetApi whose openSheet sets the state. Wrap the existing Tabs in QuickSheetContext.Provider.
       - Render VitalitySheet with open = (openSheet === 'vit'); onOpenChange sets 'vit' or null.
       - Pass onOpenSheet to QuickActionsBar. Keep the modals and everything else as they are.
    5. components/character/quick-actions-bar.tsx, minimal: add the prop onOpenSheet: (kind: QuickSheetKind) => void, and make the vitality action's onClick call onOpenSheet('vit'). Nothing else changes in this task.

    Run the gate. Commit as feat(261101-mvv).
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && B=$(cat "$(git rev-parse --git-path gsd-261101-mvv-base)") && git cat-file -e "$B^{commit}" && OLD_CARD=$(git show "$B:components/character/basic-info/vitality-card.tsx") && printf '%s\n' "$OLD_CARD" | grep -q 'damageToApply' && grep -q 'damageToApply' lib/calculations/index.test.ts && grep -q 'TESTED_FUNCTIONS.length).toBe(31)' lib/calculations/index.test.ts && grep -q 'export function applyVitalityDamage' lib/calculations/index.ts && grep -q 'export function applyVitalityHeal' lib/calculations/index.ts && grep -q 'export function getCurrentVitalityStage' lib/calculations/index.ts && grep -q "describe('applyVitalityHeal'" lib/calculations/index.test.ts && bun test lib/calculations/index.test.ts && grep -q 'applyVitalityDamage(' components/character/quick-sheets/vitality-sheet.tsx && grep -q 'applyVitalityHeal(' components/character/quick-sheets/vitality-sheet.tsx && grep -q 'Restaurar vitalidade máxima' components/character/quick-sheets/vitality-sheet.tsx && grep -q 'Vitalidade não configurada' components/character/quick-sheets/vitality-sheet.tsx && grep -q 'mutateAsync' components/character/quick-sheets/vitality-sheet.tsx && grep -q 'isCharacterConflictError' components/character/quick-sheets/vitality-sheet.tsx && grep -q 'export function useQuickSheet' components/character/quick-sheets/quick-sheet-context.tsx && grep -q 'export const VITALITY_STAGE_DISPLAY' components/character/resource-display.ts && grep -q '<VitalitySheet' components/forms/character-layout.tsx && grep -q 'QuickSheetContext.Provider' components/forms/character-layout.tsx && grep -q "onOpenSheet('vit')" components/character/quick-actions-bar.tsx && npx tsc --noEmit && bun run lint 2>&1 | grep -q '(0 errors, 1 warning)' && bun test && bun run build && echo TRACER-OK</automated>
  </verify>
  <done>
    - The four existing-behavior vitality helpers are proven equal to the frozen base-commit card logic over the full grid.
    - applyVitalityHeal passes the round-trip, no-op, max-cap and deepest-first tests.
    - The export guard counts 31.
    - Tapping the bar's vitality action opens the vit bottom sheet:
      - Dano writes the same payload the old card wrote, through the layout's single useUpdateCharacter.
      - Cura writes the applyVitalityHeal result through the same path.
      - The prominent restore writes the Vida Máxima payload.
      - Locked mode disables all three.
    - tsc, lint (still 1 warning), the full bun test and the build pass. TRACER-OK is printed.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Berkana sheet on extracted spend/recover helpers; existing Vitalidade/Berkana cards switched to the shared helpers</name>
  <files>lib/calculations/index.ts, lib/calculations/index.test.ts, components/character/resource-display.ts, components/character/quick-sheets/berkana-sheet.tsx, components/character/basic-info/vitality-card.tsx, components/character/basic-info/berkana-card.tsx, components/forms/character-layout.tsx, components/character/quick-actions-bar.tsx</files>
  <read_first>
    - components/character/basic-info/berkana-card.tsx (whole file: destructuring defaults, calculatedMax/actualMaxBerkana, handleBerkanaQuickEdit)
    - components/ui/editable-field.tsx around the EditableNumberField max clamp (search "num > max"), which backs DB-05
    - Ficha.dc.html lines 583-602 (berk sheet look) and 880-886 (look only)
    - components/character/quick-sheets/vitality-sheet.tsx (Task 1; mirror its structure)
  </read_first>
  <behavior>
    - resolveBerkanaPool equals the card's computation (destructuring defaults + `maxBerkana || calculateMaxBerkana(level || 0, getBaseBerkana(), berkanaBonus || 0)`) for:
      - levels 0, 3, 7
      - maxBerkana undefined, 0, 170
      - currentBerkana undefined, 0, 85, 200
      - berkanaBonus undefined, 0, 15
      A sample check: {level 7, maxBerkana 0, berkanaBonus 15} → max 185
    - spendBerkana(c, 30) and spendBerkana(c, 50) equal the frozen old quick-edit switch ('minus30'/'minus50') for c in 0, 1, 29, 30, 31, 50, 100, 170. spendBerkana(20, 30) = 0
    - recoverBerkana: (100,170,30)=130; (160,170,30)=170; (200,170,30)=200 (never lowers); (0,170,0)=0
    - Restore equals the old 'fill' branch: the frozen switch's fill result equals resolveBerkanaPool(...).max over the same grid
    - getBerkanaState:
      - (0,170) esgotada; (170,170) cheia; (200,170) cheia
      - (85,170) metade; (1,170) metade; (86,170) disponivel
      - (0,0) esgotada; (5,0) cheia
    - TESTED_FUNCTIONS count 35
  </behavior>
  <action>
    RED, in lib/calculations/index.test.ts:
    - Add a "RECURSOS EM JOGO: BERKANA" banner section before the exports guard.
    - Add the frozen oracles, copied from the base-commit berkana-card.tsx:
      - legacyBerkanaMax: the destructuring defaults and the calculatedMax/actualMaxBerkana lines
      - legacyQuickEdit: the switch inside handleBerkanaQuickEdit, statement for statement, starting from the same `currentBerkana || 0` seed, returning newValue instead of saving
    - Add describe blocks named resolveBerkanaPool, spendBerkana, recoverBerkana and getBerkanaState covering `<behavior>`. Add the names to TESTED_FUNCTIONS and change 31 to 35. Run and see it fail. Commit as test(261101-mvv).

    GREEN, in lib/calculations/index.ts, inside the Task 1 section: export BerkanaStateKey, BerkanaPool, resolveBerkanaPool, spendBerkana, recoverBerkana and getBerkanaState exactly as in `<interfaces>`, with Portuguese JSDoc. recoverBerkana's JSDoc states that the cap equals the max the inline Atual field clamps to (DB-05). Make the tests green. Commit as feat(261101-mvv).

    Then:
    1. components/character/resource-display.ts: add BERKANA_STATE_DISPLAY as in `<interfaces>`.
    2. components/character/quick-sheets/berkana-sheet.tsx ('use client'):
       - Export BerkanaSheet with the same props as VitalitySheet. Mirror its structure, BottomSheet title "Berkana", look from mock lines 583-602.
       - pool = resolveBerkanaPool(character); state = getBerkanaState(pool.current, pool.max).
       - Header: NumericDisplay lg (formatted current and max). The state badge uses BERKANA_STATE_DISPLAY: Icon size-4 + label in text-berkana.
       - Same digits-only amount input, aria-label "Valor de Berkana".
       - Chips: +10, +30, +50, +100.
       - Preview (aria-live polite):
         - amount > 0: "Gastar → {formatted spendBerkana(pool.current, amount)} · Recuperar → {formatted recoverBerkana(pool.current, pool.max, amount)}"
         - otherwise: "Digite o valor ou use os atalhos."
       - Two-column action row (DB-04, DB-05):
         - Gastar: h-14 Button with bg-berkana, text-berkana-foreground, hover:bg-berkana/90, Sparkles icon. Writes { currentBerkana: spendBerkana(pool.current, amountValue) }. Success toast: formatGameNumber(amountValue) + ' de Berkana gasta'.
         - Recuperar: h-14 secondary Button, bordered, RotateCcw icon. Writes { currentBerkana: recoverBerkana(pool.current, pool.max, amountValue) }. Also disabled when pool.current >= pool.max. Success toast: ... + ' de Berkana recuperada'.
         - Both are disabled when locked, amountValue <= 0 or pending.
       - Restore link "Restaurar Berkana ao máximo" (DB-03): writes { currentBerkana: pool.max }. Success toast 'Berkana restaurada ao máximo!'.
       - Every catch: return silently on isCharacterConflictError; otherwise console.error('Erro ao atualizar Berkana:', error) and toast.error('Erro ao atualizar Berkana').
       - Same lock hint and close-clears-amount handling as the vit sheet.
    3. components/character/basic-info/vitality-card.tsx (UI and JSX unchanged; 261101-mvw restyles it):
       - In applyDamage, keep the amount guard, try/catch, toasts and setDamageValue. Replace the copy, init and drain statements with const newCurrentVitality = applyVitalityDamage(currentVitality, calculatedVitality, damageAmount).
       - In the "Vitalidade Atual/Total" block: totalVitality = calculateVitalityTotal(calculatedVitality); currentTotal = calculateVitalityTotal(resolveCurrentVitalityLevels(currentVitality, calculatedVitality)).
       - The per-stage EditableNumberField value comes from resolveCurrentVitalityLevels(...)[vitalityKey].
       - restoreFullHealth stays as it is.
       - Remove the VITALITY_LEVELS import only if it becomes unused.
    4. components/character/basic-info/berkana-card.tsx (UI unchanged):
       - Replace the calculatedMax/actualMaxBerkana lines with actualMaxBerkana = resolveBerkanaPool(character).max.
       - In handleBerkanaQuickEdit, keep the switch and its three action keys: 'fill' keeps assigning actualMaxBerkana, 'minus30' becomes spendBerkana(currentBerkana, 30), 'minus50' becomes spendBerkana(currentBerkana, 50).
       - Keep the save call and catch unchanged. Drop the calculateMaxBerkana/getBaseBerkana imports if unused.
    5. components/forms/character-layout.tsx: render BerkanaSheet next to VitalitySheet (open when openSheet === 'berk', same mutation prop).
    6. components/character/quick-actions-bar.tsx: the berkana action's onClick calls onOpenSheet('berk').

    Run the gate. Commit as feat(261101-mvv).
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && B=$(cat "$(git rev-parse --git-path gsd-261101-mvv-base)") && git cat-file -e "$B^{commit}" && grep -q 'TESTED_FUNCTIONS.length).toBe(35)' lib/calculations/index.test.ts && bun test lib/calculations/index.test.ts && [ "$(grep -c 'damageToApply' components/character/basic-info/vitality-card.tsx)" -eq 0 ] && grep -q 'applyVitalityDamage(' components/character/basic-info/vitality-card.tsx && grep -q 'restoreFullHealth' components/character/basic-info/vitality-card.tsx && [ "$(grep -c 'newValue - 30\|newValue - 50' components/character/basic-info/berkana-card.tsx)" -eq 0 ] && grep -q 'spendBerkana(currentBerkana, 30)' components/character/basic-info/berkana-card.tsx && grep -q 'resolveBerkanaPool(' components/character/basic-info/berkana-card.tsx && grep -q 'spendBerkana(' components/character/quick-sheets/berkana-sheet.tsx && grep -q 'recoverBerkana(' components/character/quick-sheets/berkana-sheet.tsx && grep -q 'isCharacterConflictError' components/character/quick-sheets/berkana-sheet.tsx && grep -q 'export const BERKANA_STATE_DISPLAY' components/character/resource-display.ts && grep -q '<BerkanaSheet' components/forms/character-layout.tsx && grep -q "onOpenSheet('berk')" components/character/quick-actions-bar.tsx && npx tsc --noEmit && bun run lint 2>&1 | grep -q '(0 errors, 1 warning)' && bun test && echo BERKANA-OK</automated>
  </verify>
  <done>
    - The four Berkana helpers are proven equal to the frozen card logic (pool, -30/-50, fill). Recuperar and state follow DB-05 and the README thresholds. The export guard counts 35.
    - The Vitalidade and Berkana cards compute and write through the same helpers as the sheets; their UI is unchanged.
    - The bar's Berkana action opens the berk sheet.
    - tsc, lint (1 warning) and bun test pass. BERKANA-OK is printed.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Design shell (header, underline tabs, edit banner, column flow), rebuilt bottom bar, arma/atributos/pericias sheets, modals removed</name>
  <files>components/character/quick-sheets/reference-sheets.tsx, components/character/quick-actions.render.test.ts, components/forms/character-layout.tsx, components/character/quick-actions-bar.tsx, app/character/[id]/page.tsx, components/character/index.ts</files>
  <read_first>
    - Ficha.dc.html lines 153-173 (header/tabs/banner/columns), 533-553 (bar), 604-632 (arma/atributos/pericias), 336-339 (segmented toggle), 889-895 and 935-936 (toast copy, lock)
    - components/character/skills-modal.tsx and attributes-modal.tsx (numbers to keep: calculateSkillTotal(toSkillValue(skills[k]), level || 0) over SKILLS; calculateAttributeBase(toAttributeValue(attributes[k])) over ATTRIBUTES)
    - components/character/basic-info/equipment-cards.tsx lines 10-25 and the field paths (weapons array; per weapon name, level, damage.d25/d50/d75/d100/critical strings, description)
    - components/ui/tabs.tsx (TabsList/TabsTrigger default classes to override through className; cn uses tailwind-merge)
    - app/character/[id]/page.tsx (as left by 261101-mvu): only imports, handleToggleEditMode and the final return change here
    - components/character/notes-tab.render.test.ts (renderToString + createElement pattern and its character fixture)
  </read_first>
  <behavior>
    - Fixture rule (Info 5): the bar receives the page's sanitized character, and the page replaces a missing currentVitality with all six stages at 0. So every fixture passes currentVitality as an object. No test may expect a full-health total from an undefined currentVitality. The per-stage fallback that does reach the bar through the page is a key missing inside the object, which is what the first case exercises
    - QuickActionsBar render, with vitality {race:200, class:250}, level 7, currentVitality {notavel:0, ferido:1000} (other keys absent, so they resolve to their max), maxBerkana 170, currentBerkana 0, isEditMode true:
      - contains "13.160", "Ferido" and text-vitality-ferido
      - contains "170" and the CircleOff icon (Esgotada; DB-07: not the old fallback to max)
      - contains "Armas", "Perícias", "Atributos", "Desbloqueado" and aria-pressed="false"
      - contains no class matching a hard-coded Tailwind palette color
    - The same bar with isEditMode false contains "Bloqueado" and aria-pressed="true"
    - A character with vitality {0,0} and the page's default currentVitality (all six 0) renders the neutral "Vitalidade" label and no text-vitality-coma
    - SkillsSheetBody, skills {duelo:{distributed:13,bonus:7}, percepcao:{distributed:17,bonus:0}}, level 7:
      - renders Duelo with calculateSkillTotal(toSkillValue(...),7) (22) and Percepção (19)
      - caption "as outras valem 2", computed the same way with zero distribution
      - toggle labels "Em uso · 2" and "Todas · 36"
    - SkillsSheetBody with skills {} renders all 36 SKILL_LABELS in SKILLS order (spot-check the first and last)
    - AttributesSheetBody, {agilidade:{race:8,class:6,bonus:1}}, renders Agilidade with 15 (calculateAttributeBase; no level bonus, DB-08), plus 0 for an attribute with no data
    - WeaponsSheetBody, [{name:'Espada Longa', level:37, damage:{d25:'3000', critical:'7000'}}, null, {name:'Adaga'}]:
      - renders Espada Longa, "Nv 37", 3000, 7000 and Adaga, and an em dash for empty cells
      - [] renders "Nenhuma arma cadastrada"
  </behavior>
  <action>
    1. components/character/quick-sheets/reference-sheets.tsx. Reuse the file style and the BottomSheet wrapper pattern of Task 1's vitality-sheet.tsx: 'use client', a controlled open/onOpenChange, values only from lib/calculations, numbers in font-numeric tabular-nums. Export three bodies, which can be tested without a portal, and three sheets that wrap them ({ open, onOpenChange, character }). These sheets are read-only: no mutation prop and no lock handling. Look from mock lines 604-632.
       - WeaponsSheetBody({ weapons }: { weapons: unknown }): read the existing array the way WeaponsCard does (indexes 0..2, null holes allowed). Narrow each entry with typeof checks; do not use any or a Zod parse that would drop legacy shapes.
         - Skip entries that are null or have no name, no level and no damage cell.
         - Per weapon: serif 17px name (or "Arma N"); muted font-numeric "Nv {level || 0}".
         - A 5-column grid of cells labelled 25%, 50%, 75%, 100% and Crít., showing the damage string as stored or an em dash. Cells are bg-muted; the Crít. cell is bg-accent text-primary.
         - The description below in muted text-sm, when present (keeps the card's info, DB-11).
         - Empty state: "Nenhuma arma cadastrada. Preencha em Básicos → Armas."
       - AttributesSheetBody({ attributes }): a 3-column grid of StatTile in ATTRIBUTES order. Labels come from ATTRIBUTE_LABELS. Each value is calculateAttributeBase(toAttributeValue(attributes?.[key])) (DB-08), the exact expression of the removed modal.
       - SkillsSheetBody({ skills, level }):
         - total = calculateSkillTotal(toSkillValue(skills?.[key]), level || 0) per key in SKILLS order.
         - A skill is in use when its normalized distributed or bonus is not 0.
         - A 2-option segmented control (mock lines 336-339 look: p-[3px] bg-muted grid, h-10 buttons, active bg-card shadow-card), with aria-pressed, labelled "Em uso · N" and "Todas · 36".
         - It starts on "Em uso" when N > 0, otherwise on "Todas" (DB-09).
         - Caption, text-[13px] muted:
           - "Em uso": "Em uso · as outras valem X", where X = calculateSkillTotal(toSkillValue(undefined), level || 0)
           - "Todas": "Todas as perícias"
         - Rows in a 2-column grid (gap-x-3.5, min-h-[38px], border-b): the SKILL_LABELS label (truncated) and the total (font-numeric tabular-nums text-[19px] font-semibold).
       - Titles: WeaponsSheet "Armas", AttributesSheet "Atributos", SkillsSheet "Perícias". Each sheet passes the character's fields (weapons, attributes, skills, level) to its body.
    2. components/forms/character-layout.tsx, rewritten. It keeps its 2-space, single-quote, no-semicolon style and the banner comments.
       - Props: CharacterTabProps plus onToggleEditMode? and header?: React.ReactNode.
       - State: activeTab ('basicos'), openSheet, and the single useUpdateCharacter.
       - Remove the modal state, the modal imports and JSX, and the scroll-to-section handler with its timers. No action uses them any more (DB-11).
       - Root: a div with relative, flex, min-h-dvh, flex-col, bg-background. QuickSheetContext.Provider wraps Tabs (className flex flex-1 flex-col gap-0).
       - Sticky top block (sticky top-0 z-20 border-b bg-background), in this order:
         a. {header}
         b. TabsList, overriding the pill look: mx-auto, grid, h-auto, w-full, max-w-[720px], grid-cols-4, rounded-none, bg-transparent, p-0.
            One TabsTrigger per tab from a module constant listing [value, short, long]:
            - basicos: Básicos / Dados Básicos
            - pericias: Perícias / Perícias & Kit
            - magias: Magias / Magias & Talentos
            - anotacoes: Notas / Anotações
            TabsTrigger className: h-[46px], rounded-none, border-0, border-b-2, border-transparent, bg-transparent, px-1, text-[15px], font-semibold, text-muted-foreground, shadow-none, plus these state classes:
            - data-[state=active]:border-primary, data-[state=active]:bg-transparent, data-[state=active]:text-foreground, data-[state=active]:shadow-none
            - dark:text-muted-foreground, dark:data-[state=active]:border-primary, dark:data-[state=active]:bg-transparent, dark:data-[state=active]:text-foreground
            Labels: a span sm:hidden with the short label, and a span hidden sm:inline with the long one.
         c. When isEditMode: a div (flex, h-[30px], items-center, justify-center, gap-2, bg-accent, text-[13px], font-medium, text-accent-foreground) with a Pencil icon (size-3.5, aria-hidden) and the text "Modo edição · as alterações são salvas sozinhas".
       - Four TabsContent elements with the unchanged tab components and props. className: mt-0, mx-auto, w-full, max-w-[1200px], p-3, [column-width:340px], [column-gap:12px].
         Pass the compatibility props:
         - isSkillsModalOpen = openSheet === 'pericias'; setIsSkillsModalOpen opens 'pericias' or clears
         - the same for attributes with 'atributos'
       - After the content: QuickActionsBar with character, isEditMode, onToggleEditMode and onOpenSheet.
       - Then the five sheets, mounted the way Tasks 1-2 mounted VitalitySheet and BerkanaSheet (open when openSheet equals the kind; onOpenChange sets the kind or null): add WeaponsSheet, AttributesSheet and SkillsSheet next to the existing two.
    3. components/character/quick-actions-bar.tsx, rebuilt to mock lines 533-553.
       - Props as in `<interfaces>` (character, isEditMode, onToggleEditMode?, onOpenSheet). Section-navigation and modal-callback props are removed.
       - Values: maxLevels / current / totals / stage via the Task 1 helpers; pool and state via the Task 2 helpers. No other math.
       - Container: sticky, bottom-0, z-20, border-t, bg-card, shadow-[0_-8px_24px_-12px_oklch(0_0_0/0.5)].
       - Inner wrapper: mx-auto, flex, max-w-[720px], flex-col, gap-1.5, px-2.5, pt-2, pb-[max(0.875rem,env(safe-area-inset-bottom))].
       - Row 1: grid-cols-[1.25fr_1fr_auto], gap-1.5. Its two main buttons share these classes: h-14, flex, items-center, gap-2.5, rounded-(--radius), border, bg-background, px-3, text-left, hover:bg-muted/60, focus-visible:ring-[3px], focus-visible:ring-ring/50, outline-none.
         - Vitality button:
           - icon size-[22px] in the stage text class (muted Heart when stage is null)
           - a column with the formatted current total (font-numeric, tabular-nums, text-2xl, font-semibold) and the shortLabel (text-xs, font-semibold, stage text class; "Vitalidade" when null)
           - aria-label "Vitalidade {current} de {max}, {stage label}"
           - onClick onOpenSheet('vit')
         - Berkana button:
           - the BERKANA_STATE_DISPLAY icon in text-berkana
           - formatted current, then "/" + formatted max in text-[15px] muted
           - the label "Berkana" (text-xs, font-semibold, text-berkana)
           - onClick onOpenSheet('berk')
         - Hide button (DB-10): ghost icon Button, size-11, self-center, ChevronDown, aria-label "Ocultar ações rápidas". When hidden, render only a fixed bottom-4 right-4 z-20 outline icon Button (size-11, bg-card, shadow-lg) with ChevronUp, aria-label "Mostrar ações rápidas".
       - Row 2: grid-cols-4, gap-1.5, of h-12 buttons (flex-col, items-center, justify-center, gap-0.5, rounded-(--radius), text-xs, font-semibold, text-muted-foreground, hover:bg-muted). Icons are size-5 text-foreground.
         - Armas (Sword) → onOpenSheet('arma')
         - Perícias (Target) → onOpenSheet('pericias')
         - Atributos (UserRound) → onOpenSheet('atributos')
         - Lock toggle:
           - aria-pressed is !isEditMode; onClick is onToggleEditMode
           - unlocked: border, border-primary, bg-accent, text-accent-foreground, LockOpen, "Desbloqueado"
           - locked: border, border-border, bg-transparent, text-muted-foreground, Lock, "Bloqueado"
       - Use only token utilities, no hard-coded Tailwind palette colors.
    4. app/character/[id]/page.tsx. Keep every line of state, handleBack, handleRefresh, the early returns (owned by 261101-mvu) and the sanitizedCharacter block unchanged.
       - handleToggleEditMode keeps setIsEditMode(!isEditMode) and replaces its toast with the design copy (DB-12), both with id 'edit-mode' and duration 1800:
         - when locking: toast('Ficha bloqueada', { description: 'Modo leitura. Toque no cadeado para editar.', icon: Lock size-5 text-muted-foreground })
         - when unlocking: toast('Ficha desbloqueada', { description: 'Toque em um campo para editar.', icon: LockOpen size-5 text-primary })
       - The final return renders CharacterLayout with the same four props plus a header element (mock lines 154-160): a row with mx-auto, flex, w-full, max-w-[1200px], items-center, gap-1, px-1.5, pt-1.5, pb-0.5, holding:
         - a ghost icon Button, size-11, aria-label "Voltar", ArrowLeft size-[22px], onClick handleBack
         - a min-w-0 flex-1 column with an h1 (truncate, font-serif, text-[21px], font-semibold, leading-[1.15]) for characterName and a p (truncate, text-[13px], text-muted-foreground) whose text joins playerName, class and "Nv " + (level || 0) with " · ", skipping empty parts
         - a ghost icon Button, size-11, text-muted-foreground, aria-label "Atualizar", RefreshCw size-5, onClick handleRefresh
       - Drop the old container wrapper; the layout owns widths.
       - Keep every import the early returns still use; tsc and lint will flag stale ones.
    5. components/character/index.ts: remove the two modal re-exports. Then delete components/character/skills-modal.tsx and components/character/attributes-modal.tsx with git rm.
    6. components/character/quick-actions.render.test.ts: bun:test with renderToString and createElement, no JSX, and no import of '@/lib/api/queries'.
       - Build the fixture like notes-tab.render.test.ts, cast to CharacterData without any. Shape it like the page's sanitized character (currentVitality always an object; Info 5).
       - Cover every `<behavior>` bullet. Compute expected numbers with lib/calculations calls in the test, then assert the rendered strings contain them.

    Run this task's verify (render test + tsc). Commit as feat(261101-mvv). Then run the mandatory item-level verification at the end of this plan before writing the SUMMARY.
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && bun test components/character/quick-actions.render.test.ts && npx tsc --noEmit && echo SHELL-OK</automated>
  </verify>
  <done>
    - The quick-actions render test passes: bar values, lock labels and DB-07; reference sheet numbers equal the removed modals' expressions; fixtures follow the page's sanitized shape (Info 5).
    - tsc passes. SHELL-OK is printed.
    - The shell, tabs, banner, column flow, rebuilt bar (hide toggle kept), five sheets, header subtitle and lock toasts are in place, and the modals are deleted. The mandatory item-level verification below proves this with the full suite.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| player input → sheet amount → computed payload | Free-typed amount becomes a currentVitality / currentBerkana write |
| sheet → PUT /api/characters/:id | Every write goes through useUpdateCharacter → save core (serial queue per character, expectedUpdatedAt, 409 on stale) and the server's Zod updateCharacterSchema (currentBerkana min 0, currentVitality schema) |
| cached character (React Query) → payload base | Damage and spend are computed from the cached record the player sees |

## STRIDE Threat Register

ASVS level 1; block on: high. IDs continue after 261101-mvt's T-mvt-* (separate item namespace).

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-mvv-01 | Tampering (wrong numbers persisted) | applyVitalityDamage / applyVitalityHeal / spendBerkana / resolveBerkanaPool | high | mitigate | The helpers that move existing behavior are frozen extractions, and oracle tests compare them with verbatim copies of the base-commit card code over a grid of levels, bases, stored shapes and amounts (Tasks 1-2). The new applyVitalityHeal (DB-01) is pinned by round-trip tests against applyVitalityDamage, a no-op test on a full sheet, a per-stage max cap, and deepest-first order with literal numbers. The cards and the sheets call the same helpers, so there is one source |
| T-mvv-02 | Tampering (duplicate or lost writes) | Dano / Cura / Gastar / Recuperar / restore buttons | medium | mitigate | Buttons are disabled while updateCharacterMutation.isPending (one shared instance in the layout). Writes go through the save core's per-character serial queue with expectedUpdatedAt; a stale write gets 409 and a refetch, and the sheet stays open on the fresh numbers instead of retrying blindly |
| T-mvv-03 | Elevation of privilege (write while locked) | vit/berk sheets | low | mitigate | Every write control is disabled when !isEditMode, as the card buttons were. No auth exists by design (owner decision), so the lock is a UI guard, not security |
| T-mvv-04 | Tampering / DoS (malformed amount) | amount inputs | low | mitigate | Digits-only filter, then parseInt with a 0 fallback; actions are disabled at 0. Results are clamped (max(0, ...) for damage/spend, the per-stage max for heal, max for recover), and the server re-validates currentBerkana >= 0 and the currentVitality shape |
| T-mvv-05 | Information disclosure | sheet error toasts / logs | low | mitigate | Toasts use fixed pt-BR text, never server messages. console.error logs only the error object, never request bodies (CLAUDE.md) |
| T-mvv-06 | Repudiation (silent conflict) | conflict path | low | mitigate | On 409 the hook's design conflict toast plus refetch run, and the sheet suppresses its generic toast so the conflict message is not hidden or contradicted |
| T-mvv-SC | Tampering | npm/bun package installs | low | accept | No packages are installed. The mandatory item-level verification fails if package.json or bun.lock changed since the base commit |
</threat_model>

<verification>
MANDATORY item-level verification. Run it after Task 3 is committed and before writing the SUMMARY. The item is not done until it prints ITEM-OK. If any check fails, fix the cause, commit the fix as fix(261101-mvv), and run the whole block again. Never skip or weaken a check.

<automated>cd /home/zephyr/repos/personal/rpg-character-sheet && B=$(cat "$(git rev-parse --git-path gsd-261101-mvv-base)") && git cat-file -e "$B^{commit}" && test ! -e components/character/skills-modal.tsx && test ! -e components/character/attributes-modal.tsx && grep -q 'column-width:340px' components/forms/character-layout.tsx && grep -q 'Modo edição · as alterações são salvas sozinhas' components/forms/character-layout.tsx && grep -q 'Magias & Talentos' components/forms/character-layout.tsx && grep -q '<SkillsSheet' components/forms/character-layout.tsx && grep -q '<WeaponsSheet' components/forms/character-layout.tsx && grep -q '<AttributesSheet' components/forms/character-layout.tsx && grep -q '<VitalitySheet' components/forms/character-layout.tsx && grep -q '<BerkanaSheet' components/forms/character-layout.tsx && grep -q "onOpenSheet('vit')" components/character/quick-actions-bar.tsx && grep -q "onOpenSheet('berk')" components/character/quick-actions-bar.tsx && grep -q "onOpenSheet('arma')" components/character/quick-actions-bar.tsx && grep -q "onOpenSheet('pericias')" components/character/quick-actions-bar.tsx && grep -q "onOpenSheet('atributos')" components/character/quick-actions-bar.tsx && grep -q 'Desbloqueado' components/character/quick-actions-bar.tsx && [ "$(grep -cE '(text|bg|border)-(red|green|yellow)-[0-9]' components/character/quick-actions-bar.tsx)" -eq 0 ] && grep -q 'calculateAttributeBase(' components/character/quick-sheets/reference-sheets.tsx && grep -q 'calculateSkillTotal(' components/character/quick-sheets/reference-sheets.tsx && grep -q 'header={' "app/character/[id]/page.tsx" && grep -q 'Ficha bloqueada' "app/character/[id]/page.tsx" && grep -q 'TESTED_FUNCTIONS.length).toBe(35)' lib/calculations/index.test.ts && LIB_DIFF=$(git diff --name-only "$B" -- lib) && LIB_CHANGED=$(printf '%s\n' "$LIB_DIFF" | sort | tr '\n' ' ') && [ "$LIB_CHANGED" = "lib/calculations/index.test.ts lib/calculations/index.ts " ] && git diff --quiet "$B" -- prisma package.json bun.lock lib/api lib/schemas components/ui && npx tsc --noEmit && bun run lint 2>&1 | grep -q '(0 errors, 1 warning)' && bun test && bun run build && echo ITEM-OK</automated>

What it proves:
- The modal files are gone, and nothing imports them (tsc).
- The shell, the five sheet mounts and the five bar entry points are wired.
- The bar has no hard-coded palette colors.
- The reference sheets use the old modal expressions.
- The lib/calculations export guard is at 35.
- Under lib/, only lib/calculations/index.ts and index.test.ts changed since the base commit, and prisma, package.json, bun.lock, lib/api, lib/schemas and components/ui are unchanged.
- `npx tsc --noEmit` passes, `bun run lint` prints "(0 errors, 1 warning)" (only the pre-existing route.ts warning), `bun test` passes (oracle grids, heal round-trip, render test), and `bun run build` passes.

<human-check>
      End-of-item walkthrough with `bun dev`, phone width (390px) and desktop, dark mode:
      1. Open a sheet. Check:
         - back arrow, serif name, "jogador · classe · Nv N" and refresh at the top
         - four underline tabs: short labels on the phone, long labels on desktop
         - the ember "Modo edição" strip while unlocked
         - cards flowing in columns on desktop
      2. Bottom bar:
         - vitality shows the stage icon, color and short label (compare the stage with the per-stage rows in Básicos)
         - Berkana shows current/max
         - tap the lock: "Bloqueado", the strip disappears, a "Ficha bloqueada" toast shows. Tap again to unlock.
      3. Vit sheet:
         - type 1000 (or use the chips); the preview shows the totals after Dano and after Cura
         - Dano: a toast appears and the Básicos Vitalidade numbers drop exactly as the old Aplicar Dano did (drains Notável first)
         - Cura by 500: the deepest drained stage refills first, and no stage passes its max
         - Dano X then Cura X returns to the previous numbers
         - the prominent "Restaurar vitalidade máxima" restores every stage
         - while locked, the sheet opens but every button is disabled
         - on a character with Raça/Classe 0, Dano and Cura are disabled and the "Vitalidade não configurada" hint shows (DB-16)
      4. Berk sheet:
         - +30 then Gastar lowers Berkana by 30 (never below 0)
         - Recuperar raises it up to max only
         - restore fills it
         - at 0 the bar shows 0 with the Esgotada icon
      5. Armas, Atributos and Perícias sheets show the same numbers as the Básicos cards and the old modals. Perícias toggles Em uso / Todas.
      6. Edit the character in a second tab, then apply Dano in the first: only the conflict toast (warning, spinning refresh) appears and the numbers reload.
</human-check>
</verification>

<success_criteria>
- The sheet shell, tabs, edit banner and 340px column flow match the Ferro & Brasa mock
- The bottom bar and the five bottom sheets replace the old bar actions and the two modals
- Every vitality and Berkana write is proven identical to today's behavior (oracle tests). Restore uses the existing max payloads; Gastar generalizes -30/-50; Recuperar is capped at the inline field's max; Cura by amount undoes damage in reverse stage order, never past any stage's max (DB-01, round-trip tested)
- useQuickSheet().openSheet is available to 261101-mvw and documented
- tsc, lint (no new warnings), bun test and build pass
</success_criteria>

<output>
Create `.planning/quick/261101-mvv-redesign-sheet-shell-and-quick-actions-ds-03-restyle-app-cha/261101-mvv-SUMMARY.md` when done. Include:
- the `<design_behavior_decisions>` table, with any new decisions taken during execution, and the open question PD-02 (attribute level bonus in the Atributos sheet). DB-01 is settled by the owner (Cura in reverse damage order)
- the final `<interfaces>` block, corrected if anything changed, for 261101-mvw/mvx
- the final bun test count and the lib/calculations export count (35)
- a note that the tab bodies still use their pre-redesign wrappers until 261101-mvw..mvz return SectionCards as direct children of the column container
</output>
