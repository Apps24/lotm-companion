'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type NarrationUnit = { text: string; blockIndex: number; paragraphEnd: boolean };
type Delivery = 'storyteller' | 'calm' | 'dramatic';
type NarrationMode = 'browser' | 'ai';

type SavedNarrator = {
  mode: NarrationMode;
  voiceURI: string;
  aiSpeaker: string;
  delivery: Delivery;
  speed: number;
};

const STORAGE_KEY = 'lotmNaturalNarrator';
const AI_TTS_URL = (process.env.NEXT_PUBLIC_TTS_WORKER_URL ?? '').replace(/\/$/, '');

const AI_VOICES = [
  { id: 'athena', label: 'Athena', detail: 'Calm · smooth · mature storyteller' },
  { id: 'pluto', label: 'Pluto', detail: 'Smooth · calm · empathetic baritone' },
  { id: 'orpheus', label: 'Orpheus', detail: 'Clear · confident · trustworthy storyteller' },
  { id: 'pandora', label: 'Pandora', detail: 'British · smooth · calm · melodic' },
  { id: 'vesta', label: 'Vesta', detail: 'Natural · expressive · patient storyteller' },
  { id: 'minerva', label: 'Minerva', detail: 'Friendly · natural · positive storyteller' },
  { id: 'zeus', label: 'Zeus', detail: 'Deep · trustworthy · smooth' },
  { id: 'orion', label: 'Orion', detail: 'Approachable · calm · comfortable' },
] as const;

const DELIVERY = {
  storyteller: { rate: 0.96, pitch: 0.99, pause: 165 },
  calm: { rate: 0.88, pitch: 0.97, pause: 235 },
  dramatic: { rate: 0.92, pitch: 0.96, pause: 205 },
} as const;

const DEFAULTS: SavedNarrator = {
  mode: 'browser',
  voiceURI: '',
  aiSpeaker: 'athena',
  delivery: 'storyteller',
  speed: 1,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function voiceScore(voice: SpeechSynthesisVoice) {
  const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  let score = voice.lang.toLowerCase().startsWith('en') ? 100 : 0;
  if (/natural|neural|online|premium|enhanced/.test(name)) score += 90;
  if (/microsoft/.test(name)) score += 35;
  if (/google/.test(name)) score += 30;
  if (!voice.localService) score += 18;
  if (voice.default) score += 8;
  if (/compact|espeak|festival|robot|zarvox/.test(name)) score -= 80;
  return score;
}

function splitSentences(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  const matches = normalized.match(/[^.!?…]+(?:[.!?…]+["'”’)]*|$)/g);
  return (matches?.map((value) => value.trim()).filter(Boolean) ?? [normalized]);
}

function collectNarrationUnits(): NarrationUnit[] {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('.readerEpubContent [data-reader-block]'));
  const units: NarrationUnit[] = [];
  nodes.forEach((node) => {
    const blockIndex = Number(node.dataset.readerBlock ?? units.length);
    const sentences = splitSentences(node.textContent ?? '');
    sentences.forEach((text, sentenceIndex) => {
      units.push({ text, blockIndex, paragraphEnd: sentenceIndex === sentences.length - 1 });
    });
  });
  return units;
}

function pauseAfter(unit: NarrationUnit, delivery: Delivery) {
  let pause = DELIVERY[delivery].pause;
  if (unit.paragraphEnd) pause += 125;
  if (/\?$/.test(unit.text)) pause += 80;
  if (/!$/.test(unit.text)) pause += 45;
  if (/[…:]$/.test(unit.text)) pause += 90;
  return pause;
}

function loadSaved(): SavedNarrator {
  try {
    return { ...DEFAULTS, ...(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<SavedNarrator>) };
  } catch {
    return DEFAULTS;
  }
}

function getReaderId() {
  const key = 'lotmReaderClientId';
  let value = window.localStorage.getItem(key);
  if (!value) {
    value = globalThis.crypto?.randomUUID?.() ?? `reader-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(key, value);
  }
  return value;
}

export default function NaturalNarrator() {
  const [units, setUnits] = useState<NarrationUnit[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [prefs, setPrefs] = useState<SavedNarrator>(DEFAULTS);
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle');
  const [unitIndex, setUnitIndex] = useState(0);
  const [error, setError] = useState('');
  const session = useRef(0);
  const timer = useRef<number | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => setPrefs(loadSaved()), []);
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    const refresh = () => setVoices(window.speechSynthesis?.getVoices() ?? []);
    refresh();
    window.speechSynthesis?.addEventListener('voiceschanged', refresh);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', refresh);
  }, []);

  useEffect(() => {
    const refresh = () => {
      const next = collectNarrationUnits();
      setUnits(next);
      setUnitIndex((current) => clamp(current, 0, Math.max(0, next.length - 1)));
    };
    refresh();
    const observer = new MutationObserver(() => window.setTimeout(refresh, 40));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const rankedEnglishVoices = useMemo(
    () => voices.filter((voice) => voice.lang.toLowerCase().startsWith('en')).sort((a, b) => voiceScore(b) - voiceScore(a)),
    [voices],
  );
  const recommended = rankedEnglishVoices.slice(0, 8);
  const otherEnglish = rankedEnglishVoices.slice(8);

  useEffect(() => {
    if (!rankedEnglishVoices.length) return;
    if (prefs.voiceURI && rankedEnglishVoices.some((voice) => voice.voiceURI === prefs.voiceURI)) return;
    setPrefs((value) => ({ ...value, voiceURI: rankedEnglishVoices[0].voiceURI }));
  }, [prefs.voiceURI, rankedEnglishVoices]);

  useEffect(() => {
    document.querySelectorAll<HTMLElement>('.readerEpubContent [data-reader-block]').forEach((node) => {
      node.classList.toggle('readerSpeaking', state !== 'idle' && Number(node.dataset.readerBlock) === units[unitIndex]?.blockIndex);
    });
    const active = document.querySelector<HTMLElement>(`.readerEpubContent [data-reader-block="${units[unitIndex]?.blockIndex}"]`);
    if (state === 'playing' && active) active.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [state, unitIndex, units]);

  const clearPlayback = useCallback(() => {
    session.current += 1;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    window.speechSynthesis?.cancel();
    if (audio.current) {
      audio.current.pause();
      audio.current.src = '';
      audio.current = null;
    }
    setState('idle');
  }, []);

  useEffect(() => () => clearPlayback(), [clearPlayback]);

  const speakBrowser = useCallback((start: number) => {
    if (!units.length || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (audio.current) audio.current.pause();
    const token = ++session.current;
    const selectedVoice = rankedEnglishVoices.find((voice) => voice.voiceURI === prefs.voiceURI) ?? rankedEnglishVoices[0];

    const speak = (index: number) => {
      if (token !== session.current) return;
      if (index >= units.length) {
        setState('idle');
        setUnitIndex(0);
        return;
      }
      const unit = units[index];
      setUnitIndex(index);
      const utterance = new SpeechSynthesisUtterance(unit.text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = 'en-US';
      }
      const profile = DELIVERY[prefs.delivery];
      const expressivePitch = /\?$/.test(unit.text) ? 0.025 : /!$/.test(unit.text) ? 0.018 : 0;
      utterance.rate = clamp(prefs.speed * profile.rate, 0.55, 1.55);
      utterance.pitch = clamp(profile.pitch + expressivePitch, 0.8, 1.2);
      utterance.onstart = () => token === session.current && setState('playing');
      utterance.onend = () => {
        if (token !== session.current) return;
        timer.current = window.setTimeout(() => speak(index + 1), pauseAfter(unit, prefs.delivery));
      };
      utterance.onerror = () => token === session.current && setState('idle');
      window.speechSynthesis.speak(utterance);
    };

    speak(clamp(start, 0, units.length - 1));
  }, [prefs.delivery, prefs.speed, prefs.voiceURI, rankedEnglishVoices, units]);

  const speakAi = useCallback(async (start: number) => {
    if (!AI_TTS_URL || !units.length) return;
    window.speechSynthesis?.cancel();
    if (audio.current) audio.current.pause();
    const token = ++session.current;

    const play = async (index: number): Promise<void> => {
      if (token !== session.current || index >= units.length) {
        if (index >= units.length) setState('idle');
        return;
      }
      const unit = units[index];
      setUnitIndex(index);
      setState('loading');
      const response = await fetch(`${AI_TTS_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Reader-Id': getReaderId() },
        body: JSON.stringify({ text: unit.text, speaker: prefs.aiSpeaker }),
      });
      if (!response.ok) throw new Error(await response.text());
      const blob = await response.blob();
      if (token !== session.current) return;
      const url = URL.createObjectURL(blob);
      const player = new Audio(url);
      audio.current = player;
      player.playbackRate = clamp(prefs.speed, 0.75, 1.35);
      player.onplay = () => token === session.current && setState('playing');
      player.onended = () => {
        URL.revokeObjectURL(url);
        if (token !== session.current) return;
        timer.current = window.setTimeout(() => void play(index + 1).catch(handleAiError), pauseAfter(unit, prefs.delivery));
      };
      player.onerror = () => {
        URL.revokeObjectURL(url);
        handleAiError(new Error('AI audio playback failed.'));
      };
      await player.play();
    };

    const handleAiError = (reason: unknown) => {
      if (token !== session.current) return;
      setError('AI voice is unavailable right now. Browser Natural mode still works.');
      setState('idle');
      console.warn(reason);
    };

    setError('');
    await play(clamp(start, 0, units.length - 1)).catch(handleAiError);
  }, [prefs.aiSpeaker, prefs.delivery, prefs.speed, units]);

  const start = useCallback((index = unitIndex) => {
    setError('');
    if (prefs.mode === 'ai' && AI_TTS_URL) void speakAi(index);
    else speakBrowser(index);
  }, [prefs.mode, speakAi, speakBrowser, unitIndex]);

  const togglePause = () => {
    if (state === 'playing') {
      if (prefs.mode === 'ai' && audio.current) audio.current.pause();
      else window.speechSynthesis?.pause();
      setState('paused');
      return;
    }
    if (state === 'paused') {
      if (prefs.mode === 'ai' && audio.current) void audio.current.play();
      else window.speechSynthesis?.resume();
      setState('playing');
      return;
    }
    start(unitIndex);
  };

  const previewVoice = () => {
    clearPlayback();
    const sample = 'Beyond the gas lamps, the fog settled over the sleeping city. Somewhere in the distance, a clock quietly marked the hour.';
    if (prefs.mode === 'ai' && AI_TTS_URL) {
      const tempUnits = units;
      setError('AI voice preview becomes available as soon as the narrator Worker is connected.');
      if (!tempUnits.length) return;
    } else {
      const voice = rankedEnglishVoices.find((value) => value.voiceURI === prefs.voiceURI) ?? rankedEnglishVoices[0];
      const utterance = new SpeechSynthesisUtterance(sample);
      if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
      utterance.rate = DELIVERY[prefs.delivery].rate * prefs.speed;
      utterance.pitch = DELIVERY[prefs.delivery].pitch;
      window.speechSynthesis?.speak(utterance);
    }
  };

  if (!units.length) return null;

  const currentUnit = units[unitIndex];
  const currentAiVoice = AI_VOICES.find((voice) => voice.id === prefs.aiSpeaker) ?? AI_VOICES[0];

  return <section className="naturalNarrator" aria-label="Natural narration controls">
    <div className="naturalNarratorMain">
      <button type="button" onClick={() => start(Math.max(0, unitIndex - 1))}>‹</button>
      <button type="button" className="naturalPlay" onClick={togglePause}>{state === 'playing' ? 'Pause' : state === 'paused' ? 'Resume' : state === 'loading' ? 'Loading…' : 'Listen naturally'}</button>
      <button type="button" onClick={() => start(Math.min(units.length - 1, unitIndex + 1))}>›</button>
      <button type="button" onClick={clearPlayback}>Stop</button>
      <span>Paragraph {currentUnit ? currentUnit.blockIndex + 1 : 1} · Sentence {unitIndex + 1}/{units.length}</span>
    </div>

    <div className="naturalNarratorControls">
      <label>Mode<select value={prefs.mode} onChange={(event) => setPrefs((value) => ({ ...value, mode: event.target.value as NarrationMode }))}>
        <option value="browser">Browser Natural</option>
        <option value="ai" disabled={!AI_TTS_URL}>Aura-2 AI {!AI_TTS_URL ? '· awaiting Worker' : ''}</option>
      </select></label>

      {prefs.mode === 'browser' ? <label>Voice<select value={prefs.voiceURI} onChange={(event) => setPrefs((value) => ({ ...value, voiceURI: event.target.value }))}>
        {recommended.length > 0 && <optgroup label="Recommended natural voices">{recommended.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>★ {voice.name} · {voice.lang}</option>)}</optgroup>}
        {otherEnglish.length > 0 && <optgroup label="Other English voices">{otherEnglish.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</optgroup>}
      </select></label> : <label>AI voice<select value={prefs.aiSpeaker} onChange={(event) => setPrefs((value) => ({ ...value, aiSpeaker: event.target.value }))}>{AI_VOICES.map((voice) => <option key={voice.id} value={voice.id}>{voice.label} · {voice.detail}</option>)}</select></label>}

      <label>Delivery<select value={prefs.delivery} onChange={(event) => setPrefs((value) => ({ ...value, delivery: event.target.value as Delivery }))}><option value="storyteller">Storyteller</option><option value="calm">Calm</option><option value="dramatic">Dramatic</option></select></label>
      <label>Speed<input type="range" min="0.75" max="1.35" step="0.05" value={prefs.speed} onChange={(event) => setPrefs((value) => ({ ...value, speed: Number(event.target.value) }))}/><span>{prefs.speed.toFixed(2)}×</span></label>
      <button type="button" className="voicePreview" onClick={previewVoice}>Preview voice</button>
    </div>

    <div className="naturalNarratorMeta">
      {prefs.mode === 'browser' ? <span>{recommended[0] ? 'Natural/online/neural voices are ranked first automatically.' : 'Using the English voices exposed by this browser/device.'}</span> : <span>{currentAiVoice.label}: {currentAiVoice.detail}</span>}
      {error && <strong>{error}</strong>}
    </div>
  </section>;
}
