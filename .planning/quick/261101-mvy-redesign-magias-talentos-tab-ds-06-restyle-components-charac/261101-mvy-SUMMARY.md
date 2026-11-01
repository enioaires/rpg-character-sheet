---
phase: quick-261101-mvy
plan: 01
subsystem: ui-magias-talentos-tab
tags: [ferro-brasa, magias, talentos, filtros, grouped-cards, helpers, render-tests]
requires: [261101-mvt, 261101-mvv]
provides:
  - lib/spells-talents.ts, framework-free filter/group/label helpers with bun tests
  - Magias/Talentos tab as a segmented toggle, search, level chips and level-grouped cards, returned as a fragment in the sheet column flow
affects: [261101-mvz]
key-files:
  created:
    - lib/spells-talents.ts
    - lib/spells-talents.test.ts
    - components/character/spells-talents/magic-list.tsx
    - components/character/spells-talents/spell-body.tsx
    - components/character/spells-talents/talent-body.tsx
    - components/character/spells-talents.render.test.ts
  modified:
    - components/character/spells-talents-tab.tsx
    - components/character/spells-talents/spells-card.tsx
    - components/character/spells-talents/talents-card.tsx
decisions:
  - "Fragment composition instead of a column-span wrapper (see Layout choice)"
  - "Once-per-day handler takes boolean (checked === true), see Deviations"
metrics:
  tasks: 3
  files: 9
  commits: 5
status: complete
actuals:
  tasks: 3
  commits: 5
plan_head_before: b94f7e73d831e94688a4393a429bf789727479a5
plan_head_after: a7e1c2348036ca40d06e9130d5c23ff120f37bbe
completed: 2026-11-01
---

# Phase quick-261101-mvy Plan 01: Magias & Talentos tab (DS-06) Summary

The Magias & Talentos tab now follows the Ferro & Brasa "magias" screen: a Magias/Talentos segmented toggle (`aria-pressed`, counts from the stored array lengths), a search field with accent-insensitive matching, "Todos / Nv N" chips, a count line, cards grouped by level ("Nível N" with diamond marker), and collapsible rows (name, sub line, Berkana cost or "1× ao dia" badge). Expanded spells show a Dano highlight computed with the same `normalizeScalingData` + `calculateScaledValue` EditableScalingField uses, a six-cell stats grid and the description as plain pre-line text; Editar swaps in the unchanged inline fields. All write payloads, field paths and the level-scaling editors are unchanged.

## Commits

| Commit | Message |
| --- | --- |
| c854ab9 | test(261101-mvy): helpers de filtro e agrupamento da aba Magias e Talentos |
| ee249a3 | feat(261101-mvy): helpers puros de filtro, agrupamento e rótulos de magias e talentos |
| 19965a5 | feat(261101-mvy): alternância Magias/Talentos, busca, chips de nível e magias agrupadas por nível |
| d821550 | feat(261101-mvy): leitura da magia com dano escalonado e Editar/Concluir sobre os campos inline |
| a7e1c23 | feat(261101-mvy): lista de talentos nas peças compartilhadas e teste de render da aba |

## Layout choice (column flow, [column-span:all])

261101-mvv's `TAB_CONTENT_CLASS` in `components/forms/character-layout.tsx` is `mt-0 mx-auto w-full max-w-[1200px] p-3 [column-width:340px] [column-gap:12px]`, so the tab IS inside a multi-column container and `column-span:all` is load-bearing.

The plan proposed one root div with `column-span:all` wrapping a nested `columns-[340px]` container. Following the coordinator's pattern (mvw/mvx) and the mock's own markup, I did the more direct version instead: the tab and both cards return **fragments**. The segmented toggle, the search/chips/count toolbar and the empty states carry `[column-span:all]`; each level group is a direct child of the sheet's column flow (same look, one columns container instead of two, and groups balance with the rest of the sheet's column rules). No behavior depends on the choice. `max-w-[720px]` is kept on the toggle and toolbar as in the mock.

## Mock vs current decisions (owner rule)

| # | Mock shows | Current app | Decision / outcome |
|---|-----------|-------------|--------------------|
| 1 | One row open at a time | Many rows open at once (Set of indices) | Kept multi-expand. |
| 2 | "1× ao dia" detected by regex on description, spells included | Real persisted `oncePerDay` on talents only | Badge comes from `talent.oncePerDay` only; spells show no once badge. |
| 3 | No "usado hoje", "Novo dia" or once-per-day toggle | All three exist and write | All three kept with identical writes and availability: "usado hoje" is a 44px leading checkbox (only on once-per-day talents, enabled while locked), "Novo dia" shows when a once-per-day talent is used (locked or not), the once-per-day toggle lives in the edit view. |
| 4 | Damage/duration as fixed strings | Level-scaled; EditableScalingField | Display uses `getSpellScaledValues` over the existing `normalizeScalingData` + `calculateScaledValue`; scaling editing kept in the edit view. |
| 5 | Preparo "Inst.", Concentração "50%" hard-coded | `prepTime` / `concentration` fields | Real fields shown ("—" when empty). |
| 6 | Read view + Editar | Fields always inline-editable when expanded and unlocked | Editar switches the row to the same inline fields; Concluir returns. No new edit mechanism. |
| 7 | (item text) "keep the existing create/edit/delete dialogs" | No such dialogs exist | Kept current flows: add appends a blank entry, edit is inline, delete is immediate with the same payload. No confirm dialog added. |
| 8 | Edit-only controls absent when locked | Rendered but disabled | Hidden when locked: Nova magia / Novo talento, Excluir, Editar/Concluir, and the once-per-day toggle (edit view only). Unchanged and visible while locked: "usado hoje" and "Novo dia". "Excluir" is disabled while a save is pending, as before. |
| 9 | Grouped by level | Flat list, stored order | Grouped for display only; stored order kept inside each group; every path/delete/toggle uses the entry's original index. |
| 10 | Search / chips / toggle | Not present | Added as local-state UI conveniences over existing fields (never written). |
| 11 | Chips 38px | n/a | 44px (touch-target rule). |
| 12 | Sub line "Dano X · alcance" | "Nível N • Custo: C" | `type · Dano <scaled total> · range`; damage omitted when blank or "0". |
| 13 | One list at a time | Side by side on xl | Segmented toggle (one list at a time). |
| 14 | No fixed-height scroll box | 70vh / 24rem scroll box | Removed; the page scrolls in the column flow. |
| 15 | n/a | Selected level filter may vanish after an edit or delete | Falls back to "Todos" (`resolveLevelFilter`). |
| 16 | n/a | New entry appears collapsed at the end | After a successful add: filters cleared and the new row opens in edit view (payload unchanged). |

New cases met during execution: none beyond the above (the fragment layout is recorded under Layout choice; the boolean handler under Deviations).

## Deviations from Plan

**1. [Layout] Fragments instead of a wrapper with a nested columns container.** See Layout choice. Gate-visible effect: none (`aria-pressed` is in the tab, all checks pass).

**2. [Rule 3 - Blocking type error] Once-per-day handler parameter.** Typing the lists as `Talent[]` (the original read `any`) made `checked: boolean | 'indeterminate'` and `usedToday: boolean | undefined` fail `tsc` against the request's JSON type. Fix: `TalentEditFields` forwards `checked === true` to the card (the checkbox is controlled and never produces `'indeterminate'`), and the mapped array is cast `as typeof talents` for the request. The map body is the original expression verbatim (`oncePerDay: checked, usedToday: checked ? t.usedToday : false`) so the payload is identical.

**3. Test file order.** The RED commit predates the helper module (expected); the render test header documents why it does not mock `@/lib/api/queries`. `afterEach` asserts `fetch` was never called.

Otherwise: plan executed as written.

## Verification results

- `npx tsc --noEmit`: clean.
- `bun run lint`: `0 errors, 1 warning`, identical to the baseline recorded at the start (the pre-existing `routes` warning in `app/api/[[...route]]/route.ts`).
- `bun test`: **368 pass, 0 fail**, 15216 expect() calls, 16 files (332 after mvx; +31 in `lib/spells-talents.test.ts`, +5 in `spells-talents.render.test.ts`).
- `bun run build` (after `rm -rf .next`): passes.
- Scoped diff gate vs base `b94f7e7`: `lib/calculations`, `lib/schemas`, `lib/api`, `lib/store`, `components/ui`, `components/forms`, `quick-actions-bar.tsx`, `types.ts`, `index.ts`, `prisma`, `package.json`, `bun.lock` all unchanged. No `dangerouslySetInnerHTML`; no hard-coded palette colors in the tab files.
- Payload gates: spell default object (`damage`/`duration` literals), talent default object, `usedToday: !currentValue`, and the once-per-day expression are present verbatim. `mutateAsync` call sites: spells-card 2, talents-card 5, body files 0. All 11 spell field paths and 3 talent field paths plus `talent-${index}-oncePerDay` verified.
- Not done: the human walkthrough from Task 3's `<human-check>` (`bun dev`, dark mode at 390px and desktop width, real saves). It should be done at the end of the batch.

### Line counts (limit 300)

| File | Lines |
| --- | --- |
| lib/spells-talents.ts | 153 |
| components/character/spells-talents/magic-list.tsx | 263 |
| components/character/spells-talents/spell-body.tsx | 255 |
| components/character/spells-talents/spells-card.tsx | 204 |
| components/character/spells-talents/talent-body.tsx | 98 |
| components/character/spells-talents/talents-card.tsx | 281 |
| components/character/spells-talents-tab.tsx | 64 |

## Suggested follow-up

Add a confirm step for "Excluir" (decision 7 / T-mvy-06). Delete is still immediate, as before; it now sits behind an expanded row and Editar-free "view" actions, is 44px, and is disabled while saving, but an accidental tap still deletes the entry.

## Threat Flags

None. No new endpoints, auth paths or schema changes. Descriptions render as React text only (`whitespace-pre-line`), all writes go through the shared `useUpdateCharacter` instance, no packages were installed.

## Known Stubs

None.

## Stale lines in .claude/CLAUDE.md (not edited)

- Testing list: new files `lib/spells-talents.test.ts` and `components/character/spells-talents.render.test.ts`.
- "Large files" list and the `spells-card.tsx (296)` line: it is now 204 lines, split into `magic-list.tsx`, `spell-body.tsx` and `talent-body.tsx`.
- Architecture "Duplicated persistence hook instances per tab" / cards layer: the tab still has one `useUpdateCharacter()` shared by `SpellsCard` and `TalentsCard`; `EditableField` keeps its own instance for typed fields.

## Self-Check: PASSED

- Files exist: `lib/spells-talents.ts`, `lib/spells-talents.test.ts`, `magic-list.tsx`, `spell-body.tsx`, `talent-body.tsx`, `spells-talents.render.test.ts`, and the three modified files (verified via the line-count and test runs above).
- Commits on the branch: c854ab9, ee249a3, 19965a5, d821550, a7e1c23 (`git rev-list --count b94f7e7..HEAD` = 5).
