import fs from "node:fs"; import path from "node:path";
const root=process.cwd(), errors=[]; const ok=(c,m)=>{if(!c)errors.push(m)}; const text=p=>fs.readFileSync(path.join(root,p),"utf8");
const requiredRoutes=["app/page.tsx","app/chapters/page.tsx","app/chapters/[chapter]/page.tsx","app/klein/page.tsx","app/tarot/page.tsx","app/world/page.tsx","app/timeline/page.tsx","app/visuals/page.tsx"];
requiredRoutes.forEach(p=>ok(fs.existsSync(path.join(root,p)),`missing route ${p}`));
const home=text("app/page.tsx"); ["/chapters","/klein","/tarot","/world","/timeline","/visuals","/chapters/2"].forEach(h=>ok(home.includes(h),`homepage missing link ${h}`));
const nav=text("app/components/SiteNav.tsx"); ["Home","Chapters","Klein","Tarot Club","World","Timeline / Search","Visuals"].forEach(x=>ok(nav.includes(x),`global nav missing ${x}`));
const allSource=requiredRoutes.concat(["app/components/SiteNav.tsx","app/components/SpoilerControl.tsx"]).map(text).join("\n"); ok(!/<img(?![^>]*alt=)/i.test(allSource),"found image without alt text");
if(errors.length){console.error(`Release QA failed: ${errors.length}`);errors.forEach(e=>console.error(` - ${e}`));process.exit(1)}console.log("Release QA passed: routes, homepage links, navigation and accessibility smoke checks.");
