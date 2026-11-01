---
phase: 261101-iil
verified: 2026-11-01T00:00:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# 261101-iil: Stored XSS in notes (BUG-03) Verification Report

**Goal:** HTML-escape note content before the light-markdown formatting so `<script>` and `<img onerror>` render as literal text while bold/italic/code/headings/lists/line breaks keep working; add a unit test for the formatter.
**Status:** passed (human-check deferred to end-of-batch walkthrough)

## Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `<script>` / `<img onerror>` note content shown as literal text, executes nothing | VERIFIED | `lib/notes-format.ts` runs `escapeHtml` (& first, then < > " ') before the chain. Attacker script: 200,550 cases, 0 non-allowlisted tags, 0 raw `<>"'` outside allowed tags. |
| 2 | Normal notes (no & < > " ') render byte-identical to the pre-fix chain | VERIFIED | The diff shows the chain moved verbatim (same regexes, flags, order, class strings). The test file has a frozen `legacyFormat` oracle (line 73) and a parity test (line 210). 24 tests pass. |
| 3 | Only `formatNoteHtml` output reaches `dangerouslySetInnerHTML`; output tags limited to strong/em/code/h1/h2/h3/li/p/br | VERIFIED | Repo-wide grep (excluding node_modules/.next/.git) finds one `dangerouslySetInnerHTML` use: `components/character/notes-tab.tsx:279` with `__html: formatNoteHtml(text)`. `lib/notes-format.ts:18` is a comment only. No `innerHTML`/`outerHTML`/`insertAdjacentHTML` anywhere. `components/ui/chart.tsx` no longer uses it. |
| 4 | `bun test`, `npx tsc --noEmit`, `bun run build` pass | VERIFIED | Run by me: 183 pass / 0 fail (7 files); tsc exit 0; build exit 0. |
| 5 | No auth, Prisma schema or API change | VERIFIED | `git diff --name-only 4e43493..4051cc2` lists only `components/character/notes-tab.tsx`, `lib/notes-format.test.ts` and `lib/notes-format.ts`. |

**Score:** 5/5

## Gate greps (run by me)

- `grep -v '^\s*//' notes-tab.tsx | grep -cF '__html: formatNoteHtml('` = 1 (expected 1)
- `grep -v '^\s*//' notes-tab.tsx | grep -cE '<(strong|em|code|h[123]|li) class='` = 0 (expected 0)
- Test count in `lib/notes-format.test.ts`: 24 (expected >= 12)
- The single call site `renderFormattedText(note.content)` is unchanged (notes-tab.tsx:601). `note.content` is typed `z.string()`.

## Adversarial testing of `formatNoteHtml`

I ran a throwaway script outside the repo (`/tmp/claude-1000/-home-zephyr-repos-personal-rpg-character-sheet/602cedf7-8d72-4b0f-96a4-40bf7328c588/scratchpad/attack.ts`) with these inputs:

- **Payloads:** script, img/svg onerror/onload, iframe with `javascript:`, `<a href=javascript:>`, markdown `[x](javascript:...)`, style/form/base/meta/noscript/math mXSS payloads, comment/CDATA openers, NUL bytes, `&lt;`, `&#60;` and `&#x3C;` entities, fullwidth `＜＞`, and single-angle quotes.
- **Wrappers:** bold, italic, code, h1/h2/h3, list items, triple-star nesting, interleaved or unbalanced markers, CRLF and multi-paragraph text, and 2000x or 500x repeats.
- **Fuzz:** 200,000 random token sequences.

Checks on every output:

- Every `<...>` tag matches the strict allowlist (strong/em/code/h1/h2/h3/li/p/br with an optional fixed `class`).
- No raw `< > " '` remains once allowed tags are stripped.

Results: 200,550 cases, 0 bypasses.

- **Attribute breakout:** `**"><img src=x onerror=alert(1)>**` becomes `<strong class="...">&quot;&gt;&lt;img src=x onerror=alert(1)&gt;</strong>`.
- **Entities:** typed entities are double-escaped (`&amp;lt;`), so they are not decoded into markup.
- **Fullwidth `＜＞`:** passes through as inert text. HTML parsers do not treat it as a tag delimiter.
- **Performance:** pathological inputs (200k `*`, 50k `**a`, 100k backticks plus 50k newlines) finished in 31 ms total, with no regex blowup.

Reasoning: all user text is escaped before markup generation. The generated class strings contain no markdown trigger characters (`*`, `` ` ``, or line-start `# ` / `- `), so a later regex pass cannot inject into them. Captured groups land only in element content.

## Anti-patterns

None. No debt markers or stubs in the three changed files.

## Deferred human verification

(`<human-check>` from PLAN Task 2, deferred to the end-of-batch manual walkthrough)

1. **Test:** Run `bun run dev`, open a character, go to the Notas tab, add a note containing `<img src=x onerror=alert(1)>` and `<script>alert(1)</script>`.
   **Expected:** Both appear as literal text and no alert fires.
2. **Test:** Edit the note to `# Título`, `**negrito** *itálico* \`código\``, two `- item` lines and a blank-line paragraph.
   **Expected:** Formatting looks the same as before the fix.
   **Why human:** Visual rendering in a real browser.

## Gaps Summary

No gaps.

_Verifier: Claude (gsd-verifier)_
