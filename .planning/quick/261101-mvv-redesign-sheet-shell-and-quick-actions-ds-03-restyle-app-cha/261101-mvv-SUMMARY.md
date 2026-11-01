---
phase: quick-261101-mvv
plan: 01
subsystem: ui-sheet-shell
tags: [ferro-brasa, quick-actions, bottom-sheets, vitality, berkana, oracle-tests]
requires: [261101-mvt, 261101-mvu]
provides:
  - pure resource helpers in lib/calculations (vitality damage/heal/resolve/total/stage, Berkana pool/spend/recover/state)
  - sheet shell (header slot, underline tabs, edit banner, 340px column flow)
  - design bottom bar and five bottom sheets (vit, berk, arma, atributos, pericias)
  - useQuickSheet().openSheet(kind) for the cards in 261101-mvw
affects: [261101-mvw, 261101-mvx]
key-files:
  created:
    - components/character/resource-display.ts
    - components/character/quick-sheets/quick-sheet-context.tsx
    - components/character/quick-sheets/amount-entry.tsx
    - components/character/quick-sheets/vitality-sheet.tsx
    - components/character/quick-sheets/berkana-sheet.tsx
    - components/character/quick-sheets/reference-sheets.tsx
    - components/character/quick-actions.render.test.ts
  modified:
    - lib/calculations/index.ts
    - lib/calculations/index.test.ts
    - components/character/basic-info/vitality-card.tsx
    - components/character/basic-info/berkana-card.tsx
    - components/forms/character-layout.tsx
    - components/character/quick-actions-bar.tsx
    - components/character/index.ts
    - app/character/[id]/page.tsx
  deleted:
    - components/character/skills-modal.tsx
    - components/character/attributes-modal.tsx
decisions:
  - "DB-01..DB-16 applied as written in the plan (table below)"
metrics:
  tasks: 3
  files: 17
  commits: 7
status: complete
actuals:
  tasks: 3
  commits: 7
plan_head_before: 13eb61fa05d9fabb0184fa99ac9baa38f96457a3
plan_head_after: 9cc496660d560587eb653d176a92c5ceb97363f1
completed: 2026-11-01
---

# Phase quick-261101-mvv Plan 01: Sheet shell and quick actions (DS-03) Summary

The character sheet now has the Ferro & Brasa shell (header, underline tabs, edit banner, 340px column flow), a rebuilt bottom bar and five bottom sheets (vitality, Berkana, weapons, attributes, skills) that replace the old scroll-to-card actions and the two Dialog modals. Every vitality and Berkana write now goes through pure `lib/calculations` helpers. The ones that move existing behavior are proven equal to frozen copies of the base-commit card code, and the new Cura-by-amount helper is proven by round-trip against damage.

## Commits

| Commit | Message |
| --- | --- |
| a49bcf7 | test(261101-mvv): oracle and round-trip tests for vitality resource helpers |
| a000695 | feat(261101-mvv): pure vitality helpers (damage, heal, resolve, total, stage) |
| 0f89184 | feat(261101-mvv): vitality bottom sheet (Dano, Cura, restaurar) wired to the quick bar |
| 1ab0971 | test(261101-mvv): oracle tests for Berkana pool, spend, recover and state |
| ea2690a | feat(261101-mvv): pure Berkana helpers (pool, spend, recover, state) |
| b9246e7 | feat(261101-mvv): Berkana bottom sheet; cards use the shared resource helpers |
| 9cc4966 | feat(261101-mvv): sheet shell, design bottom bar and reference sheets; modals removed |

## Design behavior decisions (DB-01..DB-16)

Owner rule: the design is visual direction; current behavior wins. All 16 were applied as planned. No new decisions beyond these (the small execution notes are in "Deviations").

| ID | Mock shows | Decision | Why |
|----|-----------|----------|-----|
| DB-01 | vit sheet "Cura" (heal by amount) | Cura por valor adicionada por decisão do dono (ordem inversa do dano): `applyVitalityHeal` refills the deepest drained stage first, up to each stage's `calculateVitalityLevels` max, then moves up toward Notável; leftover is discarded. Dano and Cura sit side by side, with a prominent "Restaurar vitalidade máxima" below them | Owner decision (2026-11-01): the table mostly applies damage and usually heals with "vitalidade máxima", but players must be able to damage or heal by any amount. The mock's pools math is not used |
| DB-02 | "Restaurar vitalidade máxima" | Kept: writes `currentVitality = calculateVitalityLevels(...)`, byte-for-byte the old "Vida Máxima" payload | Existing action |
| DB-03 | "Restaurar Berkana ao máximo" | Kept: writes `currentBerkana = maxBerkana \|\| calculated` (old "Berkana Máxima") | Existing action |
| DB-04 | Gastar by amount | Kept: `max(0, current - n)` generalizes the old -30/-50 buttons. Chips 30 and 50 plus Gastar reproduce them exactly (oracle test) | Existing rule |
| DB-05 | Recuperar by amount | Added: `min(max, current + n)`, never lowering a value above max | Pure convenience over currentBerkana: the inline "Atual" field already accepts any 0..max value and clamps to the same max |
| DB-06 | pools/stageOf stage math | Not copied. The stage comes from real per-stage currentVitality (card fallback rule): the first stage in damage-drain order with a value > 0, else Coma; no stage when vitality is not configured | Follows the app's own damage order and stored per-stage values |
| DB-07 | bar Berkana number | Shows the persisted currentBerkana, like the Berkana card. The old bar fell back to max when current was 0, which hid an empty pool | The card and the spend/recover writes use the persisted value; the bar now agrees with them |
| DB-08 | atributos "totals" | Shows `calculateAttributeBase` (race + class + bonus, no level bonus), exactly like the removed AttributesModal | Same numbers as today. Open question PD-02 from 261101-iif stays open (see below) |
| DB-09 | pericias: in-use only | In-use list by default, plus a "Todas · 36" toggle. Order is SKILLS (the old modal order); totals use `calculateSkillTotal`; the caption "as outras valem N" uses `calculateSkillTotal` with zero distribution | Keeps the old modal's ability to see every skill |
| DB-10 | bar without hide toggle | Hide/show kept: a 44px chevron at the end of the first row, and a floating 44px button when hidden | Existing capability |
| DB-11 | bar buttons scroll to cards | Replaced by sheets, per the item description. The sheets show the same data, and the cards stay in the Básicos tab | Item requirement |
| DB-12 | lock label "Editando" | "Desbloqueado"/"Bloqueado" as the item text says. Toggle toasts use the design copy ("Ficha bloqueada" / "Ficha desbloqueada") | Item text |
| DB-13 | numbers "3.600" | `formatGameNumber` (pt-BR grouping) for display only; written values are unchanged | Look |
| DB-14 | old bar colors (<=30% red, <=60% yellow) | Replaced by stage color (vitality) and the Berkana token | Look; the color is never the only signal (icon + label) |
| DB-15 | locked sheet | Edit-only controls are hidden when locked (coordinator rule). Play actions in the quick sheets are not edit-only, so they stay visible and keep the current gating: Dano, Cura, restore, Gastar and Recuperar are disabled while locked, with the "Ficha bloqueada · desbloqueie para alterar." hint. The bar's sheet buttons and the read-only reference sheets work in both modes. The edit banner shows only while unlocked | Coordinator decision + current gating kept as is |
| DB-16 | vit sheet with unconfigured vitality | When `calculateVitalityTotal(maxima) <= 0` (`getCurrentVitalityStage` returns null), Dano and Cura are disabled. The sheet shows "Vitalidade não configurada · defina Raça e Classe em Básicos → Vitalidade." Nothing is written and no success toast appears. "Restaurar vitalidade máxima" keeps the old Vida Máxima behavior (enabled when unlocked) | A damage or heal on zero/negative maxima would write unchanged zeros and toast a misleading success |

### Open question PD-02 (still open)

Should the Atributos sheet show the attribute total with the level bonus (`calculateAttributeTotal`, which adds `floor(level / 5)` from level 5) instead of `calculateAttributeBase`? The old AttributesModal showed the base without level bonus, and DB-08 keeps that so the numbers stay identical. The Básicos attribute cards and the sheet could therefore disagree for level >= 5 characters. The owner still needs to decide.

## Final interfaces (unchanged from the plan's `<interfaces>` block, with the notes below)

Exports of `lib/calculations/index.ts` (pure, no framework code):
- Types: `VitalityStageKey`, `CurrentVitalityInput`, `BerkanaStateKey`, `BerkanaPool`.
- Vitality: `resolveCurrentVitalityLevels(currentVitality, maxLevels)`, `calculateVitalityTotal(levels)`, `applyVitalityDamage(currentVitality, maxLevels, damageAmount)`, `applyVitalityHeal(currentVitality, maxLevels, healAmount)`, `getCurrentVitalityStage(current, maxLevels)`.
- Berkana: `resolveBerkanaPool({ level, maxBerkana, currentBerkana, berkanaBonus })` (pass the character directly; the type accepts nullable optional numbers), `spendBerkana(current, amount)`, `recoverBerkana(current, max, amount)`, `getBerkanaState(current, max)`.
- `lib/calculations/index.ts` now imports `VITALITY_LEVELS` from `@/lib/constants/character` (that file has no imports, so no cycle).

`components/character/resource-display.ts`: `VITALITY_STAGE_DISPLAY`, `BERKANA_STATE_DISPLAY`, `formatGameNumber` (plus the exported type `VitalityStageDisplay`).

`components/character/quick-sheets/quick-sheet-context.tsx`: `QuickSheetKind = 'vit' | 'berk' | 'arma' | 'atributos' | 'pericias'`, `QuickSheetApi`, `QuickSheetContext`, `useQuickSheet()` (throws `useQuickSheet must be used inside CharacterLayout` outside the provider).

`CharacterLayout` props: `CharacterTabProps & { onToggleEditMode?; header?: React.ReactNode }`. Tab values unchanged (`basicos`, `pericias`, `magias`, `anotacoes`). Each `TabsContent` is the column container (`max-w-[1200px] p-3 [column-width:340px] [column-gap:12px]`). The compatibility props `isSkillsModalOpen`/`setIsSkillsModalOpen`/`isAttributesModalOpen`/`setIsAttributesModalOpen` stay in `CharacterTabProps`; the layout maps them to the `pericias` and `atributos` sheets. One `useUpdateCharacter()` instance lives in the layout and goes to `VitalitySheet` and `BerkanaSheet` as `updateCharacterMutation`.

`QuickActionsBar` props: `{ character: CharacterData; isEditMode: boolean; onToggleEditMode?: () => void; onOpenSheet: (kind: QuickSheetKind) => void }`.

For 261101-mvw: the Vitalidade card's Dano and Cura buttons call `openSheet('vit')`; the Berkana card's Gastar/Recuperar call `openSheet('berk')`. Both cards already compute through the helpers; do not re-inline any formula. Buttons that only open a sheet are play actions: keep them visible in both modes (the sheets apply the lock gating).

## Verification results

- `npx tsc --noEmit`: clean.
- `bun run lint`: `0 errors, 1 warning` (the pre-existing `routes` warning in `app/api/[[...route]]/route.ts`).
- `bun test`, final run: `259 pass, 0 fail, 13711 expect() calls, Ran 259 tests across 10 files` (baseline 214 from mvu: +35 new tests in `lib/calculations/index.test.ts`, +10 in the new `quick-actions.render.test.ts`).
- `lib/calculations` function-export guard (`TESTED_FUNCTIONS`): 26 -> 35 (31 after Task 1, 35 after Task 2).
- `bun run build` (after `rm -rf .next`): passes.
- Task verifies printed `TRACER-OK`, `BERKANA-OK`, and the mandatory item-level block printed `ITEM-OK`.
- Gates inside ITEM-OK: under `lib/` only `lib/calculations/index.ts` and `index.test.ts` changed since the base commit; `prisma`, `package.json`, `bun.lock`, `lib/api`, `lib/schemas` and `components/ui` are unchanged; both modal files are gone and nothing imports them.
- Oracle coverage: `applyVitalityDamage` against the frozen base-commit loop over 6 levels x 4 bases x 9 stored shapes x 5 amounts (1080 combinations, plus the negative-maximum quirk pinned); `resolveCurrentVitalityLevels` and `calculateVitalityTotal` against the frozen card/bar expressions over the same grid; `resolveBerkanaPool` against the frozen card computation over 3x3x4x3 inputs; `spendBerkana(c, 30/50)` against the frozen `minus30`/`minus50` switch; restore against the frozen `fill` branch. `applyVitalityHeal`: round-trip `heal(damage(full, n), n) = full` for every grid amount `n <= total` and `n = total`, no-op on a full sheet, per-stage max cap, deepest-first with the literal numbers from the plan (2820 / 3280 + 1040 / all at max).
- Not done: the human walkthrough (`bun dev` at 390px and desktop, dark mode, the second-tab conflict check). It must be done at the end of the batch. A runtime smoke test of the sheets in a real browser was not run.

## Deviations from Plan

Auto-fixed or adapted (no behavior change):

1. **[Rule 3 - Blocking] Extra shared component `components/character/quick-sheets/amount-entry.tsx`.** The vit and berk sheets share the same amount input and chip row. Instead of duplicating about 40 lines, both import `AmountEntry` (digits-only input, `h-[72px]` 44px numeric field, chip grid). It is not in the plan's `files_modified`, but it is a small presentational file and changes no contract.
2. **[Rule 1 - Bug in plan fixture] Skill key `percepção`.** The plan's render-test fixture named the key `percepcao`, but the persisted `SKILLS` key is `percepção` (accented). The test uses the real key so the expected total (19) is actually looked up.
3. **Lint cleanup in `berkana-card.tsx`.** After switching to `resolveBerkanaPool(character).max`, the destructured `level` and `maxBerkana` became unused (new lint warnings), so they were removed from the destructuring. The card's UI and writes are unchanged.
4. **Base commit record.** The base is stored in `.git/gsd-261101-mvv-base` (Step 0) and was used as the plan commit ledger; `commits: 7` was measured with `git rev-list --count 13eb61f..HEAD`.
5. **`vitality-card.tsx` total uses `|| 0` now.** `calculateVitalityTotal` guards each stage with `|| 0` (the old card's max total did not, the bar's did). The result differs only for a non-finite stage, which the formulas cannot produce from numeric inputs.

## Behavior notes worth knowing

- The page's sanitized character replaces a missing `currentVitality` with six zeros, so a brand-new character shows total 0 and stage Coma (when its maxima are configured) until the first restore. This was already true of the cards; the render-test fixtures follow that shape.
- The sheets rely on the layout's single `useUpdateCharacter()` instance. A save conflict shows only the hook's conflict toast (warning); the sheets suppress their own generic toast on `isCharacterConflictError` and stay open on the refetched numbers.
- The tab bodies still use their pre-redesign wrappers (`space-y-*`, grids) inside the new column container until 261101-mvw..mvz return SectionCards as direct children (fragment or `contents` wrapper). The multi-column flow will only look right after those items land.

## Threat Flags

None. No new endpoints, auth paths or schema changes. Every write goes through `useUpdateCharacter` (serial queue, `expectedUpdatedAt`) and the existing `updateCharacterSchema`. Toasts use fixed pt-BR text; `console.error` logs only the error object. No packages were installed (`package.json` and `bun.lock` unchanged).

## Known Stubs

None.

## Stale lines in .claude/CLAUDE.md (not edited)

- "`components/character/skills-modal.tsx` / `attributes-modal.tsx`" are described in the Architecture section ("renders ... the skills/attributes modals", `Layers`) and are now deleted; they are replaced by `components/character/quick-sheets/*`.
- "`components/character/index.ts` re-exports the tabs, modals, `QuickActionsBar`...": the two modal re-exports are gone.
- "Pages ... `handleNavigate` scroll-to-section logic" in `components/forms/character-layout.tsx` no longer exists (the bar opens sheets). The `data-section` attributes on cards remain but are no longer used by the bar.
- "`QuickActionsBar({ character, onNavigate, ... }: QuickActionsBarProps)`" (Function Design) is now `{ character, isEditMode, onToggleEditMode, onOpenSheet }`.
- "`isEditMode` defaults to `true` in `app/character/[id]/page.tsx`" is still true; the page header is now passed to `CharacterLayout` through a `header` slot instead of a container wrapper.
- Test list in Technology Stack: `components/character/quick-actions.render.test.ts` is new, and `lib/calculations/index.test.ts` now also holds the oracle tests.
- `lib/calculations` is described as "pure TypeScript" with no imports; it now imports `VITALITY_LEVELS` from `@/lib/constants/character`.
- Carried over from mvt/mvu: the `next-themes` and Geist font lines; the `app/characters/page.tsx` line count.

## Self-Check: PASSED

- Files exist: components/character/resource-display.ts, components/character/quick-sheets/{quick-sheet-context,amount-entry,vitality-sheet,berkana-sheet,reference-sheets}.tsx, components/character/quick-actions.render.test.ts. Deleted: skills-modal.tsx, attributes-modal.tsx.
- Commits exist on the branch: a49bcf7, a000695, 0f89184, 1ab0971, ea2690a, b9246e7, 9cc4966.
