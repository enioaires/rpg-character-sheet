---
last_mapped_commit: dbe980a72bf9357010fabf77e4c8695d6ff9d1d2
last_mapped_at: 2026-11-01
---
# Codebase Concerns

**Analysis Date:** 2026-11-01

## Accepted Decisions (not issues)

- **No authentication or authorization.** The owner has confirmed the app intentionally has no auth. Any client that can reach `/api/characters/*` can read, modify, and delete any character. This is recorded as a deliberate decision; it is not listed as an open issue below except where it amplifies another concern (see XSS in Security Considerations).

## Tech Debt

**Calculation formulas duplicated in four places:**
- Issue: The same derived-stat formulas (attribute total with `level >= 5 ? Math.floor(level / 5) : 0`, vitality levels with `(base - 20*n) * (level + 1)`, berkana `100 + level * 10 + bonus`, skill total `1 + distributed + bonus + floor(level / 5)`, skill points `level * 10`) are reimplemented in:
  - `lib/calculations/index.ts` (canonical, documented, used by the API)
  - `lib/api/queries.ts` (`useCalculateDerivedStats`, lines ~340-395)
  - `lib/store/character.ts` (`useCalculatedStats`, lines ~245-300)
  - `lib/constants/character.ts` (`calculateBerkana`, `calculateVitality`, `calculateAttributeBonus`, `calculateSkillBonus`, lines ~176-210), used by `components/character/basic-info-tab.tsx` and `components/character/quick-actions-bar.tsx`
  - Inline attribute level bonus in `components/ui/editable-field.tsx` (~lines 524, 562)
- Files: `lib/calculations/index.ts`, `lib/api/queries.ts`, `lib/store/character.ts`, `lib/constants/character.ts`, `components/character/basic-info-tab.tsx`, `components/character/quick-actions-bar.tsx`, `components/ui/editable-field.tsx`
- Impact: Formula changes must be made in several places or the UI and API will disagree. The store and query copies hard-code `100` (berkana base) and `10` (skill points per level), while `lib/calculations` exposes `getSkillPointsPerLevel()` and accepts a berkana base parameter. Divergence has already started (the API `recalculate` endpoint uses base 100 and ignores the stored `maxBerkana`).
- Fix approach: Make `lib/calculations/index.ts` the single source of truth. Import it from the client hooks and components (it has no server-only dependencies) and delete the copies in `lib/api/queries.ts`, `lib/store/character.ts`, and `lib/constants/character.ts`.

**Unused API endpoints and client hooks:**
- Issue: Several server endpoints and their client hooks have no consumers in the UI:
  - `POST /api/characters/:id/level-up` (`app/api/[[...route]]/characters/index.ts`) with `useLevelUpCharacter` in `lib/api/queries.ts`
  - `POST /api/characters/:id/calculate-vitality`, `calculate-berkana`, `validate-skills`, `calculate-attributes`, `calculate-xp`, `calculate-skill-points` with `useCalculateVitality`, `useCalculateBerkana`, `useValidateSkills`, `useCalculateAttributes`, `useCalculateXP`, `useCalculateSkillPoints`
  - `POST /api/characters/:id/recalculate` with `useRecalculateCharacter`
  - Hooks `useCalculatedStats` (`lib/store/character.ts`) and `useCalculateDerivedStats` (`lib/api/queries.ts`) have no call sites; `useHasPendingChanges`, `useFieldValue`, `addPendingChange`, `savePendingChanges` also have no call sites.
- Files: `app/api/[[...route]]/characters/index.ts`, `lib/schemas/calculations.ts`, `lib/api/queries.ts`, `lib/store/character.ts`
- Impact: Roughly 500 lines of route, schema, and hook code are maintained but not exercised. The `level-up` endpoint is the only place XP-gated leveling exists, yet the UI does not use it, so leveling happens by writing `level` directly through `PUT` (see Lost updates and unvalidated writes).
- Fix approach: Decide per endpoint. Either wire `level-up` into the UI (so XP rules are enforced) and delete the unused calculate/validate endpoints, or delete the whole group together with `lib/schemas/calculations.ts` and the matching hooks.

**Simulated saves in the Zustand store:**
- Issue: `saveField` and `savePendingChanges` in `lib/store/character.ts` do not call any API. They `await new Promise(resolve => setTimeout(resolve, 500 | 1000))` and then clear state, so the UI reports success without persisting anything. The comments say "Aqui integraremos com as APIs de update" (integration is pending).
- Files: `lib/store/character.ts` (lines ~114-180), reached from `components/ui/editable-field.tsx` (`handleSave` fallback branch, ~line 275) when `characterId` is not provided.
- Impact: Any caller that relies on the store path silently loses edits. `updateField` also mutates nested objects of the previous state in place (shallow copy only at the top level), which breaks Zustand/devtools change tracking.
- Fix approach: Remove the fallback branch in `EditableField` and the simulated actions, or implement them with `useUpdateCharacter`. Make `EditableField` require `characterId` (or throw in development) so the silent path cannot be reached.

**Unused npm dependencies and shadcn/ui components:**
- Issue: Dependencies with no imports outside `components/ui/` (and, for several, no imports at all):
  - `@hono/zod-openapi` (no imports), `@scalar/hono-api-reference` (no imports), `@tanstack/react-query-devtools` (no imports), `@hookform/resolvers` (no imports), `react-hook-form` (only used by the unused `components/ui/form.tsx`)
  - Packages only referenced by unused UI primitives: `recharts`, `embla-carousel-react`, `vaul`, `cmdk`, `react-day-picker`, `react-resizable-panels`, `input-otp`, `next-themes`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-context-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-toggle-group`, `@radix-ui/react-slider`, `@radix-ui/react-collapsible`, `@radix-ui/react-accordion`, `@radix-ui/react-avatar`, `@radix-ui/react-popover`, `@radix-ui/react-select`, `@radix-ui/react-switch`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-tabs` (only consumed by files in `components/ui/` that are themselves unused)
  - `date-fns` has a single usage outside `components/ui/`
  - Unused UI files in `components/ui/`: `accordion`, `alert`, `aspect-ratio`, `avatar`, `breadcrumb`, `calendar`, `carousel`, `chart`, `command`, `context-menu`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `select`, `sidebar`, `slider`, `switch`, `table`, `toggle-group` (and `hooks/use-mobile.ts`, used only by `sidebar.tsx`)
- Files: `package.json`, `bun.lock`, `package-lock.json`, `components/ui/*.tsx`, `hooks/use-mobile.ts`
- Impact: Larger install and bundle surface, more upgrade and security-advisory noise (Next 16 required a security bump in commit `498bcad`), and misleading signals about what the app uses.
- Fix approach: Remove the unused packages and UI files. Re-add shadcn components on demand with `components.json`. `prisma` is listed under `dependencies` and could move to `devDependencies` (`@prisma/client` must stay in `dependencies`).

**Two lockfiles:**
- Issue: Both `bun.lock` (84 KB) and `package-lock.json` (111 KB) are tracked. `vercel.json` installs with `bun install` and builds with `bun run build`, while `README.md` documents `npm run dev`.
- Files: `bun.lock`, `package-lock.json`, `vercel.json`, `README.md`
- Impact: The two lockfiles can resolve different versions. Installs differ by package manager, and dependency updates land in only one lock.
- Fix approach: Pick one package manager (Bun is what Vercel uses) and delete the other lockfile. Update `README.md` to match.

**Broken `lint` script, no linter configured:**
- Issue: `package.json` defines `"lint": "next lint"`. The installed Next is 16.0.7 (`node_modules/next/package.json`), where the `next lint` command is no longer available, and there is no ESLint dependency or config file (no `eslint.config.*` or `.eslintrc*`).
- Files: `package.json`
- Impact: `npm run lint` / `bun run lint` fails, so there is no static analysis of hooks rules, unused variables, or the issues listed below.
- Fix approach: Add ESLint with `eslint-config-next` and a flat config, and change the script to `eslint .`. Enable the `react-hooks` rules so the conditional-hook issue below is caught.

**Deprecated `middleware.ts` file convention:**
- Issue: `middleware.ts` (root) only redirects `/` to `/characters`. Next 16 emits a warning that the `middleware` file convention is deprecated in favor of `proxy` (`node_modules/next/dist/build/index.js` line ~604).
- Files: `middleware.ts`, `app/page.tsx` (renders a "Redirecionando..." spinner that the middleware normally bypasses)
- Impact: Build warning, and the file will eventually stop being recognized. The redirect could be done with `redirect()` in `app/page.tsx` or a `next.config.ts` `redirects()` entry, which removes the convention entirely.
- Fix approach: Replace the redirect with `redirects()` in `next.config.ts` (or the `proxy` convention if the matcher logic is needed later).

**Conditional hook call in `EditableField`:**
- Issue: In `components/ui/editable-field.tsx` line ~207, `const isSaving = characterId ? updateCharacterMutation.isPending : useCharacterStore(state => state.isSaving)` calls `useCharacterStore` conditionally. The hook count changes between renders if `characterId` changes between truthy and falsy.
- Files: `components/ui/editable-field.tsx` (~line 207)
- Impact: Violates the Rules of Hooks. Can throw or corrupt state when the prop changes. Also, `useUpdateCharacter()` is called unconditionally (line ~204) even when the store path is used.
- Fix approach: Always call `useCharacterStore(state => state.isSaving)` at the top of the component, then select between the two values without calling a hook conditionally.

**Notes stored as JSON inside a `String` column:**
- Issue: `notes` is `String?` in `prisma/schema.prisma`, and the UI stores a JSON array of notes in it (`components/character/notes-tab.tsx`). Every add, edit, delete, and reorder rewrites the whole array via `JSON.stringify`. Legacy plain-text notes are migrated in place on render.
- Files: `prisma/schema.prisma` (`notes`), `components/character/notes-tab.tsx`, `lib/schemas/character.ts` (`notes: z.string()`), `app/api/[[...route]]/characters/index.ts`
- Impact: The API cannot validate note structure (any string is accepted). Each mutation sends the full array. Corrupted JSON falls back to `[]`, and the next add overwrites the column, so the corrupted content is destroyed (see Known Bugs).
- Fix approach: Add a `Note` model (`id`, `characterId`, `title`, `content`, `position`, timestamps) with a foreign key to `characters`, or at minimum add a Zod schema for the notes JSON on the server and reject malformed values before saving.

**Very large components:**
- Issue: `components/character/basic-info-tab.tsx` (1057 lines), `components/character/notes-tab.tsx` (794), `components/character/spells-talents-tab.tsx` (545), `components/character/skills-kit-tab.tsx` (461), `components/ui/editable-field.tsx` (565) mix data access, calculations, mutation logic, and presentation. Each tab repeats the same `updateCharacterMutation.mutateAsync({ id, data })` try/catch pattern.
- Files: as listed
- Impact: Hard to review or test; changes to one section risk regressions in others.
- Fix approach: Move mutation helpers into a per-section hook (e.g. `useCharacterSection(characterId, 'talents')`) and split presentational sub-components out of each tab.

**Mixed-language code and comments:**
- Issue: Domain identifiers and comments mix Portuguese (`notavel`, `gravementeFerido`, `Mesclar dados do usuário`) and English (`Calculate`, `Hook`, `Store`). Some files use the Portuguese `pt-BR` UI copy inline.
- Files: `lib/calculations/index.ts`, `lib/store/character.ts`, `app/api/[[...route]]/characters/index.ts`
- Impact: Lower discoverability for future contributors. Not a functional defect.
- Fix approach: Pick one convention for code comments and document it in CONVENTIONS.md; keep domain terms as-is.

## Known Bugs

**Corrupted notes are overwritten on next save:**
- Symptoms: If the `notes` string is not a JSON array (e.g., an object or malformed JSON), `allNotes` becomes `[]` and the UI shows no notes. Adding any note then writes `JSON.stringify([newNote])` to the column, permanently replacing the original content.
- Files: `components/character/notes-tab.tsx` (parse IIFE ~lines 98-170; `handleAddNote` ~lines 190-210)
- Trigger: Any note payload that fails `JSON.parse` or parses to a non-array object.
- Workaround: None in code. Back up the `notes` column before editing notes.

**Legacy-notes migration can write duplicate notes:**
- Symptoms: When `notes` holds legacy plain text, `migrateOldNotes` is invoked from inside the render-time IIFE (`notes-tab.tsx` ~line 130). `hasMigratedOldNotes` is local state set only after the mutation resolves, so several renders before the response can each fire a PUT. Each PUT writes a new note with a fresh `Date.now()` id.
- Files: `components/character/notes-tab.tsx` (`migrateOldNotes` ~lines 75-100, render-time call ~line 127)
- Trigger: Open a character whose `notes` is plain text while the page is re-rendering (for example, while the cache updates after the first write).
- Workaround: Refresh; the migrated note is saved, but a duplicate may remain.

**Lost updates on whole-array and whole-object writes:**
- Symptoms: Two sections edited from the same cached snapshot overwrite each other. For example, toggling `usedToday` on a talent builds `talents` from the component's `talents` prop and writes the whole array; a concurrent spell or talent edit in another tab/device is lost.
- Files: `components/character/spells-talents-tab.tsx` (lines ~52-80, 109, 156, 376, 434, 492), `components/character/skills-kit-tab.tsx` (lines ~189-215, 279, 365), `components/character/basic-info-tab.tsx` (lines ~97-130, 646, 943-1016), `components/ui/editable-field.tsx` (`buildUpdateData` sends `currentData[section]` rebuilt from props)
- Trigger: Two open sessions editing the same character, or a stale `character` prop while a mutation is in flight.
- Workaround: None. Refresh before editing from a second device.

**Unbounded and unvalidated list pagination:**
- Symptoms: `GET /api/characters` accepts any `limit` (no maximum); `page` accepts `0` or negative values, producing a negative `skip`. Non-numeric values become `NaN`.
- Files: `lib/schemas/character.ts` (`getCharactersQuerySchema`), `app/api/[[...route]]/characters/index.ts` (GET `/`)
- Trigger: `GET /api/characters?limit=1000000` or `?page=0`.
- Workaround: None.

## Security Considerations

**Stored XSS through notes rendering:**
- Risk: `renderFormattedText` in `components/character/notes-tab.tsx` (~lines 355-411) converts a small markdown subset with regex replacements and injects the result with `dangerouslySetInnerHTML`. The input text is never HTML-escaped, so `<img src=x onerror=...>` or `<script>`-equivalent payloads in a note body execute in the browser of anyone who views that note. Because the app has no authentication (accepted decision), any client that can reach the API can plant such a note.
- Files: `components/character/notes-tab.tsx` (`renderFormattedText`, ~line 407), `app/api/[[...route]]/characters/index.ts` (PUT accepts `notes` as any string)
- Current mitigation: None. No escape, sanitizer, or DOMPurify is used (`grep` for escape/sanitize finds nothing relevant).
- Recommendations: HTML-escape the text (`&`, `<`, `>`, `"`, `'`) before applying the markdown replacements, or render with a React-based markdown renderer that never emits raw HTML. Add a length cap on note content.

**Unvalidated JSON fields on PUT:**
- Risk: `updateCharacterSchema` declares `attributes`, `vitality`, `currentVitality`, `skills`, `weapons`, `armor`, `adventureKit`, `finances`, `languages`, `spells`, `talents` as `z.any()`. Prisma stores whatever arrives. Clients can persist arbitrary shapes, negative values, or oversized arrays (the schema comment says "Array até 3 armas ativas" for weapons, but nothing enforces it). `level` is writable directly via PUT, bypassing the XP rules in `processLevelUp`.
- Files: `lib/schemas/character.ts` (`updateCharacterSchema`), `app/api/[[...route]]/characters/index.ts` (PUT `/:id`), `prisma/schema.prisma` (`weapons` comment)
- Current mitigation: `level` is bounded 0-99; other numeric fields have `min(0)` only where declared.
- Recommendations: Replace the `z.any()` entries with the existing per-field schemas (`attributeValueSchema`, `skillValueSchema`, `vitalityBaseSchema` in `lib/schemas/calculations.ts`, plus new schemas for weapons, spells, talents, and the kit). Enforce the 3-weapon limit and `distributed >= 0` server-side.

**Raw error messages returned to clients:**
- Risk: The level-up route returns `error.message` directly on failure (`app/api/[[...route]]/characters/index.ts`, `POST /:id/level-up` catch block). Other routes return generic messages, so behavior is inconsistent.
- Files: `app/api/[[...route]]/characters/index.ts`
- Current mitigation: Only `processLevelUp` throws custom messages, so exposure is limited.
- Recommendations: Return a fixed message and log details server-side, as the other routes do.

**Secrets handling:**
- Risk: A `.env` file exists at the repo root (gitignored by `.gitignore` `.env*`). `env.example` documents only `DATABASE_URL=`. Contents were not read as part of this analysis.
- Files: `.env` (existence only), `env.example`, `.gitignore`
- Current mitigation: Gitignored; `env.example` lists the one variable.
- Recommendations: Keep `.env` out of commits; add a note in README that `DATABASE_URL` is required.

## Performance Bottlenecks

**Full-document rewrites for notes and lists:**
- Problem: Every note edit or talent toggle sends the entire JSON array, and the server replaces the full column. Payload and write cost grow with the number of notes or talents.
- Files: `components/character/notes-tab.tsx`, `components/character/spells-talents-tab.tsx`, `app/api/[[...route]]/characters/index.ts` (PUT)
- Cause: The JSON-in-column design (see Tech Debt) combined with whole-field updates.
- Improvement path: Normalize notes into their own table; for talents and spells, consider per-item endpoints (`PATCH /:id/talents/:index`) so writes stay small.

**Repeated calculations and large render trees:**
- Problem: `basic-info-tab.tsx` recalculates vitality, berkana, and attribute totals in several handlers and inline JSX (lines ~64, 112, 499, 584, 623). `useCalculatedStats` (store selector) returns a new object on every store change.
- Files: `components/character/basic-info-tab.tsx`, `lib/store/character.ts`, `components/ui/editable-field.tsx`
- Cause: Derived values are computed inline rather than memoized from one source.
- Improvement path: Compute derived stats once per character with `useMemo` from `lib/calculations`, and pass them down.

**Unused heavy UI and charting dependencies in the bundle:**
- Problem: Packages such as `recharts`, `embla-carousel-react`, `cmdk`, `vaul`, and the unused Radix primitives are only reachable through unused `components/ui/*` files. Tree-shaking usually removes unused modules, but the install size, lockfile churn, and the risk of accidental import remain.
- Files: `components/ui/chart.tsx`, `components/ui/carousel.tsx`, `components/ui/command.tsx`, `components/ui/drawer.tsx`, `package.json`
- Cause: Shadcn components were generated but not pruned.
- Improvement path: Prune as described in Tech Debt.

## Fragile Areas

**Field-path updates in `EditableField`:**
- Files: `components/ui/editable-field.tsx` (`buildUpdateData`, lines ~40-140), `lib/store/character.ts` (`updateField`, `useFieldValue`)
- Why fragile: Field names like `"0.damage.d25"` and `"agilidade.race"` are dot-split and used to rebuild nested objects by hand, with a special case for `berkana` keys (`current`, `max`, `bonus`) that map to DB names. A new field needs a new branch or it silently writes to the wrong key.
- Safe modification: Add a unit test for each new section before changing the mapping; prefer passing the full section object explicitly.
- Test coverage: None (no test files exist).

**Derived-stat parity between client and server:**
- Files: see Tech Debt (duplicated formulas)
- Why fragile: The server (`lib/calculations`) and client (`lib/store`, `lib/api/queries`, `lib/constants`) implementations are not guarded by any test that they agree. A change in one place passes all current checks.
- Safe modification: Change `lib/calculations/index.ts` first, then update the other copies or delete them.
- Test coverage: None.

**Render-time side effects in `NotesTab`:**
- Files: `components/character/notes-tab.tsx` (parse IIFE, lines ~98-170)
- Why fragile: The IIFE calls `setHasCorruptedData(true)` and `migrateOldNotes(...)` (which fires a mutation) during render. React may re-run render; in Strict Mode it runs twice. It also contains `console.log` calls (lines ~154-156, ~160-163) that run on every failed parse.
- Safe modification: Move the parse into `useMemo`, and move the migration into a `useEffect` guarded by a ref so it runs once.
- Test coverage: None.

**Silent failures in mutation handlers:**
- Files: `components/character/spells-talents-tab.tsx` (`toggleTalentUsed`, `resetAllTalentsUsage`), `components/character/notes-tab.tsx` (`moveNote` and others), `components/character/skills-kit-tab.tsx`
- Why fragile: Several handlers log with `console.error` and do not show a toast or revert optimistic state (`toggleTalentUsed` has no `toast`, unlike other handlers in the same file).
- Safe modification: Route all mutation errors through one helper that shows a toast and invalidates the character query.
- Test coverage: None.

**Global mutable store and shared module state:**
- Files: `lib/store/character.ts`, `providers/query-provider.tsx` (module-level `browserQueryClient`), `lib/db/index.ts` (global Prisma singleton)
- Why fragile: The Zustand store is a module singleton that is not reset between route transitions except via `reset()`, which no code calls. The store holds a full character copy alongside React Query's cache, so two sources of truth exist.
- Safe modification: Keep server data in React Query only; limit Zustand to UI state (editing field, modal state).
- Test coverage: None.

## Scaling Limits

**Single-row JSON documents:**
- Resource: One `characters` row holds all sections, including notes, spells, talents, and kit.
- Current capacity: Not measured. Each mutation rewrites the whole row's affected JSON column.
- Limit: Growth of notes or spell lists increases request size and the chance of conflicting writes (see Lost updates).
- Scaling path: Normalize collections into child tables (`notes`, `spells`, `talents`, `inventory_items`) with per-item endpoints.

**Unbounded list endpoint:**
- Resource: `GET /api/characters`
- Current capacity: Default `limit` is 10; no maximum is enforced.
- Limit: A large `limit` returns the full table; `count` runs on every request.
- Scaling path: Cap `limit` (for example 100) in `lib/schemas/character.ts`.

**Serverless timeout and region:**
- Resource: `app/api/[[...route]]/route.ts` deployed on Vercel (`vercel.json`: `maxDuration: 30`, region `gru1`)
- Current capacity: Each request opens a Prisma client from `lib/db/index.ts`; no connection pooling configuration is present in `prisma/schema.prisma` or `env.example`.
- Limit: Cold-start connection churn under load; no retry strategy (`providers/query-provider.tsx` sets `retry: false`).
- Scaling path: Use a pooled connection URL (e.g. PgBouncer or the provider's pooler) for `DATABASE_URL`, and document it in `env.example`.

## Dependencies at Risk

**Next.js 16 middleware convention:**
- Risk: `middleware.ts` triggers the deprecation warning described in Tech Debt.
- Impact: Future Next releases may remove it.
- Migration plan: Move the root redirect to `next.config.ts` `redirects()`.

**Duplicate and unused packages:**
- Risk: See Tech Debt (unused packages) and the two lockfiles.
- Impact: Supply-chain surface and upgrade friction.
- Migration plan: Prune packages, keep one lockfile.

**Version alignment:**
- Risk: `mise.toml` pins Node 24, while `@types/node` is `^20` in `package.json`. `vercel.json` pins `BUN_VERSION` 1.2.9.
- Impact: Type definitions may not match the runtime APIs in use.
- Migration plan: Align `@types/node` with the Node major used in `mise.toml`.

## Missing Critical Features

**No automated tests:**
- Problem: No test files (`*.test.*`, `*.spec.*`), no test runner in `package.json`, and no test config exist.
- Blocks: Safe refactoring of the duplicated formulas, verifying the level-up rules, and verifying the notes migration.

**No rate limiting or request size limits on write endpoints:**
- Problem: `POST`/`PUT` accept arbitrarily large JSON bodies (no `bodyLimit` middleware in `app/api/[[...route]]/characters/index.ts`).
- Blocks: Protecting the database from oversized writes. (Authentication is an accepted decision; this concern is about payload size only.)

**No schema-level linting or CI:**
- Problem: No CI configuration file is tracked and the `lint` script is broken (see Tech Debt).
- Blocks: Catching hook-rule violations and dead code automatically.

## Test Coverage Gaps

**Calculation logic:**
- What's not tested: `lib/calculations/index.ts` (attribute, vitality, berkana, skill, XP, and level-up formulas), and the duplicated copies in `lib/api/queries.ts`, `lib/store/character.ts`, and `lib/constants/character.ts`.
- Files: `lib/calculations/index.ts`, `lib/api/queries.ts`, `lib/store/character.ts`, `lib/constants/character.ts`
- Risk: Off-by-one level thresholds (`level >= 5`) or multiplier errors reach players unnoticed.
- Priority: High

**Character API routes:**
- What's not tested: CRUD, validation errors, 404 paths, and the `level-up` XP check in `app/api/[[...route]]/characters/index.ts`.
- Files: `app/api/[[...route]]/characters/index.ts`, `lib/schemas/character.ts`
- Risk: Validation regressions (the `z.any()` fields) and pagination bugs (negative `page`).
- Priority: High

**Notes parsing and migration:**
- What's not tested: JSON parsing fallback, legacy text migration, and corruption handling in `components/character/notes-tab.tsx`.
- Files: `components/character/notes-tab.tsx`
- Risk: Silent data loss (see Known Bugs).
- Priority: High

**Edit field path mapping:**
- What's not tested: `buildUpdateData` in `components/ui/editable-field.tsx` for basic, berkana, bi-nested, and tri-nested paths.
- Files: `components/ui/editable-field.tsx`
- Risk: Writes to wrong keys, or dropped sibling data.
- Priority: Medium

**Components:**
- What's not tested: All character tabs and forms (`components/character/*`, `components/forms/character-layout.tsx`).
- Files: as listed
- Risk: Regressions in edit mode and mutation wiring.
- Priority: Medium

---

*Concerns audit: 2026-11-01*
