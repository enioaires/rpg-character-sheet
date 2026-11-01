---
phase: quick-261101-mvx
plan: 01
subsystem: ui-pericias-kit-tab
tags: [ferro-brasa, pericias, kit, section-cards, view-model, parity-tests, render-tests]
requires: [261101-mvt, 261101-mvv]
provides:
  - skills-kit-model.ts, a framework-free presentation model (groups, point summary, rows, stepper and kit payload builders)
  - Perícias, Finanças and Kit de Aventureiro design SectionCards returned as a fragment from a 36-line tab
affects: [261101-mvy, 261101-mvz]
key-files:
  created:
    - components/character/skills-kit/skills-kit-model.ts
    - components/character/skills-kit/skills-kit-model.test.ts
    - components/character/skills-kit/skills-card.tsx
    - components/character/skills-kit/skill-row.tsx
    - components/character/skills-kit/skill-stepper.tsx
    - components/character/skills-kit/finances-card.tsx
    - components/character/skills-kit/adventure-kit-card.tsx
    - components/character/skills-kit-tab.render.test.ts
  modified:
    - components/character/skills-kit-tab.tsx
decisions:
  - "Decisions 1-10 from the plan applied as written; no new decision was needed (see table)"
metrics:
  tasks: 3
  files: 9
  commits: 5
status: complete
actuals:
  tasks: 3
  commits: 5
plan_head_before: 8f0ff27c9283b7714a3a6d15c20d151dd9c1c4e3
plan_head_after: b94f7e73d831e94688a4393a429bf789727479a5
completed: 2026-11-01
---

# Phase quick-261101-mvx Plan 01: Perícias & Kit tab (DS-05) Summary

The Perícias & Kit tab is now three Ferro & Brasa section cards (Perícias, Finanças, Kit de Aventureiro) returned as a fragment of direct children of the layout column flow, composed by a 36-line tab that owns one `useUpdateCharacter()`. Every number (Disponíveis/Gastos/Restantes with the (level+1)*10 pool, every skill total) and every payload (stepper, kit add/remove/restore) comes from one framework-free model whose outputs are proven equal to verbatim copies of the pre-redesign expressions.

## Commits

| Commit | Message |
| --- | --- |
| 4f86793 | test(261101-mvx): parity tests for the skills and kit presentation model |
| 0df7a25 | feat(261101-mvx): skills and kit presentation model with parity to the old tab |
| 75db032 | feat(261101-mvx): Perícias design card with points strip, filter and grouped rows |
| 5b2f84b | feat(261101-mvx): skill rows with minus/plus steppers and inline save states |
| b94f7e7 | feat(261101-mvx): Finanças tiles and Kit de Aventureiro card; thin tab composition |

## Design behavior decisions (owner rule: look from the mock, behavior from the app)

All ten decisions of the plan were applied as written. No new design-vs-behavior decision was needed during execution.

| # | Mock shows | Decision | Why |
|---|-----------|----------|-----|
| 1 | "2 + d + b", "Disponíveis 80", "+1 de nível" | Numbers come from the pre-redesign expressions: pool `(level+1)*10`, SKILLS keys only, totals via `calculateSkillTotal`. The caption shows the real level bonus (`getSkillLevelBonus`), not a fixed "+1". Level 7 + mixed fixture = 80 / 30 / 50 | Real numbers only |
| 2 | ±1 steppers only | Typed entry kept: the existing `EditableNumberField` (same section/field paths, `min` default 0) sits in the center of each stepper. ±1 is added around it. The distributed stepper reuses today's quick-add payload (`Math.max(0, ...)`). The bonus stepper is a UI convenience over an existing field and floors at 0 like the typed input. Old +1/+2/+3 buttons are replaced by ±1 plus typed entry | No capability lost |
| 3 | Rows expand only when unlocked | Rows expand in both modes. Locked shows a read-only breakdown (values + "Base 1 · Nível +N"); unlocked adds the steppers | Old "Distribuição" section could be opened in view mode |
| 4 | Short label "Arcano" | Labels stay `SKILL_LABELS` (full text). Group membership and order follow the mock; inside a group the SKILLS order is kept | Labels are app data |
| 5 | n/a | Filter opens on "Em uso" when at least one skill is in use, else "Todas". The open row stays visible under "Em uso" even when zeroed | Avoids an empty list on a new character and a vanishing row |
| 6 | Kit without restore, custom first | Custom items first (display order only). Standard items keep editable quantities. Restore kept as "Restaurar kit padrão" at the end of the expanded "Itens padrão · N" list (same payload, one tap). The toggle always renders, even at N = 0. Edit-only controls (remove ×, "Adicionar item", restore) are hidden when locked (before: rendered disabled); when unlocked they are disabled only while the tab mutation is pending | Coordinator rule; no capability lost |
| 7 | n/a | Two kinds of write instance, as before. Steppers and kit add/remove/restore use the tab's single `useUpdateCharacter()` and are disabled while it is pending. Typed fields keep `EditableField`'s own internal instance. No new serialization machinery | See write-path note below |
| 8 | n/a | The skills-overview button was **kept**: `types.ts` still has `setIsSkillsModalOpen` and `character-layout.tsx` still passes it (mapped to the `pericias` sheet by mvv). It is a ghost `size-11` icon Button, `aria-label="Ver perícias"`, Perícias card action, rendered only when the callback is defined | mvv did not remove the callback |
| 9 | "Jóias", pt-BR thousands | Label is "Joias"; persisted key `joias` unchanged. Values show raw because `EditableNumberField`'s formatter is fixed | components/ui is frozen |
| 10 | n/a | Kit add/remove/restore failures keep `console.error` and add a fixed pt-BR `toast.error`, except `isCharacterConflictError` (the hook already toasts) | CLAUDE.md: no new silent catch |

### Write-path note (decision 7)

- Steppers and kit add/remove/restore use the tab's instance (`updateCharacterMutation`); typed fields (stepper center value, Finanças tiles, kit name/quantity) use `EditableField`'s own instance.
- `lib/api/character-concurrency.ts` serializes all instances per character through its module-level `saveQueues`, so writes never run concurrently and the own-version lineage avoids spurious 409s.
- Accepted residual risk, unchanged from today: a stepper tap made while a typed save is still pending builds its payload from props that save has not refreshed yet, and can overwrite the typed value.

## Other items requested in the plan output

- **Saved-timer fallback:** not needed. The `useEffect` that returns to `idle` after `SAVED_FEEDBACK_MS` (same pattern as `editable-field.tsx`) passed lint with no directive.
- **Skills-overview button:** kept (decision 8).
- **Restore behavior kept:** restoring writes `DEFAULT_ADVENTURE_KIT`, whose items have no `isDefault`, so after a restore every item lists as a custom item under "Personalizados · N". This is today's behavior, intentionally not changed.

## Open questions left untouched

- SKILLS key mismatch: `SKILLS` uses `atuação`, `ataqueSupresa`, `concentração`, `percepção`, ... while `getDefaultCharacterData()` stores `atuacao`, `ataqueSurpresa`, `concentracao`, ... Stored keys that are not in SKILLS are neither counted nor shown (the render test for fixture B pins this: `atuacao`/`ataqueSurpresa` points do not count; rows `Atuação`/`Ataque Surpresa` show total 3 = base 1 + level bonus 2).
- Pool question: Disponíveis uses `(level+1)*10` (`calculateTotalSkillPoints`) while `calculateLevelUpSkillPoints` uses `level*10`. Not touched.

## Verification results

- `npx tsc --noEmit`: clean.
- `bun run lint`: `0 errors, 1 warning` (the pre-existing `routes` warning in `app/api/[[...route]]/route.ts`).
- `bun test`: `332 pass, 0 fail, 15126 expect() calls, Ran 332 tests across 14 files` (baseline after mvw was 300; +22 in `skills-kit-model.test.ts`, +10 in `skills-kit-tab.render.test.ts`).
- `bun run build` (after `rm -rf .next`): passes.
- Scoped diff gate against the recorded base (`8f0ff27`): `lib`, `prisma`, `package.json`, `bun.lock`, `components/ui`, `components/forms`, `quick-actions-bar.tsx`, `types.ts`, `index.ts`, the other tabs and their folders are unchanged. No `dangerouslySetInnerHTML` in the new folder or the tab.
- Parity proof: summary vs a verbatim copy of the old resume over 9 levels x 3 fixtures (+ null/undefined skills); every SKILLS total vs the old row expression; `buildSkillStepUpdate` vs the old `handleQuickAdd` for +1/+2/+3/-1 on existing/missing/null keys, preserving extra keys and not mutating input; kit add/remove/reset vs the old expressions; `SKILL_GROUPS` covers the 36 keys once, in SKILLS order within each group.
- Not done: the human walkthrough from Task 3's `<human-check>` (`bun dev`, real saves, offline retry, dark mode, remove-a-non-last-custom-item check). No browser runtime check was run. It should be done at the end of the batch.

### Line counts (limit 300 per new non-test file, 120 for the tab)

| File | Lines |
| --- | --- |
| components/character/skills-kit/skills-kit-model.ts | 209 |
| components/character/skills-kit/skills-card.tsx | 151 |
| components/character/skills-kit/skill-row.tsx | 87 |
| components/character/skills-kit/skill-stepper.tsx | 129 |
| components/character/skills-kit/finances-card.tsx | 52 |
| components/character/skills-kit/adventure-kit-card.tsx | 184 |
| components/character/skills-kit-tab.tsx | 36 |

## Deviations from Plan

1. **[Rule 1 - Bug in plan test] "disabled" assertion.** The plan's check that a button is not disabled cannot use a substring match: the shadcn Button class list always contains `disabled:`. The render test checks the `disabled=""` attribute on the button tag instead.
2. **Parity source.** The plan's line references point at the base `skills-kit-tab.tsx`. The working copy was unchanged by mvt/mvv/mvw (`git diff` against the base was empty for that file and for `lib/constants`), so the legacy transcriptions were copied from the code as it stood, with no difference between the two.
3. **Test typing fix folded into a later commit.** The model test commit (0df7a25) landed with two tsc errors in the test file (kit fixture typing, one `toEqual` cast); they were fixed before the next commit (75db032), so the committed history is green from that point on.

Otherwise: plan executed as written.

## Threat Flags

None. No new endpoints, auth paths or schema changes. All writes go through `useUpdateCharacter` and the existing `updateCharacterSchema`; names render as React text only; toasts use fixed pt-BR text; `console.error` logs only the error object; no packages were installed.

## Known Stubs

None.

## Stale lines in .claude/CLAUDE.md (not edited)

- "Large files ... `components/character/skills-kit-tab.tsx` (466 lines)": the tab is now 36 lines, split into `components/character/skills-kit/*`.
- Architecture "Duplicated persistence hook instances per tab" and the card-level layer description (`skills-kit-tab.tsx` as a single file for kit and skills): the tab now has one `useUpdateCharacter()` shared by `SkillsCard` and `AdventureKitCard`; `FinancesCard` and the typed fields use `EditableField`'s own instance.
- Testing list: new files `components/character/skills-kit/skills-kit-model.test.ts` and `components/character/skills-kit-tab.render.test.ts`.
- `setIsSkillsModalOpen` still lives in `CharacterTabProps` and is read by the Perícias tab as the opener of the `pericias` sheet.

## Self-Check: PASSED

- Files exist: all eight created files and the modified tab (checked via the line-count and test runs above).
- Commits exist on the branch: 4f86793, 0df7a25, 75db032, 5b2f84b, b94f7e7 (`git rev-list --count 8f0ff27..HEAD` = 5).
