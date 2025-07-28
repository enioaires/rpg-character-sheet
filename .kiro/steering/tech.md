# Technology Stack

## Core Framework & Runtime
- **Next.js 15.4.4** - React framework with App Router
- **React 19.1.0** - UI library with latest features
- **TypeScript 5** - Type-safe development
- **Bun** - Package manager and runtime (preferred over npm/yarn)

## Database & ORM
- **PostgreSQL** - Primary database
- **Prisma 6.12.0** - Database ORM and migrations
- **Generated Prisma Client** - Located at `lib/generated/prisma`

## UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Component library (New York style)
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library
- **class-variance-authority** - Component variant management

## State Management & Data Fetching
- **TanStack Query 5.83.0** - Server state management
- **Zustand 5.0.6** - Client state management
- **React Hook Form 7.61.1** - Form state management
- **Zod 4.0.10** - Schema validation

## API & Backend
- **Hono 4.8.9** - Web framework for API routes
- **Zod OpenAPI** - API documentation and validation

## Development Tools
- **Turbopack** - Fast bundler (used in dev mode)
- **ESLint** - Code linting
- **PostCSS** - CSS processing

## Common Commands

```bash
# Development
bun dev              # Start development server with Turbopack
bun run build        # Build for production (includes Prisma generate)
bun start            # Start production server
bun run lint         # Run ESLint

# Database
bunx prisma generate # Generate Prisma client
bunx prisma migrate  # Run database migrations
bunx prisma studio   # Open Prisma Studio

# Package Management
bun install          # Install dependencies
bun add <package>    # Add new dependency
bun remove <package> # Remove dependency
```

## Build Process
1. Prisma client generation (`prisma generate`)
2. Next.js build process
3. TypeScript compilation
4. Tailwind CSS processing

## Environment Requirements
- Node.js compatible runtime
- PostgreSQL database
- Environment variables in `.env` file