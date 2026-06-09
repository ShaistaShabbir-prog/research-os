import Link from 'next/link';
export function Nav(){
 const items=[['/','Home'],['/dashboard','Dashboard'],['/supervisor','AI Supervisor'],['/datasets','Dataset Hub'],['/graph','Knowledge Graph'],['/pricing','Pricing']];
 return <nav className="flex flex-wrap gap-3 py-6">{items.map(([href,label])=><Link className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10" key={href} href={href}>{label}</Link>)}</nav>
}
