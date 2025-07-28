# Project Structure

## Root Level Organization
- **Configuration files** at root (package.json, tsconfig.json, etc.)
- **Source code** organized in feature-based folders
- **Database schema** in dedicated `prisma/` folder

## Core Directories

### `/app` - Next.js App Router
- **App Router structure** with nested routing
- `layout.tsx` - Root layout with providers and global styles
- `page.tsx` - Route pages
- `api/` - API route handlers
- Feature-specific routes: `character/`, `characters/`, `create/`

### `/components` - Reusable UI Components
- `ui/` - shadcn/ui components (Button, Input, Dialog, etc.)
- `character/` - Character-specific components
- `forms/` - Form-related components
- **Component naming**: PascalCase, descriptive names

### `/lib` - Shared Libraries & Utilities
- `utils.ts` - Common utility functions (cn helper)
- `api/` - API client functions
- `calculations/` - Business logic calculations
- `constants/` - Application constants
- `db/` - Database utilities
- `defaults/` - Default values and configurations
- `generated/` - Generated code (Prisma client)
- `schemas/` - Zod validation schemas
- `store/` - Zustand store definitions
- `types/` - TypeScript type definitions

### `/hooks` - Custom React Hooks
- Custom hooks for shared logic
- Example: `use-mobile.ts` for responsive behavior

### `/providers` - React Context Providers
- `query-provider.tsx` - TanStack Query setup
- Global state and configuration providers

### `/prisma` - Database Schema
- `schema.prisma` - Database schema definition
- Generated client outputs to `lib/generated/prisma`

## File Naming Conventions
- **React components**: PascalCase (e.g., `CharacterSheet.tsx`)
- **Pages**: lowercase with hyphens (e.g., `character-details`)
- **Utilities/hooks**: kebab-case (e.g., `use-mobile.ts`)
- **API routes**: lowercase (e.g., `characters/route.ts`)

## Import Aliases
- `@/*` - Root directory alias
- `@/components` - Components directory
- `@/lib` - Library directory
- `@/hooks` - Hooks directory

## Architecture Patterns
- **Feature-based organization** for larger components
- **Separation of concerns**: UI, business logic, data access
- **Colocation**: Related files grouped together
- **Barrel exports**: Index files for clean imports

## Key Files
- `middleware.ts` - Next.js middleware (handles redirects)
- `components.json` - shadcn/ui configuration
- `.env` - Environment variables (not committed)
- `vercel.json` - Deployment configuration