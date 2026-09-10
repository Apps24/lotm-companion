import relationships from '@/data/characters/klein-relationships.json';
import relationshipEvents from '@/data/characters/klein-relationship-events.json';

export default function RelationshipSection() {
  const sortedEvents = [...relationshipEvents].sort((a, b) => a.chapter - b.chapter);

  return (
    <section className="sectionBlock">
      <div className="sectionHeading">
        <p className="eyebrow">3 · RELATIONSHIPS · ACTIVE PASS</p>
        <h2>Who knows which version of Klein?</h2>
        <p className="lead">Relationship edges track knowledge, not only friendship or hostility: a person may know Klein Moretti, The Fool, The World or another alias without knowing that those identities overlap.</p>
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

      <div className="sequenceDetail">
        <strong>Verified knowledge-state transitions</strong>
        <div className="chapterMilestoneFeed">
          {sortedEvents.map((event) => {
            const relation = relationships.find((item) => item.id === event.relationId);
            return (
              <div className="chapterMilestone" key={`${event.relationId}-${event.chapter}-${event.kind}`}>
                <div className="chapterMilestoneMeta">
                  <span className="chapterPill">Ch {event.chapter}</span>
                  <span className="eventKind">{event.kind.replaceAll('-', ' ')}</span>
                </div>
                <div>
                  <h4>{relation?.displayName ?? event.relationId}</h4>
                  <p>{event.summary}</p>
                  <div className="milestoneTags">
                    <span>Knows: {event.knownIdentity}</span>
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
