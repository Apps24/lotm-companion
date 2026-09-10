import ReaderClient from './ReaderClient';
import NaturalNarrator from './NaturalNarratorV2';
import ReaderSyncPanel from './ReaderSyncPanel';

export const metadata = {
  title: 'Personal EPUB Reader · LOTM Companion',
  description: 'Read your own LOTM EPUB locally with chapter navigation, embedded images and natural narration.',
};

export default function ReadPage() {
  return <main className="readerRoute">
    <section className="readerIntro">
      <p className="eyebrow">PHASE 8 · PERSONAL READER</p>
      <h1>Read your own EPUB</h1>
      <p>Import the book locally, read every numbered chapter, keep embedded artwork, and listen with sentence-paced natural voices. Novel text stays on your device by default.</p>
      <ReaderSyncPanel />
    </section>
    <ReaderClient />
    <NaturalNarrator />
  </main>;
}
