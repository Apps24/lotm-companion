export type SourceType = 'epub' | 'web' | 'derived';

export type VerificationStatus =
  | 'epub-anchored'
  | 'epub+web-crosschecked'
  | 'web-crosschecked'
  | 'derived-from-epub-anchors'
  | 'needs-epub-anchor'
  | string;

export interface SourceLocator {
  chapter: number;
  chapterTitle?: string;
  sourceType: SourceType;
  verificationStatus: VerificationStatus;
  note?: string;
}

export interface SequenceFormula {
  mainIngredients: string[];
  supplementaryIngredients: string[];
}

export interface SequenceMilestone {
  sequence: number;
  name: string;
  promotionChapter: number;
  promotionTitle: string;
  digestionChapter: number | null;
  identityContext: string[];
  formula: SequenceFormula;
  ritual?: string | null;
  actingPrinciples: string[];
  actingEvidence?: string;
  digestionMechanism?: string;
  abilities: string[];
  milestones: string[];
  source: {
    status: VerificationStatus;
    chapter?: number;
    note: string;
  };
  spoilerChapter: number;
}

export interface SequenceEvent {
  sequence: number;
  chapter: number;
  title: string;
  kind: string;
  summary: string;
  sourceStatus: VerificationStatus;
  spoilerChapter?: number;
}

export interface SequenceEvidence {
  sequence: number;
  chapter: number;
  kind: string;
  confidence: string;
  details: string[];
  sourceStatus?: VerificationStatus;
}

export interface KleinIdentity {
  id: string;
  name: string;
  kind: string;
  role: string;
  chapterStart: number;
  chapterEnd: number | null;
  phaseStartChapter?: number;
  sequenceAtStart: number | null;
  spoilerChapter?: number;
  sourceStatus?: VerificationStatus;
  sourceNote?: string;
}

export interface IdentityEvent {
  identityId: string;
  chapter: number;
  kind: string;
  title: string;
  summary: string;
  sequence: number | null;
  sourceStatus: VerificationStatus;
  spoilerChapter?: number;
}

export interface KnowledgeState {
  chapterStart: number;
  chapterEnd: number | null;
  state: string;
}

export interface KleinRelationship {
  id: string;
  source: string;
  target: string;
  displayName: string;
  group: string;
  types: string[];
  chapterStart: number;
  chapterEnd: number | null;
  knowledge: KnowledgeState[];
  spoilerChapter: number;
  sourceStatus: VerificationStatus;
}

export interface RelationshipEvent {
  relationId: string;
  chapter: number;
  kind: string;
  knownIdentity: string;
  summary: string;
  sourceStatus: VerificationStatus;
  spoilerChapter?: number;
}

export interface FightRecord {
  id: string;
  chapterStart: number;
  chapterEnd: number;
  name: string;
  opponents: string[];
  allies: string[];
  outcome: string;
  spoilerChapter: number;
  sourceStatus: VerificationStatus;
}

export interface ItemOwnershipEvent {
  chapter: number;
  kind: 'acquired' | 'activated' | 'retained' | 'lost' | 'transferred' | 'allied-contact' | string;
  holder: string;
  summary: string;
  sourceStatus: VerificationStatus;
}

export interface MysticalItemRecord {
  id: string;
  name: string;
  category: string;
  firstAppearanceChapter: number | null;
  acquiredChapter: number | null;
  owner: string | null;
  pathway: string | null;
  status: string;
  spoilerChapter: number;
  sourceStatus: VerificationStatus;
  ownershipHistory: ItemOwnershipEvent[];
}

export interface ChapterRange {
  chapterStart: number;
  chapterEnd: number | null;
  role: string;
}

export interface LocationAssociation {
  id: string;
  name: string;
  kind: string;
  ranges: ChapterRange[];
  spoilerChapter: number;
  sourceStatus: VerificationStatus;
}

export interface OrganizationAssociation {
  id: string;
  name: string;
  relationship: string;
  ranges: ChapterRange[];
  spoilerChapter: number;
  sourceStatus: VerificationStatus;
}
