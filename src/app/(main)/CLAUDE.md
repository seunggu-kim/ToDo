<!-- Parent: ../CLAUDE.md -->
<!-- Generated: 2026-02-03 | Updated: 2026-02-03 -->

# (main)

## Purpose
Next.js route group for main application pages. Contains all authenticated pages with shared layout including bottom navigation. Authentication is enforced at the layout level with development/mock mode bypass.

## Key Files

| File | Description |
|------|-------------|
| `layout.tsx` | Main layout with auth check and MainNav component |
| `loading.tsx` | Loading state component for Suspense |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `today/` | Daily todo management with weekly calendar |
| `dashboard/` | Team dashboard with member progress |
| `team/` | Team management (create/join team) |
| `settings/` | User settings and templates |
| `history/` | Historical todo data by week |
| `search/` | Search across all todos |
| `stats/` | Statistics pages (weekly/monthly) |

## Route Mapping

| Path | Page | Description |
|------|------|-------------|
| `/today` | `today/page.tsx` | Main todo page with weekly calendar |
| `/dashboard` | `dashboard/page.tsx` | Team member progress overview |
| `/team` | `team/page.tsx` | Team management |
| `/settings` | `settings/page.tsx` | User settings and templates |
| `/history` | `history/page.tsx` | Historical data viewer |
| `/search` | `search/page.tsx` | Todo search |
| `/stats/weekly` | `stats/weekly/page.tsx` | Weekly statistics |
| `/stats/monthly` | `stats/monthly/page.tsx` | Monthly statistics |

## For AI Agents

### Working In This Directory
- Layout enforces authentication (redirect to `/login` if not authenticated)
- Development mode (`NODE_ENV=development`) and mock mode skip auth
- Mock user provided for development testing
- All pages share bottom navigation via `MainNav`

### Page Patterns
- Client components (`"use client"`) for interactivity
- Team membership check - redirect to `/team` if no team
- API calls via fetch to `/api/*` routes
- Use callbacks to avoid unnecessary re-renders

### Common State
- `selectedDate` for date-based views
- `todos` array with Todo interface
- `hasTeam` boolean for team membership check

## Dependencies

### Internal
- `@/lib/auth` - Auth utilities
- `@/components/main-nav` - Navigation component
- `@/components/ui/*` - UI components

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
