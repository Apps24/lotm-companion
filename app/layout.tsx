import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LOTM Companion',
  description: 'A spoiler-aware visual companion for Lord of the Mysteries.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
