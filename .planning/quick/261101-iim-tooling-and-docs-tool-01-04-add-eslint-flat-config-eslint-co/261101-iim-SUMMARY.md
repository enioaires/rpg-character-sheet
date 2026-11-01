---
phase: quick-261101-iim
plan: 01
subsystem: tooling
tags: [eslint, eslint-config-next, bun, redirect, docs]
requires: [261101-iie, 261101-iif, 261101-iig, 261101-iih, 261101-iii, 261101-iij, 261101-iik, 261101-iil]
provides:
  - ESLint 9 flat config with eslint-config-next (core-web-vitals + typescript); bun run lint exits 0
  - Bun-only lockfile
  - Server redirect from / to /characters in app/page.tsx
  - Accurate README and .kiro/steering tech.md / structure.md
affects: [261101-iin]
tech-stack:
  added: [eslint 9.39.5, eslint-config-next 16.4.3]
  patterns: [flat config with global ignores, line-scoped disables with reasons, server redirect()]
key-files:
  created: [eslint.config.mjs]
  modified: [package.json, bun.lock, app/page.tsx, README.md, .kiro/steering/tech.md, .kiro/steering/structure.md]
  deleted: [package-lock.json, middleware.ts]
requirements: [TOOL-01, TOOL-02, TOOL-03, TOOL-04]
status: complete
commits: 3
plan_head_before: 4051cc2608dc45e267a27baf5753e7c2c010188a
plan_head_after: f06ec03908b2b9246cd4a91956983e2b1b6c77e3
---

# Phase quick-261101-iim Plan 01: Tooling and docs (TOOL-01..04) Summary

ESLint 9 flat config on eslint-config-next with `bun run lint` exiting 0, a Bun-only lockfile, a server `redirect("/characters")` replacing the root redirect file, and a README plus steering docs rewritten for the real stack.

## Commits

| Task | Commit | Description |
| ---- | ------ | ----------- |
| 1 (tracer) | 8c13b7b | eslint.config.mjs, eslint ^9 + eslint-config-next 16.4.3, lint script `eslint .`, package-lock.json removed |
| 2 | 813d42b | Lint-clean sources (types, JSX entities, const, unused vars, 5 disables) |
| 3 | f06ec03 | app/page.tsx redirect, middleware.ts deleted, README/tech.md/structure.md |

## Task 1: lint baseline (authoritative, post-batch tree)

Installed versions: next 16.4.3, eslint 9.39.5, eslint-config-next 16.4.3, eslint-plugin-react-hooks 7.1.1.

Baseline before fixes: 54 errors, 15 warnings.

| Rule | Count |
| ---- | ----- |
| @typescript-eslint/no-explicit-any | 35 errors |
| react/no-unescaped-entities | 8 errors |
| @typescript-eslint/no-empty-object-type | 4 errors |
| react-hooks/set-state-in-effect | 4 errors (editable-field, editable-scaling-field, use-mobile x2) |
| react-hooks/purity | 1 error (components/ui/sidebar.tsx Math.random) |
| prefer-const | 1 error |
| @typescript-eslint/ban-ts-comment | 1 error (lib/api/queries.ts) |
| @typescript-eslint/no-unused-vars | 15 warnings |

react-hooks/rules-of-hooks fired 0 times. Note: components/ui/sidebar.tsx and hooks/use-mobile.ts still exist in the tree (261101-iie did not delete them), so they were linted.

Packages added to bun.lock: top-level `eslint@^9` (9.39.5) and `eslint-config-next@16.4.3` as devDependencies, plus their transitive dependencies (typescript-eslint, eslint-plugin-react, eslint-plugin-react-hooks 7.1.1, eslint-plugin-import, eslint-plugin-jsx-a11y, @next/eslint-plugin-next, etc.). Lockfile went from 209 to 536 packages. bun.lock header (lockfileVersion 1, configVersion 0) is byte-identical to the baseline captured before the first bun command. `bun install --frozen-lockfile` passes.

Config: global ignores `.next`, `out`, `build`, `next-env.d.ts`, `lib/generated`, `.planning`, `.claude`, `.gsd`, `.vercel`; `linterOptions.reportUnusedDisableDirectives: "error"`; no `rules` overrides. `--print-config` confirms rules-of-hooks, set-state-in-effect, purity and no-explicit-any stay at severity 2.

## Task 2: lint fixes

Result: `bun run lint` exits 0 (0 errors). One warning remains (see below).

Fixes (all type-level, JSX-entity, declaration-keyword, unused-code or comment-directive changes):
- `character: any` became `CharacterData` (new type in components/character/types.ts: `CharacterFull` with `createdAt`/`updatedAt` as string, because the JSON API serializes dates) in CharacterTabProps, attributes-modal, skills-modal, quick-actions-bar.
- Callback `any` in tabs became `Spell`, `Talent`, `AdventureKitItem`, `CustomLanguage` (new exported inferred types in lib/schemas/character.ts, alongside `ScalingValue`).
- editable-field / editable-scaling-field: new `FieldValue`, `CurrentCharacterData`, `SectionData` types; `Record<string, unknown>` for update payloads, cast to `UpdateCharacterRequest` at the mutation call; `normalizeScalingData` and the `scalingData` prop typed as `ScalingValue`; `inputRef as any` became a typed ref cast. Runtime logic is unchanged (the repeated `currentData?.[section]` reads were hoisted into one `currentSection` const).
- lib/store/character.ts: `any` became `unknown`. lib/api/queries.ts: `useCalculateDerivedStats` params typed with `AttributeValue`/`VitalityBase`/`SkillValue`; the `@ts-ignore` was replaced by a typed cast `(error as { error?: string }).error`.
- `&quot;` for straight quotes in JSX text (app/characters/page.tsx, basic-info-tab.tsx, notes-tab.tsx); empty `interface XProps extends CharacterTabProps {}` became `type XProps = CharacterTabProps`; `let` to `const` in basic-info-tab.
- Unused imports/locals/bindings removed (Badge, useCharacterStore, ScrollArea, ScalingData, two unused `levelBonus` locals, unused destructured props, `maxBerkana` destructures, three `catch (error)` to `catch`).
- lib/notes-format.ts was not touched. `bun test` (including the XSS formatter tests) passes: 183 pass, 0 fail.

Inline disables (5 of the 10 allowed, all line-scoped with rule and reason, none for rules-of-hooks):

| File:line | Rule | Reason |
| --------- | ---- | ------ |
| components/ui/editable-field.tsx:239 | react-hooks/set-state-in-effect | syncs the local draft with the `value` prop when the field leaves edit mode |
| components/ui/editable-scaling-field.tsx:204 | react-hooks/set-state-in-effect | syncs the local draft with the `scalingData` prop when the field leaves edit mode |
| components/ui/sidebar.tsx:611 | react-hooks/purity | generated shadcn primitive; random skeleton width frozen by useMemo |
| hooks/use-mobile.ts:15 | react-hooks/set-state-in-effect | initial window width read client-side only (hydration safety) |
| hooks/use-mobile.ts:32 | react-hooks/set-state-in-effect | same, small-mobile breakpoint |

Files touched beyond the plan's main list: app/character/[id]/page.tsx, app/create/page.tsx, components/character/notes-tab.render.test.ts (typed cast for the partial character and a dropped unused mock parameter), components/ui/sidebar.tsx, hooks/use-mobile.ts, lib/calculations/index.ts (unused destructured `maxBerkana`), lib/schemas/character.ts (type exports only).

Remaining warning: `app/api/[[...route]]/route.ts:7` `routes` is assigned but only used as a type (`typeof routes` feeds `AppType`); left as is because it is load-bearing for the Hono RPC type.

## Task 3: redirect, Bun probe, docs

- app/page.tsx is a server component calling `redirect("/characters")`; middleware.ts deleted. `bun run build` has no "file convention is deprecated" warning. `next start` answers `GET /` with `307 Temporary Redirect` and `location: /characters` (server stopped afterward).
- Bun-version probe: V = 1.2.9 (vercel.json), L = 1.3.2 (local). Probe: `bunx bun@1.2.9 install --frozen-lockfile --dry-run --ignore-scripts` in a temp copy of package.json + bun.lock. Attempt 1 exit status 0. vercel.json left unchanged; final BUN_VERSION is 1.2.9. README and tech.md state `Bun 1.2.9`.
- README rewritten (stack table with real versions, setup, commands, layout, API including the PUT 409 behavior, notes, deployment); tech.md and structure.md updated (removed react-hook-form/OpenAPI, removed lib/types, kebab-case naming, tests, key files). product.md untouched. No secrets or connection strings in docs.

## Final gate

`npx tsc --noEmit`, `bun run lint` (exit 0), `bun test` (183 pass) and `bun run build` all pass.

## Deviations from Plan

None - plan executed as written. The plan's interfaces block expected sidebar.tsx and use-mobile.ts to be gone after 261101-iie; they were still present, so they received the narrow disables (still within the 10-directive cap).

## Known Stubs

None.

## Threat Flags

None.

## Notes for the orchestrator

- The human check from Task 3 (open `bun dev`, confirm `/` lands on `/characters`, edit one inline field per tab and reload) was not performed; the 307 redirect was verified with `next start` and curl.
- 261101-iin can now run its final gate (`bun run lint` exists).

## Self-Check: PASSED

eslint.config.mjs, app/page.tsx, README.md found; package-lock.json and middleware.ts absent; commits 8c13b7b, 813d42b, f06ec03 are ancestors of HEAD; working tree has no uncommitted code changes.
