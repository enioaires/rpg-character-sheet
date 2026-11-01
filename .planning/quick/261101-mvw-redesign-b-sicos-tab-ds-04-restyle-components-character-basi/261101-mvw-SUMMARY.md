---
phase: quick-261101-mvw
plan: 01
subsystem: ui-basicos-tab
tags: [ferro-brasa, basicos, section-cards, view-model, render-tests]
requires: [261101-mvt, 261101-mvv]
provides:
  - basic-info-model.ts, a framework-free view model for the Básicos cards (composes lib/calculations and the mvv helpers)
  - eight design SectionCards in the Básicos tab, returned as a fragment in mock order
  - Atributos bottom sheet aligned to level-inclusive totals (closes PD-02)
affects: [261101-mvx, 261101-mvy, 261101-mvz]
key-files:
  created:
    - components/character/basic-info/basic-info-model.ts
    - components/character/basic-info/basic-info-model.test.ts
    - components/character/basic-info-tab.render.test.ts
  modified:
    - components/character/basic-info-tab.tsx
    - components/character/basic-info/vitality-card.tsx
    - components/character/basic-info/berkana-card.tsx
    - components/character/basic-info/attribute-cards.tsx
    - components/character/basic-info/profile-cards.tsx
    - components/character/basic-info/equipment-cards.tsx
    - components/character/basic-info/languages-card.tsx
    - components/character/quick-sheets/reference-sheets.tsx
    - components/character/quick-actions.render.test.ts
decisions:
  - "DS4-01..DS4-20 applied as written; DS4-21 and DS4-22 added during execution (see tables)"
metrics:
  tasks: 3
  files: 12
  commits: 6
status: complete
actuals:
  tasks: 3
  commits: 6
plan_head_before: 9cc496660d560587eb653d176a92c5ceb97363f1
plan_head_after: 8f0ff27c9283b7714a3a6d15c20d151dd9c1c4e3
completed: 2026-11-01
---

# Phase quick-261101-mvw Plan 01: Básicos tab (DS-04) Summary

The Básicos tab now renders eight Ferro & Brasa section cards (Vitalidade, Berkana, Armas, Atributos, Experiência e Nível, Armadura, Informações Básicas, Linguagens) as direct children of the layout's column flow. Every number comes from `lib/calculations` through one framework-free view model. Dano/Cura and Gastar/Recuperar only open the 261101-mvv bottom sheets. Every field that was editable keeps its section and field path, and the Atributos card and the bottom-bar Atributos sheet show the same level-inclusive totals.

## Commits

| Commit | Message |
| --- | --- |
| fa3696a | test(261101-mvw): view model and render tests for Vitalidade and Berkana cards |
| f34a460 | feat(261101-mvw): Vitalidade and Berkana design cards opening the quick sheets |
| 1d9cbf3 | test(261101-mvw): attribute rows, experience view and level-inclusive Atributos sheet |
| 56d07a2 | feat(261101-mvw): Atributos, Experiência e Nível and Informações Básicas design cards |
| f04b3c1 | test(261101-mvw): weapons, armor, languages and lock behavior of the Básicos tab |
| 8f0ff27 | feat(261101-mvw): Armas, Armadura and Linguagens design cards with lock behavior |

## Design behavior decisions (DS4-01..DS4-22)

Owner rule: the design is visual direction; current behavior wins. DS4-01..DS4-20 are the plan's table, applied as written. DS4-21 and DS4-22 are new calls made during execution.

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
| DS4-12 | XP 57 / 80, "Faltam 23 XP para o nível 8" | The XP shown is the stored currentXP, which is XP inside the current level (processLevelUp subtracts the used XP), over getXPRequiredForNextLevel(level). Caption: "Faltam N XP para o nível L+1". When canLevelUp: "XP suficiente para o nível L+1". At level >= 99: "Nível máximo" (canLevelUp and the level field both cap at 99). Level and XP stay editable. No level-up button is added (none exists today) | Coordinator: XP from existing lib/calculations functions |
| DS4-13 | Armadura bar in chart-5 | Bar = getFillPercent(currentVitality, totalVitality) of the armor. Name, description, current and total stay editable | Existing fields |
| DS4-14 | 11 info fields, labels "Alinhamento", "Terra natal" | All 12 current fields are kept, including Nome do Personagem, which spans both columns. Labels keep today's text (Tendência, Terra Natal, Pontos de Virtude) | Fields and terms come from the app |
| DS4-15 | Locked = read-only | Coordinator lock rule. Weapons, armor and language controls never received isEditMode, so today they stay editable while the sheet is locked. Now every inline field gets isEditMode (locked = read-only text), and language chips are static spans when locked. These edit-only controls are hidden when locked: "Outra", the custom-name editors, empty weapon slots and the "Máximo de 3 armas." hint. Dano/Cura/Gastar/Recuperar stay visible in both modes: they are play actions, and the sheets apply the gating | Coordinator rule for all tabs |
| DS4-16 | Three filled weapons | Locked: only slots with content (hasWeaponContent), or "Nenhuma arma cadastrada." when none. Unlocked: the three fixed slots so any can be filled (same paths). The description renders as text when present (locked) or as the editor (unlocked). The cell label "Crít." comes from the mock; placeholders are unchanged | Pure display convenience |
| DS4-17 | Language toggle chips + "Outra" | Chips toggle `known` with exactly today's checkbox payloads (standard and custom). "Outra" appends `{ name: '', known: false }` like today's add button. Custom names stay editable through the same EditableField path `custom.{index}.name`, listed under the chips while unlocked. Display labels gain accents (Élfico, Sigílico, Anão); persisted keys stay STANDARD_LANGUAGES | Existing writes and keys |
| DS4-18 | n/a | Language write failures keep their console.error and now also show a fixed pt-BR toast.error ("Não foi possível salvar a linguagem"), except on conflicts (useUpdateCharacter already shows the conflict toast) | CLAUDE.md: no new silent catch |
| DS4-19 | n/a | Known bug, NOT fixed. Renaming a custom language turns languages.custom into an index-keyed object (buildUpdateData's 3-segment path). The card reads custom entries only when custom is an array, so those rows stay hidden exactly as today, and "Outra" keeps today's failure on that shape (now logged plus a toast). Also observed and kept: defaults store `anao` while STANDARD_LANGUAGES reads `anão` | Coordinator: do not fix here |
| DS4-20 | Badge when vitality is not configured | getCurrentVitalityStage null → muted Heart badge "Sem vitalidade definida" (same copy as the vit sheet), with no stage color | Consistency with mvv |
| DS4-21 (new) | Per-stage rows colored by stage | When the stage is null (vitality not configured) the six row icons render in `text-muted-foreground` instead of the stage colors. Configured characters are unchanged | The plan's render test requires no `text-vitality-coma` for an unconfigured sheet, and DS4-20 says "no stage color"; the Coma row icon would otherwise carry that class |
| DS4-22 (new) | n/a | The Task 1 render test ignores the hidden `<input type="checkbox">` that the old Linguagens checkboxes rendered, because Task 1 runs before Task 3 rewrites that card. Task 3 tightened the assertion back to "no `<input` at all" | The plan's literal "no `<input`" could not pass in the Task 1 tracer while the old checkbox card was still in the tab |

### PD-02: CLOSED

Owner decision 2026-11-01: attribute totals include the level bonus everywhere (`calculateAttributeTotal(attribute, level)`). The Atributos card shows it, and the bottom-bar Atributos sheet was aligned in Task 2: `AttributesSheetBody` now takes `{ attributes, level }` and `AttributesSheet` passes `character.level`. The `quick-actions.render.test.ts` assertions were updated to the level-inclusive values (level 7: 16 and 1; level 0: 15 and 0).

### Open question: DS4-19 (not fixed)

- Editing a custom language name goes through `buildUpdateData`'s 3-segment path and turns `languages.custom` into an index-keyed object. The card only reads `custom` when it is an array, so those entries disappear from the chips, and "Outra" fails on that shape (logged plus a toast). Same behavior as before this item.
- Defaults store the standard language key `anao`, while `STANDARD_LANGUAGES` reads `anão`, so the "Anão" chip does not reflect a default-created `anao: true`.
- Neither was changed; both need an owner-approved fix in `components/ui/editable-field.tsx` / `lib/defaults`.

## DS4-02 note

mvv's `openSheet(kind)` takes only the kind. "Dano" and "Cura" therefore both call `openSheet('vit')` and the sheet opens with both actions side by side; "Gastar" and "Recuperar" both call `openSheet('berk')`. No mvv sheet files were edited for this.

## Verification results

- `npx tsc --noEmit`: clean.
- `bun run lint`: `0 errors, 1 warning` (the pre-existing `routes` warning in `app/api/[[...route]]/route.ts`).
- `bun test`, final run: `300 pass, 0 fail, 13973 expect() calls, Ran 300 tests across 12 files` (mvv left 259; +22 model tests in `basic-info-model.test.ts`, +18 in `basic-info-tab.render.test.ts`, +1 in `quick-actions.render.test.ts`; the `tests across 12 files` count includes the two new files).
- `bun run build` (after `rm -rf .next`): passes.
- Task verifies: the three task-level grep blocks passed (TRACER, ATTR-XP-INFO and the Task 3 grep set); the scoped diff gate against the recorded base commit printed `BASICOS-OK` (`lib/*`, `prisma`, `package.json`, `bun.lock`, `components/ui`, `components/forms`, `components/character/quick-sheets` except `reference-sheets.tsx`, `resource-display.ts`, `quick-actions-bar.tsx`, `types.ts`, `index.ts` and `app` unchanged since the base).
- No file uses the shadcn Card primitives, `dangerouslySetInnerHTML` or a fixed Tailwind palette color under `components/character/basic-info/`.
- Not done: the human walkthrough from Task 3's `<human-check>` (`bun dev` at 390px and desktop, dark mode, real saves). A runtime smoke test in a real browser was not run. It should be done at the end of the batch.

### Line counts (files in files_modified, limit 300)

| File | Lines |
| --- | --- |
| components/character/basic-info/basic-info-model.ts | 222 |
| components/character/basic-info/basic-info-model.test.ts | 286 |
| components/character/basic-info-tab.render.test.ts | 236 |
| components/character/basic-info-tab.tsx | 35 |
| components/character/basic-info/vitality-card.tsx | 149 |
| components/character/basic-info/berkana-card.tsx | 94 |
| components/character/basic-info/attribute-cards.tsx | 107 |
| components/character/basic-info/profile-cards.tsx | 111 |
| components/character/basic-info/equipment-cards.tsx | 188 |
| components/character/basic-info/languages-card.tsx | 182 |
| components/character/quick-sheets/reference-sheets.tsx | 240 |
| components/character/quick-actions.render.test.ts | 196 |

No card had to be extracted to stay under 300 lines.

## Deviations from Plan

1. **[Rule 1 - Bug in plan test] "no `<input`" in the Task 1 tracer.** The old Linguagens checkboxes (still in the tab during Task 1) render a hidden `<input type="checkbox">`, so the literal assertion could not pass. The Task 1 test ignores checkbox inputs; Task 3 restored the strict assertion (DS4-22).
2. **[Rule 1 - Bug in plan test] "no `text-vitality-coma`" for an unconfigured sheet.** The Coma row icon carried that class. Unconfigured rows now use the muted color (DS4-21).
3. **Task 2 distribution table fields written out.** The three `EditableNumberField`s (`key.race`, `key.class`, `key.bonus`) are three explicit elements instead of a `.map`, so the plan's preservation grep on the literal template strings holds. Paths are unchanged.
4. **Intermediate tab state.** Between the Task 1 and Task 2 commits the tab no longer passed `setIsAttributesModalOpen` to the still-old summary card, so its expand button was inert for one commit. Task 2 removed that card.

Otherwise: plan executed as written.

## Threat Flags

None. No new endpoints, auth paths or schema changes. All writes still go through `useUpdateCharacter` and the existing `updateCharacterSchema`; `console.error` logs only the error object; toasts use fixed pt-BR text; no packages were installed.

## Known Stubs

None.

## Stale lines in .claude/CLAUDE.md (not edited)

- "Cards that persist receive an `updateCharacterMutation` prop from their tab; `profile-cards`, `attribute-cards`, `equipment-cards` and `berkana-card` take the shared props": now only `LanguagesCard` receives `updateCharacterMutation`. `VitalityCard` and `BerkanaCard` take the shared props and perform no writes.
- Architecture / Layers: `components/character/basic-info/attribute-cards.tsx` now exports one `AttributesCard` (the old `AttributesSummaryCard` and `AttributesDistributionCard` are gone).
- "Duplicated persistence hook instances per tab" and the `UpdateCharacterMutation` description: the Básicos tab still has one `useUpdateCharacter` instance, used only by `LanguagesCard`.
- `setIsAttributesModalOpen` in `CharacterTabProps` is no longer read by the Básicos tab (the layout still maps it to the Atributos sheet).
- `components/ui/checkbox.tsx` is no longer used by the Básicos tab (not verified whether other tabs use it).
- The "Large files" list and `basic-info-tab.tsx` description (a grid of rows) are outdated: the tab is now a 35-line fragment.
- New test files: `components/character/basic-info-tab.render.test.ts` and `components/character/basic-info/basic-info-model.test.ts`.

## Note for 261101-mvx

`basic-info-tab.tsx` returns a fragment of `SectionCard`s as direct children of the layout's column flow (no outer grid or `space-y` wrapper). That is the tab pattern to follow. Per-tab view models live next to the cards (`basic-info-model.ts`) and only compose `lib/calculations`; render tests wrap the tab in `QuickSheetContext.Provider` and `mock.module('@/lib/api/queries')`, and strip `<!-- -->` before matching text.

## Self-Check: PASSED

- Files exist: components/character/basic-info/basic-info-model.ts, basic-info-model.test.ts, components/character/basic-info-tab.render.test.ts, and the seven rewritten card/tab files.
- Commits exist on the branch: fa3696a, f34a460, 1d9cbf3, 56d07a2, f04b3c1, 8f0ff27 (`git rev-list --count 9cc4966..HEAD` = 6).
