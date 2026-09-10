import Link from "next/link";
import summary from "@/data/generated/epub-summary.json";
import volumes from "@/data/generated/volumes.json";
import SpoilerControl from "./components/SpoilerControl";

const destinations = [
  ["/read","Personal EPUB Reader","Import your own EPUB locally, read every numbered chapter with embedded images, and listen using browser/device voices.","READ"],
  ["/chapters","Chapter Companion","All 1,430 numbered chapters, title search, entity signals and chapter detail pages.","1430"],
  ["/chapters/2","Chapter 2 · Situation","Curated derived notes for the requested Chapter 2: situation, characters, worldbuilding and mysteries.","CH 2"],
  ["/klein","Klein’s Journey","Sequence 9→0, aliases, items, fights, relationships, locations and organizations.","S9→S0"],
  ["/tarot","Tarot Club","All seats, joining chronology, pathway progression and real-world interaction milestones.","10 SEATS"],
  ["/world","World Graph","Important characters, 22 pathways, organizations, locations, mystical items and major lore.","22 PATHS"],
  ["/timeline","Timeline / Search","Spoiler-filtered event spine and fast Book 1 event search.","BOOK 1"],
  ["/visuals","Visual Layer","328 EPUB-image metadata records plus project-generated scene art and provenance rules.","328+"],
] as const;

export default function Home() {
  return <main className="finalMain">
    <section className="finalHero"><p className="eyebrow">BOOK 1 · COMPANION + PERSONAL READER</p><h1>Lord of the Mysteries<br/>Interactive Companion</h1><p className="lead">Read your own EPUB locally or explore the novel as a chapter-linked knowledge graph: Klein’s progression, the Tarot Club, pathways, people, battles, items, lore, locations and artwork metadata.</p><div className="heroButtons"><Link className="primaryButton" href="/read">Read my EPUB</Link><Link className="secondaryButton" href="/chapters">Open chapter companion</Link><Link className="secondaryButton" href="/klein">Explore Klein’s journey</Link></div></section>
    <SpoilerControl />
    <section className="stats finalStats"><div><strong>{summary.chapterCount}</strong><span>numbered chapters</span></div><div><strong>{summary.volumeCount}</strong><span>volumes</span></div><div><strong>{summary.imageCount}</strong><span>EPUB images indexed</span></div><div><strong>22</strong><span>standard pathways</span></div></section>
    <section className="sectionBlock"><div className="sectionHeading"><p className="eyebrow">EXPLORE</p><h2>Book 1 companion sections</h2></div><div className="destinationGrid">{destinations.map(([href,title,desc,badge])=><Link href={href} className="destinationCard" key={href}><span>{badge}</span><h3>{title}</h3><p>{desc}</p><b>Open →</b></Link>)}</div></section>
    <section className="sectionBlock"><div className="sectionHeading"><p className="eyebrow">SOURCE STRUCTURE</p><h2>Eight volumes, one chapter key</h2></div><div className="volumeGrid">{volumes.map(v=><article key={v.number}><small>VOLUME {v.number}</small><h3>{v.name}</h3><p>Chapters {v.chapterStart}–{v.chapterEnd}</p><Link href={`/chapters?volume=${v.number}`}>Browse volume →</Link></article>)}</div></section>
    <section className="principles"><h2>How the reader and companion stay safe</h2><p><strong>Chapter is the central foreign key.</strong> Every reveal, progression, relationship, item, location, organization and visual record resolves to a chapter or range.</p><p className="privacyNote"><strong>Personal reader:</strong> your imported EPUB is parsed and cached in the browser; chapter prose and original EPUB artwork are not committed to the public repository.</p></section>
  </main>;
}
