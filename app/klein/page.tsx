import Link from 'next/link';
import identities from '@/data/characters/klein-identities.json';
import milestones from '@/data/characters/klein-sequence-milestones.json';
import sequenceEvents from '@/data/characters/klein-sequence-events.json';
import relationships from '@/data/characters/klein-relationships.json';

export default function KleinPage() {
  return (
    <main>
      <nav className="topNav"><Link href="/">← Home</Link></nav>

      <section className="compactHero">
        <p className="eyebrow">PHASE 2 · KLEIN KNOWLEDGE GRAPH</p>
        <h1>Klein Moretti</h1>
        <p className="lead">Sequence milestones are the current priority. Each Sequence is grounded in the supplied EPUB with promotion, formula, ritual, acting, abilities, digestion and a chapter-by-chapter progression feed before identities and relationships receive the next deep pass.</p>
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
            const stepEvents = sequenceEvents.filter((event) => event.sequence === step.sequence);
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
                      {stepEvents.map((event) => (
                        <div className="chapterMilestone" key={`${event.sequence}-${event.chapter}-${event.kind}`}>
                          <div className="chapterMilestoneMeta">
                            <span className="chapterPill">Ch {event.chapter}</span>
                            <span className={`eventKind event-${event.kind}`}>{event.kind.replaceAll('-', ' ')}</span>
                          </div>
                          <div>
                            <h4>{event.title}</h4>
                            <p>{event.summary}</p>
                          </div>
                        </div>
                      ))}
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

      <section className="sectionBlock mutedSecondaryLayer">
        <div className="sectionHeading">
          <p className="eyebrow">2 · IDENTITIES · NEXT</p>
          <h2>One person, multiple lives</h2>
        </div>
        <div className="identityGraph">
          {identities.map((identity) => (
            <article key={identity.id} className="identityNode">
              <small>{identity.kind}</small>
              <h3>{identity.name}</h3>
              <p>{identity.role}</p>
              <span>Active: Ch {identity.chapterStart}{identity.chapterEnd ? `–${identity.chapterEnd}` : '+'}</span>
              {identity.sequenceAtStart !== null && <em>Starts around Sequence {identity.sequenceAtStart}</em>}
              {'sourceNote' in identity && identity.sourceNote && <small>{identity.sourceNote}</small>}
            </article>
          ))}
        </div>
      </section>

      <section className="sectionBlock mutedSecondaryLayer">
        <div className="sectionHeading">
          <p className="eyebrow">3 · RELATIONSHIPS · LATER</p>
          <h2>Who knows which version of Klein?</h2>
        </div>
        <div className="relationshipGroups">
          {Array.from(new Set(relationships.map((relation) => relation.group))).map((group) => (
            <section key={group} className="relationshipGroup">
              <h3>{group.replaceAll('-', ' ')}</h3>
              <div className="knowledgeGrid">
                {relationships.filter((relation) => relation.group === group).map((relation) => (
                  <article key={relation.id}>
                    <small>{relation.types.join(' · ')}</small>
                    <h3>{relation.displayName}</h3>
                    <p>Connection begins · Chapter {relation.chapterStart}</p>
                    <div className="knowledgeStates">
                      {relation.knowledge.map((state) => (
                        <span key={`${relation.id}-${state.chapterStart}`}>
                          Ch {state.chapterStart}{state.chapterEnd ? `–${state.chapterEnd}` : '+'}: {state.state.replaceAll('-', ' ')}
                        </span>
                      ))}
                    </div>
                    <em>{relation.sourceStatus}</em>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="principles">
        <h2>Current Phase 2 order</h2>
        <p><strong>First:</strong> finish and verify Klein's Sequence progression. <strong>Second:</strong> deepen identity transitions. <strong>Third:</strong> expand relationship knowledge states. Unsupported details remain visibly pending instead of being filled from memory.</p>
        <p className="privacyNote">The supplied EPUB remains the primary source. Novel prose is not committed to GitHub.</p>
      </section>
    </main>
  );
}
