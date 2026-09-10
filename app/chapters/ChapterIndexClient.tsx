"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import chapters from "@/data/generated/chapters";
import SpoilerControl from "../components/SpoilerControl";
import { useSpoilerChapter } from "@/lib/useSpoilerChapter";

export default function ChapterIndexClient() {
 const [q,setQ]=useState(""); const [volume,setVolume]=useState("all"); const [spoiler]=useSpoilerChapter(1);
 const visible=useMemo(()=>chapters.filter(c=>c.number<=spoiler && (volume==="all"||String(c.volume)===volume) && (!q.trim() || `${c.number} ${c.title} ${c.volumeName} ${c.mentions.join(" ")}`.toLowerCase().includes(q.toLowerCase()))),[q,volume,spoiler]);
 return <><SpoilerControl compact/><section className="filterBar"><label>Search chapters<input value={q} onChange={e=>setQ(e.target.value)} placeholder="number, title, character, organization…"/></label><label>Volume<select value={volume} onChange={e=>setVolume(e.target.value)}><option value="all">All visible volumes</option>{Array.from({length:8},(_,i)=><option key={i+1} value={i+1}>Volume {i+1}</option>)}</select></label><strong>{visible.length} chapters visible</strong></section><div className="chapterList">{visible.map(c=><Link key={c.number} href={`/chapters/${c.number}`} className="chapterRow"><span>CH {c.number}</span><div><strong>{c.title}</strong><small>Volume {c.volume} · {c.volumeName} · {c.mentionCount} companion signals</small></div><b>→</b></Link>)}</div></>;
}
