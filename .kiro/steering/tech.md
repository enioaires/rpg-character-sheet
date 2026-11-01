# Technology Stack

## Core Framework & Runtime
- **Next.js 16.4.3** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5.8.3** - Strict type checking
- **Bun 1.2.9** - Package manager and Vercel build runner (version pinned by `BUN_VERSION` in `vercel.json`; Bun is the only package manager, `bun.lock` is the only lockfile)
- **Node 24** - Runtime for tooling, declared in `mise.toml`

## Database & ORM
- **PostgreSQL** - Primary database
- **Prisma 6.12.0** - Database ORM (schema applied with `prisma db push`; there is no migrations directory)
- **Generated Prisma Client** - Located at `lib/generated/prisma` (git-ignored)

## UI & Styling
- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **shadcn/ui** - Component library (New York style)
- **Radix UI** - Headless UI primitives
- **Lucide React 0.525.0** - Icon library
- **class-variance-authority** - Component variant management
- **sonner** - Toasts

## State Management & Data Fetching
- **TanStack Query 5.83.0** - Server state management
- **Zustand 5.0.6** - Client state management (inline edit state)
- **Zod 4.0.10** - Schema validation shared by API and client

## API & Backend
- **Hono 4.8.9** - Web framework for API routes, mounted at `/api`
- **@hono/zod-validator 0.7.2** - Request validation

## Development Tools
- **Turbopack** - Fast bundler (used in dev mode)
- **ESLint 9.39.5** - Flat config in `eslint.config.mjs` extending `eslint-config-next` 16.4.3 (core-web-vitals + typescript); run by `bun run lint`
- **Testing** - `bun test`; test files sit next to the code they cover (`lib/**/*.test.ts`, `app/api/[[...route]]/characters/index.test.ts`, `components/character/notes-tab.render.test.ts`)
- **PostCSS** - CSS processing (`@tailwindcss/postcss`)

## Common Commands

```bash
# Development
bun dev              # Start development server with Turbopack
bun run build        # Build for production (includes Prisma generate)
bun start            # Start production server
bun run lint         # Run ESLint (eslint .)
bun test             # Run unit tests
npx tsc --noEmit     # Type check

# Database
bunx prisma generate # Generate Prisma client
bunx prisma db push  # Create or update tables from the schema
bunx prisma studio   # Open Prisma Studio

# Package Management
bun install          # Install dependencies
bun add <package>    # Add new dependency
bun remove <package> # Remove dependency
```

The definition of done is `npx tsc --noEmit`, `bun run lint`, `bun test` and `bun run build` all passing.

## Build Process
1. Prisma client generation (`prisma generate`)
2. Next.js build process
3. TypeScript compilation
4. Tailwind CSS processing

## Environment Requirements
- Node 24 (see `mise.toml`) and Bun 1.2.9
- PostgreSQL database
- `DATABASE_URL` in the `.env` file (see `env.example`); set it in the Vercel project for deployment
