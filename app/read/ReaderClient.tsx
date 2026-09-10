'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReaderCompanionPanel from './ReaderCompanionPanel';
import { clearActiveEpub, loadActiveEpub, saveActiveEpub } from '@/lib/reader/idb';
import { loadEpub, renderEpubChapter, revokeRenderedAssets, type LoadedReaderBook } from '@/lib/reader/epub';
import type { ReaderPreferences, RenderedReaderChapter } from '@/lib/reader/types';

const PREFS_KEY = 'lotmReaderPreferences';
const LAST_CHAPTER_KEY = 'lotmReaderLastChapter';
const SPOILER_KEY = 'lotmSpoilerChapter';

const defaultPreferences: ReaderPreferences = {
  fontFamily: 'serif',
  fontSize: 20,
  lineHeight: 1.75,
  contentWidth: 780,
  paragraphIndent: false,
  theme: 'night',
  stickyToolbar: false,
  voiceURI: '',
  speechRate: 1,
  speechPitch: 1,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function readPreferences(): ReaderPreferences {
  if (typeof window === 'undefined') return defaultPreferences;
  try {
    return { ...defaultPreferences, ...(JSON.parse(window.localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<ReaderPreferences>) };
  } catch {
    return defaultPreferences;
  }
}

export default function ReaderClient() {
  const [book, setBook] = useState<LoadedReaderBook | null>(null);
  const [fileName, setFileName] = useState('');
  const [chapterNumber, setChapterNumber] = useState(1);
  const [rendered, setRendered] = useState<RenderedReaderChapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoreAttempted, setRestoreAttempted] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<ReaderPreferences>(defaultPreferences);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechState, setSpeechState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [speechIndex, setSpeechIndex] = useState(0);
  const [readProgress, setReadProgress] = useState(0);
  const renderedRef = useRef<RenderedReaderChapter | null>(null);
  const speechSession = useRef(0);
  const articleRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setPreferences(readPreferences()), []);
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    const refreshVoices = () => setVoices(window.speechSynthesis?.getVoices() ?? []);
    refreshVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', refreshVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', refreshVoices);
  }, []);

  const stopNarration = useCallback(() => {
    speechSession.current += 1;
    window.speechSynthesis?.cancel();
    setSpeechState('idle');
  }, []);

  const selectChapter = useCallback((value: number, availableBook = book) => {
    if (!availableBook?.metadata.chapters.length) return;
    const first = availableBook.metadata.chapters[0]?.number ?? 1;
    const last = availableBook.metadata.chapters.at(-1)?.number ?? first;
    const next = clamp(Math.round(value), first, last);
    if (!availableBook.metadata.chapters.some((chapter) => chapter.number === next)) return;

    stopNarration();
    setChapterNumber(next);
    setDrawerOpen(false);
    window.localStorage.setItem(LAST_CHAPTER_KEY, String(next));
    const spoiler = Number(window.localStorage.getItem(SPOILER_KEY) ?? 1);
    if (!Number.isFinite(spoiler) || next > spoiler) window.localStorage.setItem(SPOILER_KEY, String(next));
    const url = new URL(window.location.href);
    url.searchParams.set('chapter', String(next));
    window.history.replaceState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [book, stopNarration]);

  const openEpubFile = useCallback(async (file: File, persist: boolean) => {
    setLoading(true);
    setError('');
    stopNarration();
    try {
      const loaded = await loadEpub(file);
      setBook(loaded);
      setFileName(file.name);
      const requested = Number(new URLSearchParams(window.location.search).get('chapter'));
      const saved = Number(window.localStorage.getItem(LAST_CHAPTER_KEY));
      const preferred = Number.isFinite(requested) && requested > 0
        ? requested
        : Number.isFinite(saved) && saved > 0 ? saved : loaded.metadata.chapters[0]?.number ?? 1;
      const selected = loaded.metadata.chapters.some((chapter) => chapter.number === preferred)
        ? preferred
        : loaded.metadata.chapters[0]?.number ?? 1;
      setChapterNumber(selected);
      if (persist) {
        try { await saveActiveEpub(file); }
        catch (storageError) { console.warn('EPUB opened, but browser storage could not retain the file.', storageError); }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to open this EPUB.');
    } finally {
      setLoading(false);
    }
  }, [stopNarration]);

  useEffect(() => {
    let cancelled = false;
    loadActiveEpub()
      .then((file) => { if (!cancelled && file) return openEpubFile(file, false); })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setRestoreAttempted(true); });
    return () => { cancelled = true; };
  }, [openEpubFile]);

  const currentChapter = useMemo(
    () => book?.metadata.chapters.find((chapter) => chapter.number === chapterNumber) ?? null,
    [book, chapterNumber],
  );

  useEffect(() => {
    if (!book || !currentChapter) return;
    let cancelled = false;
    setRendered(null);
    setError('');
    renderEpubChapter(book, currentChapter)
      .then((nextRendered) => {
        if (cancelled) return revokeRenderedAssets(nextRendered);
        revokeRenderedAssets(renderedRef.current);
        renderedRef.current = nextRendered;
        setRendered(nextRendered);
        setSpeechIndex(0);
        requestAnimationFrame(() => {
          const savedPercent = Number(window.localStorage.getItem(`lotmReaderPosition:${chapterNumber}`) ?? 0);
          if (savedPercent > 0 && savedPercent < 1) {
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            window.scrollTo({ top: maxScroll * savedPercent });
          }
        });
      })
      .catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to render this chapter.'); });
    return () => { cancelled = true; };
  }, [book, currentChapter, chapterNumber]);

  useEffect(() => () => revokeRenderedAssets(renderedRef.current), []);

  useEffect(() => {
    const onScroll = () => {
      if (!book) return;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const percent = clamp(window.scrollY / maxScroll, 0, 1);
      setReadProgress(percent);
      window.localStorage.setItem(`lotmReaderPosition:${chapterNumber}`, String(percent));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [book, chapterNumber]);

  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;
    root.querySelectorAll('[data-reader-block]').forEach((node) => {
      const element = node as HTMLElement;
      const active = speechState !== 'idle' && Number(element.dataset.readerBlock) === speechIndex;
      element.classList.toggle('readerSpeaking', active);
      if (active) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [speechIndex, speechState, rendered]);

  const filteredChapters = useMemo(() => {
    if (!book) return [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return book.metadata.chapters;
    return book.metadata.chapters.filter((chapter) => `${chapter.number} ${chapter.title}`.toLowerCase().includes(normalized));
  }, [book, query]);

  const startNarration = useCallback((startIndex = speechIndex) => {
    if (!rendered?.blocks.length || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const token = ++speechSession.current;
    const selectedVoice = voices.find((voice) => voice.voiceURI === preferences.voiceURI);

    const speak = (index: number) => {
      if (token !== speechSession.current) return;
      if (index >= rendered.blocks.length) {
        setSpeechState('idle');
        setSpeechIndex(0);
        return;
      }
      setSpeechIndex(index);
      const utterance = new SpeechSynthesisUtterance(rendered.blocks[index]);
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.rate = preferences.speechRate;
      utterance.pitch = preferences.speechPitch;
      utterance.onstart = () => token === speechSession.current && setSpeechState('playing');
      utterance.onend = () => token === speechSession.current && speak(index + 1);
      utterance.onerror = () => token === speechSession.current && setSpeechState('idle');
      window.speechSynthesis.speak(utterance);
    };

    speak(clamp(startIndex, 0, rendered.blocks.length - 1));
  }, [preferences.speechPitch, preferences.speechRate, preferences.voiceURI, rendered, speechIndex, voices]);

  const togglePause = () => {
    if (speechState === 'playing') {
      window.speechSynthesis.pause();
      setSpeechState('paused');
    } else if (speechState === 'paused') {
      window.speechSynthesis.resume();
      setSpeechState('playing');
    } else {
      startNarration(0);
    }
  };

  const forgetBook = async () => {
    stopNarration();
    revokeRenderedAssets(renderedRef.current);
    renderedRef.current = null;
    setRendered(null);
    setBook(null);
    setFileName('');
    await clearActiveEpub().catch(() => undefined);
  };

  const importFile = (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.epub')) return setError('Please choose an .epub file.');
    void openEpubFile(file, true);
  };

  if (!book) {
    return <section className="readerImportShell">
      <div className="readerDropZone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); importFile(event.dataTransfer.files[0]); }}>
        <span className="readerImportIcon">◈</span>
        <p className="eyebrow">PRIVATE · LOCAL-FIRST</p>
        <h2>{loading ? 'Opening EPUB…' : 'Import your LOTM EPUB'}</h2>
        <p>The book is parsed in your browser. Novel text and original EPUB images are not uploaded to this site or committed to GitHub.</p>
        <button type="button" className="primaryButton" disabled={loading} onClick={() => fileInputRef.current?.click()}>{loading ? 'Reading file…' : 'Choose EPUB'}</button>
        <input ref={fileInputRef} hidden type="file" accept=".epub,application/epub+zip" onChange={(event) => importFile(event.target.files?.[0])}/>
        {restoreAttempted && <small>After a successful import, the browser will try to remember this EPUB in IndexedDB.</small>}
      </div>
      {error && <p className="readerError">{error}</p>}
    </section>;
  }

  const chapterIndex = book.metadata.chapters.findIndex((chapter) => chapter.number === chapterNumber);
  const previous = chapterIndex > 0 ? book.metadata.chapters[chapterIndex - 1] : null;
  const next = chapterIndex >= 0 && chapterIndex < book.metadata.chapters.length - 1 ? book.metadata.chapters[chapterIndex + 1] : null;

  return <div className={`readerApp readerTheme-${preferences.theme}`}>
    <div className="readerProgressRail"><span style={{ width: `${Math.round(readProgress * 100)}%` }}/></div>

    <div className={`readerToolbar ${preferences.stickyToolbar ? 'isSticky' : ''}`}>
      <div className="readerToolbarLeft">
        <button type="button" onClick={() => setDrawerOpen(true)}>☰ Contents</button>
        <div><small>{fileName}</small><strong>Chapter {chapterNumber}{currentChapter ? ` · ${currentChapter.title}` : ''}</strong></div>
      </div>
      <div className="readerToolbarActions">
        <ReaderCompanionPanel chapterNumber={chapterNumber}/>
        <button type="button" onClick={() => setSettingsOpen((open) => !open)}>Aa</button>
        <button type="button" onClick={() => fileInputRef.current?.click()}>Replace EPUB</button>
        <button type="button" onClick={forgetBook}>Forget</button>
        <input ref={fileInputRef} hidden type="file" accept=".epub,application/epub+zip" onChange={(event) => importFile(event.target.files?.[0])}/>
      </div>
    </div>

    {settingsOpen && <section className="readerSettings">
      <label>Theme<select value={preferences.theme} onChange={(event) => setPreferences((value) => ({ ...value, theme: event.target.value as ReaderPreferences['theme'] }))}><option value="night">Night</option><option value="paper">Paper</option><option value="sepia">Sepia</option></select></label>
      <label>Font<select value={preferences.fontFamily} onChange={(event) => setPreferences((value) => ({ ...value, fontFamily: event.target.value as ReaderPreferences['fontFamily'] }))}><option value="serif">Serif</option><option value="sans">Sans</option></select></label>
      <label>Size <input type="range" min="15" max="34" value={preferences.fontSize} onChange={(event) => setPreferences((value) => ({ ...value, fontSize: Number(event.target.value) }))}/><span>{preferences.fontSize}px</span></label>
      <label>Line height <input type="range" min="1.35" max="2.25" step="0.05" value={preferences.lineHeight} onChange={(event) => setPreferences((value) => ({ ...value, lineHeight: Number(event.target.value) }))}/><span>{preferences.lineHeight.toFixed(2)}</span></label>
      <label>Width <input type="range" min="560" max="1100" step="20" value={preferences.contentWidth} onChange={(event) => setPreferences((value) => ({ ...value, contentWidth: Number(event.target.value) }))}/><span>{preferences.contentWidth}px</span></label>
      <label className="readerCheck"><input type="checkbox" checked={preferences.paragraphIndent} onChange={(event) => setPreferences((value) => ({ ...value, paragraphIndent: event.target.checked }))}/> Paragraph indent</label>
      <label className="readerCheck"><input type="checkbox" checked={preferences.stickyToolbar} onChange={(event) => setPreferences((value) => ({ ...value, stickyToolbar: event.target.checked }))}/> Sticky reader toolbar</label>
    </section>}

    <div className={`readerDrawerBackdrop ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)}/>
    <aside className={`readerDrawer ${drawerOpen ? 'open' : ''}`} aria-label="EPUB contents">
      <div className="readerDrawerHeader"><div><small>{book.metadata.chapterCount} numbered chapters</small><strong>{book.metadata.title}</strong></div><button type="button" onClick={() => setDrawerOpen(false)}>×</button></div>
      <input className="readerChapterSearch" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chapter number or title…"/>
      <div className="readerChapterList">{filteredChapters.map((chapter) => <button type="button" className={chapter.number === chapterNumber ? 'active' : ''} key={chapter.number} onClick={() => selectChapter(chapter.number)}><span>{chapter.number}</span><strong>{chapter.title}</strong></button>)}</div>
    </aside>

    <main className="readerStage">
      <nav className="readerPager topPager">
        <button type="button" disabled={!previous} onClick={() => previous && selectChapter(previous.number)}>← {previous ? `Chapter ${previous.number}` : 'Start'}</button>
        <span>{Math.round(readProgress * 100)}% read</span>
        <button type="button" disabled={!next} onClick={() => next && selectChapter(next.number)}>{next ? `Chapter ${next.number}` : 'End'} →</button>
      </nav>

      <article className={`readerPaper ${preferences.paragraphIndent ? 'indentParagraphs' : ''} ${preferences.fontFamily === 'sans' ? 'sansReader' : ''}`} style={{ maxWidth: preferences.contentWidth, fontSize: preferences.fontSize, lineHeight: preferences.lineHeight }}>
        <header className="readerChapterHeading"><p className="eyebrow">PERSONAL EPUB · CHAPTER {chapterNumber}</p><h1>{currentChapter?.title ?? `Chapter ${chapterNumber}`}</h1></header>
        {error && <p className="readerError">{error}</p>}
        {!rendered && !error && <div className="readerLoading">Preparing chapter…</div>}
        {rendered && <div ref={articleRef} className="readerEpubContent" dangerouslySetInnerHTML={{ __html: rendered.html }}/>} 
      </article>

      <nav className="readerPager bottomPager">
        <button type="button" disabled={!previous} onClick={() => previous && selectChapter(previous.number)}>← Previous chapter</button>
        <button type="button" onClick={() => setDrawerOpen(true)}>All chapters</button>
        <button type="button" disabled={!next} onClick={() => next && selectChapter(next.number)}>Next chapter →</button>
      </nav>
    </main>

    <section className="readerNarrator" aria-label="Chapter narration controls">
      <div className="readerNarratorPrimary">
        <button type="button" disabled={!rendered?.blocks.length} onClick={() => startNarration(Math.max(0, speechIndex - 1))}>‹</button>
        <button type="button" className="narratorPlay" disabled={!rendered?.blocks.length} onClick={togglePause}>{speechState === 'playing' ? 'Pause' : speechState === 'paused' ? 'Resume' : 'Listen'}</button>
        <button type="button" disabled={!rendered?.blocks.length} onClick={() => startNarration(Math.min((rendered?.blocks.length ?? 1) - 1, speechIndex + 1))}>›</button>
        <button type="button" onClick={stopNarration}>Stop</button>
        <span>{rendered?.blocks.length ? `Paragraph ${Math.min(speechIndex + 1, rendered.blocks.length)} / ${rendered.blocks.length}` : 'No narration blocks'}</span>
      </div>
      <div className="readerNarratorSettings">
        <label>Voice<select value={preferences.voiceURI} onChange={(event) => setPreferences((value) => ({ ...value, voiceURI: event.target.value }))}><option value="">System default</option>{voices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</select></label>
        <label>Speed<input type="range" min="0.6" max="2" step="0.1" value={preferences.speechRate} onChange={(event) => setPreferences((value) => ({ ...value, speechRate: Number(event.target.value) }))}/><span>{preferences.speechRate.toFixed(1)}×</span></label>
        <label>Pitch<input type="range" min="0.5" max="1.5" step="0.1" value={preferences.speechPitch} onChange={(event) => setPreferences((value) => ({ ...value, speechPitch: Number(event.target.value) }))}/><span>{preferences.speechPitch.toFixed(1)}</span></label>
      </div>
    </section>
  </div>;
}
