<!-- Parent: ../CLAUDE.md -->
<!-- Generated: 2026-02-03 | Updated: 2026-02-03 -->

# public

## Purpose
Static assets served directly by Next.js. Contains SVG icons, PWA manifest, and other publicly accessible files.

## Key Files

| File | Description |
|------|-------------|
| `manifest.json` | PWA manifest for installable web app configuration |
| `file.svg` | File icon |
| `globe.svg` | Globe/world icon |
| `next.svg` | Next.js logo |
| `vercel.svg` | Vercel logo |
| `window.svg` | Window icon |

## For AI Agents

### Working In This Directory
- Files are served at root URL path (e.g., `/manifest.json`)
- SVG files can be referenced in components as `/filename.svg`
- PWA manifest should be updated when app name or icons change

### Adding New Assets
- Place static images, fonts, and icons here
- Use descriptive filenames
- Prefer SVG for icons and logos

## Dependencies

### Internal
- Referenced by `src/app/layout.tsx` for metadata and manifest

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
