import identities from '@/data/characters/klein-identities.json';
import identityEvents from '@/data/characters/klein-identity-events.json';

export default function IdentitySection() {
  const sortedEvents = [...identityEvents].sort((a, b) => a.chapter - b.chapter);

  return (
    <section className="sectionBlock">
      <div className="sectionHeading">
        <p className="eyebrow">2 · IDENTITIES · ACTIVE PASS</p>
        <h2>One person, multiple operational lives</h2>
        <p className="lead">Each identity is separated into formation, naming and public-use milestones so an alias is not treated as a single flat chapter marker.</p>
      </div>

      <div className="identityGraph">
        {identities.map((identity) => (
          <article key={identity.id} className="identityNode">
            <small>{identity.kind}</small>
            <h3>{identity.name}</h3>
            <p>{identity.role}</p>
            {'phaseStartChapter' in identity && identity.phaseStartChapter && identity.phaseStartChapter < identity.chapterStart && (
              <span>Persona phase begins · Ch {identity.phaseStartChapter}</span>
            )}
            <span>First anchored use · Ch {identity.chapterStart}</span>
            {identity.chapterEnd ? <span>Primary era · Ch {identity.chapterStart}–{identity.chapterEnd}</span> : <span>Continues beyond first use</span>}
            {identity.sequenceAtStart !== null && <em>Sequence {identity.sequenceAtStart} at first anchored use</em>}
            {'sourceNote' in identity && identity.sourceNote && <small>{identity.sourceNote}</small>}
          </article>
        ))}
      </div>

      <div className="sequenceDetail">
        <strong>Identity transition timeline</strong>
        <div className="chapterMilestoneFeed">
          {sortedEvents.map((event) => {
            const identity = identities.find((item) => item.id === event.identityId);
            return (
              <div className="chapterMilestone" key={`${event.identityId}-${event.chapter}-${event.kind}`}>
                <div className="chapterMilestoneMeta">
                  <span className="chapterPill">Ch {event.chapter}</span>
                  <span className="eventKind">{event.kind.replaceAll('-', ' ')}</span>
                </div>
                <div>
                  <h4>{event.title}</h4>
                  <p>{event.summary}</p>
                  <div className="milestoneTags">
                    <span>{identity?.name ?? event.identityId}</span>
                    {event.sequence !== null && <span>Sequence {event.sequence}</span>}
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
