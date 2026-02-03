<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-03 | Updated: 2026-02-03 -->

# (auth)

## Purpose
Next.js route group for authentication pages. Contains login and registration pages with a minimal centered layout. These are public pages that don't require authentication.

## Key Files

| File | Description |
|------|-------------|
| `layout.tsx` | Centered layout wrapper for auth pages |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `login/` | Login page with credentials form |
| `register/` | User registration page |

## Route Mapping

| Path | Page |
|------|------|
| `/login` | `login/page.tsx` |
| `/register` | `register/page.tsx` |

## For AI Agents

### Working In This Directory
- Layout provides centered card-style container
- Pages should be client components for form handling
- Use `react-hook-form` with `zod` for form validation
- Use `signIn` from `@/lib/auth` for authentication

### UI Patterns
- Centered layout with max-width container
- Card-based form design
- Toast notifications for errors/success
- Links between login/register pages

## Dependencies

### Internal
- `@/lib/auth` - Authentication utilities
- `@/components/ui/*` - Form components (input, button, form, label)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
