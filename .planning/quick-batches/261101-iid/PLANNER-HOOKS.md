<!-- hook: assumption-delta -->
# Assumption-Delta Architecture Checkpoint

> Advisory, non-blocking. Fires **only** when the phase scope shows a singular→plural / required→optional / derived→chosen transition. When it fires, it surfaces ONE identity-model question before the plan is finalized. Most phases will not fire it — that is the point.

## Why this exists

Most quietly-imported architectural debt does not come from a missing upfront design phase. It comes at the *seam*: a later phase introduces a second case (a second platform, auth method, tenant, region, source of truth) and nobody re-asks whether the original abstraction still names the right thing. The phase that adds the second case is exactly the 20-minute conversation that prevents an afternoon of later cleanup.

## Run the detector

The detector is a deterministic scan over the phase scope text. It strips fenced code blocks first, so a trigger word that appears only inside a code snippet does not fire. It returns a typed result: `{ detected, signals[], terms }`. Resolve it through the `assumption-delta scan` query (same phase-section resolver as `roadmap.get-phase`):

```bash
ASSUMPTION_DELTA_JSON=$(gsd_run query assumption-delta scan "${PHASE}" --json 2>/dev/null) || true
[ -n "$ASSUMPTION_DELTA_JSON" ] || ASSUMPTION_DELTA_JSON='{"skipped":true,"reason":"probe_unavailable"}'
```

> If the phase section cannot be resolved (no `ROADMAP.md` / unknown phase, or a section with no body), the query emits `{ "skipped": true, "reason": "phase_unresolved" }` — **not** `detected:false`. A probe that never had input does not get to assert that this phase changes no core assumption. The checkpoint does not fire either way; the difference is that a skip is now distinguishable from a real negative. Do not block on it.
>
> Optional tuning — pass `--terms <comma-list>` to replace the curated pluralization cues for this project (the `optional`/`chosen` cues keep their defaults): `gsd_run query assumption-delta scan "${PHASE}" --json --terms second,alternative,fallback`.

## Decision branch

Read `ASSUMPTION_DELTA_JSON`. Act on `detected` only — do **not** pattern-match the human prose.

**If `skipped` is `true`:** the detector never examined a phase section — it could not resolve one (`phase_unresolved`) or could not run at all (`probe_unavailable`). Skip the checkpoint for this run rather than asserting a verdict about input that was never examined; do not raise it with the user. **Check for `skipped` before reading `detected`** — a skipped payload carries no `detected` key, and treating its absence as `false` re-creates the fabrication this branch exists to prevent.

**If `detected` is `false`:** this phase does not change a core assumption. Skip the checkpoint entirely and continue planning. Do not raise it with the user.

**If `detected` is `true`:** a core assumption may have lost its monopoly. The `signals[]` array tells you which family fired:

| `kind` | What changed | The question to answer |
|---|---|---|
| `pluralization` | A second X was introduced where there was one (second platform / auth method / tenant / region / source of truth) | Does the current primary key / identity model still name the right noun? |
| `optional` | A required / `only` field became optional | Is the field still the right anchor, or has the anchor moved? |
| `chosen` | A derived value became chosen, or a constant became a parameter | Has a configuration decision become a modeling decision? |

Before finalizing the plan, answer this for the user and record the decision explicitly:

> **Promote vs. add-alongside.** The usual correct move when a generalization occurs is to **promote** the new general representation to the primary and **demote** the old specific one to a detail of one variant — *not* to add the new one alongside the still-required old one. Adding alongside silently contradicts the generalized intent (a later variant that does not fit the old primary can be stored but never confirmed as a default).

Record the outcome in the PLAN.md front matter / a `<assumption_delta_decision>` block:

- The **noun** that is now primary (the generalized identity).
- The **decision**: `promote` | `add-alongside` | `no-change`, with a one-line rationale.
- If `add-alongside`: call it out as accepted debt and note what would force a later promote.

## Optional companion: an invariant test

When `detected` is `true`, suggest (do not require) a contract/invariant test that encodes the now-generalized intent — e.g. *"every confirmed default round-trips through the primary use-path, for every supported variant."* That test goes red the instant a future phase reintroduces the singular assumption, so the regression cannot land silently. If the user accepts, add the test as a task in the plan.

## Tuning the vocabulary (optional)

The trigger vocabulary is a curated, additive-only set in `gsd-core/bin/lib/assumption-delta.cjs` (`DEFAULT_ASSUMPTION_DELTA_TERMS`). Bare "or" is intentionally excluded — it is too common in prose and would make the gate fire constantly. To widen or narrow the cues for a project, override at the call site with `--terms <comma-list>` (replaces the pluralization cues; `optional`/`chosen` keep defaults). The whole checkpoint is toggleable via `workflow.assumption_delta` in `.planning/config.json`.

This checkpoint is advisory: it informs and records; it never blocks the phase.


<!-- hook: schema-gate -->
# Schema Push Detection Gate

> Detects schema-relevant files in the phase scope and injects a mandatory `[BLOCKING]` schema push task into the plan. Prevents false-positive verification where build/types pass because TypeScript types come from config, not the live database.

Check if any files in the phase scope match schema patterns:

```bash
PHASE_SECTION=$(gsd_run query roadmap.get-phase "${PHASE}" --pick section 2>/dev/null)
```

Scan `PHASE_SECTION`, `CONTEXT.md` (if loaded), and `RESEARCH.md` (if exists) for file paths matching these ORM patterns:

| ORM | File Patterns |
|-----|--------------|
| Payload CMS | `src/collections/**/*.ts`, `src/globals/**/*.ts` |
| Prisma | `prisma/schema.prisma`, `prisma/schema/*.prisma` |
| Drizzle | `drizzle/schema.ts`, `src/db/schema.ts`, `drizzle/*.ts` |
| Supabase | `supabase/migrations/*.sql` |
| TypeORM | `src/entities/**/*.ts`, `src/migrations/**/*.ts` |

Also check if any existing PLAN.md files for this phase already reference these file patterns in `files_modified`.

**If schema-relevant files detected:**

Set `SCHEMA_PUSH_REQUIRED=true` and `SCHEMA_ORM={detected_orm}`.

Determine the push command for the detected ORM:

| ORM | Push Command | Non-TTY Workaround |
|-----|-------------|-------------------|
| Payload CMS | `npx payload migrate` | `CI=true PAYLOAD_MIGRATING=true npx payload migrate` |
| Prisma | `npx prisma db push` | `npx prisma db push --accept-data-loss` (if destructive) |
| Drizzle | `npx drizzle-kit push` | `npx drizzle-kit push` |
| Supabase | `supabase db push` | Set `SUPABASE_ACCESS_TOKEN` env var |
| TypeORM | `npx typeorm migration:run` | `npx typeorm migration:run -d src/data-source.ts` |

Inject the following into the planner prompt (step 8) as an additional constraint:

```markdown
<schema_push_requirement>
**[BLOCKING] Schema Push Required**

This phase modifies schema-relevant files ({detected_files}). The planner MUST include
a `[BLOCKING]` task that runs the database schema push command AFTER all schema file
modifications are complete but BEFORE verification.

- ORM detected: {SCHEMA_ORM}
- Push command: {push_command}
- Non-TTY workaround: {env_hint}
- If push requires interactive prompts that cannot be suppressed, flag the task for
  manual intervention with `autonomous: false`

This task is mandatory — the phase CANNOT pass verification without it. Build and
type checks will pass without the push (types come from config, not the live database),
creating a false-positive verification state.
</schema_push_requirement>
```

Display: `Schema files detected ({SCHEMA_ORM}) — [BLOCKING] push task will be injected into plans`

**If no schema-relevant files detected:** Skip silently.


<!-- hook: security -->
Each PLAN.md must include a <threat_model> block when security enforcement is active. Use the configured ASVS level and blocking threshold from workflow.security_asvs_level and workflow.security_block_on.
Config values: {"security_asvs_level":1,"security_block_on":"high"}

