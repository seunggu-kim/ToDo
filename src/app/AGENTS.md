<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-03 | Updated: 2026-02-03 -->

# app

## Purpose
Next.js App Router directory containing all pages, layouts, and API routes. Uses route groups `(auth)` and `(main)` to organize authentication and main application routes separately.

## Key Files

| File | Description |
|------|-------------|
| `layout.tsx` | Root layout with Providers, fonts (Geist), and Toaster |
| `page.tsx` | Landing page (redirects to appropriate route) |
| `globals.css` | Global styles with Tailwind CSS |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `(auth)/` | Authentication pages - login, register (see `(auth)/AGENTS.md`) |
| `(main)/` | Main app pages - dashboard, today, team, stats, etc. (see `(main)/AGENTS.md`) |
| `api/` | Backend API routes (see `api/AGENTS.md`) |

## Route Groups

### `(auth)` Group
- Public pages for authentication
- Has its own layout without navigation
- Routes: `/login`, `/register`

### `(main)` Group
- Protected pages requiring authentication
- Shared layout with bottom navigation
- Routes: `/today`, `/dashboard`, `/team`, `/settings`, `/stats/*`, `/history`, `/search`

## For AI Agents

### Working In This Directory
- Follow Next.js App Router conventions for file naming
- Use `page.tsx` for route pages, `layout.tsx` for layouts
- API routes use `route.ts` with exported HTTP method handlers
- Use `loading.tsx` for Suspense fallback loading states

### Route Structure
```
(auth)/
  login/page.tsx      → /login
  register/page.tsx   → /register
(main)/
  today/page.tsx      → /today
  dashboard/page.tsx  → /dashboard
  team/page.tsx       → /team
  settings/page.tsx   → /settings
  history/page.tsx    → /history
  search/page.tsx     → /search
  stats/weekly/page.tsx   → /stats/weekly
  stats/monthly/page.tsx  → /stats/monthly
api/
  todos/route.ts      → GET/POST /api/todos
  todos/[id]/route.ts → PATCH/DELETE /api/todos/:id
```

### Common Patterns
- Server Components by default
- Use `"use client"` directive for client-side interactivity
- Auth check with `auth()` from `@/lib/auth`
- Korean language in UI text

## Dependencies

### Internal
- `@/components/*` - UI components
- `@/lib/auth` - Authentication helpers
- `@/lib/prisma` - Database client

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
