# LOTM Interactive Companion

Private, spoiler-aware visual companion for **Lord of the Mysteries Book 1**.

## Current state
Phase 2 complete: Klein progression knowledge graph.

## Stack
- Next.js 16.3.4 Active LTS
- React 19.2
- TypeScript
- static export for Cloudflare Pages

## Hosting
Cloudflare Pages only.

Production: https://lotm-companion.pages.dev

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

## Validate canonical data
```bash
npm run validate:data
```

See `AGENTS.md` for ChatGPT/Codex collaboration rules and `docs/ROADMAP.md` for phases.

## Current status

Phase 1 is complete. The supplied EPUB is parsed into metadata-only manifests: 1,430 chapter entries, 8 volumes and 328 embedded images. Novel prose is intentionally excluded from Git.

Phase 2 is complete. It adds Klein's source-anchored Sequence 9 → 0 progression, identity transitions, relationship knowledge states, major antagonists and fights, mystical-item ownership history, Klein-centric locations and organizations, normalized source locators, typed knowledge-graph contracts, CI data validation, and chapter-based spoiler gating on `/klein`.
