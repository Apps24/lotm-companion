import "./globals.css";
import "./final.css";
import type { Metadata } from "next";
import SiteNav from "./components/SiteNav";

export const metadata: Metadata = {
  title: "LOTM Interactive Companion",
  description: "A spoiler-aware Book 1 companion for Lord of the Mysteries: chapters, progression, Tarot Club, world graph, timeline and visual metadata.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SiteNav />{children}<footer className="siteFooter"><strong>LOTM Interactive Companion</strong><span>Book 1 metadata and derived companion notes only. Source novel prose is not republished.</span></footer></body></html>;
}
