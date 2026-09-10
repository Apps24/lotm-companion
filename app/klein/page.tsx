'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import IdentitySection from './IdentitySection';
import RelationshipSection from './RelationshipSection';
import milestones from '@/data/characters/klein-sequence-milestones.json';
import sequenceEvents from '@/data/characters/klein-sequence-events.json';
import extraSequenceEvents from '@/data/characters/klein-sequence-events-extra.json';
import sequenceEvidence from '@/data/characters/klein-sequence-evidence.json';
import items from '@/data/characters/klein-items.json';
import fights from '@/data/characters/klein-fights.json';
import locations from '@/data/characters/klein-locations.json';
import organizations from '@/data/characters/klein-organizations.json';

const MAX_CHAPTER = 1430;
const STORAGE_KEY = 'lotmSpoilerChapter';
const clampChapter = (value: number) => Math.min(MAX_CHAPTER, Math.max(1, Math.round(value)));

export default function KleinPage() {
  const [spoilerChapter, setSpoilerChapter] = useState(1);

  useEffect(() => {
    const queryValue = Number(new URLSearchParams(window.location.search).get('spoiler'));
    const storedValue = Number(window.localStorage.getItem(STORAGE_KEY));
    const initial = Number.isFinite(queryValue) && queryValue >= 1
      ? queryValue
      : Number.isFinite(storedValue) && storedValue >= 1
        ? storedValue
        : 1;
    setSpoilerChapter(clampChapter(initial));
  }, []);

  const updateSpoilerChapter = (value: number) => {
    const chapter = clampChapter(value);
    setSpoilerChapter(chapter);
    window.localStorage.setItem(STORAGE_KEY, String(chapter));
    const url = new URL(window.location.href);
    url.searchParams.set('spoiler', String(chapter));
    window.history.replaceState({}, '', url);
  };

  const visibleMilestones = milestones.filter((step) => step.promotionChapter <= spoilerChapter);
  const visibleItems = items.filter((item) => item.spoilerChapter <= spoilerChapter);
  const visibleFights = fights.filter((fight) => fight.spoilerChapter <= spoilerChapter);
  const visibleLocations = locations.filter((location) => location.spoilerChapter <= spoilerChapter);
  const visibleOrganizations = organizations.filter((organization) => organization.spoilerChapter <= spoilerChapter);

  return (
    <main>
      <nav className="topNav"><Link href="/">← Home</Link></nav>

      <section className="compactHero">
        <p className="eyebrow">PHASE 2 · KLEIN KNOWLEDGE GRAPH</p>
        <h1>Klein Moretti</h1>
        <p className="lead">Klein's progression, identities, relationships, items, fights and world associations are all filtered to the chapter you choose.</p>
      </section>

      <section className="spoilerControl" aria-label="Spoiler chapter control">
        <div className="spoilerControlHeader">
          <div>
            <p className="eyebrow">SPOILER GATE</p>
            <h2>World state at Chapter {spoilerChapter}</h2>
          </div>
          <span className="chapterPill">Ch {spoilerChapter} / {MAX_CHAPTER}</span>
        </div>
        <input
          aria-label="Maximum visible LOTM chapter"
          type="range"
          min="1"
          max={MAX_CHAPTER}
          value={spoilerChapter}
          onChange={(event) => updateSpoilerChapter(Number(event.target.value))}
        />
        <div className="spoilerInputs">
          <label>
            Chapter
            <input
              type="number"
              min="1"
              max={MAX_CHAPTER}
              value={spoilerChapter}
              onChange={(event) => updateSpoilerChapter(Number(event.target.value || 1))}
            />
          </label>
          <div className="spoilerQuickActions">
            <button type="button" onClick={() => updateSpoilerChapter(1)}>Start</button>
            <button type="button" onClick={() => updateSpoilerChapter(MAX_CHAPTER)}>Show all Book 1 data</button>
          </div>
        </div>
        <p>Saved locally as <code>{STORAGE_KEY}</code> and mirrored in the URL as <code>?spoiler={spoilerChapter}</code>. Future chapter records are not rendered.</p>
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
          <h2>Seer pathway progression known by Chapter {spoilerChapter}</h2>
        </div>
        {visibleMilestones.length === 0 ? (
          <div className="sequenceDetail"><p className="pendingDetail">No potion advancement has been revealed by this chapter.</p></div>
        ) : (
          <div className="progressionList detailedProgression">
            {visibleMilestones.map((step, index) => {
              const stepEvents = [...sequenceEvents, ...extraSequenceEvents]
                .filter((event) => event.sequence === step.sequence && event.chapter <= spoilerChapter)
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
                      <div className="sequenceDetail ritualBlock"><strong>Advancement ritual</strong><p>{step.ritual}</p></div>
                    )}

                    <div className="sequenceDetailGrid">
                      <div className="sequenceDetail">
                        <strong>Acting principles</strong>
                        {step.actingPrinciples.length > 0
                          ? <ul>{step.actingPrinciples.map((principle) => <li key={principle}>{principle}</li>)}</ul>
                          : <p className="pendingDetail">No consolidated acting-rule list is asserted from the EPUB.</p>}
                        {'actingEvidence' in step && step.actingEvidence && <p className="evidenceNote">{step.actingEvidence}</p>}
                        {'digestionMechanism' in step && step.digestionMechanism && <p className="evidenceNote">{step.digestionMechanism}</p>}
                      </div>
                      <div className="sequenceDetail">
                        <strong>Core abilities</strong>
                        <ul>{step.abilities.map((ability) => <li key={ability}>{ability}</li>)}</ul>
                      </div>
                    </div>

                    <div className="sequenceDetail">
                      <strong>Chapter-by-chapter progression</strong>
                      <div className="chapterMilestoneFeed">
                        {stepEvents.map((event) => {
                          const evidence = sequenceEvidence.find((item) => item.sequence === event.sequence && item.chapter === event.chapter && item.kind === event.kind);
                          return (
                            <div className="chapterMilestone" key={`${event.sequence}-${event.chapter}-${event.kind}-${event.title}`}>
                              <div className="chapterMilestoneMeta">
                                <span className="chapterPill">Ch {event.chapter}</span>
                                <span className={`eventKind event-${event.kind}`}>{event.kind.replaceAll('-', ' ')}</span>
                              </div>
                              <div>
                                <h4>{event.title}</h4>
                                <p>{event.summary}</p>
                                {evidence && (
                                  <div className="eventEvidence"><small>VERIFIED DETAIL · {evidence.confidence}</small><ul>{evidence.details.map((detail) => <li key={detail}>{detail}</li>)}</ul></div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <small>{step.source.status} · source anchored at or before Chapter {spoilerChapter}</small>
                  </div>
                  {index < visibleMilestones.length - 1 && <div className="progressArrow">↓</div>}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <IdentitySection spoilerChapter={spoilerChapter} />
      <RelationshipSection spoilerChapter={spoilerChapter} />

      <section className="sectionBlock">
        <div className="sectionHeading"><p className="eyebrow">4 · MYSTICAL ITEMS</p><h2>Ownership state at Chapter {spoilerChapter}</h2></div>
        <div className="knowledgeGrid">
          {visibleItems.map((item) => {
            const history = item.ownershipHistory.filter((event) => event.chapter <= spoilerChapter);
            const current = history.at(-1);
            return (
              <article key={item.id}>
                <small>{item.category}</small><h3>{item.name}</h3>
                <p>{current ? `${current.kind.replaceAll('-', ' ')} · ${current.holder}` : 'Not yet acquired by Klein'}</p>
                <div className="knowledgeStates">
                  {history.map((event) => <span key={`${item.id}-${event.chapter}-${event.kind}`}>Ch {event.chapter}: {event.summary}</span>)}
                </div>
                <em>{item.sourceStatus}</em>
              </article>
            );
          })}
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading"><p className="eyebrow">5 · MAJOR FIGHTS</p><h2>Conflicts revealed by Chapter {spoilerChapter}</h2></div>
        <div className="knowledgeGrid">
          {visibleFights.map((fight) => (
            <article key={fight.id}>
              <small>Ch {fight.chapterStart}{fight.chapterEnd !== fight.chapterStart && fight.chapterEnd <= spoilerChapter ? `–${fight.chapterEnd}` : ''}</small>
              <h3>{fight.name}</h3>
              <p>Opponents: {fight.opponents.join(', ')}</p>
              {fight.allies.length > 0 && <p>Allies: {fight.allies.join(', ')}</p>}
              <span>{fight.chapterEnd <= spoilerChapter ? `Outcome: ${fight.outcome.replaceAll('-', ' ')}` : 'Outcome: unresolved at this spoiler chapter'}</span>
              <em>{fight.sourceStatus}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading"><p className="eyebrow">6 · LOCATIONS</p><h2>Klein's world associations</h2></div>
        <div className="knowledgeGrid">
          {visibleLocations.map((location) => {
            const visibleRanges = location.ranges.filter((range) => range.chapterStart <= spoilerChapter);
            const displayName = location.id === 'sefirah-castle' && spoilerChapter < 1127 ? 'World above the gray fog' : location.name;
            return (
              <article key={location.id}>
                <small>location</small><h3>{displayName}</h3>
                <div className="knowledgeStates">
                  {visibleRanges.map((range) => (
                    <span key={`${location.id}-${range.chapterStart}`}>Ch {range.chapterStart}{range.chapterEnd && range.chapterEnd <= spoilerChapter ? `–${range.chapterEnd}` : '+'}: {range.chapterEnd && range.chapterEnd <= spoilerChapter ? range.role : 'Active association at this chapter.'}</span>
                  ))}
                </div>
                <em>{location.sourceStatus}</em>
              </article>
            );
          })}
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading"><p className="eyebrow">7 · ORGANIZATIONS</p><h2>Memberships, allies and enemy networks</h2></div>
        <div className="knowledgeGrid">
          {visibleOrganizations.map((organization) => {
            const visibleRanges = organization.ranges.filter((range) => range.chapterStart <= spoilerChapter);
            return (
              <article key={organization.id}>
                <small>organization</small><h3>{organization.name}</h3>
                <div className="knowledgeStates">
                  {visibleRanges.map((range) => (
                    <span key={`${organization.id}-${range.chapterStart}`}>Ch {range.chapterStart}{range.chapterEnd && range.chapterEnd <= spoilerChapter ? `–${range.chapterEnd}` : '+'}: {range.chapterEnd && range.chapterEnd <= spoilerChapter ? range.role : 'Active association at this chapter.'}</span>
                  ))}
                </div>
                <em>{organization.sourceStatus}</em>
              </article>
            );
          })}
        </div>
      </section>

      <section className="principles">
        <h2>Phase 2 source policy</h2>
        <p><strong>Spoiler model:</strong> chapter-gated rendering with URL and local persistence. <strong>Source model:</strong> canonical records normalize to chapter, optional chapter title, source type and verification status. <strong>Copyright:</strong> only derived metadata and summaries are committed.</p>
        <p className="privacyNote">The supplied EPUB remains the primary source. Novel prose is not committed to GitHub.</p>
      </section>
    </main>
  );
}
