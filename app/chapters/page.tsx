import Link from 'next/link';
import volumes from '@/data/generated/volumes.json';

export default function ChaptersPage() {
  return (
    <main>
      <nav className="topNav"><Link href="/">← Companion home</Link></nav>
      <section className="compactHero">
        <p className="eyebrow">EPUB INDEX · PHASE 1</p>
        <h1>Chapter Index</h1>
        <p className="lead">The source EPUB contains 1,430 numbered chapter entries. The full title-level index is generated locally by the parser; this public baseline exposes the canonical volume ranges without publishing novel prose.</p>
      </section>
      <section className="volumeGrid chapterIndexGrid">
        {volumes.map((volume) => (
          <article key={volume.number}>
            <small>VOLUME {volume.number}</small>
            <h2>{volume.name}</h2>
            <p>Chapters {volume.chapterStart}–{volume.chapterEnd}</p>
            <span>{volume.chapterCount} chapter entries</span>
          </article>
        ))}
      </section>
    </main>
  );
}
