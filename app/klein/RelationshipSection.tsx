import relationships from '@/data/characters/klein-relationships.json';
import relationshipEvents from '@/data/characters/klein-relationship-events.json';
import antagonistRelationships from '@/data/characters/klein-antagonists.json';
import antagonistEvents from '@/data/characters/klein-antagonist-events.json';
import cosmicAntagonists from '@/data/characters/klein-cosmic-antagonists.json';
import cosmicAntagonistEvents from '@/data/characters/klein-cosmic-antagonist-events.json';
import type { KleinRelationship, RelationshipEvent } from '@/lib/types/knowledge-graph';

const allRelationships = [...relationships, ...antagonistRelationships, ...cosmicAntagonists] as KleinRelationship[];
const allEvents = [...relationshipEvents, ...antagonistEvents, ...cosmicAntagonistEvents] as RelationshipEvent[];

export default function RelationshipSection({ spoilerChapter }: { spoilerChapter: number }) {
  const visibleRelationships = allRelationships.filter((relation) => relation.chapterStart <= spoilerChapter);
  const sortedEvents = [...allEvents]
    .filter((event) => event.chapter <= spoilerChapter)
    .sort((a, b) => a.chapter - b.chapter);

  return (
    <section className="sectionBlock">
      <div className="sectionHeading">
        <p className="eyebrow">3 · RELATIONSHIPS</p>
        <h2>Who knows which version of Klein?</h2>
        <p className="lead">The graph is frozen at Chapter {spoilerChapter}. Recognizing two personas does not automatically mean a character knows they are the same person; explicit identity links are recorded separately.</p>
      </div>

      <div className="sequenceDetail relationshipLegend">
        <strong>Knowledge-state rule</strong>
        <p><b>Alias known</b> means the character has encountered or recognizes that persona. <b>Same-person link</b> is only used when the EPUB supports that the character connects two or more of Klein's identities.</p>
      </div>

      <div className="relationshipGroups">
        {Array.from(new Set(visibleRelationships.map((relation) => relation.group))).map((group) => (
          <section key={group} className="relationshipGroup">
            <h3>{group.replaceAll('-', ' ')}</h3>
            <div className="knowledgeGrid">
              {visibleRelationships.filter((relation) => relation.group === group).map((relation) => {
                const visibleStates = relation.knowledge.filter((state) => state.chapterStart <= spoilerChapter);
                return (
                  <article key={relation.id}>
                    <small>{relation.types.join(' · ')}</small>
                    <h3>{relation.displayName}</h3>
                    <p>Connection begins · Chapter {relation.chapterStart}</p>
                    <div className="knowledgeStates">
                      {visibleStates.map((state) => (
                        <span key={`${relation.id}-${state.chapterStart}`}>
                          Ch {state.chapterStart}{state.chapterEnd && state.chapterEnd <= spoilerChapter ? `–${state.chapterEnd}` : '+'}: {state.state.replaceAll('-', ' ')}
                        </span>
                      ))}
                    </div>
                    <em>{relation.sourceStatus}</em>
                  </article>
                );
              })}
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
                  <span className={`eventKind ${isIdentityLink ? 'event-revelation' : ''}`}>{event.kind.replaceAll('-', ' ')}</span>
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
          {sortedEvents.length === 0 && <p className="pendingDetail">No relationship transition has been revealed at this chapter yet.</p>}
        </div>
      </div>
    </section>
  );
}
