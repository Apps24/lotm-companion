import Link from 'next/link';
import IdentitySection from './IdentitySection';
import RelationshipSection from './RelationshipSection';
import milestones from '@/data/characters/klein-sequence-milestones.json';
import sequenceEvents from '@/data/characters/klein-sequence-events.json';
import extraSequenceEvents from '@/data/characters/klein-sequence-events-extra.json';
import sequenceEvidence from '@/data/characters/klein-sequence-evidence.json';

export default function KleinPage() {
  return (
    <main>
      <nav className="topNav"><Link href="/">← Home</Link></nav>

      <section className="compactHero">
        <p className="eyebrow">PHASE 2 · KLEIN KNOWLEDGE GRAPH</p>
        <h1>Klein Moretti</h1>
        <p className="lead">Klein's Sequence 9 → 0 progression is source-anchored first. The second layer maps how his identities form and overlap, and the active third layer tracks which version of Klein each important character actually knows at different chapters.</p>
      </section>

      <section className="graphRoot">
        <div className="rootNode">
          <small>ROOT</small>
          <strong>Zhou Mingrui</strong>
          <span>↓</span>
          <strong>Klein Moretti</strong>
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <p className="eyebrow">1 · SEQUENCE MILESTONES</p>
          <h2>Seer pathway · Sequence 9 → Sequence 0</h2>
        </div>
        <div className="progressionList detailedProgression">
          {milestones.map((step, index) => {
            const stepEvents = [...sequenceEvents, ...extraSequenceEvents]
              .filter((event) => event.sequence === step.sequence)
              .sort((a, b) => a.chapter - b.chapter);
            const digestionEvent = stepEvents.find((event) => event.kind === 'digestion');

            return (
              <article key={step.sequence} className="progressionStep milestoneStep">
                <div className="sequenceBadge">S{step.sequence}</div>
                <div className="progressionBody">
                  <div className="milestoneTitleRow">
                    <h3>{step.name}</h3>
                    <span className="chapterPill">Ch {step.promotionChapter}</span>
                  </div>
                  <p className="promotionTitle">{step.promotionTitle}</p>
                  {digestionEvent && <span>Verified digestion milestone · Chapter {digestionEvent.chapter}</span>}

                  <div className="milestoneTags">
                    {step.identityContext.map((identity) => <span key={identity}>{identity}</span>)}
                  </div>

                  <div className="sequenceDetail formulaBlock">
                    <strong>Potion formula</strong>
                    <div className="formulaGrid">
                      <div>
                        <small>MAIN INGREDIENTS</small>
                        <ul>{step.formula.mainIngredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul>
                      </div>
                      <div>
                        <small>SUPPLEMENTARY</small>
                        <ul>{step.formula.supplementaryIngredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul>
                      </div>
                    </div>
                  </div>

                  {'ritual' in step && step.ritual && (
                    <div className="sequenceDetail ritualBlock">
                      <strong>Advancement ritual</strong>
                      <p>{step.ritual}</p>
                    </div>
                  )}

                  <div className="sequenceDetailGrid">
                    <div className="sequenceDetail">
                      <strong>Acting principles</strong>
                      {step.actingPrinciples.length > 0 ? (
                        <ul>{step.actingPrinciples.map((principle) => <li key={principle}>{principle}</li>)}</ul>
                      ) : (
                        <p className="pendingDetail">No consolidated acting-rule list is asserted from the EPUB yet.</p>
                      )}
                      {'actingEvidence' in step && step.actingEvidence && <p className="evidenceNote">{step.actingEvidence}</p>}
                      {'digestionMechanism' in step && step.digestionMechanism && <p className="evidenceNote">{step.digestionMechanism}</p>}
                    </div>

                    <div className="sequenceDetail">
                      <strong>Core abilities</strong>
                      {step.abilities.length > 0 ? (
                        <ul>{step.abilities.map((ability) => <li key={ability}>{ability}</li>)}</ul>
                      ) : (
                        <p className="pendingDetail">Pending curated source extraction.</p>
                      )}
                    </div>
                  </div>

                  <div className="sequenceDetail">
                    <strong>Chapter-by-chapter progression</strong>
                    <div className="chapterMilestoneFeed">
                      {stepEvents.map((event) => {
                        const evidence = sequenceEvidence.find((item) => item.sequence === event.sequence && item.chapter === event.chapter && item.kind === event.kind);

                        return (
                          <div className="chapterMilestone" key={`${event.sequence}-${event.chapter}-${event.kind}`}>
                            <div className="chapterMilestoneMeta">
                              <span className="chapterPill">Ch {event.chapter}</span>
                              <span className={`eventKind event-${event.kind}`}>{event.kind.replaceAll('-', ' ')}</span>
                            </div>
                            <div>
                              <h4>{event.title}</h4>
                              <p>{event.summary}</p>
                              {evidence && (
                                <div className="eventEvidence">
                                  <small>VERIFIED DETAIL · {evidence.confidence}</small>
                                  <ul>
                                    {evidence.details.map((detail) => <li key={detail}>{detail}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sequenceDetail">
                    <strong>Milestone summary</strong>
                    <ul className="milestoneList">
                      {step.milestones.map((milestone) => <li key={milestone}>{milestone}</li>)}
                    </ul>
                  </div>

                  <small>{step.source.status} · {step.source.note}</small>
                </div>
                {index < milestones.length - 1 && <div className="progressArrow">↓</div>}
              </article>
            );
          })}
        </div>
      </section>

      <IdentitySection />
      <RelationshipSection />

      <section className="principles">
        <h2>Current Phase 2 order</h2>
        <p><strong>Foundation:</strong> Klein's Sequence progression. <strong>Expanded:</strong> identity transitions and alias purposes. <strong>Active:</strong> relationship knowledge states, with source-verified edges added first and uncertain edges left marked for review.</p>
        <p className="privacyNote">The supplied EPUB remains the primary source. Novel prose is not committed to GitHub.</p>
      </section>
    </main>
  );
}
