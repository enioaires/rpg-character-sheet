# Project Structure

## Root Level Organization
- **Configuration files** at root (package.json, tsconfig.json, eslint.config.mjs, etc.)
- **Source code** organized in feature-based folders
- **Database schema** in dedicated `prisma/` folder

## Core Directories

### `/app` - Next.js App Router
- **App Router structure** with nested routing
- `layout.tsx` - Root layout with providers and global styles
- `page.tsx` - Root page; a server component that redirects `/` to `/characters`
- `api/[[...route]]/route.ts` - Hono app mounted at `/api`; `characters/index.ts` holds the character routes
- Feature routes: `character/[id]/` (sheet), `characters/` (list), `create/` (new character)

### `/components` - UI Components
- `ui/` - shadcn/ui primitives (generated, do not hand-edit) plus the two custom inline editors, `editable-field.tsx` and `editable-scaling-field.tsx`
- `character/` - Sheet tabs (`basic-info-tab.tsx`, `skills-kit-tab.tsx`, `spells-talents-tab.tsx`, `notes-tab.tsx`), modals, `quick-actions-bar.tsx`, shared `types.ts` and the `index.ts` barrel
- `forms/` - `character-layout.tsx`, the tabbed sheet layout
- **Component naming**: kebab-case filenames exporting PascalCase components (for example `components/character/basic-info-tab.tsx` exports `BasicInfoTab`)

### `/lib` - Shared Libraries & Utilities
- `utils.ts` - Common utility functions (cn helper)
- `api/` - Typed Hono client (`client.ts`), TanStack Query hooks (`queries.ts`), save concurrency (`character-concurrency.ts`)
- `calculations/` - Game-rule math (pure functions)
- `constants/` - Attribute and skill lists, labels, formulas
- `db/` - Prisma client singleton
- `defaults/` - Default payload for new characters
- `generated/` - Generated code (Prisma client, git-ignored)
- `schemas/` - Zod validation schemas and inferred types
- `store/` - Zustand store definitions
- `notes.ts` and `notes-format.ts` - Notes parsing and safe HTML formatting

### `/hooks` - Custom React Hooks
- Custom hooks for shared logic
- Example: `use-mobile.ts` for responsive behavior

### `/providers` - React Context Providers
- `query-provider.tsx` - TanStack Query setup

### `/prisma` - Database Schema
- `schema.prisma` - Database schema definition (single `Character` model)
- Generated client outputs to `lib/generated/prisma`

## Tests
- `bun test` runs `*.test.ts` files that sit next to the code they cover:
  - `lib/calculations/index.test.ts`, `lib/schemas/character.test.ts`
  - `lib/api/character-concurrency.test.ts`, `lib/notes.test.ts`, `lib/notes-format.test.ts`
  - `app/api/[[...route]]/characters/index.test.ts`
  - `components/character/notes-tab.render.test.ts`

## File Naming Conventions
- **React components**: kebab-case files, PascalCase exports (e.g., `basic-info-tab.tsx` exports `BasicInfoTab`)
- **Pages**: App Router `page.tsx` inside lowercase route folders
- **Utilities/hooks**: kebab-case (e.g., `use-mobile.ts`)
- **API routes**: `route.ts` under `app/api`
- **Tests**: `*.test.ts` next to the code

## Import Aliases
- `@/*` - Root directory alias
- `@/components` - Components directory
- `@/lib` - Library directory
- `@/hooks` - Hooks directory

## Architecture Patterns
- **Feature-based organization** for larger components
- **Separation of concerns**: UI, business logic, data access
- **Colocation**: Related files grouped together
- **Barrel exports**: Index files for clean imports (`components/character/index.ts`)

## Key Files
- `app/page.tsx` - Server redirect from `/` to `/characters`
- `eslint.config.mjs` - ESLint 9 flat config
- `bun.lock` - The only lockfile (Bun is the only package manager)
- `prisma/schema.prisma` - Database schema
- `components.json` - shadcn/ui configuration
- `vercel.json` - Deployment configuration (Bun install/build, region, pinned Bun version)
- `.env` - Environment variables (not committed; see `env.example`)
