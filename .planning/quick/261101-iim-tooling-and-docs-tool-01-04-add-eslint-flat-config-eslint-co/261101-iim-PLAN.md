---
phase: quick-261101-iim
plan: 01
type: execute
wave: 2
depends_on: ["261101-iie", "261101-iif", "261101-iig", "261101-iih", "261101-iii", "261101-iij", "261101-iik", "261101-iil"]
files_modified:
  - "eslint.config.mjs"
  - "package.json"
  - "bun.lock"
  - "app/page.tsx"
  - "README.md"
  - ".kiro/steering/tech.md"
  - ".kiro/steering/structure.md"
  - "app/api/[[...route]]/characters/index.ts"
  - "app/characters/page.tsx"
  - "components/character/attributes-modal.tsx"
  - "components/character/basic-info-tab.tsx"
  - "components/character/notes-tab.tsx"
  - "components/character/quick-actions-bar.tsx"
  - "components/character/skills-kit-tab.tsx"
  - "components/character/skills-modal.tsx"
  - "components/character/spells-talents-tab.tsx"
  - "components/character/types.ts"
  - "components/ui/editable-field.tsx"
  - "components/ui/editable-scaling-field.tsx"
  - "lib/api/queries.ts"
  - "lib/store/character.ts"
  # Sibling-created/modified files Task 2 may need to lint-fix (types, entities, const or directives only).
  # Task 2's set is open-ended: it may grow to whatever the fresh `bun run lint` output lists; the SUMMARY names every extra file.
  - "lib/notes.ts"
  - "lib/notes.test.ts"
  - "lib/notes-format.ts"
  - "lib/notes-format.test.ts"
  - "lib/api/character-concurrency.ts"
  - "lib/api/character-concurrency.test.ts"
  - "lib/calculations/index.ts"
  - "lib/calculations/index.test.ts"
  - "lib/schemas/character.ts"
  - "lib/schemas/character.test.ts"
  - "app/api/[[...route]]/characters/index.test.ts"
  - "components/character/notes-tab.render.test.ts"
  # Task 3 section B: changed only if the Bun-version lockfile probe fails
  - "vercel.json"
files_deleted:
  - "package-lock.json"
  - "middleware.ts"
autonomous: true
requirements: [TOOL-01, TOOL-02, TOOL-03, TOOL-04]

must_haves:
  truths:
    - "`bun run lint` runs `eslint .` with the flat config in eslint.config.mjs (eslint-config-next core-web-vitals + typescript, react-hooks rules at error severity) and exits 0 on the whole repo (TOOL-01)"
    - "ESLint ignores lib/generated, .next and .planning while app/ sources are still linted"
    - "No lint rule is turned off or downgraded in config; inline disables are line-scoped, name a rule, carry a `--` reason, number at most 10, and never target react-hooks/rules-of-hooks"
    - "package-lock.json is gone, bun.lock is the only lockfile, and `bun install --frozen-lockfile` succeeds (TOOL-02)"
    - "GET / answers with a 307 redirect to /characters produced by redirect() in app/page.tsx; middleware.ts no longer exists and `bun run build` prints no deprecated file-convention warning (TOOL-03)"
    - "README.md, .kiro/steering/tech.md and .kiro/steering/structure.md describe the real stack, versions and Bun commands: Next.js 16, React 19, Prisma 6, Zod 4, ESLint 9 flat config, bun test (TOOL-04)"
    - "npx tsc --noEmit, bun run lint, bun test and bun run build all pass, and the character sheet behaves identically (lint fixes change types, JSX entities, declaration keywords or comment directives only)"
  artifacts:
    - path: "eslint.config.mjs"
      provides: "ESLint 9 flat config extending eslint-config-next with repo-specific global ignores"
      contains: "eslint-config-next/core-web-vitals"
    - path: "package.json"
      provides: "lint script and eslint/eslint-config-next devDependencies"
      contains: "\"lint\": \"eslint .\""
    - path: "app/page.tsx"
      provides: "Server-side redirect from / to /characters"
      contains: "next/navigation"
    - path: "README.md"
      provides: "Accurate project README (stack, setup, commands, deployment)"
      contains: "bun run lint"
    - path: ".kiro/steering/tech.md"
      provides: "Steering doc with real stack versions and commands"
      contains: "eslint.config.mjs"
    - path: ".kiro/steering/structure.md"
      provides: "Steering doc with the real directory layout and naming conventions"
      contains: "basic-info-tab.tsx"
  key_links:
    - from: "package.json"
      to: "eslint.config.mjs"
      via: "scripts.lint runs `eslint .`, which loads the root flat config"
      pattern: "\"lint\": \"eslint \\.\""
    - from: "eslint.config.mjs"
      to: "eslint-config-next"
      via: "spread of the core-web-vitals and typescript flat-config arrays"
      pattern: "eslint-config-next/(core-web-vitals|typescript)"
    - from: "app/page.tsx"
      to: "/characters"
      via: "redirect() from next/navigation during server render (307)"
      pattern: "redirect\\(['\"]/characters['\"]\\)"
---

<objective>
Bring project tooling up to working order for milestone v1.1 (TOOL-01..TOOL-04): a real ESLint 9 flat config based on `eslint-config-next` with `bun run lint` (`eslint .`) exiting 0 on the post-batch codebase, a Bun-only lockfile, the root `/` → `/characters` redirect moved from the deprecated root file convention into a server `redirect()` in `app/page.tsx`, and a README plus `.kiro/steering/tech.md` / `structure.md` that describe the real stack, versions and commands.

Purpose: ROADMAP Phase 4 makes ESLint the final gate for the earlier hook/render fixes (BUG-01/BUG-02) and the definition of done (`npx tsc --noEmit`, `bun run lint`, `bun test`, `bun run build`) cannot pass until lint exists. This item runs AFTER every code-changing sibling (261101-iie…261101-iil) so it lints and fixes the already-cleaned code and its `package.json`/`bun.lock` edits stack on theirs; 261101-iin (component split) must run AFTER this item because its own final gate runs `bun run lint`.

Output: `eslint.config.mjs`, updated `package.json`/`bun.lock`, lint-clean sources, rewritten `app/page.tsx`, deleted `package-lock.json` and `middleware.ts`, rewritten `README.md`, updated `.kiro/steering/tech.md` and `.kiro/steering/structure.md`.

Project decisions honored: no authentication is added (owner decision); `prisma/schema.prisma` and all Prisma column types are untouched (no schema push needed); behavior stays identical; Bun is the package manager.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/codebase/CONCERNS.md
@.planning/codebase/STACK.md
@.planning/codebase/STRUCTURE.md
@.planning/codebase/CONVENTIONS.md
@package.json
@app/page.tsx
@middleware.ts
@vercel.json
@README.md
@.kiro/steering/tech.md
@.kiro/steering/structure.md

<interfaces>
Verified during planning on a scratch copy of the pre-batch repo (eslint 9.39.5 + an eslint-config-next equal to the next version installed at planning time). At execution, eslint-config-next is pinned to the installed next version, read at execution time: 261101-iie re-resolves next, so do not assume the planning-time value. In that probe this config loads, `isPathIgnored` is true for `lib/generated/prisma/index.js`, `.next/server/app/page.js`, `.planning/x.ts` and false for `app/page.tsx`, and `--print-config app/page.tsx` reports `react-hooks/rules-of-hooks`, `react-hooks/set-state-in-effect`, `react-hooks/purity` and `@typescript-eslint/no-explicit-any` at severity 2. Target shape for `eslint.config.mjs` (Task 1 adds the extra tooling ignores and `linterOptions`):

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "lib/generated/**", ".planning/**"]),
]);
```

eslint-config-next 16 facts (from the dist probed at planning time; if something differs, re-read node_modules/eslint-config-next for the installed next version, read at execution time): the base config spreads `eslint-plugin-react-hooks@^7` `configs.recommended.rules` (includes the React Compiler rules such as `set-state-in-effect`, `purity`, `refs`, `immutability` at error), `eslint-plugin-react` recommended, `@next/eslint-plugin-next` recommended; the `typescript` entry spreads `typescript-eslint` recommended and sets `@typescript-eslint/no-unused-vars` and `no-unused-expressions` to warn. Its parser requires `next/dist/compiled/babel/eslint-parser`, so `next` must be installed (it is).

Lint baseline on the PRE-batch tree (planning probe; siblings will remove some): 85 errors / 16 warnings. These numbers are indicative only. They were measured with the planning-time eslint-config-next, and the eslint-config-next / eslint-plugin-react-hooks matching the installed next version, read at execution time, may enable more rules. Task 1 step 6 re-baselines on the real post-batch tree, and that count is authoritative for Task 2's disable budget.
- `@typescript-eslint/no-explicit-any` 54 — lib/store/character.ts 14, components/ui/editable-field.tsx 10, components/character/spells-talents-tab.tsx 8, lib/api/queries.ts 6, components/ui/editable-scaling-field.tsx 5, app/api/[[...route]]/characters/index.ts 4, skills-kit-tab.tsx 2, attributes-modal.tsx / basic-info-tab.tsx / quick-actions-bar.tsx / skills-modal.tsx / types.ts 1 each
- `@typescript-eslint/ban-ts-comment` 10 — all `@ts-ignore` in lib/api/queries.ts
- `react/no-unescaped-entities` 8 — straight double quotes in JSX text: app/characters/page.tsx:247, basic-info-tab.tsx:1050, notes-tab.tsx:555-556 and 680-681
- `react-hooks/set-state-in-effect` 5 — components/ui/editable-field.tsx:217, components/ui/editable-scaling-field.tsx:201 (prop → local draft sync), plus carousel.tsx and hooks/use-mobile.ts (deleted by 261101-iie)
- `@typescript-eslint/no-empty-object-type` 4 — empty `interface …Props extends CharacterTabProps {}` in basic-info-tab, notes-tab, skills-kit-tab, spells-talents-tab
- `react-hooks/purity` 2 — Date.now reached from render in notes-tab.tsx:75 (render-time migration, targeted by 261101-iij/iik) and sidebar.tsx (deleted by 261101-iie)
- `prefer-const` 1 — basic-info-tab.tsx:71
- `react-hooks/rules-of-hooks` 1 — editable-field.tsx:207 (fixed by 261101-iie/iij)
- warnings: 16 × `@typescript-eslint/no-unused-vars`

Next 16 redirect facts: `next/dist/server/app-render/app-render.js` sets `res.statusCode` from `getRedirectStatusCodeFromError` and a `location` header when `redirect()` throws during render (also during prerender), so `next start` answers `/` with 307 + `location: /characters`. The old root file convention prints a build warning containing the phrase checked in Task 3's verify (`next/dist/build/index.js` ~line 604).

Package legitimacy audit (performed during planning; quick-batch items have no RESEARCH.md):

| Package | Registry evidence | Status |
|---------|-------------------|--------|
| `eslint` (`^9`, resolves 9.39.x) | npm repo `github.com/eslint/eslint`, homepage eslint.org, maintainers `openjsfoundation`, `eslintbot` | VERIFIED |
| `eslint-config-next` (version = the installed next version, read at execution time) | npm repo `github.com/vercel/next.js`, homepage nextjs.org/docs/app/api-reference/config/eslint, maintainers `vercel-release-bot`, `timneutkens` | VERIFIED |

Bun probe install of these two packages reported 0 untrusted dependencies with lifecycle scripts.

Deployment Bun-version probe (planning time, scratch copies of package.json + bun.lock only): vercel.json pins `env.BUN_VERSION` 1.2.9 while the local Bun is 1.3.x. `bunx bun@1.2.9 --version` runs. `bunx bun@1.2.9 install --frozen-lockfile --dry-run --ignore-scripts` behaves as follows:
- It reads the `configVersion` header without a parse error.
- It rejects the stale HEAD lockfile with "lockfile had changes, but lockfile is frozen", which shows that `--dry-run` still enforces the frozen lockfile.
- It exits 0 on a consistent lockfile written by Bun 1.3.2 (`--lockfile-only`; header lockfileVersion 1 / configVersion 0 unchanged).

The final post-batch lockfile still has to be probed at execution time (Task 3 section B).
</interfaces>
</context>

<tasks>

<!-- planner-discipline-allow: middleware -->
<!-- planner-discipline-allow: react-hooks/rules-of-hooks -->

<task type="tracer">
  <name>Task 1: Tracer: Bun-only lint pipeline wired end to end (devDeps, eslint.config.mjs, `bun run lint` over the whole repo)</name>
  <files>eslint.config.mjs, package.json, bun.lock, package-lock.json (deleted)</files>
  <precondition>The code-changing siblings 261101-iie through 261101-iil are merged into this checkout: `grep -q '"test":' package.json` succeeds (261101-iig landed) and `grep -q '"@hono/zod-openapi"' package.json` fails (261101-iie landed). Halt if either check is unmet.</precondition>
  <read_first>package.json, `head -5 bun.lock`, node_modules/next/package.json (version field), tsconfig.json, .gitignore, postcss.config.mjs (quote style)</read_first>
  <action>
Implements TOOL-01 (wiring) and TOOL-02. One path end to end: dependency install, then config file, then lint script, then lint run over the real tree.

0. Before ANY bun command of this item, capture this item's lockfile-header baseline, so the end-of-task check measures only this item's change and not the siblings' edits. Run `H=$(git rev-parse --git-path gsd-iim-bunlock-header)` and then `test -s "$H" || grep -E '^  "(lockfileVersion|configVersion)":' bun.lock > "$H"`. The file lives in the git dir, so it is never committed. If it already exists from an earlier attempt of this item, keep it, because it holds the pre-item baseline. It must contain both header lines. Leave it in place after the task, because the verify reads it.
1. Run `bun install` (a fresh worktree has no node_modules).
2. Read the installed next version from node_modules/next/package.json, at execution time. 261101-iie re-resolved next, so do not reuse the planning-time value. Add exactly two devDependencies with Bun: `bun add -d eslint@^9 eslint-config-next@<that exact next version>`. Use ESLint 9, not 10. eslint-config-next 16 bundles eslint-plugin-react 7.x and eslint-plugin-import 2.x, and their ESLint 10 support is unverified. The Next 16 starter template also pins `^9`, and the planning probe passed with 9.39.5. Do not add `@eslint/eslintrc`/FlatCompat, `@eslint/js` or any other plugin. eslint-config-next 16 already exports native flat-config arrays and brings typescript-eslint, react, react-hooks 7, jsx-a11y, import and the Next plugin transitively. Do not touch `trustedDependencies`. Never delete or regenerate bun.lock. `bun add` updates it in place, so the `configVersion` line stays the same (regenerating it would change Bun's linker mode).
3. Create `eslint.config.mjs` in the shape shown in the context interfaces block: `defineConfig` and `globalIgnores` from "eslint/config", spreading the `eslint-config-next/core-web-vitals` array and then the `eslint-config-next/typescript` array. Use one `globalIgnores` list:
   - the eslint-config-next defaults (`.next/**`, `out/**`, `build/**`, `next-env.d.ts`)
   - the required `lib/generated/**` and `.planning/**`
   - the tooling directories `.claude/**`, `.gsd/**` and `.vercel/**` (Claude's discretion: harness worktrees live under `.claude/worktrees` and would otherwise be linted as duplicate sources, and `.vercel/output` holds compiled bundles)

   Add one config object whose `linterOptions.reportUnusedDisableDirectives` is `"error"`, so stale inline disables fail lint. Add NO `rules` overrides. Every rule keeps the severity eslint-config-next gives it, so the react-hooks rules stay at error (ROADMAP Phase 4 success criterion 1). Use double quotes, matching postcss.config.mjs.
4. In package.json set `scripts.lint` to exactly `eslint .`, as the item text requires. The old Next lint subcommand no longer exists in Next 16. Leave every other script unchanged, including the `test` script from 261101-iig, `build` and `postinstall`.
5. Remove the npm lockfile with `git rm package-lock.json` (TOOL-02). Bun is the only package manager, and vercel.json installs with `bun install`.
6. Run `bun run lint` once over the whole repo. Exit code 1 (violations found) is expected at this point. Exit code 2 means the config itself is broken, so fix it now. Record the following in the SUMMARY:
   - the error and warning counts per rule
   - the installed versions of next, eslint-config-next and eslint-plugin-react-hooks

   This execution-time count is the authoritative baseline for Task 2's disable budget. The interfaces-block numbers came from an older eslint-config-next and are indicative only.
  </action>
  <verify>
    <automated>test -f eslint.config.mjs && test ! -e package-lock.json && grep -q '"lint": "eslint \."' package.json &&
H=$(git rev-parse --git-path gsd-iim-bunlock-header) && grep -q '"lockfileVersion"' "$H" && grep -q '"configVersion"' "$H" && grep -E '^  "(lockfileVersion|configVersion)":' bun.lock | cmp -s - "$H" &&
bun install --frozen-lockfile &&
node -e 'const {ESLint}=require("eslint");(async()=>{const e=new ESLint();for(const p of ["lib/generated/prisma/index.js",".next/server/app/page.js",".planning/x.ts"]){if(!(await e.isPathIgnored(p))){console.error("NOT IGNORED",p);process.exit(1)}}if(await e.isPathIgnored("app/page.tsx")){console.error("app/page.tsx wrongly ignored");process.exit(1)}console.log("ignores ok")})()' &&
node_modules/.bin/eslint --print-config app/page.tsx | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s).rules;const bad=["react-hooks/rules-of-hooks","react-hooks/set-state-in-effect","react-hooks/purity","@typescript-eslint/no-explicit-any"].filter(k=>![2,"error"].includes([].concat(r[k])[0]));if(bad.length){console.error("downgraded:",bad);process.exit(1)}console.log("rule severities ok")})' &&
{ bun run lint >/dev/null; rc=$?; echo "lint exit=$rc"; [ "$rc" -le 1 ]; }</automated>
  </verify>
  <done>`eslint` 9.x and `eslint-config-next` (same version as the installed `next`) are devDependencies. bun.lock is updated in place: its lockfileVersion/configVersion header lines are byte-identical to the baseline captured before this item's first bun command. `package-lock.json` is gone, and `bun install --frozen-lockfile` passes. `eslint.config.mjs` loads, ignores lib/generated, .next and .planning, and keeps the react-hooks and no-explicit-any rules at error. `bun run lint` runs `eslint .` over the repo and exits 0 or 1, never 2. Per-rule violation counts are recorded for Task 2.</done>
</task>

<task type="auto">
  <name>Task 2: Drive `bun run lint` to exit 0 with behavior-neutral fixes and narrowly scoped disables</name>
  <files>app/api/[[...route]]/characters/index.ts, app/characters/page.tsx, components/character/attributes-modal.tsx, components/character/basic-info-tab.tsx, components/character/notes-tab.tsx, components/character/quick-actions-bar.tsx, components/character/skills-kit-tab.tsx, components/character/skills-modal.tsx, components/character/spells-talents-tab.tsx, components/character/types.ts, components/ui/editable-field.tsx, components/ui/editable-scaling-field.tsx, lib/api/queries.ts, lib/store/character.ts, plus the sibling-created/modified files lib/notes.ts, lib/notes.test.ts, lib/notes-format.ts, lib/notes-format.test.ts, lib/api/character-concurrency.ts, lib/api/character-concurrency.test.ts, lib/calculations/index.ts, lib/calculations/index.test.ts, lib/schemas/character.ts, lib/schemas/character.test.ts, app/api/[[...route]]/characters/index.test.ts, components/character/notes-tab.render.test.ts. The exact set is whatever the fresh `bun run lint` output from Task 1 lists, and it may grow beyond this list.</files>
  <read_first>Fresh `bun run lint` output; components/character/types.ts (CharacterTabProps); lib/schemas/character.ts (inferred types, including the per-field schemas from 261101-iih); lib/generated/prisma Character type via lib/db/index.ts imports; .planning/codebase/CONVENTIONS.md (quote and semicolon style per file, shadcn files are generated)</read_first>
  <action>
Implements TOOL-01: `bun run lint` exits 0, with remaining violations fixed or narrowly disabled. The project constraint holds: behavior must stay identical. Every fix must be one of these:
- a type-level change
- a JSX text-entity change
- a declaration-keyword change
- a comment directive

Do not change runtime logic, data flow, request payloads, query keys, Prisma usage or rendered output. Do not add authentication anywhere (owner decision). Do not touch prisma/schema.prisma.

Work file by file from the fresh lint output, and match each file's local quote and semicolon style. Fix by rule:

- `@typescript-eslint/no-explicit-any`: replace each `any` with a precise existing type. Candidates:
  - the inferred Zod types exported by lib/schemas/character.ts, including the per-field schemas added by 261101-iih
  - `CharacterTabProps` from components/character/types.ts
  - the Prisma `Character` type
  - `unknown` plus narrowing in catch clauses and JSON parsing
  - a generic type parameter for value-agnostic editor props

  A cast to an existing type is acceptable where data was already validated by the API. `npx tsc --noEmit` must keep passing.
- `@typescript-eslint/ban-ts-comment` (`@ts-ignore` in lib/api/queries.ts, if any survive 261101-iie/iii): delete the comment when tsc passes without it. Otherwise switch to `@ts-expect-error` followed by ` -- <reason>`. The rule requires a description.
- `react/no-unescaped-entities`: replace each straight double quote in JSX text with `&quot;`. The rendered text is identical.
- `@typescript-eslint/no-empty-object-type`: turn each empty `interface XProps extends CharacterTabProps {}` into `type XProps = CharacterTabProps`.
- `prefer-const`: change `let` to `const` where the variable is never reassigned.
- `react-hooks/set-state-in-effect`: these are prop-to-local-draft sync effects in components/ui/editable-field.tsx and components/ui/editable-scaling-field.tsx, plus any effect added by 261101-iij/iik. Apply a fix only if it is provably behavior-identical. Otherwise add a line-scoped disable whose reason names the prop sync. Never move setState back into render, because 261101-iij removed render-time setState (BUG-02).
- `react-hooks/purity` and other React Compiler rules introduced by sibling code (`refs`, `immutability`, `static-components`, `preserve-manual-memoization`, etc.): if the impure call or ref read can move into the event handler or effect that needs it, move it. Otherwise use a narrow disable only when the rule is a false positive inside a callback.
- The rules-of-hooks rule must already be at zero, because 261101-iie/iij fixed BUG-01. If it still fires, call the hook unconditionally at the top of the component and pick the value afterwards. Never suppress this rule. ESLint is the final gate for BUG-01 (ROADMAP Phase 4 note).
- `@typescript-eslint/no-unused-vars` warnings: remove unused imports and locals where that is trivially behavior-neutral. Warnings do not fail lint, so list any that remain in the SUMMARY.
- XSS guard: do not change the HTML-escape or light-markdown formatter logic added by 261101-iil, or its unit test. If a lint error points into that code, fix it with types only.
- Generated shadcn primitives in components/ui (every file there except editable-field.tsx and editable-scaling-field.tsx): prefer a narrow disable over hand-editing generated code (CONVENTIONS).

Disable-directive policy ("narrowly disable"):
- Use only the line-scoped forms (next-line or same-line directive), naming the specific rule followed by ` -- <reason>`. In JSX, use the braces plus block-comment form.
- At most 10 directives across the repo.
- No file-level or blanket directives.
- No severity changes in eslint.config.mjs.

Over-cap route (halt, never exceed the cap). The cap of 10 was sized from the pre-batch planning baseline. Execution uses the eslint-config-next matching the installed next version, read at execution time, which may enable more rules. So budget from the Task 1 step 6 baseline, in this order:
1. Apply every genuine behavior-neutral fix first.
2. Before adding ANY directive, list every remaining violation that has no behavior-neutral fix.
3. If that list would need more than 10 directives, halt. Add none of them. Do not turn off, downgrade or override any rule in eslint.config.mjs. Never disable the rules-of-hooks rule (it must be fixed). Do not trade behavior for a pass.
4. When halted, commit the genuine fixes only if `npx tsc --noEmit` and `bun test` pass. Stop the plan before Task 3 and report the item as blocked.
5. In the SUMMARY, list each remaining violation with:
   - file:line
   - rule
   - why no behavior-neutral fix exists
   - the disable reason that would be used

   The coordinator then decides whether to raise the cap or accept a behavior change.

Within the cap, proceed as below.

You may touch files outside the listed set only to fix lint, for example test files or a notes util created by siblings. List every such file in the SUMMARY. Finish with `bun run lint` at exit 0, then run tsc and bun test to prove nothing regressed.
  </action>
  <verify>
    <automated>bun run lint && npx tsc --noEmit && bun test &&
node_modules/.bin/eslint --print-config app/page.tsx | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s).rules;const bad=["react-hooks/rules-of-hooks","react-hooks/set-state-in-effect","react-hooks/purity","@typescript-eslint/no-explicit-any"].filter(k=>![2,"error"].includes([].concat(r[k])[0]));if(bad.length){console.error("downgraded:",bad);process.exit(1)}console.log("rule severities ok")})' &&
{ DIS=$(git grep -n --untracked -e 'eslint-disable' -- '*.ts' '*.tsx' '*.mjs' ':!.planning'); rc=$?; [ "$rc" -le 1 ]; } && printf '%s' "$DIS" | awk '/react-hooks\/rules-of-hooks/ {bad=1} !/eslint-disable-(next-)?line [@a-z0-9\/-]+( *, *[@a-z0-9\/-]+)* -- [^ ]/ {bad=1} END {print NR " disable directive(s)"; exit (bad || NR > 10)}'</automated>
  </verify>
  <done>`bun run lint` exits 0 with zero errors. Any remaining warnings are listed in the SUMMARY. `npx tsc --noEmit` and `bun test` pass, including the 261101-iil formatter/XSS test and the 261101-iig calculation tests. No rule is downgraded in config. There are at most 10 line-scoped inline disables, each naming a rule with a `--` reason, and none targets react-hooks/rules-of-hooks. The SUMMARY lists every disable with its reason and every file touched. If more than 10 would have been needed, this task does not reach done. It takes the over-cap route instead: genuine fixes only, the plan stops before Task 3, the item is reported as blocked, and the SUMMARY lists the remaining violations. It never adds an 11th directive and never changes a rule's severity.</done>
</task>

<task type="auto">
  <name>Task 3: Server redirect in app/page.tsx replaces the root file convention; README and steering docs rewritten; full definition-of-done gate</name>
  <files>app/page.tsx, middleware.ts (deleted), README.md, .kiro/steering/tech.md, .kiro/steering/structure.md, vercel.json (only if the section B probe fails)</files>
  <read_first>app/page.tsx, middleware.ts, package.json (final state after Tasks 1-2), vercel.json, mise.toml, env.example, app/api/[[...route]]/characters/index.ts (the routes actually registered now), app/api/[[...route]]/route.ts, output of `git ls-files`, README.md, .kiro/steering/tech.md, .kiro/steering/structure.md, .kiro/steering/product.md, .planning/codebase/STRUCTURE.md</read_first>
  <action>
**A. TOOL-03: redirect.** Rewrite app/page.tsx as a server component (no "use client"). It imports `redirect` from "next/navigation", and its default-exported `Home` component calls `redirect("/characters")`. Remove the spinner markup and the lucide import, because they are unreachable after the redirect. Keep the file's existing style: double quotes, no semicolons.

Delete middleware.ts with `git rm middleware.ts`. It only redirected `/`, and every other path it matched passed through unchanged, so removing it changes nothing else. Do not add a `redirects()` entry in next.config.ts or a proxy file: the item text fixes the approach to app/page.tsx.

The expected response for GET / is 307 with `location: /characters`. Next sets this status during prerender (see the context interfaces block). If the Task 3 curl check instead sees a 200, add `export const dynamic = "force-dynamic"` to app/page.tsx and re-run the check.

**B. Deployment Bun version (lockfile reproducibility, coordinator item).** bun.lock is written by the local Bun, while vercel.json pins `env.BUN_VERSION` for deployment (1.2.9 at planning time). The committed bun.lock must install with `--frozen-lockfile` under the Bun version Vercel uses. Do this before writing the docs, so they state the final value.
1. Read V from `env.BUN_VERSION` in vercel.json, and L from `bun --version`.
2. If V equals L, nothing more is needed: Task 1 already proved `bun install --frozen-lockfile` under L.
3. Otherwise, copy the final package.json and bun.lock (after Tasks 1-2) into a fresh `mktemp -d` directory. Inside it, run `bunx bun@V install --frozen-lockfile --dry-run --ignore-scripts`, then remove the directory. Why this shape:
   - The temp copy leaves the repo's node_modules and bun.lock untouched.
   - `--ignore-scripts` skips the postinstall Prisma generate, which has no schema in the copy.
   - `--dry-run` still enforces the frozen lockfile (see the planning probe in the context interfaces block).
4. If the probe exits 0, leave vercel.json unchanged.
5. If it exits non-zero, retry once, because a registry or network failure inside bunx is not a lockfile verdict. If it still fails, set `env.BUN_VERSION` in vercel.json to exactly L, the version that wrote bun.lock. Change nothing else in vercel.json and keep its formatting.
6. Record in the SUMMARY: V, L, the probe command, its exit status per attempt, and the final BUN_VERSION.

**C. TOOL-04: README.md.** Replace the whole starter boilerplate. Write it in English, matching the existing developer docs (Claude's discretion: the UI is pt-BR, but README and steering docs are developer-facing and already English). Write versions in the form "Name major.minor.patch" (for example `Next.js <installed next version>`). Read the installed next version at execution time from package.json and installed node_modules. Sections:

1. **What it is.** A pt-BR digital character sheet for a homebrew tabletop RPG (Berkana, six-stage vitality, 14 attributes, 36 skills, spells and talents with level scaling, adventure kit, finances, notes) used at the table.
2. **Stack table.** Next.js 16 (App Router, Turbopack dev), React 19, TypeScript 5 strict, Hono 4 API mounted at /api through app/api/[[...route]]/route.ts, Prisma 6 + PostgreSQL (client generated into lib/generated/prisma), TanStack Query 5, Zustand 5, Zod 4, Tailwind CSS 4 + shadcn/ui (Radix), sonner, ESLint 9 flat config (eslint.config.mjs with eslint-config-next) and bun test. List only packages still present in package.json.
3. **Requirements.** Bun, written exactly as `Bun <final vercel.json BUN_VERSION from section B>`; Node 24 (mise.toml); PostgreSQL.
4. **Setup.**
   - `bun install` (its postinstall runs prisma generate)
   - copy env.example to .env and set DATABASE_URL
   - create the tables with `bunx prisma db push` (the repo has no prisma/migrations directory)
   - `bun dev`; opening http://localhost:3000 redirects to /characters
5. **Commands table.** `bun dev`, `bun run build`, `bun start`, `bun run lint`, `bun test`, `npx tsc --noEmit`. State that the definition of done is tsc + lint + test + build passing.
6. **Project layout.** A short tree built from `git ls-files` (top-level dirs plus lib subfolders).
7. **API.** List the routes actually registered in app/api/[[...route]]/characters/index.ts now. Read the file, and do not list the calculation routes deleted by 261101-iie. If the PUT handler returns 409 (from 261101-iii), document the updatedAt conflict behavior.
8. **Notes.**
   - Bun is the only package manager (bun.lock only), so document Bun commands only.
   - No authentication, by design: a trusted play group. Do not suggest adding it.
   - notes are stored as a JSON string in a String column.
   - Persisted JSON keys are Portuguese and must not be renamed.
9. **Deployment.** Vercel: region gru1, installCommand and buildCommand from vercel.json, DATABASE_URL set in the Vercel project. State the section B outcome: Vercel uses the BUN_VERSION from vercel.json, and bun.lock was verified to install with `bun install --frozen-lockfile` under that version. When the local Bun that writes bun.lock is upgraded, repeat that check or bump BUN_VERSION to match.

Name only DATABASE_URL as listed in env.example. Never open, quote or copy .env or any connection string.

**D. .kiro/steering/tech.md.** Keep its heading structure. Set every version to the value declared in package.json (or installed). For each library the doc names, keep it only if package.json still lists it: 261101-iie removed the form library, its resolver and the API-docs packages. Add the following:
- a Testing entry: bun test, with the test file location as it exists in the tree
- a Linting entry: ESLint 9 flat config in eslint.config.mjs extending eslint-config-next core-web-vitals + typescript, run by `bun run lint`
- the Node 24 (mise.toml) note, plus a Bun version note written as `Bun <final vercel.json BUN_VERSION from section B>`

Fix the commands block to `bun dev`, `bun run build`, `bun start`, `bun run lint`, `bun test`, `npx tsc --noEmit`, `bunx prisma generate`, `bunx prisma db push`, `bunx prisma studio`. Replace the migrate command, since no migrations directory exists. Keep the build-process and environment sections accurate.

**E. .kiro/steering/structure.md.** Rebuild the directory map from `git ls-files` as it is now. Changes:
- Remove the entry for the nonexistent lib types directory.
- State the real naming: kebab-case filenames exporting PascalCase components, for example components/character/basic-info-tab.tsx exporting BasicInfoTab. Replace the old PascalCase filename example.
- Note that components/ui holds generated shadcn primitives plus the two custom inline editors.
- Add test file locations as they exist.
- In Key Files, replace the old root redirect file with app/page.tsx (server redirect) and add eslint.config.mjs, bun.lock, prisma/schema.prisma, vercel.json and components.json.

Leave .kiro/steering/product.md unchanged: it describes the product, not the stack.

**F. Full gate.** Run the definition-of-done commands, the redirect check and the Bun-version check from verify. All must pass.
  </action>
  <verify>
    <automated>test ! -e middleware.ts && grep -q 'next/navigation' app/page.tsx && grep -qE "redirect\(['\"]/characters['\"]\)" app/page.tsx &&
grep -qE 'Next\.js 16' README.md && grep -q 'React 19' README.md && grep -q 'Prisma 6' README.md && grep -q 'Zod 4' README.md && grep -q 'bun run lint' README.md && grep -q 'bun test' README.md && grep -q 'DATABASE_URL' README.md && ! grep -q 'create-next-app' README.md && ! grep -qE 'npm run|yarn|pnpm' README.md &&
grep -qE 'Next\.js 16' .kiro/steering/tech.md && grep -q 'eslint.config.mjs' .kiro/steering/tech.md && grep -q 'bun test' .kiro/steering/tech.md && ! grep -q '15\.4\.4' .kiro/steering/tech.md &&
{ grep -q '"react-hook-form"' package.json || ! grep -qi 'hook form' .kiro/steering/tech.md; } && { grep -q '"@hono/zod-openapi"' package.json || ! grep -qi 'openapi' .kiro/steering/tech.md; } &&
grep -q 'eslint.config.mjs' .kiro/steering/structure.md && grep -q 'basic-info-tab.tsx' .kiro/steering/structure.md && ! grep -q 'CharacterSheet.tsx' .kiro/steering/structure.md && ! grep -qF '`types/`' .kiro/steering/structure.md &&
! grep -qi 'middleware' README.md .kiro/steering/tech.md .kiro/steering/structure.md && ! grep -qE 'postgres(ql)?://[^ ]*@' README.md .kiro/steering/tech.md .kiro/steering/structure.md &&
V=$(node -p 'require("./vercel.json").env.BUN_VERSION') && [ -n "$V" ] && grep -qF "Bun $V" README.md && grep -qF "Bun $V" .kiro/steering/tech.md &&
{ [ "$V" = "$(bun --version)" ] || { P=$(mktemp -d) && cp package.json bun.lock "$P"/ && ( cd "$P" && bunx bun@"$V" install --frozen-lockfile --dry-run --ignore-scripts >/dev/null 2>&1 ); brc=$?; rm -rf "$P"; [ "$brc" -eq 0 ]; }; } &&
npx tsc --noEmit && bun run lint && bun test &&
LOG=$(mktemp) && { bun run build >"$LOG" 2>&1 || { tail -40 "$LOG"; false; }; } && ! grep -q 'file convention is deprecated' "$LOG" &&
{ node_modules/.bin/next start -p 3191 >/dev/null 2>&1 & PID=$!; curl -s --retry 30 --retry-delay 1 --retry-connrefused -o /dev/null http://localhost:3191/characters; HDRS=$(curl -sI http://localhost:3191/); kill "$PID"; printf '%s\n' "$HDRS" | grep -qE '^HTTP/1\.1 30[78]' && printf '%s\n' "$HDRS" | grep -qiE '^location: (https?://[^/]+)?/characters'; }</automated>
    <human-check>End of phase: run `bun dev`, open http://localhost:3000/ and confirm it lands on /characters with no "Redirecionando..." screen. Open one character and edit one inline field in each tab (Basic data, Skills and Kit, Spells and Talents, Notes), then reload and confirm the edits persisted (a smoke test for the Task 2 lint fixes).</human-check>
  </verify>
  <done>GET / returns 307 with location /characters from redirect() in app/page.tsx. middleware.ts and its build deprecation warning are gone. README.md, .kiro/steering/tech.md and .kiro/steering/structure.md describe the real stack, versions, layout and Bun commands, with no starter boilerplate, stale versions, removed libraries or secrets. The committed bun.lock installs with `--frozen-lockfile` under vercel.json's BUN_VERSION: either that value equals the local Bun or it passed the temp-copy probe. README and tech.md state it as `Bun <version>`, and the SUMMARY records the probe outcome. `npx tsc --noEmit`, `bun run lint`, `bun test` and `bun run build` all pass.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| npm registry → repo (devDependencies, bun.lock) | Third-party lint packages and their transitive deps enter the lockfile |
| browser → Next server (`/`) | Unauthenticated request to the root path receives a redirect |
| repo docs → public readers | README/steering docs are committed and may be published |
| lint-fix edits → notes rendering | Task 2 edits files that render user-authored note HTML (stored-XSS surface fixed by 261101-iil) |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-261101-iim-SC | Tampering | `bun add -d eslint eslint-config-next` | high | mitigate | Both names verified on the npm registry during planning (official eslint repo/OpenJS maintainers; vercel/next.js repo/Vercel release bot), recorded as VERIFIED in the context audit table, so no blocking human checkpoint is needed. Install exactly these two names as devDependencies (not shipped in the runtime bundle). eslint-config-next is pinned to the installed `next` version and eslint to `^9`. bun.lock is updated in place and must pass `bun install --frozen-lockfile`. Planning probe: 0 untrusted lifecycle scripts. The SUMMARY lists the top-level packages added to bun.lock. |
| T-261101-iim-01 | Tampering | components/character/notes-tab.tsx and the 261101-iil formatter (lint fixes) | high | mitigate | Task 2 restricts edits to types, JSX entities, const/let and comment directives, and explicitly forbids changing the HTML-escape/markdown formatter logic. Task 2 verify runs `bun test`, which includes the 261101-iil XSS formatter test, so a regression that re-opens stored XSS fails the gate. |
| T-261101-iim-02 | Elevation of Privilege (quality gate bypass) | Inline `eslint-disable` directives / config overrides | medium | mitigate | `reportUnusedDisableDirectives: "error"`. A `--print-config` severity check proves react-hooks and no-explicit-any rules stay at error. A git-grep + awk gate enforces line-scoped directives with rule + reason, at most 10, and none for rules-of-hooks, so the BUG-01 regression guard cannot be silenced. |
| T-261101-iim-03 | Information Disclosure | README.md, .kiro/steering/*.md | medium | mitigate | Docs name only the variable `DATABASE_URL` from env.example; the executor never opens or copies `.env`. Task 3 verify fails if a credentialed `postgres(ql)://…@` URL appears in any of the three docs. |
| T-261101-iim-04 | Spoofing (open redirect) | app/page.tsx `redirect("/characters")` | low | accept | Target is a constant same-origin path; no request input influences it. |
| T-261101-iim-05 | Denial of Service / control removal | Deleting the root redirect file | low | accept | That file performed only the `/` redirect (no auth, headers or rate limiting; the app has no authentication by owner decision) and excluded /api from its matcher, so removing it drops no security control. |
| T-261101-iim-06 | Denial of Service (failed deploy) / Tampering (non-reproducible install) | vercel.json `env.BUN_VERSION` vs bun.lock written by the local Bun | medium | mitigate | Task 3 section B probes the final bun.lock with `bunx bun@<BUN_VERSION> install --frozen-lockfile --dry-run --ignore-scripts` in a temp copy. If that fails it pins BUN_VERSION to the local Bun. The Task 3 verify repeats the check, so a lockfile Vercel's Bun cannot install with a frozen lockfile fails the gate. Task 1 also compares the lockfile header against a pre-item baseline. |
</threat_model>

<source_audit>
| SOURCE | ID | Feature/Requirement | Plan task | Status |
|--------|----|---------------------|-----------|--------|
| GOAL | Phase 4 SC1 | `bun run lint` runs ESLint flat config + eslint-config-next (react-hooks enabled) and exits 0 | T1 + T2 | COVERED |
| GOAL | Phase 4 SC2 | Only bun.lock tracked; fresh `bun install` works | T1 | COVERED |
| GOAL | Phase 4 SC3 | `/` → `/characters`, no deprecated-middleware warning, no middleware.ts | T3 | COVERED |
| GOAL | Phase 4 SC4 | README + .kiro/steering describe real stack/versions/commands | T3 | COVERED |
| GOAL | Phase 4 SC5 | Component split + full gate | — | Other item (261101-iin, STRUCT-01); this plan still runs the full gate in T3 |
| REQ | TOOL-01 | ESLint flat config with eslint-config-next; `bun run lint` (`eslint .`) passes | T1 + T2 | COVERED |
| REQ | TOOL-02 | Only bun.lock remains | T1 | COVERED |
| REQ | TOOL-03 | Redirect works without the deprecated file | T3 | COVERED |
| REQ | TOOL-04 | README and .kiro/steering/*.md accurate | T3 | COVERED (product.md has no stack/command content and is reviewed, unchanged) |
| CONTEXT | item text | eslint.config.mjs, `"lint": "eslint ."`, fix or narrowly disable violations | T1 + T2 | COVERED |
| CONTEXT | item text | Server redirect via next/navigation in app/page.tsx | T3 | COVERED |
| CONTEXT | orchestrator | Ignore lib/generated, .next, .planning | T1 | COVERED |
| CONTEXT | orchestrator | Lint passes after other code items land; depends on code-changing siblings; order vs 261101-iin | frontmatter | COVERED (depends on iie…iil; iin must depend on iim) |
| CONTEXT | orchestrator | Verify with tsc, lint, bun test, build; Bun package manager | T3 | COVERED |
| CONTEXT | project | No auth, Prisma columns unchanged, behavior identical | T2 + T3 constraints | COVERED |
| CONTEXT | coordinator | Committed bun.lock installs with `--frozen-lockfile` under vercel.json BUN_VERSION; outcome recorded in SUMMARY and README | T3 section B + C + verify | COVERED |
| RESEARCH | — | No RESEARCH.md (quick-batch); planning probe findings embedded in context interfaces | — | n/a |

Assumption-delta probe: `{"skipped": true, "reason": "phase_unresolved"}` (quick-batch item, no ROADMAP phase section), so no checkpoint. Schema gate: no Prisma schema file in scope, so no schema push.
</source_audit>

<verification>
- `bun install --frozen-lockfile` succeeds and `package-lock.json` does not exist (TOOL-02). The bun.lock lockfileVersion/configVersion lines match the baseline captured before this item's first bun command.
- vercel.json BUN_VERSION equals the local Bun, or `bunx bun@<BUN_VERSION> install --frozen-lockfile --dry-run --ignore-scripts` passes on a temp copy of package.json + bun.lock. README and tech.md state `Bun <BUN_VERSION>`.
- `bun run lint` exits 0. `eslint --print-config app/page.tsx` shows the react-hooks rules and `@typescript-eslint/no-explicit-any` at severity 2. `isPathIgnored` is true for lib/generated, .next and .planning paths (TOOL-01).
- Inline-disable gate: at most 10 line-scoped directives with rule + reason, none for rules-of-hooks. If the cap would be exceeded, Task 2 halts with the remaining-violation list in the SUMMARY instead of adding directives or changing severities.
- `test ! -e middleware.ts`. `next start` answers GET / with 30x and `location: /characters`. The `bun run build` log has no deprecated file-convention warning (TOOL-03).
- README/steering doc grep gates pass, positive and negative (TOOL-04).
- Definition of done: `npx tsc --noEmit && bun run lint && bun test && bun run build`.
</verification>

<success_criteria>
- TOOL-01..TOOL-04 satisfied, as shown by the Task 1-3 automated verifies.
- No runtime behavior change: `bun test` (calculations + notes formatter suites from siblings) passes, and the end-of-phase human check confirms the redirect and inline saves.
- The SUMMARY records all of the following:
  - the post-batch lint baseline per rule, with the installed next / eslint-config-next / eslint-plugin-react-hooks versions (Task 1)
  - every inline disable with its reason, or the over-cap list if Task 2 halted
  - any files touched beyond `files_modified`
  - the remaining warnings
  - the packages added to bun.lock
  - the Bun-version probe outcome (V, L, exit status, final BUN_VERSION)
</success_criteria>

<output>
Create `.planning/quick/261101-iim-tooling-and-docs-tool-01-04-add-eslint-flat-config-eslint-co/261101-iim-SUMMARY.md` when done
</output>
