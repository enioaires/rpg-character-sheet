---
phase: quick-261101-iig
plan: 01
type: execute
wave: 3                     # advisory only; quick-batch update recomputes it from depends_on + files_modified
depends_on: ["261101-iie", "261101-iif"]
files_modified:
  - package.json
  - bun.lock
  - lib/calculations/index.test.ts
  - .planning/codebase/TESTING.md
autonomous: true
requirements: [CALC-02]

must_haves:
  truths:
    - "`bun test` at the repo root discovers lib/calculations/index.test.ts and reports 0 failures (baseline at HEAD 832fa9b: exit 1, '0 test files matching')"
    - "`bun run test` runs the same suite through the new package.json script \"test\": \"bun test\""
    - "The runtime function exports of `@/lib/calculations` are exactly the 26 names in the closed export list (<golden_values> C: the 16 HEAD exports, none removed by 261101-iie, plus 261101-iif's 10 new ones). Each has a describe block named exactly after it, and an in-suite guard fails if the export list and TESTED_FUNCTIONS differ"
    - "Every expected value is a literal: either a HEAD 832fa9b output (<golden_values> table A, and table B rows marked HEAD) or a value fixed by 261101-iif's stated spec (table B rows marked spec, used only for the toX normalization helpers' nullish, null-field and NaN cases). The literals cover level 0, the 4→5 and 9→10 level boundaries, all six vitality stages, max Berkana, skill totals, skill-point availability and validateSkillDistribution's exact pt-BR error messages. No expectation or pool argument is computed by calling the module under test"
    - "Both HEAD skill-point pools are pinned under their post-iif names: calculateTotalSkillPoints is (level + 1) × 10, the skills-tab total, and calculateLevelUpSkillPoints is level × 10. calculateAvailableSkillPoints and validateSkillDistribution (pool and messages) keep their HEAD level × 10 values"
    - "`npx tsc --noEmit` and `bun run build` still pass with the test file inside tsconfig's `**/*.ts` include, because Bun's test types come from the exact-pinned devDependency @types/bun 1.3.14"
    - "bun.lock gains exactly @types/bun@1.3.14 and bun-types@1.3.14, with registry-matching integrity hashes, and no other package entry changes"
  artifacts:
    - path: "lib/calculations/index.test.ts"
      provides: "bun:test unit suite for every exported function in lib/calculations, plus an export-coverage guard"
      contains: "from 'bun:test'"
    - path: "package.json"
      provides: "test script and the Bun test type definitions devDependency"
      contains: "\"test\": \"bun test\""
    - path: "bun.lock"
      provides: "locked @types/bun@1.3.14 and bun-types@1.3.14"
      contains: "bun-types@1.3.14"
    - path: ".planning/codebase/TESTING.md"
      provides: "recorded runner choice, file convention and run commands for future plans (e.g. 261101-iil's formatter test)"
      contains: "bun:test"
  key_links:
    - from: "lib/calculations/index.test.ts"
      to: "lib/calculations/index.ts"
      via: "namespace import used by both the per-function describes and the export-coverage guard"
      pattern: "import \\* as calculations from '@/lib/calculations'"
    - from: "package.json scripts.test"
      to: "Bun built-in test runner"
      via: "bun run test"
      pattern: "\"test\": \"bun test\""
    - from: "tsconfig.json include **/*.ts (also type-checked by next build)"
      to: "bun:test module types"
      via: "@types/bun devDependency auto-loaded from node_modules/@types"
      pattern: "\"@types/bun\": \"1.3.14\""
---

<objective>
Add a Bun unit-test suite (CALC-02) that pins every function exported from `lib/calculations` to fixed literals. That is the 26-name closed list in `<golden_values>` C: the 16 HEAD exports plus 261101-iif's 10. Expected values are the numbers the app produced at HEAD 832fa9b. The only exception is the three input-normalization helpers' nullish, null-field and NaN cases, which use the values iif's spec states. The suite must cover level 0, the level-5 boundaries, the six vitality stages, Berkana, skill totals, both skill-point pools, skill-point availability and validateSkillDistribution's errors. Also add a `"test"` script to package.json.

Purpose: CALC-01 (sibling 261101-iif) moves every game formula into `lib/calculations`, and the milestone rule is "derived numbers must stay identical". This suite guards that rule. Its expected values are the pre-refactor numbers, not values read back from the refactored module, so a formula drift fails the test instead of being absorbed into it.

Output: `lib/calculations/index.test.ts`, a `"test": "bun test"` script, an exact-pinned `@types/bun` devDependency (needed so `npx tsc --noEmit` and `next build` accept the `bun:test` import), and an updated `.planning/codebase/TESTING.md`.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/codebase/TESTING.md
@.planning/codebase/CONVENTIONS.md
@lib/calculations/index.ts
@package.json

Sibling outputs this plan builds on (read the SUMMARY files if present; `ls .planning/quick/261101-iie-*/ .planning/quick/261101-iif-*/` to find them):
- 261101-iie (dead code removal). It removes **no** `lib/calculations` export: its plan forbids editing `lib/calculations/index.ts` (the XP and level-up helpers stay exported for this suite) and its verification requires `git diff HEAD -- lib/calculations` to be empty. Its `bun install` re-syncs `bun.lock`.
- 261101-iif (formula unification). It adds exactly 10 exports (its `<interfaces>` block) and keeps all 16 HEAD exports with unchanged names, signatures and values. The resulting 26 names are the closed list in `<golden_values>` C.

Reference sources for HEAD numbers are read-only and must not be checked out over the working tree: `git show 832fa9b:lib/calculations/index.ts` and `git show 832fa9b:lib/constants/character.ts`.

## Planner findings (verified while planning, 2026-11-01)

- **The import needs types.** Without Bun types, a file importing from `bun:test` fails `npx tsc --noEmit` with TS2307 ("Cannot find module 'bun:test'"). tsconfig includes `**/*.ts`, and `next build` type-checks the same program. With `@types/bun` 1.3.14 next to the repo's `@types/node` 20.x, tsc over all 89 repo source files plus a `bun:test` file exits 0.
- **Version pin.** The latest `@types/bun` (1.4.4, published 2026-10-23) is flagged SUS / too-new by the GSD package-legitimacy check, which uses a 30-day minimum age. Pinned 1.3.14 (2026-05-13) passes with verdict OK, and it matches the local Bun 1.3.x runtime.
- **The baseline lockfile is stale.** HEAD `bun.lock` still locks `next` 15.4.4 while package.json declares `^16.0.7` (the 16.0.7 upgrade in 498bcad only touched package-lock.json). Any `bun add` on that lockfile also re-resolves next, sharp and others.
  - 261101-iie's `bun install` re-syncs it.
  - Once the lockfile is synced, `bun add -d --exact @types/bun@1.3.14` adds exactly 3 lockfile lines (the workspace devDependency, `@types/bun`, `bun-types`) and removes none. `bun-types`' `@types/node: *` dedupes to the existing 20.x.
- **Imports and discovery.** `bun test` resolves the `@/` alias from tsconfig `paths` natively, with no bunfig needed. With `.next/` present, HEAD discovery finds 0 test files, so nothing else gets picked up.
- **Two skill-point pools exist at HEAD, and 261101-iif keeps both (its PD-01).**
  - The skills tab (`components/character/skills-kit-tab.tsx`, via the constants `calculateSkillPointsAvailable`) shows a `(level + 1) * 10` total and an unclamped remaining. After iif this pool is the new export `calculateTotalSkillPoints(level)`.
  - `calculateAvailableSkillPoints` (`max(0, level * 10 - used)`), `validateSkillDistribution` (its pool and the number inside its "excede o disponível" message) and both client hooks use `level * 10`. After iif this pool is the new export `calculateLevelUpSkillPoints(level)`. The two existing exports are re-expressed on top of it, and **none of their values change**.
  - The unclamped remaining becomes `calculateRemainingSkillPoints(skills, totalPoints)`, with the pool passed explicitly.
  - Consequence: every table A row holds exactly as computed at HEAD, including `calculateAvailableSkillPoints` and all `validateSkillDistribution` messages. Table B pins each pool under its own new name. Whichever rule the game "really" intends is an owner question recorded by iif; this suite does not pick one.
- **Null-field fixtures need a cast.** tsconfig has `"strict": true`, so `{ race: null, class: 5 }` is not assignable to `Partial<AttributeValue>` (TS2322, checked during planning). The toX null-field fixtures model stored DB JSON and are written as `as unknown as Partial<AttributeValue>` (or `SkillValue` / `VitalityBase`), never as `any`. The cast passes `npx tsc --noEmit`, and 261101-iim's `@typescript-eslint/no-explicit-any` does not flag it. If iif's final parameter type already admits null fields, drop the cast.

## Package Legitimacy Audit

| Package | Version | Verdict | Evidence | Disposition |
|---------|---------|---------|----------|-------------|
| @types/bun | 1.3.14 (exact) | OK [VERIFIED] | GSD `checkPackages` with version 1.3.14 → OK; published 2026-05-13; ~24.8M weekly downloads; repo github.com/DefinitelyTyped/DefinitelyTyped; maintainer `types` (Microsoft); no install scripts; integrity sha512-h1hFqFVcvAvD9j9K7ZW7vd82aSA+rTdznZa+5bwvCwqSB1jmmfLcbIWhOLx1/+boy/xmjgCs/OMUL8hRJSmnPw== | install, pinned exact |
| bun-types | 1.3.14 (transitive, exact-pinned by @types/bun) | OK [VERIFIED] | GSD `checkPackages` with version 1.3.14 → OK; published 2026-05-13; ~30.1M weekly downloads; repo github.com/oven-sh/bun; maintainers jarred, robobun (Oven); package scripts are dev-only (fmt/test/build/prebuild, no preinstall/install/postinstall); integrity sha512-4N0ig0fEomHt5R0KCFWjovxow98rIoRwKolrYdCcknNwMekCXRnWEUvgu5soYV8QXtVsrUD8B95MBOZGPvr6KQ== | install (transitive) |
| @types/bun | latest (1.4.4) | SUS (too-new) | published 2026-10-23, under the 30-day threshold | rejected; do not use a caret/latest range |

No [ASSUMED]/[SUS]/[SLOP] package is installed, so no blocking human-verify checkpoint is needed. Task 1 re-checks the registry integrity before installing.

<golden_values>
HEAD 832fa9b outputs, computed during planning (and re-checked at revision) by running the HEAD modules (`git show 832fa9b:lib/calculations/index.ts` and `git show 832fa9b:lib/constants/character.ts`) with Bun 1.3.2. These literals are the contract: test expectations use them verbatim.

**A. `lib/calculations` functions as named at HEAD (16 exports; all survive 261101-iie and 261101-iif with unchanged values)**

| Export | Input | Expected |
|--------|-------|----------|
| calculateAttributeTotal | attribute {race:10, class:12, bonus:2}, level 0 / 1 / 4 / 5 / 9 / 10 / 14 / 15 / 99 | 24 / 24 / 24 / 25 / 25 / 26 / 26 / 27 / 43 |
| calculateAllAttributes | {forca:{race:10,class:12,bonus:2}, agilidade:{race:5,class:5,bonus:0}}, level 5 | {forca:25, agilidade:11} |
| calculateAllAttributes | {} , level 5 | {} |
| calculateVitalityLevels | {race:200, class:250}, level 0 | {notavel:450, ferido:430, gravementeFerido:410, condenado:390, incapacitado:370, coma:350} |
| calculateVitalityLevels | {race:200, class:250}, level 4 | {notavel:2250, ferido:2150, gravementeFerido:2050, condenado:1950, incapacitado:1850, coma:1750} |
| calculateVitalityLevels | {race:200, class:250}, level 5 | {notavel:2700, ferido:2580, gravementeFerido:2460, condenado:2340, incapacitado:2220, coma:2100} |
| calculateVitalityLevels | {race:200, class:250}, level 9 | {notavel:4500, ferido:4300, gravementeFerido:4100, condenado:3900, incapacitado:3700, coma:3500} |
| calculateVitalityLevels | {race:200, class:250}, level 10 | {notavel:4950, ferido:4730, gravementeFerido:4510, condenado:4290, incapacitado:4070, coma:3850} |
| calculateVitalityLevels | {race:30, class:20}, level 0 | {notavel:50, ferido:30, gravementeFerido:10, condenado:-10, incapacitado:-30, coma:-50} (no clamping; pinned as-is) |
| calculateMaxBerkana | (level, baseValue, bonus) = (0,100,0) / (4,100,0) / (5,100,0) / (5,100,7) / (9,100,0) / (10,100,0) / (10,120,5) | 100 / 140 / 150 / 157 / 190 / 200 / 225 |
| calculateSkillTotal | skill {distributed:3, bonus:1}, level 0 / 4 / 5 / 9 / 10 | 5 / 5 / 6 / 6 / 7 |
| calculateAllSkills | {acrobacia:{distributed:3,bonus:1}, nadar:{distributed:0,bonus:0}}, level 10 | {acrobacia:7, nadar:3} |
| getSkillPointsPerLevel | () | 10 |
| calculateUsedSkillPoints | {acrobacia:{distributed:3,bonus:0}, nadar:{distributed:2,bonus:5}} | 5 (bonus ignored) |
| calculateUsedSkillPoints | {} | 0 |
| calculateAvailableSkillPoints | same two skills (used 5), level 0 / 1 / 2 | 0 (clamped, not -5) / 5 / 15 (HEAD level × 10 pool; iif keeps it via calculateLevelUpSkillPoints) |
| getXPRequiredForNextLevel | level 0 / 1 / 4 / 98 | 10 / 20 / 50 / 990 |
| getTotalXPForLevel | level 0 / 1 / 2 / 3 / 5 | 0 / 10 / 30 / 60 / 150 |
| canLevelUp | (currentXP, level) = (10,0) / (9,0) / (990,98) / (10000,99) | true / false / true / false |
| validateSkillDistribution | {acrobacia:{distributed:0,bonus:0}, nadar:{distributed:0,bonus:0}}, level 0 | {isValid:true, errors:[]} |
| validateSkillDistribution | {acrobacia:{distributed:1,bonus:0}}, level 0 | {isValid:false, errors:['Total de pontos usado (1) excede o disponível (0)', 'acrobacia: 1 pontos excedem o máximo de 0']} (this order) |
| validateSkillDistribution | {acrobacia:{distributed:3,bonus:0}}, level 1 | {isValid:true, errors:[]} (exactly at the 3-per-level cap) |
| validateSkillDistribution | {acrobacia:{distributed:4,bonus:0}}, level 1 | {isValid:false, errors:['acrobacia: 4 pontos excedem o máximo de 3']} |
| validateSkillDistribution | {acrobacia:{distributed:-1,bonus:0}}, level 1 | {isValid:false, errors:['acrobacia: pontos distribuídos não podem ser negativos']} |
| validateSkillDistribution | {a:{distributed:6,bonus:0}, b:{distributed:6,bonus:0}, c:{distributed:6,bonus:0}, d:{distributed:3,bonus:0}}, level 2 | {isValid:false, errors:['Total de pontos usado (21) excede o disponível (20)']} |
| processLevelUp | {level:0, currentXP:15, vitality:{race:200,class:250}, maxBerkana:999, berkanaBonus:5} | {level:1, currentXP:5, maxBerkana:115, vitalityLevels:{notavel:900, ferido:860, gravementeFerido:820, condenado:780, incapacitado:740, coma:700}, xpUsedForLevelUp:10, newSkillPointsAvailable:10} (input maxBerkana ignored; base 100) |
| processLevelUp | level 0 with currentXP 9; and level 99 with currentXP 100000 | throws Error with message 'XP insuficiente para subir de nível' |
| getDefaultSkills | () | exactly this 36-name array, in this order (all unique): ['acrobacia', 'atuacao', 'avaliar', 'ataqueSurpresa', 'blefar', 'concentracao', 'controleArcano', 'controleEmocional', 'combateDesarmado', 'conhecimentoArcano', 'conhecimentoPolitico', 'conhecimentoHistorico', 'conhecimentoReligioso', 'conhecimentoNatureza', 'conhecimentoMilitar', 'cura', 'cavalgar', 'duelo', 'dissuadir', 'diplomacia', 'discernir', 'dissimulacao', 'empatia', 'escalar', 'equilibrio', 'furtar', 'furtividade', 'nadar', 'oficios', 'percepcao', 'prontidao', 'persuadir', 'sobrevivencia', 'suportar', 'salvar', 'velocidade'] |
| initializeSkills | () | 36 keys equal to that same literal array, in that order, and every value {distributed:0, bonus:0} |

**B. The 10 exports 261101-iif adds (exactly the set in its `<interfaces>` block), each pinned to a HEAD anchor or to iif's stated spec**

Provenance:
- **HEAD**: the value the named HEAD 832fa9b code produced when run during planning.
- **spec**: the value fixed by 261101-iif's stated spec (its `<interfaces>` block and PD-03): `{ field: raw?.field || 0 }` per field, with a nullish raw giving all zeros. That spec reproduces the HEAD call-site fallbacks, i.e. `obj || { ...zeros }` followed by `obj.field || 0`, at:
  - attributes: basic-info-tab.tsx:339-341 and attributes-modal.tsx:24-25
  - skills: skills-modal.tsx:24-26 and skills-kit-tab.tsx:69-71
  - vitality: quick-actions-bar.tsx:48-49
  - all three: lib/store/character.ts:256, 264 and 284

  Every spec value was also evaluated during planning, both against those fallback expressions and against a module implementing iif's interfaces verbatim. Spec rows are used only for the three toX helpers. Cases iif lists verbatim as samples are marked (iif sample).

Fixtures used below:
- U5 = {acrobacia:{distributed:3, bonus:0}, nadar:{distributed:2, bonus:5}}, used 5
- U25 = {acrobacia:{distributed:20, bonus:0}, nadar:{distributed:5, bonus:3}}, used 25

| New export | HEAD anchor | Input → Expected | Provenance |
|------------|-------------|------------------|------------|
| getAttributeLevelBonus(level) | constants calculateAttributeBonus (same inline in editable-field, store and query hooks) | level 0→0, 4→0, 5→1, 9→1, 10→2, 99→19 | HEAD |
| calculateAttributeBase(attribute) | attributes-modal.tsx:25 inline race + class + bonus, with no level bonus (iif PD-02); also equals HEAD calculateAttributeTotal at level 0 | {race:10, class:12, bonus:2}→24; {race:0, class:0, bonus:0}→0; {race:-1, class:0, bonus:2}→1 | HEAD |
| getSkillLevelBonus(level) | constants calculateSkillBonus (same inline in store and query hooks) | level 0→0, 4→0, 5→1, 9→1, 10→2, 99→19 | HEAD |
| getBaseBerkana() | the literal 100 in constants calculateBerkana and in processLevelUp; HEAD calculateBerkana(0) = 100 | () → 100 | HEAD |
| calculateTotalSkillPoints(level) | constants calculateSkillPointsAvailable = (level + 1) × 10, the skills-tab "Disponíveis" total (iif PD-01 sheet pool, counts level 0) | level 0→10, 1→20, 4→50, 5→60, 9→100, 10→110 | HEAD |
| calculateLevelUpSkillPoints(level) | level × 10: the pool inside HEAD calculateAvailableSkillPoints and validateSkillDistribution, and both hooks' skillPoints.available (iif PD-01 lib/hook pool, excludes level 0). HEAD calculateAvailableSkillPoints({}, level) returns it | level 0→0, 1→10, 4→40, 5→50, 9→90, 10→100 | HEAD |
| calculateRemainingSkillPoints(skills, totalPoints) | skills-kit-tab inline remaining (level + 1) × 10 − used, and the hooks' level × 10 − used; never clamped. The pool is passed as a literal number | (U5, 10)→5; (U5, 20)→15; (U5, 0)→−5 (unclamped; calculateAvailableSkillPoints clamps the same case to 0); (U25, 10)→−15; ({}, 10)→10 | HEAD |
| toAttributeValue(raw) | attribute call-site fallback (see Provenance) | {race:2, class:1, bonus:4}→{race:2, class:1, bonus:4}; {race:-1, class:0, bonus:2}→{race:-1, class:0, bonus:2} (−1 is truthy, kept); undefined→{race:0, class:0, bonus:0} (iif sample); null→{race:0, class:0, bonus:0}; {}→{race:0, class:0, bonus:0}; {race:null, class:5}→{race:0, class:5, bonus:0} (iif sample); {race:NaN, class:3, bonus:1}→{race:0, class:3, bonus:1} (NaN field → 0, iif sample) | spec |
| toSkillValue(raw) | skill call-site fallback (see Provenance) | {distributed:2, bonus:1}→{distributed:2, bonus:1}; undefined→{distributed:0, bonus:0}; null→{distributed:0, bonus:0}; {}→{distributed:0, bonus:0}; {distributed:3}→{distributed:3, bonus:0} (iif sample); {distributed:null, bonus:4}→{distributed:0, bonus:4}; {distributed:NaN, bonus:2}→{distributed:0, bonus:2} | spec |
| toVitalityBase(raw) | vitality call-site fallback (see Provenance) | {race:20, class:30}→{race:20, class:30}; undefined→{race:0, class:0}; null→{race:0, class:0}; {}→{race:0, class:0}; {race:60}→{race:60, class:0} (iif sample); {race:null, class:45}→{race:0, class:45}; {race:NaN, class:10}→{race:0, class:10} | spec |

HEAD constants helpers that 261101-iif deletes and replaces with an *existing* export need no describe of their own, because they are not `lib/calculations` exports. Their numbers are already pinned in table A:
- calculateBerkana(level, bonus) → calculateMaxBerkana(level, 100, bonus): (0,100,0)→100, (5,100,0)→150 and (5,100,7)→157 equal HEAD calculateBerkana(0), (5) and (5, 7).
- calculateVitality(race, class, level) → calculateVitalityLevels: the level-5 and level-10 rows equal HEAD calculateVitality(200, 250, 5) and (200, 250, 10).
- calculateXPForNextLevel → getXPRequiredForNextLevel: 0→10, 1→20, 4→50, 98→990.

**C. Closed export list after 261101-iie and 261101-iif (26 runtime function exports)**

This is HEAD's 16 exports, minus nothing (261101-iie does not touch lib/calculations), plus iif's 10. TESTED_FUNCTIONS is exactly this list, and each name gets one describe whose rows are listed here.

| # | Export | Origin | Golden rows |
|---|--------|--------|-------------|
| 1 | calculateAllAttributes | HEAD | A |
| 2 | calculateAllSkills | HEAD | A |
| 3 | calculateAttributeBase | iif | B (HEAD) |
| 4 | calculateAttributeTotal | HEAD | A |
| 5 | calculateAvailableSkillPoints | HEAD | A |
| 6 | calculateLevelUpSkillPoints | iif | B (HEAD) |
| 7 | calculateMaxBerkana | HEAD | A |
| 8 | calculateRemainingSkillPoints | iif | B (HEAD) |
| 9 | calculateSkillTotal | HEAD | A |
| 10 | calculateTotalSkillPoints | iif | B (HEAD) |
| 11 | calculateUsedSkillPoints | HEAD | A |
| 12 | calculateVitalityLevels | HEAD | A |
| 13 | canLevelUp | HEAD | A |
| 14 | getAttributeLevelBonus | iif | B (HEAD) |
| 15 | getBaseBerkana | iif | B (HEAD) |
| 16 | getDefaultSkills | HEAD | A |
| 17 | getSkillLevelBonus | iif | B (HEAD) |
| 18 | getSkillPointsPerLevel | HEAD | A |
| 19 | getTotalXPForLevel | HEAD | A |
| 20 | getXPRequiredForNextLevel | HEAD | A |
| 21 | initializeSkills | HEAD | A |
| 22 | processLevelUp | HEAD | A |
| 23 | toAttributeValue | iif | B (spec) |
| 24 | toSkillValue | iif | B (spec) |
| 25 | toVitalityBase | iif | B (spec) |
| 26 | validateSkillDistribution | HEAD | A |

The interfaces AttributeValue, VitalityBase, VitalityLevels and SkillValue are type-only exports. They do not exist at runtime and are not in this list.
</golden_values>

## Decisions (planner discretion, no CONTEXT.md for quick items)

- **File location:** co-located `lib/calculations/index.test.ts`, as TESTING.md recommends. Use Bun's built-in runner (`bun:test`), with no Jest/Vitest dependency.
- **Bun types:** `@types/bun` exact-pinned to 1.3.14 (see audit) instead of excluding test files from tsconfig. Test code stays type-checked by `npx tsc --noEmit` and `next build`.
- **Imports:** `@/lib/calculations`, following the project's alias convention; verified to resolve under `bun test`.
- **Naming:** each `describe` is named exactly after the export (this makes coverage machine-checkable). `it` descriptions are in pt-BR, matching the project's pt-BR comments.
- **Style:** match `lib/calculations/index.ts`: 2-space indent, single quotes, no semicolons.
</context>

<tasks>

<task type="tracer">
  <name>Task 1: End-to-end "bun test runs a typed calculations test": pinned Bun types, test script, first describe</name>
  <precondition>bun.lock is in sync with package.json before installing: `bun install --frozen-lockfile --dry-run --ignore-scripts` exits 0 (read-only; at base 832fa9b it exits 1 because next 15.4.4 is locked against ^16.0.7, and 261101-iie's bun install re-syncs it), and the npm registry is reachable: `npm view @types/bun@1.3.14 dist.integrity` prints the sha512 listed in the Package Legitimacy Audit</precondition>
  <files>package.json, bun.lock, lib/calculations/index.test.ts</files>
  <action>
Wire the thinnest complete path: a pinned Bun types package, a package.json test script, and one real describe block. Prove that `bun test`, `bun run test` and `npx tsc --noEmit` all accept a `bun:test` file in this repo.

1. Supply-chain re-check (read-only, T-iig-SC):
   - Run `npm view @types/bun@1.3.14 dist.integrity` and `npm view bun-types@1.3.14 dist.integrity scripts`.
   - Both integrity strings must equal the Package Legitimacy Audit table. bun-types must declare no preinstall, install or postinstall script.
   - On any mismatch, stop and report. Do not install.
2. Install with Bun only: `bun add -d --exact @types/bun@1.3.14`.
   - Use the exact pin with no caret. The 1.4.x line is under the 30-day legitimacy threshold.
   - Do not run npm install or edit package-lock.json. The project is Bun-only, and 261101-iim owns that file's removal.
   - `bun add` runs the existing postinstall (prisma generate), which is expected.
3. Lockfile check, before committing:
   - The `git diff -U0 bun.lock` must add only lines mentioning @types/bun or bun-types and remove no package entry lines.
   - If anything else changed (for example a next/sharp re-resolution, which means the precondition was not really met), stop and report. Do not commit a dependency upgrade under this item.
4. Add `"test": "bun test"` to package.json scripts.
   - Keep every existing script and dependency exactly as the sibling items left them.
   - Do not touch lint, which belongs to 261101-iim.
5. Create `lib/calculations/index.test.ts`:
   - Import `describe`, `it` and `expect` from 'bun:test', and do the namespace import `import * as calculations from '@/lib/calculations'` (Task 2's export guard uses it), plus the named import of calculateAttributeTotal.
   - Start the file with a short pt-BR comment saying the expected values are the numbers from commit 832fa9b (see the quick task 261101-iig plan), and that they must never be edited to match a changed formula: a failing value means CALC-01 changed a derived number.
   - Add `describe('calculateAttributeTotal')` with these `<golden_values>` table A cases for attribute {race:10, class:12, bonus:2}:
     - level 0 → 24
     - level 4 → 24 and level 5 → 25 (the level-5 boundary)
     - level 9 → 25 and level 10 → 26
     - level 99 → 43
   - Use exact `toBe` assertions with literal expected numbers.
   - 261101-iif keeps this signature (attribute, level), per its `<interfaces>` block. Never adapt the expected numbers.
  </action>
  <verify>
    <automated>bun test lib/calculations/index.test.ts && bun run test && npx tsc --noEmit && test "$(grep -c '"test": "bun test"' package.json)" -eq 1 && test "$(grep -c '"@types/bun": "1.3.14"' package.json)" -eq 1 && test "$(grep -c 'sha512-h1hFqFVcvAvD9j9K7ZW7vd82aSA+rTdznZa+5bwvCwqSB1jmmfLcbIWhOLx1/+boy/xmjgCs/OMUL8hRJSmnPw==' bun.lock)" -eq 1 && test "$(grep -c 'sha512-4N0ig0fEomHt5R0KCFWjovxow98rIoRwKolrYdCcknNwMekCXRnWEUvgu5soYV8QXtVsrUD8B95MBOZGPvr6KQ==' bun.lock)" -eq 1 && LOCK_DIFF=$(git diff -U0 bun.lock) && test "$(printf '%s\n' "$LOCK_DIFF" | grep -cE '^-[[:space:]]+"')" -eq 0 && test "$(printf '%s\n' "$LOCK_DIFF" | grep -E '^\+[[:space:]]+"' | grep -cvE '"(@types/bun|bun-types)"')" -eq 0</automated>
    <!-- baselines at HEAD 832fa9b: bun test exit 1 ("0 test files"); "test": "bun test" count 0; "@types/bun": "1.3.14" count 0; both sha512 counts 0 in bun.lock. The lockfile-diff gate is captured first so a git failure stops the chain. Validated during planning: exit 0 for an add on a synced lockfile (3 added lines, 0 removed), exit 1 for an add on the stale base lockfile (next/sharp re-resolution). It must run before the task commit (after commit, git diff is empty). -->
  </verify>
  <done>`bun test` and `bun run test` both run lib/calculations/index.test.ts and pass, and `npx tsc --noEmit` exits 0 with the bun:test import. package.json has `"test": "bun test"` and devDependency `"@types/bun": "1.3.14"`. bun.lock adds only @types/bun@1.3.14 and bun-types@1.3.14, with the audited integrity hashes.</done>
</task>

<task type="auto">
  <name>Task 2: Cover all 26 closed-list lib/calculations exports with golden literals and add the export-coverage guard</name>
  <files>lib/calculations/index.test.ts</files>
  <behavior>
    - One describe per export in the closed list (`<golden_values>` C, 26 names), named exactly after it; every assertion uses a literal from `<golden_values>` table A or B
    - Level 0 and the 4→5 / 9→10 boundaries are asserted for every level-dependent function: calculateAttributeTotal, calculateSkillTotal, calculateVitalityLevels, calculateMaxBerkana, getAttributeLevelBonus, getSkillLevelBonus, calculateTotalSkillPoints and calculateLevelUpSkillPoints
    - Both pools are pinned separately: calculateTotalSkillPoints 0→10 / 5→60 and calculateLevelUpSkillPoints 0→0 / 5→50. calculateRemainingSkillPoints(U5, 0) is −5, unclamped, while calculateAvailableSkillPoints(U5, 0) is 0, clamped
    - The toX helpers assert the whole returned object with toEqual for numeric, undefined, null, {}, null-field and NaN-field input (table B spec rows)
    - calculateVitalityLevels asserts all six stage keys (notavel, ferido, gravementeFerido, condenado, incapacitado, coma) with toEqual on the whole object, including the negative-stage case
    - validateSkillDistribution asserts the whole {isValid, errors} object with toEqual, including exact pt-BR messages and error order
    - processLevelUp asserts the whole returned object and both throwing cases ('XP insuficiente para subir de nível')
    - Export guard: the sorted list of runtime function exports equals the sorted TESTED_FUNCTIONS constant, which holds exactly the 26 closed-list names
  </behavior>
  <action>
Expand the tracer file to cover the post-261101-iie/iif export set (CALC-02):

1. Confirm the export set is the closed list in `<golden_values>` C (26 names) before writing tests.
   - Run the closed-list check, which is the first `bun -e` in this task's `<verify>`. At base 832fa9b it exits 1 and reports the 10 iif names as missing.
   - If the check reports any extra or missing name after 261101-iie and 261101-iif have landed, stop and report a blocker naming the difference.
   - Do not add, drop or improvise tests to match a different set. iie must not touch lib/calculations, and iif adds exactly these 10 names, so any difference is an upstream deviation.
2. Write one `describe('<exactExportName>', ...)` per closed-list name, using the rows table C points to.
   - HEAD exports use table A, and iif's 10 use table B. CALC-01 forbids changing any of these numbers.
   - Use exact `toBe` for numbers and booleans, and `toEqual` for objects and arrays.
   - Every expected value is a literal from `<golden_values>`. Never compute an expected value or an input argument by calling a function from the module under test. Concretely:
     - calculateRemainingSkillPoints gets its pool as the table B literal number (10, 20 or 0), never as another export's result.
     - Declare a file-level literal `DEFAULT_SKILL_NAMES` holding the 36 names from table A. The getDefaultSkills describe compares to it with toEqual. The initializeSkills describe compares its keys to it, asserts the literal 36, and asserts that every value toEqual {distributed:0, bonus:0}. Neither describe compares one export's output with the other's.
     - Write the U5, U25 and validateSkillDistribution fixtures as literal objects (not built with initializeSkills), so they stay independent of other exports.
   - Spec-derived rows (the toX helpers, table B "spec"):
     - Put a pt-BR comment above each toX describe saying its values come from the 261101-iif spec (PD-03, the `|| 0` rule), not from a HEAD function.
     - Build the null-field fixtures as stored-JSON values cast with `as unknown as Partial<AttributeValue>` (or `Partial<SkillValue>` / `Partial<VitalityBase>`). Use a type-only import of those interfaces from '@/lib/calculations'. Never use `any` (see Planner findings).
   - For processLevelUp's throwing cases, use `expect(() => ...).toThrow('XP insuficiente para subir de nível')`.
3. Add the export-coverage guard as its own `describe('exports de lib/calculations', ...)`:
   - Declare a `TESTED_FUNCTIONS` constant listing exactly the 26 names of `<golden_values>` C.
   - Assert that the sorted function-valued entries of the `calculations` namespace import equal the sorted TESTED_FUNCTIONS. Filter with typeof value === 'function'; interfaces do not exist at runtime.
   - In a pt-BR comment, explain that adding an export without a test makes this fail.
4. Mismatch protocol. If any assertion fails because the module returns a value other than the golden literal:
   - Do NOT change the expected value. For a HEAD row this is a CALC-01 parity regression introduced upstream. For a spec row, the helper deviates from iif's stated spec.
   - Stop, leave the test unedited, and do not commit a weakened expectation.
   - Report the function, input, golden value (with its provenance, HEAD or spec) and actual value in the SUMMARY as a blocker for 261101-iif.
5. Hygiene:
   - No focused, skipped or todo tests, and no explicit any type anywhere in the file.
   - No console logging.
   - Keep the file style identical to lib/calculations/index.ts.
  </action>
  <verify>
    <automated>bun -e 'import * as c from "./lib/calculations"; const want = ["calculateAllAttributes", "calculateAllSkills", "calculateAttributeBase", "calculateAttributeTotal", "calculateAvailableSkillPoints", "calculateLevelUpSkillPoints", "calculateMaxBerkana", "calculateRemainingSkillPoints", "calculateSkillTotal", "calculateTotalSkillPoints", "calculateUsedSkillPoints", "calculateVitalityLevels", "canLevelUp", "getAttributeLevelBonus", "getBaseBerkana", "getDefaultSkills", "getSkillLevelBonus", "getSkillPointsPerLevel", "getTotalXPForLevel", "getXPRequiredForNextLevel", "initializeSkills", "processLevelUp", "toAttributeValue", "toSkillValue", "toVitalityBase", "validateSkillDistribution"].sort(); const got = Object.entries(c).filter(([, v]) => typeof v === "function").map(([k]) => k).sort(); if (got.join(",") !== want.join(",")) { console.error("export set differs; extra: " + got.filter((k) => !want.includes(k)).join(",") + "; missing: " + want.filter((k) => !got.includes(k)).join(",")); process.exit(1) } console.log("ok: " + got.length + " exports match the closed list")' && bun test && bun -e 'import * as c from "./lib/calculations"; import { readFileSync } from "node:fs"; const src = readFileSync("lib/calculations/index.test.ts", "utf8"); const q = String.fromCharCode(39); const names = Object.entries(c).filter(([, v]) => typeof v === "function").map(([k]) => k); const missing = names.filter((k) => !src.includes("describe(" + q + k + q)); if (missing.length > 0) { console.error("sem describe:", missing.join(", ")); process.exit(1) } console.log("ok: " + names.length + " exports com describe")' && test "$(grep -c 'TESTED_FUNCTIONS' lib/calculations/index.test.ts)" -ge 2 && test "$(grep -c 'DEFAULT_SKILL_NAMES' lib/calculations/index.test.ts)" -ge 3 && ! grep -nE 'toEqual\((calculations\.)?getDefaultSkills\(|calculateRemainingSkillPoints\([^)]*calculate(Total|LevelUp)SkillPoints' lib/calculations/index.test.ts && ! grep -nE '\.(only|skip|todo)\(' lib/calculations/index.test.ts && ! grep -nE '(:|as) any\b' lib/calculations/index.test.ts && ! grep -n 'console\.log' lib/calculations/index.test.ts && npx tsc --noEmit</automated>
    <!-- baselines:
      - Closed-list check (first bun -e): exits 1 at HEAD 832fa9b, reporting "extra: ; missing:" with exactly the 10 iif names. It exits 0 against a module implementing iif's interfaces block verbatim (26 exports). Both validated during planning.
      - Describe-coverage gate: exits 1 at HEAD (test file absent: ENOENT). Against a file covering only calculateAttributeTotal it lists the other exports and exits 1. Validated during planning.
      - DEFAULT_SKILL_NAMES count: 0 at HEAD (file absent). Needs >= 3: the declaration plus the getDefaultSkills and initializeSkills uses.
      - Negative "expectation computed by the module" gate: checked during planning against sample lines. It matches a pool built from another export and a getDefaultSkills()-as-expected comparison, and does not match literal-pool or DEFAULT_SKILL_NAMES lines. It passes trivially while the file is absent, but the bun test and describe gates before it fail first in that case.
      - Also confirm: grep -c 'excede o disponível' lib/calculations/index.test.ts >= 1 and grep -c 'não podem ser negativos' lib/calculations/index.test.ts >= 1 (HEAD baseline 0, file absent). -->
  </verify>
  <done>The runtime export set of lib/calculations equals the 26-name closed list. `bun test` passes with 0 failures. Every closed-list export has a describe block named after it, and the in-suite guard compares the export list to TESTED_FUNCTIONS, which holds exactly those 26 names. All expectations are literals:
- HEAD 832fa9b values for the 16 HEAD exports and 7 of iif's new exports
- 261101-iif spec values for the 3 toX helpers, including nullish, null-field and NaN-field input

They cover level 0, the 4→5 and 9→10 boundaries, all six vitality stages, Berkana, skill totals, both skill-point pools, unclamped remaining, skill-point availability and validateSkillDistribution's exact pt-BR errors. No expectation or pool argument comes from calling the module. The file has no focused/skipped tests, no explicit any and no console logging, and tsc still exits 0.</done>
</task>

<task type="auto">
  <name>Task 3: Record the runner in TESTING.md and run the full gate (tsc, bun test, build)</name>
  <files>.planning/codebase/TESTING.md</files>
  <action>
TESTING.md's "Adding the First Test Suite" section asks for the runner choice to be recorded once the first suite lands. Update `.planning/codebase/TESTING.md` so later plans follow one convention (for example 261101-iil's formatter test).
- Leave the YAML frontmatter and the Mocking / Fixtures / Integration sections untouched.

1. **Test Framework.** Replace the Runner bullets (they currently say no runner exists) with:
   - Runner: Bun's built-in test runner (`bun test`, Bun 1.3.x).
   - Assertion library: `expect` from 'bun:test'.
   - Types: devDependency `@types/bun` exact-pinned to 1.3.14. The pin is required: tsconfig includes `**/*.ts`, so without it `npx tsc --noEmit` and `next build` fail on the bun:test import. The latest 1.4.x was too new for the package-legitimacy gate when pinned.
   - Path alias: `@/` works in tests with no extra config, because Bun reads tsconfig `paths`.
2. **Run Commands.** Add `bun test`, `bun run test` (package.json script) and `bun test lib/calculations` (a single folder). Change the existing tsc command to `npx tsc --noEmit`. Leave the lint line alone, since 261101-iim owns lint.
3. **Test File Organization.** The convention is now decided: co-located `<name>.test.ts` next to the module, and the first suite is `lib/calculations/index.test.ts`.
4. **Test Structure.** Replace the Vitest-based example and its note about installing Vitest and configuring the alias with a short bun:test example matching the real suite: describe named after the export, literal expected values. Also describe the golden-value rule: expectations are fixed literals and are never edited to match a changed formula.
5. **Coverage.** `bun test --coverage` is available; no threshold is enforced.
6. **Unit Tests (Test Types) and Gaps and Risks.** Mark `lib/calculations` as covered, with an export-coverage guard. Remove the claim that the calculation rules have no automated coverage.
7. **"Adding the First Test Suite".** Replace it with a one-line note that the suite landed in quick task 261101-iig.

Then run the full milestone gate for this item: `npx tsc --noEmit`, `bun test` and `bun run build`. The build runs prisma generate, then next build, which type-checks the test file too. `bun run lint` is not a gate yet (it becomes one after 261101-iim).
  </action>
  <verify>
    <automated>npx tsc --noEmit && bun test && bun run build && test "$(grep -c 'bun test' .planning/codebase/TESTING.md)" -ge 1 && test "$(grep -c 'bun:test' .planning/codebase/TESTING.md)" -ge 1 && test "$(grep -c '@types/bun' .planning/codebase/TESTING.md)" -ge 1 && test "$(grep -c "from 'vitest'" .planning/codebase/TESTING.md)" -eq 0 && test "$(grep -c 'Not detected. No test runner' .planning/codebase/TESTING.md)" -eq 0</automated>
    <!-- baselines at HEAD 832fa9b in TESTING.md: 'bun test' 0, 'bun:test' 0, '@types/bun' 0, the vitest import line 1, the no-runner sentence 1 (so the two == 0 gates prove a real removal). -->
  </verify>
  <done>TESTING.md documents bun test as the runner, the @types/bun 1.3.14 pin and why it is needed, the co-located `*.test.ts` convention, the run commands and the golden-value rule, with no Vitest instructions left. `npx tsc --noEmit`, `bun test` and `bun run build` all exit 0.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| npm registry → package.json / bun.lock | Third-party type-definition code enters the repo's dependency graph and the tsc/next-build type program |
| sibling item output → test expectations | The module under test is rewritten by 261101-iif. Expectations must come from HEAD 832fa9b, not from the rewritten code |
| test file → production bundle | Test code must stay out of the app bundle |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-iig-SC | Tampering | `bun add -d @types/bun` (npm supply chain) | high | mitigate | Exact pin 1.3.14 (legitimacy verdict OK: published 2026-05-13, ~24.8M weekly downloads, DefinitelyTyped repo; transitive bun-types@1.3.14 OK, Oven repo, no install-time scripts). The latest 1.4.4 (SUS, too-new) is rejected. Task 1 re-checks registry integrity before installing, and its verify gate asserts both audited sha512 hashes in bun.lock and that the lockfile diff adds nothing else |
| T-iig-01 | Tampering | bun.lock re-resolution of unrelated packages (stale base lock: next 15.4.4 vs ^16.0.7) | medium | mitigate | Task 1 precondition requires `bun install --frozen-lockfile --dry-run --ignore-scripts` to exit 0 before installing. The verify gate fails if any lockfile entry other than @types/bun / bun-types is added or removed, so a framework upgrade cannot ride in under this item |
| T-iig-02 | Repudiation | Test expectations tracking a formula regression | medium | mitigate | Expected values are literals from `<golden_values>`: HEAD 832fa9b outputs, or iif spec values for the toX helpers only, each row labelled with its provenance. They are never computed by calling the module under test, and a Task 2 negative gate rejects pool or default-skill expectations derived from other exports. The closed-list check fails if the export set drifts from the 26 names. The Task 2 mismatch protocol forbids editing expectations and requires reporting a CALC-01 blocker |
| T-iig-03 | Information Disclosure | lib/calculations/index.test.ts leaking into the client bundle | low | accept | Next bundles only modules reachable from app routes. Nothing imports the test file, and it sits under lib/, not app/, so it is never a route. It contains no secrets or env access |
| T-iig-04 | Elevation of Privilege | package.json `test` script | low | accept | The script is exactly `bun test`, with no shell chaining or downloads, and it is visible in the reviewed diff. It runs only on developer machines, since Vercel runs `bun run build`, not tests |
</threat_model>

<verification>
- The runtime function exports of lib/calculations equal the 26-name closed list in `<golden_values>` C (Task 2's closed-list check)
- `bun test` → 0 failures; the suite covers every one of those 26 exports (describe-coverage gate plus the in-suite TESTED_FUNCTIONS guard)
- `bun run test` → same suite via the package.json script
- `npx tsc --noEmit` → exit 0 with the bun:test file included
- `bun run build` → exit 0 (next build type-checks the test file too)
- bun.lock adds only @types/bun@1.3.14 + bun-types@1.3.14 with the audited integrity hashes
- No expectation differs from its `<golden_values>` row (HEAD 832fa9b, or iif spec for the toX helpers)
</verification>

<success_criteria>
- CALC-02 satisfied: `bun test` runs unit tests covering every exported function in lib/calculations, including level 0, the level-5 boundaries and skill-point validation
- package.json has `"test": "bun test"`; Bun test types are exact-pinned and legitimacy-verified
- tsc, bun test and build gates all pass; lint is not gated for this item
- TESTING.md records the runner and the conventions for later test-adding items
</success_criteria>

<output>
Create `.planning/quick/261101-iig-add-unit-tests-calc-02-bun-test-suite-for-every-exported-fun/261101-iig-SUMMARY.md` when done, with `status: complete` in its frontmatter. Record the closed-list check output, which should report 26 exports matching. Also record any difference reported as a blocker, which golden rows (table A, or table B HEAD/spec) each export used, and any CALC-01 parity or spec mismatch reported as a blocker.
</output>
