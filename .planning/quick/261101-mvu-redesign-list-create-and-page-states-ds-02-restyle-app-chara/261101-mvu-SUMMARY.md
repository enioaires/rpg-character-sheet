---
phase: quick-261101-mvu
plan: 01
subsystem: ui-screens
tags: [ferro-brasa, list, create, page-states, skeleton]
requires: [261101-mvt]
provides:
  - PageState and SkeletonBlock shared presentational primitives
  - character page loading, not-found and load-error screens
  - redesigned /characters, /create
affects: [261101-mvv]
key-files:
  created:
    - components/ui/page-state.tsx
    - components/character/sheet-states.tsx
    - components/character/sheet-states.render.test.ts
  modified:
    - app/characters/page.tsx
    - app/create/page.tsx
    - app/character/[id]/page.tsx
decisions:
  - "DEC-1..DEC-11 applied as written in the plan (listed below)"
metrics:
  tasks: 3
  files: 6
  commits: 4
status: complete
actuals:
  tasks: 3
  commits: 4
plan_head_before: 2bd50f4b8ab5f264428f487912c418145f907bfd
plan_head_after: 13eb61fa05d9fabb0184fa99ac9baa38f96457a3
completed: 2026-11-01
---

# Phase quick-261101-mvu Plan 01: List, create and page states (DS-02) Summary

The list, create and character-page state screens (loading, not found, load error) now follow the Ferro & Brasa design at 390px and md+. Search, pagination, create, delete, navigation, toasts and every hook behave as before. Nothing under `lib/` or `app/api/` changed.

## Commits

| Commit | Message |
| --- | --- |
| f44d6c3 | test(261101-mvu): sheet state screens, 404 classifier and PageState |
| 10573a2 | feat(261101-mvu): PageState, sheet loading/not-found/error screens |
| 1ecab1e | feat(261101-mvu): redesign character list with search, cards, delete dialog and pagination |
| 13eb61f | feat(261101-mvu): redesign create screen keeping all 11 fields |

## Final API (identical to the plan's interfaces block)

`components/ui/page-state.tsx` (server-safe, no client directive):
- `type PageStateVariant = 'empty' | 'error'`
- `PageState({ icon: LucideIcon, variant = 'empty', title, description?, headingLevel = 'h2', className?, children?, ...divProps })`. Root `flex flex-1 flex-col items-center justify-center gap-3 px-3 py-10 text-center`. Empty uses `text-[22px]` and a 280px description; error uses `text-destructive`, `text-2xl` and a 300px description. Children render in a 300px action column.
- `SkeletonBlock({ className?, pulse = true, ...divProps })`: aria-hidden `rounded-(--radius) bg-muted`, plus `animate-ficha-pulse` when pulse is true. Callers pass only size classes.

`components/character/sheet-states.tsx` ('use client'):
- `isCharacterNotFoundError(error: unknown): boolean` (exact match on the `'Character not found'` literal thrown by `fetchCharacter`; constant is local, with a pt-BR comment)
- `CharacterSheetSkeleton()`
- `CharacterNotFoundState({ onBack: () => void, onRetry?: () => void | Promise<unknown> })`
- `CharacterLoadErrorState({ onBack, onRetry })`
- A private `RetryButton` holds `isRetrying` and shows a spinner (`animate-ficha-spin`) while `onRetry` runs.

## Decisions (DEC-1..DEC-11)

1. DEC-1, create fields: main view is name + player as in the mock; the other nine fields (class, race, deity, homeland, alignment, gender, age, weight, height) sit in a collapsed native `<details>` "Mais detalhes (opcional)". Same ids, state keys, placeholders and handler calls; the submit payload is unchanged.
2. DEC-2, pagination: below md shows Anterior, "Página X de Y", Próxima; at md+ the numbered window (up to 5, same start formula, `maxVisible = 5`) stays between Anterior and Próxima. The render-time `window.innerWidth` read is gone (CSS `md:hidden` / `hidden md:flex` switch).
3. DEC-3, search placeholder: "Buscar por nome ou jogador" (the API does not search by class).
4. DEC-4, card details: the muted line is "<player> · atualizada há ..." (or just "atualizada há ..."); class and race chips render only when non-empty; "Sem nome" fallback kept.
5. DEC-5, persistent header: title, count, ThemeToggle and search always render; loading, error, empty and list render below. The search input no longer unmounts per keystroke.
6. DEC-6, delete dialog: same AlertDialog, same `handleDeleteCharacter` call and `disabled={deleteCharacterMutation.isPending}`, same toasts; only look and copy changed ("Excluir <nome>?" and the design description).
7. DEC-7, not-found retry: the 404 branch passes `onRetry={handleRefresh}`; the `!character` branch has no retry.
8. DEC-8, error texts: fixed pt-BR copy instead of the raw `error.message`; list error keeps the title "Erro ao carregar personagens".
9. DEC-9, empty state: no extra create button (create is always visible: bottom bar below md, header button at md+). The "Mostrando X a Y de Z" line was replaced by the header count and the pagination label.
10. DEC-10, retry feedback: `RetryButton` is disabled with a spinner while the promise runs; `handleRefresh` is untouched.
11. DEC-11, load-error copy: "Não foi possível carregar a ficha" / "Verifique a conexão ou tente de novo em instantes." with the CloudOff icon. The list error uses the same description and icon.

No new mock-vs-app cases came up beyond these.

## Verification results

- `npx tsc --noEmit`: clean.
- `bun run lint`: `0 errors, 1 warning` (the existing `routes` warning in `app/api/[[...route]]/route.ts`).
- `bun test`, final run: `214 pass, 0 fail, 518 expect() calls, Ran 214 tests across 9 files` (baseline 204 from mvt plus 10 new in `sheet-states.render.test.ts`).
- `bun run build`: passes (run after `rm -rf .next`); built CSS contains `animate-ficha-pulse`, `columns-[340px]` and `group-open:rotate-180`.
- Byte-identical gates against base 2bd50f4 pass: character page hook/handler block (40 lines) and the Sanitizar-to-end block; list page hook block and handler block (22 lines); create page state/handler block (41 lines).
- `git diff --name-only 2bd50f4 -- lib app/api` is empty.
- Not done: the end-of-phase human walkthrough (`bun dev` in a browser at 390px and 1280px, dark and light). It still needs to be done at the end of the batch.

## Deviations from Plan

None. The plan was executed as written.

## Lock-mode note

The coordinator rule (edit-only controls hidden when the sheet is locked) does not apply here: these screens have no lock mode.

## Threat Flags

None. No new endpoints, auth paths or schema changes. All user and API strings render as React text children (the render test proves a `<script>` description is escaped).

## Known Stubs

None.

## Stale lines in .claude/CLAUDE.md (not edited)

- "Some pages use 4 spaces (`app/characters/page.tsx`...)" and the list in Function Design: `app/characters/page.tsx` is now about 330 lines with the new design, so the "324" figure is stale.
- The Architecture section says "Cards ... `Card` ..." for the list page; the list now uses plain `li` cards, not the shadcn `Card`.
- "Mostrando X a Y de Z" and the list's `window.innerWidth` read no longer exist.
- The "Entry Points" description of `/characters` ("Search, pagination, delete, link to create and sheet") is still true; the character page error states are now `components/character/sheet-states.tsx`, which is not mentioned.
- Carried over from mvt: the `next-themes` and Geist font lines.

## Self-Check: PASSED

- Files exist: components/ui/page-state.tsx, components/character/sheet-states.tsx, components/character/sheet-states.render.test.ts.
- Commits exist on the branch: f44d6c3, 10573a2, 1ecab1e, 13eb61f.
