---
phase: quick-261101-mvt
plan: 01
type: execute
wave: 1                     # ADVISORY ONLY: authoritative wave is recomputed by `quick-batch update` from depends_on
depends_on: []              # foundation item: every other item of batch 261101-mvs builds on it
# Scope note: 14 files (revision 1 cut it from 16: the two test files are merged into
# design-primitives.render.test.ts, and the toaster config moved into app/layout.tsx instead of a wrapper
# file). Six are small new files, two are one-to-three-line edits (app/characters/page.tsx,
# lib/api/queries.ts). The real work is in globals.css, layout.tsx and the two editable primitives.
files_modified:
  - app/globals.css
  - app/layout.tsx
  - providers/theme-provider.tsx
  - components/ui/theme-toggle.tsx
  - app/characters/page.tsx
  - components/ui/inline-field-state.tsx
  - components/ui/design-primitives.render.test.ts
  - components/ui/editable-field.tsx
  - components/ui/editable-scaling-field.tsx
  - components/ui/section-card.tsx
  - components/ui/numeric-display.tsx
  - components/ui/stat-tile.tsx
  - components/ui/bottom-sheet.tsx
  - lib/api/queries.ts
autonomous: true
requirements: [DS-01]

must_haves:
  truths:
    - "On a first visit with no stored preference the app renders in the Ferro & Brasa dark palette (html carries class dark); after toggling it renders the light parchment palette, and the choice survives a reload"
    - "A theme toggle button (aria-label 'Alternar tema claro/escuro', 44px) is visible in the /characters list header"
    - "Body text renders in Barlow, font-serif in Spectral, font-numeric in Barlow Semi Condensed and font-mono in JetBrains Mono, all self-hosted by next/font (no runtime request to a Google Fonts or CDN stylesheet)"
    - "Existing shadcn components (Button, Input, Card, Dialog, AlertDialog, Sheet, Select, Tabs) keep rendering with the new palette because globals.css keeps every shadcn variable name, and the Tailwind spacing scale stays at its 0.25rem default"
    - "Every EditableField / EditableNumberField / EditableTextArea / EditableScalingField shows the six design states: read-only plain text, idle dashed 44px box, editing ring, saving spinner, saved check (about 1.5 s), and error border with a cloud-off icon plus the 'Não salvou · tentar de novo' action"
    - "While editing, EditableField shows a 44px cancel button (X, aria-label 'Cancelar edição') that calls the existing handleCancel without blurring the input first, so tapping it on a phone discards the edit and sends no save; EditableScalingField keeps its 44px save and cancel buttons"
    - "Inline-field save logic and props are unchanged: buildUpdateData, buildScalingUpdateData, normalizeScalingData, calculateScaledValue, ScalingData, EditableFieldProps and EditableScalingFieldProps are byte-identical to the item's base commit, each file still has exactly one mutateAsync call, and Enter/Escape/blur still trigger the same handlers"
    - "SectionCard (7px diamond title marker), NumericDisplay (font-numeric + tabular-nums), StatTile and BottomSheet (shadcn Sheet side=bottom) exist in components/ui/ with the props documented in this plan's interfaces block, ready for items 261101-mvu..mvz"
    - "Toasts appear top-center with the design look (popover surface, 4px radius, shadow-lg, 20px icon, 15px title, muted 14px description); success shows a check in --success, errors a destructive border with cloud-off, and the save-conflict toast a warning border with a spinning refresh icon"
    - "No derived number changes: nothing under lib/calculations, lib/schemas or lib/api/character-concurrency.ts is edited"
    - "npx tsc --noEmit, bun run lint (0 errors, still exactly 1 warning), bun test and bun run build all pass"
  artifacts:
    - path: "app/globals.css"
      provides: "Ferro & Brasa tokens (light :root, dark .dark) under shadcn names, @theme inline mappings for game extras/fonts/shadows/radius/animations, ficha-pulse/ficha-spin keyframes, overlay token on sheet/dialog overlays"
      contains: "--vitality-notavel"
    - path: "app/layout.tsx"
      provides: "next/font loading of Barlow, Spectral, Barlow Semi Condensed, JetBrains Mono as CSS variables on <html>; ThemeProvider (class, default dark); the shadcn Toaster configured with the design toast look"
      contains: "Barlow_Semi_Condensed"
    - path: "providers/theme-provider.tsx"
      provides: "Client wrapper around next-themes ThemeProvider"
      exports: ["ThemeProvider"]
    - path: "components/ui/theme-toggle.tsx"
      provides: "44px ghost icon button that flips dark/light"
      exports: ["ThemeToggle"]
    - path: "components/ui/inline-field-state.tsx"
      provides: "Pure inline-field state resolver, per-state frame classes, status icon and retry action shared by the editable primitives and by later custom inline controls"
      exports: ["resolveInlineFieldState", "inlineFieldFrameClassName", "InlineFieldStatusIcon", "InlineFieldRetry", "SAVED_FEEDBACK_MS", "INLINE_FIELD_LABEL_CLASS", "InlineFieldState", "SaveStatus"]
    - path: "components/ui/design-primitives.render.test.ts"
      provides: "bun tests for the inline-field state resolver, frame classes, status icon and retry action (Task 2), plus renderToString tests for SectionCard, NumericDisplay and StatTile (Task 3)"
    - path: "components/ui/section-card.tsx"
      provides: "Sheet card with 7px diamond title marker"
      exports: ["SectionCard", "SectionTitle", "DiamondMarker", "SectionMarkerTone"]
    - path: "components/ui/numeric-display.tsx"
      provides: "Number display in font-numeric + tabular-nums with optional muted ' / max'"
      exports: ["NumericDisplay", "NumericSize"]
    - path: "components/ui/stat-tile.tsx"
      provides: "Label + big number tile (attribute tiles, point strips)"
      exports: ["StatTile"]
    - path: "components/ui/bottom-sheet.tsx"
      provides: "Design bottom sheet built on components/ui/sheet.tsx side=bottom"
      exports: ["BottomSheet"]
  key_links:
    - from: "app/layout.tsx"
      to: "app/globals.css"
      via: "next/font variable classes on <html> define --font-barlow / --font-spectral / --font-barlow-semi-condensed / --font-jetbrains-mono, which :root --font-sans/serif/numeric/mono read"
      pattern: "--font-barlow-semi-condensed"
    - from: "app/layout.tsx"
      to: "providers/theme-provider.tsx"
      via: "<ThemeProvider attribute=\"class\" defaultTheme=\"dark\"> wraps QueryProvider"
      pattern: "defaultTheme=\"dark\""
    - from: "app/characters/page.tsx"
      to: "components/ui/theme-toggle.tsx"
      via: "<ThemeToggle /> rendered in the list header"
      pattern: "<ThemeToggle"
    - from: "components/ui/editable-field.tsx"
      to: "components/ui/inline-field-state.tsx"
      via: "resolveInlineFieldState + inlineFieldFrameClassName + InlineFieldStatusIcon + InlineFieldRetry"
      pattern: "resolveInlineFieldState"
    - from: "components/ui/editable-scaling-field.tsx"
      to: "components/ui/inline-field-state.tsx"
      via: "same state helpers"
      pattern: "resolveInlineFieldState"
    - from: "components/ui/bottom-sheet.tsx"
      to: "components/ui/sheet.tsx"
      via: "Sheet + SheetContent side=\"bottom\" + SheetTitle + SheetClose"
      pattern: "side=\"bottom\""
    - from: "app/layout.tsx"
      to: "components/ui/sonner.tsx"
      via: "renders the shadcn Toaster with position top-center, richColors, icons, toastOptions.classNames and token CSS variables (sonner.tsx stays unedited)"
      pattern: "richColors"
    - from: "lib/api/queries.ts"
      to: "sonner"
      via: "save-conflict notifier uses the warning toast variant"
      pattern: "toast.warning(message, options)"
---

<objective>
Lay the "Ferro & Brasa" design-system foundation (DS-01) that the six later redesign items (261101-mvu..mvz) build on:
- design tokens in app/globals.css
- self-hosted fonts through next/font
- a next-themes ThemeProvider (default dark) with a theme toggle in the characters list header
- design states on the inline-edit primitives
- shared presentational pieces (SectionCard, NumericDisplay, StatTile, BottomSheet)
- design-styled toasts

Purpose: the design is dark-first ("modo principal à mesa"). Every later screen item reuses these tokens and components instead of inventing its own, so the API below is a contract. Later planners read the `<interfaces>` block of this plan.

Output: rewritten token layer and root layout (including the design-configured Toaster), a provider file and a toggle file, inline-field state helpers, restyled EditableField/EditableScalingField, four presentational primitives, one shared test file, and a one-line toast-variant change for save conflicts.

Owner rule (executor: follow it): .planning/design/ferro-brasa/README.md, section "Important: the design is visual direction, not a functional spec". Take look and layout from the mock and behavior from the current app. Record any doubtful case beyond the ones in `<design_decisions>` in the SUMMARY.

Not in scope:
- no business logic or formula changes (lib/calculations, lib/schemas and lib/api/character-concurrency.ts are not touched)
- no Prisma or package changes: next-themes, sonner and lucide-react are already dependencies
- no screen redesigns. The list, create and sheet screens belong to 261101-mvu..mvz. This item only inserts the ThemeToggle into the existing list header.
- hard-coded Tailwind palette colors in components/character/spells-talents/talents-card.tsx and components/character/quick-actions-bar.tsx are left for their screen items
- generated shadcn files (components/ui/sheet.tsx, sonner.tsx, button.tsx, input.tsx, ...) are not hand-edited, per CLAUDE.md
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.claude/CLAUDE.md
@.planning/design/ferro-brasa/README.md
@.planning/design/ferro-brasa/ficha-tokens.css
# Ficha.dc.html is 106 KB: read only the line ranges named in each task (markup 1-650; the
# inline-field states are lines 300-312; section card + stat tile 176-260; toast 556-564;
# bottom sheet 566-640; toast data 889-895; field-state logic 809-823).
@.planning/design/ferro-brasa/Ficha.dc.html
@app/globals.css
@app/layout.tsx
@providers/query-provider.tsx
@components/ui/sonner.tsx
@components/ui/sheet.tsx
@components/ui/button.tsx
@components/ui/input.tsx
@components/ui/textarea.tsx
@components/ui/editable-field.tsx
@components/ui/editable-scaling-field.tsx
@lib/store/character.ts
@app/characters/page.tsx
@lib/api/queries.ts
@components/character/notes-tab.render.test.ts

<interfaces>
DOWNSTREAM CONTRACT. Items 261101-mvu..mvz reuse exactly these names. Do not rename them without updating this block.

Location decision: all new shared pieces are NEW kebab-case files in components/ui/. CLAUDE.md documents components/ui/ as the home of project-specific UI primitives (editable-field.tsx, editable-scaling-field.tsx already live there), with no barrel and direct imports. The CLAUDE.md ban applies to hand-editing the GENERATED shadcn files, and this item edits none of them. The list page uses these pieces too, so a character-only folder would be the wrong scope.

Tailwind utilities created by globals.css (Task 1):
- Game colors: bg-/text-/border-vitality-notavel, -ferido, -grave, -condenado, -incapacitado, -coma; bg-vitality-track; bg-/text-/border-berkana, text-berkana-foreground, bg-berkana-track; text-/border-/bg-success; text-/border-/bg-warning; bg-overlay.
- Vitality key mapping: the persisted stage key gravementeFerido uses the grave token; the other five keys match their token names.
- Fonts: font-sans (Barlow, the body default), font-serif (Spectral, for titles), font-numeric (Barlow Semi Condensed; always pair it with tabular-nums), font-mono (JetBrains Mono).
- Shadows: shadow-card for cards, shadow-lg for sheets, dialogs and toasts. shadow-sm maps to shadow-card and shadow-md/xl/2xl map to shadow-lg. shadow-xs/2xs render no shadow, so inputs and buttons stay flat.
- Radius: rounded-md, rounded-lg and rounded-xl all equal var(--radius), which is 4px. rounded-sm is 2px. Sheets use rounded-t-[10px].
- Animations: animate-ficha-pulse (skeleton blocks: bg-muted + animate-ficha-pulse) and animate-ficha-spin (spinners).

components/ui/theme-toggle.tsx ('use client'):
- `ThemeToggle({ className }: { className?: string })` renders a ghost icon Button, size-11 (44px), aria-label "Alternar tema claro/escuro".
- It shows Sun in light mode and Moon in dark mode, swapped by the CSS dark: variant, so it causes no hydration mismatch. Clicking calls setTheme(resolvedTheme === 'dark' ? 'light' : 'dark').
- 261101-mvu MUST keep `<ThemeToggle />` in the redesigned list header.

providers/theme-provider.tsx ('use client'):
- `ThemeProvider(props: React.ComponentProps<typeof NextThemesProvider>)` is mounted once in app/layout.tsx with attribute="class", defaultTheme="dark", enableSystem={false}, disableTransitionOnChange.

components/ui/inline-field-state.tsx:
- `type SaveStatus = 'idle' | 'saved' | 'error'`
- `type InlineFieldState = 'readonly' | 'idle' | 'editing' | 'saving' | 'saved' | 'error'`
- `SAVED_FEEDBACK_MS = 1500`
- `INLINE_FIELD_LABEL_CLASS`: the 12px uppercase muted label, tracking 0.06em
- `resolveInlineFieldState({ isEditing, canEdit, isSaving, saveStatus }): InlineFieldState` takes the first matching rule:
  1. isSaving → 'saving'
  2. saveStatus 'error' → 'error'
  3. isEditing → 'editing'
  4. !canEdit → 'readonly'
  5. saveStatus 'saved' → 'saved'
  6. otherwise → 'idle'
- `inlineFieldFrameClassName(state): string` returns the box classes for each state.
- `InlineFieldStatusIcon({ state, className? })` shows LoaderCircle (spin) for saving, Check in text-success for saved, CloudOff in text-destructive for error, and nothing for the other states.
- `InlineFieldRetry({ onRetry, keepFocus? })` is a text button reading "Não salvou · tentar de novo". With keepFocus, its mousedown is prevented, so a focused input does not blur.
- Use these helpers for any custom inline control (skill steppers, language chips, notes editor) that needs the same states.

components/ui/section-card.tsx (no 'use client'; server-safe):
- `type SectionMarkerTone = 'primary' | 'berkana'`
- `DiamondMarker({ tone = 'primary', className? })`: an aria-hidden 7px square rotated 45°, bg-primary or bg-berkana.
- `SectionTitle({ children, tone?, headingLevel?: 'h2' | 'h3', className? })`: the diamond plus a serif title (19px, weight 600). It also works outside a card, for example for spell-level group headers.
- `SectionCard({ title, tone?, action?, headingLevel?, className, children, ...sectionProps })`:
  - renders a `<section>` with break-inside-avoid, mb-3, bg-card, border, rounded var(--radius), shadow-card, p-4, flex-col, gap-3.5
  - the header row holds SectionTitle on the left and `action` (badge, status, icon or small button) on the right
  - `...sectionProps` pass through, so `data-section`, `id` and aria attributes survive. character-layout scrolls to `[data-section=...]`.

components/ui/numeric-display.tsx (server-safe):
- `type NumericSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero'`
- `NumericDisplay({ value, max?, size = 'md', className?, maxClassName?, ...spanProps })`:
  - renders a `<span>` with font-numeric, tabular-nums and font-semibold
  - sizes: sm 17px, md 24px, lg 34px, xl 44px, hero 56px (hero uses leading 0.95 and tracking -0.01em)
  - `max` renders " / {max}" in muted, medium weight, at a smaller size: sm 14px, md 15px, lg 18px, xl 20px, hero 22px
  - callers pass already-computed values from lib/calculations and format them; the component does no math.

components/ui/stat-tile.tsx (server-safe):
- `StatTile({ label, value, variant = 'tile', align = 'start', className?, valueClassName?, ...divProps })`
  - 'tile': border, bg-muted, rounded, padding 8px 10px. Used for attribute tiles.
  - 'bare': no border and no background, for segmented strips whose parent draws the borders, like Disponíveis/Gastos/Restantes.
  - label: 13px muted, truncated. value: font-numeric, tabular-nums, 24px, weight 600.

components/ui/bottom-sheet.tsx ('use client'):
- `BottomSheet({ open, onOpenChange, title, description?, className?, children })` is controlled only.
- It builds on Sheet + SheetContent side="bottom" and renders:
  - a centered panel, max-width 480px and max-height 88dvh, with its own scroll
  - popover surface, 10px top radius, no bottom border, shadow-lg
  - a 40x4 drag handle
  - a serif 22px SheetTitle, an optional SheetDescription, and a 44px "Fechar" SheetClose
  - a body `div` with flex-col and gap-3.5 that receives `className`
- The overlay color comes from the global overlay rule in globals.css.
- 261101-mvv uses it for the vit, berk, arma, atributos and pericias sheets.

Toasts (revision 1: there is NO AppToaster export and no components/ui/app-toaster.tsx):
- app/layout.tsx renders the shadcn Toaster from components/ui/sonner.tsx once, configured with the design look.
- Callers keep using plain `toast.success / toast.error / toast.warning / toast(...)` from sonner with no custom classNames.
- Save conflicts use the warning variant.

Revision 1 path note: SectionCard, NumericDisplay, StatTile, BottomSheet, ThemeToggle, ThemeProvider and the inline-field-state helpers keep the exact paths and names above. Only the AppToaster wrapper was removed, and nothing outside app/layout.tsx imported it. The tests for this item live in components/ui/design-primitives.render.test.ts.
</interfaces>

<design_decisions>
Rule: the owner's README section "Important: the design is visual direction, not a functional spec". Look and layout come from the mock; behavior comes from the current app. Recorded cases:
- DD-01: EditableField editing state. Follow the mock's bare input with the ring, but KEEP a 44px cancel (X) button calling the existing handleCancel (coordinator decision). Phone keyboards have no Escape key, so removing it would take away the only touch way to cancel. The button prevents mousedown so the input does not blur. Without that, a tap would trigger the existing blur-save before the cancel runs, and "cancel" would save. The old check (save) button is dropped: blur and Enter already save through the unchanged handlers, so no capability is lost.
- DD-02: EditableScalingField keeps its save and cancel buttons, restyled to 44px. It has no blur-save, so removing them would remove a capability.
- DD-03: The transient "saved" check (about 1.5 s) and the "Não salvou · tentar de novo" action are mock-only features. They are allowed as pure UI conveniences over the existing save: in view mode the retry re-enters editing with handleStartEdit, and in edit mode it calls the unchanged handleSave.
- DD-04: The raw server error message under a failed field is replaced by the design's fixed pt-BR retry text. That is feedback copy, not behavior: the failed field still stays in edit mode as it does today, and console.error still logs the error.
- DD-05: Read-only fields render as plain text, and an empty value shows an em dash instead of the "Clique para editar..." placeholder, which is wrong where nothing can be clicked. formatDisplay, when given, still wins.
- DD-06: The single-line hint "Enter para salvar • Esc para cancelar" is dropped, following the mock. Multiline fields keep a short hint, because their save shortcut (Ctrl+Enter) is not discoverable.
- DD-07: The save-conflict toast switches to the warning variant to match the design's conflict look. The message text, toast id and refetch are unchanged.
- DD-08: The theme toggle is not in the mock. It is required by the item description, so it is a pure UI convenience placed in the list header.
</design_decisions>
</context>

<coverage_audit>
| Source | Item | Covered by |
|--------|------|------------|
| GOAL | Replace :root and .dark with ficha-tokens.css values, keeping shadcn variable names | Task 1 |
| GOAL | @theme inline extras: vitality x7, berkana x3, success, warning, overlay, font-numeric, shadow tokens | Task 1 |
| GOAL | ficha-pulse / ficha-spin keyframes | Task 1 (plus animate-* utilities) |
| GOAL | Spectral, Barlow, Barlow Semi Condensed, JetBrains Mono via next/font/google replacing the previous font pair, with no CSS import | Task 1 |
| GOAL | next-themes ThemeProvider (attribute class, default dark) | Task 1 |
| GOAL | Theme toggle reachable from the characters list header | Task 1 |
| GOAL | Inline field states (read-only, idle 44px dashed, editing ring, saving spinner, saved check, error + cloud-off + retry text) without changing save logic or props | Task 2 (byte-identical invariant gate) |
| GOAL | Shared section card with 7px diamond, numeric display, stat tile, bottom sheet on sheet.tsx side=bottom | Task 3 |
| GOAL | Sonner Toaster restyled to the design toast look | Task 3 (configured in app/layout.tsx) |
| CONTEXT (owner rule, README "Important") | Mock gives the look; current behavior wins; doubtful cases recorded | `<design_decisions>` DD-01..DD-08; executor note in `<objective>` |
| CONTEXT (coordinator decision) | Keep a 44px touch cancel control in EditableField's editing state | Task 2, DD-01 |
| GOAL | No business logic changes; derived numbers unchanged | Tasks 2-3 gates; lib/calculations, lib/schemas and character-concurrency.ts untouched (final diff gate) |
| CONTEXT (coordinator) | Name shared components' paths, exports and props for later items; justify the folder | `<interfaces>` block |
| CONTEXT (coordinator) | Fonts as CSS variables feeding --font-sans/--font-serif/--font-mono/--font-numeric | Task 1 |
| CONTEXT (coordinator) | shadcn components keep working; hard-coded colors left for screen items | Task 1 (all shadcn names kept, radius/shadow scale mapped; palette-color count recorded in SUMMARY) |
| CONTEXT (coordinator) | ThemeProvider in providers/, suppressHydrationWarning on html | Task 1 |
| CONTEXT (coordinator) | DoD: tsc, lint (0 errors, no new warnings), bun test, build | Task 3 verify + `<verification>` |
| RESEARCH (design README) | Radius 4px, sheet 10px top radius, 44px touch targets, 12px uppercase labels, diamond markers, toasts (conflict/success/error), skeleton = ficha-pulse, dark primary | Tasks 1-3 |
| RESEARCH (design README) | Vitality and Berkana stage visuals, list/sheet layouts | Out of scope here (261101-mvu..mvz); Task 1 provides the tokens |
| CONTEXT (memory) | No auth by design | Nothing in this plan adds auth |
</coverage_audit>

<tasks>

<task type="auto">
  <name>Task 1 (tracer, end-to-end slice): tokens, self-hosted fonts, ThemeProvider and a working theme toggle on /characters</name>
  <files>app/globals.css, app/layout.tsx, providers/theme-provider.tsx, components/ui/theme-toggle.tsx, app/characters/page.tsx</files>
  <read_first>
    - .planning/design/ferro-brasa/ficha-tokens.css (all 105 lines: the exact values to paste)
    - .planning/design/ferro-brasa/README.md (including "Important: the design is visual direction, not a functional spec")
    - app/globals.css (whole file: its @theme inline block holds self-referencing entries that must be removed or kept exactly as described below)
    - app/layout.tsx, providers/query-provider.tsx (style to copy: double quotes + semicolons), components/ui/sonner.tsx (it already calls useTheme)
    - app/characters/page.tsx lines 115-130 (header block; this file uses 4-space indentation, single quotes, no semicolons)
  </read_first>
  <action>
    Step 0: record this item's base commit for later invariant gates. Run git rev-parse HEAD and write the output to the path printed by git rev-parse --git-path gsd-261101-mvt-base. Run this before editing anything.

    Step 1, app/globals.css: rewrite the token layer and keep the file's structure. Order: the two existing @import lines (tailwindcss, tw-animate-css), the existing dark custom-variant, the @theme inline block, :root, .dark, keyframes, the overlay rule, @layer base, and the existing @layer utilities block unchanged.
    (a) :root: paste the ficha-tokens.css :root values verbatim (radius 0.25rem, all colors, the vitality/berkana/success/warning/overlay extras, shadow-card, shadow-lg). Do NOT copy the external font stylesheet import from the top of ficha-tokens.css. next/font replaces it, and no external CSS import may be added (CONTEXT coordinator note).
    Change only the four font tokens so they read the next/font variables:
      - font-sans = var(--font-barlow), ui-sans-serif, system-ui, sans-serif
      - font-serif = var(--font-spectral), Georgia, serif
      - font-mono = var(--font-jetbrains-mono), ui-monospace, monospace
      - font-numeric = var(--font-barlow-semi-condensed), var(--font-barlow), sans-serif
    Also add sidebar aliases so the shadcn sidebar names keep resolving:
      - sidebar = var(--card); sidebar-foreground = var(--card-foreground)
      - sidebar-primary = var(--primary); sidebar-primary-foreground = var(--primary-foreground)
      - sidebar-accent = var(--accent); sidebar-accent-foreground = var(--accent-foreground)
      - sidebar-border = var(--border); sidebar-ring = var(--ring)
    The aliases follow .dark automatically because next-themes puts .dark on html, which is also :root.
    (b) .dark: paste the ficha-tokens.css .dark values verbatim.
    (c) Delete every old-theme variable that is not in the token file: shadow-color, shadow-opacity, shadow-blur, shadow-spread, shadow-offset-x/y, letter-spacing, tracking-normal, the old shadow-2xs..2xl values, the spacing-scale variable, and the old monospace font values.
    (d) @theme inline:
      - Keep every existing color mapping, including chart, sidebar and destructive-foreground.
      - Add the game-color mappings, each pointing at its token:
        - color-vitality-notavel, -ferido, -grave, -condenado, -incapacitado, -coma and -track → var(--vitality-*)
        - color-berkana, color-berkana-foreground, color-berkana-track
        - color-success, color-warning, color-overlay
      - Fonts: font-sans: var(--font-sans), and the same for font-serif, font-mono and font-numeric. This self-reference was verified during planning: Tailwind 4.1 emits it inside @layer theme, and the unlayered :root declaration wins, so each of the four names MUST stay defined in :root.
      - Radius: radius-sm = calc(var(--radius) - 2px); radius-md, radius-lg and radius-xl = var(--radius). The design uses one 4px radius for cards, inputs and buttons, so shadcn primitives match it without edits.
      - Shadows:
        - shadow-2xs and shadow-xs = 0 0 #0000, so inputs and buttons stay flat
        - shadow-sm = var(--shadow-card); shadow-card = var(--shadow-card)
        - shadow-md = var(--shadow-lg); shadow-lg = var(--shadow-lg); shadow-xl and shadow-2xl = var(--shadow-lg)
        - shadow-card and shadow-lg are defined in both :root and .dark, as the self-reference requires.
      - Animations: animate-ficha-pulse = ficha-pulse 1.6s ease-in-out infinite; animate-ficha-spin = ficha-spin 1s linear infinite.
      - Remove these entries: the bare radius entry (it hard-codes 0rem), all tracking-* entries (Tailwind's defaults are identical at 0em), the spacing-scale entry (it self-references a variable that no longer exists, which would break every p-/m-/gap- utility; Tailwind's default 0.25rem then applies), letter-spacing, the shadow-offset/spread/blur/opacity entries, and color-shadow-color.
    (e) Add both keyframes from ficha-tokens.css at top level: ficha-pulse and ficha-spin.
    (f) Add one unlayered rule that sets background-color: var(--overlay) for the selectors [data-slot="sheet-overlay"], [data-slot="dialog-overlay"] and [data-slot="alert-dialog-overlay"]. The overlay is theming that the generated shadcn files hard-code. The rule is unlayered so it beats their layered bg-black/50 utility, and it gives sheets and the delete dialog the design overlay without editing generated files.
    (g) @layer base: keep the border-border / outline-ring/50 rule. Body applies bg-background, text-foreground and font-sans. Remove the letter-spacing line.

    Step 2, providers/theme-provider.tsx (new; double quotes + semicolons like query-provider.tsx):
      - Add the "use client" directive.
      - Export ThemeProvider: a thin wrapper that renders next-themes' ThemeProvider (imported as NextThemesProvider), with its props typed as React.ComponentProps of that component.

    Step 3, app/layout.tsx:
      - Replace the current next/font sans+mono pair, and every reference to it, with Barlow, Spectral, Barlow_Semi_Condensed and JetBrains_Mono from next/font/google, each with subsets ["latin"] and a variable option:
        - Barlow: weights 400/500/600/700, variable --font-barlow
        - Spectral: weights 400/500/600/700, styles normal + italic, variable --font-spectral
        - Barlow_Semi_Condensed: weights 500/600/700, variable --font-barlow-semi-condensed
        - JetBrains_Mono: weights 400/500, variable --font-jetbrains-mono
        - Spectral, Barlow and Barlow Semi Condensed are not variable fonts, so their weight option is required.
      - Name the four font constants barlow, spectral, barlowSemiCondensed and jetbrainsMono.
      - Put their four .variable class names on the html element, NOT on body. The :root font tokens are computed on html, so a variable defined only on body would leave the font tokens invalid.
      - Write html's className as a template literal (or cn call) that names barlow.variable, spectral.variable, barlowSemiCondensed.variable and jetbrainsMono.variable explicitly. Do not use a map callback: the Task 1 gate parses the html opening tag up to its first closing angle bracket and counts the explicit .variable members.
      - Keep lang="pt-BR" and suppressHydrationWarning on html. Body gets font-sans antialiased.
      - Wrap the current tree in ThemeProvider with attribute="class", defaultTheme="dark", enableSystem={false} and disableTransitionOnChange (CONTEXT: dark is the primary table mode). Keep QueryProvider, main and the Toaster where they are; Task 3 swaps the Toaster.
      - Leave metadata as is, including the pre-existing viewport entry.

    Step 4, components/ui/theme-toggle.tsx (new; single quotes, no semicolons):
      - Add the 'use client' directive. Export ThemeToggle with an optional className.
      - Read resolvedTheme and setTheme from useTheme().
      - Render the shadcn Button: variant ghost, size icon, className merged with size-11 and text-muted-foreground, type button, aria-label "Alternar tema claro/escuro", title "Alternar tema".
      - onClick sets the theme to light when resolvedTheme is dark, otherwise to dark.
      - Children: a Sun icon (size-5, dark:hidden) and a Moon icon (hidden, size-5, dark:block), both aria-hidden.
      - Do not add mounted state or a setState in an effect: the CSS swap avoids hydration mismatches, and the repo's react-hooks lint rules forbid setState in effects.

    Step 5, app/characters/page.tsx: import ThemeToggle from '@/components/ui/theme-toggle'. In the header, wrap the existing title div (h1 + subtitle) together with a ThemeToggle in a flex row (items-start, justify-between, gap-2), so the toggle sits at the right of the title on mobile and desktop. Change nothing else; 261101-mvu restyles this page and keeps the toggle.

    Step 6: record in the SUMMARY the hard-coded palette-color occurrences outside components/ui (planning baseline: 4 lines, in talents-card.tsx and quick-actions-bar.tsx). Do not edit them. Count them with the grep in `<verify>`.
  </action>
  <verify>
    External-import guard (it also passes at HEAD; it catches regressions): zero matches for '@import url', 'fonts.googleapis' or 'unpkg' across app/globals.css and app/layout.tsx. The other gates prove the deliverable and fail at HEAD.
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && test -s "$(git rev-parse --git-path gsd-261101-mvt-base)" && [ "$(cat app/globals.css app/layout.tsx | grep -c -e '@import url' -e 'fonts.googleapis' -e 'unpkg')" -eq 0 ] && [ "$(grep -c -- '--vitality-notavel' app/globals.css)" -ge 3 ] && [ "$(grep -c -- '--color-berkana-foreground' app/globals.css)" -ge 1 ] && [ "$(grep -c '@keyframes ficha-' app/globals.css)" -ge 2 ] && grep -q -- '--radius: 0.25rem' app/globals.css && [ "$(grep -c -- '--spacing' app/globals.css)" -eq 0 ] && [ "$(cat app/layout.tsx app/globals.css | grep -c 'Geist')" -eq 0 ] && grep -q 'Barlow_Semi_Condensed' app/layout.tsx && perl -0777 -ne 'if (/<html\b([^>]*)>/s) { my $n = () = $1 =~ /\.variable\b/g; exit($n >= 4 ? 0 : 1) } exit 1' app/layout.tsx && grep -q 'defaultTheme="dark"' app/layout.tsx && [ "$(grep -c '<ThemeToggle' app/characters/page.tsx)" -ge 1 ] && grep -q 'export function ThemeProvider' providers/theme-provider.tsx && grep -q 'export function ThemeToggle' components/ui/theme-toggle.tsx && npx tsc --noEmit && bun run lint 2>&1 | grep -q '(0 errors, 1 warning)' && bun run build && grep -rq --include='*.css' -e '--vitality-notavel' .next/static && grep -rq --include='*.css' -e 'ficha-spin' .next/static && grep -rq --include='*.css' -e '--font-barlow-semi-condensed:' .next/static && grep -rqzE --include='*.css' 'body[[:space:]]*\{[^}]*var\(--font-sans\)' .next/static && echo TRACER-OK; grep -rn -E '\b(bg|text|border|ring|from|to|fill|stroke)-(red|green|blue|yellow|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|black|white)(-[0-9]{2,3})?\b' app components --include=*.tsx | grep -v '^components/ui/' | wc -l</automated>
  </verify>
  <done>
    - The build ships CSS that contains the vitality tokens, the ficha-spin keyframes and the next/font Barlow Semi Condensed variable, and the body rule reads var(--font-sans). The previous font pair is gone from layout.tsx and globals.css, and the spacing-scale self-reference is removed.
    - The html opening tag itself carries the four font variables. This gate fails at HEAD, where the variables sit on body. The tree is wrapped by ThemeProvider (class, default dark).
    - /characters shows the ThemeToggle in its header.
    - tsc passes; lint still reports exactly 1 warning; the build passes. TRACER-OK is printed.
    - The palette-color count is recorded for the SUMMARY.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Inline-field design states for EditableField and EditableScalingField (save logic and props byte-identical)</name>
  <files>components/ui/inline-field-state.tsx, components/ui/design-primitives.render.test.ts, components/ui/editable-field.tsx, components/ui/editable-scaling-field.tsx</files>
  <read_first>
    - .planning/design/ferro-brasa/Ficha.dc.html lines 300-312 (markup of the six field states) and 809-823 (state machine)
    - components/ui/editable-field.tsx (whole file) and components/ui/editable-scaling-field.tsx (whole file)
    - components/ui/input.tsx and components/ui/textarea.tsx (their default classes to override: h-9, md:text-sm, dark:bg-input/30, focus-visible:ring-ring/50, disabled:opacity-50)
    - components/character/notes-tab.render.test.ts (renderToString + createElement test pattern; it mocks '@/lib/api/queries' process-wide, and the new test must not import that module)
  </read_first>
  <behavior>
    - resolveInlineFieldState: canEdit false, not editing, not saving, saveStatus 'idle' → 'readonly'
    - canEdit true, not editing, not saving, 'idle' → 'idle'
    - isEditing true, not saving, 'idle' → 'editing'
    - isSaving true → 'saving', both while editing and while not editing, and also when saveStatus is 'error' (saving wins)
    - saveStatus 'error' → 'error' when not editing (even with canEdit false) and when editing
    - saveStatus 'saved', canEdit true, not editing → 'saved'; 'saved' with canEdit false → 'readonly'; 'saved' while editing → 'editing'
    - inlineFieldFrameClassName:
      - 'idle' contains border-dashed, border-input and min-h-11
      - 'editing' contains border-ring and ring-ring/30
      - 'saving' contains border-input
      - 'saved' contains border-success
      - 'error' contains border-destructive
      - 'readonly' contains no 'border-' class
    - renderToString of InlineFieldStatusIcon: 'saving' contains animate-ficha-spin; 'saved' contains text-success; 'error' contains text-destructive; 'idle' renders an empty string
    - renderToString of InlineFieldRetry contains type="button" and the text "Não salvou · tentar de novo"
  </behavior>
  <action>
    RED: create components/ui/design-primitives.render.test.ts with bun:test. Put every behavior above in a describe block named 'inline-field-state'; Task 3 appends its own describe blocks to the same file.
    - Import from './inline-field-state'.
    - Render with renderToString from react-dom/server and createElement from react; the file is .ts, so use no JSX.
    - Do not import '@/lib/api/queries'.
    - Run it and see it fail, then commit as test(261101-mvt).

    GREEN: create components/ui/inline-field-state.tsx (single quotes, no semicolons). Export exactly the names in the `<interfaces>` block.
    - INLINE_FIELD_LABEL_CLASS = text-xs uppercase tracking-[0.06em] text-muted-foreground.
    - Frame classes per state. Values come from mock lines 305-310: radius var(--radius), padding 0 10px, 16px text.
      - 'readonly': min-h-7, flex, items-center, text-base. No border.
      - 'idle': min-h-11, flex, items-center, w-full, px-2.5, text-left, text-base, border, border-dashed, border-input, rounded-(--radius), bg-transparent, cursor-text, hover:bg-muted/40, outline-none, focus-visible:border-ring, focus-visible:ring-[3px], focus-visible:ring-ring/30.
      - 'editing': min-h-11, px-2.5, text-base, md:text-base, border, border-ring, ring-[3px], ring-ring/30, focus-visible:ring-ring/30, rounded-(--radius), bg-background, dark:bg-background, shadow-none.
      - 'saving': the same box with border-input, no ring, text-muted-foreground, disabled:opacity-100.
      - 'saved': the same box with border-success.
      - 'error': the same box with border-destructive and ring-destructive/20.
      - Every non-readonly state includes flex, items-center, justify-between and gap-1.5 for the trailing icon. For editing/saving/error, the edit-mode Input/Textarea receives these classes, so keep them valid on an input.
    - InlineFieldStatusIcon renders a 16px lucide icon (size-4, shrink-0, aria-hidden) plus an sr-only label:
      - saving: LoaderCircle, animate-ficha-spin, text-muted-foreground, "Salvando…"
      - saved: Check, text-success, "Salvo"
      - error: CloudOff, text-destructive, "Não salvou"
      - any other state: null
    - InlineFieldRetry is a button type="button", self-start, text-left, text-[13px], text-destructive, underline-offset-2, hover:underline, reading "Não salvou · tentar de novo".
      - onClick calls onRetry.
      - When keepFocus is true, onMouseDown calls preventDefault. The edit-mode input then does not blur, so the blur-save path cannot fire a second save next to the click.
    - SAVED_FEEDBACK_MS = 1500. Run the test (green), then commit as feat(261101-mvt).

    REFACTOR, restyle components/ui/editable-field.tsx. Keep these byte-identical:
    - buildUpdateData
    - the EditableFieldProps interface
    - the EditableNumberField, EditableTextArea and EditableAttributeField wrappers' logic
    - every existing statement in handleStartEdit, handleCancel, handleChange, handleSave, handleKeyDown and handleBlur
    - the two existing effects
    You may only ADD saveStatus updates to the handlers. Changes:
      - Add local state saveStatus (SaveStatus, initial 'idle').
      - handleStartEdit: after its existing guard, set 'idle'. handleCancel: set 'idle'.
      - handleSave: set 'saved' right after the existing cancelEditing() in the success path. In the catch block, keep the existing console.error and set 'error'.
      - Add one effect keyed on saveStatus: when it is 'saved', start setTimeout(SAVED_FEEDBACK_MS) that sets 'idle', and clear it in the cleanup. This exact pattern was lint-probed clean during planning. Do NOT set state synchronously in an effect body. Fallback, if lint flags the effect anyway: schedule the timeout inside handleSave instead, with no cleanup. React 19 ignores a setState after unmount.
      - Compute canEdit = isEditMode && !disabled.
      - Compute state = resolveInlineFieldState({ isEditing, canEdit, isSaving, saveStatus }). isSaving stays updateCharacterMutation.isPending.
      - Delete the unused error-message constant and its two render sites; the design replaces them with the retry text, and an unused variable would add a lint warning.
      - Delete the hard-coded yellow dirty-state classes and the edit-mode save (check) icon button (DD-01): blur and Enter already save through the unchanged handlers. KEEP a cancel control, restyled (see Edit mode below). Remove the now-unused Edit, Check and Loader2 imports; Button and X stay.
      - Choose the element by isEditing and the styling by state. That keeps the Input/Textarea mounted, and only disabled, while a save from edit mode is pending. Never swap it for a div mid-save; that could fire a second blur save.
    View mode (not editing):
      - Outer div: flex flex-col gap-1, plus className.
      - The optional label uses INLINE_FIELD_LABEL_CLASS.
      - readonly: a span with the readonly frame, then displayClassName. It shows formatDisplay(value) when formatDisplay is given, otherwise value, or an em dash when empty. Empty text is muted; multiline uses whitespace-pre-wrap.
      - Any other state: a div with role="button" (not a button element, because 64 call sites may nest fields inside other controls).
        - tabIndex 0 when canEdit, otherwise -1. onClick runs handleStartEdit. onKeyDown on Enter or Space calls preventDefault, then handleStartEdit.
        - className: inlineFieldFrameClassName(state), then multiline extras (min-h-[60px], items-start, py-2), then displayClassName last, so callers like profile-cards' text-2xl text-primary still win.
        - Content: a span (min-w-0, flex-1, break-words; whitespace-pre-wrap when multiline) with the existing displayValue, followed by InlineFieldStatusIcon.
      - When state is 'error', render InlineFieldRetry below it with onRetry = handleStartEdit (the mock's "edit again").
    Edit mode:
      - Same outer wrapper and label.
      - A relative div holds the Input or Textarea with every existing prop unchanged (ref, value, onChange, onKeyDown, onBlur, placeholder, type, rows, disabled={isSaving}), plus aria-invalid when state is 'error'.
      - A trailing slot, absolutely positioned at the right edge (right-0, top-0, h-11, flex, items-center), holds InlineFieldStatusIcon and, unless isSaving, the cancel button (DD-01, coordinator decision):
        - shadcn Button: variant ghost, size icon, className size-11 and text-muted-foreground, type button, aria-label "Cancelar edição", X icon (size-5)
        - Write onMouseDown inline on this Button, as an arrow that calls preventDefault() on the event, not as a named helper. The Task 2 gate reads the cancel Button block for it. This keeps focus in the input, so the blur-save path does not fire. onClick calls the existing handleCancel.
        - disabled={isSaving}, as the old cancel button was.
      - Input className: inlineFieldFrameClassName(state), plus enough right padding for the trailing slot (about pr-12 with the button alone, pr-20 when the error icon is also shown), plus py-2 for multiline/textarea.
      - Multiline only, while editing: a muted text-xs hint "Ctrl+Enter ou toque fora para salvar · Esc cancela".
      - When state is 'error': InlineFieldRetry with keepFocus and onRetry calling handleSave.
      - When type is 'number', add font-numeric and tabular-nums to both the view element and the input (README: every number uses Barlow Semi Condensed with tabular-nums).

    REFACTOR, restyle components/ui/editable-scaling-field.tsx the same way. Keep these byte-identical:
    - normalizeScalingData, calculateScaledValue, buildScalingUpdateData
    - the ScalingData and EditableScalingFieldProps interfaces
    - every existing statement in the handlers and effects
    Add the same saveStatus state, updates and timer effect (success: after cancelEditing(); catch: keep console.error, set 'error'). Here canEdit = isEditMode.
    View mode:
      - readonly: plain text. calculated.total in font-numeric tabular-nums font-medium, followed by the muted (formula) when perLevel > 0, as today.
      - Other states: a role="button" frame div with the same keyboard handling, the same content, and InlineFieldStatusIcon.
      - InlineFieldRetry (onRetry = handleStartEdit) in the error state.
    Edit mode:
      - Keep the two inputs and all their props. className: inlineFieldFrameClassName(state), text-center, font-numeric, tabular-nums. Each input gets a caption in INLINE_FIELD_LABEL_CLASS ("Base" and "/Nível").
      - This component has no blur-save, so keep the save and cancel buttons, restyled: Button variant ghost, size icon, className size-11, aria-labels "Salvar" and "Cancelar".
      - The save button shows LoaderCircle with animate-ficha-spin while isSaving, otherwise Check.
      - Remove the hard-coded yellow classes and the unused Edit and Loader2 imports.
      - Keep the "= total" preview, in font-numeric.
      - Error state: InlineFieldRetry with onRetry calling handleSave.
    Run the full gate; commit as refactor(261101-mvt).
  </action>
  <verify>
    Proof gate: the byte-identical awk loop proves the save logic and props are unchanged. Preservation guards (they already pass at HEAD on purpose; they only catch regressions): exactly one mutateAsync match per file, the onBlur={handleBlur} wiring, and onClick={handleCancel}. New-state gates: no yellow classes left; both files use resolveInlineFieldState; the retry text exists; and the DD-01 touch-cancel gate passes. That gate (perl) finds the Button block containing "Cancelar edição" in editable-field.tsx and requires an inline onMouseDown in it that calls preventDefault(). It fails at HEAD; onClick={handleCancel} is not evidence for it.
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && bun test components/ui/design-primitives.render.test.ts && B=$(cat "$(git rev-parse --git-path gsd-261101-mvt-base)") && git cat-file -e "$B:components/ui/editable-field.tsx" && git cat-file -e "$B:components/ui/editable-scaling-field.tsx" && for spec in "components/ui/editable-field.tsx|function buildUpdateData(" "components/ui/editable-field.tsx|interface EditableFieldProps {" "components/ui/editable-scaling-field.tsx|export function normalizeScalingData(" "components/ui/editable-scaling-field.tsx|export function calculateScaledValue(" "components/ui/editable-scaling-field.tsx|function buildScalingUpdateData(" "components/ui/editable-scaling-field.tsx|interface EditableScalingFieldProps {" "components/ui/editable-scaling-field.tsx|export interface ScalingData {"; do f=${spec%%|*}; s=${spec#*|}; old=$(git show "$B:$f") || exit 1; diff <(printf '%s\n' "$old" | awk -v s="$s" 'index($0,s)==1{p=1} p{print} p&&/^}/{exit}') <(awk -v s="$s" 'index($0,s)==1{p=1} p{print} p&&/^}/{exit}' "$f") >/dev/null || { echo "SAVE-LOGIC CHANGED: $s"; exit 1; }; done && { { [ "$(grep -o 'mutateAsync' components/ui/editable-field.tsx | wc -l)" -eq 1 ] && [ "$(grep -o 'mutateAsync' components/ui/editable-scaling-field.tsx | wc -l)" -eq 1 ] && grep -q 'onBlur={handleBlur}' components/ui/editable-field.tsx && grep -q 'onClick={handleCancel}' components/ui/editable-field.tsx; } || { echo "PRESERVATION GUARD FAILED"; exit 1; }; } && perl -0777 -ne 'exit 1 unless /(<Button\b(?:(?!<\/Button>).)*?Cancelar edição(?:(?!<\/Button>).)*?<\/Button>)/s; my $b = $1; exit(($b =~ /onMouseDown=\{[^}]*preventDefault\(\)/s) ? 0 : 1)' components/ui/editable-field.tsx && [ "$(cat components/ui/editable-field.tsx components/ui/editable-scaling-field.tsx | grep -c 'yellow-500')" -eq 0 ] && grep -q 'resolveInlineFieldState' components/ui/editable-field.tsx && grep -q 'resolveInlineFieldState' components/ui/editable-scaling-field.tsx && grep -q 'Não salvou · tentar de novo' components/ui/inline-field-state.tsx && npx tsc --noEmit && bun run lint 2>&1 | grep -q '(0 errors, 1 warning)' && bun test && echo STATES-OK</automated>
  </verify>
  <done>
    - The resolver, frame-class, icon and retry tests pass.
    - Proof: the seven save-logic and props blocks are byte-identical to the base commit.
    - Preservation guards hold: one mutateAsync call per primitive, plus the blur and cancel handler wiring.
    - The yellow dirty classes are gone.
    - Both primitives render the six design states through the shared helpers. EditableField's editing state has the 44px "Cancelar edição" X, which cancels without a blur-save.
    - tsc passes; lint still reports exactly 1 warning; the full bun test suite passes (183 baseline tests plus the new ones).
  </done>
</task>

<task type="auto">
  <name>Task 3: Shared presentational pieces (SectionCard, NumericDisplay, StatTile, BottomSheet) and design toasts</name>
  <files>components/ui/section-card.tsx, components/ui/numeric-display.tsx, components/ui/stat-tile.tsx, components/ui/bottom-sheet.tsx, components/ui/design-primitives.render.test.ts, app/layout.tsx, lib/api/queries.ts</files>
  <read_first>
    - .planning/design/ferro-brasa/Ficha.dc.html lines 176-182 and 250-258 (section card header + attribute stat tiles), 556-575 (toast + bottom-sheet frame), 889-895 (toast variants)
    - components/ui/sheet.tsx (SheetContent always renders its own close button as the LAST direct child; it has no data-slot)
    - components/ui/sonner.tsx (it spreads props AFTER its own style, so a passed style replaces it)
    - lib/api/queries.ts line ~106 (the conflict notifier inside useUpdateCharacter)
    - components/character/notes-tab.render.test.ts (renderToString pattern)
  </read_first>
  <action>
    Implement exactly the APIs in the `<interfaces>` block. New files use single quotes, no semicolons and cn from '@/lib/utils'.

    1. components/ui/section-card.tsx (no client directive).
       - DiamondMarker: a span with aria-hidden, size-[7px], shrink-0, rotate-45, and bg-primary or bg-berkana by tone.
       - SectionTitle: a div (flex, items-center, gap-2.5) holding the DiamondMarker and the heading tag from headingLevel (default h2). Heading classes: m-0, font-serif, text-[19px], font-semibold, leading-tight.
       - SectionCard: Omit 'title' from the section props. Render a section with:
         - break-inside-avoid, mb-3, flex, flex-col, gap-3.5, rounded-(--radius), border, bg-card, text-card-foreground, p-4, shadow-card, then className
         - all remaining props spread onto it, so data-section and id pass through
         - a header div (flex, items-center, justify-between, gap-2) with SectionTitle and the optional action, then children
       - Values come from mock lines 176-180: padding 16, gap 14, margin-bottom 12, the 7px diamond, serif 19/600.

    2. components/ui/numeric-display.tsx: a span with font-numeric, tabular-nums, font-semibold, plus the size map from `<interfaces>`:
       - sm: text-[17px]
       - md: text-2xl leading-[1.1]
       - lg: text-[34px] leading-none
       - xl: text-[44px] leading-none
       - hero: text-[56px] leading-[0.95] tracking-[-0.01em]
       When max is given, append a span with font-medium, text-muted-foreground and the matching max size (text-sm, text-[15px], text-lg, text-xl, text-[22px]) containing " / " followed by max. The component formats nothing and computes nothing.

    3. components/ui/stat-tile.tsx: a div with flex, flex-col, gap-0.5, px-2.5, py-2. variant 'tile' adds rounded-(--radius), border and bg-muted. align 'center' adds items-center and text-center. The label is a span with truncate, text-[13px] and text-muted-foreground. The value is a span with font-numeric, tabular-nums, text-2xl, font-semibold and leading-[1.1], then valueClassName. Values come from mock lines 252-255.

    4. components/ui/bottom-sheet.tsx ('use client'). Build on Sheet, SheetContent, SheetTitle, SheetDescription and SheetClose from '@/components/ui/sheet', plus Button and the lucide X icon.
       - Sheet open/onOpenChange are controlled by the props.
       - SheetContent: side="bottom". Pass aria-describedby={undefined} when there is no description, which avoids the Radix dev warning. className: inset-x-0, mx-auto, w-full, max-w-[480px], max-h-[88dvh], gap-0, overflow-y-auto, rounded-t-[10px], border, border-b-0, bg-popover, p-0, text-popover-foreground, shadow-lg, and the arbitrary variant [&>button:last-child]:hidden. That variant hides only the generated close button, which stays out of reach because sheet.tsx is generated and not edited.
       - Inside SheetContent, ONE wrapper div: flex, flex-col, gap-3.5, px-4, pt-2, pb-[max(1.25rem,env(safe-area-inset-bottom))]. It contains:
         - the handle: an aria-hidden div with mx-auto, h-1, w-10, rounded-[2px], bg-input
         - a header row (flex, items-center, justify-between, gap-2) holding:
           - SheetTitle: font-serif, text-[22px], font-semibold, leading-tight
           - SheetClose asChild around a ghost icon Button: size-11, -mr-2.5, text-muted-foreground, aria-label "Fechar"
           - an X icon, size-[22px]
         - an optional SheetDescription (text-sm, text-muted-foreground)
         - the body div (flex, flex-col, gap-3.5, then className) with children
       - Values come from mock lines 568-575.

    5. app/layout.tsx: configure the existing shadcn Toaster (already imported from '@/components/ui/sonner' and rendered in place) directly with props. Do not create a wrapper file; revision 1 removed it to stay within the file budget. sonner.tsx is not edited.
       - layout.tsx is a server component. Every prop below is serializable to the client Toaster: plain objects, strings, and lucide icon elements, which render on the server.
       - Fallback, only if `bun run build` rejects a prop as non-serializable: move the whole configured Toaster into a small client component exported from providers/theme-provider.tsx (already a client module), so the file count does not change. Record it in the SUMMARY.
       Props:
       - position "top-center", richColors.
       - style (cast to React.CSSProperties). This replaces sonner.tsx's style, so set every variable:
         - --normal-bg var(--popover); --normal-text var(--popover-foreground); --normal-border var(--border)
         - for each of success, info, warning and error: -bg var(--popover) and -text var(--popover-foreground)
         - --success-border var(--border); --info-border var(--border); --warning-border var(--warning); --error-border var(--destructive)
         - --border-radius var(--radius)
       - icons, all size-5 and aria-hidden:
         - success: Check, text-success
         - error: CloudOff, text-destructive
         - warning: RefreshCw, text-warning, animate-[ficha-spin_1.2s_linear_infinite]
         - info: Info, text-muted-foreground
         - loading: LoaderCircle, animate-ficha-spin, text-muted-foreground
       - toastOptions.classNames, written with Tailwind v4 trailing-! important utilities. Sonner injects UNLAYERED CSS that beats layered utilities otherwise.
         - toast: items-start!, gap-3!, p-3.5!, shadow-lg!, font-sans!
         - title: text-[15px]!, font-semibold!, leading-snug!
         - description: text-sm!, text-muted-foreground!
         - icon: size-5!
       - Values come from mock lines 558-562 and 889-895.

    6. Change nothing else in app/layout.tsx in this task (fonts, html classes, ThemeProvider and QueryProvider stay as Task 1 left them).

    7. lib/api/queries.ts (DD-07): in useUpdateCharacter, change only the conflict notifier's toast call from the error variant to sonner's warning variant, with the same (message, options) arguments. The design shows a save conflict with a warning border and a refresh icon, not as a failed save (README Toasts). The message text, toast id, refetch and every other line stay as they are.

    8. components/ui/design-primitives.render.test.ts (created in Task 2): append describe blocks for 'section-card', 'numeric-display' and 'stat-tile', keeping the existing inline-field-state block intact. Use bun:test with renderToString and createElement, no JSX, and no import of '@/lib/api/queries'. Assert:
       - SectionCard with title "Vitalidade" and data-section "vitality" renders a section containing data-section="vitality", an h2, font-serif, rotate-45, bg-primary, shadow-card, break-inside-avoid, plus the action and children text.
       - tone 'berkana' renders bg-berkana; headingLevel 'h3' renders an h3.
       - NumericDisplay with value 56, max 450 and size 'hero' contains font-numeric, tabular-nums, text-[56px], 56, 450 and text-muted-foreground. Without max, the output contains no "/".
       - StatTile with label "Agilidade" and value 7 contains bg-muted, font-numeric and Agilidade; variant 'bare' omits bg-muted.
       - BottomSheet is covered by tsc, since Radix portals render nothing in renderToString.

    Run the full gate; commit as feat(261101-mvt).
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && for f in section-card numeric-display stat-tile bottom-sheet; do test -f "components/ui/$f.tsx" || { echo "missing $f"; exit 1; }; done && grep -q 'side="bottom"' components/ui/bottom-sheet.tsx && grep -rq 'richColors' app/layout.tsx providers/theme-provider.tsx && grep -rq 'position="top-center"' app/layout.tsx providers/theme-provider.tsx && grep -rq -- '--warning-border' app/layout.tsx providers/theme-provider.tsx && [ "$(grep -c 'toast.warning(message, options)' lib/api/queries.ts)" -ge 1 ] && bun test components/ui/design-primitives.render.test.ts && npx tsc --noEmit && bun run lint 2>&1 | grep -q '(0 errors, 1 warning)' && bun test && bun run build && grep -rqzE --include='*.css' '\.font-numeric[[:space:]]*\{[^}]*var\(--font-numeric\)' .next/static && grep -rqzE --include='*.css' '\.shadow-card[[:space:]]*\{[^}]*var\(--shadow-card\)' .next/static && B=$(cat "$(git rev-parse --git-path gsd-261101-mvt-base)") && git cat-file -e "$B^{commit}" && D=$(git diff --name-only "$B" -- lib/calculations lib/schemas lib/api/character-concurrency.ts prisma package.json bun.lock components/ui/sonner.tsx components/ui/sheet.tsx components/ui/button.tsx components/ui/input.tsx components/ui/textarea.tsx) && [ -z "$D" ] && echo FOUNDATION-OK</automated>
    <human-check>
      End-of-phase walkthrough, using `bun dev`:
      1. Open /characters in a fresh profile. The page is in the dark iron/ember palette, body text is Barlow, and the toggle (44px, right of the title) switches to the light parchment palette. Reload: the choice persists.
      2. Open a character sheet in edit mode:
         - an inline text field shows a dashed box at least 44px tall
         - tapping it shows the ember ring
         - Enter shows a spinner, then a green check for about 1.5 s, then the dashed box again
         - at phone width (DevTools device mode), edit a field, change its text, then tap the 44px X: the old value comes back, no spinner appears, and no PUT shows in the Network tab (DD-01)
      3. DevTools → Network → Offline. Edit a field and press Enter. The field shows the red border, the cloud-off icon and "Não salvou · tentar de novo". Go back online and tap the retry text: the field saves.
      4. Lock edit mode: the fields become plain text with no border.
      5. Delete a character from the list: the success toast appears top-center with a check icon, and the delete dialog overlay uses the design overlay tint.
      6. Spell damage/duration fields (scaling field) show the same states, with 44px save/cancel buttons.
    </human-check>
  </verify>
  <done>
    - SectionCard, NumericDisplay, StatTile and BottomSheet exist with the documented APIs, and their render tests in design-primitives.render.test.ts pass.
    - The built CSS has a .font-numeric rule reading var(--font-numeric) and a .shadow-card rule reading var(--shadow-card).
    - The Toaster in app/layout.tsx carries the design configuration. Conflict toasts use the warning variant.
    - No calculation, schema, concurrency, Prisma, package or generated shadcn file changed since the base commit.
    - tsc passes, lint still reports exactly 1 warning, bun test and bun run build pass. FOUNDATION-OK is printed.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser localStorage → next-themes | The stored theme value is client-controlled and applied as a class on html |
| server / app messages → sonner toasts | Toast text comes from app constants and API error strings and is rendered by React as text |
| inline field UI → PUT /api/characters/:id | Every inline save still goes through useUpdateCharacter (expectedUpdatedAt, 409 handling). This item adds a retry trigger only |
| build → Google Fonts | next/font downloads the font files at build time and self-hosts them; the browser makes no runtime third-party font request |

## STRIDE Threat Register

ASVS level 1; block on: high.

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-mvt-01 | Tampering (duplicate/lost/unintended writes) | InlineFieldRetry and the cancel X in edit mode (editable-field.tsx) | medium | mitigate | In edit mode, both the retry button and the 44px cancel X prevent mousedown, so the input does not blur. Retry calls the unchanged handleSave once, with no parallel blur-save. Cancel calls the unchanged handleCancel and sends no write, because no blur-save fires first (DD-01). Writes still go through the per-character serial save queue with expectedUpdatedAt. The Task 2 invariant gate proves buildUpdateData, the props and the single mutateAsync call are unchanged |
| T-mvt-02 | Information disclosure | Removed raw mutation error text under inline fields | low | mitigate | The field now shows the fixed pt-BR text "Não salvou · tentar de novo" instead of the server error message; the existing console.error stays (CLAUDE.md allows console.error) |
| T-mvt-03 | Information disclosure / Tampering (third-party runtime fetch) | Fonts and icons | low | mitigate | Fonts load through next/font (self-hosted at build), and icons come from the bundled lucide-react. Task 1 has a guard requiring zero matches for '@import url', 'fonts.googleapis' or 'unpkg' across app/globals.css and app/layout.tsx. The guard also passes at HEAD, so it catches regressions such as pasting the token file's Google Fonts import or the mock's icon-font CDN link. The positive proof is a separate Task 1 gate: the built CSS under .next/static contains the next/font variable --font-barlow-semi-condensed |
| T-mvt-04 | Tampering (stored XSS via toast or theme value) | Toaster config in app/layout.tsx, ThemeProvider | low | accept | Sonner renders title and description as React text (no HTML). next-themes only maps the stored value onto the configured light/dark themes, and a tampered value only affects the user's own browser. There is no auth by design (project decision), and nothing here crosses users |
| T-mvt-05 | Denial of service (unusable UI) | globals.css token rewrite | medium | mitigate | Every shadcn variable name is kept, sidebar names are aliased, and the self-referencing spacing entry is removed so Tailwind's default spacing applies. Each self-referencing font/shadow entry is backed by a :root (and .dark) definition, a pattern verified during planning against Tailwind 4.1.11. The build plus a built-CSS grep and the human walkthrough confirm the rendering |
| T-mvt-SC | Tampering | npm/bun package installs | low | accept | No packages are installed and package.json/bun.lock are unchanged (next-themes, sonner and lucide-react are existing deps). The Task 3 gate fails if package.json or bun.lock change, so there is no package-legitimacy surface |
</threat_model>

<verification>
Full gate, run from the repo root after Task 3:
- `npx tsc --noEmit` exits 0
- `bun run lint` prints "(0 errors, 1 warning)": the pre-existing route.ts warning, with no new ones
- `bun test` exits 0 (183 baseline tests plus the components/ui/design-primitives.render.test.ts suite)
- The built CSS has `.font-numeric` reading `var(--font-numeric)`, `.shadow-card` reading `var(--shadow-card)`, and the body rule reading `var(--font-sans)`
- `bun run build` exits 0, and the built CSS under .next/static contains --vitality-notavel, ficha-spin and --font-barlow-semi-condensed
- The save-logic invariant loop from Task 2 passes against the base commit recorded in Task 1 Step 0
- `git diff --name-only <base> -- lib/calculations lib/schemas lib/api/character-concurrency.ts prisma package.json bun.lock` plus the generated shadcn files is empty
- Human walkthrough (end-of-phase mode): Task 3's `<human-check>`
</verification>

<success_criteria>
- DS-01 tokens, fonts, ThemeProvider (default dark) and the list-header toggle are live
- The inline-edit primitives show all six design states, while their save logic and props are byte-identical
- SectionCard, NumericDisplay, StatTile and BottomSheet exist at the documented paths with the documented props, so 261101-mvu..mvz can import them directly. Toasts get the design look from the Toaster configured in app/layout.tsx
- No business logic or derived-number change
- tsc, lint (no new warnings), bun test and build pass
</success_criteria>

<output>
Create `.planning/quick/261101-mvt-redesign-foundation-ds-01-implement-the-ferro-brasa-design-s/261101-mvt-SUMMARY.md` when done. Include:
- the final exported API of every new components/ui file. Copy the `<interfaces>` block and correct it if anything changed, so later items can trust it.
- the palette-color count from Task 1
- whether the saved-timer fallback from Task 2 or the toaster fallback from Task 3 was needed
- every doubtful design-vs-behavior case met beyond DD-01..DD-08, decided per the README "Important" rule (current behavior wins)
- the actual bun test result as printed by the final `bun test` run (pass, fail and file counts), not an estimate
- a note that CLAUDE.md's statement that components/ui/sonner.tsx is the only next-themes importer is now stale (providers/theme-provider.tsx and components/ui/theme-toggle.tsx import it too), along with any other CLAUDE.md line this item made stale, such as the font list in app/layout.tsx. Do NOT edit CLAUDE.md; only record the note
</output>
