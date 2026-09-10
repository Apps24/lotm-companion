import Link from 'next/link';
import klein from '@/data/characters/klein-moretti.json';
import items from '@/data/characters/klein-items.json';
import fights from '@/data/characters/klein-fights.json';
import relationships from '@/data/characters/klein-relationships.json';

export default function KleinPage() {
  return (
    <main>
      <nav className="topNav"><Link href="/">← Home</Link></nav>

      <section className="compactHero">
        <p className="eyebrow">PHASE 2 · KLEIN KNOWLEDGE GRAPH</p>
        <h1>Klein Moretti</h1>
        <p className="lead">A chapter-anchored progression graph for identities, Seer-pathway advancement, mystical items, fights and evolving relationships. Every node is being prepared for spoiler filtering.</p>
      </section>

      <section className="graphRoot">
        <div className="rootNode">
          <small>ORIGINAL IDENTITY</small>
          <strong>Zhou Mingrui</strong>
          <span>↓</span>
          <strong>Klein Moretti</strong>
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading"><p className="eyebrow">IDENTITY GRAPH</p><h2>Klein → public and occult personas</h2></div>
        <div className="identityGraph">
          {klein.identities.filter((identity) => identity.id !== 'zhou-mingrui' && identity.id !== 'klein-moretti').map((identity) => (
            <article key={identity.id} className="identityNode">
              <small>{identity.kind}</small>
              <h3>{identity.name}</h3>
              <p>Visible from Chapter {identity.spoilerChapter}</p>
              <span>Active: {identity.chapterStart}{identity.chapterEnd ? `–${identity.chapterEnd}` : '+'}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading"><p className="eyebrow">SEER PATHWAY</p><h2>Sequence 9 → Sequence 0</h2></div>
        <div className="progressionList">
          {klein.sequenceProgression.map((step, index) => (
            <article key={step.sequence} className="progressionStep">
              <div className="sequenceBadge">S{step.sequence}</div>
              <div className="progressionBody">
                <h3>{step.name}</h3>
                <p>Promotion · Chapter {step.promotionChapter}</p>
                {step.digestionChapter && <span>Digestion milestone · Chapter {step.digestionChapter}</span>}
                <small>{step.sourceStatus}</small>
              </div>
              {index < klein.sequenceProgression.length - 1 && <div className="progressArrow">↓</div>}
            </article>
          ))}
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading"><p className="eyebrow">MYSTICAL ITEMS</p><h2>Ownership and equipment nodes</h2></div>
        <div className="knowledgeGrid">
          {items.map((item) => (
            <article key={item.id}>
              <small>{item.category}</small>
              <h3>{item.name}</h3>
              <p>{item.pathway ? `${item.pathway} pathway` : 'Pathway link under review'}</p>
              <span>{item.acquiredChapter ? `Klein acquisition · Ch ${item.acquiredChapter}` : 'Chapter anchor under review'}</span>
              <em>{item.status}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading"><p className="eyebrow">FIGHT GRAPH</p><h2>Major combat nodes seeded so far</h2></div>
        <div className="knowledgeGrid">
          {fights.map((fight) => (
            <article key={fight.id}>
              <small>CH {fight.chapterStart}{fight.chapterEnd !== fight.chapterStart ? `–${fight.chapterEnd}` : ''}</small>
              <h3>{fight.name}</h3>
              <p>Opponent: {fight.opponents.join(', ')}</p>
              <span>Outcome · {fight.outcome}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading"><p className="eyebrow">RELATIONSHIPS</p><h2>Connections that evolve by chapter</h2></div>
        <div className="knowledgeGrid">
          {relationships.map((relation) => (
            <article key={relation.id}>
              <small>{relation.types.join(' · ')}</small>
              <h3>{relation.target.replaceAll('-', ' ')}</h3>
              <p>Connection begins · Chapter {relation.chapterStart}</p>
              <span>{relation.knowledge.map((state) => `${state.chapterStart}: ${state.state.replaceAll('-', ' ')}`).join(' → ')}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="principles">
        <h2>Source status</h2>
        <p>{klein.sourcePolicy}</p>
        <p className="privacyNote">The EPUB is the primary source. External references are used only to cross-check structured facts; uncertain anchors remain explicitly marked for review.</p>
      </section>
    </main>
  );
}
