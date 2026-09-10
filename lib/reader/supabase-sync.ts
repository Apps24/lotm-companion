export type ReaderCloudSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email?: string;
  userId: string;
};

export type ReaderCloudState = {
  lastChapter: number;
  scrollPositions: Record<string, number>;
  readerPreferences: Record<string, unknown>;
  bookmarks: number[];
  notes: Record<string, string>;
  narratorPreferences: Record<string, unknown>;
};

const SESSION_KEY = 'lotmReaderSupabaseSession';
const LAST_CHAPTER_KEY = 'lotmReaderLastChapter';
const READER_PREFS_KEY = 'lotmReaderPreferences';
const BOOKMARKS_KEY = 'lotmReaderBookmarks';
const NOTES_KEY = 'lotmReaderNotes';
const NARRATOR_KEY = 'lotmNaturalNarrator';
const POSITION_PREFIX = 'lotmReaderPosition:';

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const isReaderCloudConfigured = () => Boolean(SUPABASE_URL && SUPABASE_KEY);

function headers(accessToken?: string) {
  return {
    apikey: SUPABASE_KEY,
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export function loadCloudSession(): ReaderCloudSession | null {
  if (typeof window === 'undefined') return null;
  return safeParse<ReaderCloudSession | null>(window.localStorage.getItem(SESSION_KEY), null);
}

export function clearCloudSession() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(SESSION_KEY);
}

function saveCloudSession(session: ReaderCloudSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function normalizeSession(payload: any, email?: string): ReaderCloudSession {
  const expiresIn = Number(payload.expires_in ?? 3600);
  return {
    accessToken: String(payload.access_token ?? ''),
    refreshToken: String(payload.refresh_token ?? ''),
    expiresAt: Date.now() + Math.max(60, expiresIn - 30) * 1000,
    email: payload.user?.email ?? email,
    userId: String(payload.user?.id ?? ''),
  };
}

async function readJson(response: Response) {
  const text = await response.text();
  let data: any = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = { message: text }; }
  }
  if (!response.ok) throw new Error(data?.msg ?? data?.message ?? data?.error_description ?? `Supabase request failed (${response.status}).`);
  return data;
}

export async function sendReaderOtp(email: string) {
  if (!isReaderCloudConfigured()) throw new Error('Supabase sync is not configured for this preview.');
  const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email: email.trim(), create_user: true }),
  });
  await readJson(response);
}

export async function verifyReaderOtp(email: string, token: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email: email.trim(), token: token.trim(), type: 'email' }),
  });
  const payload = await readJson(response);
  const session = normalizeSession(payload, email.trim());
  if (!session.accessToken || !session.refreshToken || !session.userId) throw new Error('Supabase did not return a usable reader session.');
  return saveCloudSession(session);
}

async function refreshCloudSession(session: ReaderCloudSession) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  const payload = await readJson(response);
  return saveCloudSession(normalizeSession(payload, session.email));
}

export async function requireCloudSession() {
  const session = loadCloudSession();
  if (!session) throw new Error('Sign in before syncing.');
  if (session.expiresAt > Date.now()) return session;
  try { return await refreshCloudSession(session); }
  catch (error) {
    clearCloudSession();
    throw error;
  }
}

export function collectLocalReaderState(): ReaderCloudState {
  const scrollPositions: Record<string, number> = {};
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(POSITION_PREFIX)) continue;
    const value = Number(window.localStorage.getItem(key));
    if (Number.isFinite(value)) scrollPositions[key.slice(POSITION_PREFIX.length)] = value;
  }
  return {
    lastChapter: Number(window.localStorage.getItem(LAST_CHAPTER_KEY) ?? 1) || 1,
    scrollPositions,
    readerPreferences: safeParse(window.localStorage.getItem(READER_PREFS_KEY), {}),
    bookmarks: safeParse(window.localStorage.getItem(BOOKMARKS_KEY), []),
    notes: safeParse(window.localStorage.getItem(NOTES_KEY), {}),
    narratorPreferences: safeParse(window.localStorage.getItem(NARRATOR_KEY), {}),
  };
}

export function applyCloudReaderState(state: Partial<ReaderCloudState>) {
  if (state.lastChapter) window.localStorage.setItem(LAST_CHAPTER_KEY, String(state.lastChapter));
  Object.entries(state.scrollPositions ?? {}).forEach(([chapter, position]) => {
    if (Number.isFinite(position)) window.localStorage.setItem(`${POSITION_PREFIX}${chapter}`, String(position));
  });
  if (state.readerPreferences) window.localStorage.setItem(READER_PREFS_KEY, JSON.stringify(state.readerPreferences));
  if (state.bookmarks) window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(state.bookmarks));
  if (state.notes) window.localStorage.setItem(NOTES_KEY, JSON.stringify(state.notes));
  if (state.narratorPreferences) window.localStorage.setItem(NARRATOR_KEY, JSON.stringify(state.narratorPreferences));
  window.dispatchEvent(new CustomEvent('lotm-reader-cloud-applied'));
}

async function upsert(table: string, session: ReaderCloudSession, row: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=user_id`, {
    method: 'POST',
    headers: { ...headers(session.accessToken), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: session.userId, ...row }),
  });
  await readJson(response);
}

async function getSingleton(table: string, session: ReaderCloudSession) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, {
    headers: headers(session.accessToken),
  });
  const data = await readJson(response);
  return Array.isArray(data) ? data[0] ?? null : null;
}

export async function pushReaderState() {
  const session = await requireCloudSession();
  const state = collectLocalReaderState();
  await Promise.all([
    upsert('reader_profiles', session, { email: session.email ?? null }),
    upsert('reader_progress', session, { chapter_number: state.lastChapter, scroll_positions: state.scrollPositions }),
    upsert('reader_settings', session, { preferences: state.readerPreferences }),
    upsert('bookmarks', session, { chapters: state.bookmarks }),
    upsert('annotations', session, { notes: state.notes }),
    upsert('tts_preferences', session, { preferences: state.narratorPreferences }),
  ]);
  return state;
}

export async function pullReaderState() {
  const session = await requireCloudSession();
  const [progress, settings, bookmarkRow, annotationRow, tts] = await Promise.all([
    getSingleton('reader_progress', session),
    getSingleton('reader_settings', session),
    getSingleton('bookmarks', session),
    getSingleton('annotations', session),
    getSingleton('tts_preferences', session),
  ]);
  const state: Partial<ReaderCloudState> = {
    lastChapter: progress?.chapter_number,
    scrollPositions: progress?.scroll_positions,
    readerPreferences: settings?.preferences,
    bookmarks: bookmarkRow?.chapters,
    notes: annotationRow?.notes,
    narratorPreferences: tts?.preferences,
  };
  applyCloudReaderState(state);
  return state;
}
