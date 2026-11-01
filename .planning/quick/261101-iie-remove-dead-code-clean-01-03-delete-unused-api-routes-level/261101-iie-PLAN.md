---
phase: 261101-iie
plan: 01
type: execute
wave: 1
depends_on: []
# Scope note: 8 of the 15 files_modified entries (the components/ui/*.tsx files, also listed in files_deleted) are whole-file git rm deletions with no content to load; only 7 files are actually edited.
files_modified:
  - "package.json"
  - "bun.lock"
  - "components/ui/calendar.tsx"
  - "components/ui/carousel.tsx"
  - "components/ui/chart.tsx"
  - "components/ui/command.tsx"
  - "components/ui/drawer.tsx"
  - "components/ui/form.tsx"
  - "components/ui/input-otp.tsx"
  - "components/ui/resizable.tsx"
  - "app/api/[[...route]]/characters/index.ts"
  - "lib/api/queries.ts"
  - "lib/schemas/calculations.ts"
  - "lib/store/character.ts"
  - "components/ui/editable-field.tsx"
files_deleted:
  - "components/ui/calendar.tsx"
  - "components/ui/carousel.tsx"
  - "components/ui/chart.tsx"
  - "components/ui/command.tsx"
  - "components/ui/drawer.tsx"
  - "components/ui/form.tsx"
  - "components/ui/input-otp.tsx"
  - "components/ui/resizable.tsx"
autonomous: true
requirements: [CLEAN-01, CLEAN-02, CLEAN-03]

must_haves:
  truths:
    - "The characters Hono router registers exactly five routes — GET /, GET /:id, POST /, PUT /:id, DELETE /:id — so the eight level-up/calculate/validate/recalculate endpoints no longer exist (CLEAN-01)"
    - "No client hook, type import or request/response schema for the removed endpoints remains; useCalculateDerivedStats, useCalculatedStats and lib/calculations are untouched (they belong to 261101-iif / 261101-iig)"
    - "attributeValueSchema, vitalityBaseSchema, vitalityLevelsSchema and skillValueSchema are still exported, unchanged, from lib/schemas/calculations.ts for reuse by 261101-iih"
    - "The Zustand store state is exactly {cancelEditing, character, editingField, reset, setCharacter, startEditing}: no simulated setTimeout save, no pending-changes state (CLEAN-02)"
    - "Every EditableField save goes through onSave or useUpdateCharacter -> PUT /api/characters/:id; characterId is a required prop, so the old silent store path cannot be reached"
    - "The 10 listed packages plus their peer-only companion @hookform/resolvers are gone from package.json and bun.lock, the 8 components/ui files that imported them are deleted, and bun install --frozen-lockfile, npx tsc --noEmit and bun run build all pass (CLEAN-03)"
  artifacts:
    - path: "app/api/[[...route]]/characters/index.ts"
      provides: "CRUD-only characters router (list, get, create, update, delete)"
      contains: "export default app"
    - path: "lib/schemas/calculations.ts"
      provides: "Reusable per-field Zod schemas (attribute value, vitality base, vitality levels, skill value)"
      contains: "export const skillValueSchema"
    - path: "lib/store/character.ts"
      provides: "Inline-edit UI state (which field is being edited) plus the character slot read by useCalculatedStats"
      contains: "export const useIsFieldEditing"
    - path: "components/ui/editable-field.tsx"
      provides: "Inline editable field that persists only through the real update mutation"
      contains: "updateCharacterMutation.mutateAsync"
    - path: "bun.lock"
      provides: "Bun lockfile consistent with package.json"
  key_links:
    - from: "lib/api/client.ts"
      to: "app/api/[[...route]]/route.ts"
      via: "hc<AppType> typed RPC client; removing server routes and client hooks together keeps npx tsc --noEmit green"
      pattern: "hc<AppType>"
    - from: "components/ui/editable-field.tsx"
      to: "lib/api/queries.ts"
      via: "handleSave -> useUpdateCharacter().mutateAsync -> PUT /api/characters/:id"
      pattern: "updateCharacterMutation\\.mutateAsync"
    - from: "components/ui/editable-field.tsx"
      to: "lib/store/character.ts"
      via: "startEditing / cancelEditing / useIsFieldEditing for edit-mode UI state only"
      pattern: "useIsFieldEditing"
---

<objective>
Remove the dead code in CLEAN-01, CLEAN-02 and CLEAN-03:
- the eight unused calculation and level-up API routes, plus their client hooks and route schemas
- the simulated (setTimeout) save path in the Zustand store and EditableField's fallback to it
- ten never-imported npm packages and the eight shadcn `components/ui` files that were their only importers

Users see no change: list, create, open, edit and delete keep working, and every derived number stays the same, because `lib/calculations` is not touched.

Purpose: this is the first step of milestone v1.1 Phase 1 (ROADMAP: "delete dead code, then unify formulas, then write tests"). Sibling items 261101-iif (formulas), 261101-iih/iii (API) and 261101-iij (EditableField hooks) then work on smaller files.

Output: a CRUD-only characters router; a slimmed `lib/api/queries.ts`; `lib/schemas/calculations.ts` reduced to its four reusable per-field schemas; a store holding only edit-UI state; an EditableField that saves only through the real API; a pruned `package.json` with a `bun.lock` that matches it.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/codebase/CONCERNS.md
@app/api/[[...route]]/characters/index.ts
@lib/api/queries.ts
@lib/schemas/calculations.ts
@lib/store/character.ts
@components/ui/editable-field.tsx

Facts established at planning time (HEAD 832fa9b). Re-check them in Task 1; do not assume them blindly:
- The only importers of the 10 listed packages are `components/ui/{calendar,carousel,chart,command,drawer,form,input-otp,resizable}.tsx`. Nothing in app/, components/, lib/, hooks/ or providers/ imports those 8 files.
- `@hookform/resolvers` is never imported. Its bun.lock entry declares `react-hook-form` as a peerDependency, and Bun auto-installs peers, so `react-hook-form` stays in bun.lock unless `@hookform/resolvers` is removed too.
- The committed `bun.lock` is stale. It still pins `next@15.4.4`, while package.json asks for `^16.0.7`: commit 498bcad updated only package-lock.json. Any Bun install therefore re-resolves `next` to the newest 16.x (16.4.3 at planning time) and moves sharp to 0.35.x. A scratch export of HEAD was tested at planning time: removing the 11 packages and the 8 files, then running `npx tsc --noEmit` and `bun run build`, both PASSED on next 16.4.3. The lockfile header (lockfileVersion 1, configVersion 0) did not change.
- All 57 EditableField / EditableNumberField / EditableTextArea call sites (basic-info-tab, skills-kit-tab, spells-talents-tab) pass `characterId={characterId}`, typed `string` in `CharacterTabProps`. None passes `onSave`.
- Store members with no reader outside lib/store/character.ts: pendingChanges, addPendingChange, savePendingChanges, clearPendingChanges, saveField, updateField, isSaving, isLoading, setLoading, error, setError, setCharacter, useHasPendingChanges, useFieldValue, useCalculatedStats. EditableField reads `saveField`, `error` and `isSaving` only for its fallback path.
- Baselines at HEAD: `npx tsc --noEmit` exits 0 and `bun run build` exits 0 (with a pre-existing deprecated-middleware warning that 261101-iim fixes).
- The executor's worktree has no `node_modules` and no `.env`. Task 1's Bun commands create node_modules and run `prisma generate` via postinstall. The build needs no database.
- The lockfile header at HEAD is lines 2-3 of bun.lock: `"lockfileVersion": 1,` and `"configVersion": 0,`. The planning host ran Bun 1.3.2, and the scratch test kept this header unchanged.
- Batch ordering: this item runs first, so `depends_on` stays empty. Every sibling whose files overlap this plan's files (iif, iig, iih, iii, iij, iim, iin) depends on 261101-iie, directly or transitively. 261101-iig and 261101-iim also change package.json and bun.lock. Siblings rebase on this item's commits and regenerate bun.lock with `bun install` instead of hand-merging it. This executor does not need to coordinate with them.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove the never-imported packages and their components/ui files, and sync bun.lock (CLEAN-03)</name>
  <files>package.json, bun.lock, components/ui/calendar.tsx, components/ui/carousel.tsx, components/ui/chart.tsx, components/ui/command.tsx, components/ui/drawer.tsx, components/ui/form.tsx, components/ui/input-otp.tsx, components/ui/resizable.tsx</files>
  <action>
1. Verify usage before deleting, as the item description requires. Search app, components, lib, hooks and providers for:
   - imports of each package: @hono/zod-openapi, @scalar/hono-api-reference, recharts, embla-carousel-react, react-day-picker, input-otp, vaul, react-resizable-panels, cmdk, react-hook-form, @hookform/resolvers
   - imports of the 8 shadcn modules: components/ui/calendar, carousel, chart, command, drawer, form, input-otp, resizable (both the @/components/ui/... alias and relative ./... forms)

   Expected result: each package is imported only by its own file among those 8, and nothing imports the 8 files. If the tree has changed and any other importer exists, STOP and report it as a blocker. Do not delete a file or package that is still in use.

2. Delete the 8 files with git rm: components/ui/calendar.tsx, carousel.tsx, chart.tsx, command.tsx, drawer.tsx, form.tsx, input-otp.tsx, resizable.tsx.

3. Remove the packages with a single `bun remove` call naming the 10 CLEAN-03 packages plus @hookform/resolvers. This updates the package.json dependencies and bun.lock together and installs node_modules.
   - Claude's discretion, @hookform/resolvers: it is never imported and is only a peer-dependent plugin of react-hook-form. Keeping it would make Bun re-install react-hook-form as an auto-installed peer, so CLEAN-03 would not actually be met.

4. Check the lockfile header right after `bun remove`. Lines 2-3 of bun.lock must still read `"lockfileVersion": 1,` and `"configVersion": 0,`; this is the header gate in `<verify>`. If the local Bun version rewrote either value, or dropped either key:
   - STOP before any further step and before any commit.
   - Do NOT hand-edit bun.lock back, and do NOT install a different Bun version.
   - Report it as a blocker. Include the output of `bun --version` and of `head -n 5 bun.lock`.
   - Why: a header bump would push the newer lockfile format onto every sibling item and every contributor. This item is not authorized to make that change.

5. Run `bun install --frozen-lockfile` to prove the lockfile is settled.

Lockfile re-resolution is expected and accepted: the committed bun.lock is stale (see context), and the item description says to update bun.lock via bun install.
- Do NOT change any version range in package.json.
- Do NOT add or upgrade any other package.
- Do NOT hand-edit bun.lock.
- Record the resolved next version in the SUMMARY: read `"version"` from node_modules/next/package.json.

Out of scope for this task; leave these alone:
- package-lock.json: 261101-iim deletes it under TOOL-02.
- The other unused shadcn/Radix files and packages listed in CONCERNS.md (accordion, avatar, sidebar, next-themes, etc.): CLEAN-03 names only these 10 packages.
- date-fns: it is used outside components/ui.
- @hono/zod-validator: the routes use it.

Package manager is Bun. Do not use npm install.

If `bun run build` fails, find out whether the cause is the deletions or the re-resolved Next/sharp versions. Do not pin or downgrade versions to work around a version-caused failure. Report it as a blocker with the build output.
  </action>
  <verify>
    <automated>test "$(ls components/ui/{calendar,carousel,chart,command,drawer,form,input-otp,resizable}.tsx 2>/dev/null | wc -l)" -eq 0 && ! grep -qE '"(@hono/zod-openapi|@scalar/hono-api-reference|recharts|embla-carousel-react|react-day-picker|input-otp|vaul|react-resizable-panels|cmdk|react-hook-form|@hookform/resolvers)"' package.json bun.lock && head -n 3 bun.lock | grep -qE '^  "lockfileVersion": 1,$' && head -n 3 bun.lock | grep -qE '^  "configVersion": 0,$' && grep -q '"date-fns"' package.json && grep -q '"@hono/zod-validator"' package.json && bun install --frozen-lockfile && npx tsc --noEmit && bun run build</automated>
  </verify>
  <reversibility rating="reversible">git revert restores the 8 files, package.json and bun.lock. The lockfile re-sync to a newer Next 16 minor was requested in the item description ("update bun.lock via bun install"), so it is already settled and needs no checkpoint.</reversibility>
  <done>
- The 8 components/ui files no longer exist.
- None of the 11 package names appears in package.json or bun.lock (baseline at HEAD: 11 matching lines in package.json, 22 in bun.lock).
- date-fns and @hono/zod-validator are still dependencies.
- The bun.lock header still reads `"lockfileVersion": 1,` and `"configVersion": 0,`. This is an invariant gate: it passes at HEAD and must still pass after `bun remove`. If it fails, the task halts with a blocker report and bun.lock is not hand-edited.
- `bun install --frozen-lockfile`, `npx tsc --noEmit` and `bun run build` exit 0.
- The resolved next version is noted for the SUMMARY.
  </done>
</task>

<task type="auto">
  <name>Task 2: Delete the eight dead calculation/level-up routes, their client hooks and their route schemas (CLEAN-01)</name>
  <files>app/api/[[...route]]/characters/index.ts, lib/api/queries.ts, lib/schemas/calculations.ts</files>
  <action>
**Server router (app/api/[[...route]]/characters/index.ts):**
- Delete the eight chained POST handlers that follow the DELETE /:id handler: /:id/level-up, /:id/calculate-vitality, /:id/calculate-berkana, /:id/validate-skills, /:id/calculate-attributes, /:id/calculate-xp, /:id/calculate-skill-points and /:id/recalculate. The chain must end with the delete handler, followed directly by the existing default export of app.
- Delete the import block from @/lib/schemas/calculations.
- Delete the import block from @/lib/calculations. Every name it imports (processLevelUp, calculateVitalityLevels, calculateMaxBerkana, validateSkillDistribution, calculateAllAttributes, calculateAllSkills, getXPRequiredForNextLevel, getTotalXPForLevel, calculateAvailableSkillPoints, calculateUsedSkillPoints, getSkillPointsPerLevel) is used only by the removed handlers.
- Leave the five CRUD handlers (GET /, GET /:id, POST /, PUT /:id, DELETE /:id) and the remaining imports byte-identical. 261101-iih and 261101-iii edit GET / and PUT /:id after this lands.

**Client hooks (lib/api/queries.ts):**
- Delete these hooks together with their section banners: useLevelUpCharacter, useCalculateVitality, useCalculateBerkana, useValidateSkills, useCalculateAttributes, useCalculateXP, useCalculateSkillPoints and useRecalculateCharacter.
- Delete the type-only import block from @/lib/schemas/calculations.
- Keep these unchanged: useCharacters, useCharacter, useCreateCharacter, useUpdateCharacter, useDeleteCharacter, and the existing @ts-ignore lines on the hooks that stay.
- Keep useCalculateDerivedStats exactly as it is, along with its useMemo import. Replacing its formulas is CALC-01 work owned by 261101-iif.

**Schemas (lib/schemas/calculations.ts):**
- Keep attributeValueSchema, vitalityBaseSchema, vitalityLevelsSchema and skillValueSchema in this file, with names and shapes unchanged.
  - Claude's discretion, keep rather than relocate: 261101-iih rewrites updateCharacterSchema in lib/schemas/character.ts. Keeping the four schemas here avoids a second item editing that file, and iih can import them from @/lib/schemas/calculations.
- Delete every route request/response schema: the levelUp, calculateVitality, calculateBerkana, validateSkills, calculateAttributes, calculateXP, calculateSkillPoints and recalculateCharacter request and response objects.
- Delete the exported type-alias block at the bottom.
- Reword the remaining section banner in pt-BR so it says these are per-field schemas reused for character data validation. Example: SCHEMAS POR CAMPO (reutilizados na validação dos dados do personagem).

**Constraints:**
- Do not edit lib/calculations/index.ts. Its XP and level-up helpers stay exported because 261101-iif and 261101-iig own that module and CALC-02 tests every export.
- Do not edit lib/api/client.ts or app/api/[[...route]]/route.ts. AppType narrows on its own.
- Do not leave comments that mention the removed endpoints or hooks.
- Follow each file's existing quote and semicolon style.
  </action>
  <verify>
    <automated>! grep -qE 'level-up|calculate-(vitality|berkana|attributes|xp|skill-points)|validate-skills|recalculate|schemas/calculations|lib/calculations' "app/api/[[...route]]/characters/index.ts" && ! grep -qE 'useLevelUpCharacter|useCalculate(Vitality|Berkana|Attributes|XP|SkillPoints)\b|useValidateSkills|useRecalculateCharacter|schemas/calculations' lib/api/queries.ts && grep -q 'export const useCalculateDerivedStats' lib/api/queries.ts && ! grep -qE 'RequestSchema|ResponseSchema|^export type' lib/schemas/calculations.ts && grep -q '^export const attributeValueSchema = z\.object' lib/schemas/calculations.ts && grep -q '^export const vitalityBaseSchema = z\.object' lib/schemas/calculations.ts && grep -q '^export const vitalityLevelsSchema = z\.object' lib/schemas/calculations.ts && grep -q '^export const skillValueSchema = z\.object' lib/schemas/calculations.ts && npx tsc --noEmit && bun -e "const m = await import('./app/api/[[...route]]/characters/index.ts'); const got = [...new Set(m.default.routes.map(r => r.method + ' ' + r.path))].sort().join(','); console.log(got); if (got !== 'DELETE /:id,GET /,GET /:id,POST /,PUT /:id') process.exit(1)"</automated>
  </verify>
  <done>
- The router's unique route set is exactly DELETE /:id, GET /, GET /:id, POST /, PUT /:id. At HEAD it also had the 8 POST routes, so the bun route-table check exits 1 there.
- The removed hooks, the calculation imports and the route schemas are gone. Baseline grep counts at HEAD: 13 in the router, 9 in queries.ts, 32 in calculations.ts.
- The 4 per-field schemas remain.
- useCalculateDerivedStats remains.
- `npx tsc --noEmit` exits 0.
  </done>
</task>

<task type="auto">
  <name>Task 3: Remove the simulated save path from the Zustand store and EditableField's store fallback (CLEAN-02)</name>
  <files>lib/store/character.ts, components/ui/editable-field.tsx</files>
  <action>
**Store (lib/store/character.ts), keeping only state that is actually used:**
- Remove the following from the CharacterState interface, the initial state and the implementation:
  - pendingChanges, addPendingChange, savePendingChanges and clearPendingChanges (the batch-save simulation)
  - saveField (the single-field save simulation; both simulations only awaited a timer)
  - isSaving: only those two simulations ever wrote it
  - updateField: its only caller was EditableField's fallback, and it also mutated nested state in place
  - isLoading/setLoading and error/setError: nothing reads them once the fallback is gone
  - the useHasPendingChanges and useFieldValue selectors: neither has a call site
- Drop the error reset from the startEditing, cancelEditing and setCharacter set calls.
- reset() must reset only character and editingField to null.

**Keep in the store:**
- the EditingField interface and the startEditing(section, field, currentValue) signature, both unchanged, because components/ui/editable-scaling-field.tsx calls startEditing and must not need edits
- editingField, cancelEditing, useIsFieldEditing and reset
- character and setCharacter
- useCalculatedStats, byte-identical. Its formulas are CALC-01 work owned by 261101-iif, and it reads state.character, which is the only reason character stays.

**After the change, the sorted keys of useCharacterStore.getState() must be exactly:** cancelEditing, character, editingField, reset, setCharacter, startEditing.

**EditableField (components/ui/editable-field.tsx):**
- Destructure only startEditing and cancelEditing from the useCharacterStore() call, the same pattern as editable-scaling-field.tsx.
- Derive isSaving from updateCharacterMutation.isPending and error from updateCharacterMutation.error?.message, both unconditionally. As a side effect this removes the conditional store-hook call; BUG-01 is still formally verified by 261101-iij.
- Make characterId a required prop in EditableFieldProps (string, no question mark) and update its pt-BR comment to say it is required. All 57 call sites already pass it, so no call-site edits are needed. The type now makes the silent path unreachable, as CONCERNS.md recommends.
- In handleSave, keep the onSave branch first and the buildUpdateData + updateCharacterMutation.mutateAsync path as the only other branch. Delete the store fallback branch entirely.
- Leave these unchanged:
  - buildUpdateData, the render code, EditableNumberField and EditableTextArea
  - EditableAttributeField: its inline level-bonus formula is 261101-iif's job
  - the console.error in the catch block: stray-log cleanup is 261101-iij's job

**Do not touch:**
- components/character/basic-info-tab.tsx, even though its useCharacterStore import is unused. The import is still valid, unused imports are a lint matter for 261101-iim, and 261101-iif and 261101-iin own that file.
- components/ui/editable-scaling-field.tsx.

Do not leave comments that mention the removed store members.
  </action>
  <verify>
    <automated>! grep -qE 'saveField|savePendingChanges|PendingChange|pendingChanges|setTimeout|isSaving|updateField|useFieldValue|setLoading|setError' lib/store/character.ts && grep -q 'export const useCalculatedStats' lib/store/character.ts && grep -q 'export const useIsFieldEditing' lib/store/character.ts && ! grep -qE 'saveField|storeError|state\.isSaving|getState\(\)|updateField' components/ui/editable-field.tsx && grep -qE '^\s+characterId: string' components/ui/editable-field.tsx && npx tsc --noEmit && bun -e "const { useCharacterStore } = await import('./lib/store/character.ts'); const got = Object.keys(useCharacterStore.getState()).sort().join(','); console.log(got); if (got !== 'cancelEditing,character,editingField,reset,setCharacter,startEditing') process.exit(1)" && bun run build</automated>
    <human-check>
      <test>Run bun run dev and open a throwaway test character at /character/[id]. The save writes to the database DATABASE_URL points at, so use a test character. Turn on edit mode, click a basic field (e.g. Divindade), change it and press Enter. Then reload the page.</test>
      <expected>A spinner appears briefly. The field leaves edit mode showing the new value, and the new value is still there after the reload, so it was persisted through PUT /api/characters/:id. Escape cancels without saving.</expected>
      <why_human>An end-to-end save needs a running app and a live database. The automated gates prove only the code path and the types.</why_human>
    </human-check>
  </verify>
  <done>
- The store state keys are exactly cancelEditing, character, editingField, reset, setCharacter, startEditing. At HEAD there were 17 keys, so the bun check exits 1 there.
- No simulated save or pending-changes code remains. Baseline grep count at HEAD: 38.
- EditableField has no store fallback, no conditional hook call, and a required characterId. Baseline grep count at HEAD: 5 fallback matches and 0 required-prop matches.
- `npx tsc --noEmit` and `bun run build` exit 0.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser → /api/characters/* | The API is unauthenticated by owner decision (accepted; do not add auth). Every registered route is reachable by anyone who can reach the deployment. |
| npm registry → bun.lock / node_modules | Task 1 re-resolves the stale lockfile, pulling package versions from the public registry. |
| EditableField → persistence | User edits must reach the database through the real API, not a client-only simulation. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-261101-iie-01 | Tampering | POST /api/characters/:id/level-up (unauthenticated write of level/currentXP/maxBerkana) | medium | mitigate | Task 2 deletes the handler. The bun route-table check proves only the 5 CRUD routes remain. |
| T-261101-iie-02 | Denial of Service | The 7 calculate/validate/recalculate POST routes, each doing an unauthenticated DB lookup | low | mitigate | Task 2 deletes them. Same route-table check. |
| T-261101-iie-03 | Information Disclosure | level-up error path returning the raw error.message to clients | low | mitigate | Removed together with the handler in Task 2. The remaining CRUD handlers already return fixed messages. |
| T-261101-iie-04 | Tampering | Simulated store save reporting success without persisting (silent data loss) | medium | mitigate | Task 3 deletes the simulated actions and the fallback branch, and makes characterId required at the type level. The store-keys check and tsc enforce this. |
| T-261101-iie-05 | Tampering | Lockfile re-resolution moves next to the newest 16.x and sharp to 0.35.x | medium | mitigate | No version range changes and no new packages; only removals. bun.lock carries registry integrity hashes; `bun install --frozen-lockfile`, tsc and build gate the result; the Task 1 header gate halts on any lockfileVersion/configVersion rewrite; the resolved next version is recorded in the SUMMARY. Tested in a scratch export at planning time (next 16.4.3: tsc and build pass). |
| T-261101-iie-SC | Tampering | bun remove / bun install | high | mitigate | Package-legitimacy gate: this plan adds NO package, so there are no [ASSUMED]/[SUS] packages and no blocking human checkpoint is needed. Only the 11 named packages are removed. Any other dependency change in the diff besides lockfile re-resolution of existing ranges is a blocker. |
</threat_model>

<verification>
Run from the repository root after all three tasks:
- `npx tsc --noEmit` exits 0.
- `bun run build` exits 0. The pre-existing deprecated-middleware warning is expected; 261101-iim handles it.
- `bun install --frozen-lockfile` exits 0.
- The route-table check from Task 2 prints exactly DELETE /:id,GET /,GET /:id,POST /,PUT /:id.
- The store-keys check from Task 3 prints exactly cancelEditing,character,editingField,reset,setCharacter,startEditing.
- `git status --short` and `git diff --stat HEAD` list only paths in files_modified and files_deleted. Ignore node_modules, .next and lib/generated, which are gitignored.
- `git diff HEAD -- lib/calculations prisma lib/schemas/character.ts lib/constants components/character components/ui/editable-scaling-field.tsx` is empty. Formulas, the Prisma schema and sibling-owned files are untouched, so derived numbers stay identical.
</verification>

<success_criteria>
- CLEAN-01: the 8 routes (level-up, calculate-vitality, calculate-berkana, validate-skills, calculate-attributes, calculate-xp, calculate-skill-points, recalculate), their 8 client hooks and their request/response schemas are removed. The 4 reusable per-field schemas remain in lib/schemas/calculations.ts.
- CLEAN-02: the simulated saveField/savePendingChanges and the pending-changes state are gone from the Zustand store, which keeps only state that is used. EditableField has no store fallback and always persists through the real API.
- CLEAN-03: the 10 listed packages (plus @hookform/resolvers, their peer-only companion) and the 8 components/ui files that depended on them are removed. bun.lock is updated through Bun and consistent with package.json. bun install and bun run build succeed.
- Behaviour is unchanged: list, create, open, edit and delete still work, and lib/calculations is untouched.
- Project constraints are respected: no authentication added, no Prisma schema or column change, Bun as package manager, lint not used as a gate.

## Source Coverage Audit

| SOURCE | ID | Item | Task | Status |
|--------|----|------|------|--------|
| REQ | CLEAN-01 | Remove 8 unused routes, client hooks, route schemas | 2 | COVERED |
| REQ | CLEAN-02 | Remove simulated saves + pending-changes state; keep only used state | 3 | COVERED |
| REQ | CLEAN-03 | Remove 10 never-imported deps + dependent components/ui files; bun.lock via Bun | 1 | COVERED |
| GOAL | Phase 1 (dead-code half) | "codebase contains only code that is actually used" | 1-3 | COVERED (formula unification and tests belong to 261101-iif / 261101-iig) |
| CONTEXT | ROADMAP note | Keep or relocate attributeValueSchema, vitalityBaseSchema, vitalityLevelsSchema, skillValueSchema | 2 | COVERED (kept in place) |
| CONTEXT | Catalog | "verify usage before deleting" | 1 (step 1), 2 and 3 via tsc | COVERED |
| CONTEXT | Project | No auth; Prisma columns unchanged; numbers identical; Bun; lint not a gate | all | COVERED (constraints honoured, no task violates them) |
| RESEARCH | — | No RESEARCH.md for quick-batch items | — | N/A |
</success_criteria>

<output>
Create `.planning/quick/261101-iie-remove-dead-code-clean-01-03-delete-unused-api-routes-level/261101-iie-SUMMARY.md` when done. It must record:
1. The resolved next version after the bun.lock sync, and that the previous bun.lock was stale (it pinned next 15.4.4).
2. That package-lock.json is now out of sync with package.json until 261101-iim deletes it (TOOL-02).
3. For 261101-iij: EditableField's conditional store-hook call no longer exists, because isSaving and error now come only from the mutation. BUG-01 needs verification, not a re-fix. The store no longer has isSaving or error.
4. For 261101-iih: the four per-field schemas are still exported from @/lib/schemas/calculations.
5. For 261101-iif: useCalculatedStats, useCalculateDerivedStats and the inline formula in EditableAttributeField were deliberately left untouched for CALC-01.
6. For every dependent sibling, especially 261101-iig and 261101-iim, which also change package.json: rebase on this item's commits. If bun.lock conflicts, regenerate it with `bun install` rather than hand-merging it. Also record the `bun --version` used and confirm the lockfile header was unchanged.
</output>
