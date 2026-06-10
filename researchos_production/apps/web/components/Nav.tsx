"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpen, Menu, X, ExternalLink, ChevronDown } from "lucide-react";

const LINKS = [
  { href: "/supervisor", label: "AI Supervisor", badge: "Live" },
  { href: "/datasets",   label: "Dataset Hub",   badge: null },
  { href: "/graph",      label: "Research Memory", badge: "Beta" },
  { href: "/pricing",    label: "Pricing",        badge: null },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0f1e]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">

        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white">ResearchOS</span>
            <span className="hidden sm:inline text-xs text-slate-500 ml-2">AI Research Supervisor</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5
                ${pathname === l.href ? "bg-white/8 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
              {l.label}
              {l.badge && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  l.badge === "Live" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                }`}>{l.badge}</span>
              )}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost text-sm">Dashboard</Link>
          <a href={(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000") + "/docs"}
            target="_blank" rel="noopener" className="btn-ghost text-xs gap-1">
            API <ExternalLink className="w-3 h-3" />
          </a>
          <Link href="/auth" className="btn text-sm px-4 py-2">Sign in</Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-slate-400 hover:text-white">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 bg-[#0a0f1e]/98 px-4 py-4 space-y-1">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors
                ${pathname === l.href ? "bg-indigo-600/20 text-indigo-300" : "text-slate-300 hover:bg-white/5"}`}>
              {l.label}
              {l.badge && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                l.badge === "Live" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
              }`}>{l.badge}</span>}
            </Link>
          ))}
          <div className="pt-2 space-y-2">
            <Link href="/dashboard" onClick={() => setOpen(false)} className="btn-outline w-full justify-center">Dashboard</Link>
            <Link href="/auth" onClick={() => setOpen(false)} className="btn w-full justify-center">Sign in</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
