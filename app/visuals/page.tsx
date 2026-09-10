"use client";

import { useMemo, useState } from "react";
import projectArt from "@/data/visuals/project-art.json";
import epubImages from "@/data/visuals/epub-images.json";
import SpoilerControl from "../components/SpoilerControl";
import { useSpoilerChapter } from "@/lib/useSpoilerChapter";

export default function VisualsPage() {
  const [chapter] = useSpoilerChapter(1);
  const [q, setQ] = useState("");
  const rows = useMemo(
    () => epubImages.filter(i => (!i.chapterRefs.length || i.chapterRefs.some(n => n <= chapter)) && (!q || JSON.stringify(i).toLowerCase().includes(q.toLowerCase()))),
    [chapter, q],
  );

  return <main className="finalMain">
    <section className="compactHero">
      <p className="eyebrow">PHASE 6 · VISUAL LAYER</p>
      <h1>Artwork & Visual Metadata</h1>
      <p className="lead">Project-generated scenes are displayed directly. Original EPUB artwork stays source-controlled by your own EPUB and is indexed here as metadata rather than republished.</p>
    </section>
    <SpoilerControl compact />
    <section className="artGrid">
      {projectArt.filter(a => a.spoilerChapter <= chapter).map(a => <article key={a.id}>
        <figure className="projectArtFigure">
          <img src={a.asset} alt={a.title} loading="lazy" />
        </figure>
        <strong>{a.title}</strong>
        <span>{a.kind} · {a.rights}</span>
        <p>{a.provenance}</p>
      </article>)}
    </section>
    <section className="sectionBlock">
      <div className="sectionHeading"><p className="eyebrow">EPUB IMAGE CATALOGUE</p><h2>{epubImages.length} embedded image records</h2></div>
      <section className="filterBar"><label>Filter metadata<input value={q} onChange={e => setQ(e.target.value)} placeholder="pathway-guide, gallery, file318…" /></label><strong>{rows.length} matches</strong></section>
      <div className="imageMetaGrid">{rows.map(i => <article key={i.id}><strong>{i.filename}</strong><span>{i.width}×{i.height} · {i.format}</span><small>{i.classification.join(" · ")}</small>{i.chapterRefs.length > 0 && <small>chapters: {i.chapterRefs.join(", ")}</small>}</article>)}</div>
    </section>
  </main>;
}
