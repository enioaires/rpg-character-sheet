---
gsd_state_version: '1.0'
status: planning
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-11-01)

**Core value:** Players can open their character during a session and edit any field inline with the change saved reliably — no lost edits, no wrong derived numbers.
**Current focus:** Phase 1 — Dead Code Cleanup & Calculation Source of Truth (milestone v1.1 Code Quality & Reliability)

## Current Position

Phase: 1 of 4 (Dead Code Cleanup & Calculation Source of Truth)
Plan: 0 of 0 in current phase
Status: Ready to plan
Last activity: 2026-11-01 — Roadmap created (4 phases, 17/17 v1 requirements mapped)

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: - min
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 4 coarse phases, dependency-ordered: cleanup + calculations/tests, then API validation/concurrency, then notes/editor correctness, then tooling + component splits
- [Roadmap]: ESLint comes last so it lints already-cleaned code and gates the hook/render fixes; Phases 1-3 verify with tsc + bun test + build
- [PROJECT]: No authentication; keep `notes` as a JSON string in a `String` column; optimistic concurrency via `updatedAt` (409 on conflict)

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1]: CLEAN-01 deletes route schemas in `lib/schemas/calculations.ts`, but Phase 2 reuses its per-field schemas (`attributeValueSchema`, `vitalityBaseSchema`, `vitalityLevelsSchema`, `skillValueSchema`); keep or relocate those four.
- [Phase 1]: CLEAN-02 (removing the store fallback in `EditableField`) also removes the cause of BUG-01 (conditional hook); BUG-01 is still verified in Phase 3.
- [Phase 2]: New Zod schemas must accept every shape already stored in production (extra/optional fields tolerated); no DB access during planning, so keep them permissive.
- [All]: `bun run lint` is broken until Phase 4; do not treat it as a gate before then.

### Quick Tasks Completed

| # | Description | Date | Commit | Status | Directory |
|---|-------------|------|--------|--------|-----------|
| 261101-iie | Remove dead code (CLEAN-01..03): delete unused API routes level-up, calculate-vitality, calculate-berkana, validate-skills, calculate-attributes, calculate-xp, calculate-skill-points, recalculate in app/api/[[...route]]/characters/index.ts plus their hooks in lib/api/queries.ts and route schemas in lib/schemas/calculations.ts (keep/relocate attributeValueSchema, vitalityBaseSchema, vitalityLevelsSchema, skillValueSchema for reuse); remove simulated saveField/savePendingChanges/pendingChanges from lib/store/character.ts and the store fallback path in components/ui/editable-field.tsx; remove never-imported deps (@hono/zod-openapi, @scalar/hono-api-reference, recharts, embla-carousel-react, react-day-picker, input-otp, vaul, react-resizable-panels, cmdk, react-hook-form) and the unused components/ui files that depend on them; verify usage before deleting; update bun.lock via bun install | 2026-11-01 | 02c311b | — | .planning/quick/261101-iie-remove-dead-code-clean-01-03-delete-unused-api-routes-level |
| 261101-iif | Unify game formulas (CALC-01): lib/calculations/index.ts is the only place formulas live; replace the duplicate implementations in useCalculateDerivedStats (lib/api/queries.ts), useCalculatedStats (lib/store/character.ts), lib/constants/character.ts and any inline copies in components with imports from lib/calculations; derived numbers must stay identical | 2026-11-01 | 0f759b0 | — | .planning/quick/261101-iif-unify-game-formulas-calc-01-lib-calculations-index-ts-is-the |
| 261101-iig | Add unit tests (CALC-02): bun test suite for every exported function in lib/calculations, covering level 0, level-5 boundaries, vitality stages, Berkana, skill totals, skill-point availability and validateSkillDistribution errors; add a "test" script to package.json | 2026-11-01 | 8ab3d0e | — | .planning/quick/261101-iig-add-unit-tests-calc-02-bun-test-suite-for-every-exported-fun |
| 261101-iih | Validate JSON fields on update and bound pagination (API-01, API-03): replace z.any() in updateCharacterSchema (lib/schemas/character.ts) with real Zod schemas for attributes, vitality, currentVitality, skills, weapons, armor, adventureKit, finances, languages, spells, talents that accept every shape currently stored (use passthrough/optional; spells have damage/duration {base, perLevel}, talents have oncePerDay/usedToday) and return 400 on malformed data; clamp GET /api/characters page to >=1 and limit to 1..100 | 2026-11-01 | 7140133 | — | .planning/quick/261101-iih-validate-json-fields-on-update-and-bound-pagination-api-01-a |
| 261101-iii | Optimistic concurrency (API-02): useUpdateCharacter sends the updatedAt it last saw; PUT /api/characters/:id returns 409 when the stored updatedAt differs; on 409 the UI shows a pt-BR sonner toast and refetches the character instead of overwriting; normal single-device editing (including rapid consecutive saves) must never hit spurious conflicts — update the cached updatedAt from each successful response | 2026-11-01 | 6a57d20 | — | .planning/quick/261101-iii-optimistic-concurrency-api-02-useupdatecharacter-sends-the-u |
| 261101-iij | Fix React correctness bugs (BUG-01, BUG-02): no conditional hook call in components/ui/editable-field.tsx; no setState (setHasCorruptedData) or network migration during render in components/character/notes-tab.tsx (move to effects/derived state); remove stray console.log calls | 2026-11-01 | a590812 | — | .planning/quick/261101-iij-fix-react-correctness-bugs-bug-01-bug-02-no-conditional-hook |
| 261101-iik | Centralize notes logic (NOTE-01): create a shared util (e.g. lib/notes.ts) for parsing the notes String column, migrating legacy plain text into a single note, and serializing; notes-tab uses it; the Prisma column stays String; corrupted data shows a non-destructive state and is never overwritten by the next add; legacy migration fires at most once even under React Strict Mode | 2026-11-01 | 4e43493 | — | .planning/quick/261101-iik-centralize-notes-logic-note-01-create-a-shared-util-e-g-lib |
| 261101-iil | Fix stored XSS in notes (BUG-03): HTML-escape note content before the light-markdown formatting in components/character/notes-tab.tsx (dangerouslySetInnerHTML) so <script> and <img onerror> render as literal text while bold/italic/code/headings/lists/line breaks keep working; add a unit test for the formatter | 2026-11-01 | 4051cc2 | — | .planning/quick/261101-iil-fix-stored-xss-in-notes-bug-03-html-escape-note-content-befo |
| 261101-iim | Tooling and docs (TOOL-01..04): add ESLint flat config (eslint.config.mjs) with eslint-config-next and set "lint": "eslint ." so bun run lint exits 0 (fix or narrowly disable remaining violations); delete package-lock.json (Bun only); replace deprecated middleware.ts with a server redirect in app/page.tsx (next/navigation redirect to /characters); rewrite README.md and update .kiro/steering/tech.md and structure.md to the real stack, versions and commands | 2026-11-01 | f06ec03 | — | .planning/quick/261101-iim-tooling-and-docs-tool-01-04-add-eslint-flat-config-eslint-co |
| 261101-iin | Split large components (STRUCT-01): break components/character/basic-info-tab.tsx, notes-tab.tsx and spells-talents-tab.tsx into smaller subcomponents (each file under ~400 lines) with identical behavior and props; do this after the notes/XSS/hook fixes so it splits the fixed code; final gate: npx tsc --noEmit, bun run lint, bun test and bun run build all pass | 2026-11-01 | 8ca5bb4 | — | .planning/quick/261101-iin-split-large-components-struct-01-break-components-character |

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-11-01
Stopped at: Roadmap created; ready to plan Phase 1
Resume file: None
