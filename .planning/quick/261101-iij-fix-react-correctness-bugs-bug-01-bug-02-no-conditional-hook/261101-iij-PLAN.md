---
phase: 261101-iij-fix-react-correctness-bugs-bug-01-bug-02-no-conditional-hook
plan: 01
type: execute
wave: 5                      # advisory, derived from depends_on: iie=1 -> iif=2 -> iig=3 -> iii=4 -> iij=max+1=5; `quick-batch update` recomputes it from depends_on / files_modified
depends_on: ["261101-iie", "261101-iif", "261101-iig", "261101-iii"]
files_modified:
  - components/character/notes-tab.tsx
  - components/character/notes-tab.render.test.ts
  - components/ui/editable-field.tsx
autonomous: true
requirements: [BUG-01, BUG-02]

must_haves:
  truths:
    - "Server-rendering NotesTab (effects not run) with legacy plain-text notes in edit mode makes zero update-mutation calls — no network migration happens during render (BUG-02)"
    - "HUMAN-VERIFIED ONLY (Task 2 end-of-phase human-check, no automated gate: renderToString runs no effects and no DOM test environment is installed): opening a character whose notes column holds legacy plain text, in edit mode, still converts it into exactly one 'Anotações Antigas' note with one PUT and one success toast, also under dev React Strict Mode"
    - "NotesTab calls no useState setter from its render body: the corrupted-data flag is derived from the memoized parse result and the migrated-notes flag is a ref written only inside an effect. Checked by Task 2's static setter gate plus Test E's single-render-pass check (BUG-02)"
    - "No log-level console calls (log, info, debug) remain in app/, components/, lib/ (excluding lib/generated), providers/ or hooks/ (BUG-02)"
    - "EditableField calls every hook unconditionally, in the same order on every render, before any early return, regardless of characterId; the isSaving/error values it shows are identical to before (BUG-01)"
    - "Notes parsing results are unchanged: empty/null -> no notes, JSON array -> that array, JSON object or malformed JSON -> no notes, valid notes render their titles. Malformed JSON renders without throwing, writing, or a second render pass. This plan's tests do not pin the no-notes UI copy, because 261101-iik replaces the corrupted-data UI"
    - "npx tsc --noEmit, bun test and bun run build all pass"
  artifacts:
    - path: "components/character/notes-tab.tsx"
      provides: "Render-pure notes parsing (useMemo) and a ref-guarded legacy-migration effect"
      contains: "useEffect"
    - path: "components/character/notes-tab.render.test.ts"
      provides: "Render-purity regression tests for NotesTab (renderToString with a mocked update mutation)"
      contains: "renderToString"
    - path: "components/ui/editable-field.tsx"
      provides: "EditableField with unconditional, fixed-order hook calls"
      contains: "useIsFieldEditing"
  key_links:
    - from: "components/character/notes-tab.tsx"
      to: "lib/api/queries.ts"
      via: "legacy-notes migration calls useUpdateCharacter().mutateAsync only from inside a useEffect guarded by a useRef flag"
      pattern: "useRef"
    - from: "components/character/notes-tab.render.test.ts"
      to: "components/character/notes-tab.tsx"
      via: "bun:test mock.module('@/lib/api/queries') + dynamic import of NotesTab + react-dom/server renderToString"
      pattern: "mock\\.module"
    - from: "components/ui/editable-field.tsx"
      to: "lib/store/character.ts"
      via: "store hooks (useCharacterStore / useIsFieldEditing) called unconditionally at the top of EditableField"
      pattern: "useIsFieldEditing\\("
---

<objective>
Fix the two React correctness bugs of quick item 261101-iij (BUG-01, BUG-02) without changing user-visible behavior:

1. BUG-02 — `components/character/notes-tab.tsx` must do no state updates and no network migration during render: the notes parse becomes a pure `useMemo`, the legacy plain-text migration moves into a `useEffect` guarded by a `useRef`, the corrupted-data flag becomes derived state, and the stray debug logging (log-level console calls) is removed.
2. BUG-01 — `components/ui/editable-field.tsx` must call no hook conditionally (today the `isSaving` line calls the store hook inside a ternary branch).

Purpose: Rules-of-Hooks and render-purity violations can throw, corrupt hook state, and (for notes) fire duplicate PUTs that write duplicate notes. These fixes are also prerequisites for 261101-iik (notes util), 261101-iil (XSS) and 261101-iin (component split), which build on the fixed code, and for 261101-iim whose react-hooks lint rules become the final gate.

Ordering / scope (why these depends_on):
- 261101-iie removes the store fallback path in `editable-field.tsx` and may already have removed the conditional hook — Task 3 therefore fixes only what remains and otherwise verifies.
- 261101-iif edits `editable-field.tsx` (inline attribute formula in EditableAttributeField) — same file, sequenced first.
- 261101-iig sets up `bun test` (test script + `bun:test` type resolution for `npx tsc --noEmit` / `next build`); the regression test in Task 1 needs that tooling. At planning time `@types/bun` is NOT installed, so a `bun:test` import would break tsc and the build before iig lands.
- 261101-iii makes `useUpdateCharacter` concurrency-aware; ROADMAP Phase 3 requires the legacy-migration write to go through that path, and iii may change callers of the mutation.
- 261101-iik and 261101-iil (later items) also rewrite `notes-tab.tsx`; they come AFTER this item. This plan does not create `lib/notes.ts` (iik) and does not touch `renderFormattedText` / `dangerouslySetInnerHTML` (iil).

Output: render-pure NotesTab, a NotesTab render regression test file, and an EditableField with unconditional hooks.

Source coverage audit (item text + REQUIREMENTS + project constraints):
| Source item | Covered by |
|---|---|
| REQ BUG-01 / item: no conditional hook call in editable-field.tsx | Task 3 |
| REQ BUG-02 / item: no network migration during render (move to effect) | Task 1 |
| REQ BUG-02 / item: no setState of the corrupted-data flag during render (derived state) | Task 2 |
| REQ BUG-02 / item: remove stray console log calls | Task 2 |
| Constraint: behavior identical | Tasks 1-3 preserve outputs. Test B asserts valid notes still render. Tests A, C, D and E assert no write and no extra render pass. The no-notes / corrupted-data copy is deliberately not asserted because 261101-iik changes it |
| Strict Mode: exactly one migration PUT per mount | Human-verified only (Task 2 human-check). renderToString runs no effects, and a mounted test would need a DOM shim package, which this plan must not install |
| Constraint: Prisma column types unchanged / no schema edit | No task touches prisma/ |
| Constraint: no authentication added | No task touches the API |
| Verify with tsc, bun test, build (lint not a gate until 261101-iim) | Task verifies + `<verification>` |
| Out of scope here (other items): lib/notes.ts + non-destructive corrupted state + Strict-Mode hardening (261101-iik), HTML escaping (261101-iil), file split (261101-iin), ESLint (261101-iim) | not planned here by design |
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.claude/CLAUDE.md
@.planning/STATE.md
@.planning/codebase/CONCERNS.md
@components/character/notes-tab.tsx
@components/ui/editable-field.tsx
@components/character/types.ts
@lib/store/character.ts

# Sibling summaries — read only for the facts named (they exist once those items have merged)
# iie: what was removed from editable-field.tsx / the store (fallback path, store isSaving?)
@.planning/quick/261101-iie-remove-dead-code-clean-01-03-delete-unused-api-routes-level/261101-iie-SUMMARY.md
# iig: test-file naming/location convention and how bun:test types are made visible to tsc / next build
@.planning/quick/261101-iig-add-unit-tests-calc-02-bun-test-suite-for-every-exported-fun/261101-iig-SUMMARY.md
# iii: current useUpdateCharacter call signature (variables shape) and 409 handling
@.planning/quick/261101-iii-optimistic-concurrency-api-02-useupdatecharacter-sends-the-u/261101-iii-SUMMARY.md

<interfaces>
Facts extracted at planning time (HEAD 832fa9b) — re-check against the current tree, siblings may have changed them:

- `CharacterTabProps` (components/character/types.ts): `character: any`, `characterId: string`, `isEditMode: boolean`, plus optional modal props. `NotesTabProps extends CharacterTabProps {}`; `NotesTab` is a named export of `components/character/notes-tab.tsx`, file uses double quotes + semicolons.
- notes-tab.tsx imports only `useUpdateCharacter` from `@/lib/api/queries`; uses `updateCharacterMutation.mutateAsync({ id: characterId, data: { notes: <json string> } })` everywhere (iii may extend this shape — follow whatever the current hook requires).
- `Note` interface (in notes-tab.tsx): `{ id: string; title: string; content: string; createdAt: string; updatedAt: string }`.
- Current parse (render-time IIFE, ~lines 98-170): falsy notes -> []; array -> itself; string: trimmed "" -> []; starts with `[` or `{` -> JSON.parse: array -> it, object -> [], parse error -> console.error + []; any other non-empty string = legacy text -> (if isEditMode and not yet migrated) migration call during render -> []; non-string -> []; outer catch -> console.error + debug logs + (dev only) corrupted flag set -> [].
- Corrupted-data UI (~line 510): dev-only "🔧 Limpar Dados Corrompidos" button rendered when `process.env.NODE_ENV === "development" && hasCorruptedData && isEditMode`; its handler `clearCorruptedNotes` writes "[]".
- Empty-state copy when there are no notes: "Nenhuma anotação ainda".
- Migration success toast: "Anotações antigas migradas com sucesso!"; failure log: "Erro ao migrar anotações antigas:"; migrated note title "Anotações Antigas".
- EditableField (components/ui/editable-field.tsx, 2-space indent, no semicolons, single quotes): hooks at ~lines 195-223 (useState x2, useRef, whole-store `useCharacterStore()` destructure, `useIsFieldEditing`, `useUpdateCharacter`, the store selector inside the isSaving ternary at line 207, useEffect x2); first early return at line 321. editable-scaling-field.tsx already uses `const isSaving = updateCharacterMutation.isPending` unconditionally (no change needed there).
- TanStack Query v5: `mutateAsync` returned by `useMutation` is a stable function reference across renders.
- Planning spike (deleted): with `mock.module("@/lib/api/queries", ...)` + `await import("./notes-tab")` + `renderToString(createElement(NotesTab, {...}))`, `bun test` (Bun 1.3.2) renders NotesTab fine; at HEAD the legacy-text/edit-mode render calls the mocked mutateAsync once (so Test A is RED at HEAD), and a JSON-array render contains the note title.
- Revision spike (deleted): when `useUpdateCharacter` is mocked as a bun `mock(...)`, a malformed-JSON render (`[{"id":`) at HEAD, in edit mode and in view mode, returns non-empty HTML. It makes 0 mutateAsync calls and exactly 1 `useUpdateCharacter` call per `renderToString`. A component that calls its own state setter during render runs twice under `renderToString` (React re-runs it after a render-phase update), so "hook mock called once per render" detects a setState during render.
- No DOM test environment is installed (no happy-dom, jsdom, @testing-library or react-test-renderer), so react-dom/client cannot mount NotesTab under bun without adding a package. Effects (and therefore Strict Mode double effects) cannot be exercised by this plan's tests.
</interfaces>
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1 (tracer): NotesTab render never fires the legacy-notes migration — test -> component -> mutation boundary</name>
  <files>components/character/notes-tab.render.test.ts, components/character/notes-tab.tsx</files>
  <precondition>261101-iie, 261101-iif, 261101-iig and 261101-iii are merged, and bun:test is type-resolvable: `git ls-files '*.test.ts' '*.test.tsx' | grep -q .` succeeds and `npx tsc --noEmit` passes on the current tree before any change.</precondition>
  <read_first>components/character/notes-tab.tsx (whole file), components/character/types.ts, the 261101-iig SUMMARY (test conventions), the 261101-iii SUMMARY (useUpdateCharacter variables shape)</read_first>
  <behavior>
    - Test A (RED before the component change): server-rendering NotesTab with `character.notes` = a plain legacy string (e.g. "Texto antigo do personagem"), `isEditMode: true` makes ZERO calls to the mocked mutateAsync.
    - Test B (harness sanity, green throughout): server-rendering with a JSON array holding one note titled e.g. "Titulo de Teste" returns HTML that contains that title and makes zero mutation calls. The fixture note has all five string fields (id, title, content, createdAt, updatedAt), so 261101-iik's stricter note schema still classifies it as valid and this test survives that item unchanged.
    - Test C (guard): the same legacy string with `isEditMode: false` makes zero mutation calls.
  </behavior>
  <action>
RED first (BUG-02). Create components/character/notes-tab.render.test.ts as a plain .ts file (no JSX) using `describe`/`it`/`expect`/`mock` from bun:test, `createElement` from react and `renderToString` from react-dom/server. Register `mock.module("@/lib/api/queries", factory)` at module top BEFORE the component is loaded; the factory returns `useUpdateCharacter` as a bun `mock(...)` function, so Task 2's Test E can count render passes. It returns an object with `mutateAsync` (a bun `mock` of an async function resolving to an empty object), `isPending: false`, `error: null`. The factory also returns every other named binding notes-tab.tsx imports from `@/lib/api/queries` at execution time (check its import line; after 261101-iii it may import more). Load NotesTab with a dynamic `await import("./notes-tab")` inside the tests (or a `beforeAll`), never a static import, so the mock is in place first. Call `mockClear()` on both the useUpdateCharacter mock and the mutateAsync mock before each test. Tests use only the public `NotesTab` export, its props and the mocked hook. They make no assertion about the guard ref, the effect, or any internal identifier. 261101-iik replaces this plan's ref guard with a module-scoped claim, and it must be able to keep every test in this file unchanged. Props: `character: { notes }`, `characterId: "test-char"`, `isEditMode`. Follow the test naming/location convention from 261101-iig; the default path above matches the `*.test.ts` pattern — if iig's tsc/build handling does not cover this path, mirror iig's convention and record the deviation in the SUMMARY. Run the test file: Test A must FAIL (1 call) against the unchanged component. Commit `test(261101-iij): add failing NotesTab render-purity test`.

GREEN (BUG-02). In components/character/notes-tab.tsx:
(a) Replace the render-time IIFE with a `useMemo` keyed on `character.notes` that is a pure function of that value and returns `{ allNotes, legacyNotesText }` — `legacyNotesText` is the trimmed string when the column holds non-empty text that starts with neither `[` nor `{`, otherwise null. Every existing branch keeps its exact result (see interfaces) and keeps its existing console.error lines for real parse errors. The memo body must call no state setter and no mutation.
(b) Delete the migrated-notes useState pair entirely and add a `useRef(false)` guard (name it e.g. `migrationAttemptedRef`).
(c) Add a `useEffect` that returns early unless `isEditMode` is true, `legacyNotesText` is non-null, and the ref is still false. Otherwise it sets the ref to true synchronously BEFORE starting the async write, then performs the existing migration exactly as today: one Note titled "Anotações Antigas", content = legacyNotesText, id `Date.now().toString()`, createdAt/updatedAt = current ISO time, serialized as a one-element JSON array and written through the same update mutation as the other handlers (use the current, concurrency-aware call signature from 261101-iii). Success -> `toast.success("Anotações antigas migradas com sucesso!")`. Failure -> keep `console.error("Erro ao migrar anotações antigas:", error)` and leave the guard set (no automatic retry loop; remounting the tab retries — Radix Tabs unmount inactive panels).
(d) Effect deps: `legacyNotesText`, `isEditMode`, `characterId` and the mutation function. Capture `updateCharacterMutation.mutateAsync` in a local const and list that, not the whole mutation object, so exhaustive-deps (enforced later by 261101-iim) is satisfied. The ref makes re-runs no-ops. Do not call any state setter synchronously inside the effect body (react-hooks set-state-in-effect rule), and never read or write the ref during render.
(e) The ref guard also covers React Strict Mode's dev double effect run (refs persist across that simulated remount), so one migration PUT per mount. No automated test here can observe this: renderToString runs no effects and no DOM test environment is installed. Do NOT install one. Task 2's end-of-phase human-check verifies it.
(f) Keep the guard minimal, because it is an intermediate step: 261101-iik replaces it with a module-scoped claim. Use one boolean ref only, with no per-character key map, no reset in an effect cleanup, no retry logic and no exported helper.
Do NOT create lib/notes.ts (261101-iik) and do NOT touch `renderFormattedText` / `dangerouslySetInnerHTML` (261101-iil). If 261101-iik's shared notes util unexpectedly already exists, call it instead of re-inlining the parse, and apply the same rules at the call site: pure memo in render, migration only in the ref-guarded effect.
Re-run the test file until Tests A-C pass. Commit `fix(261101-iij): move legacy notes migration out of render (BUG-02)`.
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && bun test components/character/notes-tab.render.test.ts && npx tsc --noEmit</automated>
  </verify>
  <done>Tests A-C pass and Test A was observed failing before the component change (both commits exist). notes-tab.tsx parses notes in a useMemo, has no migrated-notes useState, and starts the migration only from a ref-guarded useEffect. `npx tsc --noEmit` exits 0. This task does not claim the Strict Mode single-PUT property; only Task 2's human-check verifies it.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Derive NotesTab's corrupted-data flag and remove the stray debug logging</name>
  <files>components/character/notes-tab.tsx, components/character/notes-tab.render.test.ts</files>
  <read_first>components/character/notes-tab.tsx (the memo from Task 1 and the dev-only corrupted-data button block near the header actions)</read_first>
  <behavior>
    - Test D: server-render NotesTab with malformed JSON (e.g. `[{"id":`) and, separately, with legacy text. Spy on the log, info and debug console methods (`spyOn(console, "log")` and the same for "info" and "debug", restored afterwards). The spies record zero calls and there are zero mutation calls.
    - Test E (render purity / no write for malformed JSON, edit mode and view mode): `renderToString` with malformed JSON (e.g. `[{"id":`) does not throw and returns non-empty HTML. It makes zero mutateAsync calls. It finishes in one render pass: the mocked useUpdateCharacter is called exactly once per `renderToString` call. A state setter called during render makes React re-run the component, which the revision spike showed raises that count to 2. Test E asserts NOTHING about the rendered copy. The no-notes empty state and the corrupted-data UI belong to 261101-iik.
  </behavior>
  <action>
Per BUG-02, in components/character/notes-tab.tsx:
(a) Delete the corrupted-data useState pair. Extend the Task 1 memo result with `hasCorruptedData: boolean`. It is true exactly on the path that used to raise the flag (the outer catch of the parse) and false everywhere else. The dev-only "🔧 Limpar Dados Corrompidos" button keeps its existing render condition (development env AND hasCorruptedData AND isEditMode), now reading the derived value, so visible behavior is identical. The derived flag is intentionally not sticky: after `clearCorruptedNotes` writes "[]" it recomputes to false. Do NOT widen when the flag is true (for example on JSON parse failure). That is the non-destructive corrupted-state work of 261101-iik.
(b) Remove the four debug statements at log level in the outer catch of the parse, and the development-only branch that only wrapped them and the old flag update. Keep the error-level lines ("Erro ao parsear anotações:", "Erro ao fazer parse do JSON:") because they are real error paths, per CONVENTIONS. Do not leave comments that quote the removed statements.
(c) Sweep app/, components/, lib/ (excluding lib/generated), providers/ and hooks/ for any remaining log-level (log, info, debug) console call. At planning time the only four were in notes-tab.tsx. If a sibling item introduced another, remove it, or switch it to error level only if it reports a genuine error path.
(d) Add Tests D and E to components/character/notes-tab.render.test.ts, using the same mock and dynamic-import setup as Task 1. Test E must not assert any rendered text or copy; it asserts only no-throw, zero writes and a single render pass. The test file sits under components/ and is scanned by the log-level gate, so it may refer to console methods only by string name inside spyOn and must never call them.
Commit `fix(261101-iij): derive notes corrupted flag, drop debug logging (BUG-02)`.
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && bun test components/character/notes-tab.render.test.ts && test "$(grep -vE '^[[:space:]]*//' components/character/notes-tab.tsx | grep -cE 'setHasCorruptedData|setHasMigratedOldNotes')" -eq 0 && test "$(grep -rnE 'console\.(log|info|debug)\(' --include=*.ts --include=*.tsx app components lib providers hooks 2>/dev/null | grep -v 'lib/generated' | grep -vE '^[^:]+:[0-9]+:[[:space:]]*//' | wc -l)" -eq 0 && test "$(grep -cE '\buse(Effect|Memo|Ref)\(' components/character/notes-tab.tsx)" -ge 3 && npx tsc --noEmit</automated>
    <human-check>End of phase, `bun run dev` (React Strict Mode on): set a character's notes column to plain text (via DB or the API), then open its Notes tab in edit mode. Expect exactly one "Anotações Antigas" note, exactly one PUT /api/characters/:id in the Network tab, and one success toast. Reload: still one note, no new PUT. The browser console shows no log-level output from the Notes tab.</human-check>
  </verify>
  <done>Tests A-E pass. Test E pins no UI copy. notes-tab.tsx has no state setter for the corrupted or migrated flags (gate baseline at HEAD: 4 matches, now 0). No log-level (log, info, debug) console calls remain in app source (baseline at HEAD: 4, all in notes-tab.tsx, now 0). The Strict Mode single-PUT property is verified only by the human-check above. notes-tab.tsx uses useEffect, useMemo and useRef (baseline 0, now at least 3). `npx tsc --noEmit` exits 0.</done>
</task>

<task type="auto">
  <name>Task 3: EditableField calls every hook unconditionally (BUG-01)</name>
  <files>components/ui/editable-field.tsx</files>
  <read_first>components/ui/editable-field.tsx (current state after 261101-iie and 261101-iif), lib/store/character.ts (does the store still expose isSaving?), the 261101-iie SUMMARY</read_first>
  <action>
Per BUG-01, inside `EditableField` every hook must run at the component's top level, unconditionally, in a fixed order, before the first early return. That covers useState, useRef, every `useCharacterStore` call (with or without a selector), `useIsFieldEditing`, `useUpdateCharacter` and useEffect. None may sit inside a ternary, a `&&`/`||`/`??` operand, an if, a loop or a nested function.
Case 1: the `isSaving` derivation still calls the store selector inside the ternary's false branch (the HEAD state). Hoist that selector into its own unconditional statement, e.g. `const storeIsSaving = useCharacterStore((state) => state.isSaving)`, placed with the other store hooks. Then pick between the mutation's `isPending` and `storeIsSaving` with a plain ternary on `characterId`. The resulting values must be identical for both characterId cases. The `error` derivation is not a hook and stays as it is.
Case 2: 261101-iie already removed the store fallback and simplified `isSaving` to the mutation's `isPending`, possibly also deleting the store's isSaving. Keep that and do not re-add a store hook. Make no code change for this line, and record in the SUMMARY that BUG-01 was resolved by 261101-iie and verified here by the gates below.
In both cases, also check that EditableNumberField, EditableTextArea and EditableAttributeField call no hook conditionally (at HEAD they call none). Do not change the props contract (characterId keeps its current optionality), `buildUpdateData`, the whole-store destructure's subscription scope, or any rendering. Behavior must stay identical. Follow the file's style: 2-space indent, single quotes, no semicolons.
Commit `fix(261101-iij): call EditableField hooks unconditionally (BUG-01)` if a change was needed. Otherwise record the verification in the SUMMARY and make no code commit.
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && F=components/ui/editable-field.tsx && test -f "$F" && ! (grep -vE '^[[:space:]]*//' "$F" | grep -qE '(\?|:|&&|\|\||\?\?)[[:space:]]*use[A-Z][A-Za-z]*\(') && awk '/^export function EditableField\(/{f=1} /^export function EditableNumberField\(/{f=0} f && /^  (if|return)[ (]/ && !r {r=NR} f && /(^|[^A-Za-z.])use[A-Z][A-Za-z]*\(/ {l=NR} END{exit !(r && l && l < r)}' "$F" && npx tsc --noEmit</automated>
    <human-check>End of phase, `bun run dev`: inline-edit a basic field (e.g. the character name) and an attribute. The value saves, the spinner shows while the save is in flight, and the console shows no React hook-order warning.</human-check>
  </verify>
  <done>No hook call appears inside a conditional or logical expression in editable-field.tsx. This gate fails at HEAD on line 207 and must now pass. All EditableField hook calls come before its first top-level if/return; this regression guard passes at HEAD and must still pass. `npx tsc --noEmit` exits 0.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| API -> NotesTab render | The `notes` String column is untrusted: the API is open by design (no auth), so any client can write arbitrary text or JSON into it |
| NotesTab -> PUT /api/characters/:id | Client-initiated writes (legacy migration, note CRUD) that overwrite the whole notes column |
| EditableField -> Zustand store / React Query | Hook state that must stay attached to the right hook slot across renders |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-261101-iij-01 | Denial of Service / Tampering | NotesTab legacy-notes migration | medium | mitigate | Migration moved out of render into a useEffect guarded by a useRef that is set before the write, so there is at most one PUT per mount and no duplicate notes or request storm on re-render or failure. Test A (zero mutation calls during render) proves the render half. The Strict Mode single-PUT half is human-verified only, by the Task 2 end-of-phase human-check, because it cannot be automated without a DOM test package, which this plan must not install |
| T-261101-iij-02 | Information Disclosure | notes-tab parse catch block debug logging of the raw notes column | low | mitigate | Log-level statements that printed the notes payload, type and length are removed. Only error-level logging of the error object remains (Task 2, gate on console log-level calls) |
| T-261101-iij-03 | Tampering (client state integrity) | EditableField conditional store hook | low | mitigate | All hooks are called unconditionally in a fixed order, so a characterId change can no longer shift hook slots or attach state to the wrong hook (Task 3 gates) |
| T-261101-iij-04 | Tampering | Corrupted notes JSON overwritten by the next add | medium | transfer | Owned by 261101-iik (NOTE-01, non-destructive corrupted state). This plan preserves current parse results and does not widen the corrupted flag |
| T-261101-iij-05 | Elevation of Privilege (stored XSS) | renderFormattedText via dangerouslySetInnerHTML | high | transfer | Owned by 261101-iil (BUG-03), which runs after this item. This plan must not modify renderFormattedText |
| T-261101-iij-SC | Tampering | npm/bun installs | low | accept | This plan installs no packages. It uses test tooling installed and legitimacy-checked by 261101-iig. If a package install appears necessary, stop and surface it instead of installing |
</threat_model>

<verification>
Run from the repo root after all tasks (`bun run lint` is NOT a gate until 261101-iim):
- `npx tsc --noEmit` exits 0
- `bun test` exits 0 (the whole suite, including 261101-iig's calculations tests and this item's notes-tab.render.test.ts)
- `bun run build` exits 0
- Gates from Tasks 2-3 pass: no conditional hook expression in editable-field.tsx; hook-order guard OK; no flag-setter calls in notes-tab.tsx; zero log-level (log, info, debug) console calls in app source; useEffect, useMemo and useRef present in notes-tab.tsx
- Human-verified only (end of phase, Task 2 human-check): exactly one migration PUT and one "Anotações Antigas" note under dev React Strict Mode. No automated gate claims this property.
- `git diff --stat` touches only the three files in `files_modified` (no prisma/, no API, no renderFormattedText change: `git diff -U0 components/character/notes-tab.tsx | grep -c 'dangerouslySetInnerHTML'` is 0)
</verification>

<success_criteria>
- BUG-01: EditableField calls no hook conditionally, and its isSaving/error values are unchanged.
- BUG-02: NotesTab calls no state setter and starts no network migration during render (Tests A, C, D, E and the static gates). The migration runs at most once per mount from a ref-guarded effect; the human-check confirms this under Strict Mode. The corrupted flag is derived. No stray log-level console calls remain.
- Behavior identical: same parse results, the same single migrated note and toast, and the same dev-only corrupted-data button condition.
- `npx tsc --noEmit`, `bun test` and `bun run build` pass.
</success_criteria>

<output>
Create `.planning/quick/261101-iij-fix-react-correctness-bugs-bug-01-bug-02-no-conditional-hook/261101-iij-SUMMARY.md` when done. Record which BUG-01 case applied (fixed here vs. already resolved by 261101-iie), the final test-file path if it deviated from `components/character/notes-tab.render.test.ts`, and the note that Bun's `mock.module` is process-wide within a `bun test` run, so a future test needing the real `@/lib/api/queries` must account for it.
</output>
