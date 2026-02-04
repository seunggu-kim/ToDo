<!-- Generated: 2026-02-03 | Updated: 2026-02-03 -->

# ToDo

## Purpose
A team-based task management web application built with Next.js 16, enabling users to manage daily todos, track progress with statistics, and collaborate within teams. Features include daily task management, weekly/monthly statistics, team goals with D-day tracking, and Slack integration for notifications.

## Key Files

| File | Description |
|------|-------------|
| `package.json` | Project dependencies and npm scripts (dev, build, start, lint) |
| `tsconfig.json` | TypeScript configuration with strict mode and path aliases (@/*) |
| `next.config.ts` | Next.js configuration |
| `prisma.config.ts` | Prisma database configuration |
| `components.json` | shadcn/ui component configuration |
| `vercel.json` | Vercel deployment configuration |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `prisma/` | Database schema and Prisma ORM configuration (see `prisma/CLAUDE.md`) |
| `public/` | Static assets including PWA manifest (see `public/CLAUDE.md`) |
| `src/` | Application source code (see `src/CLAUDE.md`) |

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.6 | React framework with App Router |
| React | 19.2.3 | UI library |
| TypeScript | 5.x | Type safety |
| Prisma | 7.3.0 | Database ORM with PostgreSQL |
| NextAuth.js | 5.0.0-beta | Authentication |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | - | UI component library (Radix UI based) |
| Recharts | 3.7.0 | Charts for statistics |
| date-fns | 4.1.0 | Date manipulation |
| Zod | 4.3.6 | Schema validation |

## For AI Agents

### Working In This Directory
- Use `npm run dev` to start development server
- Use `npm run build` to create production build
- Use `npm run lint` for ESLint checks
- Path alias `@/*` maps to `./src/*`
- Korean language is used in some comments and UI strings

### Testing Requirements
- Run `npm run build` to verify no TypeScript/build errors
- Check Prisma schema changes with `npx prisma validate`

### Common Patterns
- Next.js App Router with route groups: `(auth)` for login/register, `(main)` for authenticated pages
- API routes under `src/app/api/` with route.ts files
- shadcn/ui components in `src/components/ui/`
- Authentication via NextAuth.js with credentials provider
- Mock mode available for UI testing without server (see `src/lib/mock-api.ts`)

### Environment Variables
Required environment variables (see `.env.example` if exists):
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - NextAuth.js secret
- `SLACK_WEBHOOK_URL` - Optional Slack integration

## Dependencies

### External (Key)
- `@hello-pangea/dnd` - Drag and drop for todo reordering
- `bcryptjs` - Password hashing
- `canvas-confetti` - Celebration animations
- `sonner` - Toast notifications
- `lucide-react` - Icons

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
