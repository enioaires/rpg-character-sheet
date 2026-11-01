---
last_mapped_commit: dbe980a72bf9357010fabf77e4c8695d6ff9d1d2
last_mapped_at: 2026-11-01
---
# Codebase Structure

**Analysis Date:** 2026-11-01

## Directory Layout

```
rpg-character-sheet/
├── app/                        # Next.js App Router: pages, layout, API route
│   ├── api/[[...route]]/       # Hono API catch-all mounted at /api
│   │   ├── characters/         # Character sub-router
│   │   └── route.ts            # Hono root app, exports AppType and HTTP verbs
│   ├── character/[id]/         # Character sheet page
│   ├── characters/             # Character list page
│   ├── create/                 # Character creation page
│   ├── globals.css             # Tailwind/theme styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Fallback "Redirecionando..." page
├── components/
│   ├── character/              # Character sheet tabs, modals, quick actions
│   ├── forms/                  # Layout wrapper for the sheet
│   └── ui/                     # shadcn/ui primitives + inline-edit components
├── hooks/                      # Shared React hooks (use-mobile.ts)
├── lib/
│   ├── api/                    # Typed RPC client and TanStack Query hooks
│   ├── calculations/           # Game-rule functions
│   ├── constants/              # Lists, labels, formulas
│   ├── db/                     # Prisma client singleton
│   ├── defaults/               # Default character payload
│   ├── generated/prisma/       # Generated Prisma client (gitignored)
│   ├── schemas/                # Zod schemas and inferred types
│   ├── store/                  # Zustand edit-state store
│   └── utils.ts                # cn() helper
├── prisma/
│   └── schema.prisma           # Single Character model
├── providers/
│   └── query-provider.tsx      # TanStack QueryClientProvider
├── public/                     # Static SVG assets
├── .kiro/steering/             # Legacy steering docs (partly outdated)
├── .vscode/settings.json       # Editor settings
├── middleware.ts               # Root redirect to /characters
├── next.config.ts              # Next config (empty options)
├── package.json                # Scripts and dependencies
├── components.json             # shadcn/ui config
├── tsconfig.json               # TypeScript config and "@/*" alias
├── postcss.config.mjs          # Tailwind v4 PostCSS plugin
├── vercel.json                 # Build command, region, function duration
└── env.example                 # Environment variable template (no values)
```

Not in the repository and ignored by `.gitignore`: `node_modules/`, `.next/`, `lib/generated/prisma`, `.env*`, `*.tsbuildinfo`, `next-env.d.ts`.

## Directory Purposes

**`app/`:**
- Purpose: Routes, layouts, and the single API handler
- Contains: `page.tsx`, `layout.tsx`, `route.ts`, `globals.css`, `favicon.ico`
- Key files: `app/layout.tsx`, `app/api/[[...route]]/route.ts`, `app/api/[[...route]]/characters/index.ts`

**`app/character/[id]/`:**
- Purpose: Dynamic character sheet route
- Contains: `page.tsx` (client component)
- Key files: `app/character/[id]/page.tsx`

**`app/characters/`:**
- Purpose: Character list with search and pagination
- Contains: `page.tsx` (client component, 324 lines)
- Key files: `app/characters/page.tsx`

**`app/create/`:**
- Purpose: New character form
- Contains: `page.tsx` (client component)
- Key files: `app/create/page.tsx`

**`components/character/`:**
- Purpose: Feature components for the character sheet
- Contains: Tab components, modals, quick-actions bar, shared prop type, barrel index
- Key files:
  - `components/character/basic-info-tab.tsx` (1057 lines, largest component)
  - `components/character/notes-tab.tsx` (794 lines)
  - `components/character/spells-talents-tab.tsx` (545 lines)
  - `components/character/skills-kit-tab.tsx` (461 lines)
  - `components/character/quick-actions-bar.tsx`
  - `components/character/skills-modal.tsx`, `components/character/attributes-modal.tsx`
  - `components/character/types.ts` (`CharacterTabProps`)
  - `components/character/index.ts` (barrel)

**`components/forms/`:**
- Purpose: Layout composition for the sheet
- Contains: `character-layout.tsx` (sticky tabs, scroll-to-section helper)
- Key files: `components/forms/character-layout.tsx`

**`components/ui/`:**
- Purpose: Generic primitives (shadcn/ui, Radix) and two domain-aware inline editors
- Contains: About 50 files such as `button.tsx`, `dialog.tsx`, `form.tsx`, `sidebar.tsx`, `chart.tsx`, plus `editable-field.tsx` and `editable-scaling-field.tsx`
- Key files: `components/ui/editable-field.tsx`, `components/ui/editable-scaling-field.tsx`, `components/ui/sonner.tsx`

**`hooks/`:**
- Purpose: Shared React hooks
- Contains: `use-mobile.ts`
- Key files: `hooks/use-mobile.ts`

**`lib/api/`:**
- Purpose: Client-side API access
- Contains: `client.ts` (`hc<AppType>` client), `queries.ts` (all React Query hooks)
- Key files: `lib/api/queries.ts`

**`lib/calculations/`:**
- Purpose: Pure game-rule math
- Contains: `index.ts` (single file, 298 lines)
- Key files: `lib/calculations/index.ts`

**`lib/constants/`:**
- Purpose: Static game data and simple formulas
- Contains: `character.ts` (attribute and skill lists, labels, default adventure kit, languages, vitality levels, formula helpers)
- Key files: `lib/constants/character.ts`

**`lib/db/`:**
- Purpose: Database client
- Contains: `index.ts`
- Key files: `lib/db/index.ts`

**`lib/defaults/`:**
- Purpose: Default values merged on character creation
- Contains: `character.ts`
- Key files: `lib/defaults/character.ts`

**`lib/schemas/`:**
- Purpose: Zod request and response contracts
- Contains: `character.ts` (CRUD schemas and types), `calculations.ts` (calculation request and response schemas)
- Key files: `lib/schemas/character.ts`, `lib/schemas/calculations.ts`

**`lib/store/`:**
- Purpose: Zustand store for inline edit session
- Contains: `character.ts`
- Key files: `lib/store/character.ts`

**`lib/generated/prisma/`:**
- Purpose: Prisma client output (`generator client` in `prisma/schema.prisma`)
- Generated: Yes, by `prisma generate` (`postinstall`, `build`)
- Committed: No (`.gitignore` contains `/lib/generated/prisma`)

**`prisma/`:**
- Purpose: Database schema
- Contains: `schema.prisma` only. No `migrations/` folder exists.
- Key files: `prisma/schema.prisma`

**`providers/`:**
- Purpose: Client-side React providers
- Contains: `query-provider.tsx`
- Key files: `providers/query-provider.tsx`

**`public/`:**
- Purpose: Static assets served at the root
- Contains: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` (default Next.js templates)

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout and providers
- `app/api/[[...route]]/route.ts`: API entry, exports `AppType`
- `middleware.ts`: Root redirect
- `app/characters/page.tsx`: Default landing after redirect

**Configuration:**
- `package.json`: Scripts (`dev` uses Turbopack, `build` runs `prisma generate && next build`)
- `tsconfig.json`: Path alias `@/*`
- `next.config.ts`: Next config, no options set
- `components.json`: shadcn/ui settings (New York style)
- `postcss.config.mjs`: Tailwind CSS v4 via `@tailwindcss/postcss`
- `vercel.json`: Build and runtime settings
- `prisma/schema.prisma`: Datasource (`postgresql`, URL from `DATABASE_URL`) and model
- `env.example`: Lists required env var names. Do not copy values from `.env`.

**Core Logic:**
- `lib/calculations/index.ts`: Game rules
- `lib/constants/character.ts`: Constants and formulas
- `lib/defaults/character.ts`: Default payload
- `app/api/[[...route]]/characters/index.ts`: All character endpoints

**Testing:**
- Not detected. No test files, test runner config, or `test` script exist.

## Naming Conventions

**Files:**
- Next.js routes: lowercase `page.tsx`, `layout.tsx`, `route.ts`, with dynamic segments in brackets (`[id]`, `[[...route]]`)
- Components and tabs: kebab-case filenames that export PascalCase components (`basic-info-tab.tsx` exports `BasicInfoTab`, `character-layout.tsx` exports `CharacterLayout`)
- shadcn primitives: kebab-case (`alert-dialog.tsx`, `dropdown-menu.tsx`)
- Library modules: lowercase single words or kebab-case (`queries.ts`, `calculations.ts`, `character.ts`)
- Hooks: `use-*.ts` in `hooks/` (`use-mobile.ts`). Hook exports are camelCase `useX` (`useCharacters`, `useCharacterStore`)

**Directories:**
- Lowercase, single words or hyphen-free (`characters`, `calculations`, `schemas`)
- Dynamic route segments in brackets: `app/character/[id]/`

**Code identifiers:**
- Zod schemas: `camelCaseSchema` (`createCharacterSchema`, `getCharacterResponseSchema`)
- Inferred types: PascalCase matching the request or response name (`CreateCharacterRequest`, `CharacterFull`)
- Route sub-apps are chained Hono instances. Path params use `:id`
- Mixed language: UI strings, comments, and some identifiers are Portuguese (`Personagem`, `Perícias`, `Anotações`). Keep new user-facing text in pt-BR to match.

**Import aliases (from `tsconfig.json`):**
- `@/*` maps to the repo root. Use `@/components/...`, `@/lib/...`, `@/app/api/[[...route]]/route` for the type import. Relative imports are used only within a folder (for example `./client` inside `lib/api/`).

## Where to Add New Code

**New API endpoint for characters:**
- Route: add a chained method to `app/api/[[...route]]/characters/index.ts`, with `zValidator` for params and body
- Schemas: add request and response zod schemas to `lib/schemas/character.ts` or `lib/schemas/calculations.ts`
- Client hook: add a hook to `lib/api/queries.ts` following the existing `useX` pattern, with query-key invalidation
- Tests: none exist; if added, place them beside the source (no convention yet)

**New game rule or calculation:**
- Implementation: `lib/calculations/index.ts`
- Constants: `lib/constants/character.ts`
- Do not duplicate formulas into components

**New character sheet tab or section:**
- Component: `components/character/<name>-tab.tsx`, exported from `components/character/index.ts`
- Wire into the tab list in `components/forms/character-layout.tsx` (add a `TabsTrigger` and `TabsContent`)
- Props: follow `CharacterTabProps` in `components/character/types.ts`

**New inline-editable field:**
- Use `components/ui/editable-field.tsx` or `components/ui/editable-scaling-field.tsx`. Pass `characterId` so saves go through `useUpdateCharacter`.

**New page:**
- Location: `app/<route>/page.tsx`. Add `"use client"` only if it uses hooks or browser APIs.

**New shared UI primitive:**
- Location: `components/ui/<name>.tsx` (shadcn CLI settings in `components.json`)

**New shared hook:**
- Location: `hooks/use-<name>.ts`

**New database field:**
- Schema: `prisma/schema.prisma`. Then run `bunx prisma generate` or `npx prisma generate`. No migrations folder exists, so schema changes are applied another way (for example `prisma db push`).
- Update `lib/schemas/character.ts` and `lib/defaults/character.ts` to match.

**Utilities:**
- Shared helpers: `lib/utils.ts` (`cn` class merging). Put domain helpers in `lib/calculations/` or `lib/constants/`, not in `lib/utils.ts`.

## Special Directories

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes
- Committed: No

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes
- Committed: No

**`lib/generated/prisma/`:**
- Purpose: Prisma client
- Generated: Yes
- Committed: No

**`.kiro/`:**
- Purpose: Steering documents for another assistant tool
- Generated: No
- Committed: Yes. Partly outdated; `package.json` is authoritative.

**`.planning/`:**
- Purpose: GSD planning and codebase analysis output (this directory)
- Generated: Yes
- Committed: Per project workflow

**`.tmp/`, `hooks/`:**
- `.tmp/` is an empty directory with no referenced code.
- `hooks/` contains React hooks, not git hooks.

---

*Structure analysis: 2026-11-01*
