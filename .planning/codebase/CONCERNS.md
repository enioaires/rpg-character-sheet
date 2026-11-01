---
last_mapped_commit: 216d4bd8bdc9621832748458a63bb5e0b24f8795
last_mapped_at: 2026-11-01
---
# Codebase Concerns

**Analysis Date:** 2026-11-01

## Accepted Decisions (not issues)

- **No authentication or authorization.** The owner has confirmed the app intentionally has no auth. Any client that can reach `/api/characters/*` can read, modify, and delete any character.
- **Unconditional PUT without `expectedUpdatedAt` (compatibility exception).** `app/api/[[...route]]/characters/index.ts` (PUT `/:id`, around line 186) still writes without a version check when the body omits `expectedUpdatedAt`. This exists so tabs opened before a deploy keep working. The 409 guarantee covers token-bearing saves only. Follow-up: once a deploy has passed and pre-deploy tabs have reloaded, make `expectedUpdatedAt` required in `lib/schemas/character.ts` (missing returns 400) and delete the unconditional branch.

## Known Bugs

**Skill keys in `SKILLS` do not match stored keys:**
- Symptoms: The two skills `atuação` and `ataqueSupresa` are looked up in the skills object under spellings that differ from the keys stored by defaults (`atuacao`, `ataqueSurpresa`). The skills tab shows 0 for those two skills, and editing them writes to the new key while the old stored value stays in place.
- Files: `lib/constants/character.ts` (`SKILLS` lines ~24-26, labels lines ~82-84), `lib/defaults/character.ts` (lines ~44, ~46), `components/character/skills-kit-tab.tsx` (lines ~74, ~318, ~353), `lib/calculations/index.ts` (skill list around line ~367 uses the stored spelling)
- Trigger: Open the skills tab on any character, or edit either skill.
- Impact: Used-point counts are built from `SKILLS` keys (`skills-kit-tab.tsx` ~line 318), so the stored distributed points for these two skills are not counted. Remaining skill points are therefore overstated, and totals for those skills are wrong.
- Workaround: None.
- Fix approach: Choose one spelling, move stored keys with a one-time data migration, and derive `SKILLS` from the defaults object so the two cannot drift again.

**Editing a custom language name corrupts the `languages.custom` shape:**
- Symptoms: After renaming a custom language, `languages.custom` is saved as an index-keyed object (`{"0": {...}, "1": {...}}`) instead of an array. The custom list then fails its `length` check and its entries are not rendered.
- Files: `components/character/basic-info/languages-card.tsx` (field `custom.${index}.name`, line ~140; render check ~line 104), `components/ui/editable-field.tsx` (`buildUpdateData`, tri-nested branch around lines ~80-95, which spreads the array into an object), `lib/schemas/character.ts` (`custom` accepts array or indexed record, lines ~206-211, so the server accepts the wrong shape)
- Trigger: Click the edit control on any custom language entry and change its name.
- Impact: Custom languages disappear from the sheet after a rename, and the stored shape is inconsistent for later readers.
- Workaround: Re-add the language entries (the "add" control still writes an array).
- Fix approach: In `buildUpdateData`, rebuild array sections as arrays (as the `weapons`/`spells`/`talents` branches already do), or give `custom` its own update path. Tighten the schema to the array form once existing rows are normalized.

**Attributes modal omits the attribute level bonus:**
- Symptoms: The "Todos os Atributos" modal shows race + class + bonus only. The sheet total also adds `getAttributeLevelBonus(level)` (from level 5), so modal values disagree with the sheet for characters at level 5 or higher.
- Files: `components/character/attributes-modal.tsx` (line ~33, `calculateAttributeBase`), `components/ui/editable-field.tsx` (`calculateAttributeTotal` with `getAttributeLevelBonus`), `lib/calculations/index.ts`
- Trigger: Open the attributes modal on a character with level 5 or higher.
- Impact: Users see two different totals for the same attribute.
- Workaround: Read the value on the sheet.
- Fix approach: Pass `level` into the modal and use `calculateAttributeTotal`, or label the modal values as "base" explicitly.

**Two skill-point pools with different formulas:**
- Symptoms: The skills tab computes available points as `(level + 1) * 10` (counts level 0). The validation and hook `skillPoints.available` use `level * 10`.
- Files: `components/character/skills-kit-tab.tsx` (line ~320, `calculateTotalSkillPoints`), `lib/calculations/index.ts` (`calculateAvailableSkillPoints`, `calculateLevelUpSkillPoints`, lines ~176-217), `lib/api/queries.ts` (`useCalculateDerivedStats`), `lib/store/character.ts` (`useCalculatedStats`)
- Trigger: Any character at any level. The two numbers differ by 10 at every level.
- Impact: The tab can allow a distribution that the validation rejects, or the reverse.
- Workaround: None. Both pools are preserved on purpose by the formula unification work; they have not been reconciled.
- Fix approach: Decide the correct pool with the game rules, then use one function everywhere in `lib/calculations/index.ts`.

## Known Issues (open)

**Whole-array writes can overwrite data from a pre-deploy client:**
- Symptoms: Spell and talent edits, and talent `usedToday` toggles, rebuild the full array from the component's props and send it. Conflict detection (409) only applies when `expectedUpdatedAt` is present. A client that still runs the old bundle sends no token, so its write lands unconditionally.
- Files: `components/character/spells-talents/spells-card.tsx` (line ~61, ~108), `components/character/spells-talents/talents-card.tsx` (lines ~42, ~58, ~102), `components/character/skills-kit-tab.tsx`, `lib/api/character-concurrency.ts`
- Trigger: A tab left open across a deploy, then a save.
- Impact: Concurrent edits from an old bundle can drop another device's changes.
- Workaround: Reload open tabs after a deploy.
- Fix approach: Remove the unconditional branch as described under Accepted Decisions. Longer term, use per-item endpoints (see Performance Bottlenecks).

**Level can be written directly and XP rules are not enforced server-side:**
- Symptoms: `updateCharacterSchema` accepts `level` (0-99) on PUT. The `level-up` route that enforced XP rules was removed (261101-iie), so no server path checks XP before a level change.
- Files: `lib/schemas/character.ts` (`updateCharacterSchema`, line ~16), `app/api/[[...route]]/characters/index.ts` (PUT `/:id`)
- Trigger: Any PUT with a `level` value.
- Impact: Leveling is not gated by the game's XP rules. The formulas in `lib/calculations/index.ts` still exist, but nothing calls them on the server.
- Workaround: None.
- Fix approach: If XP gating is wanted, restore a server-side level-up route that validates XP and call it from the UI. If not, document that level is a free field.

**Validation is tolerant, so unknown keys and shapes pass:**
- Symptoms: The JSON-column schemas use `partial()` and `catchall(z.json())`, so unknown keys and loosely typed sub-objects are stored. `custom` languages accept either array or record (see Known Bugs).
- Files: `lib/schemas/character.ts`, `app/api/[[...route]]/characters/index.ts`
- Impact: Stored data can drift from the shapes the UI expects. Several of the defects above are reachable because of this.
- Fix approach: Make the schemas strict on the shapes the UI actually writes, and normalize existing rows once.

## Tech Debt

**Unused shadcn UI primitives and their packages:**
- Issue: Files in `components/ui/` with no consumer outside `components/ui/` (grep-based): `accordion`, `alert`, `aspect-ratio`, `avatar`, `breadcrumb`, `context-menu`, `dropdown-menu`, `hover-card`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `select`, `sheet`, `sidebar`, `skeleton`, `slider`, `switch`, `table`, `toggle`, `toggle-group`. Some are consumed only by other unused primitives (`sheet` and `skeleton` by `sidebar`, `toggle` by `toggle-group`).
- Packages still in `package.json` with no use outside those files: `@radix-ui/react-accordion`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-context-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-select`, `@radix-ui/react-slider`, `@radix-ui/react-switch`, `@radix-ui/react-toggle-group`.
- Also: `@tanstack/react-query-devtools` has no imports (`app`, `components`, `lib`, `providers`, `hooks`). `hooks/use-mobile.ts` is used only by `components/ui/sidebar.tsx`. `date-fns` has one use, `app/characters/page.tsx`.
- Files: `components/ui/*.tsx` (listed), `hooks/use-mobile.ts`, `package.json`, `bun.lock`
- Impact: Install size, supply-chain surface, and the risk of accidental import.
- Fix approach: Delete the unused files and packages, then run `bun install` to sync `bun.lock`. Re-add shadcn components on demand with `components.json`.

**Console output left in application code:**
- Issue: About 30 `console.log`/`console.error`/`console.warn` calls remain in source (not tests). The largest counts: `app/api/[[...route]]/characters/index.ts` (5), `components/character/notes-tab.tsx` (6), `components/character/spells-talents/talents-card.tsx` (5), `components/character/skills-kit-tab.tsx` (4), `components/character/basic-info/languages-card.tsx` (3).
- Files: as listed
- Impact: Noise in browser and server logs. Some errors are logged only, with no user feedback (for example `toggleTalentUsed` in `talents-card.tsx`, line ~47, has no toast).
- Fix approach: Route mutation errors through one helper that shows a toast and logs once. Remove debug logging.

**Silent failures in `skills-kit-tab.tsx`:**
- Issue: The file has no toast calls. Mutation failures there do not reach the user (the shared `useUpdateCharacter.onError` only toasts on the conflict path).
- Files: `components/character/skills-kit-tab.tsx`
- Impact: Failed skill edits look successful.
- Fix approach: Add the same error helper used by other tabs.

**Large files:**
- Issue: `components/character/skills-kit-tab.tsx` is 466 lines (explicitly outside the split work). `components/ui/editable-field.tsx` is 584 lines and mixes the field component with `buildUpdateData` (about 140 lines of hand-written path mapping). `components/character/spells-talents/spells-card.tsx` is 296 lines and `talents-card.tsx` is 267 lines.
- Files: as listed
- Impact: Harder to review and test; changes to one section risk regressions in others.
- Fix approach: Split `skills-kit-tab.tsx` like the other tabs. Move `buildUpdateData` into `lib/` as a pure function and test it.

**Field-path updates in `EditableField`:**
- Issue: Field names such as `"0.damage.d25"`, `"agilidade.race"`, and `"custom.0.name"` are split on `.` and used to rebuild nested objects by hand. Each section has its own branch (`weapons`, `adventureKit`, `spells`, `talents`, `berkana` mapping).
- Files: `components/ui/editable-field.tsx` (`buildUpdateData`, lines ~35-150), `components/ui/editable-scaling-field.tsx`
- Why it matters: A new section or nested shape needs a new branch, or it silently writes to the wrong key. This is the root cause of the custom-language bug.
- Fix approach: Pass the whole section object explicitly from callers, or make the mapping a pure, tested function.

**Mixed-language code and comments:**
- Issue: Domain identifiers and comments mix Portuguese and English (`Calculate`, `Hook`, `Store` next to `notavel`, `Mesclar dados do usuário`).
- Files: `lib/calculations/index.ts`, `lib/store/character.ts`, `app/api/[[...route]]/characters/index.ts`
- Impact: Lower discoverability for future contributors. Not a functional defect.
- Fix approach: Choose one comment convention and record it in `.planning/codebase/CONVENTIONS.md`. Keep domain terms as they are.

**Node and types version mismatch:**
- Issue: `mise.toml` pins Node 24, while `package.json` has `@types/node` at `^20`.
- Files: `mise.toml`, `package.json`
- Impact: Type definitions may not match the runtime APIs in use.
- Fix approach: Align `@types/node` with the Node major in `mise.toml`.

## Security Considerations

**No request body size limit:**
- Risk: `POST` and `PUT` accept arbitrarily large JSON bodies. No `bodyLimit` middleware is registered in `app/api/[[...route]]/characters/index.ts` or the Hono setup under `app/api/[[...route]]/route.ts`.
- Files: `app/api/[[...route]]/characters/index.ts`, `app/api/[[...route]]/route.ts`
- Current mitigation: Zod validation runs after the body is read, so oversized payloads are parsed in full before rejection.
- Recommendations: Add a body limit (for example 256 KB) on the write routes. Note that Hono's `bodyLimit` is applied before validation.

**Secrets handling:**
- Risk: A `.env` file exists at the repo root (gitignored by `.gitignore` `.env*`). Its contents were not read during this analysis.
- Files: `.env` (existence only), `env.example` (documents `DATABASE_URL` only), `.gitignore`
- Current mitigation: Gitignored; `env.example` lists the one variable.
- Recommendations: Keep `.env` out of commits. Document the required variable in `README.md`.

**Stored XSS through notes is fixed; keep the escape step in place:**
- Risk: Note rendering uses `dangerouslySetInnerHTML` with `formatNoteHtml` output (`components/character/notes/note-card.tsx`, `lib/notes-format.ts`). Removing the `escapeHtml` step from `lib/notes-format.ts` would reintroduce stored XSS.
- Files: `lib/notes-format.ts`, `lib/notes-format.test.ts`, `components/character/notes/note-card.tsx`
- Current mitigation: Escape runs before the markdown chain, with tests for script and attribute payloads.

## Performance Bottlenecks

**Full-array rewrites for spells and talents:**
- Problem: Every spell or talent edit, and every `usedToday` toggle, sends the full array. Notes are also rewritten as a whole array on each change.
- Files: `components/character/spells-talents/spells-card.tsx`, `components/character/spells-talents/talents-card.tsx`, `components/character/notes-tab.tsx`, `app/api/[[...route]]/characters/index.ts` (PUT)
- Cause: JSON columns with whole-field updates.
- Improvement path: Per-item endpoints (for example `PATCH /:id/talents/:index`) so writes stay small. Normalize notes into a child table.

## Fragile Areas

**`buildUpdateData` (field-path mapping):**
- Files: `components/ui/editable-field.tsx` (lines ~35-150)
- Why fragile: See Tech Debt. A wrong branch writes silently to the wrong key or drops sibling data.
- Safe modification: Add a test for each new section's path shape before changing the mapping. Prefer passing the full section object explicitly.
- Test coverage: None (no test file covers `buildUpdateData`).

**Notes storage in a `String` column:**
- Files: `prisma/schema.prisma` (`notes String?`), `lib/notes.ts`, `components/character/notes-tab.tsx`
- Why fragile: The column holds JSON. `lib/notes.ts` parses it and refuses writes when the data is unreadable (so corrupt data is not overwritten), and migrates legacy plain text once per page session. The column still has no schema at the database level, and any client that writes it directly bypasses these guards.
- Safe modification: Change parsing only in `lib/notes.ts` and keep `canWriteNotes` checks on every write path.
- Test coverage: `lib/notes.test.ts` and `components/character/notes-tab.render.test.ts`.

**Global Zustand store alongside React Query:**
- Files: `lib/store/character.ts` (151 lines), `providers/query-provider.tsx` (module-level `browserQueryClient`), `lib/db/index.ts` (global Prisma singleton)
- Why fragile: The store is a module singleton and holds UI editing state. The character data is held in React Query. Two sources of truth still exist for the same character.
- Safe modification: Keep server data in React Query only. Limit the store to editing UI state.
- Test coverage: None for the store.

## Scaling Limits

**Single-row JSON documents:**
- Resource: One `characters` row holds all sections, including notes, spells, talents, and kit.
- Current capacity: Not measured. Each mutation rewrites the affected JSON column.
- Limit: Growth of notes or spell lists increases request size and the chance of conflicting writes.
- Scaling path: Normalize collections into child tables with per-item endpoints.

**Unbounded `count` on the list endpoint:**
- Resource: `GET /api/characters`
- Current capacity: `limit` is clamped to 1-100 and `page` to 1-10000 (`lib/schemas/character.ts`).
- Limit: `count` runs on every request.
- Scaling path: Cache the count or use an estimate when the table grows.

**Serverless timeout and connections:**
- Resource: `app/api/[[...route]]/route.ts` deployed on Vercel (`vercel.json`: `maxDuration: 30`, region `gru1`)
- Current capacity: Each request uses the Prisma client from `lib/db/index.ts`. No connection pooling configuration is present in `prisma/schema.prisma` or `env.example`.
- Limit: Cold-start connection churn under load. `providers/query-provider.tsx` sets `retry: false`.
- Scaling path: Use a pooled connection URL for `DATABASE_URL` and document it in `env.example`.

## Dependencies at Risk

**Version alignment:**
- Risk: See Node and types version mismatch under Tech Debt.
- Impact: Type definitions may not match the runtime.
- Migration plan: Align `@types/node` with the Node major in `mise.toml`.

## Missing Critical Features

**No CI configuration:**
- Problem: No CI workflow is tracked (`.github/` is absent). Lint and tests run only when a developer runs them.
- Blocks: Catching regressions in calculations, the API, and the notes parser automatically.

**No rate limiting:**
- Problem: No rate limiting on any route. (Authentication is an accepted decision; this concern is about request volume only.)
- Blocks: Protecting the database from bursts of writes.

## Test Coverage Gaps

**`buildUpdateData` and field-path mapping:**
- What's not tested: Basic, berkana, bi-nested, and tri-nested paths, including `custom.<index>.name`.
- Files: `components/ui/editable-field.tsx`
- Risk: The custom-language corruption and other wrong-key writes go unnoticed.
- Priority: High

**Skills tab and skill key set:**
- What's not tested: `SKILLS` keys against the stored defaults, used-point and remaining-point math, and the two pool formulas as used by `components/character/skills-kit-tab.tsx`.
- Files: `components/character/skills-kit-tab.tsx`, `lib/constants/character.ts`, `lib/defaults/character.ts`
- Risk: The key mismatch and pool divergence stay invisible.
- Priority: High

**Attributes modal parity with the sheet:**
- What's not tested: That the modal total equals the sheet total at levels 5 and above.
- Files: `components/character/attributes-modal.tsx`, `components/ui/editable-field.tsx`
- Risk: Divergent totals reach users.
- Priority: Medium

**Mutation error handling in tabs:**
- What's not tested: Toast and state behavior on failure in `skills-kit-tab.tsx`, `talents-card.tsx`, and `spells-card.tsx`.
- Files: as listed
- Risk: Silent failures.
- Priority: Medium

**Character API routes beyond concurrency and JSON validation:**
- What's covered: `app/api/[[...route]]/characters/index.test.ts`, `lib/schemas/character.test.ts`, `lib/api/character-concurrency.test.ts`.
- What's not tested: The level-write path (no XP gate exists to test), and DELETE behavior.
- Files: `app/api/[[...route]]/characters/index.ts`
- Risk: Level changes and deletes regress unnoticed.
- Priority: Medium

---

*Concerns audit: 2026-11-01*
