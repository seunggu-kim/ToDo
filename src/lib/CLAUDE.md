<!-- Parent: ../CLAUDE.md -->
<!-- Generated: 2026-02-03 | Updated: 2026-02-03 -->

# lib

## Purpose
Shared utility functions, database client, authentication configuration, and helper modules used across the application.

## Key Files

| File | Description |
|------|-------------|
| `auth.ts` | NextAuth.js configuration with credentials provider and JWT strategy |
| `prisma.ts` | Prisma client singleton with PostgreSQL adapter |
| `utils.ts` | Utility functions including `cn()` for class name merging |
| `mock-api.ts` | Mock API handlers for client-side testing without backend |
| `mock-data.ts` | Initial mock data definitions for mock mode |
| `slack.ts` | Slack webhook integration for notifications |

## For AI Agents

### Working In This Directory
- All exports should be properly typed
- Database client is a singleton to prevent connection leaks
- Mock mode is enabled via `NEXT_PUBLIC_MOCK_MODE=true` environment variable

### Key Functions

#### auth.ts
```typescript
// Exported from NextAuth
export const { handlers, signIn, signOut, auth } = NextAuth(...)
```
- Uses JWT session strategy
- Credentials provider with bcrypt password validation
- Custom JWT callback adds `id` and `teamId` to token/session

#### prisma.ts
```typescript
export const prisma = globalForPrisma.prisma ?? createPrismaClient()
```
- Uses PostgreSQL adapter (`PrismaPg`)
- Singleton pattern prevents hot-reload connection leaks
- Logging enabled in development mode

#### utils.ts
```typescript
export function cn(...inputs: ClassValue[])
```
- Merges Tailwind classes using `clsx` and `tailwind-merge`

#### mock-api.ts
- `isMockMode()` - Check if mock mode is active
- `mockFetch()` - Drop-in fetch replacement for API routes
- `resetMockData()` - Reset mock data to initial state

#### slack.ts
- `sendSlackMessage()` - Send message to Slack webhook
- `createStartDayMessage()` - Format "day started" message
- `createTodoCompletedMessage()` - Format "todo completed" message

## Dependencies

### External
- `next-auth` - Authentication
- `@prisma/client` - Database ORM
- `bcryptjs` - Password hashing
- `clsx`, `tailwind-merge` - Class utilities

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
