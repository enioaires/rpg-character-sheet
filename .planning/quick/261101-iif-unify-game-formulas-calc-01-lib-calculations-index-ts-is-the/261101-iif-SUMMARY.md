---
phase: quick-261101-iif
plan: 01
subsystem: calculations
tags: [calc-01, refactor, lib-calculations, parity-oracle]
requires: [261101-iie]
provides: [single-source game formulas in lib/calculations/index.ts]
affects: [components/character/*, components/ui/editable-field.tsx, lib/api/queries.ts, lib/store/character.ts, lib/constants/character.ts]
key-files:
  modified:
    - lib/calculations/index.ts
    - lib/constants/character.ts
    - lib/api/queries.ts
    - lib/store/character.ts
    - components/character/quick-actions-bar.tsx
    - components/character/basic-info-tab.tsx
    - components/character/skills-kit-tab.tsx
    - components/character/skills-modal.tsx
    - components/character/attributes-modal.tsx
    - components/ui/editable-field.tsx
status: complete
requirements: [CALC-01]
commits: 3
plan_head_before: 02c311b2bd0821adaad36d7c3eed0b44d38a8046
plan_head_after: 0f759b0e50d7534745c3851256ec865dea4bb47d
actuals:
  tasks: 3
  commits: 3
---

# Phase quick-261101-iif Plan 01: Unify game formulas (CALC-01) Summary

`lib/calculations/index.ts` is now the only place game formulas live: 10 new helpers were added, the six constants helpers and the two client hooks' inline arithmetic were removed or delegated, and every component imports from `@/lib/calculations`. A parity oracle against verbatim 832fa9b copies confirmed all numbers are unchanged for levels 0-99.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 (tracer) | deef8a9 | Parity oracle, 10 new lib/calculations exports, quick-actions-bar wired |
| 2 | 63fa9e7 | basic-info-tab, skills-kit-tab, skills-modal, attributes-modal, EditableAttributeField routed through lib/calculations |
| 3 | 0f759b0 | useCalculateDerivedStats and useCalculatedStats delegate; constants module has no functions |

## Planner decisions and consequences

- **PD-01 (two skill-point pools, both preserved).** The skills tab keeps (level + 1) x 10 via `calculateTotalSkillPoints` (counts level 0). `calculateAvailableSkillPoints`, `validateSkillDistribution` (pool and the number in its "excede o disponível" message) and `skillPoints.available` of both hooks keep level x 10 via `calculateLevelUpSkillPoints`. `calculateRemainingSkillPoints(skills, totalPoints)` takes the pool explicitly. No value changed. The pools are not reconciled.
- **PD-02 (attributes modal).** The modal still shows race + class + bonus without the attribute level bonus, now via `calculateAttributeBase(toAttributeValue(attr))`. The dead level-bonus local and its legacy import were deleted. Not "fixed".
- **PD-03 (input normalization).** `toAttributeValue`, `toSkillValue`, `toVitalityBase` apply the `|| 0` rule (undefined, null, NaN, 0, '' and false fields become 0; nullish or non-object raw becomes all zeros). Applied exactly where HEAD had `|| 0`:
  - components: basic-info-tab (attribute totals, vitality), skills-kit-tab (skill totals, used/remaining over SKILLS keys), skills-modal, attributes-modal, quick-actions-bar (vitality)
  - `useCalculatedStats`: attributes, vitality, skills all normalized (HEAD did `?.field || 0` everywhere)
  - `useCalculateDerivedStats`: only the `used` sum goes through `toSkillValue` (HEAD's `skill?.distributed || 0`). Attribute totals, vitality and skill totals stay un-normalized so partial entries still give NaN and a null skill entry still throws.
  - `EditableAttributeField` is not normalized (its data is already numeric).

## The 10 new lib/calculations exports (261101-iig must cover each)

| # | Export | HEAD counterpart | Samples (all HEAD values) |
|---|--------|------------------|---------------------------|
| 1 | `getAttributeLevelBonus(level)` | constants `calculateAttributeBonus` | 0->0, 4->0, 5->1, 9->1, 10->2, 99->19 |
| 2 | `calculateAttributeBase(attribute)` | attributes-modal sum | {race:10,class:12,bonus:2} -> 24 |
| 3 | `getSkillLevelBonus(level)` | constants `calculateSkillBonus` | 0->0, 4->0, 5->1, 10->2 |
| 4 | `getBaseBerkana()` | literal 100 in `calculateBerkana` / `processLevelUp` | () -> 100 |
| 5 | `calculateTotalSkillPoints(level)` | constants `calculateSkillPointsAvailable` (sheet pool) | 0->10, 1->20, 5->60 |
| 6 | `calculateLevelUpSkillPoints(level)` | level x 10 pool of lib + hooks | 0->0, 1->10, 5->50 |
| 7 | `calculateRemainingSkillPoints(skills, totalPoints)` | skills-tab / hooks remaining, unclamped | used 5: pool 10 -> 5, 20 -> 15; used 25, pool 10 -> -15 |
| 8 | `toAttributeValue(raw)` | `obj \|\| zeros` then `field \|\| 0` | undefined -> zeros; {race:null,class:5} -> {0,5,0}; NaN field -> 0 |
| 9 | `toSkillValue(raw)` | same | {distributed:3} -> {3,0} |
| 10 | `toVitalityBase(raw)` | same | {race:60} -> {60,0} |

No existing export changed value or signature. `calculateAvailableSkillPoints` and `validateSkillDistribution` still use the level x 10 pool through `calculateLevelUpSkillPoints`. `calculateAttributeTotal`, `calculateSkillTotal`, `calculateAvailableSkillPoints`, `validateSkillDistribution` and `processLevelUp` are re-expressed on top of the helpers. `lib/calculations/index.ts` stays import-free.

## Hook call-site grep (Task 3)

`useCalculateDerivedStats` and `useCalculatedStats` have no call sites outside their own definitions (`lib/api/queries.ts:131`, `lib/store/character.ts:100`). Both hooks were still present after 261101-iie.

## Open questions for the owner (not acted on)

1. The attributes modal omits the attribute level bonus (race + class + bonus only), unlike the basic-info tab. Intended?
2. `SKILLS` keys (accented/variant, e.g. `atuação`, `ataqueSupresa`) differ from `lib/defaults` / `getDefaultSkills` keys (`atuacao`, `ataqueSurpresa`).
3. Two skill-point pools coexist: the skills tab shows (level + 1) x 10 (counts level 0), while `calculateAvailableSkillPoints`, `validateSkillDistribution` and both hooks use level x 10. Which is the game rule?
4. `useCalculateDerivedStats` returns NaN for partial attribute, vitality or skill entries and throws on a null skill entry (HEAD behavior, kept), while `useCalculatedStats` normalizes them to 0.

`skillPoints.used` scope (unchanged from HEAD): the skills tab sums SKILLS keys only; both hooks sum every stored key, including lib/defaults' unaccented keys such as `atuacao` and `ataqueSurpresa`. A hook's `used` can therefore differ from the tab's.

## Files skipped because 261101-iie removed the target

None. `EditableAttributeField`, both hooks and all components were still present.

## Parity oracle

Lives outside the repo at `/tmp/claude-1000/-home-zephyr-repos-personal-rpg-character-sheet/602cedf7-8d72-4b0f-96a4-40bf7328c588/scratchpad/261101-iif-parity/` (`parity.ts` plus verbatim `git show 832fa9b:` copies `legacy-calculations.ts`, `legacy-constants.ts`). Never committed.

- Task 1 Step 1 (before editing lib/calculations): exit 1, "PARITY FAIL: 10 mismatches (10 unique), 7202 checks". Every mismatch was `missing export (new)` for exactly: getAttributeLevelBonus, getSkillLevelBonus, calculateTotalSkillPoints, calculateLevelUpSkillPoints, getBaseBerkana, toVitalityBase, toAttributeValue, calculateAttributeBase, toSkillValue, calculateRemainingSkillPoints. All HEAD-export, constants and hook checks already passed.
- After Task 1, after Task 2 and after Task 3: `PARITY OK 13229 checks` each time. Covers every HEAD lib/calculations export, both pools, `validateSkillDistribution` messages, component expressions, and the full outputs of both real hooks (run through a stub React dispatcher) including NaN and throw parity. No hook was skipped.

## Gates

- `npx tsc --noEmit`: pass after every task.
- `bun run build`: pass (existing Prisma runtime bundling warnings only).
- Inline-formula scan outside `lib/calculations/`: no lines (baseline 52). No file references a legacy helper name. `lib/constants/character.ts` exports no functions (baseline 6).
- `prisma/` untouched.

## Deviations from Plan

None - plan executed exactly as written. Scope note for Task 2: the single task edited 5 component files (within the per-task limit); no file needed rework (tsc was clean after each file).

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- Commits deef8a9, 63fa9e7, 0f759b0 exist on chore/quality-v1.1.
- All 10 modified files exist and are committed; `lib/calculations/index.ts` exports all 10 new names (oracle sample checks pass).
