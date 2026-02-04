<!-- Parent: ../CLAUDE.md -->
<!-- Generated: 2026-02-03 | Updated: 2026-02-03 -->

# src

## Purpose
Main application source code directory containing all Next.js App Router pages, React components, utility libraries, and TypeScript type definitions.

## Key Files

| File | Description |
|------|-------------|
| `middleware.ts` | Next.js middleware for auth protection (if exists) |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router pages and API routes (see `app/CLAUDE.md`) |
| `components/` | Reusable React components (see `components/CLAUDE.md`) |
| `lib/` | Utility functions and shared libraries (see `lib/CLAUDE.md`) |
| `types/` | TypeScript type definitions (see `types/CLAUDE.md`) |

## For AI Agents

### Working In This Directory
- Use path alias `@/` to import from this directory (e.g., `@/components/ui/button`)
- Follow existing patterns for component and file organization
- Korean language may appear in UI strings and comments

### Code Organization
- Pages in `app/` follow Next.js App Router conventions
- UI components split between feature components (`components/`) and base UI (`components/ui/`)
- Database access through Prisma client in `lib/prisma.ts`
- Authentication utilities in `lib/auth.ts`

### Common Imports
```typescript
import { cn } from "@/lib/utils"           // Class name utility
import { prisma } from "@/lib/prisma"       // Database client
import { auth } from "@/lib/auth"           // Auth helpers
import { Button } from "@/components/ui/button"  // UI components
```

## Dependencies

### Internal
- All subdirectories depend on `lib/` for shared utilities
- `app/` depends on `components/` for UI
- `app/api/` depends on `lib/prisma.ts` for database access

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
