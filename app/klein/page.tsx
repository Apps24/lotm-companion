import Link from 'next/link';
import klein from '@/data/characters/klein-moretti.json';

export default function KleinPage() {
  return (
    <main>
      <nav className="topNav"><Link href="/">← Home</Link></nav>
      <section className="compactHero">
        <p className="eyebrow">PHASE 2 · KLEIN KNOWLEDGE GRAPH</p>
        <h1>Klein Moretti</h1>
        <p className="lead">Identity and Seer-pathway progression anchored to the supplied EPUB. Spoiler-aware filtering and relationship/item/fight layers come next.</p>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading"><p className="eyebrow">IDENTITIES</p><h2>Zhou Mingrui → Klein → personas</h2></div>
        <div className="volumeGrid">
          {klein.identities.map((identity) => (
            <article key={identity.id}>
              <small>{identity.kind}</small>
              <h3>{identity.name}</h3>
              <p>From chapter {identity.chapterStart}{identity.chapterEnd ? ` to ${identity.chapterEnd}` : '+'}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading"><p className="eyebrow">SEER PATHWAY</p><h2>Sequence progression</h2></div>
        <div className="progressionList">
          {klein.sequenceProgression.map((step) => (
            <article key={step.sequence} className="progressionStep">
              <div className="sequenceBadge">S{step.sequence}</div>
              <div>
                <h3>{step.name}</h3>
                <p>Promotion · Chapter {step.promotionChapter}</p>
                {step.digestionChapter && <span>Digestion milestone · Chapter {step.digestionChapter}</span>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="principles">
        <h2>Source status</h2>
        <p>{klein.sourcePolicy}</p>
      </section>
    </main>
  );
}
