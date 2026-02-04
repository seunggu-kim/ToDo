<!-- Parent: ../CLAUDE.md -->
<!-- Generated: 2026-02-03 | Updated: 2026-02-03 -->

# prisma

## Purpose
Contains the Prisma ORM configuration and database schema definitions. Defines the data models for users, teams, todos, and related entities with PostgreSQL as the database provider.

## Key Files

| File | Description |
|------|-------------|
| `schema.prisma` | Database schema with all model definitions |
| `dev.db` | Local SQLite development database (if using libsql adapter) |

## Data Models

| Model | Description |
|-------|-------------|
| `User` | User accounts with authentication and team membership |
| `Team` | Teams with invite codes and optional Slack webhook |
| `Todo` | Task items with completion status, priority, and carry-over count |
| `DayStart` | Tracks when users start their work day |
| `TodoTemplate` | Reusable todo templates per user |
| `TeamGoal` | Team-wide goals with target dates (D-day feature) |
| `Account` | NextAuth.js OAuth provider accounts |
| `Session` | NextAuth.js sessions |
| `VerificationToken` | Email verification tokens |

## For AI Agents

### Working In This Directory
- After modifying `schema.prisma`, run `npx prisma generate` to update the client
- Use `npx prisma db push` for development schema sync
- Use `npx prisma migrate dev` for production-ready migrations
- Validate schema with `npx prisma validate`

### Schema Conventions
- All models use `cuid()` for ID generation
- Timestamps: `createdAt` with `@default(now())`, `updatedAt` with `@updatedAt`
- Indexes defined for frequently queried fields (userId, date, teamId)
- Cascade delete for user-owned data
- Date-only fields use `@db.Date` for proper PostgreSQL date type

### Key Relationships
- User belongs to one Team (optional)
- Todo belongs to both User and Team
- DayStart tracks unique user-date combinations
- TeamGoal has creator reference and team association

## Dependencies

### External
- `@prisma/client` - Generated database client
- `@prisma/adapter-pg` - PostgreSQL adapter
- `@prisma/adapter-libsql` - LibSQL adapter (for local development)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
