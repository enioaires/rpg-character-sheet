---
last_mapped_commit: 216d4bd8bdc9621832748458a63bb5e0b24f8795
last_mapped_at: 2026-11-01
---
<!-- refreshed: 2026-11-01 -->
# Codebase Structure

**Analysis Date:** 2026-11-01

## Directory Layout

```
rpg-character-sheet/
├── app/                          # Next.js App Router: pages, root layout, API route
│   ├── api/[[...route]]/         # Hono API mounted at /api (catch-all route)
│   │   ├── characters/index.ts   # Character endpoints + tests (index.test.ts)
│   │   └── route.ts              # Hono app root, exports GET/POST/PUT/DELETE and AppType
│   ├── character/[id]/page.tsx   # Character sheet screen
│   ├── characters/page.tsx       # Character list / search screen
│   ├── create/page.tsx           # New character screen
│   ├── page.tsx                  # "/" -> redirect to /characters
│   ├── layout.tsx                # Root layout (fonts, QueryProvider, Toaster)
│   └── globals.css               # Tailwind v4 entry and theme variables
├── components/
│   ├── character/                # Sheet feature components
│   │   ├── basic-info/           # Cards for the "Dados Básicos" tab
│   │   ├── spells-talents/       # Cards for the "Magias & Talentos" tab
│   │   ├── notes/                # Note list, card, form and dialogs
│   │   ├── *-tab.tsx             # One file per tab (basic-info, skills-kit, spells-talents, notes)
│   │   ├── quick-actions-bar.tsx # Sticky bottom/top action bar
│   │   ├── skills-modal.tsx, attributes-modal.tsx
│   │   ├── types.ts              # CharacterData, CharacterTabProps, UpdateCharacterMutation
│   │   ├── index.ts              # Barrel for tabs, modals and quick actions
│   │   └── notes-tab.render.test.ts
│   ├── forms/character-layout.tsx  # Tabbed sheet shell (imports the tabs above)
│   ├── ui/                       # shadcn/ui primitives (generated) + editable-field, editable-scaling-field
│   └── (no other folders)
├── lib/
│   ├── api/                      # Hono client, TanStack Query hooks, save concurrency core (+ tests)
│   ├── calculations/             # Pure game-rule math (index.ts + index.test.ts)
│   ├── constants/character.ts    # Attribute, skill, vitality constants; pagination limits
│   ├── db/index.ts               # Prisma client singleton
│   ├── defaults/character.ts     # Defaults merged into new characters
│   ├── generated/prisma/         # Prisma client output (git-ignored, generated)
│   ├── schemas/                  # Zod schemas: character.ts, calculations.ts (+ tests)
│   ├── store/character.ts        # Zustand store (editing state)
│   ├── notes.ts, notes-format.ts # Notes parsing/migration and safe HTML formatting (+ tests)
│   └── utils.ts                  # cn() class helper
├── providers/query-provider.tsx  # TanStack Query provider (client component)
├── hooks/use-mobile.ts           # Responsive hook (only custom hook in the tree)
├── prisma/schema.prisma          # Single Character model, PostgreSQL datasource
├── public/                       # Static SVG assets (Next.js template leftovers)
├── .claude/CLAUDE.md             # Project instructions for Claude Code (GSD-managed)
├── .kiro/steering/*.md           # Steering docs for another tool (partly outdated)
├── .planning/codebase/           # Generated codebase maps (this directory)
├── next.config.ts, tsconfig.json, postcss.config.mjs, components.json
├── eslint.config.mjs, mise.toml, vercel.json, package.json
└── README.md
```

## Directory Purposes

**`app/`:**
- Purpose: Routes only. Pages are thin: they fetch via hooks and compose feature components.
- Contains: `page.tsx`, `layout.tsx`, the Hono route file, and `globals.css`.
- Key files: `app/character/[id]/page.tsx` (sheet, 196 lines), `app/characters/page.tsx` (list), `app/create/page.tsx`, `app/api/[[...route]]/characters/index.ts` (all API handlers).
- Rule: Do not put game math or Prisma calls in pages; put them in `lib/`.

**`app/api/[[...route]]/`:**
- Purpose: The whole HTTP API. The `[[...route]]` optional catch-all lets Hono own every path under `/api`.
- Contains: `route.ts` (mounts `characters` with `basePath('/api')`) and `characters/index.ts` (route chain for `/`, `/:id`).
- Key files: `app/api/[[...route]]/characters/index.test.ts` (route tests with a fake database).

**`components/character/`:**
- Purpose: Everything specific to the character sheet.
- Contains: Tab files at the top level; card folders `basic-info/`, `spells-talents/`, `notes/`; modals; `quick-actions-bar.tsx`; `types.ts`.
- Key files: `components/character/types.ts` (`CharacterTabProps`), `components/character/index.ts` (barrel for `BasicInfoTab`, `SkillsKitTab`, `SpellsTalentsTab`, `NotesTab`, `QuickActionsBar`, `SkillsModal`, `AttributesModal`).
- Note: `skills-kit-tab.tsx` has no folder of its own; its content is a single file of about 466 lines.

**`components/character/basic-info/`:**
- Purpose: Cards rendered by `BasicInfoTab`.
- Files: `profile-cards.tsx` (`BasicDetailsCard`, `ExperienceCard`), `attribute-cards.tsx` (`AttributesSummaryCard`, `AttributesDistributionCard`), `vitality-card.tsx` (`VitalityCard`), `berkana-card.tsx` (`BerkanaCard`), `equipment-cards.tsx` (`WeaponsCard`, `ArmorCard`), `languages-card.tsx` (`LanguagesCard`).

**`components/character/spells-talents/`:**
- Purpose: Cards rendered by `SpellsTalentsTab`.
- Files: `spells-card.tsx` (`SpellsCard`, uses `EditableScalingField`), `talents-card.tsx` (`TalentsCard`).

**`components/character/notes/`:**
- Purpose: Presentational pieces of the notes tab. Business logic stays in `notes-tab.tsx`.
- Files: `notes-header.tsx` (`NotesHeader`), `notes-list.tsx` (`NotesList`), `note-card.tsx` (`NoteCard`, renders via `formatNoteHtml`), `note-form.tsx` (`NoteForm`), `edit-note-dialog.tsx` (`EditNoteDialog`).

**`components/forms/`:**
- Purpose: The tabbed sheet shell. Despite the name, it holds no form logic.
- Contains: `character-layout.tsx` (`CharacterLayout`, owns active tab, modal flags and section navigation).

**`components/ui/`:**
- Purpose: shadcn/ui primitives (`new-york` style, see `components.json`) and two custom editors.
- Contains: About 50 generated files such as `button.tsx`, `dialog.tsx`, `tabs.tsx`, `sonner.tsx`, plus `editable-field.tsx` and `editable-scaling-field.tsx`, which are hand-written.
- Rule: Do not hand-edit the generated primitives; wrap them in `components/character/` or add new feature components elsewhere.

**`lib/api/`:**
- Purpose: Client-side access to the API.
- Contains: `client.ts` (typed `hc<AppType>` client), `queries.ts` (hooks; imports `sonner`), `character-concurrency.ts` (framework-free save core), tests in `character-concurrency.test.ts`.
- Rule: `character-concurrency.ts` must not import React, sonner or the Hono client, so `bun test` can run it.

**`lib/schemas/`:**
- Purpose: Zod schemas and their inferred types, used by the API and the client.
- Contains: `character.ts` (request/response/entity schemas; list pagination constants come from `lib/constants/character.ts`), `calculations.ts` (per-field value schemas), tests in `character.test.ts`.

**`lib/calculations/`:**
- Purpose: Pure derived-stat math, with no imports from React or Prisma.
- Contains: `index.ts` (about 390 lines), `index.test.ts` (about 700 lines).

**`lib/constants/`, `lib/defaults/`:**
- `constants/character.ts`: `ATTRIBUTES`, `SKILLS`, `VITALITY_LEVELS`, `*_LABELS`, `STANDARD_LANGUAGES`, page-size limits.
- `defaults/character.ts`: `getDefaultCharacterData()` used by `POST /api/characters`.

**`lib/notes.ts`, `lib/notes-format.ts`:**
- Purpose: Notes column handling and the markdown-like formatter. Both are DOM-free and have tests (`lib/notes.test.ts`, `lib/notes-format.test.ts`).

**`lib/store/`:**
- Purpose: Zustand store for transient editing state (`lib/store/character.ts`). Only `editingField` is used.

**`lib/db/`:**
- Purpose: Creates the Prisma client. Imports from `@/lib/generated/prisma`, so `prisma generate` must run before the first import (`postinstall` and `build` do this).

**`lib/generated/`:**
- Purpose: Prisma client output. Generated and git-ignored (`/lib/generated/prisma` in `.gitignore`). Do not edit or review.

**`prisma/`:**
- Purpose: Schema only (`schema.prisma`). No migrations folder is tracked; schema changes are applied with `prisma` CLI commands outside the repository.

**`providers/`:**
- Purpose: Client providers mounted in `app/layout.tsx`. Contains only `query-provider.tsx`.

**`hooks/`:**
- Purpose: Shared React hooks. Contains only `use-mobile.ts`. Feature-specific hooks live next to their feature or inside `lib/api/queries.ts`.

**`.kiro/steering/` and `.claude/`:**
- Purpose: Assistant guidance files. Not read by the app. `.kiro/steering/structure.md` describes PascalCase filenames, but tracked files are kebab-case.

## Key File Locations

**Entry Points:**
- `app/page.tsx`: root redirect to `/characters`
- `app/layout.tsx`: root layout
- `app/api/[[...route]]/route.ts`: API entry, exports `AppType`

**Configuration:**
- `next.config.ts`: empty Next.js config
- `tsconfig.json`: strict mode, `@/*` alias to repo root
- `components.json`: shadcn/ui aliases and style
- `vercel.json`: Bun install and build, function region `gru1`, API `maxDuration` 30
- `mise.toml`: Node 24
- `prisma/schema.prisma`: datasource `DATABASE_URL`, generator output `lib/generated/prisma`
- `env.example`: documents `DATABASE_URL` (the real `.env` is git-ignored; its contents are not recorded here)

**Core Logic:**
- `app/api/[[...route]]/characters/index.ts`: all server handlers
- `lib/api/character-concurrency.ts`: optimistic-concurrency write path
- `lib/api/queries.ts`: React Query hooks
- `lib/calculations/index.ts`: derived stats
- `lib/schemas/character.ts`: API contract
- `lib/notes.ts`: notes column

**Testing:**
- `lib/calculations/index.test.ts`
- `lib/schemas/character.test.ts`
- `lib/api/character-concurrency.test.ts`
- `lib/notes.test.ts`, `lib/notes-format.test.ts`
- `app/api/[[...route]]/characters/index.test.ts`
- `components/character/notes-tab.render.test.ts`
- Run with `bun test` (`package.json` `test` script).

## Naming Conventions

**Files:**
- React components and feature files: kebab-case, for example `basic-info-tab.tsx` exporting `BasicInfoTab`, `vitality-card.tsx` exporting `VitalityCard`.
- Pages: Next.js reserved names (`page.tsx`, `layout.tsx`, `route.ts`) inside lowercase route folders; dynamic segment `[id]`.
- Lib modules: lowercase or kebab-case, for example `character-concurrency.ts`, `notes-format.ts`.
- Barrels: `index.ts` inside a folder (`components/character/index.ts`, `lib/calculations/index.ts`).
- Tests: `*.test.ts` next to the module. Component render test uses `*.render.test.ts`.
- Type-only shared file: `types.ts` (`components/character/types.ts`).

**Directories:**
- Feature folders: lowercase, singular or plural by role (`components/character/`, `lib/schemas/`).
- Card groups named after their tab: `basic-info/`, `spells-talents/`, `notes/`.

**Identifiers:**
- Components: PascalCase named exports; page components are default exports.
- Hooks: `use` prefix; mutations named `use<Verb><Entity>` (`useUpdateCharacter`).
- Zod schemas end in `Schema`; response schemas end in `ResponseSchema`; request types end in `Request`.
- Event handlers: `handle` prefix (`handleBack`, `handleRefresh`).
- Domain keys (`agilidade`, `notavel`, `gravementeFerido`) are Portuguese and persisted; keep them as-is.
- UI strings and toasts: Brazilian Portuguese. Code identifiers: English.

## Where to Add New Code

**New sheet section (new card):**
- Implementation: a new file in the matching tab folder, for example `components/character/basic-info/<name>-card.tsx` exporting `<Name>Card`, with props `{ character, characterId, isEditMode, updateCharacterMutation? }`.
- Wire it into the tab file (`components/character/basic-info-tab.tsx`, `spells-talents-tab.tsx`, and so on).
- Editable fields: use `EditableField` / `EditableNumberField` / `EditableTextArea` from `components/ui/editable-field.tsx`.
- Tests: pure math goes in `lib/calculations/index.test.ts`; schema changes in `lib/schemas/character.test.ts`.

**New sheet tab:**
- Implementation: `components/character/<name>-tab.tsx` implementing `CharacterTabProps`; export from `components/character/index.ts`.
- Register in `components/forms/character-layout.tsx` (add a `TabsTrigger` and `TabsContent`).

**New game rule / derived stat:**
- Implementation: pure function in `lib/calculations/index.ts`, with a test in `lib/calculations/index.test.ts`.
- Use from components and `lib/store/character.ts` only through the exported function (not copies).

**New API endpoint for characters:**
- Implementation: add a chained route in `app/api/[[...route]]/characters/index.ts` with `zValidator` and a schema from `lib/schemas/character.ts`.
- Test: next to it in `app/api/[[...route]]/characters/index.test.ts`.
- Client: the typed client picks it up automatically through `AppType`; add a hook in `lib/api/queries.ts`.

**New top-level resource (not characters):**
- Implementation: create `app/api/[[...route]]/<resource>/index.ts` and mount it in `app/api/[[...route]]/route.ts` with `app.route('/<resource>', ...)`, and add the export to the `routes` chain so `AppType` includes it.

**New page:**
- Implementation: `app/<route>/page.tsx`. Use `"use client"` only when the page uses hooks; keep data access in `lib/api/queries.ts`.

**New database column:**
- Implementation: edit `prisma/schema.prisma`, add the field to `characterFullSchema` and the update/create schemas in `lib/schemas/character.ts`, and add a default in `lib/defaults/character.ts` if needed. Run `prisma generate` (done by `postinstall`).

**Shared utilities:**
- Pure helpers used by both client and server: `lib/` (new file or existing module), with no React or Node imports.
- Class-name helper: `cn` in `lib/utils.ts`.
- Client-only hooks: `hooks/` (for example `hooks/use-<name>.ts`).

**Generic UI primitive:**
- Add via the shadcn CLI (`components.json`) into `components/ui/`; do not hand-edit generated files.

## Special Directories

**`lib/generated/`:**
- Purpose: Prisma client output.
- Generated: Yes (`prisma generate`).
- Committed: No (git-ignored).

**`.next/`:**
- Purpose: Next.js build output and cache.
- Generated: Yes.
- Committed: No.

**`node_modules/`:**
- Purpose: Installed packages (Bun or npm).
- Generated: Yes.
- Committed: No.

**`.planning/`:**
- Purpose: GSD planning artifacts, including this codebase map.
- Generated: Mixed (some by tooling, some by hand).
- Committed: Yes.

**`.gsd/`:**
- Purpose: Tooling state for another workflow tool (`dispatch-isolation-sentinel.json`, its own `.gitignore`).
- Generated: Yes.
- Committed: Not relevant to the app; do not read or modify from feature work.

**`public/`:**
- Purpose: Static assets served at `/`. Only Next.js template SVGs are present.
- Generated: No.
- Committed: Yes.

---

*Structure analysis: 2026-11-01*
