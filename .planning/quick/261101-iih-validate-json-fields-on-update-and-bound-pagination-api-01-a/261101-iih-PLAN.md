---
phase: quick-261101-iih
plan: 01
type: execute
quick_id: 261101-iih
wave: 3                     # advisory; recomputed by `quick-batch update` from depends_on + files_modified
depends_on: ["261101-iie", "261101-iig"]
files_modified:
  - "lib/schemas/character.ts"
  - "app/api/[[...route]]/characters/index.ts"
  - "lib/schemas/character.test.ts"
  - "app/api/[[...route]]/characters/index.test.ts"
autonomous: true
requirements: [API-01, API-03]

must_haves:
  truths:
    - "PUT /api/characters/:id whose body has a wrong-typed JSON field (weapons as an object, attributes as a string, finances.ouro as a string, spells as a string, a fourth weapon) answers 400 with JSON { error: 'Dados inválidos', issues: [{ path, message }] } and never reaches Prisma"
    - "The 400 hook is one named, exported constant (invalidJsonHook) in the route file, so 261101-iii passes the same hook to its extended PUT schema instead of re-implementing it"
    - "The route test replaces @/lib/db with a stub that throws on any access, before it loads the route. It therefore asserts that no DB access happens, never reaches a real database, and passes in the same `bun test` process as 261101-iii's mock.module('@/lib/db') route tests in either file order"
    - "Every shape the UI writes today for attributes, vitality, currentVitality, skills, weapons, armor, adventureKit, finances, languages, spells and talents passes updateCharacterSchema, including getDefaultCharacterData() output, DEFAULT_ADVENTURE_KIT, sparse weapons [null, null, {...}], partial nested entries, languages.custom as an array or as an index-keyed object, spells with {base, perLevel} or legacy string/number damage and duration, talents with or without oncePerDay/usedToday, and negative currentVitality stages"
    - "Unknown or legacy keys inside JSON fields (weapon observations, damage.percent25, spell preparationTime) survive validation unchanged, so a save never strips stored data"
    - "GET /api/characters clamps page to 1..10000 and limit to 1..100; missing or non-numeric values fall back to page 1 and limit 10, so there is no negative offset, no NaN and no whole-table response"
    - "GET /api/characters/:id and the PUT response still accept any stored row, because characterFullSchema keeps its permissive JSON fields"
  artifacts:
    - path: "lib/schemas/character.ts"
      provides: "Tolerant Zod schemas for the 11 JSON columns, used by updateCharacterSchema, plus the clamped getCharactersQuerySchema"
      contains: "catchall"
    - path: "app/api/[[...route]]/characters/index.ts"
      provides: "Exported invalidJsonHook (400 with { error: 'Dados inválidos', issues }) used as the third argument of the PUT /:id json validator"
      contains: "export const invalidJsonHook"
    - path: "lib/schemas/character.test.ts"
      provides: "bun:test suite for tolerance, rejection, key preservation and pagination clamping"
      contains: "getDefaultCharacterData"
    - path: "app/api/[[...route]]/characters/index.test.ts"
      provides: "Route-level test with @/lib/db mocked by a throwing stub, showing a malformed PUT body returns 400 with no DB access"
      contains: "mock.module('@/lib/db'"
  key_links:
    - from: "app/api/[[...route]]/characters/index.ts"
      to: "lib/schemas/character.ts"
      via: "zValidator('json', updateCharacterSchema, invalidJsonHook) on PUT /:id"
      pattern: "zValidator\\('json', updateCharacterSchema, invalidJsonHook\\)"
    - from: "app/api/[[...route]]/characters/index.test.ts"
      to: "app/api/[[...route]]/characters/index.ts"
      via: "mock.module('@/lib/db', …) runs before the top-level await import('./index'), so the route binds the stub and never a real PrismaClient"
      pattern: "await import\\('\\./index'\\)"
    - from: "lib/schemas/character.ts"
      to: "per-field schemas kept by 261101-iie (attributeValueSchema, vitalityBaseSchema, vitalityLevelsSchema, skillValueSchema)"
      via: ".partial().catchall(jsonExtra) composition"
      pattern: "skillValueSchema\\.partial\\(\\)"
    - from: "lib/schemas/character.test.ts"
      to: "lib/defaults/character.ts"
      via: "getDefaultCharacterData() fixture must pass updateCharacterSchema"
      pattern: "getDefaultCharacterData"
---

<objective>
Replace the eleven permissive JSON-field validators in `updateCharacterSchema` with real Zod schemas. The new schemas must accept every shape the UI writes today and every legacy shape a production row can hold, and reject structurally malformed data with HTTP 400 (API-01). Also clamp `GET /api/characters` pagination (API-03).

Purpose: Prisma currently stores whatever arrives on PUT. Wrong-typed JSON (a string where a number is expected, an object where an array is expected) silently corrupts derived numbers or crashes `.map` in the sheet. `?limit=1000000` returns the whole table, and `?page=0` or `?page=abc` produces a negative or NaN offset.

Output: tolerant field schemas plus the clamped query schema in `lib/schemas/character.ts`, a 400 hook on the PUT json validator, and two bun:test files.

Constraints from project decisions: no authentication (do not add any). Prisma column types and `prisma/schema.prisma` must not change, so no schema push is needed. Derived numbers and UI behavior stay identical, and no component file is edited. `characterFullSchema` and the response schemas keep their permissive JSON fields so existing rows keep loading.

Definition of done for this item: `npx tsc --noEmit`, `bun test` and `bun run build`. `bun run lint` is explicitly deferred to the end of the batch. At HEAD the script is `next lint`, which Next 16 removed, and no ESLint config exists, so lint cannot pass for any item until 261101-iim adds `eslint.config.mjs` and `"lint": "eslint ."`. 261101-iim lists this item in its `depends_on`, so it lints and fixes the post-batch tree, including these four files. 261101-iin then reruns lint as the final gate.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.claude/CLAUDE.md
@lib/schemas/character.ts
@app/api/[[...route]]/characters/index.ts
@lib/defaults/character.ts

<planner_hooks>
- assumption-delta: not applicable. This is a quick-batch item with no ROADMAP phase section, so the probe was skipped. No identity-model change is involved.
- schema-gate: no schema files are in scope. `prisma/schema.prisma` MUST NOT be edited, so no `prisma db push` task is needed.
- security: `<threat_model>` included (ASVS L1, block on high).
</planner_hooks>

<interfaces>
Facts verified during planning (zod 4.0.10, @hono/zod-validator 0.7.2, bun 1.3.2, Prisma 6.12.0):

- `@hono/zod-validator` 0.7.2 calls `hook({ data, ...result, target }, c)` as the third argument of `zValidator(target, schema, hook)`. If the hook returns a Response, that Response is sent. Without a hook, the validator sends `c.json(result, 400)`, whose body is `{ success: false, error: { name: 'ZodError', message: '<json string>' } }`. `useUpdateCharacter` in `lib/api/queries.ts` does `throw new Error(error.error || 'Failed to update character')`. With the default body, `error.error` is an object, so the UI would show "[object Object]".
- Zod 4 has `z.json()` (any JSON value), `.catchall(schema)`, `.partial()` and `.loose()`. Typing extra keys through `.loose()` or `.passthrough()` infers `[k: string]: unknown`. That type is NOT assignable to Prisma's `InputJsonValue`, so `db.character.update({ data: updates })` fails `tsc` (reproduced). `z.object(shape).catchall(z.json())` compiles against `Prisma.CharacterUpdateInput` with no cast and keeps unknown keys at runtime (reproduced: a legacy weapon with `observations` and `damage.percent25` round-trips byte-identical).
- The default `z.object()` strip mode would delete unknown keys from the parsed output, and the route writes that output to Prisma. That would delete legacy data on the next save, so never use strip mode for JSON-field objects.
- The characters sub-app (`export default app` at the end of `app/api/[[...route]]/characters/index.ts`) can be exercised in Bun with `app.request('/some-id', { method: 'PUT', headers: { 'content-type': 'application/json' }, body })`. A malformed body returns 400 before any DB access. A valid body or any GET reaches the handler's `db` calls, so route tests in this plan send only malformed bodies.
- `bun test` behavior (Bun 1.3.2), verified in a scratch reproduction with the real route module. All test files run in one process with one shared module registry. `mock.module` is NOT scoped per file: a mock persists into later files. When the target module is already loaded, its exports are replaced in place, so an importer's live `db` binding follows the newest mock. `mock.module('@/lib/db', factory)` intercepts the tsconfig alias directly. Four scenarios all passed: (route test without a mock, or route test with a throwing-stub mock) combined with (a 261101-iii-style test that mocks `@/lib/db` with a fake and then does `await import(route)`), each run in both file orders. A static `import app from './index'` is hoisted above any `mock.module` call, so the route test must load the route with a top-level `await import('./index')` placed after its mock. Bun auto-loads the developer's env file during `bun test`, which can set a real `DATABASE_URL`. Without the mock, the TDD RED run (where `{ weapons: {} }` still passes the old permissive validator and reaches `db.character.findUnique`) would query that database.
- Hook contract shared with 261101-iii (verified with `npx tsc --noEmit` on a full scratch copy). Declare `export const invalidJsonHook` as a plain arrow function with a structural signature: first parameter `result` typed as the union of `{ success: true }` and `{ success: false; error: z.core.$ZodError }`, and second parameter `c` typed as `Context` (type-only import from 'hono'). With that signature, tsc is clean when the hook is the third argument of `zValidator('json', updateCharacterSchema, invalidJsonHook)` and also of a validator for `updateCharacterSchema.extend({ expectedUpdatedAt: … })`, which is iii's planned shape. `lib/api/queries.ts` also still compiles. Do NOT annotate it as `Hook<unknown, Env, string, 'json', {}, z.ZodType>` from @hono/zod-validator. TS then also infers the validator's schema type from the hook, widens `c.req.valid('json')` to `unknown`, and fails tsc at `db.character.update({ data: updates })` (reproduced). `zValidator` fixes the hook's output type parameter `O` to `{}`, so the hook's 400 response never enters the route's response types or `AppType`.
- `bun test "./app/[[...route]]/..."` accepts bracketed paths when they are quoted with a `./` prefix.
- `GetCharactersQuery` (the output type of `getCharactersQuerySchema`) is used as the parameter type of `useCharacters` in `lib/api/queries.ts` as `{ page: number; limit: number; search?: string }`. Keep the input type `string | undefined` and the output type `number`.
- `UpdateCharacterRequest` (the output type of `updateCharacterSchema`) types `useUpdateCharacter`'s `data`. Callers pass `Record<string, any>` (from `buildUpdateData` and `buildScalingUpdateData`), `{ currentVitality: Record<string, number> }`, `DEFAULT_ADVENTURE_KIT` and `any[]`. All of these were verified to type-check against catchall-based schemas.

Per-field schemas kept by 261101-iie (at HEAD in `lib/schemas/calculations.ts`; 261101-iie may move them into `lib/schemas/character.ts`):
- `attributeValueSchema` = object { race: number, class: number, bonus: number }
- `vitalityBaseSchema` = object { race: number, class: number }
- `vitalityLevelsSchema` = object { notavel, ferido, gravementeFerido, condenado, incapacitado, coma: number }
- `skillValueSchema` = object { distributed: number.min(0), bonus: number }

Shapes the UI writes today (all PUT writers, inspected during planning; `buildUpdateData` is in `components/ui/editable-field.tsx`):
| Field | Writers | Shapes that must pass |
|---|---|---|
| attributes | EditableNumberField `${key}.race/.class/.bonus` (basic-info-tab ~410-445) | record of { race?, class?, bonus? } numbers; partial when the stored record lacks the key |
| vitality | EditableNumberField `race` / `class` (~473-490) | { race?, class? } numbers |
| currentVitality | applyDamage, restoreFullHealth (basic-info-tab 57-133), EditableNumberField per stage (~594) | six stage numbers. restoreFullHealth writes `calculateVitality` output, which is NEGATIVE when race+class < 100 (base 0 gives ferido -20 … coma -100) |
| skills | skills-kit-tab quick add (Math.max(0, …)), EditableNumberField `.distributed` (min 0) and `.bonus` | record of { distributed? >= 0, bonus? } |
| weapons | buildUpdateData only (2- and 3-segment paths, loop i < 3) | array of length <= 3 with null holes (`[null, null, {...}]`); items { name?, level?, damage?: { d25?, d50?, d75?, d100?, critical? } strings, description? }; legacy keys (observations, damage.percent25, …) |
| armor | buildUpdateData single key | { name?, description? } strings; { totalVitality?, currentVitality? } numbers |
| adventureKit | reset to DEFAULT_ADVENTURE_KIT (items WITHOUT isDefault), add { name: '', quantity: 1, isDefault: false }, filter, buildUpdateData | array of { name?, quantity?, isDefault? } |
| finances | EditableNumberField ouro/prata/cobre/imperano/joias | { ouro?, prata?, cobre?, imperano?, joias? } numbers |
| languages | standard checkbox `{...languages, standard: {...}}`, custom add/toggle, EditableField `custom.${index}.name` (~1034) | { standard?: record of booleans, custom?: ARRAY of { name?, known? } OR OBJECT keyed "0","1",… }. The 3-segment buildUpdateData path spreads the custom array into an object, and the standard checkbox re-sends whatever custom holds |
| spells | add (damage { base: 0, perLevel: null }, duration { base: '', perLevel: null }), filter, buildUpdateData, EditableScalingField (perLevel parseInt may be NaN, which serializes as null) | items { name?, type?, concentration?, prepTime?, resistance?, range?, description? } strings; { level?, berkanaCost? } numbers; damage/duration = { base?: number or string, perLevel?: number or null } OR legacy string ('8d6', 'Instantâneo', stored before commit 6e47c62) OR number OR null |
| talents | add { name, level, description, oncePerDay: false, usedToday: false }, map toggles, filter, buildUpdateData | items { name?, description? } strings; level? number; oncePerDay?, usedToday? booleans (absent on talents saved before commit dbe980a) |
</interfaces>
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: End-to-end PUT validation for `weapons` only (schema → hook → 400)</name>
  <files>lib/schemas/character.ts, app/api/[[...route]]/characters/index.ts, lib/schemas/character.test.ts, app/api/[[...route]]/characters/index.test.ts</files>
  <precondition>261101-iie and 261101-iig have landed: `grep -rqs "export const skillValueSchema" lib/schemas` succeeds (or iie's SUMMARY says it removed them), `package.json` has a `test` script, `npx tsc --noEmit` exits 0 before any edit, and `lib/generated/prisma` exists (run `bunx prisma generate` if it is missing; no DB needed).</precondition>
  <read_first>lib/schemas/character.ts, app/api/[[...route]]/characters/index.ts, components/ui/editable-field.tsx (lines 16-142, buildUpdateData), one existing *.test.ts from 261101-iig (to copy its bun:test import style)</read_first>
  <behavior>
    - weaponsFieldSchema accepts [], [null, null, { name: 'Arco' }], [{ damage: { d25: '1d6' } }], and the legacy item { name: 'Espada Longa', level: 25, damage: { percent25: '1d6', critical: '2d12' }, observations: 'Encantada' }. For the legacy item, the parsed output deep-equals the input (unknown keys kept).
    - weaponsFieldSchema rejects {} (object instead of array), ['espada'], [{ level: '25' }], and an array of four items.
    - updateCharacterSchema.safeParse({ weapons: {} }).success is false. updateCharacterSchema.safeParse({ weapons: [null, { name: 'Arco' }] }).success is true.
    - Route: PUT '/qualquer-id' with body { weapons: {} } responds 400. Its JSON has error === 'Dados inválidos', and issues is an array containing an entry whose path starts with 'weapons'.
    - Route: PUT with body { weapons: [{ name: 'SEGREDO-123', level: 'x' }] } responds 400, and the raw response text does not contain 'SEGREDO-123' (no input reflection).
    - Route: after every route test, the mocked db stub's access log is empty (no property of `db` was read).
  </behavior>
  <action>
    Write both test files first and watch them fail. Then implement.

    In lib/schemas/character.ts, add a section banner (`// ====` style, Portuguese title such as CAMPOS JSON) above updateCharacterSchema with a shared `jsonExtra` constant set to the Zod 4 JSON-value schema and a small helper `jsonObject(shape)` that returns `z.object(shape).catchall(jsonExtra)`. Use this helper for every JSON-field object in this plan. Do not use `.loose()` or `.passthrough()`: their `unknown` index signature breaks `tsc` at the Prisma update call. Do not use default strip mode either, because the route writes the parsed output to the row, so stripping would delete legacy keys on the next save. Write a short Portuguese comment explaining the tolerance policy: every declared key optional, unknown keys preserved, type-checked leaves, no range checks beyond the two grounded ones.

    Define and export `weaponDamageSchema` (jsonObject with optional string keys d25, d50, d75, d100, critical), `weaponSchema` (jsonObject with optional name: string, level: number, damage: weaponDamageSchema, description: string) and `weaponsFieldSchema` (array of weaponSchema made nullable, with max 3). Items are nullable because buildUpdateData produces a sparse array when a later weapon slot is edited first, and JSON serialization turns the holes into null. Max 3 holds because buildUpdateData is the only weapons writer and it truncates to indices 0-2, matching the "Array até 3 armas ativas" comment in prisma/schema.prisma.

    In updateCharacterSchema, change only the `weapons` entry to `weaponsFieldSchema.optional()`. The other ten JSON entries stay as they are until Task 2. Do not touch characterFullSchema, createCharacterSchema or any response schema.

    In app/api/[[...route]]/characters/index.ts, add a module-level, exported, named hook `invalidJsonHook` above the `const app = new Hono()` chain, with a short Portuguese comment saying it is the shared 400 hook for JSON bodies. Pass it as the third argument of the PUT /:id validator: `zValidator('json', updateCharacterSchema, invalidJsonHook)`. Type it with the structural signature from the interfaces block (`result` typed as the union of `{ success: true }` and `{ success: false; error: z.core.$ZodError }`, plus `c: Context` as a type-only import from 'hono'). Do not use the `Hook<…, z.ZodType>` annotation, which makes tsc infer `updates` as unknown. When the result is not successful, the hook returns `c.json({ error: 'Dados inválidos', issues }, 400)`. Otherwise it returns nothing, so the request continues. Build `issues` from `result.error.issues` as `{ path: issue.path.map(String).join('.'), message: issue.message }`. Include only path and message, never the issue input or the request body (threat T-261101-iih-04). This keeps the existing `{ error: string }` error contract, so lib/api/queries.ts needs no change. 261101-iii depends on this item and reuses `invalidJsonHook` as the third argument of its extended PUT schema, so keep the name and export stable. Do not alter the param validator, the handler body, other routes, or add body-size middleware.

    Test files use `bun:test` (describe/test/expect, plus `mock` in the route test), following 261101-iig's import style:
    - lib/schemas/character.test.ts imports from '@/lib/schemas/character'.
    - app/api/[[...route]]/characters/index.test.ts must never reach a real database. At the top of the file, before anything loads the route, create a `touched` string array and a `forbiddenDb` stub: a Proxy whose get trap pushes the property name onto `touched` and then throws an Error. Then call `mock.module('@/lib/db', () => ({ db: forbiddenDb }))`, and only after that load the route with a top-level `const { default: app } = await import('./index')`. Do not statically import './index', because static imports are hoisted above `mock.module` and would bind the real PrismaClient. Every route test asserts `touched` is empty after its request. In the RED run, the old permissive validator lets `{ weapons: {} }` reach the handler, the stub throws, and the handler's catch returns 500, so the test fails safely without querying the DATABASE_URL that Bun auto-loads. Send only malformed bodies, using method 'PUT', a JSON content-type header and a JSON.stringify body. Per the interfaces block, Bun mocks persist across files and a later `mock.module` replaces exports in place, so this file and 261101-iii's fake-db route tests pass in one `bun test` process in either order. Do not add a preload, a bunfig.toml or `mock.restore()` calls (`mock.restore` does not undo module mocks).
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && bun test ./lib/schemas/character.test.ts "./app/api/[[...route]]/characters/index.test.ts" && npx tsc --noEmit && grep -c "Dados inválidos" "app/api/[[...route]]/characters/index.ts" && grep -cE "^export const invalidJsonHook" "app/api/[[...route]]/characters/index.ts" && grep -cF "zValidator('json', updateCharacterSchema, invalidJsonHook)" "app/api/[[...route]]/characters/index.ts" && grep -cF "mock.module('@/lib/db'" "app/api/[[...route]]/characters/index.test.ts" && test "$(grep -cE "^import .* from '\./index'" "app/api/[[...route]]/characters/index.test.ts")" = "0"</automated>
    <!-- baselines at HEAD 832fa9b: "Dados inválidos" count 0; "^export const invalidJsonHook" count 0; the wired validator literal count 0; index.test.ts does not exist (grep exits 2), so every positive gate fails at HEAD. The last gate rejects a static import of the route, which would bind the real Prisma client before the mock. -->
  </verify>
  <done>Both test files pass. `tsc` is clean with no cast at `db.character.update`. A malformed `weapons` PUT returns 400 `{ error: 'Dados inválidos', issues }` through the exported `invalidJsonHook` (both counts went from 0 at HEAD to at least 1). The route test runs with `@/lib/db` mocked by the throwing stub, loads the route only through `await import('./index')`, and records no DB access. The sparse and legacy weapon shapes pass, and legacy keys are preserved in the parsed output.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Tolerant schemas for the remaining ten JSON fields, with UI-shape fixtures</name>
  <files>lib/schemas/character.ts, lib/schemas/character.test.ts, app/api/[[...route]]/characters/index.test.ts</files>
  <read_first>lib/schemas/calculations.ts or wherever 261101-iie left the four per-field schemas (locate with grep -rn "export const attributeValueSchema" lib/schemas), lib/defaults/character.ts, lib/constants/character.ts (DEFAULT_ADVENTURE_KIT only), components/ui/editable-scaling-field.tsx (lines 15-83, normalizeScalingData)</read_first>
  <behavior>
    - Each JSON field taken from getDefaultCharacterData() passes updateCharacterSchema, as one combined object and as eleven single-field objects. So do { adventureKit: DEFAULT_ADVENTURE_KIT } (items without isDefault) and the sanitized fallbacks from app/character/[id]/page.tsx (vitality { race: 0, class: 0 }, armor { name: '', description: '', totalVitality: 0, currentVitality: 0 }, finances all zero).
    - Partial and tolerant shapes pass: attributes { esquiva: { race: 3 } }; skills { novaPericia: { distributed: 2 } }; currentVitality { notavel: 0, ferido: -20, gravementeFerido: -40, condenado: -60, incapacitado: -80, coma: -100 }; languages { standard: { comum: true }, custom: [{ name: 'Dracônico', known: true }] }; languages { standard: { comum: false }, custom: { '0': { name: 'Dracônico', known: true } } }; spells [new-spell shape with damage { base: 0, perLevel: null } and duration { base: '', perLevel: null }]; spells [{ name: 'Bola de Fogo', damage: '8d6', duration: 'Instantâneo', preparationTime: '1 ação' }]; spells [{ damage: 10, duration: null }]; talents [{ name: 'Ataque Furtivo', level: 2, description: 'x' }] (no flags); talents [{ name: 'Fúria', level: 1, description: '', oncePerDay: true, usedToday: false }].
    - Key preservation: for the legacy spell and a talent with an extra key, the parsed output deep-equals the input.
    - Rejections (safeParse success false): attributes 'abc'; attributes { agilidade: { race: '10' } }; vitality []; currentVitality null; currentVitality { ferido: '5' }; skills { acrobacia: { distributed: -1 } }; skills { acrobacia: { distributed: 'x' } }; armor 'x'; armor { totalVitality: '50' }; adventureKit {}; adventureKit [{ quantity: '3' }]; finances { ouro: 'muito' }; languages { standard: 'x' }; languages { custom: 'x' }; spells 'x'; spells [{ level: 'dois' }]; spells [{ damage: { base: true } }]; talents [{ oncePerDay: 'sim' }]; talents {}.
    - Route: PUT with body { finances: { ouro: 'muito' } } responds 400 with an issues entry whose path starts with 'finances', and the mocked db stub's access log stays empty.
  </behavior>
  <action>
    Add the failing fixtures above to lib/schemas/character.test.ts, plus the finances case in the route test. The route test reuses Task 1's mocked `@/lib/db` setup and its single `await import('./index')`, adding no second import and no static import. Then implement in lib/schemas/character.ts using the `jsonObject`/`jsonExtra` helpers from Task 1. Export each new field schema with a camelCase name ending in `Schema`.

    Reuse the four per-field schemas kept by 261101-iie, as the batch catalog asks. Import attributeValueSchema, vitalityBaseSchema, vitalityLevelsSchema and skillValueSchema from '@/lib/schemas/calculations' if they still live there, or use them in place if 261101-iie moved them into lib/schemas/character.ts. Do not edit those four definitions or their file. If 261101-iie deleted them, define the same key sets inline in lib/schemas/character.ts and say so in the SUMMARY. Compose them as follows:
    - attributes: a string-keyed record of attributeValueSchema made partial with the jsonExtra catchall.
    - vitality: vitalityBaseSchema made partial with the catchall.
    - currentVitality: vitalityLevelsSchema made partial with the catchall. Add no minimum: restoreFullHealth writes negative stages.
    - skills: a string-keyed record of skillValueSchema made partial with the catchall. This keeps distributed >= 0, which every skills writer already enforces.
    Partial is required because buildUpdateData writes partial entries when a stored record lacks the key.

    New schemas, with every declared key optional:
    - armorFieldSchema: name and description strings; totalVitality and currentVitality numbers.
    - adventureKitItemSchema and adventureKitFieldSchema (an array of items): name string, quantity number, isDefault boolean.
    - financesFieldSchema: ouro, prata, cobre, imperano and joias numbers.
    - customLanguageSchema: name string, known boolean.
    - languagesFieldSchema: standard is a string-keyed record of booleans. custom is a union of an array of customLanguageSchema and a string-keyed record of customLanguageSchema. The record branch is mandatory: EditableField's `custom.${index}.name` edit runs through buildUpdateData's three-segment path, which turns the array into an index-keyed object, and the standard-language checkbox re-sends it on every toggle. Rejecting it would block language edits on those rows. This is a latent UI bug, out of scope here: report it in the SUMMARY as a follow-up and do not edit components.
    - scalingValueSchema: a union of (jsonObject with base as number-or-string and perLevel as nullable number), plain string, plain number and null. This mirrors normalizeScalingData, which accepts objects with base, legacy strings and numbers, and falls back for anything else.
    - spellSchema and spellsFieldSchema (an array of spellSchema): name, type, concentration, prepTime, resistance, range and description strings; level and berkanaCost numbers; damage and duration as scalingValueSchema.
    - talentSchema and talentsFieldSchema (an array of talentSchema): name and description strings, level number, oncePerDay and usedToday booleans.

    Replace the remaining ten permissive entries in updateCharacterSchema with these schemas, each `.optional()` but not nullable. Prisma Json columns are required, and a top-level null already fails with a 500 today. Remove the old "aceitar qualquer estrutura" comment and do not leave a comment inside updateCharacterSchema that names the old validator. Add no range or length rules beyond distributed >= 0 and weapons max 3: production rows cannot be inspected, and a rejected save is a lost edit (core value). characterFullSchema and every response schema stay unchanged, so GET keeps loading any stored row.
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && bun test ./lib/schemas/character.test.ts "./app/api/[[...route]]/characters/index.test.ts" && npx tsc --noEmit && test "$(sed -n '/export const updateCharacterSchema/,/^})/p' lib/schemas/character.ts | grep -v '^\s*//' | grep -cF 'z.any()')" = "0" && test "$(sed -n '/export const characterFullSchema/,/^})/p' lib/schemas/character.ts | grep -v '^\s*//' | grep -cF 'z.any()')" = "11"</automated>
  </verify>
  <done>All fixtures pass. The permissive-validator count inside updateCharacterSchema went from 11 at HEAD to 0, while characterFullSchema still has its 11 (baseline unchanged). `tsc` is clean, and no component or `prisma/schema.prisma` file is modified.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Clamp GET /api/characters pagination and run the full gate</name>
  <files>lib/schemas/character.ts, lib/schemas/character.test.ts</files>
  <read_first>lib/api/queries.ts (lines 14-30, useCharacters), app/characters/page.tsx (lines 36-48, page and limit = 12)</read_first>
  <behavior>
    - getCharactersQuerySchema.parse({}) gives { page: 1, limit: 10 }.
    - page: '0' gives 1; '-3' gives 1; 'abc' gives 1; '' gives 1; '2' gives 2; '99999999999999999999' gives 10000.
    - limit: '12' gives 12 (the list page's real value); '1000000' gives 100; '100' gives 100; '0' gives 1; '-5' gives 1; 'abc' gives 10.
    - search: 'ana' passes through unchanged. The output page and limit are always integers within bounds.
  </behavior>
  <action>
    Add the failing pagination cases to lib/schemas/character.test.ts, then implement in lib/schemas/character.ts.

    Export the constants DEFAULT_CHARACTERS_PAGE_SIZE = 10, MAX_CHARACTERS_PAGE_SIZE = 100 and MAX_CHARACTERS_PAGE = 10_000 (Claude's discretion). The page cap keeps Prisma's `skip` at or below 999,900, so a huge page string cannot overflow the integer `skip` and turn into a 500.

    Add a small exported helper `parseClampedInt(value, fallback, min, max)`. It parses with base-10 parseInt, returns the fallback when the result is not finite, and otherwise clamps the result between min and max.

    Rewrite the page and limit transforms of getCharactersQuerySchema to use it: page has fallback 1 and range 1..MAX_CHARACTERS_PAGE; limit has fallback DEFAULT_CHARACTERS_PAGE_SIZE and range 1..MAX_CHARACTERS_PAGE_SIZE. Keep both inputs as optional strings and both outputs as numbers, so `GetCharactersQuery` (used by `useCharacters`) and lib/api/queries.ts compile unchanged.

    The route needs no edit: it already computes skip as (page - 1) * limit and echoes page and limit in the response, which now carry the clamped values.

    Then run the full project gate: `npx tsc --noEmit`, the whole `bun test` suite and `bun run build`. `bun run lint` is deliberately NOT a gate for this item. At HEAD the script is `next lint` (removed in Next 16) and no ESLint config exists. 261101-iim, which depends on this item, adds the flat config and `"lint": "eslint ."`, then runs lint at the end of the batch over every merged item, including these four files. Do not add or edit any ESLint config or the lint script here. Record this deferral in the SUMMARY.
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && bun test ./lib/schemas/character.test.ts && npx tsc --noEmit && bun test && bun run build</automated>
    <human-check>End of batch, against the real database (`bun run dev`): open an existing character and make one edit per JSON column: an attribute race value, vitality race, one current-vitality stage, skill +1, weapon 1 damage 25%, armor name, a kit item quantity, finances ouro, a standard-language checkbox, a custom-language name, a spell damage scaling value and a talent 1x/dia toggle. Each one saves with no 400 toast or error text. Then open /api/characters?page=0&limit=1000000 and check that the response has page 1 and limit 100.</human-check>
  </verify>
  <done>Pagination cases pass. `npx tsc --noEmit`, the full `bun test` suite (including 261101-iig's tests) and `bun run build` all exit 0. GET /api/characters can no longer produce a negative or NaN offset or an unbounded page. `bun run lint` was not run as a gate, and the SUMMARY states that it runs at batch end through 261101-iim.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser/any HTTP client → PUT /api/characters/:id | Untrusted JSON body (no authentication, an accepted owner decision) is written to the `characters` row |
| browser/any HTTP client → GET /api/characters | Untrusted query string controls Prisma skip/take |
| API → client (400 body) | Validation errors are returned to the caller |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-261101-iih-01 | Tampering | `updateCharacterSchema` JSON fields (PUT /:id) | high | mitigate | Typed tolerant schemas for all 11 JSON columns (Tasks 1-2). Wrong container or leaf types are rejected with 400 before Prisma, distributed >= 0 and weapons <= 3 are enforced, and fixtures prove it |
| T-261101-iih-02 | Tampering (integrity of stored data) | Parsed output written by `db.character.update` | high | mitigate | Every JSON-field object uses `.catchall(z.json())` (never strip mode), so unknown and legacy keys are preserved. Deep-equal round-trip tests cover the legacy weapon, spell and talent shapes |
| T-261101-iih-03 | Denial of Service | GET /api/characters `limit`/`page` | medium | mitigate | `parseClampedInt` clamps limit to 1..100 and page to 1..10000, and non-numeric values fall back to defaults (Task 3) |
| T-261101-iih-04 | Information Disclosure | PUT 400 hook response (`invalidJsonHook`) | low | mitigate | The shared hook returns only `{ path, message }` per issue, never the input or body. The route test asserts a marker string from the payload is absent from the response. 261101-iii reuses the same hook, so its PUT inherits the mitigation |
| T-261101-iih-05 | Denial of Service | Oversized PUT bodies / unbounded spells, talents and kit arrays | medium | accept | Out of this item's scope (no bodyLimit middleware; CONCERNS "No rate limiting or request size limits"). Length caps could reject existing rows. Record it as a follow-up in the SUMMARY |
| T-261101-iih-06 | Spoofing / Elevation of Privilege | Open API (no auth) | medium | accept | Owner decision in PROJECT.md: trusted play group, no authentication. Do not add auth |
| T-261101-iih-SC | Tampering | npm/pip/cargo installs | high | mitigate | No package installs in this plan; `z.json()` ships in the installed zod 4.0.10. Adding any dependency is out of scope. Test types come from 261101-iig |
</threat_model>

<verification>
- `bun test ./lib/schemas/character.test.ts "./app/api/[[...route]]/characters/index.test.ts"` passes.
- `npx tsc --noEmit` exits 0, with no cast or `@ts-ignore` added at `db.character.update`.
- Region gates: the permissive-validator count inside `updateCharacterSchema` is 0 (11 at HEAD), and inside `characterFullSchema` it is still 11.
- `git diff --name-only` lists only the four `files_modified` paths: no component, `lib/api/queries.ts`, `lib/schemas/calculations.ts`, `prisma/schema.prisma`, ESLint config or bunfig changes.
- `app/api/[[...route]]/characters/index.ts` exports `invalidJsonHook` and passes it as the third argument of the PUT json validator. The route test mocks `@/lib/db` before its only (dynamic) import of the route.
- `bun test` (full suite) and `bun run build` exit 0.
- `bun run lint` is not part of this item's gate. It is deferred to the batch end, where 261101-iim adds the ESLint flat config and `"lint": "eslint ."` and lints the merged tree. The SUMMARY records this.
</verification>

<success_criteria>
- A malformed JSON field on PUT /api/characters/:id returns 400 `{ error: 'Dados inválidos', issues }` (API-01).
- Every shape currently written by the UI or stored by older versions passes validation, and unknown keys are preserved (data compatibility).
- `GET /api/characters` with page=0, a negative or non-numeric page, or limit=1000000 returns a bounded page (API-03).
- Derived numbers, UI behavior and Prisma column types are unchanged.
</success_criteria>

<output>
Create `.planning/quick/261101-iih-validate-json-fields-on-update-and-bound-pagination-api-01-a/261101-iih-SUMMARY.md` when done. Include these follow-ups:
1. Latent UI bug: editing a custom-language name turns `languages.custom` into an index-keyed object (buildUpdateData's three-segment path in components/ui/editable-field.tsx). After that, the sheet shows no custom languages and "Adicionar" throws. The schema accepts the shape; the UI fix belongs in a later item.
2. There is no body-size limit on PUT/POST (T-261101-iih-05).
3. Where the four per-field schemas were imported from.
4. Handoff for 261101-iii: the exported name and signature of `invalidJsonHook`. Also how the route test isolates the DB. It mocks `@/lib/db` with a throwing stub before a top-level `await import('./index')`. Under Bun 1.3.2, module mocks are NOT scoped per file: they persist across files in the one `bun test` process, and a later `mock.module` replaces the already-loaded module's exports in place. That is why this test and iii's fake-db route tests pass in either order.
5. Definition of done: `bun run lint` was not run as a gate. It runs at batch end through 261101-iim, which adds the ESLint config and the `eslint .` script and lints this item's files with the rest of the batch.
</output>
