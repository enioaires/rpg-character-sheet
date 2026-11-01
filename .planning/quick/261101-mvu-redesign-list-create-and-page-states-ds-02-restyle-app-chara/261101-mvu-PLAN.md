---
phase: quick-261101-mvu
plan: 01
type: execute
wave: 2                     # ADVISORY ONLY: authoritative wave is recomputed by `quick-batch update` from depends_on
depends_on: ["261101-mvt"]  # uses mvt tokens/fonts/ThemeToggle/animate-ficha-*; mvt also edits app/characters/page.tsx
files_modified:
  - components/ui/page-state.tsx
  - components/character/sheet-states.tsx
  - components/character/sheet-states.render.test.ts
  - app/character/[id]/page.tsx
  - app/characters/page.tsx
  - app/create/page.tsx
autonomous: true
requirements: [DS-02]

must_haves:
  truths:
    - "At 390px, /characters shows the design list: a serif 30px 'Personagens' title with a count line, the ThemeToggle, a 48px search box, character cards (serif name, player line, class/race chips, a 'Nível' column (shown uppercase by CSS) with the level in font-numeric and primary color, and a 48px trash button), plus a sticky full-width 52px 'Criar personagem' bottom bar. At md+ the bottom bar is hidden, a 44px 'Criar personagem' button sits in the header, and cards flow in an auto-fill grid (min 320px) capped at 1200px"
    - "Search, pagination and navigation behave as before: the same useCharacters({ page, limit, search }) call with limit 12, typing resets to page 1, Anterior/Próxima are disabled at the bounds, a card opens /character/:id, and create goes to /create. The search input stays mounted while results load because the header no longer unmounts during loading"
    - "Pagination shows Anterior · 'Página X de Y' · Próxima below md. At md+ the existing numbered page buttons (window of up to 5) stay between Anterior and Próxima, so direct page jumps are still available"
    - "Tapping the trash button opens an alert dialog titled 'Excluir <nome>?' with the design text and two 48px buttons, Cancelar and Excluir. Excluir runs the same handleDeleteCharacter (same mutation, same success/error toasts, list refetch) and is disabled while the delete is pending"
    - "An empty list shows the design empty state: 'Nenhum personagem ainda' with no search, or 'Nada encontrado' plus the search term rendered as escaped text. A list load error shows a design error state whose 'Tentar de novo' calls refetch()"
    - "/create matches the design criar screen (44px back button, serif 'Novo personagem', intro text, 52px name and player inputs, 52px 'Criar personagem' and 48px 'Cancelar'). The nine other existing fields remain available in a collapsed 'Mais detalhes (opcional)' section. Submit, validation, toasts and redirect are unchanged"
    - "On /character/:id, loading shows the design skeleton (muted blocks with animate-ficha-pulse, role=status). A 404 shows 'Personagem não encontrado' with the skull icon, any other load error (network failure or server error, which fetchCharacter cannot tell apart) shows 'Não foi possível carregar a ficha' / 'Verifique a conexão ou tente de novo em instantes.' with the cloud-off icon and 'Tentar de novo' (DEC-11), and both offer 'Voltar para a lista'. The header, CharacterLayout mount and sanitizedCharacter code (owned by 261101-mvv) are byte-identical to this item's base commit"
    - "No hook, schema, calculation or API file changes: nothing under lib/ or app/api/ differs from the base commit"
    - "npx tsc --noEmit, bun run lint (0 errors, still exactly 1 warning), bun test and bun run build all pass"
  artifacts:
    - path: "components/ui/page-state.tsx"
      provides: "Centered page-level state (icon circle, serif title, muted text, action column) and the ficha-pulse skeleton block"
      exports: ["PageState", "PageStateVariant", "SkeletonBlock"]
    - path: "components/character/sheet-states.tsx"
      provides: "Character page loading skeleton, not-found and load-error screens, and the 404 classifier"
      exports: ["CharacterSheetSkeleton", "CharacterNotFoundState", "CharacterLoadErrorState", "isCharacterNotFoundError"]
    - path: "components/character/sheet-states.render.test.ts"
      provides: "bun tests: 404 classifier cases, renderToString of the skeleton, not-found and load-error screens, PageState variants and text escaping"
    - path: "app/characters/page.tsx"
      provides: "Redesigned list (header + search + cards + delete alert + pagination + empty/loading/error + mobile bottom bar / desktop header button)"
      contains: "Buscar por nome ou jogador"
    - path: "app/create/page.tsx"
      provides: "Redesigned create screen keeping all 11 form fields"
      contains: "Mais detalhes (opcional)"
    - path: "app/character/[id]/page.tsx"
      provides: "Loading/not-found/error early returns rendered through sheet-states"
      contains: "isCharacterNotFoundError(error)"
  key_links:
    - from: "app/character/[id]/page.tsx"
      to: "components/character/sheet-states.tsx"
      via: "isLoading → CharacterSheetSkeleton; error → isCharacterNotFoundError(error) ? CharacterNotFoundState : CharacterLoadErrorState; !character → CharacterNotFoundState"
      pattern: "isCharacterNotFoundError(error)"
    - from: "components/character/sheet-states.tsx"
      to: "lib/api/queries.ts"
      via: "isCharacterNotFoundError matches the exact message thrown by fetchCharacter on a 404 (no import; the literal is pinned by the verify gate)"
      pattern: "Character not found"
    - from: "components/character/sheet-states.tsx"
      to: "components/ui/page-state.tsx"
      via: "PageState variant 'error' + SkeletonBlock"
      pattern: "<PageState"
    - from: "app/characters/page.tsx"
      to: "components/ui/page-state.tsx"
      via: "PageState (empty + error variants) and SkeletonBlock (list skeleton)"
      pattern: "<SkeletonBlock"
    - from: "app/characters/page.tsx"
      to: "components/ui/theme-toggle.tsx"
      via: "<ThemeToggle /> kept in the redesigned header (added by 261101-mvt)"
      pattern: "<ThemeToggle"
    - from: "app/characters/page.tsx"
      to: "lib/api/queries.ts"
      via: "unchanged useCharacters({ page, limit, search }) + useDeleteCharacter() + handler block (byte-identical gate)"
      pattern: "useCharacters({ page, limit, search })"
---

<objective>
Restyle the list, create and character-page state screens to the Ferro & Brasa design (DS-02):
- /characters: screens `lista` and `vazia`, plus the `excluir` alert dialog
- /create: screen `criar`
- the loading, not-found and load-error early returns of /character/[id]: screens `carregando`, `naoEncontrado` and `erroRede` (look only; copy per DEC-11)

Build mobile-first at 390px, with the mock's wide variant at md (768px) and up.

Purpose: these are the first screens a player sees at the table. They must read as the same system as the sheet that 261101-mvv..mvz restyle, while search, pagination, create, delete, navigation, toasts and every hook keep working exactly as today.

Output:
- one shared presentational file: components/ui/page-state.tsx
- one character-state file plus its render test: components/character/sheet-states.tsx and sheet-states.render.test.ts
- three restyled pages

IMPORTANT, owner rule (read .planning/design/ferro-brasa/README.md, section "Important: the design is visual direction, not a functional spec"):
- Follow the mock's look and layout.
- Where the mock's behavior differs from the current app, the current app wins. That covers available fields and actions, validation, ordering and what each action does.
- Add a mock-only feature only if it is a pure UI convenience over existing data.
- When in doubt, keep the current behavior.
The `<decisions>` block below lists every case this plan already resolved. If you hit a new one during execution, apply the same rule and add it to the SUMMARY.

Not in scope:
- the character page header, CharacterLayout and the sanitizedCharacter block (261101-mvv)
- any change to lib/ (hooks, schemas, calculations) or app/api/
- making the API search by class
- generated shadcn files (alert-dialog.tsx, button.tsx, input.tsx, label.tsx, skeleton.tsx) are not hand-edited; they are styled through className overrides
- no auth (the app is open by design)
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.claude/CLAUDE.md
@.planning/design/ferro-brasa/README.md
# Ficha.dc.html is about 106 KB. Read only these line ranges:
# - lista + vazia markup: 23-81
# - criar: 83-104
# - erros: 106-122
# - carregando: 124-149
# - excluir alert: 637-648
# - list/erros logic: 897-918
@.planning/design/ferro-brasa/Ficha.dc.html
@.planning/quick/261101-mvt-redesign-foundation-ds-01-implement-the-ferro-brasa-design-s/261101-mvt-PLAN.md
# Read its <interfaces> block (and 261101-mvt-SUMMARY.md if present: it is the corrected final API)
@app/characters/page.tsx
@app/create/page.tsx
@app/character/[id]/page.tsx
@lib/api/queries.ts
@components/ui/alert-dialog.tsx
@components/ui/button.tsx
@components/ui/input.tsx
@components/character/notes-tab.render.test.ts

<interfaces>
From 261101-mvt (already in the tree when this item runs; check its SUMMARY for corrections):
- Utilities:
  - font-serif (Spectral), font-numeric (Barlow Semi Condensed; always pair it with tabular-nums)
  - shadow-card, shadow-lg
  - rounded-md = var(--radius) = 4px, so rounded-(--radius) is equivalent
  - animate-ficha-pulse, animate-ficha-spin
  - bg-overlay, text-success, text-warning
  - all shadcn color names (bg-card, bg-popover, bg-secondary, text-muted-foreground, bg-destructive, text-destructive-foreground, border-input, ring-ring, ...)
- `ThemeToggle({ className? })` from '@/components/ui/theme-toggle': a 44px ghost icon button. It MUST stay in the /characters header.
- The overlay of the shadcn AlertDialog already uses var(--overlay) through mvt's global rule, so no overlay class is needed.

Existing hooks, used unchanged (lib/api/queries.ts):
- `useCharacters(params?: { page?, limit?, search? })` returns a useQuery result. Its data is `{ characters: CharacterListItem[], total, ... }`.
  - CharacterListItem: id, characterName, playerName, class (string | null), race (string | null), level (number), updatedAt (string on the client)
  - The API searches characterName and playerName only (app/api/[[...route]]/characters/index.ts).
  - There is no placeholderData, so every new search term makes isLoading true until results arrive.
- `useDeleteCharacter()` returns a mutation; use mutateAsync(id).
- `useCreateCharacter()` returns a mutation; use mutateAsync(formData) and read response.character.id.
- `useCharacter(id)` returns a useQuery result. fetchCharacter throws `new Error('Character not found')` on a 404 and `new Error('Failed to fetch character')` on other HTTP errors. A network failure throws the fetch TypeError.

NEW in this item (downstream items 261101-mvv..mvz may reuse them):

components/ui/page-state.tsx (no 'use client'; server-safe):
- `type PageStateVariant = 'empty' | 'error'`
- `PageState({ icon, variant = 'empty', title, description?, headingLevel = 'h2', className?, children?, ...divProps })`
  - icon: LucideIcon
  - title and description: React.ReactNode
  - divProps: the remaining div props, minus 'title'
  - Root: a div with flex, flex-1, flex-col, items-center, justify-center, gap-3, px-3, py-10 and text-center, then className.
  - Icon circle: grid, size-16, place-items-center, rounded-full, border. The icon is size-7 and aria-hidden. Its color is text-muted-foreground for 'empty' and text-destructive for 'error'.
  - Heading (the h2 or h3 tag from headingLevel): m-0, font-serif and font-semibold, plus text-[22px] for 'empty' or text-2xl for 'error'.
  - Description: a p with m-0, text-[15px], text-muted-foreground and text-pretty, plus max-w-[280px] for 'empty' or max-w-[300px] for 'error'.
  - When children are given, they render inside a div with flex, w-full, max-w-[300px], flex-col, gap-2.5 and pt-2. This is the action column.
  - Values come from mock lines 75-79 (empty) and 110-120 (error).
- `SkeletonBlock({ className?, pulse = true, ...divProps })`: an aria-hidden div with rounded-(--radius) and bg-muted, plus animate-ficha-pulse when pulse is true, then className. Callers pass only the size (h-*, w-*).
  - Do NOT use components/ui/skeleton.tsx with an animate override: tailwind-merge does not know the custom ficha-pulse animation, so both animate classes would survive.

components/character/sheet-states.tsx ('use client', because RetryButton holds state):
- `isCharacterNotFoundError(error: unknown): boolean` returns true only for an Error whose message is exactly the 404 literal thrown by fetchCharacter, 'Character not found'.
  - Keep that literal in one module constant, with a Portuguese comment pointing at fetchCharacter in lib/api/queries.ts.
  - Do not import lib/api/queries (its tests mock it process-wide).
- `CharacterSheetSkeleton()`: the `carregando` screen.
- `CharacterNotFoundState({ onBack, onRetry? })`: the `naoEncontrado` screen. The retry button renders only when onRetry is given.
- `CharacterLoadErrorState({ onBack, onRetry })`: the `erroRede` screen.
- Types: onBack is `() => void`; onRetry is `() => void | Promise<unknown>`.
</interfaces>
</context>

<decisions>
Planner decisions, made under the owner rule (look from the mock, behavior from the app). Copy each one into the SUMMARY with its outcome.

- DEC-1, create fields:
  - The mock's criar screen shows only name and player. The app's create form has 11 fields: characterName, playerName, class, race, deity, homeland, alignment, gender, age, weight, height.
  - Dropping nine of them would remove an existing capability, so keep them. The main view matches the mock exactly (name + player). The other nine sit in a native `<details>` "Mais detalhes (opcional)" section, collapsed by default.
  - Same ids, same state keys, same placeholders, same handleInputChange calls. The submit payload is identical.
- DEC-2, pagination:
  - The mock shows Anterior · "Página X de Y" · Próxima. The app has numbered page buttons: a window of 3 on narrow screens, 5 on wide ones.
  - The 3-button window, centered on the current page, reaches at most what Anterior and Próxima reach (except one extra page at the edges), so below md the design label replaces it.
  - At md+ the 5-button window stays, with the same start-page formula and maxVisible fixed at 5. This keeps direct jumps.
  - The render-time viewport-width read is removed. Responsive CSS (md:hidden / hidden md:flex) does the switch instead. This also removes a hydration hazard.
  - The page state, limit 12, reset to page 1 on search, and bounds-disabled buttons are unchanged.
- DEC-3, search placeholder: the mock says "Buscar por nome, jogador ou classe", but the API searches only name and player. Use the truthful "Buscar por nome ou jogador". Do not change the API.
- DEC-4, card details:
  - The mock card has no "updated" time. The app shows the relative updatedAt.
  - Keep that information in the muted player line, as "<player> · atualizada há 2 dias", or only "atualizada há 2 dias" when there is no player.
  - Class and race chips render only when the field is non-empty. The "Sem nome" fallback for an empty name stays.
- DEC-5, persistent header:
  - Today the list's loading and error states replace the whole page, which unmounts the search input after every keystroke.
  - The header, with the title, ThemeToggle and search, now always renders. Loading, error, empty and list states render below it.
  - Hooks are unchanged; this is a render-structure change only.
- DEC-6, delete dialog:
  - Same AlertDialog per card, the same handleDeleteCharacter(character.id, character.characterName) call, disabled while pending, and the same toasts (the existing "deletado com sucesso" and "Erro ao deletar personagem" strings stay as they are).
  - Only the look and copy change, per mock 637-648: title "Excluir <nome>?" and the description "A ficha e todas as anotações serão apagadas. Essa ação não pode ser desfeita."
- DEC-7, not-found retry:
  - The mock's naoEncontrado has no retry. Today the error branch offers "Tentar Novamente" for every load error, including a 404.
  - Keep it: the 404 case passes onRetry={handleRefresh}.
  - The `!character` branch had no retry before and still has none.
- DEC-8, error texts: the error screens show fixed pt-BR texts instead of the raw error.message, which was English and server-derived. The not-found screen uses the design copy; the load-error copy follows DEC-11. The list error keeps its existing title, "Erro ao carregar personagens".
- DEC-9, empty-state button:
  - The old empty state had its own create button. The design's create entry is always visible: the sticky bottom bar below md and the header button at md+. So the empty state carries no extra button, and create stays one tap away.
  - The "Mostrando X a Y de Z personagens" line is replaced by the header count and the pagination label.
- DEC-10, retry feedback: RetryButton, inside sheet-states, keeps a local isRetrying state while onRetry's promise runs. During that time it is disabled and shows a spinner. The page's hook destructuring and handleRefresh are not touched; handleRefresh's toasts are unchanged.
- DEC-11, load-error copy (coordinator decision):
  - The mock's erroRede says "Sem conexão". But fetchCharacter throws the same kind of error for a network failure and for a server 500 (and useCharacters cannot tell them apart either), so that title would be false for a server error.
  - Keep the design's look (icon circle, layout, "Tentar de novo" + "Voltar para a lista"), with copy that is true in both cases: title "Não foi possível carregar a ficha", description "Verifique a conexão ou tente de novo em instantes."
  - Icon: CloudOff instead of the mock's wifi-off, because it does not claim a lost connection; it is also the design's "failed" icon for saves and toasts.
  - The list error uses the same icon and description under its existing title.
</decisions>

<coverage_audit>
| Source | Item | Covered by |
|--------|------|------------|
| GOAL | Screen lista: header, count, search, cards, level column, trash, pagination, narrow bottom bar, wide header button | Task 2 |
| GOAL | Screen vazia, plus "Nada encontrado" for a search | Task 2 (PageState 'empty') |
| GOAL | Excluir alert dialog: "Excluir <nome>?", Cancelar/Excluir | Task 2 (DEC-6) |
| GOAL | Screen criar | Task 3 (DEC-1) |
| GOAL | carregando skeleton with ficha-pulse | Task 1 (CharacterSheetSkeleton) |
| GOAL | naoEncontrado, erroRede | Task 1 (DEC-7, DEC-8, DEC-11) |
| GOAL | Mobile-first at 390px and the wide desktop layout | Tasks 2-3 (md breakpoint), Task 1 (max-w containers); human-check |
| GOAL | Keep search, pagination, create, delete, navigation behavior and hooks exactly | Byte-identical handler/hook gates in Tasks 1-3; lib/app/api diff gate; DEC-2..DEC-6 |
| CONTEXT (coordinator) | Keep `<ThemeToggle />` in the list header | Task 2 gate |
| CONTEXT (coordinator) | Own only the loading/not-found/error branches of the character page; keep edits minimal | Task 1 (handler block + Sanitizar-to-EOF byte-identical gates) |
| CONTEXT (coordinator) | Real data from hooks; mock data illustrative | Count label from `total`; level from list item; no mock numbers |
| CONTEXT (coordinator) | Lucide classes → lucide-react; token utilities, not inline styles | All tasks |
| CONTEXT (owner rule) | Look from the mock, behavior from the app; record decisions | `<decisions>` DEC-1..DEC-11 → SUMMARY |
| CONTEXT (coordinator) | DoD: tsc, lint (0 errors, no new warnings), bun test, build | Task 3 verify + `<verification>` |
| RESEARCH (README) | Skeleton = muted + ficha-pulse; 44px touch targets, 48-56px primary actions; radius 4px; serif titles; numbers in font-numeric + tabular-nums | Tasks 1-3 |
| CONTEXT (memory) | No auth by design | Nothing added |
</coverage_audit>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Tracer — shared PageState/SkeletonBlock and the character page loading / not-found / network-error screens, wired into app/character/[id]/page.tsx</name>
  <files>components/ui/page-state.tsx, components/character/sheet-states.tsx, components/character/sheet-states.render.test.ts, app/character/[id]/page.tsx</files>
  <read_first>
    - .planning/design/ferro-brasa/Ficha.dc.html lines 106-149 (erros + carregando markup) and 900-904 (erros copy)
    - .planning/design/ferro-brasa/README.md (the "Important" section)
    - app/character/[id]/page.tsx (whole file: you edit ONLY the three early-return bodies and the imports)
    - lib/api/queries.ts lines 43-63 (fetchCharacter's error literals; read only, do not edit)
    - components/character/notes-tab.render.test.ts (renderToString + createElement pattern; .ts file, no JSX)
    - 261101-mvt SUMMARY or PLAN `<interfaces>` (token utilities)
  </read_first>
  <behavior>
    - isCharacterNotFoundError(new Error('Character not found')) → true
    - isCharacterNotFoundError(new Error('Failed to fetch character')) → false; new TypeError('Failed to fetch') → false; the bare string 'Character not found' → false; null → false; undefined → false
    - renderToString(CharacterSheetSkeleton) contains role="status", aria-busy="true", animate-ficha-pulse and the sr-only text "Carregando personagem…"
    - CharacterNotFoundState({ onBack }) contains "Personagem não encontrado", "Esta ficha pode ter sido excluída ou o link está errado.", "Voltar para a lista", aria-label="Voltar", lucide-skull, and text-destructive. It does NOT contain "Tentar de novo"
    - CharacterNotFoundState({ onBack, onRetry }) contains "Tentar de novo"
    - CharacterLoadErrorState({ onBack, onRetry }) contains "Não foi possível carregar a ficha", "Verifique a conexão ou tente de novo em instantes.", "Tentar de novo", "Voltar para a lista" and lucide-cloud-off. It does NOT contain "Sem conexão" (DEC-11)
    - PageState variant 'empty' contains text-[22px] and font-serif and no text-destructive; variant 'error' contains text-destructive and text-2xl
    - PageState with description 'Nenhuma ficha com “<script>alert(1)</script>”' renders &lt;script&gt; and no raw <script>
  </behavior>
  <action>
    Step 0: record this item's base commit for the invariant gates, before editing anything. Run git rev-parse HEAD and write the output to the path printed by git rev-parse --git-path gsd-261101-mvu-base. 261101-mvt has already committed, so this base includes its changes.

    RED: create components/character/sheet-states.render.test.ts.
    - Use bun:test with renderToString from react-dom/server and createElement from react. The file is .ts, so use no JSX.
    - Import from './sheet-states' and '@/components/ui/page-state'. Do NOT import '@/lib/api/queries': notes-tab.render.test.ts mocks it process-wide.
    - Cover every `<behavior>` line. Pass no-op functions for onBack and onRetry.
    - Run it, see it fail (the modules do not exist yet), and commit as test(261101-mvu).

    GREEN 1, components/ui/page-state.tsx (new; single quotes, no semicolons, 2-space indentation, cn from '@/lib/utils', no client directive):
    - Implement PageState, PageStateVariant and SkeletonBlock exactly as in `<interfaces>`.
    - Import LucideIcon as a type from 'lucide-react'.
    - Text is rendered as React children only; no HTML injection API of any kind.

    GREEN 2, components/character/sheet-states.tsx (new; 'use client'; same style). Shared pieces inside the file:
    - A private constant holding the 404 message literal from fetchCharacter, with a Portuguese comment: "mensagem lançada por fetchCharacter (lib/api/queries.ts) no 404; se mudar lá, mude aqui".
    - isCharacterNotFoundError: an Error instance whose message equals that constant.
    - A private StateTopBar({ onBack }): a header with border-b and p-2. Inside, a div with mx-auto, flex, w-full, max-w-[1200px] and items-center holds a Button with variant ghost, size icon, className size-11 and aria-label "Voltar". It contains ArrowLeft (size-[22px], aria-hidden) and its onClick is onBack. Mock line 107-108.
    - A private RetryButton({ onRetry }), the 48px primary action (mock line 116):
      - local state isRetrying (useState false)
      - onClick: set true, await onRetry() inside try/finally, then set false
      - Button className h-12, w-full and font-semibold, disabled while isRetrying
      - icon: LoaderCircle with animate-ficha-spin while retrying, otherwise RefreshCw, size-[18px], aria-hidden
      - label "Tentar de novo"
      - This is DEC-10. Setting state in an event handler is lint-safe; do not set state in an effect.
    - A private BackToListButton({ onBack }): Button variant outline, className h-12, w-full, bg-transparent and dark:bg-transparent, label "Voltar para a lista" (mock line 119).
    CharacterNotFoundState: a root div with flex, min-h-dvh and flex-col. It holds StateTopBar, then PageState with:
    - variant 'error', icon Skull, title "Personagem não encontrado"
    - description "Esta ficha pode ter sido excluída ou o link está errado."
    - className p-6
    - children: RetryButton only when onRetry is provided (DEC-7), then BackToListButton
    CharacterLoadErrorState: the same frame with:
    - icon CloudOff, title "Não foi possível carregar a ficha" (DEC-11)
    - description "Verifique a conexão ou tente de novo em instantes."
    - children: RetryButton, then BackToListButton
    CharacterSheetSkeleton follows mock lines 124-149, built only from SkeletonBlock and token classes:
    - root: a div with role="status", aria-live="polite", aria-busy, flex, min-h-dvh and flex-col, plus a span with sr-only "Carregando personagem…"
    - header: border-b, px-4, py-3. Inner: mx-auto, flex, max-w-[1200px], items-center, gap-3, holding:
      - a size-8 block
      - a flex-1 column with gap-1.5 holding blocks h-[18px] w-3/5 and h-3 w-[35%]
    - tab strip: border-b, px-4, py-2.5. Inner: mx-auto, grid, max-w-[720px], grid-cols-4, gap-2, holding four h-6 blocks with pulse={false}
    - body: flex-1, p-3. Inner: mx-auto, max-w-[1200px], columns-[340px], gap-3 (the sheet's column flow). It holds two card frames.
    - card frame: mb-3, flex, break-inside-avoid, flex-col, gap-3.5, rounded-(--radius), border, bg-card, p-4, shadow-card
      - first card, h-[230px]: blocks w-2/5 h-[18px]; w-[70%] h-12; h-2.5 (pulse false); w-[90%] h-3.5; w-4/5 h-3.5
      - second card, h-[150px]: blocks w-[30%] h-[18px]; w-1/2 h-9
    - bottom placeholder: h-[118px], border-t, bg-card. This is where 261101-mvv's bottom quick-actions bar goes.

    WIRE, app/character/[id]/page.tsx. Keep its 2-space, single-quote, no-semicolon style. Change ONLY:
    (a) Imports: add CharacterSheetSkeleton, CharacterNotFoundState, CharacterLoadErrorState and isCharacterNotFoundError from '@/components/character/sheet-states'. Import directly, not through the components/character barrel, to avoid touching index.ts, which later items edit. Remove the imports these branches no longer use (the Card pair and the spinner icon). ArrowLeft, RefreshCw and Button stay, because the header still uses them.
    (b) The isLoading branch body becomes a return of CharacterSheetSkeleton.
    (c) The error branch body becomes, with a short Portuguese comment ("404 → não encontrado; rede/500 → sem conexão"):
        - when isCharacterNotFoundError(error): CharacterNotFoundState with onBack={handleBack} and onRetry={handleRefresh}
        - otherwise: CharacterLoadErrorState with onBack={handleBack} and onRetry={handleRefresh}
    (d) The !character branch body becomes CharacterNotFoundState with onBack={handleBack} only.
    Leave everything else byte-identical: the hook call, the handlers, the section comments, sanitizedCharacter, the header JSX and the CharacterLayout mount. The verify gate checks this; 261101-mvv owns that code.

    Run the test (green), the gate below, and commit as feat(261101-mvu).
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && BF="$(git rev-parse --git-path gsd-261101-mvu-base)" && test -s "$BF" && B=$(cat "$BF") && git cat-file -e "$B^{commit}" && P='app/character/[id]/page.tsx' && blk() { awk 'index($0,"  const params = useParams()")==1{p=1} p{print} p&&/const handleToggleEditMode = \(\) => \{/{q=1} q&&/^  }$/{exit}'; } && OLD=$(git show "$B:$P") && [ "$(blk < "$P" | wc -l)" -eq 40 ] && diff <(printf '%s\n' "$OLD" | blk) <(blk < "$P") > /dev/null && diff <(printf '%s\n' "$OLD" | sed -n '/Sanitizar dados/,$p' | awk 1) <(sed -n '/Sanitizar dados/,$p' "$P" | awk 1) > /dev/null && grep -q '<CharacterSheetSkeleton' "$P" && grep -q 'isCharacterNotFoundError(error)' "$P" && grep -qF "throw new Error('Character not found')" lib/api/queries.ts && grep -qF "'Character not found'" components/character/sheet-states.tsx && grep -q 'export function PageState' components/ui/page-state.tsx && grep -q 'export function SkeletonBlock' components/ui/page-state.tsx && bun test components/character/sheet-states.render.test.ts && npx tsc --noEmit && bun run lint 2>&1 | grep -qF '(0 errors, 1 warning)' && bun run build && echo TRACER-OK</automated>
  </verify>
  <done>
    - The sheet-states render test passes.
    - /character/:id renders the skeleton, the 404 screen (skull, retry kept per DEC-7) and the load-error screen (cloud-off, retry, DEC-11 copy) through the new components.
    - The page's hook/handler block and everything from the Sanitizar comment to the end of the file are byte-identical to the base.
    - tsc passes; lint is still "(0 errors, 1 warning)"; the build passes; TRACER-OK is printed.
  </done>
</task>

<task type="auto">
  <name>Task 2: Redesign /characters — header with ThemeToggle, search, cards, Excluir alert dialog, pagination, empty/loading/error states, mobile bottom bar and wide header button</name>
  <files>app/characters/page.tsx</files>
  <read_first>
    - .planning/design/ferro-brasa/Ficha.dc.html lines 23-81 (lista + vazia), 637-648 (excluir alert) and 897-918 (list labels and empty copy)
    - app/characters/page.tsx (whole file, as left by 261101-mvt with the ThemeToggle in the header; 4-space indentation, single quotes, no semicolons)
    - components/ui/alert-dialog.tsx (default classes to override: Content has bg-background, p-6, gap-4, w-full, max-w-[calc(100%-2rem)], sm:max-w-lg; Header has text-center sm:text-left; Footer is flex, flex-col-reverse, sm:flex-row; Title is text-lg)
    - components/ui/button.tsx (outline adds bg-background and dark:bg-input/30; size icon is size-9)
    - components/ui/page-state.tsx (from Task 1)
  </read_first>
  <action>
    Rewrite only the JSX and imports of app/characters/page.tsx. Keep the file's 4-space indentation, single quotes, no semicolons and the "use client" line.

    Keep these byte-identical (the verify gate diffs them against the base):
    - the block from the useRouter line through the useDeleteCharacter line: router, search/page state, limit = 12, the useCharacters({ page, limit, search }) destructuring and the delete mutation
    - the block from handleCreateCharacter through the end of handleSearch: all four handlers with their toasts, refetch and page reset

    Derived values (move them above the return; there are no early returns any more, per DEC-5):
    - characters, total and totalPages are computed exactly as today.
    - countLabel:
      - isLoading → "Carregando fichas…"
      - error → an empty string
      - total 0 with no search → "Nenhuma ficha ainda"
      - search set → "1 ficha encontrada" or "N fichas encontradas"
      - otherwise → "1 ficha" or "N fichas"
      - Do not export anything from the page: Next.js rejects extra page exports.

    Layout:
    - Root: a div with flex, min-h-dvh and flex-col.

    1. Header (mock 24-36): a header with sticky, top-0, z-10, border-b and bg-background. Inner: mx-auto, flex, w-full, max-w-[1200px], flex-col, gap-3.5, px-4, pt-5, pb-3.
       - Row: flex, items-end, justify-between, gap-3.
         - Left: a flex-col with gap-0.5 holding:
           - h1 "Personagens": m-0, font-serif, text-[30px], font-semibold, leading-[1.1]
           - a span with text-sm and text-muted-foreground showing countLabel
         - Right: flex, items-center, gap-2, holding:
           - the existing ThemeToggle, kept as required by 261101-mvt
           - a Button onClick={handleCreateCharacter} with hidden, h-11, gap-2, px-[18px], text-[15px], font-semibold and md:inline-flex, containing Plus (size-[18px]) and "Criar personagem". This is the wide variant.
       - Search (mock 33-36): a label with flex, h-12, items-center, gap-2.5, rounded-(--radius), border, border-input, bg-card and px-3.5, plus focus-within:border-ring, focus-within:ring-[3px] and focus-within:ring-ring/30. It holds:
         - Search (size-[18px], text-muted-foreground, aria-hidden)
         - a plain input with type="search", aria-label "Buscar personagens", value={search}, onChange calling handleSearch(e.target.value) exactly as today, and placeholder "Buscar por nome ou jogador" (DEC-3). Classes: h-full, min-w-0, flex-1, bg-transparent, text-base, outline-none, placeholder:text-muted-foreground.

    2. Body: a div with flex-1. Inner: mx-auto, flex, w-full, max-w-[1200px], flex-col, gap-2.5, px-4, pt-3, pb-4. Exactly one of these renders:
       a. isLoading: a div with role="status", aria-live="polite" and aria-busy, holding an sr-only span "Carregando personagens…" and the same grid as (d), with 4 skeleton cards.
          - Each skeleton card is an aria-hidden li with flex, rounded-(--radius), border, bg-card and shadow-card.
          - Left part: flex-1, flex-col, gap-2, p-4, holding SkeletonBlock h-5 w-3/5 and h-3.5 w-2/5, then a row of SkeletonBlocks h-5 w-16 and h-5 w-14.
          - Right part: w-16, flex-col, items-center, justify-center, gap-1, holding SkeletonBlock h-3 w-9 and size-7.
       b. error: PageState with:
          - variant 'error', icon CloudOff, title "Erro ao carregar personagens" (existing title, DEC-8)
          - description "Verifique a conexão ou tente de novo em instantes." (DEC-11)
          - action: a Button with onClick={() => refetch()} (unchanged call), h-12, w-full and font-semibold, containing RefreshCw (size-[18px]) and "Tentar de novo"
       c. characters.length === 0: PageState with variant 'empty' and icon ScrollText (mock 74-79).
          - With search: title "Nada encontrado", description "Nenhuma ficha com “{search}”. Tente outro nome." The search term is a plain JSX expression, so React escapes it.
          - Without search: title "Nenhum personagem ainda", description "Crie a primeira ficha. Só precisa do nome do personagem e do jogador."
          - No button inside (DEC-9).
       d. Otherwise, the list:
          - A ul with role="list", grid, gap-2.5 and grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))].
          - For each character, compute name = characterName or 'Sem nome', and render an li with flex, items-stretch, overflow-hidden, rounded-(--radius), border, bg-card and shadow-card (mock 41-60).
          - Open button: a button type="button", onClick={() => handleViewCharacter(character.id)}.
            - Classes: flex, min-w-0, flex-1, items-center, gap-3.5, py-3.5, pr-1, pl-4, text-left, outline-none, hover:bg-muted/40, focus-visible:ring-[3px], focus-visible:ring-inset, focus-visible:ring-ring/50.
            - Use only span elements inside (a button allows phrasing content only):
              - Details span: flex, min-w-0, flex-1, flex-col, gap-1.5, holding:
                - the name: truncate, font-serif, text-xl, font-semibold, leading-[1.15]
                - the player/updated line (DEC-4): truncate, text-sm, text-muted-foreground. It shows the playerName followed by " · " when present, then "atualizada " plus the existing formatDistanceToNow(new Date(character.updatedAt), { addSuffix: true, locale: ptBR }) call.
                - when class or race is present, a chips span (flex, flex-wrap, gap-1.5) with:
                  - class: rounded-(--radius), bg-secondary, px-2, py-0.5, text-[13px], text-secondary-foreground
                  - race: rounded-(--radius), border, px-2, py-0.5, text-[13px], text-muted-foreground
                  - each chip renders only when its field is non-empty
              - Level span: flex, min-w-12, flex-none, flex-col and items-center, holding:
                - a span "Nível" with text-[11px], uppercase, tracking-[0.1em], text-muted-foreground
                - a span with character.level: font-numeric, text-[30px], font-semibold, leading-none, tabular-nums, text-primary
          - Delete: an AlertDialog whose AlertDialogTrigger asChild wraps a button type="button".
            - aria-label={`Excluir ${name}`}
            - classes: grid, w-12, flex-none, place-items-center, border-l, text-muted-foreground, hover:text-destructive, outline-none, focus-visible:ring-[3px], focus-visible:ring-inset, focus-visible:ring-ring/50
            - content: Trash2, size-[18px], aria-hidden
          - The dialog (DEC-6, mock 640-646):
            - AlertDialogContent className: w-[calc(100%-2.5rem)], max-w-[400px], sm:max-w-[400px], gap-3, bg-popover, p-5, text-popover-foreground
            - AlertDialogHeader className: gap-3, text-left, sm:text-left
            - AlertDialogTitle className: font-serif, text-[22px], font-semibold, leading-tight. Text: Excluir {name}?
            - AlertDialogDescription className: text-[15px], text-pretty. Text: "A ficha e todas as anotações serão apagadas. Essa ação não pode ser desfeita."
            - AlertDialogFooter className: grid, grid-cols-2, gap-2, pt-1.5
            - AlertDialogCancel: h-12, w-full, bg-transparent, dark:bg-transparent, text-base, font-semibold. Text "Cancelar".
            - AlertDialogAction keeps onClick={() => handleDeleteCharacter(character.id, character.characterName)} and disabled={deleteCharacterMutation.isPending} unchanged.
              - classes: h-12, w-full, bg-destructive, text-base, font-bold, text-destructive-foreground, hover:bg-destructive/90
              - content: LoaderCircle with animate-ficha-spin while pending, then "Excluir"
          - Pagination (DEC-2), only when totalPages > 1: a nav with aria-label "Paginação", flex, items-center, justify-between, gap-2, pt-1.5 (mock 62-66). It holds:
            - Anterior: a Button variant outline with onClick={() => setPage(page - 1)} and disabled={page === 1} unchanged. Classes: h-11, gap-1.5, bg-transparent, dark:bg-transparent, px-3, text-[15px]. Content: ChevronLeft (size-[18px]), then "Anterior".
            - a span with text-sm, text-muted-foreground, tabular-nums and md:hidden: Página {page} de {totalPages}
            - a div with hidden, items-center, gap-1 and md:flex holding the numbered window:
              - length is Math.min(5, totalPages); the start page is the existing formula with maxVisible = 5
              - each button: Button size icon, className size-11, font-numeric, tabular-nums, variant default for the current page and outline otherwise, aria-current="page" on the current page, onClick={() => setPage(pageNum)}
            - Próxima: mirrors Anterior, with onClick={() => setPage(page + 1)} and disabled={page === totalPages}, content "Próxima" then ChevronRight.

    3. Narrow bottom bar (mock 82-86): a div with sticky, bottom-0, z-10, border-t, bg-card, px-4, pt-3, pb-[max(1.25rem,env(safe-area-inset-bottom))] and md:hidden. It holds a Button onClick={handleCreateCharacter} with h-[52px], w-full, gap-2, text-[17px] and font-semibold, containing Plus (size-5) and "Criar personagem".

    Remove imports that become unused (Card parts, Badge, Input and the old icon set). Lint counts unused imports, so the warning gate catches leftovers. Add the lucide icons you use: Plus, Search, Trash2, LoaderCircle, ChevronLeft, ChevronRight, RefreshCw, CloudOff, ScrollText. Import PageState and SkeletonBlock from '@/components/ui/page-state'.

    Run the gate; commit as feat(261101-mvu).
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && B=$(cat "$(git rev-parse --git-path gsd-261101-mvu-base)") && F=app/characters/page.tsx && hb() { awk 'index($0,"    const handleCreateCharacter = () => {")==1{p=1} p{print} p&&/setPage\(1\)/{q=1} q&&/^    }$/{exit}'; } && kb() { awk 'index($0,"    const router = useRouter()")==1{p=1} p{print} p&&/useDeleteCharacter\(\)/{exit}'; } && OLD=$(git show "$B:$F") && [ "$(hb < "$F" | wc -l)" -eq 22 ] && diff <(printf '%s\n' "$OLD" | hb) <(hb < "$F") > /dev/null && [ "$(kb < "$F" | wc -l)" -ge 10 ] && diff <(printf '%s\n' "$OLD" | kb) <(kb < "$F") > /dev/null && [ "$(grep -c 'window.innerWidth' "$F")" -eq 0 ] && grep -q '<ThemeToggle' "$F" && grep -qF 'Buscar por nome ou jogador' "$F" && grep -qF 'Excluir {name}?' "$F" && grep -qF 'A ficha e todas as anotações serão apagadas. Essa ação não pode ser desfeita.' "$F" && grep -qF 'onClick={() => handleDeleteCharacter(character.id, character.characterName)}' "$F" && grep -qF 'disabled={deleteCharacterMutation.isPending}' "$F" && grep -qF 'onClick={() => refetch()}' "$F" && grep -q '<PageState' "$F" && grep -q '<SkeletonBlock' "$F" && grep -qF 'Página {page} de {totalPages}' "$F" && grep -qF 'md:hidden' "$F" && grep -qF 'font-numeric' "$F" && [ -z "$(git diff --name-only "$B" -- lib app/api)" ] && npx tsc --noEmit && bun run lint 2>&1 | grep -qF '(0 errors, 1 warning)' && echo LIST-OK</automated>
  </verify>
  <done>
    - The list renders the design header (with ThemeToggle), search, cards, delete dialog, pagination and narrow/wide create entries.
    - The handler block and the hook block are byte-identical to the base, the render-time viewport-width read is gone, and nothing under lib/ or app/api/ changed.
    - tsc passes; lint is still "(0 errors, 1 warning)"; LIST-OK is printed.
  </done>
</task>

<task type="auto">
  <name>Task 3: Redesign /create to the criar screen, keeping all 11 fields (extra nine in "Mais detalhes (opcional)"), then run the full gate</name>
  <files>app/create/page.tsx</files>
  <read_first>
    - .planning/design/ferro-brasa/Ficha.dc.html lines 83-104 (criar)
    - app/create/page.tsx (whole file; 2-space indentation, single quotes, no semicolons)
    - components/ui/input.tsx (defaults to override: h-9, px-3, md:text-sm, dark:bg-input/30) and components/ui/label.tsx
  </read_first>
  <action>
    Rewrite only the JSX and imports of app/create/page.tsx. Keep "use client" and the file style.

    Keep byte-identical (gated): the block from the formData useState through handleBack. That covers the 11-key formData, handleInputChange, handleSubmit (trim check with toast "Nome do personagem é obrigatório", mutateAsync(formData), the success/error toasts and the redirect to the new character) and handleBack.

    Layout (mock 83-104):
    - Root: a div with flex, min-h-dvh and flex-col.
    - Header: border-b. Inner: mx-auto, flex, w-full, max-w-[1200px], items-center, gap-1, p-2. It holds:
      - a Button type="button" with variant ghost, size icon, className size-11, aria-label "Voltar" and onClick={handleBack}, containing ArrowLeft (size-[22px], aria-hidden)
      - an h1 "Novo personagem" with font-serif, text-xl and font-semibold. The mock uses a span; an h1 keeps the page heading.
    - Body: a div with flex, flex-1, justify-center, px-4 and py-6, holding the existing form, onSubmit={handleSubmit}. The form's className becomes flex, w-full, max-w-[440px], flex-col and gap-[22px]. Inside, in order:
      1. A p with m-0, text-[15px], text-muted-foreground and text-pretty: "Comece pelo nome. Atributos, perícias e o resto da ficha você preenche depois, direto na ficha."
      2. Name: a flex-col with gap-2 holding:
         - Label htmlFor="characterName" with className text-sm and font-semibold, text "Nome do personagem"
         - the existing Input: id characterName, the same value and onChange, required. Keep the current placeholder "Digite o nome do personagem" (DEC-1: same placeholders; the mock's sample names are not used). Classes: h-[52px], bg-card, dark:bg-card, px-3.5, text-[17px], md:text-[17px].
      3. Player: the same pattern with id playerName, label "Nome do jogador" and the current placeholder "Digite o nome do jogador".
      4. DEC-1: a details element with group, rounded-(--radius) and border. It is closed by default, with no open attribute and no state.
         - The summary: flex, min-h-11, cursor-pointer, list-none, items-center, justify-between, gap-2, px-3.5, text-[15px], font-semibold, [&::-webkit-details-marker]:hidden. Text "Mais detalhes (opcional)", then ChevronDown with size-[18px], text-muted-foreground, transition-transform, group-open:rotate-180 and aria-hidden.
         - The panel: a div with grid, grid-cols-1, gap-3.5, border-t, p-3.5 and sm:grid-cols-2. It holds the nine existing fields in today's order: class, race, deity, homeland, alignment, gender, age, weight, height.
           - Each field keeps its id, its value, its exact handleInputChange('<key>', e.target.value) call and its current placeholder.
           - Each sits in a flex-col with gap-2. The Label has text-sm and font-semibold, with the current label text in sentence case ("Terra natal"). The Input has h-12, bg-card, dark:bg-card, text-base, md:text-base.
      5. Actions: a flex-col with gap-2.5 and pt-1.5 holding:
         - the submit Button, type submit, keeping disabled={createCharacterMutation.isPending || !formData.characterName.trim()} unchanged. Classes: h-[52px], w-full, text-[17px], font-semibold. Its disabled opacity matches the mock's 0.5. While pending it shows LoaderCircle (size-5, animate-ficha-spin) and "Criando...". Otherwise it shows "Criar personagem".
         - a Button type="button" with variant outline and onClick={handleBack}. Classes: h-12, w-full, bg-transparent, dark:bg-transparent, text-base. Text "Cancelar".
    - Remove the old Card wrapper and the bottom note box. The intro paragraph now carries that message.
    - Remove imports that become unused (Card parts, the User icon, the old spinner icon), and add LoaderCircle and ChevronDown.

    Then run the FULL gate below, because this is the item's last task. Commit as feat(261101-mvu).

    SUMMARY: list DEC-1..DEC-11 with their outcomes, plus any new mock-vs-app case you resolved under the owner rule (README "Important" section).
  </action>
  <verify>
    <automated>cd /home/zephyr/repos/personal/rpg-character-sheet && B=$(cat "$(git rev-parse --git-path gsd-261101-mvu-base)") && F=app/create/page.tsx && hb() { awk 'index($0,"  const [formData, setFormData] = useState({")==1{p=1} p{print} p&&/const handleBack = \(\) => \{/{q=1} q&&/^  }$/{exit}'; } && OLD=$(git show "$B:$F") && [ "$(hb < "$F" | wc -l)" -eq 41 ] && diff <(printf '%s\n' "$OLD" | hb) <(hb < "$F") > /dev/null && for id in characterName playerName class race deity homeland alignment gender age weight height; do grep -qF "id=\"$id\"" "$F" && grep -qF "handleInputChange('$id', e.target.value)" "$F" || { echo "missing field $id"; exit 1; }; done && grep -qF '<form onSubmit={handleSubmit}' "$F" && grep -qF 'disabled={createCharacterMutation.isPending || !formData.characterName.trim()}' "$F" && grep -qF 'Comece pelo nome.' "$F" && grep -qF 'Mais detalhes (opcional)' "$F" && grep -q '<details' "$F" && grep -qF 'aria-label="Voltar"' "$F" && grep -qF 'h-[52px]' "$F" && [ -z "$(git diff --name-only "$B" -- lib app/api)" ] && npx tsc --noEmit && bun run lint 2>&1 | grep -qF '(0 errors, 1 warning)' && bun test && bun run build && echo CREATE-OK</automated>
    <human-check>
      End-of-phase walkthrough with `bun dev`, in dark (default) and light, in DevTools device mode at 390x844 and in a 1280px window:
      1. /characters at 390px:
         - the serif title with its count line, the theme toggle, the 48px search box, the cards (name, player · atualizada há …, chips, NÍVEL column) and the sticky "Criar personagem" bar at the bottom.
         - Type a name: the input keeps focus while results load, the list shows the pulse skeleton, then the results or "Nada encontrado".
      2. /characters at 1280px: no bottom bar, "Criar personagem" in the header, a 3-column grid capped at 1200px. With more than 12 characters, the numbered page buttons show at md+ and "Página X de Y" shows at 390px. Anterior and Próxima are disabled at the ends.
      3. Trash on a card:
         - the dialog reads "Excluir <nome>?" with the design text and the Cancelar/Excluir pair at 48px, over the design overlay
         - Cancelar closes it
         - Excluir deletes the character, shows the same success toast and refreshes the list
      4. Delete every character, or use an empty database: "Nenhum personagem ainda" shows with the scroll icon.
      5. /create: it matches the criar mock. "Mais detalhes (opcional)" expands to the nine extra fields. The submit button is disabled until a name is typed. Creating redirects to the new sheet with the success toast.
      6. /character/<valid id>: the skeleton shows while loading. /character/<unknown id>: "Personagem não encontrado" with the skull, plus "Tentar de novo" and "Voltar para a lista". With DevTools set to Offline and the page reloaded: "Não foi possível carregar a ficha" / "Verifique a conexão ou tente de novo em instantes." with cloud-off, and "Tentar de novo" shows a spinner while it retries.
    </human-check>
  </verify>
  <done>
    - /create matches the criar screen. All 11 fields, the validation, the toasts and the redirect are unchanged, and the handler block is byte-identical.
    - Nothing under lib/ or app/api/ changed.
    - tsc passes; lint is still "(0 errors, 1 warning)"; bun test and bun run build pass; CREATE-OK is printed.
    - The SUMMARY records DEC-1..DEC-11.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| user input (search box) → rendered empty state | The search term is echoed back in "Nenhuma ficha com “…”" |
| API data (characterName, playerName, class, race) → list cards and delete dialog | Stored strings written by any player, since there is no auth by design |
| page → DELETE /api/characters/:id | A destructive action triggered from the list |
| fetch errors → error screens | Error objects from fetchCharacter and the list query |

## STRIDE Threat Register

ASVS level 1; block on: high.

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-mvu-01 | Tampering (stored/reflected XSS) | Empty-state search echo, card names/chips, "Excluir <nome>?" title | medium | mitigate | Every user or API string is rendered as React text children; no HTML-injection API is used. PageState renders title and description as children. The Task 1 render test proves that a `<script>` description is escaped |
| T-mvu-02 | Tampering (accidental destructive action) | Trash button and delete dialog | medium | mitigate | Delete still requires the confirmation AlertDialog, with Cancelar first and the two actions as separate 48px cells. The trash button's aria-label names the character. The Action keeps disabled={deleteCharacterMutation.isPending} and calls the unchanged handleDeleteCharacter (byte-identical gate) |
| T-mvu-03 | Information disclosure | Load-error screens | low | mitigate | The raw error.message (English server or fetch text) is no longer rendered. The screens show fixed pt-BR copy (DEC-8), and nothing is logged with console.log |
| T-mvu-04 | Denial of service (request spam) | "Tentar de novo" on the character error screens | low | mitigate | RetryButton is disabled while its onRetry promise is pending (DEC-10), so repeated taps cannot stack refetches |
| T-mvu-05 | Spoofing / open redirect | Card and back navigation | low | accept | Navigation stays router.push to internal paths built from server ids ('/character/' + id, '/characters', '/create') in the unchanged handlers; no URL comes from user input |
| T-mvu-SC | Tampering | npm/bun package installs | low | accept | No package is installed: lucide-react, date-fns and the shadcn primitives are existing dependencies, and package.json and bun.lock are not in files_modified |
</threat_model>

<verification>
Full gate, run from the repo root after Task 3:
- `npx tsc --noEmit` exits 0
- `bun run lint` prints "(0 errors, 1 warning)": the pre-existing route.ts warning, with no new ones
- `bun test` exits 0: the baseline suite plus sheet-states.render.test.ts
- `bun run build` exits 0
- The byte-identical gates against the base commit recorded in Task 1 Step 0 pass for:
  - the character page's hook/handler block and its Sanitizar-to-end-of-file block
  - the list page's hook block and handler block
  - the create page's state/handler block
- `git diff --name-only <base> -- lib app/api` is empty
- Human walkthrough (end-of-phase mode): Task 3's `<human-check>`
</verification>

<success_criteria>
- The list, empty, create, loading, not-found, load-error and delete-dialog screens match the Ferro & Brasa mock at 390px and at the wide (md+) layout
- Search, pagination, create, delete, navigation, toasts and every hook behave exactly as before; DEC-1..DEC-11 document each place where the current behavior was kept over the mock
- The ThemeToggle stays in the list header
- 261101-mvv's region of app/character/[id]/page.tsx is untouched
- tsc, lint (no new warnings), bun test and build pass
</success_criteria>

<output>
Create `.planning/quick/261101-mvu-redesign-list-create-and-page-states-ds-02-restyle-app-chara/261101-mvu-SUMMARY.md` when done. Include:
- the final exported API of components/ui/page-state.tsx and components/character/sheet-states.tsx (copy the `<interfaces>` "NEW" part and correct it if anything changed), so later items can reuse it
- DEC-1..DEC-11 with outcomes, plus any new mock-vs-app decision made under the README owner rule
- the final bun test count
</output>
