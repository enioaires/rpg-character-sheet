---
phase: quick-261101-mvt
plan: 01
subsystem: ui-design-system
tags: [design-tokens, next-font, next-themes, inline-edit, sonner, shadcn]
requires: []
provides:
  - Ferro & Brasa tokens (light and dark) under shadcn names, plus game extras
  - next/font Barlow, Spectral, Barlow Semi Condensed, JetBrains Mono as CSS variables on html
  - ThemeProvider (default dark) and ThemeToggle in the /characters header
  - inline-field design states for EditableField and EditableScalingField
  - SectionCard, SectionTitle, DiamondMarker, NumericDisplay, StatTile, BottomSheet
  - design-styled Toaster configured in app/layout.tsx
affects: [261101-mvu, 261101-mvv, 261101-mvw, 261101-mvx, 261101-mvy, 261101-mvz]
tech-stack:
  added: []
  patterns:
    - tokens in :root and .dark, mapped through @theme inline
    - unlayered overlay rule instead of editing generated shadcn files
key-files:
  created:
    - providers/theme-provider.tsx
    - components/ui/theme-toggle.tsx
    - components/ui/inline-field-state.tsx
    - components/ui/section-card.tsx
    - components/ui/numeric-display.tsx
    - components/ui/stat-tile.tsx
    - components/ui/bottom-sheet.tsx
    - components/ui/design-primitives.render.test.ts
  modified:
    - app/globals.css
    - app/layout.tsx
    - app/characters/page.tsx
    - components/ui/editable-field.tsx
    - components/ui/editable-scaling-field.tsx
    - lib/api/queries.ts
decisions:
  - "DD-01..DD-08 applied as written in the plan"
metrics:
  tasks: 3
  files: 14
  commits: 5
status: complete
actuals:
  tasks: 3
  commits: 5
plan_head_before: e2740820e63cb3a88e91ba8987455d22be22905f
plan_head_after: 2bd50f4b8ab5f264428f487912c418145f907bfd
completed: 2026-11-01
---

# Phase quick-261101-mvt Plan 01: Ferro & Brasa foundation (DS-01) Summary

The Ferro & Brasa foundation is in place: design tokens, self-hosted fonts, a dark-default theme with a toggle, six-state inline fields, four shared presentational primitives and design toasts. No calculation, schema, concurrency, Prisma or package file was touched.

## Commits

| Commit | Message |
| --- | --- |
| 914537d | feat(261101-mvt): Ferro & Brasa tokens, self-hosted fonts, theme provider and toggle |
| 3053810 | test(261101-mvt): inline-field state resolver, frame classes, icon and retry |
| ec0b3ba | feat(261101-mvt): inline-field state helpers |
| 2baafc4 | refactor(261101-mvt): design states for EditableField and EditableScalingField |
| 2bd50f4 | feat(261101-mvt): SectionCard, NumericDisplay, StatTile, BottomSheet and design toasts |

## Final API (matches the plan's interfaces block, with the small additions noted)

- Tailwind utilities from globals.css: `bg-/text-/border-vitality-{notavel,ferido,grave,condenado,incapacitado,coma}`, `bg-vitality-track`, `berkana`, `berkana-foreground`, `berkana-track`, `success`, `warning`, `bg-overlay`; fonts `font-sans` (Barlow), `font-serif` (Spectral), `font-numeric` (Barlow Semi Condensed, always with `tabular-nums`), `font-mono` (JetBrains Mono); `shadow-card`, `shadow-lg` (`shadow-sm` is `shadow-card`; `shadow-md/xl/2xl` are `shadow-lg`; `shadow-xs/2xs` are flat); `rounded-md/lg/xl` all equal 4px, `rounded-sm` 2px; `animate-ficha-pulse`, `animate-ficha-spin`. The persisted key `gravementeFerido` uses the `grave` token.
- `providers/theme-provider.tsx`: `ThemeProvider(props)`, mounted once in layout with `attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange`.
- `components/ui/theme-toggle.tsx`: `ThemeToggle({ className? })`, 44px ghost icon, `aria-label="Alternar tema claro/escuro"`. 261101-mvu must keep `<ThemeToggle />` in the list header.
- `components/ui/inline-field-state.tsx`: `SaveStatus`, `InlineFieldState`, `SAVED_FEEDBACK_MS = 1500`, `INLINE_FIELD_LABEL_CLASS`, `resolveInlineFieldState({ isEditing, canEdit, isSaving, saveStatus })`, `inlineFieldFrameClassName(state)`, `InlineFieldStatusIcon({ state, className? })`, `InlineFieldRetry({ onRetry, keepFocus? })`.
- `components/ui/section-card.tsx`: `SectionMarkerTone`, `DiamondMarker({ tone?, className? })`, `SectionTitle({ children, tone?, headingLevel?, className? })`, `SectionCard({ title, tone?, action?, headingLevel?, className, children, ...sectionProps })` (`title` is `ReactNode`; `data-section` and `id` pass through).
- `components/ui/numeric-display.tsx`: `NumericSize`, `NumericDisplay({ value, max?, size = 'md', className?, maxClassName?, ...spanProps })`. `value` and `max` are `ReactNode`; no math is done inside.
- `components/ui/stat-tile.tsx`: `StatTile({ label, value, variant = 'tile', align = 'start', className?, valueClassName?, ...divProps })`.
- `components/ui/bottom-sheet.tsx`: `BottomSheet({ open, onOpenChange, title, description?, className?, children })`. The delivered file differs from the plan only in this detail: when there is no description it sets `aria-describedby` to undefined; with a description the Radix default link is kept.
- Toaster: configured in `app/layout.tsx` (no wrapper file). Callers keep using plain `toast.*`.

## Verification results

- `npx tsc --noEmit`: clean.
- `bun run lint`: `0 errors, 1 warning` (the pre-existing `routes` warning in `app/api/[[...route]]/route.ts`).
- `bun test`, final run: `204 pass, 0 fail, 485 expect() calls, Ran 204 tests across 8 files` (baseline 183 plus 21 new in `components/ui/design-primitives.render.test.ts`; note that the new test file adds 1 file to the earlier 7).
- `bun run build`: passes with the Toaster configured as props in the server layout, so the serializable-props fallback was NOT needed.
- Built CSS check (after clearing `.next`): contains `--vitality-notavel`, `ficha-spin`, `--font-barlow-semi-condensed:`, a `body` rule with `font-family:var(--font-sans)`, `.font-numeric` reading `var(--font-numeric)` and `.shadow-card` reading `var(--shadow-card)`.
- Save-logic invariant loop: `buildUpdateData`, `EditableFieldProps`, `normalizeScalingData`, `calculateScaledValue`, `buildScalingUpdateData`, `EditableScalingFieldProps` and `ScalingData` are byte-identical to base commit e274082. One `mutateAsync` per file, `onBlur={handleBlur}` and `onClick={handleCancel}` still wired, and the cancel button has an inline `onMouseDown` that calls `preventDefault()`.
- Diff gate against the base commit for `lib/calculations`, `lib/schemas`, `lib/api/character-concurrency.ts`, `prisma`, `package.json`, `bun.lock` and the generated shadcn files (`sonner`, `sheet`, `button`, `input`, `textarea`) is empty.
- Not done: the human walkthrough in Task 3 (`bun dev` in a browser) and a runtime smoke test with `bun run start` (the auto-mode classifier denied starting a server). It should still be done at the end of the batch.

## Palette-color count (Task 1, Step 6)

4 lines of hard-coded Tailwind palette colors outside `components/ui`, left for their screen items: `components/character/spells-talents/talents-card.tsx:133` and `components/character/quick-actions-bar.tsx:162-164`.

## Fallbacks

- Saved-timer fallback (Task 2): not needed, the effect keyed on `saveStatus` lints clean.
- Toaster fallback (Task 3): not needed, the build accepts the props in the server layout.

## Deviations from Plan

None that changed behavior. Execution notes:

1. Tailwind scans `.planning/` and picked up class strings from the plan files, so a first build after the CSS rewrite looked as if the new tokens were missing. The cause was a stale Turbopack cache, not the code. Deleting `.next` and rebuilding fixed it. Gates that grep `.next/static` should be run after a clean build. The `ficha-spin` grep alone is not proof, because the plan files add an `animate-[ficha-spin_...]` class to the CSS.
2. In `EditableField` edit mode, the single-line input got `h-11` (and multiline `py-2`) because the shadcn Input ships with `h-9`, which tailwind-merge would not override via `min-h-11`. This meets the 44px target.

## Design decisions beyond DD-01..DD-08

- Error state in `EditableField` after a failed save stays in edit mode (as before). Typing again does not clear the error frame until the next save or cancel. The mock does not specify this and the `handleChange` body was left byte-identical.
- `EditableScalingField` readonly state also shows the muted `(formula)` as before; `font-numeric` is applied to the total.
- Readonly empty text uses an em dash; `formatDisplay`, when given, still wins (DD-05). In the idle (editable) state the existing placeholder ("Clique para editar...") is kept, since it is clickable there.

## Threat Flags

None. No new endpoints, auth paths or schema changes. The only network-related change is that fonts are now fetched by next/font at build time and self-hosted.

## Known Stubs

None.

## Stale lines in .claude/CLAUDE.md (not edited)

- "Dark mode and theme switching use `next-themes` (`components/ui/sonner.tsx` is the only file that imports it)": now `providers/theme-provider.tsx` and `components/ui/theme-toggle.tsx` import it too.
- Fonts: CLAUDE.md and `.planning/codebase/*` say Geist and Geist Mono via `next/font/google` in `app/layout.tsx` (CSS variables `--font-geist-sans`, `--font-geist-mono`). They are now Barlow, Spectral, Barlow Semi Condensed and JetBrains Mono (`--font-barlow`, `--font-spectral`, `--font-barlow-semi-condensed`, `--font-jetbrains-mono`).
- "Tailwind spacing/radius/shadow" is not mentioned, but `Styling` says "Global theme variables live in app/globals.css (... base color neutral)": the palette is now the Ferro & Brasa palette, with a 4px radius.
- `app/layout.tsx` is described as rendering `QueryProvider` and `Toaster` only; it now wraps them in `ThemeProvider` and configures the Toaster props.
- "`useUpdateCharacter` ... a single `toast.error` with id `character-conflict-<id>`": the conflict toast is now `toast.warning` (same id and message).
- "Five non-UI files use 'use client'": `providers/theme-provider.tsx` is now a sixth.

## Self-Check: PASSED

- Files exist: providers/theme-provider.tsx, components/ui/{theme-toggle,inline-field-state,section-card,numeric-display,stat-tile,bottom-sheet}.tsx, components/ui/design-primitives.render.test.ts.
- Commits exist on the branch: 914537d, 3053810, ec0b3ba, 2baafc4, 2bd50f4.
