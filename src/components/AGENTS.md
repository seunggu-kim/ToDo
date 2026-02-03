<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-03 | Updated: 2026-02-03 -->

# components

## Purpose
Reusable React components for the application. Contains both feature-specific components and base UI components (shadcn/ui based) in the `ui/` subdirectory.

## Key Files

| File | Description |
|------|-------------|
| `providers.tsx` | Context providers wrapper (SessionProvider, ThemeProvider) |
| `main-nav.tsx` | Bottom navigation bar for main app |
| `todo-list.tsx` | Todo list container with drag-and-drop support |
| `todo-item.tsx` | Individual todo item with checkbox and actions |
| `team-goals.tsx` | Team goals display with D-day countdown |
| `goal-dialog.tsx` | Dialog for creating/editing team goals |
| `weekly-calendar.tsx` | Weekly calendar component for date navigation |
| `start-day-button.tsx` | Button to start the work day |
| `quick-add-fab.tsx` | Floating action button for quick todo creation |
| `manual-carry-over-button.tsx` | Button to manually carry over incomplete todos |
| `history-member-card.tsx` | Card showing team member history |
| `history-week-selector.tsx` | Week selector for history view |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `ui/` | Base UI components (shadcn/ui) (see `ui/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Components are client components by default (using `"use client"`)
- Use shadcn/ui components from `./ui/` as building blocks
- Follow existing naming conventions (kebab-case files, PascalCase exports)
- Use `cn()` utility from `@/lib/utils` for conditional classes

### Component Patterns
- Props interfaces defined at top of file
- Use React hooks for state management
- API calls via fetch with proper error handling
- Toast notifications via `sonner` for user feedback

### Key Dependencies
- `@hello-pangea/dnd` - Drag and drop in todo-list
- `canvas-confetti` - Celebration effects on completion
- `date-fns` - Date formatting and manipulation
- `lucide-react` - Icons

## Dependencies

### Internal
- `@/lib/utils` - Class name utility
- `@/lib/mock-api` - Mock API for testing

### External
- `@hello-pangea/dnd` - Drag and drop
- `lucide-react` - Icons
- `date-fns` - Date utilities
- `canvas-confetti` - Confetti animations

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
