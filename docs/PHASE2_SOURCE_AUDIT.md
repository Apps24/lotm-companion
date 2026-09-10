# Phase 2 — Klein Canonical Source Audit

Phase 2 uses the supplied Book 1 EPUB as the primary source. The repository stores derived metadata and summaries only; novel prose is not committed.

## Normalized source locator

All canonical records resolve through the same locator contract defined in `lib/types/knowledge-graph.ts` and enforced by `scripts/validate-klein-data.mjs`:

```ts
{
  chapter: number;
  chapterTitle?: string;
  sourceType: 'epub' | 'web' | 'derived';
  verificationStatus: string;
}
```

Event datasets already contain `chapter`, event/chapter `title` where applicable, and `sourceStatus`. Audited item, fight, location and organization records also carry an explicit `sourceLocator`. CI rejects invalid chapter numbers, duplicate stable keys, unknown relationship references, weak item/fight source status, missing ownership histories, missing location/organization ranges, and missing Sequence 9→0 milestones.

## Canonical-file rule

`data/characters/klein-moretti.json` is now an index only. It no longer duplicates identities or Sequence milestones. The canonical files are:

- `klein-sequence-milestones.json`, `klein-sequence-events*.json`, `klein-sequence-evidence.json`
- `klein-identities.json`, `klein-identity-events.json`
- `klein-relationships.json`, `klein-antagonists.json`, `klein-cosmic-antagonists.json` and their event files
- `klein-items.json`
- `klein-fights.json`
- `klein-locations.json`
- `klein-organizations.json`

## Corrected anchors retained in canonical data

- Seer promotion: Chapter 31; explicit full digestion: Chapter 132.
- Clown promotion: Chapter 168; full digestion: Chapter 287.
- Magician promotion: Chapter 296; full digestion: Chapter 428.
- Faceless promotion: Chapter 451; full digestion: Chapter 660.
- Marionettist promotion: Chapter 664; full digestion: Chapter 945.
- Bizarro Sorcerer promotion: Chapter 946.
- Scholar of Yore promotion: Chapter 1137; explicit full digestion: Chapter 1167.
- Miracle Invoker promotion: Chapter 1268; final digestion: Chapter 1351.
- Attendant of Mysteries promotion: Chapter 1352.
- The Fool apotheosis anchor: Chapter 1380.
- The Fool code name is explicitly established in Chapter 7 after the gray-fog host phase begins in Chapter 6.
- Dwayne Dantès is established in Chapter 732.
- Merlin Hermes' wandering-magician phase begins before the explicit alias; the name is explicitly given in Chapter 1290.

## Mystical-item audit

The Phase 2 item set is now EPUB-anchored with holder history rather than a single terminal owner field:

- Azik's Copper Whistle — given to Klein in Chapter 170 and retained through Book 1.
- Black Emperor Card — bookmark acquired in Chapter 321, activated in Chapter 323, retained above the gray fog.
- Creeping Hunger — introduced in Chapter 146, passes Qilangos → Azik → Klein (Chapter 480), and is explicitly listed as lost after the Amon escape in Chapter 1171.
- Sea God Scepter — acquired after Kalvetua in Chapter 549 and assigned to Alger for the post-slumber mission in Chapter 1390.
- Death Knell — introduced in Chapter 707, purchased by Klein in Chapter 708, and explicitly listed as lost in Chapter 1171.
- Arrodes — first direct Klein interaction in Chapter 417; modeled as a recurring allied living Sealed Artifact rather than falsely marked as Klein's owned property.

## Spoiler contract

The `/klein` page renders only records at or below the selected spoiler chapter. The selected chapter is persisted in `localStorage` under `lotmSpoilerChapter` and mirrored to `?spoiler=N`. Future identity end ranges, relationship state boundaries, fight outcomes, item transfers and location/organization summaries are not rendered before their chapter becomes visible.
