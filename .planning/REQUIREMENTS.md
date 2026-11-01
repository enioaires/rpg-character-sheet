# Requirements: RPG Character Sheet

**Defined:** 2026-11-01
**Core Value:** Players can open their character during a session and edit any field inline with the change saved reliably — no lost edits, no wrong derived numbers.

## v1 Requirements

Milestone v1.1 — code quality & reliability. No user-facing feature changes; derived numbers must stay identical. Evidence for each item: `.planning/codebase/CONCERNS.md`.

### Calculations

- [ ] **CALC-01**: All game formulas (attribute total, vitality stages, max Berkana, skill total, skill points) are defined only in `lib/calculations`; `useCalculateDerivedStats` (`lib/api/queries.ts`), `useCalculatedStats` (`lib/store/character.ts`) and inline copies in components import from it instead of reimplementing them
- [ ] **CALC-02**: `bun test` runs unit tests covering every exported function in `lib/calculations` (including level 0, level-5 boundaries and skill-point validation)

### Cleanup

- [ ] **CLEAN-01**: Unused API routes (`level-up`, `calculate-vitality`, `calculate-berkana`, `validate-skills`, `calculate-attributes`, `calculate-xp`, `calculate-skill-points`, `recalculate`), their client hooks and their schemas in `lib/schemas/calculations.ts` are removed
- [ ] **CLEAN-02**: Simulated `saveField` / `savePendingChanges` (setTimeout) and pending-changes state are removed from the Zustand store, keeping only state that is actually used
- [ ] **CLEAN-03**: Dependencies never imported by app code (`@hono/zod-openapi`, `@scalar/hono-api-reference`, `recharts`, `embla-carousel-react`, `react-day-picker`, `input-otp`, `vaul`, `react-resizable-panels`, `cmdk`, `react-hook-form`) and the unused `components/ui` files that depend on them are removed

### API

- [ ] **API-01**: `PUT /api/characters/:id` validates every JSON field (attributes, vitality, currentVitality, skills, weapons, armor, adventureKit, finances, languages, spells, talents) with a real Zod schema that accepts all existing stored shapes (extra/optional fields tolerated) and rejects malformed data with 400
- [ ] **API-02**: Updates use optimistic concurrency — client sends the `updatedAt` it last saw; the server returns 409 if the row changed; the UI shows a toast and refetches the character instead of overwriting another device's edit
- [ ] **API-03**: `GET /api/characters` clamps `page` to ≥ 1 and `limit` to a sane maximum (e.g. 1–100)

### Correctness

- [ ] **BUG-01**: `components/ui/editable-field.tsx` calls no hook conditionally (rules of hooks respected)
- [ ] **BUG-02**: `components/character/notes-tab.tsx` performs no setState or network migration during render, and stray `console.log` calls are removed
- [ ] **BUG-03**: Note content is HTML-escaped before the light-markdown formatting so text typed in a note can never inject HTML/script (stored XSS fixed)

### Notes

- [ ] **NOTE-01**: Parsing, legacy-text migration and serialization of `notes` live in one shared util (used by the notes tab), the `notes` column stays `String`, corrupted data is never silently overwritten, and the legacy migration fires at most once

### Tooling

- [ ] **TOOL-01**: ESLint flat config with `eslint-config-next` is installed and `bun run lint` (`eslint .`) passes
- [ ] **TOOL-02**: Only `bun.lock` remains (`package-lock.json` removed)
- [ ] **TOOL-03**: The `/` → `/characters` redirect works without the deprecated `middleware.ts`
- [ ] **TOOL-04**: README and `.kiro/steering/*.md` describe the real stack/versions and commands

### Structure

- [ ] **STRUCT-01**: `basic-info-tab.tsx`, `notes-tab.tsx` and `spells-talents-tab.tsx` are split into smaller subcomponents (no file over ~400 lines) with identical behavior

## v2 Requirements

- **CI-01**: CI pipeline running typecheck, lint, tests and build on every push
- **DATA-01**: Move `notes` to a native JSON column with a proper Prisma migration
- **API-04**: Field-level (patch) updates for JSON columns instead of whole-object writes

## Out of Scope

| Feature | Reason |
|---------|--------|
| Authentication / ownership checks | Owner decision: trusted play group, API stays open |
| Changing Prisma column types | Avoid production data migration this milestone |
| Rule/formula changes or new gameplay features | Maintenance milestone; numbers must not change |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CALC-01 | Phase 1 | Pending |
| CALC-02 | Phase 1 | Pending |
| CLEAN-01 | Phase 1 | Pending |
| CLEAN-02 | Phase 1 | Pending |
| CLEAN-03 | Phase 1 | Pending |
| API-01 | Phase 2 | Pending |
| API-02 | Phase 2 | Pending |
| API-03 | Phase 2 | Pending |
| BUG-01 | Phase 3 | Pending |
| BUG-02 | Phase 3 | Pending |
| BUG-03 | Phase 3 | Pending |
| NOTE-01 | Phase 3 | Pending |
| TOOL-01 | Phase 4 | Pending |
| TOOL-02 | Phase 4 | Pending |
| TOOL-03 | Phase 4 | Pending |
| TOOL-04 | Phase 4 | Pending |
| STRUCT-01 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-11-01*
*Last updated: 2026-11-01 after roadmap creation (corrected total from 18 to 17; traceability filled)*
