# Project maintenance

The authoritative application is the React + Vite + TypeScript project at this root. Edit src/ and public/content/, not the previous prototype or mirrored HTML.

- Preserve original fonts, media, DOM classes and visual layout unless a design change is requested.
- Content uses React node data (tag, attrs, children). Do not reintroduce original scripts, jQuery or iframe wrappers.
- Look up the requested URL in public/content/routes.json. Shared headers and footers are in public/content/shared/.
- Keep search.json and archives.json in sync when changing indexed text or archive cards.
- Do not rerun scripts/import-content.py during normal maintenance; it overwrites content edits.
- Keep Vite watchers/scanner restricted; mirror/, source-inspection/ and r2-media/ contain large files.
- Cloudflare uses Pages for dist and R2 for media. Never commit credentials. Set VITE_ASSET_BASE_URL at build time.
- Report verification honestly; do not claim pixel-perfect parity without actual comparisons.
