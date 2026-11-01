---
phase: quick-261101-iig
plan: 01
subsystem: testing
tags: [bun-test, lib/calculations, CALC-02, golden-values]
requires: ["261101-iie", "261101-iif"]
provides: ["bun test suite for all 26 lib/calculations exports", "test script", "@types/bun 1.3.14"]
affects: [package.json, bun.lock, lib/calculations/index.test.ts, .planning/codebase/TESTING.md]
key-files:
  created: [lib/calculations/index.test.ts]
  modified: [package.json, bun.lock, .planning/codebase/TESTING.md]
requirements: [CALC-02]
status: complete
commits: 3
plan_head_before: 0f759b0e50d7534745c3851256ec865dea4bb47d
plan_head_after: 8ab3d0eba8f57aa2cfb1112cdedc1474eff91202
---

# Phase quick-261101-iig Plan 01: Bun unit tests for lib/calculations Summary

Bun test suite (77 tests, 155 assertions) pinning all 26 runtime exports of `lib/calculations` to literal golden values from HEAD 832fa9b (and iif spec values for the toX helpers), plus an in-suite export-coverage guard.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1 (tracer) | c64bbcb | package.json, bun.lock, lib/calculations/index.test.ts |
| 2 | 8f1366e | lib/calculations/index.test.ts |
| 3 | 8ab3d0e | .planning/codebase/TESTING.md |

## Verification

- Closed-list check output: `ok: 26 exports match the closed list` (no extra or missing names after iie and iif).
- `bun test` and `bun run test`: 77 pass, 0 fail. Describe-coverage gate: `ok: 26 exports com describe`.
- `npx tsc --noEmit`: exit 0. `bun run build`: exit 0.
- bun.lock diff adds only `@types/bun` (workspace devDependency + entry) and `bun-types@1.3.14` with the audited sha512 hashes; no lines removed.
- Preconditions: `bun install --frozen-lockfile --dry-run --ignore-scripts` exit 0; registry integrity for both packages matched the audit; bun-types declares no install scripts.

## Golden rows used

- Table A (HEAD 832fa9b): calculateAllAttributes, calculateAllSkills, calculateAttributeTotal, calculateAvailableSkillPoints, calculateMaxBerkana, calculateSkillTotal, calculateUsedSkillPoints, calculateVitalityLevels, canLevelUp, getDefaultSkills, getSkillPointsPerLevel, getTotalXPForLevel, getXPRequiredForNextLevel, initializeSkills, processLevelUp, validateSkillDistribution.
- Table B (HEAD): getAttributeLevelBonus, calculateAttributeBase, getSkillLevelBonus, getBaseBerkana, calculateTotalSkillPoints, calculateLevelUpSkillPoints, calculateRemainingSkillPoints.
- Table B (spec): toAttributeValue, toSkillValue, toVitalityBase (undefined, null, empty object, null-field via `as unknown as Partial<...>`, NaN-field).

## Deviations from Plan

None - plan executed exactly as written. No golden value disagreed with the module (no parity or spec mismatch to report); no blocker.

## Decisions

- In Task 1 the namespace import was kept alive with a temporary `void calculations` line, replaced by the real export guard in Task 2.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- lib/calculations/index.test.ts, package.json, bun.lock, .planning/codebase/TESTING.md present; commits c64bbcb, 8f1366e, 8ab3d0e are ancestors of HEAD.
