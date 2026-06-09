import Link from 'next/link';
export function Nav(){return <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between"><Link href="/" className="font-black text-2xl">ResearchGPT</Link><div className="flex gap-5 text-sm font-semibold"><Link href="/dashboard">Dashboard</Link><Link href="/agents">Agents</Link><Link href="/pricing">Pricing</Link></div></nav>}
