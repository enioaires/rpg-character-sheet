---
last_mapped_commit: 216d4bd8bdc9621832748458a63bb5e0b24f8795
last_mapped_at: 2026-11-01
---
# Coding Conventions

**Analysis Date:** 2026-11-01

## Naming Patterns

**Files:**
- Component files are kebab-case and export PascalCase names: `components/character/basic-info-tab.tsx` exports `BasicInfoTab`, `components/character/quick-actions-bar.tsx` exports `QuickActionsBar`, `components/character/notes/note-card.tsx` exports `NoteCard`.
- Sub-components of a tab live in a folder named after the tab, one file per card or section: `components/character/basic-info/vitality-card.tsx`, `components/character/notes/notes-list.tsx`, `components/character/spells-talents/spells-card.tsx`. The tab file (`basic-info-tab.tsx`, `notes-tab.tsx`, `spells-talents-tab.tsx`) composes them.
- shadcn/ui primitives keep their generated kebab-case names: `components/ui/alert-dialog.tsx`, `components/ui/toggle-group.tsx`. The project has no `components/ui/form.tsx`.
- Project-specific UI primitives also live in `components/ui/` and are kebab-case: `components/ui/editable-field.tsx`, `components/ui/editable-scaling-field.tsx`.
- Hooks use the `use-` kebab-case file prefix: `hooks/use-mobile.ts`.
- Lib modules are lowercase single words or kebab-case: `lib/api/queries.ts`, `lib/api/client.ts`, `lib/api/character-concurrency.ts`, `lib/calculations/index.ts`, `lib/schemas/character.ts`, `lib/schemas/calculations.ts`, `lib/store/character.ts`, `lib/defaults/character.ts`, `lib/constants/character.ts`, `lib/notes.ts`, `lib/notes-format.ts`, `lib/db/index.ts`.
- Next.js route files follow the App Router convention: `app/character/[id]/page.tsx`, `app/characters/page.tsx`, `app/create/page.tsx`, `app/page.tsx`, `app/api/[[...route]]/route.ts`.
- Barrel files are named `index.ts` and re-export a folder: `components/character/index.ts`, `lib/calculations/index.ts` (the implementation itself, not only a re-export).
- Type-only files are named `types.ts`: `components/character/types.ts`.
- Test files sit beside the module they cover and end in `.test.ts`: `lib/notes.test.ts`, `lib/api/character-concurrency.test.ts`. Component render tests use `.render.test.ts`: `components/character/notes-tab.render.test.ts`. See `TESTING.md`.

**Functions:**
- camelCase for all functions and hooks: `calculateAttributeTotal` in `lib/calculations/index.ts`, `parseNotes` in `lib/notes.ts`, `saveCharacterUpdate` in `lib/api/character-concurrency.ts`, `getDefaultCharacterData` in `lib/defaults/character.ts`.
- React hooks start with `use`. Data hooks in `lib/api/queries.ts` are `useCharacters`, `useCharacter`, `useCreateCharacter`, `useUpdateCharacter`, `useDeleteCharacter`. Derived-stat preview is `useCalculateDerivedStats`. Mutation hooks follow `use<Verb><Entity>`.
- Non-hook fetch helpers are exported as plain async functions: `fetchCharacter(id)` in `lib/api/queries.ts`, reused by the save core as its `fetchCharacter` dependency.
- React components are PascalCase named exports (`export function QuickActionsBar`). Page components use default exports (`export default function CharactersPage()` in `app/characters/page.tsx`).
- Event handlers inside components use the `handle` prefix: `handleCreateCharacter`, `handleViewCharacter`, `handleDeleteCharacter` in `app/characters/page.tsx`.
- Pure notes helpers are verbs over the notes array: `createNote`, `moveNote`, `serializeNotes`, `migrateLegacyNotes`, `claimLegacyMigration`, `canWriteNotes` in `lib/notes.ts`.

**Variables:**
- camelCase for locals and state: `isLoading`, `searchTerm`, `pendingChanges`.
- Boolean state uses `is`, `has`, `can`, or `should` prefixes: `isEditMode`, `hasMigratedOldNotes` (`components/character/notes-tab.tsx`), `isSaving`, `canWriteNotes`.
- Module constants use UPPER_SNAKE_CASE for shared values: `VITALITY_LEVELS` and `ATTRIBUTE_LABELS` (`lib/constants/character.ts`), `CHARACTER_CONFLICT_MESSAGE` in `lib/api/character-concurrency.ts`, `DEFAULT_CHARACTERS_PAGE_SIZE` and `MAX_CHARACTERS_PAGE_SIZE` in `lib/schemas/character.ts`.
- Query keys are built from literal tuples: `['characters', params]` and `['character', id]`. `characterQueryKey(id)` in `lib/api/character-concurrency.ts` returns the single-record key and must be used when reading or writing that cache entry.

**Domain keys are Portuguese and are persisted:**
- Vitality stages `notavel`, `ferido`, `gravementeFerido`, `condenado`, `incapacitado`, `coma` (`VitalityLevels` in `lib/calculations/index.ts`).
- Attribute keys such as `agilidade`, `carisma`, `forca`, and skill keys such as `acrobacia`, `ataqueSurpresa`, `controleArcano`.
- Do not translate these keys. They are JSON keys stored in `Json` columns in Postgres (see `prisma/schema.prisma`).

**Types and interfaces:**
- Props interfaces are named `<Component>Props`: `QuickActionsBarProps` in `components/character/quick-actions-bar.tsx`.
- Shared tab props use `CharacterTabProps` from `components/character/types.ts`. Tab props extend it, for example `NotesTabProps` in `components/character/notes-tab.tsx`.
- Store state is `<Name>State` (`CharacterState` in `lib/store/character.ts`). Value shapes in the calculation module use `<Name>Value` or `<Name>Base`: `AttributeValue`, `SkillValue`, `VitalityBase`, `VitalityLevels`.
- Custom error classes extend `Error` and set `this.name`: `CharacterConflictError` in `lib/api/character-concurrency.ts`.
- Zod schemas are camelCase and end in `Schema`: `createCharacterSchema`, `getCharactersQuerySchema`, `characterFullSchema`, `weaponsFieldSchema`. Response schemas end in `ResponseSchema`. Request types end in `Request`. Types are inferred with `z.infer<typeof schema>` (`export type Note = z.infer<typeof noteSchema>` in `lib/notes.ts`).
- Prefer deriving a type from a schema over writing it by hand. When a field must stay open to unknown keys, use `z.looseObject` (`noteSchema` in `lib/notes.ts`) so legacy and extra keys survive a parse.
- Use `import type` for type-only imports (`import type { CharacterFull } from '@/lib/schemas/character'`).

## Code Style

**Formatting:**
- No Prettier or Biome config is tracked. Formatting is not enforced by tooling.
- Indentation is 2 spaces in most files (`lib/api/queries.ts`, `lib/store/character.ts`, `lib/notes.ts`). Some pages use 4 spaces (`app/characters/page.tsx`, `app/character/[id]/page.tsx`). Match the file you are editing.
- Semicolons are mixed. Of the 53 tracked TS/TSX files outside `components/ui/`, 42 use no trailing semicolons (for example `lib/api/queries.ts`, `lib/store/character.ts`, `lib/db/index.ts`). Others, such as `app/api/[[...route]]/route.ts`, `providers/query-provider.tsx` and `lib/notes.ts`, use them. Match the local file style.
- Quotes are mixed. 36 files import with single quotes (`import { Button } from '@/components/ui/button'`). 13 files use double quotes (`app/api/[[...route]]/route.ts`, `lib/utils.ts`, `lib/schemas/calculations.ts`, `components/character/notes-tab.tsx`, `providers/query-provider.tsx`). Match the local file style.
- Trailing commas appear in multi-line objects and argument lists in most files.
- `components/ui/` is generated by shadcn/ui (`components.json`: style `new-york`, base color `neutral`, CSS variables on, icon library `lucide`, RSC enabled). Do not hand-edit these files to change conventions; regenerate them or wrap them in a new component.

**Linting:**
- ESLint 9 flat config in `eslint.config.mjs`. It spreads `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. `linterOptions.reportUnusedDisableDirectives` is `"error"`, so a stale `eslint-disable` comment fails the run.
- Ignored paths: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`, `lib/generated/**`, `.planning/**`, `.claude/**`, `.gsd/**`, `.vercel/**`.
- `bun run lint` runs `eslint .`. The current result is 0 errors and 1 warning: `'routes' is assigned a value but only used as a type` (`@typescript-eslint/no-unused-vars`) in `app/api/[[...route]]/route.ts`. Do not add new warnings.
- TypeScript strict mode is an additional static gate: `"strict": true` in `tsconfig.json`, with `noEmit`, `isolatedModules`, and `incremental`. `npx tsc --noEmit` checks every `**/*.ts` and `**/*.tsx`, including tests.
- Project definition of done (`.planning/PROJECT.md`): `npx tsc --noEmit`, `bun run lint`, `bun test`, and `bun run build` all pass.

**Language of the code:**
- UI strings, toasts, validation messages, and most domain comments are in Brazilian Portuguese: `toast.error('Erro ao deletar personagem')` in `app/characters/page.tsx`, `'Nome do personagem é obrigatório'` in `lib/schemas/character.ts`, `'Não foi possível ler as anotações'` in `components/character/notes-tab.tsx`.
- Identifiers, Hono routes, Zod schema names, and TypeScript types are in English (`createCharacterSchema`, `useCharacters`). Domain nouns and JSON keys can be Portuguese (`agilidade`).
- Write new user-facing text in Portuguese and new code identifiers in English, matching the existing split.

## Import Organization

**Order (observed, not enforced):**
1. Framework and third-party packages: `react`, `next/navigation`, `@tanstack/react-query`, `hono`, `zod`, `lucide-react`, `sonner`, `date-fns`.
2. Internal alias imports from `@/components/...`, `@/lib/...`, `@/hooks/...`.
3. Relative imports for siblings: `./client` in `lib/api/queries.ts`, `./basic-info-tab` in `components/character/index.ts`, `./types` in the render test.
4. Type-only imports use `import type`.

**Path aliases:**
- `@/*` maps to the repository root (`tsconfig.json` `paths`). Use `@/components/ui/button`, `@/lib/utils`, `@/lib/db`, `@/lib/calculations`.
- Bun reads the same `paths` mapping, so `@/` works in `bun test` files with no extra config.
- Prisma is imported from its generated location: `import { PrismaClient } from '@/lib/generated/prisma'` in `lib/db/index.ts`. `lib/generated/prisma` is git-ignored and recreated by `prisma generate` (run by `postinstall` and `build`).
- Inside a folder, sibling imports may stay relative (`./client`, `./types`, `./basic-info-tab`). Do not climb with `../` when `@/` is available.

## Error Handling

**API route handlers (`app/api/[[...route]]/characters/index.ts`):**
- Every handler body is wrapped in `try { ... } catch (error) { ... }`.
- On an unexpected failure, log with `console.error('Error <action>:', error)` and return a JSON error with status 500: `console.error('Error fetching characters:', error)` followed by `return c.json({ error: 'Failed to fetch characters' }, 500)`.
- Missing records return 404: `return c.json({ error: 'Character not found' }, 404)`.
- Optimistic-concurrency conflicts return 409: `return c.json({ error: 'Character was modified by another session' }, 409)`. Clients detect it with `response.status === 409` (`lib/api/character-concurrency.ts`).
- Input validation uses `zValidator` from `@hono/zod-validator` on `param`, `query`, or `json`, for example `zValidator('json', createCharacterSchema)`. Read validated data through `c.req.valid(...)`.
- Malformed JSON bodies on `PUT /:id` return 400 through the shared hook `invalidJsonHook`. It returns `{ error: 'Dados inválidos', issues: [{ path, message }] }` and never echoes the request body. Reuse this hook for new routes that take a JSON body.
- Prisma "record not found" is detected by duck typing on `error.code === 'P2025'` (`isRecordNotFoundError` in the route file), not by importing Prisma error classes. Keep this so the test fake can raise the same shape.
- Responses are checked with the response schema before returning, for example `getCharacterResponseSchema.parse({ character })`, so the response shape is validated server-side.
- Do not return `null` or `[]` silently on an error. Return a status code and an `error` field.

**Client data layer (`lib/api/queries.ts`, `lib/api/character-concurrency.ts`):**
- Fetch wrappers check `response.ok` and throw an `Error` with a fixed message: `throw new Error('Failed to fetch characters')`. For a single record, 404 maps to `throw new Error('Character not found')` in `fetchCharacter`.
- Mutations read the error body and rethrow the server message with a typed cast, not `@ts-ignore`: `throw new Error((error as { error?: string }).error || 'Failed to delete character')` in `useDeleteCharacter`.
- Save conflicts are a typed error: `CharacterConflictError` (in `lib/api/character-concurrency.ts`). Test it with `isCharacterConflictError(error)`, not by comparing messages.
- Conflict and save errors are routed by `handleCharacterSaveError(error, id, { queryClient, notify })`. `useUpdateCharacter` passes `toast.error` as `notify`, and the handler refetches the record on conflict. Other errors propagate to the caller.
- `onSuccess` invalidates lists: `queryClient.invalidateQueries({ queryKey: ['characters'] })`. Single-record writes update the cache first, through the save core.
- Do not add `@ts-ignore` or `@ts-expect-error` directives. None remain in the tracked TS/TSX files. Type the error body instead.

**Components:**
- User-facing failures use `sonner` toasts: `toast.success('Personagem "..." deletado com sucesso!')` and `toast.error('Erro ao deletar personagem')`, inside `try { await mutation.mutateAsync(id) } catch { toast.error(...) }`.
- The codebase has 29 `toast.success`/`toast.error` calls outside `components/ui/`. Use toasts for feedback, not `console`.
- Some `catch` blocks are still silent (for example in `components/character/basic-info-tab.tsx`). Do not copy that pattern. Log or surface the error when adding new code.

**Pure domain modules (`lib/notes.ts`, `lib/api/character-concurrency.ts`):**
- Parse functions return a discriminated union instead of throwing. `parseNotes(raw)` returns a `ParsedNotes` value whose kind covers ok, empty, legacy, and corrupted input (`lib/notes.ts`). Handle each kind explicitly in the UI.
- Rendering never writes. A legacy or corrupted value is shown as-is with a warning. Migration is a separate, one-time action guarded by `claimLegacyMigration`.

## Logging

**Framework:** `console` only. No logging library is installed.

**Patterns:**
- Server-side: `console.error('Error <action>:', error)` in API handlers. About 28 `console.` calls exist across non-UI TS/TSX files, nearly all of them `console.error` in route or query code.
- Do not add `console.log`, `console.info`, or `console.debug` to committed code. The notes render test asserts that rendering emits none of them (`components/character/notes-tab.render.test.ts`).
- Client-side feedback goes to `toast` from `sonner`, not to `console`.
- Never log request bodies. The 400 hook was written to avoid this, and the route's error logs take only the error object.

## Comments

**When to comment:**
- Use section banners to separate logical groups in large files: a `// ============================================` line, then an uppercase title (`// TIPOS DO STORE` in `lib/store/character.ts`, `// FILA SERIAL POR PERSONAGEM` and `// LINHAGEM DE VERSÕES PRÓPRIAS` in `lib/api/character-concurrency.ts`, `// CAMPO JSON: weapons` in `lib/schemas/character.test.ts`).
- Write comments in Portuguese to explain domain rules and the reason for a branch. Examples: `// Mesclar dados do usuário com defaults` in the characters route, `// Só executa se tiver ID` in `lib/api/queries.ts`, `// Exceção de compatibilidade aceita` in the PUT handler.
- Record deliberate compatibility exceptions and follow-ups inline. The PUT handler documents the `expectedUpdatedAt`-less branch and the removal condition.
- Do not comment obvious assignments.
- Schema comments in `prisma/schema.prisma` document the JSON shape of each `Json` column (for example `// Json: { race: 200, class: 250 }`). Keep this practice when adding a `Json` column.

**JSDoc/TSDoc:**
- Used for exported calculation helpers and hooks, not for every function. `useCalculateDerivedStats` in `lib/api/queries.ts` and the helpers in `lib/calculations/index.ts` carry short doc blocks.
- Document the game formula when a function encodes a rule from the RPG system:
  ```typescript
  /**
   * Bônus de nível dos atributos
   * Fórmula: level >= 5 ? Math.floor(level / 5) : 0
   */
  ```

## Function Design

**Size:**
- Hooks and handlers are short wrappers around `fetch` or `api.characters...` calls. Keep them under about 30 lines. Put save logic in `lib/api/character-concurrency.ts`, not in the hook.
- Large files still exist and are the current baseline, not a target: `components/character/skills-kit-tab.tsx` (466 lines), `components/character/spells-talents/spells-card.tsx` (296), `app/characters/page.tsx` (324), `components/character/notes-tab.tsx` (307). When adding behavior, extract a helper into `lib/calculations/`, `lib/notes.ts`, or a sibling card component instead of growing the tab file.
- Prefer splitting a tab into section cards in its own folder, as done in the recent refactor of `basic-info-tab.tsx` (`components/character/basic-info/`), `notes-tab.tsx` (`components/character/notes/`), and `spells-talents-tab.tsx` (`components/character/spells-talents/`).

**Parameters:**
- Components take one props object with a typed interface: `QuickActionsBar({ character, onNavigate, ... }: QuickActionsBarProps)`.
- Hooks take a single object when the payload has several parts: `useUpdateCharacter` mutates with `{ id, data }`.
- Pure helpers take positional primitives: `calculateVitalityLevels(vitality, level)`, `calculateMaxBerkana(level, base, bonus)`, `parseClampedInt(value, fallback, min, max)`.
- Prefer destructuring in the parameter list for components and hooks (`{ level, attributes, vitality, skills, maxBerkana, berkanaBonus }`).

**Return values:**
- Query hooks return the React Query result object directly, so callers use `data`, `isLoading`, `error`, and `mutateAsync`.
- Calculation helpers return plain values or records keyed by the Portuguese keys: `calculateAllAttributes` returns `Record<string, number>`.
- Parsers return a tagged result object (see `ParsedNotes` in `lib/notes.ts`) or a Zod `safeParse` result.
- API handlers return `c.json(...)` with an explicit status on every error path.

## Module Design

**Exports:**
- Named exports are the default for components, hooks, schemas, and helpers: `export function Button`, `export const useCharacters`, `export const createCharacterSchema`, `export function parseNotes`.
- Page routes are the exception and use `export default` (required by the App Router): `app/characters/page.tsx`, `app/create/page.tsx`, `app/page.tsx`.
- The API route module exports the HTTP verb handlers and the route type. `app/api/[[...route]]/route.ts` exports `GET`, `POST`, `PUT`, `DELETE` (via `hono/vercel` `handle`) and `AppType`. `lib/api/client.ts` imports `AppType` to build the typed client, so endpoints are not redefined by hand.
- The characters router itself is the default export of `app/api/[[...route]]/characters/index.ts`, which the route file mounts.

**Barrel files:**
- `components/character/index.ts` re-exports the tabs, modals, `QuickActionsBar`, and the `CharacterTabProps` type. Import from it: `import { BasicInfoTab, NotesTab } from '@/components/character'`.
- `lib/calculations/index.ts` is the calculation module itself. Import from `@/lib/calculations`.
- Do not add barrel files to `components/ui/`. Import each primitive directly: `import { Button } from '@/components/ui/button'`.

## Client and Server Boundaries

- Mark client components with `"use client"` at the top of the file. Five non-UI files do so: `app/characters/page.tsx`, `app/create/page.tsx`, `app/character/[id]/page.tsx`, `components/character/notes-tab.tsx`, and `providers/query-provider.tsx`. Most `components/ui/` files are client components too.
- Data hooks in `lib/api/queries.ts` and the zustand store in `lib/store/character.ts` run on the client. Use them only from `"use client"` modules.
- `lib/db/index.ts` (Prisma) is server-only. Import it only from route handlers. Do not import it from a client component.
- `lib/api/character-concurrency.ts` and `lib/notes.ts` are framework-free (no React, sonner, or Hono imports). Keep them that way so `bun test` can load them directly.

## State Management

- Server data: TanStack Query 5. `QueryClient` is created in `providers/query-provider.tsx` with `staleTime: 60_000` and `retry: false`.
- Query keys: `['characters', params]` for lists and `['character', id]` for one record. Use `characterQueryKey(id)` from `lib/api/character-concurrency.ts`.
- Optimistic concurrency: writes send `expectedUpdatedAt` (the `updatedAt` the user saw). The save core serializes writes per character and handles 409 conflicts. Do not bypass `useUpdateCharacter` with a direct `fetch`.
- Client editing state: zustand (`lib/store/character.ts`, wrapped in `devtools`). It holds `character`, `editingField`, and the `startEditing` / `cancelEditing` / `reset` actions. Read derived values with `useCalculatedStats` and `useIsFieldEditing` from the same module.
- Forms: there is no `react-hook-form` in the project (it was removed). Use controlled inputs and the inline-edit primitives in `components/ui/editable-field.tsx` and `components/ui/editable-scaling-field.tsx`. Validate with the Zod schemas in `lib/schemas/`.

## Styling

- Tailwind CSS 4 utilities in `className` strings. Merge conditional classes with `cn` from `lib/utils.ts`:
  ```typescript
  import { cn } from '@/lib/utils'
  <div className={cn('rounded-md', isEditMode && 'border-primary')} />
  ```
- Use `class-variance-authority` (`cva`) for component variants, following `components/ui/button.tsx`.
- Global theme variables live in `app/globals.css` (shadcn `cssVariables: true`, base color `neutral`).
- Dark mode and theme switching use `next-themes` (`components/ui/sonner.tsx` is the only file that imports it).

## Data Shapes and Validation

- Validate all API input with Zod schemas in `lib/schemas/character.ts` and `lib/schemas/calculations.ts`. Add new request shapes there and attach them to the Hono route with `zValidator`.
- Schemas must tolerate legacy and unknown fields. `weaponsFieldSchema` keeps keys it does not know (`lib/schemas/character.test.ts` checks this), so existing rows keep loading and saving.
- `Json` columns are typed as `z.any()` in `characterFullSchema` (see `lib/schemas/character.ts`). Narrow them in calculation helpers before use, or with a dedicated schema such as `weaponsFieldSchema`.
- Defaults for new characters come from `getDefaultCharacterData()` in `lib/defaults/character.ts`. Do not inline defaults in route handlers.
- Numeric game constants and labels live in `lib/constants/character.ts`, for example `VITALITY_LEVELS` and `ATTRIBUTE_LABELS`. Vitality derivation lives in `calculateVitalityLevels` in `lib/calculations/index.ts`.
- Pagination inputs are clamped, not rejected: `parseClampedInt` in `lib/schemas/character.ts` maps non-numeric values to a fallback and limits the rest to `min..max`.

## Anti-Patterns to Avoid

- Do not add placeholder `setTimeout` persistence to store actions. Persist through the React Query mutation hooks. (The former placeholder actions were removed; `setTimeout` now appears only for UI scroll timing in `components/forms/character-layout.tsx` and inside tests.)
- Do not add `@ts-ignore` or `@ts-expect-error`. Type the error body with a cast.
- Do not introduce `any` into new signatures. About 11 `any` occurrences remain, mostly in older component prop types such as `components/character/types.ts`. Prefer `CharacterFull` from `lib/schemas/character.ts`, or a narrow type derived from a schema.
- Do not translate persisted JSON keys or Prisma field names.
- Do not make a render path write data. `NotesTab` renders legacy and corrupted notes read-only and migrates only through an explicit action.
- Do not add `console.log` to committed code.

---

*Convention analysis: 2026-11-01*
