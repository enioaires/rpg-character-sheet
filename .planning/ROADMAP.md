# Roadmap: RPG Character Sheet

## Milestones

- 🚧 **v1.1 Code Quality & Reliability** - Phases 1-4 (in progress)

## Overview

Maintenance milestone for a working app: no new gameplay features, and every derived number must stay identical. The work runs in four dependency-ordered steps. First, strip dead code and make `lib/calculations` the single, tested source of game formulas. Second, harden the API so malformed data is rejected and two devices can no longer silently overwrite each other. Third, fix the notes tab and inline editor correctness bugs (render-time side effects, destructive migration, stored XSS). Last, bring tooling up (ESLint, one lockfile, Next 16 redirect, accurate docs) and split the three oversized tab components, with the full gate (`tsc`, `lint`, `test`, `build`) passing. Execution is planned as a GSD quick-batch, so each phase's plans are small, independent tasks.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Dead Code Cleanup & Calculation Source of Truth** - Remove unused routes, hooks, simulated saves and dependencies; unify all formulas in `lib/calculations` with unit tests
- [ ] **Phase 2: API Validation & Concurrency** - Real Zod validation for JSON fields, optimistic concurrency with 409 handling in the UI, bounded list pagination
- [ ] **Phase 3: Notes & Editor Correctness** - Fix conditional hook, render-time side effects, destructive notes migration and stored XSS, with notes logic in one shared util
- [ ] **Phase 4: Tooling & Component Structure** - Working ESLint, single Bun lockfile, non-deprecated redirect, accurate docs, and the three largest tabs split into subcomponents

## Phase Details

### Phase 1: Dead Code Cleanup & Calculation Source of Truth
**Goal**: The codebase contains only code that is actually used, and every derived stat shown on the sheet comes from one set of formulas in `lib/calculations` that is protected by unit tests
**Depends on**: Nothing (first phase)
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03, CALC-01, CALC-02
**Success Criteria** (what must be TRUE):
  1. A character sheet for an existing character shows exactly the same attribute totals, vitality stages, max Berkana, skill totals and available skill points as before the change, and each of these is computed by a function exported from `lib/calculations` (no formula copies remain in `lib/api/queries.ts`, `lib/store/character.ts`, `lib/constants/character.ts` or inline in components)
  2. `bun test` runs and passes, with unit tests covering every exported function in `lib/calculations`, including level 0, the level-5 boundary and skill-point validation
  3. The routes `level-up`, `calculate-vitality`, `calculate-berkana`, `validate-skills`, `calculate-attributes`, `calculate-xp`, `calculate-skill-points` and `recalculate`, their client hooks and their request/response schemas no longer exist, while listing, creating, opening, editing and deleting characters still work
  4. Every inline edit on the sheet persists through the real API: the simulated `setTimeout` save path and unused pending-changes state are gone from the Zustand store
  5. The unused packages (`@hono/zod-openapi`, `@scalar/hono-api-reference`, `recharts`, `embla-carousel-react`, `react-day-picker`, `input-otp`, `vaul`, `react-resizable-panels`, `cmdk`, `react-hook-form`) and the `components/ui` files that depend on them are removed, and `bun install` plus `bun run build` still succeed
**Plans**: TBD

Notes for planning: keep (or relocate into `lib/schemas/character.ts`) the reusable per-field schemas in `lib/schemas/calculations.ts` (`attributeValueSchema`, `vitalityBaseSchema`, `vitalityLevelsSchema`, `skillValueSchema`) because Phase 2 builds on them; only the route-specific request/response schemas are deleted. Removing the store fallback in `EditableField` (CLEAN-02) also removes the cause of the conditional hook, but BUG-01 stays tracked in Phase 3. Recommended order inside the phase: delete dead code, then unify formulas, then write tests against the unified module.

### Phase 2: API Validation & Concurrency
**Goal**: The API rejects malformed character data and never silently overwrites another device's edit, while existing production rows keep loading and saving
**Depends on**: Phase 1
**Requirements**: API-01, API-02, API-03
**Success Criteria** (what must be TRUE):
  1. A `PUT /api/characters/:id` carrying malformed data in any JSON field (attributes, vitality, currentVitality, skills, weapons, armor, adventureKit, finances, languages, spells, talents) is rejected with 400, while every existing stored character shape still loads and saves normally, including rows with extra or missing optional fields
  2. When the same character is open on two devices and the second device saves after the first, the stale save is rejected with 409, a toast tells the user, and the sheet refetches the latest data instead of overwriting the other device's edit
  3. Normal single-device inline editing still saves on every edit without spurious conflicts (each successful save refreshes the `updatedAt` the client sends next)
  4. `GET /api/characters` with `page=0`, a negative or non-numeric `page`, or an oversized `limit` (e.g. `limit=1000000`) returns a valid bounded page instead of a negative offset, `NaN` or the whole table
**Plans**: TBD

Notes for planning: schemas must tolerate extra and optional fields (data compatibility constraint). Plumb the `updatedAt` handling centrally in `useUpdateCharacter` and the PUT route so every tab, including the notes tab in Phase 3, inherits it.

### Phase 3: Notes & Editor Correctness
**Goal**: The notes tab and inline editor behave correctly under React rules, never destroy user data, and cannot execute injected HTML
**Depends on**: Phase 2
**Requirements**: BUG-01, BUG-02, BUG-03, NOTE-01
**Success Criteria** (what must be TRUE):
  1. A note whose body contains `<img src=x onerror=...>` or `<script>` displays as literal text and executes nothing, while the existing light-markdown formatting (bold, italic and the other supported syntax) still renders correctly
  2. Opening a character whose `notes` column holds legacy plain text converts it into exactly one note, with no duplicate notes even across re-renders or React Strict Mode
  3. Opening a character whose `notes` column is corrupted shows a clear non-destructive state, and adding or editing notes does not silently overwrite the corrupted content
  4. Parsing, legacy migration and serialization of `notes` live in one shared util used by the notes tab, and the `notes` column type is unchanged
  5. `EditableField` calls no hook conditionally, `NotesTab` performs no setState or network call during render, and no stray `console.log` output appears when opening or editing notes
**Plans**: TBD

Notes for planning: the legacy migration write must go through the concurrency-aware update path from Phase 2 and be guarded so it fires at most once (effect plus ref, not render). Do this before splitting `notes-tab.tsx` in Phase 4.

### Phase 4: Tooling & Component Structure
**Goal**: Project tooling works end to end and the three largest tab components are small enough to review, with identical behavior and the full definition-of-done gate green
**Depends on**: Phase 3
**Requirements**: TOOL-01, TOOL-02, TOOL-03, TOOL-04, STRUCT-01
**Success Criteria** (what must be TRUE):
  1. `bun run lint` runs ESLint with a flat config and `eslint-config-next` (react-hooks rules enabled) and exits 0
  2. Only `bun.lock` is tracked (`package-lock.json` is gone) and a fresh `bun install` works
  3. Visiting `/` redirects to `/characters` and `bun run build` shows no deprecated-middleware warning (no `middleware.ts`)
  4. The README and `.kiro/steering/*.md` describe the real stack and versions (Next 16, React 19, Bun, Prisma 6, Zod 4) and the correct commands
  5. `basic-info-tab.tsx`, `notes-tab.tsx` and `spells-talents-tab.tsx` are each under about 400 lines, composed of smaller subcomponents, and the character sheet behaves identically; `npx tsc --noEmit`, `bun run lint`, `bun test` and `bun run build` all pass
**Plans**: TBD

Notes for planning: ESLint is deliberately last so it runs against already-cleaned code and acts as the final gate for the Phase 3 hook and render-side-effect fixes. Phases 1-3 are verified with `tsc`, `bun test` and `bun run build` since `bun run lint` does not work until this phase.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Dead Code Cleanup & Calculation Source of Truth | 0/0 | Not started | - |
| 2. API Validation & Concurrency | 0/0 | Not started | - |
| 3. Notes & Editor Correctness | 0/0 | Not started | - |
| 4. Tooling & Component Structure | 0/0 | Not started | - |
