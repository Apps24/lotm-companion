import Link from "next/link";

const links = [
  ["/", "Home"], ["/chapters", "Chapters"], ["/klein", "Klein"], ["/tarot", "Tarot Club"],
  ["/world", "World"], ["/timeline", "Timeline / Search"], ["/visuals", "Visuals"],
] as const;

export default function SiteNav() {
  return <header className="siteHeader"><nav className="siteNav" aria-label="Primary navigation">
    <Link href="/" className="brand">LOTM COMPANION</Link>
    <div className="siteNavLinks">{links.map(([href,label]) => <Link key={href} href={href}>{label}</Link>)}</div>
  </nav></header>;
}
