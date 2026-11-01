---
phase: quick-261101-iif
plan: 01
type: execute
wave: 2
quick_id: 261101-iif
depends_on: ["261101-iie"]
files_modified:
  - lib/calculations/index.ts
  - components/character/quick-actions-bar.tsx
  - components/character/basic-info-tab.tsx
  - components/character/skills-kit-tab.tsx
  - components/character/skills-modal.tsx
  - components/character/attributes-modal.tsx
  - components/ui/editable-field.tsx
  - lib/api/queries.ts
  - lib/store/character.ts
  - lib/constants/character.ts
autonomous: true
requirements: [CALC-01]

must_haves:
  truths:
    - "For every level 0-99 the sheet shows the same attribute totals and attribute level bonus, vitality stage maxima and vitality totals, max Berkana, skill totals and skill level bonus, XP to next level, and skill points available/used/remaining as before the change (proven by the parity oracle)"
    - "Every function lib/calculations exported at 832fa9b, and every output of both client hooks, returns the same value as at 832fa9b for levels 0-99 across the oracle grid. Numbers compare by SameValueZero, so NaN must stay NaN, and a call that threw at HEAD must still throw (proven by the parity oracle against verbatim HEAD copies)"
    - "Every derived number above is computed by a function exported from lib/calculations/index.ts; no formula arithmetic remains in lib/constants/character.ts, lib/api/queries.ts, lib/store/character.ts or any component"
    - "lib/constants/character.ts exports only data (lists, labels, kit, languages, vitality keys/labels) and no functions"
    - "useCalculateDerivedStats and useCalculatedStats (where still present after 261101-iie) keep their return shape, delegate every number to lib/calculations, and normalize input only where HEAD had a `|| 0` fallback (PD-03)"
    - "Both HEAD skill-point pools keep their values, each under its own name in lib/calculations (PD-01). calculateTotalSkillPoints = (level + 1) x points-per-level feeds the skills tab. calculateLevelUpSkillPoints = level x points-per-level feeds calculateAvailableSkillPoints, validateSkillDistribution (pool and error messages) and skillPoints.available of both hooks. The two pools are not reconciled."
    - "npx tsc --noEmit and bun run build pass"
  artifacts:
    - path: "lib/calculations/index.ts"
      provides: "Single source of game formulas, including level-bonus, base-Berkana, skill-point-pool and input-normalization helpers"
      exports: ["getAttributeLevelBonus", "calculateAttributeBase", "calculateAttributeTotal", "calculateVitalityLevels", "getBaseBerkana", "calculateMaxBerkana", "getSkillLevelBonus", "calculateSkillTotal", "calculateTotalSkillPoints", "calculateLevelUpSkillPoints", "calculateUsedSkillPoints", "calculateRemainingSkillPoints", "calculateAvailableSkillPoints", "validateSkillDistribution", "getXPRequiredForNextLevel", "toAttributeValue", "toSkillValue", "toVitalityBase"]
    - path: "lib/constants/character.ts"
      provides: "Constant lists and labels only (ATTRIBUTES, SKILLS, ATTRIBUTE_LABELS, SKILL_LABELS, DEFAULT_ADVENTURE_KIT, STANDARD_LANGUAGES, VITALITY_LEVELS, VITALITY_LABELS)"
  key_links:
    - from: "components/character/quick-actions-bar.tsx"
      to: "lib/calculations/index.ts"
      via: "import of calculateVitalityLevels, calculateMaxBerkana, getBaseBerkana, toVitalityBase"
      pattern: "from ['\"]@/lib/calculations['\"]"
    - from: "components/character/basic-info-tab.tsx"
      to: "lib/calculations/index.ts"
      via: "vitality stages, attribute totals/level bonus, max Berkana, XP to next level"
      pattern: "from ['\"]@/lib/calculations['\"]"
    - from: "components/character/skills-kit-tab.tsx"
      to: "lib/calculations/index.ts"
      via: "skill totals/level bonus and skill-point available/used/remaining"
      pattern: "from ['\"]@/lib/calculations['\"]"
    - from: "lib/api/queries.ts"
      to: "lib/calculations/index.ts"
      via: "useCalculateDerivedStats delegates to lib/calculations"
      pattern: "from ['\"]@/lib/calculations['\"]"
    - from: "lib/store/character.ts"
      to: "lib/calculations/index.ts"
      via: "useCalculatedStats delegates to lib/calculations"
      pattern: "from ['\"]@/lib/calculations['\"]"
---

<objective>
Make `lib/calculations/index.ts` the only place game formulas live (CALC-01). Every duplicate goes: the six helpers in `lib/constants/character.ts`, the bodies of `useCalculateDerivedStats` (`lib/api/queries.ts`) and `useCalculatedStats` (`lib/store/character.ts`), and the inline copies in `quick-actions-bar`, `basic-info-tab`, `skills-kit-tab`, `skills-modal`, `attributes-modal` and `EditableAttributeField`. Each one is replaced by an import from `@/lib/calculations`. Every number shown on the sheet, every value a HEAD `lib/calculations` export returns, and every output of both hooks must stay exactly the same. A parity oracle checks this over levels 0-99 before and after every task.

Purpose: Formula changes then happen in one module, and the tests from 261101-iig cover the code the UI actually runs.
Output: an extended `lib/calculations/index.ts`, a constants module that holds only data, delegating client hooks, components that import from `@/lib/calculations`, and `261101-iif-SUMMARY.md`.

Planner decisions (there is no CONTEXT.md for this quick item, so they are recorded here and must be repeated in the SUMMARY):
- **PD-01 (two skill-point pools, both preserved).** HEAD has two pool rules. The skills tab shows "Disponíveis" as (level + 1) x 10, which counts level 0. `calculateAvailableSkillPoints`, `validateSkillDistribution` (its pool and the number inside its "excede o disponível" message) and `skillPoints.available` of both client hooks use level x 10. CALC-01 requires identical numbers, so this item does not pick a winner. Each rule gets its own name in `lib/calculations`:
  - `calculateTotalSkillPoints(level) = (level + 1) * getSkillPointsPerLevel()`, the sheet pool
  - `calculateLevelUpSkillPoints(level) = level * getSkillPointsPerLevel()`, the lib/hook pool

  `calculateRemainingSkillPoints(skills, totalPoints)` takes the pool explicitly, so every call site shows which rule it uses. `calculateAvailableSkillPoints`, `validateSkillDistribution` and both hooks stay on the level x 10 pool, and none of their outputs change. Which rule the game actually intends is a question for the owner. Record it in the SUMMARY's open questions and do not act on it.
- **PD-02 (attributes modal).** `attributes-modal.tsx` displays race + class + bonus without the attribute level bonus. Its level-bonus local is computed from the wrong argument and never rendered. Keep the displayed number as it is (now via `calculateAttributeBase`) and delete the dead local. Do not "fix" it, because that would change a displayed number. Report it in the SUMMARY as an open question for the owner.
- **PD-03 (input normalization).** The UI's fallback behavior for missing JSON fields (`x || 0`) moves into `toAttributeValue` / `toSkillValue` / `toVitalityBase` in `lib/calculations`, so call sites stay one-liners and the fallback rules live next to the formulas.
  - The helpers apply the `|| 0` rule, so undefined, null, NaN, 0, '' and false fields all become 0, and a nullish or non-object `raw` becomes all zeros.
  - They are applied exactly where HEAD had a `|| 0` fallback, and nowhere else.
  - HEAD's `useCalculateDerivedStats` had no fallback for its attribute totals, vitality and skill totals. A partial entry there yields NaN and a null entry throws, so those inputs stay un-normalized and keep that behavior. Only its `used` sum, which HEAD wrote as `skill?.distributed || 0`, goes through `toSkillValue`.
  - Normalizing that hook fully would turn NaN into numbers and change a hook output. Record this as an owner open question instead.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.claude/CLAUDE.md
@lib/calculations/index.ts
@lib/constants/character.ts

Project rules that bind this plan: there is no authentication (do not add any). Prisma column types do not change (this plan does not touch `prisma/`). Derived numbers and UI behavior stay identical. Bun is the package manager. Gates are `npx tsc --noEmit` and `bun run build`; `bun run lint` is NOT a gate until 261101-iim. The calculation unit-test suite belongs to 261101-iig, so do not add `*.test.ts` files here.

Style: match each file you edit. `lib/calculations`, `lib/store`, `lib/api/queries.ts` and the character components use 2-space indent, no semicolons and single quotes. Comments and JSDoc are in Portuguese, identifiers in English. Do not add `any`, `@ts-ignore` or `console.log`. No comment outside `lib/calculations` may restate a formula or name a removed helper.

Sibling ordering: 261101-iie (dependency) deletes the dead calculation routes, their hooks and schemas, and the store save simulation. It edits `lib/api/queries.ts`, `lib/store/character.ts` and `components/ui/editable-field.tsx` before this item runs, so line numbers below refer to base 832fa9b and may have shifted. Locate code by the quoted snippets, not by line number. 261101-iij and 261101-iin edit `editable-field.tsx` / `basic-info-tab.tsx` after this item, so touch only the regions named here.

<interfaces>
New exports to add to lib/calculations/index.ts. There are exactly these 10, and 261101-iig must cover each one. Existing exports keep their names, signatures and HEAD values.

```ts
// 1  = HEAD calculateAttributeBonus (constants)          samples: 0→0, 4→0, 5→1, 9→1, 10→2, 99→19
export function getAttributeLevelBonus(level: number): number          // level >= 5 ? Math.floor(level / 5) : 0
// 2  = attributes-modal sum (PD-02)                      sample: {race:10, class:12, bonus:2} → 24
export function calculateAttributeBase(attribute: AttributeValue): number   // attribute.race + attribute.class + attribute.bonus
// 3  = HEAD calculateSkillBonus (constants)              samples: 0→0, 4→0, 5→1, 10→2
export function getSkillLevelBonus(level: number): number              // Math.floor(level / 5)
// 4  = the literal 100 in HEAD calculateBerkana / processLevelUp      sample: () → 100
export function getBaseBerkana(): number                               // 100
// 5  = HEAD calculateSkillPointsAvailable (constants), sheet pool, PD-01   samples: 0→10, 1→20, 5→60
export function calculateTotalSkillPoints(level: number): number       // (level + 1) * getSkillPointsPerLevel(); inclui o nível 0
// 6  = HEAD lib/hook pool (calculateAvailableSkillPoints, validateSkillDistribution, both hooks' skillPoints.available), PD-01   samples: 0→0, 1→10, 5→50
export function calculateLevelUpSkillPoints(level: number): number     // level * getSkillPointsPerLevel(); não conta o nível 0
// 7  = HEAD skills-kit-tab remaining and hooks' remaining, unclamped; the pool is an explicit number
//      samples (skills used = 5, i.e. {acrobacia:{distributed:3,bonus:0}, nadar:{distributed:2,bonus:5}}): totalPoints 10 → 5, 20 → 15; used 25 with totalPoints 10 → -15
export function calculateRemainingSkillPoints(skills: Record<string, SkillValue>, totalPoints: number): number
                                                                       // totalPoints - calculateUsedSkillPoints(skills); may be negative
// 8-10 = HEAD call-site fallbacks (`obj || zeros`, then `obj.field || 0`)
//      samples: toAttributeValue(undefined) → {race:0, class:0, bonus:0}; toAttributeValue({race:null, class:5}) → {race:0, class:5, bonus:0}
//               toSkillValue({distributed:3}) → {distributed:3, bonus:0}; toVitalityBase({race:60}) → {race:60, class:0}; NaN field → 0
export function toAttributeValue(raw: Partial<AttributeValue> | null | undefined): AttributeValue  // { race: raw?.race || 0, class: raw?.class || 0, bonus: raw?.bonus || 0 }
export function toSkillValue(raw: Partial<SkillValue> | null | undefined): SkillValue              // { distributed: raw?.distributed || 0, bonus: raw?.bonus || 0 }
export function toVitalityBase(raw: Partial<VitalityBase> | null | undefined): VitalityBase        // { race: raw?.race || 0, class: raw?.class || 0 }

// Existing exports re-expressed on top of the helpers. Keep operand order so results stay identical; every HEAD value is unchanged:
calculateAttributeTotal(a, level)        = calculateAttributeBase(a) + getAttributeLevelBonus(level)
calculateSkillTotal(s, level)            = 1 + s.distributed + s.bonus + getSkillLevelBonus(level)
calculateAvailableSkillPoints(sk, level) = Math.max(0, calculateRemainingSkillPoints(sk, calculateLevelUpSkillPoints(level)))   // PD-01: still level x 10, still clamped
validateSkillDistribution(...)           : totalAvailable = calculateLevelUpSkillPoints(level)     // PD-01: still level x 10; per-skill max (level * 3) and every message unchanged
processLevelUp(...)                      : Berkana base argument = getBaseBerkana()                 // replaces the literal 100
```

Every sample above is a HEAD 832fa9b value, and the oracle proves each one equals its HEAD counterpart. The numbers for rows 1, 3, 5 and 6 match rows of 261101-iig's `<golden_values>` table B. Row 7 is table B's "skills-kit-tab inline remaining" row with the pool passed as a literal number.

The `toX` helpers use `|| 0` and do no `Number()` conversion. Any non-object or nullish `raw` yields all zeros. This reproduces exactly what `obj || { ...zeros }` followed by `obj.field || 0` did at the call sites. Apply them only where HEAD had that fallback (PD-03).

Mapping table, from what call sites use today to what they must use:

| Today (constants helper or inline arithmetic) | Replacement from `@/lib/calculations` |
|---|---|
| constants XP-to-next helper `(currentLevel + 1) * 10` | `getXPRequiredForNextLevel(level \|\| 0)` |
| constants attribute level-bonus helper | `getAttributeLevelBonus(level \|\| 0)` |
| constants skill level-bonus helper | `getSkillLevelBonus(level \|\| 0)` |
| constants skill-points-available helper `(level + 1) * 10` | `calculateTotalSkillPoints(level \|\| 0)` |
| constants Berkana helper `100 + level*10 + bonus` | `calculateMaxBerkana(level \|\| 0, getBaseBerkana(), berkanaBonus \|\| 0)` |
| constants vitality helper `(vitality.race \|\| 0, vitality.class \|\| 0, level \|\| 0)` | `calculateVitalityLevels(toVitalityBase(vitality), level \|\| 0)` |
| inline `(attr.race \|\| 0) + (attr.class \|\| 0) + (attr.bonus \|\| 0) + levelBonus` | `calculateAttributeTotal(toAttributeValue(attr), level \|\| 0)` |
| attributes-modal inline `(attr.race \|\| 0) + (attr.class \|\| 0) + (attr.bonus \|\| 0)` (no level bonus, PD-02) | `calculateAttributeBase(toAttributeValue(attr))` |
| inline `1 + (skill.distributed \|\| 0) + (skill.bonus \|\| 0) + levelBonus` | `calculateSkillTotal(toSkillValue(skill), level \|\| 0)` |
| skills-kit-tab used = sum over `SKILLS` keys of `distributed \|\| 0` | `calculateUsedSkillPoints(skillValues)`, where `skillValues` = record of `SKILLS` keys only, in `SKILLS` order, each `toSkillValue(skills[key])` |
| skills-kit-tab remaining = available − used (unclamped) | `calculateRemainingSkillPoints(skillValues, calculateTotalSkillPoints(level \|\| 0))`, the sheet pool (PD-01) |
| hooks: available `level * 10`, remaining = available − used (unclamped) | `calculateLevelUpSkillPoints(level)` and `calculateRemainingSkillPoints(skillRecord, available)`, the level x 10 pool (PD-01) |
| EditableAttributeField total + its "level ≥ 5" suffix guard | `calculateAttributeTotal(attributeData, level)`; suffix shown when `getAttributeLevelBonus(level) > 0` |
</interfaces>
</context>

<tasks>

<task type="tracer">
  <name>Task 1 (tracer): parity oracle, then extend lib/calculations and wire the quick-actions bar to it end to end</name>
  <precondition>261101-iie has landed in this checkout: `grep -cE "'/:id/(level-up|calculate-[a-z-]+|validate-skills|recalculate)'" "app/api/[[...route]]/characters/index.ts"` prints 0 (it prints 8 at base 832fa9b). If it does not, halt: this plan edits lib/api/queries.ts, lib/store/character.ts and components/ui/editable-field.tsx on top of 261101-iie's rewrite of those files.</precondition>
  <reversibility rating="reversible">Adds named helpers and re-expresses existing exports with identical values (the oracle proves it); no output changes, so a revert is a plain git revert.</reversibility>
  <files>lib/calculations/index.ts, components/character/quick-actions-bar.tsx</files>
  <read_first>lib/calculations/index.ts (whole file), lib/constants/character.ts (the block under the "Funções de cálculo" banner, base lines 175-212), components/character/quick-actions-bar.tsx (base lines 1-70), plus the inline expressions listed in the mapping table: basic-info-tab.tsx base lines 338-341 and 395-398, attributes-modal.tsx 23-26, skills-modal.tsx 23-26, skills-kit-tab.tsx 68-71 and 311-317, editable-field.tsx 513-563, and the two hook bodies at base 832fa9b: `git show 832fa9b:lib/api/queries.ts` (useCalculateDerivedStats, base 336-393) and `git show 832fa9b:lib/store/character.ts` (useCalculatedStats, base 245-305)</read_first>
  <action>
Step 1, the parity oracle (implements the "numbers stay identical" project rule and PD-01). Build it before editing any repo file, outside the repository so it is never committed. Use directory D = `${TMPDIR:-/tmp}/261101-iif-parity`. Its parts:
(a) HEAD sources, copied verbatim with git. Both files are import-free, so they load standalone. Run `git show 832fa9b:lib/calculations/index.ts` into `$D/legacy-calculations.ts` and `git show 832fa9b:lib/constants/character.ts` into `$D/legacy-constants.ts`. The oracle takes every legacy lib function and the six legacy constants helpers from these copies, never from the working tree.
(b) `$D/parity.ts`. Besides importing the two copies, it holds hand copies taken from `git show 832fa9b:<path>`:
   - the inline component expression from every mapping-table row: the basic-info-tab attribute total, the attributes-modal base sum, the skills-modal/skills-kit-tab skill total, the skills-kit-tab available/used/remaining over `SKILLS` keys, and the EditableAttributeField total with its old suffix guard and suffix number
   - the bodies of both hooks as plain functions, with only the hook wrapper removed: the useMemo callback of useCalculateDerivedStats (lib/api/queries.ts) and the selector of useCalculatedStats (lib/store/character.ts)
(c) Code under test, loaded with dynamic imports from `process.cwd()`:
   - `lib/calculations/index.ts`.
   - `lib/constants/character.ts`, using only `SKILLS` and `VITALITY_LEVELS` so the oracle survives Task 3.
   - The two real hooks from `lib/api/queries.ts` and `lib/store/character.ts`, run outside React through a stub dispatcher. Import React from `process.cwd() + '/node_modules/react/index.js'`, which is the instance the hook modules resolve. Set its `__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H` to an object with three members: useMemo calls its factory, useSyncExternalStore returns getSnapshot(), and useDebugValue does nothing.
   - Call useCalculateDerivedStats(data) directly. For the store hook, call `useCharacterStore.setState({ character })` and then useCalculatedStats().
   - The planner verified this route on React 19.1.0 and zustand 5.0.6. Rendering through react-dom/server does not work for the store hook, because zustand's server snapshot always reads the initial state.
   - If 261101-iie removed a hook, print it as skipped rather than failing.
(d) Comparison, through one recursive `same(a, b)`:
   - Numbers compare by SameValueZero (=== or both NaN).
   - Arrays compare element by element. Plain objects compare by identical key order and recursive values. null and undefined compare by ===.
   - Wrap each pair of calls: if either side throws, the check passes only when both throw.
   - Collect every mismatch with its function name and inputs.
(e) Coverage:
   - Every function exported by `legacy-calculations.ts` runs at least one case against the same-named export of the current module. A missing current export is a mismatch.
   - A self-check fails if any HEAD export name has no registered case.
   - Also compare: the six constants helpers against their mapping-table replacements, every component expression, the PD-01 pool checks, and both hooks' full return objects.
(f) Print each mismatch and exit 1 if there are any. Otherwise print "PARITY OK <n> checks".
Input grid (every level-taking case runs for every level 0..99):
- attribute raws: undefined, null, {}, {race: 3}, {race: 2, class: 1, bonus: 4}, {race: null, class: 5}, {race: -1, class: 0, bonus: 2}
- EditableAttributeField data (numeric only): {race: 2, class: 1, bonus: 4}, {race: 0, class: 0, bonus: 0}
- vitality raws: {}, {race: 0, class: 0}, {race: 20, class: 30}, {race: 100, class: 50}, {race: 60}, {race: null, class: 45}. Compare each VITALITY_LEVELS key and the sum of Object.values.
- Berkana: calculateMaxBerkana(level, base 100 or 120, bonus 0, 15 or -5), and the constants Berkana helper with bonus 0, 15 or -5
- skill raws: undefined, null, {}, {distributed: 3}, {distributed: 2, bonus: 1}, {distributed: null, bonus: 4}
- skills records:
  - {}
  - the used-5 record {acrobacia: {distributed: 3, bonus: 0}, nadar: {distributed: 2, bonus: 5}}
  - a record keyed by every SKILLS entry with distributed = index % 4 and bonus = index % 2
  - the same record plus extra unaccented keys `atuacao` and `ataqueSurpresa` with distributed 5, which the SKILLS-only subset must ignore
  - {acrobacia: {distributed: -1, bonus: 0}}
  - {a: {distributed: 6, bonus: 0}, b: {distributed: 6, bonus: 0}, c: {distributed: 6, bonus: 0}, d: {distributed: 3, bonus: 0}}

  These feed calculateUsedSkillPoints, calculateAllSkills, calculateAvailableSkillPoints and validateSkillDistribution. For validateSkillDistribution, compare the whole {isValid, errors} result, so the pool number inside each message is checked too.
- PD-01 pool checks:
  - calculateTotalSkillPoints(level) against the legacy constants skill-points helper
  - calculateLevelUpSkillPoints(level) against the HEAD pool (level times 10, as written inline in both hooks)
  - calculateRemainingSkillPoints(record, calculateTotalSkillPoints(level)) against the skills-kit-tab remaining
  - calculateRemainingSkillPoints(record, calculateLevelUpSkillPoints(level)) against the HEAD hooks' remaining
- XP and level-up. Take `required` from the legacy getXPRequiredForNextLevel and use xp values 0, required - 1, required and 100000. Run getXPRequiredForNextLevel(level), getTotalXPForLevel(level), canLevelUp(xp, level), and processLevelUp({level, currentXP: xp, vitality: {race: 200, class: 250}, maxBerkana: 999, berkanaBonus: 0 or 5}) under throw parity. Call getSkillPointsPerLevel(), getDefaultSkills() and initializeSkills() once each.
- Hook characters, each at levels 0..99 with berkanaBonus 0 and 15 (useCalculateDerivedStats also gets maxBerkana 0):
  1. numeric: attributes {forca: {race: 2, class: 1, bonus: 4}, agilidade: {race: 0, class: 0, bonus: 0}}, vitality {race: 20, class: 30}, and the SKILLS-plus-extras skills record
  2. partial: attributes {x: {race: 3}}, vitality {race: 60}, skills {a: {distributed: 3}}. At HEAD, useCalculateDerivedStats yields NaN here and must keep doing so.
  3. missing: attributes, vitality and skills all null
  4. null entry: skills {a: {distributed: 3, bonus: 1}, b: null}. At HEAD, useCalculateDerivedStats throws here and must keep throwing, while useCalculatedStats normalizes.

  Also run characterData null for useCalculateDerivedStats and character null for the store hook. Both return null.
Run the oracle once now, before changing lib/calculations. It must exit non-zero, and every mismatch must be a missing-export mismatch for one of the 10 new names. That proves the oracle exercises the module. Every HEAD-export, constants and hook check must already pass at this point, which proves the copies are faithful. Any other mismatch means a copy is not verbatim: fix the copy, never the module.

Step 2, lib/calculations/index.ts (CALC-01, PD-01, PD-03). Add the 10 new exports from the interfaces block and re-express calculateAttributeTotal, calculateSkillTotal, calculateAvailableSkillPoints, validateSkillDistribution and processLevelUp on top of them, exactly as listed there.
- calculateAvailableSkillPoints and validateSkillDistribution keep the level x 10 pool through calculateLevelUpSkillPoints (PD-01). Their values and messages must not change.
- Keep operand order so the results stay bit-identical.
- Put each helper in its existing banner section (ATRIBUTOS / VITALIDADE / BERKANA / PERÍCIAS). Put the three to-helpers under a new `// NORMALIZAÇÃO DE ENTRADAS` banner in the same `// ====` style.
- Give each new export a short Portuguese JSDoc stating its formula. Both pool JSDocs name their consumers: calculateTotalSkillPoints says it includes level 0 and feeds the skills tab; calculateLevelUpSkillPoints says it excludes level 0 and feeds calculateAvailableSkillPoints, validateSkillDistribution and the hooks.
- Keep every existing export and signature, because 261101-iig pins them.
- The module must stay import-free so client components can use it.

Step 3, components/character/quick-actions-bar.tsx (the tracer's UI end). Remove the two legacy vitality/Berkana helpers from the constants import and keep `VITALITY_LEVELS` from constants. Import from `@/lib/calculations` instead. Compute calculatedVitality as calculateVitalityLevels(toVitalityBase(vitality), level || 0) and calculatedBerkana as calculateMaxBerkana(level || 0, getBaseBerkana(), berkanaBonus || 0). Leave the destructuring defaults, the totals reduce, the maxBerkana/currentBerkana fallbacks and everything else unchanged.

Run the oracle again: it must print PARITY OK.
  </action>
  <verify>
    <automated>bun "${TMPDIR:-/tmp}/261101-iif-parity/parity.ts" && npx tsc --noEmit && grep -cE "from ['\"]@/lib/calculations['\"]" components/character/quick-actions-bar.tsx && ! grep -qE 'calculate(Vitality|Berkana)\b' components/character/quick-actions-bar.tsx</automated>
  </verify>
  <done>The parity oracle exited non-zero before Step 2, and every mismatch then was a missing-export mismatch for one of the 10 new names. It prints PARITY OK after Step 3, covering every HEAD lib/calculations export, both skill-point pools, validateSkillDistribution's messages and both hooks' full outputs. lib/calculations exports the 10 new helpers. calculateAvailableSkillPoints and validateSkillDistribution still use the level x 10 pool. quick-actions-bar imports from `@/lib/calculations` and no longer references the constants vitality/Berkana helpers (baseline: import count 0, legacy reference present). tsc passes.</done>
</task>

<task type="auto">
  <name>Task 2: route every remaining component through lib/calculations</name>
  <files>components/character/basic-info-tab.tsx, components/character/skills-kit-tab.tsx, components/character/skills-modal.tsx, components/character/attributes-modal.tsx, components/ui/editable-field.tsx</files>
  <read_first>The mapping table in the interfaces block; components/character/basic-info-tab.tsx (imports and base lines 41-133, 306-311, 336-450, 497-625); components/character/skills-kit-tab.tsx (imports, 38-43, 66-72, 304-330, 345-414); components/character/skills-modal.tsx (whole file); components/character/attributes-modal.tsx (whole file); components/ui/editable-field.tsx (EditableAttributeField only, base 510-566)</read_first>
  <action>
Scope note. This task touches 5 files, which is within the per-task limit (split only above 5). It is kept whole for two reasons:
- Splitting the modals from the tabs would need a 4th task, which is over the 3-task cap, or would push Task 3 to 5 files of mixed concerns.
- Every edit is a mapping-table substitution, and the two modals are one expression each.

To keep each file reviewable, edit one file at a time, in the order skills-modal, attributes-modal, editable-field, skills-kit-tab, basic-info-tab. Run `npx tsc --noEmit` after each file and fix errors before moving on. Record in the SUMMARY that the 5-file task was accepted, and name any file that needed rework.

Apply the mapping table (CALC-01) in each file. Replace the legacy constants-helper imports with named imports from `@/lib/calculations`, and keep the list/label constants (ATTRIBUTES, SKILLS, *_LABELS, STANDARD_LANGUAGES, VITALITY_LEVELS, DEFAULT_ADVENTURE_KIT) imported from `@/lib/constants/character`.

basic-info-tab.tsx:
- In applyDamage, restoreFullHealth, the "Vitalidade Total e Atual" IIFE and the "Níveis de Vitalidade" IIFE, use calculateVitalityLevels(toVitalityBase(vitality), level || 0). restoreFullHealth persists the returned object as currentVitality. It has the same six keys and values, so the stored JSON is unchanged.
- "XP para Próximo" uses getXPRequiredForNextLevel(level || 0).
- In the attribute summary list and the "Distribuição de Atributos" grid, set levelBonus to getAttributeLevelBonus(level || 0) and total to calculateAttributeTotal(toAttributeValue(attr), level || 0). Keep the `levelBonus` local, because the grid renders "+N (nível)".
- In the Berkana block, the calculated max becomes calculateMaxBerkana(level || 0, getBaseBerkana(), berkanaBonus || 0). Keep the `maxBerkana || calculatedMax` fallback.
- Keep the raw `attr` local, and leave the `value={attr.race || 0}`-style input props alone. Those are input display values, not formulas.

skills-kit-tab.tsx:
- In the summary list and the distribution grid, set levelBonus to getSkillLevelBonus(level || 0) (the grid shows it under "Nível:") and total to calculateSkillTotal(toSkillValue(skill), level || 0).
- Keep the raw `skill` local unchanged. The quick-add and edit handlers spread it into the persisted payload, so it must never be swapped for the normalized value or extra stored fields would be dropped.
- In the skill-point header, build `skillValues`: a record over SKILLS keys only, in SKILLS order, each value toSkillValue(skills[key]). Then available = calculateTotalSkillPoints(level || 0), the sheet pool (PD-01); used = calculateUsedSkillPoints(skillValues); and remaining = calculateRemainingSkillPoints(skillValues, available). Remaining stays unclamped, so negative values still get text-destructive. Do not use calculateLevelUpSkillPoints or calculateAvailableSkillPoints here, because both would change the displayed numbers.
- Do not pass the whole `skills` object. Stored rows also carry the unaccented default keys from lib/defaults (e.g. `atuacao`, `ataqueSurpresa`), and the displayed sum has always covered SKILLS keys only.

skills-modal.tsx: the total becomes calculateSkillTotal(toSkillValue(skill), level || 0). Drop the now-unused levelBonus local and the legacy import.

attributes-modal.tsx (PD-02): attributeValue becomes calculateAttributeBase(toAttributeValue(attr)), with no level bonus, exactly as displayed today. Delete the unused `bonus` local and its legacy import. Do not add the level bonus.

editable-field.tsx, EditableAttributeField only: total becomes calculateAttributeTotal(attributeData, level). attributeData is already numeric, so it is not normalized. In the formula line, compute `const levelBonus = getAttributeLevelBonus(level)` and render the " + N" suffix only when levelBonus > 0. This is equivalent to the old guard because the bonus is at least 1 exactly when the old guard was true. Touch nothing else in this file, because 261101-iie and 261101-iij own other regions. If 261101-iie already removed EditableAttributeField, skip this file and say so in the SUMMARY.

Do not write comments that restate formulas or name the removed helpers. Run the parity oracle after the edits.
  </action>
  <verify>
    <automated>bun "${TMPDIR:-/tmp}/261101-iif-parity/parity.ts" && npx tsc --noEmit && ! grep -rnE 'Math\.floor\(level ?/ ?5\)|level >= 5|baseTotal ?[-*]|\(baseTotal|level ?\* ?10|[lL]evel ?\+ ?1\) ?\* ?10|= ?1 ?\+ ?\(?skill|race \|\| 0\) \+|\.race \+ |\+ \(?skill\??\.distributed' components --include='*.ts' --include='*.tsx' | grep -vE '^[^:]+:[0-9]+:\s*(//|\*)' | grep . && ! grep -rnE 'calculate(XPForNextLevel|AttributeBonus|SkillBonus|SkillPointsAvailable|Berkana|Vitality)\b' components --include='*.ts' --include='*.tsx' | grep .</automated>
  </verify>
  <done>PARITY OK. tsc passes. The inline-formula scan over components/ returns no lines (baseline at base 832fa9b: 10 lines). No component references a legacy constants helper (baseline: 5 component files). Each of basic-info-tab, skills-kit-tab, skills-modal, attributes-modal and editable-field imports from `@/lib/calculations`.</done>
</task>

<task type="auto">
  <name>Task 3: delegate the client hooks, empty the constants module of functions, full gate</name>
  <files>lib/api/queries.ts, lib/store/character.ts, lib/constants/character.ts</files>
  <read_first>lib/api/queries.ts (the "UTILITY HOOKS" section with useCalculateDerivedStats, base 328-393, plus the react import line), lib/store/character.ts (imports and useCalculatedStats, base 242-305), lib/constants/character.ts (base 156-212)</read_first>
  <action>
First, grep for call sites of useCalculateDerivedStats and useCalculatedStats outside their own definitions, and record the result in the SUMMARY (expected: none). The hooks' outputs do not change either way, because PD-01 keeps their level x 10 pool and the oracle checks their full outputs. So a call site is reported, not a stop condition. If 261101-iie already deleted either hook, skip it. Do not recreate it.

lib/api/queries.ts, useCalculateDerivedStats (CALC-01, PD-01, PD-03). Keep the exported name, the parameter object (including the unused maxBerkana), useMemo with the [characterData] dependency, the null guard and the return shape { calculatedAttributes, calculatedVitality, calculatedBerkana, calculatedSkills, skillPoints: { available, used, remaining } }. Replace the body:
- calculatedAttributes = calculateAllAttributes(attributes || {}, level). Pass the entries un-normalized. HEAD had no fallback here: a partial entry gives NaN and a null entry throws, and the oracle requires both to stay that way.
- calculatedVitality = vitality ? calculateVitalityLevels(vitality, level) : null, also un-normalized for the same reason.
- calculatedBerkana = calculateMaxBerkana(level, getBaseBerkana(), berkanaBonus).
- calculatedSkills = calculateAllSkills(skills || {}, level), un-normalized.
- Build `skillRecord` with Object.fromEntries over Object.entries(skills || {}), mapping each value through toSkillValue. HEAD's used sum did apply `?.distributed || 0`.
- skillPoints: available = calculateLevelUpSkillPoints(level), used = calculateUsedSkillPoints(skillRecord), remaining = calculateRemainingSkillPoints(skillRecord, available). This is the HEAD level x 10 pool, unclamped (PD-01).
Delete the stale "Importar funções de cálculo no cliente" comment. Add no new `any` and no `@ts-ignore`. The existing `any` parameter fields stay as they are.

lib/store/character.ts, useCalculatedStats (CALC-01, PD-01, PD-03). Delegate inside the selector. HEAD applied `?.field || 0` to every field here, so normalize everything:
- Build `attributeRecord` with Object.fromEntries over Object.entries(attributes || {}), mapping each value through toAttributeValue. Then calculatedAttributes = calculateAllAttributes(attributeRecord, level).
- calculatedVitality = vitality ? calculateVitalityLevels(toVitalityBase(vitality), level) : null.
- calculatedBerkana = calculateMaxBerkana(level, getBaseBerkana(), berkanaBonus).
- Build `skillRecord` the same way with toSkillValue. Then calculatedSkills = calculateAllSkills(skillRecord, level).
- skillPoints: available = calculateLevelUpSkillPoints(level), used = calculateUsedSkillPoints(skillRecord), remaining = calculateRemainingSkillPoints(skillRecord, available).
- Keep the `!state.character` null guard and the same return shape.
- Drop the `as any` casts this body no longer needs. CharacterFull's JSON fields are already typed loosely. If tsc asks for a cast, cast to the helper's parameter type, never to any.
- A missing field still gives an empty record, used 0, or calculatedVitality null, exactly as at HEAD.

lib/constants/character.ts: delete the "Funções de cálculo" banner comment and all six helper functions below it. Keep every list/label constant byte-for-byte.

Then run the full gate below. If `bun run build` fails because node_modules or the generated Prisma client is missing in this worktree, run `bun install` first. It runs `prisma generate` via postinstall and needs no DATABASE_URL.
  </action>
  <verify>
    <automated>bun "${TMPDIR:-/tmp}/261101-iif-parity/parity.ts" && bun -e "const m = await import(process.cwd() + '/lib/constants/character.ts'); const f = Object.entries(m).filter(([, v]) => typeof v === 'function').map(([k]) => k); if (f.length) { console.error('constants still export functions:', f.join(',')); process.exit(1) } console.log('constants: no functions')" && ! grep -rnE 'Math\.floor\(level ?/ ?5\)|level >= 5|baseTotal ?[-*]|\(baseTotal|level ?\* ?10|[lL]evel ?\+ ?1\) ?\* ?10|= ?1 ?\+ ?\(?skill|race \|\| 0\) \+|\.race \+ |\+ \(?skill\??\.distributed' app components lib providers --include='*.ts' --include='*.tsx' --exclude-dir=generated | grep -v '^lib/calculations/' | grep -vE '^[^:]+:[0-9]+:\s*(//|\*)' | grep . && ! grep -rnE 'calculate(XPForNextLevel|AttributeBonus|SkillBonus|SkillPointsAvailable|Berkana|Vitality)\b' app components lib providers --include='*.ts' --include='*.tsx' --exclude-dir=generated | grep . && npx tsc --noEmit && bun run build</automated>
  </verify>
  <done>PARITY OK, now run against the delegated hooks. Both hooks return the same full output as their HEAD bodies for every oracle character, including the NaN and throw cases of useCalculateDerivedStats. lib/constants/character.ts exports no functions (baseline: 6). The repo-wide inline-formula scan outside lib/calculations returns no lines (baseline at base 832fa9b: 52 lines). No file references a legacy helper name (baseline: 6 files). Both hooks, where present, import from `@/lib/calculations`. `npx tsc --noEmit` and `bun run build` pass.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| DB JSON columns → client render | `attributes`, `vitality`, `skills` and `currentVitality` arrive as loosely typed JSON (`z.any()` until 261101-iih) and feed the formulas |
| client → PUT /api/characters/:id | restoreFullHealth and applyDamage persist values computed by `calculateVitalityLevels` |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-261101-iif-01 | Tampering (data integrity) | basic-info-tab restoreFullHealth / applyDamage → currentVitality | medium | mitigate | The parity oracle asserts calculateVitalityLevels(toVitalityBase(v), level) equals the legacy helper key by key for levels 0-99 before and after each task, so persisted currentVitality values cannot drift |
| T-261101-iif-02 | Denial of Service (render crash) | toAttributeValue / toSkillValue / toVitalityBase on malformed stored JSON | low | mitigate | The helpers return zeros for nullish or non-object input and for null fields. The oracle grid includes undefined, null, {} and null-field entries |
| T-261101-iif-03 | Information Disclosure | lib/calculations shipped in the client bundle | low | accept | Pure, import-free arithmetic with no secrets, env access or server-only imports |
| T-261101-iif-SC | Tampering | npm/pip/cargo installs | low | accept | This plan installs no packages. `bun install` only restores the existing lockfile |
</threat_model>

<verification>
- `bun "${TMPDIR:-/tmp}/261101-iif-parity/parity.ts"` prints PARITY OK (levels 0-99 across the full input grid). The run covers every HEAD lib/calculations export via the verbatim 832fa9b copy, both skill-point pools, validateSkillDistribution's messages, the component expressions, and both hooks' full outputs, with NaN and throw parity.
- The repo-wide inline-formula scan (Task 3 verify) returns nothing outside `lib/calculations/`.
- `lib/constants/character.ts` exports no functions.
- `npx tsc --noEmit` and `bun run build` pass. `bun run lint` is not a gate yet (261101-iim).
- `prisma/schema.prisma` is untouched (`git diff --stat` shows no prisma path).
</verification>

<success_criteria>
- Every formula for attribute totals, vitality stages, max Berkana, skill totals, skill points and XP to next level is defined only in `lib/calculations/index.ts`.
- The sheet shows identical numbers for every level 0-99 (oracle). PD-02 keeps the attributes-modal value unchanged.
- Every HEAD lib/calculations export and every output of both hooks returns its HEAD value (oracle).
- Both HEAD skill-point pools keep their values under their own names (PD-01). The skills tab uses calculateTotalSkillPoints, (level + 1) x 10. calculateAvailableSkillPoints, validateSkillDistribution and both hooks use calculateLevelUpSkillPoints, level x 10.
- The tsc and build gates are green.
</success_criteria>

<output>
Create `.planning/quick/261101-iif-unify-game-formulas-calc-01-lib-calculations-index-ts-is-the/261101-iif-SUMMARY.md` with `status: complete` in its frontmatter. It must record:
(1) PD-01, PD-02 and PD-03 and their consequences.
(2) The full list of the 10 new lib/calculations exports, which 261101-iig must cover with tests, each with its HEAD counterpart and samples from the interfaces block. State that no existing export changed value: calculateAvailableSkillPoints and validateSkillDistribution still use the level x 10 pool, through calculateLevelUpSkillPoints.
(3) The hook call-site grep result from Task 3.
(4) Open questions for the owner, not acted on: the attributes modal omits the attribute level bonus; SKILLS keys (accented/variant, e.g. `atuação`, `ataqueSupresa`) differ from lib/defaults and getDefaultSkills keys (`atuacao`, `ataqueSurpresa`); two skill-point pools coexist (PD-01): the skills tab shows (level + 1) x 10, which counts level 0, while calculateAvailableSkillPoints, validateSkillDistribution and both hooks use level x 10, so which one is the game rule?; useCalculateDerivedStats returns NaN for partial attribute, vitality or skill entries and throws on a null skill entry (HEAD behavior, kept), while useCalculatedStats normalizes them to 0.
(5) Which files were skipped because 261101-iie already removed the target, if any.
(6) The normalization semantics (PD-03):
   - toAttributeValue, toSkillValue and toVitalityBase turn undefined, null, NaN, 0, '' and false fields into 0 (the `|| 0` rule, so NaN becomes 0), and a nullish or non-object raw into all zeros.
   - List where they are applied. They go only where HEAD had a `|| 0` fallback, so no call site changed from NaN to a number.
   - The scope of `skillPoints.used`: the skills tab sums SKILLS keys only, while both hooks sum every stored key, including lib/defaults' unaccented keys such as `atuacao` and `ataqueSurpresa`. This is unchanged from HEAD, so a hook's `used` can differ from the tab's.
(7) The parity-oracle output:
   - Task 1 Step 1: the non-zero exit and the list of missing-export names.
   - Tasks 1, 2 and 3: the final "PARITY OK <n> checks" line, with the check count.
   - Any hook printed as skipped.
(8) The scope note for Task 2: one task edited 5 component files, accepted within the per-task limit. Name any file that needed rework.
Do not commit the parity oracle or its legacy copies.
</output>
