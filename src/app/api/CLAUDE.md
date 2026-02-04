<!-- Parent: ../CLAUDE.md -->
<!-- Generated: 2026-02-03 | Updated: 2026-02-03 -->

# api

## Purpose
Backend API routes built with Next.js App Router. All routes export HTTP method handlers (GET, POST, PATCH, DELETE) and follow RESTful conventions. Includes development mode with mock data for testing.

## Key Files

| File | Description |
|------|-------------|
| (No files directly in this directory) | |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `auth/` | Authentication endpoints (NextAuth.js handlers, registration) |
| `todos/` | Todo CRUD operations and search |
| `team/` | Team management (create, join, leave, settings) |
| `goals/` | Team goals CRUD operations |
| `templates/` | Todo templates CRUD |
| `dashboard/` | Dashboard data aggregation |
| `stats/` | Statistics endpoints (weekly, monthly) |
| `history/` | Historical data queries |
| `start-day/` | Work day start tracking |
| `cron/` | Scheduled tasks (carry-over) |

## API Endpoints

### Todos
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/todos` | List todos (query: date, backlog) |
| POST | `/api/todos` | Create todo |
| PATCH | `/api/todos/[id]` | Update todo |
| DELETE | `/api/todos/[id]` | Delete todo |
| GET | `/api/todos/search` | Search todos |
| GET | `/api/todos/weekly` | Weekly todo summary |

### Team
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/team` | Get current team info |
| POST | `/api/team` | Create new team |
| POST | `/api/team/join` | Join team with invite code |
| POST | `/api/team/leave` | Leave current team |
| PATCH | `/api/team/settings` | Update team settings (Slack webhook) |

### Goals
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/goals` | List active team goals with D-day |
| POST | `/api/goals` | Create team goal |
| PATCH | `/api/goals/[id]` | Update goal |
| DELETE | `/api/goals/[id]` | Delete goal |

### Other
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/start-day` | Check/record work day start |
| GET | `/api/dashboard` | Dashboard aggregated data |
| GET | `/api/history` | Historical todo data |
| GET | `/api/stats/weekly` | Weekly statistics |
| GET | `/api/stats/monthly` | Monthly statistics |
| GET | `/api/cron/carry-over` | Cron job for incomplete todo carry-over |

## For AI Agents

### Working In This Directory
- Use `route.ts` files with exported HTTP method functions
- Always check authentication with `auth()` from `@/lib/auth`
- Development mode (`isDev`) returns mock data without database
- Dynamically import Prisma to reduce bundle size: `await import("@/lib/prisma")`

### Response Patterns
```typescript
// Success
return NextResponse.json(data, { status: 200 });

// Created
return NextResponse.json(newItem, { status: 201 });

// Error
return NextResponse.json({ error: "Message" }, { status: 400 });

// Unauthorized
return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
```

### Common Checks
1. Auth check: `if (!session?.user?.id) return 401`
2. Team membership: `if (!user?.teamId) return 400`
3. Ownership: Verify user owns the resource before update/delete

### Slack Integration
- Team settings include optional `slackWebhookUrl`
- Notifications sent on: day start, todo completion
- Use `@/lib/slack` for message formatting

## Dependencies

### Internal
- `@/lib/auth` - Authentication
- `@/lib/prisma` - Database client
- `@/lib/slack` - Slack notifications

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
