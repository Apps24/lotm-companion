"use client";
import { MAX_CHAPTER, SPOILER_STORAGE_KEY, useSpoilerChapter } from "@/lib/useSpoilerChapter";

export default function SpoilerControl({ compact=false }: { compact?: boolean }) {
  const [chapter, setChapter] = useSpoilerChapter(1);
  return <section className={compact ? "globalSpoiler compact" : "globalSpoiler"} aria-label="Global spoiler control">
    <div className="globalSpoilerTop"><div><span className="eyebrow">SPOILER GATE</span><strong>Read through Chapter {chapter}</strong></div><span>1–{MAX_CHAPTER}</span></div>
    <input aria-label="Maximum visible chapter" type="range" min={1} max={MAX_CHAPTER} value={chapter} onChange={e=>setChapter(Number(e.target.value))}/>
    <div className="globalSpoilerActions"><label>Chapter <input type="number" min={1} max={MAX_CHAPTER} value={chapter} onChange={e=>setChapter(Number(e.target.value||1))}/></label><button type="button" onClick={()=>setChapter(MAX_CHAPTER)}>Show all Book 1</button></div>
    {!compact && <p>Saved as <code>{SPOILER_STORAGE_KEY}</code> and mirrored to <code>?spoiler={chapter}</code>.</p>}
  </section>;
}
