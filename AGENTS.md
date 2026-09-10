# LOTM Companion — Agent Instructions

## Mission
Build a private spoiler-aware visual companion for Lord of the Mysteries Book 1 using the supplied EPUB as the primary text source. Web research may verify/expand facts but must be marked separately from EPUB-derived data.

## Collaboration model
- ChatGPT: source analysis, canon verification, data modeling, art direction, acceptance review.
- Codex: implementation, refactors, tests, parsers, migrations, performance work.
- GitHub: source of truth for code, data decisions, issues and phase history.

## Non-negotiable data rule
`chapterStart` / `chapterEnd` anchor all reveal-sensitive records.

## Spoilers
Every reveal, status, identity relation, sequence, item owner and artwork must carry a spoiler chapter. UI must never expose data beyond the user's selected chapter.

## Source hierarchy
1. Uploaded EPUB
2. Official/author material where available
3. Cross-checked community references
4. AI inference — never stored as canon without review

## Branch strategy
- main: deployable
- phase/<n>-<name>: phase development
- data/<area>: large data extraction/review
- art/<area>: artwork metadata/imports

## Definition of done for every phase
- build passes
- data schema validates
- no spoiler regression
- phase notes updated
- preview deployed
- production updated after review
