---
phase: quick-261101-iif
verified: 2026-11-01T00:00:00Z
status: passed
score: 7/7 must-haves verified
covered_files:
  - ".planning/quick/261101-iif-unify-game-formulas-calc-01-lib-calculations-index-ts-is-the/261101-iif-PLAN.md"
  - ".planning/quick/261101-iif-unify-game-formulas-calc-01-lib-calculations-index-ts-is-the/261101-iif-SUMMARY.md"
  - "components/character/attributes-modal.tsx"
  - "components/character/basic-info-tab.tsx"
  - "components/character/quick-actions-bar.tsx"
  - "components/character/skills-kit-tab.tsx"
  - "components/character/skills-modal.tsx"
  - "components/ui/editable-field.tsx"
  - "lib/api/queries.ts"
  - "lib/calculations/index.ts"
  - "lib/constants/character.ts"
  - "lib/store/character.ts"
covered_digest: "v4:sha256:83ad6cda42e7676e26a753c04913d31c250ba21bbaeec47cb9aa51328fdb05ba"
behavior_unverified: 0
overrides_applied: 0
---

# Quick 261101-iif: Unify game formulas (CALC-01) Verification Report

**Goal:** `lib/calculations/index.ts` is the single home of game formulas. The duplicates in `lib/constants/character.ts`, the two client hooks and the components are removed or delegated. All displayed and returned numbers stay identical to 832fa9b.
**Verified:** 2026-11-01
**Status:** passed
**Re-verification:** No, initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Sheet numbers (attribute totals and bonus, vitality, Berkana, skill totals and bonus, XP to next, skill-point pools) are the same for levels 0-99 | VERIFIED | My own throwaway parity script ran 10,618 checks over levels 0-99 against `git show 832fa9b:` copies and printed PARITY OK. It covered levels 0, 4, 5, 9, 10 and 99. Each sheet expression was recomputed from the old constants helpers and compared to the new helpers fed through `toX`. |
| 2 | Every HEAD `lib/calculations` export and both hooks' outputs return HEAD values, with NaN and throw parity | VERIFIED | Every old export name is still a function in the current module. Each old export was compared by SameValueZero, with throw parity, over the grids. This includes `validateSkillDistribution` messages, `processLevelUp`, `canLevelUp`, and the `initializeSkills` and `getDefaultSkills` defaults. Both real hooks (`useCalculateDerivedStats` and `useCalculatedStats`) ran through a stub React dispatcher, for 4 character shapes at levels 0-99 and Berkana bonus 0 and 15. The shapes were numeric, partial (NaN), all-null, and a null skill entry (throw). They matched verbatim HEAD bodies. A mutation of the oracle (+1 on remaining) was caught, so the hook comparison is live. |
| 3 | All derived numbers come from `lib/calculations`, with no formula arithmetic left in constants, queries, store or components | VERIFIED | The plan's inline-formula regex scan across `app components lib providers` (excluding `lib/calculations` and generated code) returned no lines. The legacy-helper-name scan returned no lines. I read the full diff `02c311b..0f759b0` and every replaced expression maps to an import from `@/lib/calculations`. |
| 4 | `lib/constants/character.ts` exports only data and no functions | VERIFIED | Runtime check of the module found 0 function exports. The exports are ATTRIBUTES, ATTRIBUTE_LABELS, DEFAULT_ADVENTURE_KIT, SKILLS, SKILL_LABELS, STANDARD_LANGUAGES, VITALITY_LABELS and VITALITY_LEVELS. |
| 5 | Hooks keep their return shape, delegate to `lib/calculations`, and normalize only where HEAD had `\|\| 0` (PD-03) | VERIFIED | `useCalculateDerivedStats` passes attributes, vitality and skills un-normalized. Only `used` goes through `toSkillValue`. NaN for partial entries and the throw on a null entry are preserved (parity-checked). `useCalculatedStats` normalizes everything, as HEAD did. |
| 6 | Both skill-point pools are preserved under their own names (PD-01) | VERIFIED | `calculateTotalSkillPoints` = (level+1)*10 feeds `skills-kit-tab`. `calculateLevelUpSkillPoints` = level*10 feeds `calculateAvailableSkillPoints`, `validateSkillDistribution` and both hooks. The tab's remaining value matched HEAD over the `SKILLS` keys only. |
| 7 | `npx tsc --noEmit` and `bun run build` pass | VERIFIED | I ran both myself. tsc exit 0, build exit 0. |

**Score:** 7/7 truths verified (0 present but behavior-unverified).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/calculations/index.ts` | The 18 listed exports | VERIFIED | All 10 new helpers exist with the planned formulas and Portuguese JSDoc. The module has no imports. Existing exports are re-expressed with the same operand order. |
| `lib/constants/character.ts` | Data only | VERIFIED | The six helpers and the banner are deleted. The lists and labels are untouched. |

### Key Link Verification

| From | To | Status | Details |
|------|----|--------|---------|
| `quick-actions-bar.tsx` | `@/lib/calculations` | WIRED | Imports `calculateVitalityLevels`, `calculateMaxBerkana`, `getBaseBerkana`, `toVitalityBase` and uses them. |
| `basic-info-tab.tsx` | `@/lib/calculations` | WIRED | Used for vitality (4 sites), XP, attribute totals and bonus, and Berkana. |
| `skills-kit-tab.tsx` | `@/lib/calculations` | WIRED | Skill totals and bonus. The pool is built over `SKILLS` keys only, via `toSkillValue`. The raw `skill` local is kept for the persisted payload. |
| `skills-modal.tsx`, `attributes-modal.tsx`, `editable-field.tsx` | `@/lib/calculations` | WIRED | Replaced expressions confirmed in the diff. PD-02 is kept: race+class+bonus without the level bonus. The dead local is removed. |
| `lib/api/queries.ts` | `@/lib/calculations` | WIRED | `useCalculateDerivedStats` delegates. |
| `lib/store/character.ts` | `@/lib/calculations` | WIRED | `useCalculatedStats` delegates. |

### Data-Flow Trace (Level 4)

Pure calculation refactor. Inputs still come from the character props, store and API as before. No new data sources, static returns or hollow props were introduced. FLOWING.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full parity vs 832fa9b | `bun .../scratchpad/mine/check.ts` | `PARITY OK 10618 checks` | PASS |
| Oracle sensitivity | Mutated hook oracle | FAIL, as expected | PASS |
| Constants have no functions | `bun -e` import check | 0 functions | PASS |
| Inline-formula scan | Plan's grep, repo-wide | No lines | PASS |
| Legacy helper name scan | Plan's grep, repo-wide | No lines | PASS |
| Type check | `npx tsc --noEmit` | Exit 0 | PASS |
| Build | `bun run build` | Exit 0 | PASS |

The throwaway verifier script is at `/tmp/claude-1000/-home-zephyr-repos-personal-rpg-character-sheet/602cedf7-8d72-4b0f-96a4-40bf7328c588/scratchpad/mine/check.ts`. It sits outside the repo.

### Probe Execution

None declared. The parity oracle is covered above.

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|-------------|-------------|--------|----------|
| CALC-01 | 261101-iif-PLAN | SATISFIED | Truths 1-4 above. |

### Anti-Patterns Found

None. There are no TBD, FIXME or XXX markers in the touched files. The diff adds no `any`, `@ts-ignore` or `console.log`. No test files were added. `prisma/` is untouched. Nothing is uncommitted apart from `.planning` bookkeeping.

### Deferred human verification

The plan's `<human-check>` manual browser checks are deferred to the owner's single end-of-batch walkthrough, per the batch status policy. They do not affect status. Suggested checks for that walkthrough:

1. Compare the basic-info tab, quick-actions bar, skills tab, and the skills and attributes modals at levels 0, 5 and 10. The numbers should match pre-change behavior. This covers attribute totals with the "+N (nível)" line, vitality stages and totals, Berkana max, XP to next, and the skill-point header showing "Disponíveis", used and remaining.
2. Click "restoreFullHealth" and apply damage. Persisted `currentVitality` should have the same six keys and values.

### Open questions for the owner (product decisions, not gaps)

The SUMMARY records these, and I confirmed they match the code.

1. The attributes modal omits the attribute level bonus (PD-02).
2. `SKILLS` keys differ from the `lib/defaults` / `getDefaultSkills` keys (`atuação` and `atuacao`, `ataqueSupresa` and `ataqueSurpresa`).
3. Two skill-point pools coexist: (level+1)*10 on the tab, level*10 in lib and hooks (PD-01).
4. `useCalculateDerivedStats` returns NaN or throws on partial or null entries (HEAD behavior, kept). `useCalculatedStats` normalizes them.

### Gaps Summary

No gaps. Every automatically verifiable must-have holds.

---

_Verified: 2026-11-01_
_Verifier: Claude (gsd-verifier)_
