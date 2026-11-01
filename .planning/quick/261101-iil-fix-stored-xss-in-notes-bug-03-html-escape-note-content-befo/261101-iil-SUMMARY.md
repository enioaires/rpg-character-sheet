---
phase: 261101-iil
plan: 01
subsystem: notes
tags: [security, xss, notes, BUG-03]
requires: [261101-iig, 261101-iij, 261101-iik]
provides: [lib/notes-format.ts]
affects: [components/character/notes-tab.tsx]
key-files:
  created: [lib/notes-format.ts, lib/notes-format.test.ts]
  modified: [components/character/notes-tab.tsx]
decisions:
  - "Escape (& < > \" ') the whole note before the markdown chain; chain moved verbatim into formatNoteHtml"
requirements: [BUG-03]
status: complete
commits: 3
plan_head_before: 4e43493fe4b3ca941928c10b0a8b6093db81da81
plan_head_after: 4051cc2608dc45e267a27baf5753e7c2c010188a
actuals:
  tasks: 2
  commits: 3
---

# Phase 261101-iil Plan 01: Stored XSS in notes (BUG-03) Summary

Note content is now HTML-escaped before the light-markdown chain runs, in a pure module `lib/notes-format.ts`, so `<script>` / `<img onerror>` render as literal text and the notes tab injects only `formatNoteHtml` output.

## Commits

- 51839e8: test(261101-iil): add failing XSS tests for note formatter (RED)
- 6f85d82: fix(261101-iil): escape note HTML before markdown formatting (BUG-03) (GREEN)
- 4051cc2: test(261101-iil): lock note formatter rendering parity

## What changed

- `lib/notes-format.ts`: `escapeHtml` (& first, then < > " ') and `formatNoteHtml` (escape, then the original regex chain unchanged, then the same leading-tag paragraph wrap). Pure, no imports.
- `components/character/notes-tab.tsx`: `renderFormattedText` keeps its name, signature and single call site, and now only returns the `formatted-content` div with `__html: formatNoteHtml(text)`. Inline chain removed. Added `@/lib/notes-format` import.
- `lib/notes-format.test.ts`: 24 tests: XSS payloads, attribute breakout, allowlist property, escapeHtml order, 12 exact-output constructs, 2 escaping edge cases, and a legacy-oracle parity test over a 15-string corpus (no & < > " ' characters) against a frozen copy of the pre-fix chain.

## Verification

- `bun test lib/notes-format.test.ts`: 24 pass (RED confirmed failing first on missing module)
- Gate greps: `__html: formatNoteHtml(` = 1 (baseline 0); inline `<tag class=` templates = 0 (baseline 7)
- `npx tsc --noEmit`: exit 0
- `bun test` (whole suite): 183 pass, 0 fail, 7 files
- `bun run build`: success
- Files changed by this item: only the three in files_modified (no prisma/, app/api/, package.json, bun.lock change)
- Manual browser check (human-check in plan) not run by the executor; recommended: add a note with `<img src=x onerror=alert(1)>` and confirm literal display.

## Deviations from Plan

None - plan executed exactly as written. Precondition (bun types in package.json) met.

## Intentional behavior change

A note starting with a literal `<` is now wrapped in a paragraph (the `<` becomes `&lt;`), like any plain-text note.

## Known Stubs

None.

## Threat Flags

None. Threats T-261101-iil-01/02/03 mitigated by escape-first formatting, tested.

## Self-Check: PASSED

Files lib/notes-format.ts, lib/notes-format.test.ts exist; commits 51839e8, 6f85d82, 4051cc2 are ancestors of HEAD.
