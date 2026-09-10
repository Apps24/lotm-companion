import Link from 'next/link';
import summary from '@/data/generated/epub-summary.json';
import volumes from '@/data/generated/volumes.json';

const phases = [
  ['Phase 0', 'Foundation', 'Repository, architecture, source audit, CI/deployment', 'done'],
  ['Phase 1', 'EPUB ingestion', 'Chapter index, volumes, existing artwork catalogue', 'active'],
  ['Phase 2', 'Klein graph', 'Identities, sequences, items, fights, relationships', 'next'],
  ['Phase 3', 'Tarot Club', 'All members, real-world arcs, potion progressions', 'next'],
  ['Phase 4', 'World graph', 'Non-Tarot cast, organizations, locations, pathways', 'next'],
  ['Phase 5', 'Reader + spoilers', 'Chapter reader, spoiler slider, search, timeline', 'next'],
  ['Phase 6', 'Visual layer', 'EPUB art, fanart attribution, curated AI scenes', 'next'],
  ['Phase 7', 'Polish', 'Validation, performance, accessibility, final deployment', 'next'],
] as const;

export default function Home() {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">PHASE 1 · EPUB INGESTION</p>
        <h1>Lord of the Mysteries<br />Interactive Companion</h1>
        <p className="lead">A spoiler-aware visual knowledge graph built around chapters, Klein&apos;s progression, the Tarot Club, fights, items, identities, locations and artwork.</p>
        <div className="status"><span /> EPUB metadata parsed successfully</div>
        <div className="actions">
          <Link href="/chapters" className="primaryButton">Browse chapter index</Link>
          <a href="#volumes" className="secondaryButton">View volumes</a>
        </div>
      </section>

      <section className="stats" aria-label="EPUB statistics">
        <div><strong>{summary.chapterCount}</strong><span>chapters</span></div>
        <div><strong>{summary.volumeCount}</strong><span>volumes</span></div>
        <div><strong>{summary.imageCount}</strong><span>embedded images</span></div>
        <div><strong>{summary.navigationEntryCount}</strong><span>navigation entries</span></div>
      </section>

      <section id="volumes" className="sectionBlock">
        <div className="sectionHeading">
          <p className="eyebrow">SOURCE STRUCTURE</p>
          <h2>Volumes detected from the EPUB</h2>
        </div>
        <div className="volumeGrid">
          {volumes.map((volume) => (
            <article key={volume.number}>
              <small>VOLUME {volume.number}</small>
              <h3>{volume.name}</h3>
              <p>Chapters {volume.chapterStart}–{volume.chapterEnd}</p>
              <span>{volume.chapterCount} chapter entries</span>
            </article>
          ))}
        </div>
      </section>

      <section className="grid">
        {phases.map(([id, title, desc, state]) => (
          <article key={id} className={state}>
            <small>{id}</small>
            <h2>{title}</h2>
            <p>{desc}</p>
          </article>
        ))}
      </section>

      <section className="principles">
        <h2>Core data rule</h2>
        <p><strong>Chapter is the central foreign key.</strong> Every character state, relationship, potion advancement, fight, item ownership, reveal and artwork record must resolve to a chapter or chapter range.</p>
        <p className="privacyNote">The public repository stores metadata only. Novel prose remains in the user-supplied EPUB and is not committed.</p>
      </section>
    </main>
  );
}
