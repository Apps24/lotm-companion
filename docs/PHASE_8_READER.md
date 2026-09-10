# Phase 8 — Personal EPUB Reader

## Copyright boundary

The public repository contains the reader engine and derived companion metadata only. Imported EPUB chapter prose and EPUB media stay in the user's browser/IndexedDB. The Supabase sync layer stores personal reader state only.

## Reader modes

### Browser Natural

Default and backend-free. The reader:

- ranks English voices containing Natural/Neural/Online/Premium/Enhanced highest;
- narrates sentence-sized chunks rather than full paragraphs;
- adds paragraph and punctuation-aware pauses;
- supports Storyteller, Calm and Dramatic delivery profiles;
- supports voice preview and speed adjustment;
- highlights the active paragraph.

### Aura-2 AI

Optional high-quality narration through the separate Cloudflare Worker in `workers/tts/` using `@cf/deepgram/aura-2-en`.

Curated reader speakers: Athena, Pluto, Orpheus, Pandora, Vesta, Minerva, Zeus and Orion.

`NEXT_PUBLIC_TTS_WORKER_URL` must point at the deployed narrator Worker. Browser Natural remains the fallback when the Worker is unavailable.

The existing Cloudflare Pages token can deploy Pages but currently cannot publish Worker scripts. A token used by the narrator deployment workflow needs Workers Scripts edit/deploy permission plus the permissions required for Workers AI. This is tracked in #34 and does not block the local/browser narration experience.

## Optional Supabase sync

Set:

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Apply `supabase/reader-sync.sql` to a dedicated project. It creates RLS-protected tables:

- `reader_profiles`
- `reader_progress`
- `reader_settings`
- `bookmarks`
- `annotations`
- `tts_preferences`

Each row is owned by `auth.uid()`. Anonymous access is revoked. The browser uses only the publishable key plus the signed-in user's access token.

The UI supports email OTP sign-in, pushing the current browser state to Supabase, and restoring cloud state to a browser. Synced data includes last chapter, per-chapter scroll position, reader settings, bookmarks, private notes and narrator preferences.

The sync client never sends rendered chapter HTML, EPUB prose, EPUB files or embedded EPUB images. Live project connection is tracked in #35.

## Release status

The core Phase 8 reader is ready for production after green CI and Cloudflare preview. Aura-2 deployment (#34) and connecting a dedicated Supabase project (#35) are optional infrastructure follow-ups; Browser Natural narration and the local EPUB reader remain fully functional without them.
