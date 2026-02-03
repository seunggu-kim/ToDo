<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-03 | Updated: 2026-02-03 -->

# types

## Purpose
TypeScript type definitions and module augmentations for the application. Contains type extensions for third-party libraries.

## Key Files

| File | Description |
|------|-------------|
| `next-auth.d.ts` | Type augmentation for NextAuth.js Session and User types |

## Type Augmentations

### NextAuth Types (`next-auth.d.ts`)
Extends default NextAuth types to include custom fields:

```typescript
// Session.user extended with:
interface Session {
  user: {
    id: string;        // User ID
    teamId: string | null;  // Team membership
  } & DefaultSession["user"];
}

// User extended with:
interface User extends DefaultUser {
  teamId?: string | null;
}

// JWT extended with:
interface JWT extends DefaultJWT {
  id: string;
  teamId?: string | null;
}
```

## For AI Agents

### Working In This Directory
- Use declaration merging for type augmentations (`declare module`)
- Keep type definitions aligned with actual data structures
- Update types when Prisma schema changes affect User/Session

### Adding New Types
- Global types: Create `.d.ts` files
- Shared interfaces: Create regular `.ts` files and export
- Module augmentations: Use `declare module "package-name"`

## Dependencies

### External
- `next-auth` - Types being augmented

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
