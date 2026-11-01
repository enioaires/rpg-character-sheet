# RPG Character Sheet

## What This Is

Digital character sheet (in Brazilian Portuguese) for a homebrew tabletop RPG system — Berkana (mana), six-stage vitality, 14 attributes, 36 skills, spells/talents with level scaling, adventure kit, finances and notes. Used by the owner and their play group at the table to create, edit and track characters during sessions. Next.js app deployed on Vercel with a PostgreSQL database.

## Core Value

Players can open their character during a session and edit any field inline with the change saved reliably — no lost edits, no wrong derived numbers.

## Requirements

### Validated

- ✓ List, search, create and delete characters (`app/characters`, `app/create`, `/api/characters`) — existing
- ✓ Character sheet with 4 tabs: Basic data, Skills & Kit, Spells & Talents, Notes (`components/character/*`) — existing
- ✓ Inline editing with auto-save via `PUT /api/characters/:id` (`components/ui/editable-field.tsx`) — existing
- ✓ Derived stats: attribute totals, vitality stages, max Berkana, skill totals and skill points (`lib/calculations`) — existing
- ✓ Spells/talents with damage/duration scaling by level (`components/ui/editable-scaling-field.tsx`) — existing
- ✓ Notes as multiple titled entries with light markdown formatting and search — existing
- ✓ Quick actions bar and mobile-friendly layout — existing

### Active

Milestone v1.1 — code quality & reliability (no user-facing feature changes):

- [ ] Single source of truth for game formulas in `lib/calculations`
- [ ] Dead code and unused dependencies removed
- [ ] Real Zod validation for JSON fields on update + optimistic concurrency (no silent lost updates) + bounded list pagination
- [ ] React correctness bugs fixed (conditional hook, setState during render, stray console.log)
- [ ] Notes parsing/migration centralized in a shared util
- [ ] Working tooling: ESLint flat config, single lockfile (Bun), Next 16 redirect instead of deprecated middleware, accurate README/steering docs
- [ ] Unit tests for `lib/calculations` (bun test)
- [ ] Large components split into smaller subcomponents without behavior change
- [ ] Stored XSS in notes rendering fixed (escape HTML before markdown formatting)

### Out of Scope

- Authentication / per-user ownership — intentional decision by the owner; small trusted group, API stays open
- Changing the `notes` column type or other Prisma column types — avoids a data migration on the production database
- New gameplay features or rule changes — this milestone is maintenance only; formulas must produce the same numbers as today

## Context

- Brownfield codebase mapped on 2026-11-01 — see `.planning/codebase/` (STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS).
- Stack: Next.js 16 (App Router), React 19, Hono API under `app/api/[[...route]]`, Prisma 6 + PostgreSQL, TanStack Query, Zustand, shadcn/ui + Tailwind 4, Zod 4, Bun. Deployed on Vercel (region gru1).
- Character data lives in one `Character` table with ~12 JSON columns; clients currently write whole JSON objects/arrays back on every edit.
- Identifiers in English; UI strings and comments in pt-BR; persisted JSON keys are Portuguese (`agilidade`, `notavel`, …) and must not be renamed.
- No tests, no lint config, no CI today.

## Constraints

- **Tech stack**: keep Next 16 / Hono / Prisma / TanStack Query / Bun — the fixes are refactors, not migrations.
- **Data compatibility**: existing rows in production must keep loading and saving; new Zod schemas must accept current data shapes (tolerate extra/optional fields).
- **Behavior**: derived numbers and UI behavior must stay identical after refactors.
- **Definition of done**: `npx tsc --noEmit`, `bun run lint`, `bun test` and `bun run build` pass.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No authentication | Owner's call: trusted play group, low stakes | ✓ Accepted |
| Keep `notes` as a JSON string in a `String` column | Avoid production data migration | — Pending |
| Optimistic concurrency via `updatedAt` (409 on conflict) | Prevent silent lost updates when two devices edit the same sheet | — Pending |
| Execute the milestone as a GSD quick-batch | Fixes are independent and well-scoped | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-11-01 after initialization*
