import ReaderClient from './ReaderClient';

export const metadata = {
  title: 'Personal EPUB Reader · LOTM Companion',
  description: 'Read your own LOTM EPUB locally with chapter navigation, embedded images and browser narration.',
};

export default function ReadPage() {
  return <main className="readerRoute">
    <section className="readerIntro">
      <p className="eyebrow">PHASE 8 · PERSONAL READER</p>
      <h1>Read your own EPUB</h1>
      <p>Import the book locally, read every numbered chapter, keep embedded artwork, and listen with your browser or device voices. Novel text stays on your device by default.</p>
    </section>
    <ReaderClient />
  </main>;
}
