import relationships from '@/data/characters/klein-relationships.json';
import relationshipEvents from '@/data/characters/klein-relationship-events.json';
import antagonistRelationships from '@/data/characters/klein-antagonists.json';
import antagonistEvents from '@/data/characters/klein-antagonist-events.json';
import cosmicAntagonists from '@/data/characters/klein-cosmic-antagonists.json';
import cosmicAntagonistEvents from '@/data/characters/klein-cosmic-antagonist-events.json';

export default function RelationshipSection() {
  const allRelationships = [...relationships, ...antagonistRelationships, ...cosmicAntagonists];
  const allEvents = [...relationshipEvents, ...antagonistEvents, ...cosmicAntagonistEvents];
  const sortedEvents = [...allEvents].sort((a, b) => a.chapter - b.chapter);

  return (
    <section className="sectionBlock">
      <div className="sectionHeading">
        <p className="eyebrow">3 · RELATIONSHIPS · ACTIVE PASS</p>
        <h2>Who knows which version of Klein?</h2>
        <p className="lead">Relationship edges track knowledge, not only friendship or hostility. Knowing both Gehrman Sparrow and The Fool does not automatically mean a character knows they are the same person; explicit identity links are recorded separately. Cosmic rivals also distinguish external enemies from the Celestial Worthy's internal resurrection pressure.</p>
      </div>

      <div className="sequenceDetail relationshipLegend">
        <strong>Knowledge-state rule</strong>
        <p><b>Alias known</b> means the character has encountered or recognizes that persona. <b>Same-person link</b> is only used when the EPUB supports that the character connects two or more of Klein's identities. Antagonists follow the same rule, including what they know about Klein and what Klein knows about them.</p>
      </div>

      <div className="relationshipGroups">
        {Array.from(new Set(allRelationships.map((relation) => relation.group))).map((group) => (
          <section key={group} className="relationshipGroup">
            <h3>{group.replaceAll('-', ' ')}</h3>
            <div className="knowledgeGrid">
              {allRelationships.filter((relation) => relation.group === group).map((relation) => (
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

      <div className="sequenceDetail">
        <strong>Verified knowledge-state transitions</strong>
        <div className="chapterMilestoneFeed">
          {sortedEvents.map((event) => {
            const relation = allRelationships.find((item) => item.id === event.relationId);
            const isIdentityLink = event.kind === 'same-person-link';

            return (
              <div className="chapterMilestone" key={`${event.relationId}-${event.chapter}-${event.kind}`}>
                <div className="chapterMilestoneMeta">
                  <span className="chapterPill">Ch {event.chapter}</span>
                  <span className={`eventKind ${isIdentityLink ? 'event-revelation' : ''}`}>
                    {event.kind.replaceAll('-', ' ')}
                  </span>
                </div>
                <div>
                  <h4>{relation?.displayName ?? event.relationId}</h4>
                  <p>{event.summary}</p>
                  <div className="milestoneTags">
                    <span>{isIdentityLink ? 'Identity link' : 'Knows'}: {event.knownIdentity}</span>
                    <span>{event.sourceStatus}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
