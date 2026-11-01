---
last_mapped_commit: 216d4bd8bdc9621832748458a63bb5e0b24f8795
last_mapped_at: 2026-11-01
---
# Testing Patterns

**Analysis Date:** 2026-11-01

## Test Framework

**Runner:**
- Bun's built-in test runner (`bun test`). Bun 1.3.x is used; the local run reported `bun test v1.3.2`. No Jest, Vitest, or Playwright config exists.
- Config: none. There is no `bunfig.toml` and no preload file. Bun discovers `*.test.ts` files automatically.
- Type package: devDependency `@types/bun` pinned to exactly `1.3.14` in `package.json`. The pin matters because `tsconfig.json` includes `**/*.ts`, so an unresolved `bun:test` import would fail `npx tsc --noEmit` and `next build`.
- Path alias: `@/` works in tests with no extra setup, because Bun reads the `paths` mapping from `tsconfig.json`.

**Assertion library:**
- `expect` from `bun:test`, with Jest-style matchers: `toBe`, `toEqual`, `toThrow('<message>')`, `toHaveBeenCalledTimes`, `toContain`, `not.toContain`.
- Test blocks use `describe`, `it`, or `test`, all imported from `bun:test`.

**Other verification gates (not tests, but part of "done"):**
- `npx tsc --noEmit`: strict mode (`tsconfig.json`), covers test files.
- `bun run lint`: runs `eslint .` with the ESLint 9 flat config in `eslint.config.mjs` (`eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`). It currently reports 0 errors and 1 warning (unused `routes` in `app/api/[[...route]]/route.ts`).
- `bun run build`: runs `prisma generate && next build`.

**Run commands:**
```bash
bun test                                  # Run all 7 test files
bun run test                              # Same suite via the package.json "test" script
bun test lib/calculations                 # Run tests under one folder
bun test lib/api/character-concurrency    # Run one file (path prefix match)
bun test --coverage                       # Coverage report (no threshold enforced)
npx tsc --noEmit                          # Type-check everything, including tests
bun run lint                              # ESLint 9 flat config
bun run build                             # Prisma generate + Next build
```

**Package manager:** Bun is the documented choice. `bun.lock` is authoritative and `vercel.json` installs with Bun. `package-lock.json` also exists in the tree, so do not use it to decide versions. Use `bun install` and `bun test`.

## Current Suite Status

- `bun test`: 183 tests pass, 0 fail, across 7 files, 432 `expect()` calls (local run, 2026-11-01).

| Test file | Covers | Style |
|-----------|--------|-------|
| `lib/calculations/index.test.ts` | Every exported function of `lib/calculations/index.ts` (26), plus an export-coverage guard | Golden values, pure functions |
| `lib/schemas/character.test.ts` | `weaponsFieldSchema`, `updateCharacterSchema`, `getCharactersQuerySchema` | `safeParse` on real payloads |
| `lib/notes.test.ts` | `parseNotes`, `serializeNotes`, `migrateLegacyNotes`, `claimLegacyMigration`, `canWriteNotes`, `createNote`, `moveNote` | Pure functions, literal notes |
| `lib/notes-format.test.ts` | `escapeHtml`, `formatNoteHtml` (XSS and formatting parity) | Pure functions, string assertions |
| `lib/api/character-concurrency.test.ts` | `PUT /:id` contract through Hono, `saveCharacterUpdate` (single write and serial queue), `handleCharacterSaveError` | Fake in-memory DB, `QueryClient` |
| `app/api/[[...route]]/characters/index.test.ts` | `PUT /:id` with malformed JSON returns 400 and never touches the DB | Hono `app.request`, forbidden-DB proxy |
| `components/character/notes-tab.render.test.ts` | `NotesTab` render purity and corrupted-data rendering | `renderToString`, mocked hook |

## Test File Organization

**Location:**
- Co-locate tests next to the module they cover, as `<name>.test.ts`. Examples: `lib/notes.test.ts` beside `lib/notes.ts`, `lib/api/character-concurrency.test.ts` beside `lib/api/character-concurrency.ts`, `components/character/notes-tab.render.test.ts` beside `components/character/notes-tab.tsx`.
- The route test lives in the route folder: `app/api/[[...route]]/characters/index.test.ts` beside `index.ts`.
- There is no separate `tests/` directory. Do not create one without updating this document.

**Naming:**
- Match the kebab-case of the module: `lib/schemas/character.test.ts`, not `lib/schemas/Character.test.ts`.
- Use `.render.test.ts` for component tests that render through `react-dom/server`.

**Structure:**
```
lib/calculations/index.ts
lib/calculations/index.test.ts              # pure-function golden values
lib/notes.ts
lib/notes.test.ts                           # pure notes logic
lib/notes-format.ts
lib/notes-format.test.ts                    # HTML escaping and formatting
lib/schemas/character.ts
lib/schemas/character.test.ts               # schema acceptance and rejection
lib/api/character-concurrency.ts
lib/api/character-concurrency.test.ts       # save core and PUT contract
app/api/[[...route]]/characters/index.ts
app/api/[[...route]]/characters/index.test.ts
components/character/notes-tab.tsx
components/character/notes-tab.render.test.ts
```

## Test Structure

**Suite organization:**
- One `describe` per exported function, named exactly after the export. This is what makes the export guard work. Other suites use a descriptive Portuguese title when the unit is a route or a flow (`describe('PUT /:id (contrato da rota)')`, `describe('saveCharacterUpdate (fila serial por personagem)')`).
- `it` titles are in Brazilian Portuguese and state the behavior. Example from `lib/calculations/index.test.ts`:

```typescript
import { describe, expect, it } from 'bun:test'
import { calculateAttributeTotal } from '@/lib/calculations'

describe('calculateAttributeTotal', () => {
  const attribute = { race: 10, class: 12, bonus: 2 }

  it('nível 4 ainda não tem bônus e nível 5 soma +1', () => {
    expect(calculateAttributeTotal(attribute, 4)).toBe(24)
    expect(calculateAttributeTotal(attribute, 5)).toBe(25)
  })
})
```

**Golden-value rule (calculations):**
- Expected numbers in `lib/calculations/index.test.ts` are literals. They come from the app's outputs at commit `832fa9b`, not from calling the module under test.
- Never edit an expected value to match a changed formula. A failing value means a derived number changed. Decide whether the change is intended before touching the test.
- Fixtures are file-level constants (`DEFAULT_SKILL_NAMES`, a `U5` usage fixture, `vitality = { race: 200, class: 250 }`).

**Export-coverage guard:**
- `lib/calculations/index.test.ts` has a `describe('exports de lib/calculations')` block. It collects every function export from `@/lib/calculations`, sorts the names, and compares them with a `TESTED_FUNCTIONS` array (26 entries).
- Adding an export to `lib/calculations/index.ts` fails this test until you add it to `TESTED_FUNCTIONS` and write its `describe` block.

**Patterns:**
- Setup: none for pure functions. Declare fixtures as file-level literal constants.
- Per-test reset: `beforeEach` with `mock.clear()` for mocks that persist across tests (`components/character/notes-tab.render.test.ts`).
- Restore spies in `finally` blocks: `spy.mockRestore()` after `spyOn(console, ...)`.
- Assertions: `toBe` for numbers and booleans, `toEqual` for objects and arrays, `toThrow('<message>')` for errors (for example `'XP insuficiente para subir de nível'` in the calculations suite), `toContain` for rendered HTML.

## Mocking

**Framework:** Bun's built-in `mock`, `mock.module`, and `spyOn` from `bun:test`. No Sinon, no `vi`, no `jest.mock`.

**Module mocking (`mock.module`):**
- `mock.module` must run before the module under test is loaded. Static `import` statements are hoisted above it, so load the module under test with a dynamic `await import(...)` after the mock. Both test files that mock the DB say so in their header comment.
- The route test replaces the DB with a stub that throws on any access, so a regression that touches the database fails loudly:
  ```typescript
  import { describe, expect, it, mock } from 'bun:test'

  const forbiddenDb = new Proxy(
    {},
    {
      get(_target, prop) {
        throw new Error(`Acesso ao banco proibido nos testes: ${String(prop)}`)
      },
    },
  )

  mock.module('@/lib/db', () => ({ db: forbiddenDb }))

  const { default: app } = await import('./index')
  ```
- The concurrency test replaces `@/lib/db` with an in-memory fake (`fakeDb`) that implements `findUnique` and a conditional `update`. The conditional update compares `updatedAt`, so optimistic-concurrency behavior is exercised for real.
- The notes render test mocks the React Query hook module `@/lib/api/queries` with a `mock(() => ({ mutateAsync, isPending: false, error: null }))`. It then asserts `mutateAsync` was never called.

**Important: module mocks are process-wide.** `mock.module` affects the whole `bun test` process, not just the file that declares it. `components/character/notes-tab.render.test.ts` says this in its header. If a future test needs the real `@/lib/api/queries`, it will see the mock. Either keep such tests in a separate run or avoid mocking that module.

**Spies on globals:**
- `spyOn(console, 'error').mockImplementation(() => {})` silences expected logs and lets the test assert they were not called. The render test checks that `console.log`, `console.info`, and `console.debug` are never called while rendering.

**Function mocks:**
- `mock(async () => ({}))` creates a callable with a call log. Assert with `toHaveBeenCalledTimes(n)`.

**What to mock:**
- `@/lib/db` for any test that reaches a route handler or a function that imports the Prisma client.
- `@/lib/api/queries` when rendering a component that calls mutation hooks and you want to prove it does not write.
- `console` methods when the test expects output or must assert on silence.

**What NOT to mock:**
- Pure calculation helpers in `lib/calculations/index.ts`. Call them with real inputs.
- Zod schemas in `lib/schemas/`. Validate real payloads with `safeParse`.
- The notes helpers in `lib/notes.ts` and `lib/notes-format.ts`.
- `cn` in `lib/utils.ts`. It has no tests yet, but it is pure and should not be mocked.

## Route and HTTP Testing

- Test Hono routes without a server, with `app.request(path, init)`, as `app/api/[[...route]]/characters/index.test.ts` and the PUT contract in `lib/api/character-concurrency.test.ts` do:
  ```typescript
  function put(body: unknown) {
    return app.request('/qualquer-id', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  const res = await put({ weapons: {} })
  expect(res.status).toBe(400)
  const json = (await res.json()) as { error: string; issues: { path: string; message: string }[] }
  ```
- Assert the status code, the `error` string, and the absence of DB access. Do not assert on the full body of a 500 response.
- The route module loads through `@/lib/db`, so mock the DB before importing it (see above).

## Fixtures and Factories

**Test data:**
- Start from the real default character when a whole record is needed: `getDefaultCharacterData()` in `lib/defaults/character.ts`. Spread overrides on top: `{ ...getDefaultCharacterData(), characterName: 'Test Character' }`.
- Hand-written fixtures use the persisted JSON shapes, for example `{ agilidade: { race: 10, class: 12, bonus: 2 } }`. The shapes are documented in `prisma/schema.prisma` JSON comments.
- Note fixtures use literal ids and timestamps: `{ id: '1', title: 'Primeira', content: 'Conteudo A', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }` (`lib/notes.test.ts`).
- Malformed input is written as raw strings in the test, for example `'[{"id":'` and `'{"x":"<img src=x onerror=alert(1)>"}'` (`components/character/notes-tab.render.test.ts`). Keep these literal.

**Location:**
- No shared fixtures directory exists. Keep fixtures in the test file that uses them. If several suites need the same factory, add it to `lib/defaults/` and reuse it. Record any new fixtures directory here.

## Coverage

**Requirements:** None enforced. No threshold is configured. `.gitignore` reserves `/coverage`.

**View coverage:**
```bash
bun test --coverage
```

**Covered areas:**
- Calculations: every exported function is tested (26 of 26, enforced by the export guard).
- Schemas: `weaponsFieldSchema`, `updateCharacterSchema`, `getCharactersQuerySchema`.
- Notes: parsing (ok, empty, legacy, corrupted), serialization, migration guard, creation, reordering, escaping and formatting.
- Save path: the PUT contract, the single-write core, the per-character serial queue, and conflict handling.

**Not covered by any test:**
- `app/characters/page.tsx`, `app/create/page.tsx`, `app/character/[id]/page.tsx`, and the tab and card components, apart from `NotesTab`.
- `lib/store/character.ts` (zustand store).
- `lib/api/queries.ts` hooks, except through the concurrency test's use of `saveCharacterUpdate` and `handleCharacterSaveError`.
- `lib/defaults/character.ts`, `lib/constants/character.ts`, `lib/utils.ts`.
- The POST, GET, and DELETE handlers in `app/api/[[...route]]/characters/index.ts`.

## Test Types

**Unit tests:**
- Pure functions in `lib/` (calculations, notes, notes-format, schemas, concurrency core). This is the largest group.
- Rendering checks for one component (`NotesTab`) through `react-dom/server`, which does not run effects. Effect-time behavior, such as one-time migration under React Strict Mode, is not covered and is verified by hand.

**Integration tests:**
- Route-level tests through `app.request` with a faked database: the PUT contract in `lib/api/character-concurrency.test.ts` (a full optimistic-concurrency round trip against the fake DB) and the malformed-JSON 400 path in `app/api/[[...route]]/characters/index.test.ts`.

**E2E tests:**
- Not used. No Playwright or Cypress config exists. The app's main flows (`/characters`, `/create`, `/character/[id]`) have no automated browser coverage.

**Manual verification:**
- Browser checks against `bun run dev` (Turbopack) are the current practice for UI behavior, for inline editing, and for the sticky tab layout.
- `prisma studio` is used to inspect data.

## Common Patterns

**Async tests:**
- Use `async` test functions and `await` the module or request under test. For a dynamically imported route, await the import inside the test or at file top level after `mock.module`.
- To test a serial queue, make the task wait on a `sleep` helper (`const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))` in `lib/api/character-concurrency.test.ts`) and assert the order of completion.

**React Query in tests:**
- Use a `QueryClient` created in the test with `retry: false`, as `providers/query-provider.tsx` does in the app. Call `queryClient.setQueryData(['character', id], value)` to seed the cache, then exercise the function under test.
- `@testing-library/react` and a DOM environment (happy-dom, jsdom) are not installed. Hook-level tests that need a React tree are not present. Prefer testing the framework-free core (`lib/api/character-concurrency.ts`) and render-to-string checks.

**Error tests:**
- Assert on the fixed error messages the code throws: `'Character not found'`, `'Failed to fetch characters'`, `'Dados inválidos'`, and the Portuguese conflict message exported as `CHARACTER_CONFLICT_MESSAGE`.
- Assert on the typed error with `isCharacterConflictError(error)` (from `lib/api/character-concurrency.ts`), not on the message text.
- Assert on status codes in route tests: `400` for malformed JSON, `404` for a missing record, `409` for a stale `expectedUpdatedAt`, `500` for an unexpected DB failure.
- For a function that must not throw on bad stored data, assert on the returned tagged value (`parseNotes` returns a corrupted kind) rather than an exception.

```typescript
it('weapons como objeto responde 400 com issues e sem acessar o banco', async () => {
  const res = await put({ weapons: {} })
  expect(res.status).toBe(400)
  expect(touched).toEqual([])
})
```

## Adding a New Test

1. Put the file beside the module as `<kebab-name>.test.ts`.
2. Import from `bun:test` and use `@/` for source imports.
3. For a pure function, use literal expected values. For calculations, take the value from the current accepted output and say so in a comment, as the calculations suite does.
4. For any module that imports `@/lib/db` or `@/lib/api/queries`, call `mock.module` before a dynamic import of the module under test.
5. If you add an export to `lib/calculations/index.ts`, add it to `TESTED_FUNCTIONS` in `lib/calculations/index.test.ts` and add its `describe`.
6. Run `bun test <path>`, then `bun test`, then `npx tsc --noEmit`. Keep the suite green.

## Gaps and Risks

- Test coverage concentrates on pure logic and the save path. UI components, the zustand store, the GET/POST/DELETE API handlers, and the page flows have no automated tests (see "Not covered by any test" above).
- The process-wide scope of `mock.module` means test-file order and mock choice can affect other files. Keep mocks narrow and document them as the render test does.
- `bun run lint` passes but reports one warning in `app/api/[[...route]]/route.ts`. Tests do not cover lint rules.
- `npx tsc --noEmit` was not part of this document's verification run. Run it before relying on the types in tests.
- The notes render suite only checks what `renderToString` can see. Effect-time behavior (one-time migration under Strict Mode) is verified by hand.

---

*Testing analysis: 2026-11-01*
