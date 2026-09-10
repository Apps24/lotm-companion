import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'data', 'characters');
const MAX_CHAPTER = 1430;
const errors = [];
const warnings = [];

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
const files = fs.readdirSync(dataDir).filter((name) => name.startsWith('klein-') && name.endsWith('.json')).sort();
const datasets = new Map(files.map((file) => [file, readJson(file)]));

const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const validChapter = (value) => Number.isInteger(value) && value >= 1 && value <= MAX_CHAPTER;
const chapterKeys = new Set([
  'chapter', 'chapterStart', 'chapterEnd', 'promotionChapter', 'digestionChapter',
  'spoilerChapter', 'firstAppearanceChapter', 'acquiredChapter', 'phaseStartChapter',
  'lossConfirmedChapter', 'transferredChapter'
]);

function walk(value, file, trail = file) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, file, `${trail}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    if (chapterKeys.has(key) && child !== null) {
      assert(validChapter(child), `${trail}.${key} must be an integer from 1-${MAX_CHAPTER}; got ${child}`);
    }
    if (key === 'sequence' && child !== null) {
      assert(Number.isInteger(child) && child >= 0 && child <= 9, `${trail}.sequence must be 0-9; got ${child}`);
    }
    walk(child, file, `${trail}.${key}`);
  }
}

for (const [file, data] of datasets) walk(data, file);

function assertArray(file) {
  const value = datasets.get(file);
  assert(Array.isArray(value), `${file} must contain a JSON array`);
  return Array.isArray(value) ? value : [];
}

function assertUnique(file, records, keyFn) {
  const seen = new Set();
  for (const record of records) {
    const key = keyFn(record);
    assert(Boolean(key), `${file} contains a record without a stable key`);
    assert(!seen.has(key), `${file} contains duplicate key: ${key}`);
    seen.add(key);
  }
}

const milestones = assertArray('klein-sequence-milestones.json');
assert(milestones.length === 10, 'klein-sequence-milestones.json must contain Sequence 9 through 0 exactly once');
assertUnique('klein-sequence-milestones.json', milestones, (r) => String(r.sequence));
for (const sequence of Array.from({ length: 10 }, (_, index) => 9 - index)) {
  assert(milestones.some((record) => record.sequence === sequence), `Missing Klein Sequence ${sequence}`);
}

for (const file of ['klein-sequence-events.json', 'klein-sequence-events-extra.json']) {
  const records = assertArray(file);
  assertUnique(file, records, (r) => `${r.sequence}:${r.chapter}:${r.kind}:${r.title}`);
  records.forEach((r, i) => {
    assert(validChapter(r.chapter), `${file}[${i}] missing valid chapter`);
    assert(typeof r.title === 'string' && r.title.length > 0, `${file}[${i}] missing chapter/event title`);
    assert(typeof r.sourceStatus === 'string' && r.sourceStatus.length > 0, `${file}[${i}] missing sourceStatus`);
  });
}

const identities = assertArray('klein-identities.json');
assertUnique('klein-identities.json', identities, (r) => r.id);
assert(identities.some((r) => r.id === 'zhou-mingrui'), 'Identity graph must include Zhou Mingrui');
assert(identities.some((r) => r.id === 'klein-moretti'), 'Identity graph must include Klein Moretti');

const identityEvents = assertArray('klein-identity-events.json');
assertUnique('klein-identity-events.json', identityEvents, (r) => `${r.identityId}:${r.chapter}:${r.kind}`);
identityEvents.forEach((r, i) => assert(identities.some((identity) => identity.id === r.identityId), `klein-identity-events.json[${i}] references unknown identity ${r.identityId}`));

const relationshipFiles = ['klein-relationships.json', 'klein-antagonists.json', 'klein-cosmic-antagonists.json'];
const allRelationships = relationshipFiles.flatMap((file) => assertArray(file));
assertUnique('relationship datasets', allRelationships, (r) => r.id);
for (const relation of allRelationships) {
  assert(Array.isArray(relation.knowledge) && relation.knowledge.length > 0, `${relation.id} must have knowledge states`);
  for (let i = 1; i < relation.knowledge.length; i += 1) {
    assert(relation.knowledge[i].chapterStart >= relation.knowledge[i - 1].chapterStart, `${relation.id} knowledge states must be chronological`);
  }
}

for (const file of ['klein-relationship-events.json', 'klein-antagonist-events.json', 'klein-cosmic-antagonist-events.json']) {
  const records = assertArray(file);
  assertUnique(file, records, (r) => `${r.relationId}:${r.chapter}:${r.kind}:${r.knownIdentity}`);
  records.forEach((r, i) => assert(allRelationships.some((relation) => relation.id === r.relationId), `${file}[${i}] references unknown relation ${r.relationId}`));
}

const fights = assertArray('klein-fights.json');
assertUnique('klein-fights.json', fights, (r) => r.id);
fights.forEach((fight, i) => {
  assert(validChapter(fight.chapterStart) && validChapter(fight.chapterEnd), `klein-fights.json[${i}] has invalid chapter range`);
  assert(fight.chapterStart <= fight.chapterEnd, `klein-fights.json[${i}] chapterStart must be <= chapterEnd`);
  assert(typeof fight.sourceStatus === 'string' && fight.sourceStatus.includes('epub'), `Fight ${fight.id} must be EPUB-anchored before Phase 2 closes`);
});

const items = assertArray('klein-items.json');
assertUnique('klein-items.json', items, (r) => r.id);
items.forEach((item, i) => {
  assert(typeof item.sourceStatus === 'string' && item.sourceStatus.includes('epub'), `Item ${item.id} must be EPUB-anchored before Phase 2 closes`);
  assert(Array.isArray(item.ownershipHistory) && item.ownershipHistory.length > 0, `Item ${item.id} must contain ownershipHistory`);
  item.ownershipHistory?.forEach((event, j) => {
    assert(validChapter(event.chapter), `klein-items.json[${i}].ownershipHistory[${j}] missing valid chapter`);
    assert(typeof event.sourceStatus === 'string' && event.sourceStatus.includes('epub'), `Item event ${item.id}/${event.kind} must be EPUB-anchored`);
  });
});

for (const file of ['klein-locations.json', 'klein-organizations.json']) {
  const records = assertArray(file);
  assert(records.length > 0, `${file} must not be empty`);
  assertUnique(file, records, (r) => r.id);
  for (const record of records) {
    assert(Array.isArray(record.ranges) && record.ranges.length > 0, `${record.id} must contain at least one chapter range`);
    assert(typeof record.sourceStatus === 'string' && record.sourceStatus.includes('epub'), `${record.id} must be EPUB-anchored`);
  }
}

// A normalized source locator is generated for every canonical record from the same contract.
// chapterTitle is retained when a record supplies a title; chapter number remains the stable EPUB locator.
function normalizedLocator(record) {
  const chapter = record.chapter ?? record.promotionChapter ?? record.chapterStart ?? record.acquiredChapter ?? record.firstAppearanceChapter ?? record.spoilerChapter;
  const status = record.sourceStatus ?? record.source?.status ?? 'derived-from-epub-anchors';
  const title = record.chapterTitle ?? record.promotionTitle ?? record.title;
  return {
    chapter,
    chapterTitle: typeof title === 'string' && title.length ? title : undefined,
    sourceType: String(status).includes('web') && !String(status).includes('epub') ? 'web' : String(status).includes('epub') ? 'epub' : 'derived',
    verificationStatus: status
  };
}

for (const [file, data] of datasets) {
  const records = Array.isArray(data) ? data : [data];
  for (const [index, record] of records.entries()) {
    if (!record || typeof record !== 'object') continue;
    const locator = normalizedLocator(record);
    if (!validChapter(locator.chapter)) warnings.push(`${file}[${index}] has no top-level resolvable chapter locator`);
    assert(['epub', 'web', 'derived'].includes(locator.sourceType), `${file}[${index}] has invalid normalized source type`);
  }
}

if (errors.length) {
  console.error(`Klein data validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(` - ${error}`));
  process.exit(1);
}

console.log(`Validated ${files.length} Klein data files through Chapter ${MAX_CHAPTER}.`);
console.log(`Normalized source locator contract: { chapter, chapterTitle?, sourceType, verificationStatus }.`);
if (warnings.length) {
  console.warn(`${warnings.length} non-blocking source-locator warning(s):`);
  warnings.slice(0, 20).forEach((warning) => console.warn(` - ${warning}`));
}
