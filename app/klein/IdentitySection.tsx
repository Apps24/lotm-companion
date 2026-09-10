import identities from '@/data/characters/klein-identities.json';
import identityEvents from '@/data/characters/klein-identity-events.json';

export default function IdentitySection({ spoilerChapter }: { spoilerChapter: number }) {
  const visibleIdentities = identities.filter((identity) => {
    const revealChapter = 'phaseStartChapter' in identity && identity.phaseStartChapter
      ? Math.min(identity.phaseStartChapter, identity.chapterStart)
      : identity.chapterStart;
    return revealChapter <= spoilerChapter;
  });
  const sortedEvents = [...identityEvents]
    .filter((event) => event.chapter <= spoilerChapter)
    .sort((a, b) => a.chapter - b.chapter);

  return (
    <section className="sectionBlock">
      <div className="sectionHeading">
        <p className="eyebrow">2 · IDENTITIES</p>
        <h2>One person, multiple operational lives</h2>
        <p className="lead">Only identities and transition events known by Chapter {spoilerChapter} are visible. Formation, naming and public-use milestones remain separate so an alias is not flattened into one marker.</p>
      </div>

      <div className="identityGraph">
        {visibleIdentities.map((identity) => (
          <article key={identity.id} className="identityNode">
            <small>{identity.kind}</small>
            <h3>{identity.name}</h3>
            <p>{identity.role}</p>
            {'phaseStartChapter' in identity && identity.phaseStartChapter && identity.phaseStartChapter <= spoilerChapter && identity.phaseStartChapter < identity.chapterStart && (
              <span>Persona phase begins · Ch {identity.phaseStartChapter}</span>
            )}
            {identity.chapterStart <= spoilerChapter && <span>First anchored use · Ch {identity.chapterStart}</span>}
            {identity.chapterEnd && identity.chapterEnd <= spoilerChapter
              ? <span>Primary era · Ch {identity.chapterStart}–{identity.chapterEnd}</span>
              : <span>Active by Chapter {spoilerChapter}</span>}
            {identity.sequenceAtStart !== null && identity.chapterStart <= spoilerChapter && <em>Sequence {identity.sequenceAtStart} at first anchored use</em>}
            {'sourceNote' in identity && identity.sourceNote && identity.chapterStart <= spoilerChapter && <small>{identity.sourceStatus}</small>}
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
          {sortedEvents.length === 0 && <p className="pendingDetail">No identity transition has been revealed at this chapter yet.</p>}
        </div>
      </div>
    </section>
  );
}
