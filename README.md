# LOTM Interactive Companion

Private, spoiler-aware visual companion for **Lord of the Mysteries Book 1**.

## Current state
Phase 0: foundation.

## Stack
- Next.js 16.3.4 Active LTS
- React 19.2
- TypeScript
- static export for Cloudflare Pages
- Vercel-compatible deployment

## Start
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

Static output is generated in `out/`.

See `AGENTS.md` for ChatGPT/Codex collaboration rules and `docs/ROADMAP.md` for phases.

## Current status

Phase 1 is active. The supplied EPUB is parsed into metadata-only manifests: 1,430 chapter entries, 8 volumes and 328 embedded images. Novel prose is intentionally excluded from Git.
