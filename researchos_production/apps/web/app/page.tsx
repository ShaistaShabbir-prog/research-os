"use client";
import Link from "next/link";
import { ArrowRight, BookOpen, Database, GitBranch, CheckCircle, Shield, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: BookOpen,
    title: "AI Supervisor",
    phase: "Phase 1 — Live",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    ring: "ring-indigo-500/20",
    desc: "Structured supervisor-style critique of thesis chapters, exposés, paper drafts, results sections, and viva readiness. Scores structure, citation, methodology, novelty, reproducibility, and writing quality.",
    href: "/supervisor",
    cta: "Try supervisor →",
  },
  {
    icon: Database,
    title: "Dataset Hub",
    phase: "Phase 2 — Live",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    ring: "ring-emerald-500/20",
    desc: "Generate a complete dataset card and reproducibility report. Checks for data files, README, license, environment, schema, citation metadata, and ethical considerations.",
    href: "/datasets",
    cta: "Check dataset →",
  },
  {
    icon: GitBranch,
    title: "Knowledge Graph",
    phase: "Phase 3 — Beta",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    ring: "ring-purple-500/20",
    desc: "Extract methods, datasets, and institutions from your documents. Build a defensible research memory graph that connects papers, datasets, methods, and outcomes.",
    href: "/graph",
    cta: "Build graph →",
  },
];

const PRINCIPLES = [
  { icon: Shield, text: "Never ghostwrites. Reviews, audits, and helps researchers improve their own work ethically." },
  { icon: CheckCircle, text: "No claim of guaranteed acceptance. No plagiarism bypass. No automated high-stakes grading." },
  { icon: Zap, text: "Built for MSc students, PhD candidates, research associates, supervisors, and research groups." },
];

const STATS = [
  { value: "6", label: "Review dimensions" },
  { value: "100%", label: "Heuristic — no data sent to LLM by default" },
  { value: "€9/mo", label: "Student plan" },
  { value: "Free", label: "Basic tier — no account required" },
];

export default function Home() {
  return (
    <div className="space-y-24 pt-16">

      {/* ── HERO ── */}
      <section className="relative text-center space-y-8 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm text-indigo-300">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          AI Supervisor is live — try it free
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-tight">
          The operating system<br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            for modern research.
          </span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          ResearchOS combines supervisor-style feedback, dataset documentation,
          reproducibility scoring, and knowledge graph memory — in one ethical,
          researcher-first platform.
        </p>

        <div className="flex flex-wrap gap-4 justify-center pt-2">
          <Link href="/supervisor" className="btn text-base px-8 py-3">
            Get supervisor review <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/pricing" className="btn-outline text-base px-8 py-3">
            See pricing
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          {STATS.map(s => (
            <div key={s.label} className="bg-white/3 border border-white/6 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRINCIPLES ── */}
      <section className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {PRINCIPLES.map(p => (
          <div key={p.text} className="flex items-start gap-3 bg-white/3 border border-white/6 rounded-xl p-4">
            <p.icon className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-400 leading-relaxed">{p.text}</p>
          </div>
        ))}
      </section>

      {/* ── FEATURE CARDS ── */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <p className="section-title">Product suite</p>
          <h2 className="text-3xl font-bold">Three tools. One research workflow.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className={`card border ${f.border} flex flex-col`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${f.bg}`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <span className="badge badge-indigo">{f.phase}</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-6">{f.desc}</p>
              <Link href={f.href} className="btn-outline w-full justify-center">
                {f.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-emerald-600/10 border border-white/10 rounded-3xl p-12 text-center space-y-6">
        <h2 className="text-4xl font-bold">Start reviewing your research today.</h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          Free to start. No account required for basic supervisor review.
          Student plan at €9/month unlocks full access.
        </p>
        <Link href="/supervisor" className="btn text-base px-10 py-3 inline-flex">
          Try for free <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

    </div>
  );
}
