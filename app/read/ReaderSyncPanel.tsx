'use client';

import { useEffect, useState } from 'react';
import {
  clearCloudSession,
  isReaderCloudConfigured,
  loadCloudSession,
  pullReaderState,
  pushReaderState,
  sendReaderOtp,
  verifyReaderOtp,
  type ReaderCloudSession,
} from '@/lib/reader/supabase-sync';

export default function ReaderSyncPanel() {
  const configured = isReaderCloudConfigured();
  const [session, setSession] = useState<ReaderCloudSession | null>(null);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => setSession(loadCloudSession()), []);

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setMessage('');
    try { await task(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Reader sync failed.'); }
    finally { setBusy(false); }
  };

  const requestOtp = () => run(async () => {
    if (!email.trim()) throw new Error('Enter your email first.');
    await sendReaderOtp(email);
    setOtpSent(true);
    setMessage('Check your email for the Supabase one-time code.');
  });

  const verify = () => run(async () => {
    if (!token.trim()) throw new Error('Enter the one-time code.');
    const nextSession = await verifyReaderOtp(email, token);
    setSession(nextSession);
    setToken('');
    setMessage('Signed in. Pulling your saved reader state…');
    await pullReaderState().catch(() => undefined);
    setMessage('Cloud sync connected.');
  });

  const push = () => run(async () => {
    await pushReaderState();
    setMessage('Current browser reader state synced to Supabase.');
  });

  const pull = () => run(async () => {
    await pullReaderState();
    setMessage('Cloud reader state restored. Reload the reader if the current chapter does not update immediately.');
  });

  const signOut = () => {
    clearCloudSession();
    setSession(null);
    setOtpSent(false);
    setMessage('Signed out of reader sync on this browser.');
  };

  if (!configured) {
    return <aside className="readerSyncPanel isDisabled">
      <div><p className="eyebrow">OPTIONAL CLOUD SYNC</p><strong>Supabase sync is prepared, not connected.</strong></div>
      <p>The reader stays fully local. When a dedicated Supabase project is connected, progress, settings, bookmarks, notes and narration preferences can sync across devices.</p>
    </aside>;
  }

  return <aside className="readerSyncPanel">
    <div className="readerSyncHeader"><div><p className="eyebrow">OPTIONAL CLOUD SYNC</p><strong>{session ? `Connected${session.email ? ` · ${session.email}` : ''}` : 'Sync personal reader state'}</strong></div>{session && <button type="button" onClick={signOut}>Sign out</button>}</div>

    {!session ? <div className="readerSyncAuth">
      <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com"/></label>
      {otpSent && <label>One-time code<input inputMode="numeric" autoComplete="one-time-code" value={token} onChange={(event) => setToken(event.target.value)} placeholder="123456"/></label>}
      <button type="button" disabled={busy} onClick={otpSent ? verify : requestOtp}>{busy ? 'Working…' : otpSent ? 'Verify & connect' : 'Email me a code'}</button>
    </div> : <div className="readerSyncActions">
      <button type="button" disabled={busy} onClick={push}>{busy ? 'Syncing…' : 'Sync this browser →'}</button>
      <button type="button" disabled={busy} onClick={pull}>← Restore from cloud</button>
    </div>}

    <small>Only personal reader state is synced. Imported EPUB prose and EPUB images never leave the browser through this feature.</small>
    {message && <p className="readerSyncMessage">{message}</p>}
  </aside>;
}
