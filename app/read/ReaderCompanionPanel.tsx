'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import chapters from '@/data/generated/chapters';
import timeline from '@/data/generated/timeline.json';
import characters from '@/data/world/characters.json';
import organizations from '@/data/world/organizations.json';
import locations from '@/data/world/locations.json';
import items from '@/data/world/items.json';
import tarot from '@/data/tarot/members.json';

const BOOKMARKS_KEY = 'lotmReaderBookmarks';
const NOTES_KEY = 'lotmReaderNotes';

function readBookmarks(): number[] {
  try { return JSON.parse(window.localStorage.getItem(BOOKMARKS_KEY) ?? '[]'); } catch { return []; }
}
function readNotes(): Record<string, string> {
  try { return JSON.parse(window.localStorage.getItem(NOTES_KEY) ?? '{}'); } catch { return {}; }
}

const labels = new Map<string, string>();
characters.forEach((value) => labels.set(`character:${value.id}`, value.name));
organizations.forEach((value) => labels.set(`organization:${value.id}`, value.name));
locations.forEach((value) => labels.set(`location:${value.id}`, value.name));
items.forEach((value) => labels.set(`item:${value.id}`, value.name));
tarot.forEach((value) => labels.set(`tarot:${value.id}`, `${value.seat} · ${value.name}`));

export default function ReaderCompanionPanel({ chapterNumber }: { chapterNumber: number }) {
  const [open, setOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    setBookmarks(readBookmarks());
    setNotes(readNotes());
  }, []);

  const chapter = useMemo(() => chapters.find((value) => value.number === chapterNumber), [chapterNumber]);
  const events = useMemo(() => timeline.filter((value) => value.chapter === chapterNumber), [chapterNumber]);
  const signals = useMemo(() => (chapter?.mentions ?? []).map((id) => ({ id, label: labels.get(id) ?? id })), [chapter]);
  const bookmarked = bookmarks.includes(chapterNumber);
  const note = notes[String(chapterNumber)] ?? '';

  const toggleBookmark = () => {
    const next = bookmarked ? bookmarks.filter((value) => value !== chapterNumber) : [...bookmarks, chapterNumber].sort((a, b) => a - b);
    setBookmarks(next);
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
  };

  const updateNote = (value: string) => {
    const next = { ...notes, [String(chapterNumber)]: value };
    if (!value.trim()) delete next[String(chapterNumber)];
    setNotes(next);
    window.localStorage.setItem(NOTES_KEY, JSON.stringify(next));
  };

  return <>
    <button type="button" className="readerCompanionToggle" onClick={() => setOpen(true)}>◇ Companion</button>
    <div className={`readerDrawerBackdrop readerCompanionBackdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)}/>
    <aside className={`readerCompanionPanel ${open ? 'open' : ''}`} aria-label="Chapter companion">
      <header><div><small>CHAPTER {chapterNumber}</small><strong>Reader Companion</strong></div><button type="button" onClick={() => setOpen(false)}>×</button></header>
      <div className="readerCompanionBody">
        <div className="readerCompanionActions">
          <button type="button" onClick={toggleBookmark}>{bookmarked ? '★ Bookmarked' : '☆ Bookmark'}</button>
          <Link href={`/chapters/${chapterNumber}`}>Full companion page ↗</Link>
          <Link href={`/klein?spoiler=${chapterNumber}`}>Klein at Ch {chapterNumber} ↗</Link>
        </div>

        <section><p className="eyebrow">INDEXED EVENTS</p>{events.length ? <div className="readerCompanionEvents">{events.map((event) => <article key={event.id}><small>{event.type} · importance {event.importance}/5</small><strong>{event.title}</strong></article>)}</div> : <p className="readerCompanionEmpty">No hand-curated major timeline event is assigned to this chapter yet.</p>}</section>

        <section><p className="eyebrow">COMPANION SIGNALS</p>{signals.length ? <div className="readerCompanionTags">{signals.map((signal) => <span key={signal.id}>{signal.label}</span>)}</div> : <p className="readerCompanionEmpty">No curated entity signals are indexed for this chapter.</p>}</section>

        <section><p className="eyebrow">PRIVATE NOTE</p><textarea value={note} onChange={(event) => updateNote(event.target.value)} placeholder="Write a private note for this chapter…"/><small>Saved only in this browser in the current Phase 8 slice.</small></section>

        {bookmarks.length > 0 && <section><p className="eyebrow">YOUR BOOKMARKS</p><div className="readerBookmarkList">{bookmarks.map((number) => <button type="button" key={number} onClick={() => { const url = new URL(window.location.href); url.searchParams.set('chapter', String(number)); window.location.href = url.toString(); }}>Chapter {number}</button>)}</div></section>}
      </div>
    </aside>
  </>;
}
