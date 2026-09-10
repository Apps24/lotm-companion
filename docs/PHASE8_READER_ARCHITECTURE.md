# Phase 8 Reader Architecture

Phase 8 turns the companion into a personal EPUB reader without committing or publicly serving copyrighted chapter prose.

## Architecture

- Cloudflare Pages: static Next.js application shell.
- Browser: EPUB parsing, chapter rendering, images, search, narration and IndexedDB persistence.
- Supabase (optional sync layer): progress, settings, bookmarks, annotations and TTS preferences only.
- Cloudflare Worker (later slice): optional high-quality TTS endpoint with server-side credentials.

## Reader data flow

1. User selects an `.epub` file.
2. Browser reads the archive with JSZip.
3. `META-INF/container.xml` resolves the OPF package document.
4. OPF manifest/spine are parsed into ordered reading resources.
5. Navigation document / NCX is used for labels when available; otherwise headings and canonical companion chapter data are used.
6. Chapter XHTML is sanitized before rendering.
7. Relative EPUB images are resolved to browser `blob:` URLs from the imported archive.
8. The source EPUB blob and parsed book index are stored in IndexedDB where quota allows.
9. Chapter text never leaves the browser in default mode.

## Narration

Default narration uses `window.speechSynthesis` and local/device voices. Narration is paragraph-based to support highlighting, pause/resume, previous/next paragraph and chapter continuation.

A later Cloudflare Worker TTS mode may send bounded text chunks for on-demand audio. It must never expose provider credentials or publish generated audiobook files.

## Copyright boundary

The GitHub repository stores only the reader engine, companion metadata and user-generated/project-generated visuals. It does not contain the novel EPUB, chapter prose, or original EPUB media.
