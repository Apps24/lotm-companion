import Link from "next/link";
import { notFound } from "next/navigation";
import chapters from "@/data/generated/chapters";
import timeline from "@/data/generated/timeline.json";
import chapter2 from "@/data/chapters/chapter-2.json";
import characters from "@/data/world/characters.json";
import organizations from "@/data/world/organizations.json";
import locations from "@/data/world/locations.json";
import items from "@/data/world/items.json";
import tarot from "@/data/tarot/members.json";

export function generateStaticParams(){return chapters.map(c=>({chapter:String(c.number)}));}
const nameMap=new Map<string,string>();
characters.forEach(x=>nameMap.set(`character:${x.id}`,x.name)); organizations.forEach(x=>nameMap.set(`organization:${x.id}`,x.name)); locations.forEach(x=>nameMap.set(`location:${x.id}`,x.name)); items.forEach(x=>nameMap.set(`item:${x.id}`,x.name)); tarot.forEach(x=>nameMap.set(`tarot:${x.id}`,`${x.seat} · ${x.name}`));

export default async function ChapterPage({params}:{params:Promise<{chapter:string}>}){
 const {chapter}=await params; const n=Number(chapter); const c=chapters.find(x=>x.number===n); if(!c) notFound();
 const events=timeline.filter(e=>e.chapter===n); const signals=c.mentions.map(id=>({id,name:nameMap.get(id)||id})); const prev=n>1?n-1:null; const next=n<1430?n+1:null;
 return <main className="finalMain"><section className="compactHero"><p className="eyebrow">VOLUME {c.volume} · {c.volumeName}</p><h1>Chapter {c.number}: {c.title}</h1><p className="lead">Companion metadata and derived context for this chapter. No novel prose is reproduced.</p></section>
 <section className="chapterMeta"><span>Source locator</span><code>{c.sourceDocument}</code><span>{c.mentionCount} indexed companion signals</span></section>
 {n===2 && <section className="featurePanel"><div className="sectionHeading"><p className="eyebrow">CURATED CHAPTER 2 ENTRY</p><h2>What happens in “Situation”</h2></div><p>{chapter2.summary}</p><div className="detailColumns"><div><h3>Characters</h3><ul>{chapter2.characters.map(x=><li key={x}>{x}</li>)}</ul><h3>What changes</h3><ul>{chapter2.changes.map(x=><li key={x}>{x}</li>)}</ul></div><div><h3>Worldbuilding</h3><ul>{chapter2.worldbuilding.map(x=><li key={x}>{x}</li>)}</ul></div><div><h3>Mysteries / questions</h3><ul>{chapter2.mysteries.map(x=><li key={x}>{x}</li>)}</ul><h3>Ritual memory</h3><ul>{chapter2.ritualMemory.map(x=><li key={x}>{x}</li>)}</ul></div></div></section>}
 <section className="sectionBlock"><div className="sectionHeading"><p className="eyebrow">WHAT CHANGED</p><h2>Indexed events</h2></div>{events.length?<div className="eventList">{events.map(e=><article key={e.id}><span>{e.type}</span><h3>{e.title}</h3><small>Importance {e.importance}/5</small></article>)}</div>:<p className="emptyState">No hand-curated major event is assigned to this chapter yet. The entity signals below still provide searchable companion context.</p>}</section>
 <section className="sectionBlock"><div className="sectionHeading"><p className="eyebrow">COMPANION SIGNALS</p><h2>Entities referenced in this chapter</h2></div>{signals.length?<div className="tagCloud">{signals.map(s=><span key={s.id}>{s.name}</span>)}</div>:<p className="emptyState">No curated entity signals were detected for this chapter.</p>}</section>
 <nav className="chapterPager">{prev?<Link href={`/chapters/${prev}`}>← Chapter {prev}</Link>:<span/>}<Link href="/chapters">All chapters</Link>{next?<Link href={`/chapters/${next}`}>Chapter {next} →</Link>:<span/>}</nav></main>;
}
