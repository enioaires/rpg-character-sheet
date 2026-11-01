---
phase: 261101-iil
plan: 01
type: execute
wave: 1                     # recomputed by `quick-batch update` from depends_on
depends_on: ["261101-iig", "261101-iij", "261101-iik"]
files_modified:
  - lib/notes-format.ts
  - lib/notes-format.test.ts
  - components/character/notes-tab.tsx
autonomous: true
requirements: [BUG-03]

must_haves:
  truths:
    - "A note whose content is `<script>alert(1)</script>` or `<img src=x onerror=alert(1)>` is shown in the notes tab as literal text and executes nothing (BUG-03)"
    - "For notes without HTML-special characters (& < > \" '), bold, italic, inline code, #/##/### headings, '- ' list items, blank-line paragraphs and single line breaks produce byte-identical HTML to the pre-fix formatter"
    - "The only HTML the notes tab injects via dangerouslySetInnerHTML comes from formatNoteHtml, which HTML-escapes the note text before any markup is generated; the output contains no tag outside the fixed set strong/em/code/h1/h2/h3/li/p/br"
    - "`bun test` runs the formatter suite and passes; `npx tsc --noEmit` and `bun run build` pass"
    - "No auth added, no Prisma schema or column change, no API change"
  artifacts:
    - path: "lib/notes-format.ts"
      provides: "Pure escape-then-format functions for note content (no React, no DOM, no deps)"
      exports: ["escapeHtml", "formatNoteHtml"]
    - path: "lib/notes-format.test.ts"
      provides: "bun test suite: XSS payloads, escape order, allowlist property, formatting parity with the pre-fix chain"
      contains: "bun:test"
    - path: "components/character/notes-tab.tsx"
      provides: "renderFormattedText delegating to formatNoteHtml; no inline markdown chain left"
      contains: "formatNoteHtml"
  key_links:
    - from: "components/character/notes-tab.tsx"
      to: "lib/notes-format.ts"
      via: "import { formatNoteHtml } from \"@/lib/notes-format\" feeding dangerouslySetInnerHTML"
      pattern: "__html: formatNoteHtml\\("
    - from: "lib/notes-format.test.ts"
      to: "lib/notes-format.ts"
      via: "direct import of escapeHtml and formatNoteHtml"
      pattern: "from ['\"]\\./notes-format['\"]"
---

<objective>
Fix the stored XSS in note rendering (BUG-03). Today `renderFormattedText` in `components/character/notes-tab.tsx` runs a regex light-markdown chain over raw note text and injects the result with `dangerouslySetInnerHTML`. Any client can write a note through the open API (no auth, by design), so `<img src=x onerror=...>` runs for everyone who opens that note.

The fix moves the formatter into a pure module, `lib/notes-format.ts`. That module HTML-escapes the text first (`&`, `<`, `>`, `"`, `'`) and then runs the same markdown chain unchanged, so every tag in the output comes from the formatter's own fixed set. The component keeps its `dangerouslySetInnerHTML` call, but now passes it `formatNoteHtml(text)` instead of the raw chain. A bun test suite pins down the security behavior and the rendering parity.

Purpose: note content must never be able to inject HTML or script, and normal notes must render exactly as before. This is a project constraint ("Markdown rendering must look identical for normal notes").
Output: `lib/notes-format.ts`, `lib/notes-format.test.ts`, and an updated `components/character/notes-tab.tsx`.

Planning evidence (measured at base 832fa9b):
- Running the escape-first chain over a corpus of normal notes gave byte-identical output to the current chain.
- Every attack payload below came out with no tag outside the allowlist.
- In notes-tab.tsx: 0 `formatNoteHtml` references and 7 inline markup templates (the formatter chain). These are the gate baselines.
- The only other `dangerouslySetInnerHTML` in app code is shadcn `components/ui/chart.tsx`. It does not render user data and is deleted by 261101-iie, so it is out of scope.
- Note titles are rendered as React text, so they are already escaped.

Sequencing (depends_on):
- 261101-iig sets up the bun test infrastructure. Without `bun:test` types, a new `*.test.ts` breaks `npx tsc --noEmit` and `next build`.
- 261101-iij and 261101-iik also edit `components/character/notes-tab.tsx`, so this item runs after them on the already-fixed file.
- 261101-iin, which splits the file, is meant to run after this item.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/codebase/CONVENTIONS.md
@components/character/notes-tab.tsx

Project constraints for this item:
- No authentication. Do not add any.
- Prisma column types must not change. Do not touch `prisma/schema.prisma`, so no schema push is needed.
- Normal notes must render identically.
- Verify with `npx tsc --noEmit`, `bun test` and `bun run build`. `bun run lint` is NOT a gate until 261101-iim lands.
- Package manager is Bun.
- This item installs no packages.

<interfaces>
New module contract (lib/notes-format.ts). Both functions are pure and synchronous, with no imports:

```typescript
/** Escapes & < > " ' for safe use as HTML text content. & is replaced first. */
export function escapeHtml(text: string): string

/**
 * Escapes the note text, then applies the light-markdown chain (bold, italic, inline code,
 * ### / ## / # headings, "- " list items, blank-line paragraphs, single line breaks) and the
 * leading-tag paragraph wrap. Returns an HTML string for dangerouslySetInnerHTML.
 */
export function formatNoteHtml(text: string): string
```

Current consumer (components/character/notes-tab.tsx): `const renderFormattedText = (text: string) => ...` returns
`<div className="formatted-content" dangerouslySetInnerHTML={{ __html: ... }} />` and has exactly one call site,
`{renderFormattedText(note.content)}`, inside the note card's CardContent.

Pre-fix formatter source, for the parity oracle in Task 2:
`git show 832fa9b:components/character/notes-tab.tsx | sed -n '/const renderFormattedText/,/^  };/p'`
</interfaces>
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Escape-then-format, end to end — pure formatter module wired into the notes tab, proven by XSS tests</name>
  <precondition>bun:test type declarations are installed (`grep -qE '"(@types/bun|bun-types)"' package.json` succeeds — added by 261101-iig), so a new *.test.ts compiles under `npx tsc --noEmit` and `next build`; if not, halt and report rather than editing package.json/bun.lock (outside this item's files)</precondition>
  <files>lib/notes-format.ts, lib/notes-format.test.ts, components/character/notes-tab.tsx</files>
  <behavior>
    - formatNoteHtml('<script>alert(1)</script>') === '<p class="mb-2">&lt;script&gt;alert(1)&lt;/script&gt;</p>'
    - formatNoteHtml('<img src=x onerror=alert(1)>') === '<p class="mb-2">&lt;img src=x onerror=alert(1)&gt;</p>'
    - Attribute breakout inside bold: formatNoteHtml('**"><img src=x onerror=alert(1)>**') === '<strong class="font-semibold text-foreground">&quot;&gt;&lt;img src=x onerror=alert(1)&gt;</strong>'
    - Payload inside a code span, heading and list item stays escaped: formatNoteHtml('`<script>alert(1)</script>`') contains '&lt;script&gt;' and not '<script'; formatNoteHtml('# <svg onload=alert(1)>') === '<h1 class="text-xl font-bold mt-4 mb-2 text-foreground">&lt;svg onload=alert(1)&gt;</h1>'; formatNoteHtml('- <a href="javascript:alert(1)">x</a>') === '<li class="ml-4 list-disc list-inside">&lt;a href=&quot;javascript:alert(1)&quot;&gt;x&lt;/a&gt;</li>'
    - Allowlist property: for every payload above plus 'ok\n<iframe src=javascript:alert(1)></iframe>', removing every match of /<\/?(strong|em|code|h1|h2|h3|li|p|br)(\s+class="[^"]*")?\s*\/?>/g from the output leaves no '<' character
    - escapeHtml(`&<>"'`) === '&amp;&lt;&gt;&quot;&#39;' and escapeHtml('&lt;') === '&amp;lt;' (& is escaped first, exactly once)
  </behavior>
  <action>
RED: create `lib/notes-format.test.ts`. Import `describe`, `expect` and `test` from `bun:test`, and `escapeHtml` and `formatNoteHtml` from the relative path `./notes-format` (relative, so the test does not depend on alias resolution). Write the `<behavior>` cases as individual `test(...)` calls inside a `describe('formatNoteHtml — XSS', ...)` block and a `describe('escapeHtml', ...)` block. Run `bun test lib/notes-format.test.ts` and confirm it fails because the module does not exist yet. Commit `test(261101-iil): add failing XSS tests for note formatter`.

GREEN, module: create `lib/notes-format.ts`. Use lib/ style: single quotes, no semicolons, comments in pt-BR. Implement:
- `escapeHtml(text: string): string`: replace `&` with `&amp;` first, then `<` with `&lt;`, `>` with `&gt;`, `"` with `&quot;`, and `'` with `&#39;`.
- `formatNoteHtml(text: string): string`, in three steps:
  1. Run `escapeHtml` on the raw text.
  2. Apply the existing light-markdown replacement chain from `renderFormattedText` in `components/character/notes-tab.tsx`. Move it character for character: same regexes, same flags, same order (bold, italic, inline code, `### `, `## `, `# `, `- ` list item, double newline to a paragraph boundary, single newline to a line break), and the same class attribute strings.
  3. Apply the same wrap rule: if the result does not start with `<`, wrap it in the same `mb-2` paragraph element. Return the string.

Do not change the regexes or the markup. Byte-identical output for normal notes is a project constraint, and the planning probe confirmed that escaping first preserves it.

Add a pt-BR JSDoc on `formatNoteHtml` stating the security invariant:
- The text is escaped before any markup is generated.
- Captured groups are only placed inside element content, never inside attributes.
- So the output can only contain the fixed tag set.

Note in a comment that, because a literal `<` typed by the user becomes `&lt;`, a note that starts with `<` is now wrapped in a paragraph like any plain-text note. This is intentional.

No React import, no DOM APIs, no dependencies.

GREEN, wiring: in `components/character/notes-tab.tsx`, add `import { formatNoteHtml } from "@/lib/notes-format";` next to the other `@/lib` imports. Use double quotes and a semicolon to match that file. Find `renderFormattedText` by name; line numbers will have shifted after 261101-iij and 261101-iik. Change its body so it only returns the same wrapper div with `className="formatted-content"` and `dangerouslySetInnerHTML={{ __html: formatNoteHtml(text) }}`. Delete the local `formatted` variable, the replacement chain and the wrap check from the component; they now live only in `lib/notes-format.ts`. Keep the function name, its `(text: string)` signature and its single call site `renderFormattedText(note.content)` unchanged, so 261101-iin can split the file without surprises.

Do not touch any of the following:
- notes parsing, legacy migration or serialization (owned by 261101-iij and 261101-iik)
- note title rendering (already React text)
- the textarea and edit flow
- the Prisma schema, the API or package.json

Run the verify command. Commit `fix(261101-iil): escape note HTML before markdown formatting (BUG-03)`.
  </action>
  <verify>
    <automated>bun test lib/notes-format.test.ts && test "$(grep -v '^\s*//' components/character/notes-tab.tsx | grep -cF '__html: formatNoteHtml(')" -eq 1 && test "$(grep -v '^\s*//' components/character/notes-tab.tsx | grep -cE '<(strong|em|code|h[123]|li) class=')" -eq 0 && npx tsc --noEmit</automated>
  </verify>
  <done>
- The XSS and escapeHtml tests fail before the module exists and pass after it is added.
- notes-tab.tsx injects only `formatNoteHtml(text)` output. Exactly 1 `__html: formatNoteHtml(` occurrence; the inline markup template count drops from the measured baseline of 7 to 0.
- `npx tsc --noEmit` exits 0.
- The two commits (RED test, GREEN fix) exist.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Lock rendering parity — exact-output and legacy-oracle tests for every supported construct, then the full gate</name>
  <files>lib/notes-format.test.ts</files>
  <behavior>
    Exact outputs (computed from the pre-fix chain at planning time):
    - '**forte**' → '<strong class="font-semibold text-foreground">forte</strong>'
    - '*leve*' → '<em class="italic text-muted-foreground">leve</em>'
    - '`d20`' → '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border">d20</code>'
    - '# Título' → '<h1 class="text-xl font-bold mt-4 mb-2 text-foreground">Título</h1>'
    - '## Seção' → '<h2 class="text-lg font-semibold mt-4 mb-2 text-foreground">Seção</h2>'
    - '### Sub' → '<h3 class="text-base font-semibold mt-3 mb-1 text-foreground">Sub</h3>'
    - '- espada' → '<li class="ml-4 list-disc list-inside">espada</li>'
    - 'linha 1\nlinha 2' → '<p class="mb-2">linha 1<br />linha 2</p>'
    - 'parágrafo 1\n\nparágrafo 2' → '<p class="mb-2">parágrafo 1</p><p class="mb-2">parágrafo 2</p>'
    - 'texto simples' → '<p class="mb-2">texto simples</p>'
    - '' → '<p class="mb-2"></p>'
    - 'Inventário:\n- corda\n- tocha' → '<p class="mb-2">Inventário:<br /><li class="ml-4 list-disc list-inside">corda</li><br /><li class="ml-4 list-disc list-inside">tocha</li></p>'
    Escaping edge cases:
    - '<3 meu personagem' → '<p class="mb-2">&lt;3 meu personagem</p>' (a leading literal '<' is now text, so it gets wrapped)
    - "&lt;b&gt; 'x'" → '<p class="mb-2">&amp;lt;b&amp;gt; &#39;x&#39;</p>' (typed entities are shown literally, not decoded)
    Legacy parity oracle:
    - For every string in a corpus of normal notes (the 12 inputs above plus '# Ficha\n- **espada** longa\n- *escudo* de `madeira`\n\nNotas da sessão 3' and at least 2 more realistic multi-line pt-BR session notes with no & < > " ' characters), formatNoteHtml(s) === legacyFormat(s)
  </behavior>
  <action>
Extend `lib/notes-format.test.ts` with a `describe('formatNoteHtml — paridade de formatação', ...)` block.

Exact-output tests: one `test(...)` per exact-output case and per escaping edge case in `<behavior>`. Use the expected strings exactly as listed; they were computed at planning time by running the pre-fix chain.

Legacy oracle:
- Add a module-private `legacyFormat(text: string): string` to the test file only. It is a frozen, verbatim copy of the pre-fix chain plus the wrap rule, taken from `git show 832fa9b:components/character/notes-tab.tsx` (the `renderFormattedText` body, returning the string instead of JSX).
- Add a pt-BR comment saying it is a frozen reference of pre-fix behavior, used only to prove parity, and must never be imported by app code.
- Add one `test(...)` that loops over the normal-note corpus and asserts `formatNoteHtml(s)` equals `legacyFormat(s)`. The corpus must contain no `&`, `<`, `>`, `"` or `'`, because those are the characters whose output intentionally changes.

Keep every case as an individual `test(...)` call rather than `test.each`, so the count gate below is meaningful.

These are characterization tests. They should pass against the Task 1 implementation. If any fails, fix `lib/notes-format.ts` so normal-note output matches the pre-fix chain. Never edit an expected string or the oracle to fit the new code; identical rendering is a locked project constraint.

Then run the full gate (`npx tsc --noEmit`, the whole `bun test` suite including sibling suites, and `bun run build`). Do not run `bun run lint` as a gate; it is not configured until 261101-iim.

Commit `test(261101-iil): lock note formatter rendering parity`.
  </action>
  <verify>
    <automated>test "$(grep -cE '^\s*test\(' lib/notes-format.test.ts)" -ge 12 && bun test lib/notes-format.test.ts && npx tsc --noEmit && bun test && bun run build</automated>
    <human-check>Run `bun run dev`, open any character, go to the Notas tab and add a note containing `<img src=x onerror=alert(1)>` and `<script>alert(1)</script>`. Both appear as literal text and no alert fires. Edit the note to `# Título`, `**negrito** *itálico* \`código\``, two `- item` lines and a blank-line paragraph. Formatting looks the same as before the fix.</human-check>
  </verify>
  <done>
- `lib/notes-format.test.ts` has at least 12 individual `test(` calls covering XSS, escape order, the allowlist property, every exact-output construct and the legacy oracle, and all pass.
- `npx tsc --noEmit`, `bun test` (whole suite) and `bun run build` all exit 0.
- No file outside files_modified changed.
  </done>
</task>

</tasks>

<threat_model>
ASVS level 1 (`workflow.security_asvs_level: 1`), block on `high`. Relevant control: ASVS V5.3.3 (context-aware output escaping against stored XSS).

## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| any API client → `notes` column | The API is open by design (no auth, accepted decision); `PUT /api/characters/:id` stores any string in `notes` |
| `notes` content → viewer's DOM | Note text is turned into HTML and injected via `dangerouslySetInnerHTML` in every viewer's browser |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-261101-iil-01 | Elevation of Privilege / Tampering | `renderFormattedText` → `dangerouslySetInnerHTML` (notes-tab.tsx) | high | mitigate | `formatNoteHtml` runs `escapeHtml` (& < > " ') over the whole note before the markdown chain; the component injects only `formatNoteHtml` output (Task 1; gate: exactly 1 `__html: formatNoteHtml(` and 0 inline markup templates) |
| T-261101-iil-02 | Elevation of Privilege | markdown capture groups (bold/italic/code/heading/list) | high | mitigate | Captures land only in element content, never in attributes; `"` and `'` are escaped, so `**"><img ...>**` cannot break out (Task 1 attribute-breakout tests) |
| T-261101-iil-03 | Spoofing / Information Disclosure | injected phishing markup (`<a href=javascript:>`, `<form>`, `<iframe>`, `<style>` overlays) | medium | mitigate | Allowlist property test: after stripping the fixed tag set (strong/em/code/h1-3/li/p/br), output contains no `<`; the formatter emits no links or attributes taken from user input |
| T-261101-iil-04 | Denial of Service | regex chain on very large notes | low | accept | Lazy single-line regexes, client-side only, affects only the viewer's own render; server-side note length limits belong to API validation (261101-iih scope), not this item |
| T-261101-iil-05 | Tampering | note titles and search | low | accept | Titles render as React text nodes (auto-escaped); no change needed |
| T-261101-iil-SC | Tampering | npm/pip/cargo installs | high | accept | No packages are installed by this plan (bun:test types come from 261101-iig, gated by Task 1 precondition); package-legitimacy gate not triggered |
</threat_model>

<verification>
- `bun test lib/notes-format.test.ts`: XSS, escape-order, allowlist-property, exact-output and legacy-oracle tests all pass.
- `grep -v '^\s*//' components/character/notes-tab.tsx | grep -cF '__html: formatNoteHtml('` returns 1 (baseline 0).
- `grep -v '^\s*//' components/character/notes-tab.tsx | grep -cE '<(strong|em|code|h[123]|li) class='` returns 0 (baseline 7).
- `npx tsc --noEmit`, `bun test` and `bun run build` all exit 0.
- `git diff --name-only 832fa9b..HEAD -- prisma/ app/api/ package.json bun.lock` shows no change from this item's commits.
</verification>

<success_criteria>
- Note content containing `<script>` or `<img onerror>` displays as literal text and cannot execute (BUG-03 closed).
- Bold, italic, code, headings, lists, paragraphs and line breaks render byte-identically to the pre-fix formatter for normal notes. This is proven by exact-output tests and a legacy oracle.
- The formatter lives in a pure, tested module (`lib/notes-format.ts`) that the notes tab consumes.
- The gate (`npx tsc --noEmit`, `bun test`, `bun run build`) is green.
</success_criteria>

<output>
Create `.planning/quick/261101-iil-fix-stored-xss-in-notes-bug-03-html-escape-note-content-befo/261101-iil-SUMMARY.md` when done
</output>
