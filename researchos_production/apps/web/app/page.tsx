"use client";
import Link from "next/link";
import { ArrowRight, CheckCircle, X, BookOpen, Database, Brain, Shield, Star, Users, GraduationCap, FlaskConical, Building2 } from "lucide-react";

// ── Workflow steps ──
const WORKFLOW = [
  { step: "01", label: "Upload your draft", desc: "Thesis chapter, paper, proposal, dataset, or results section", icon: "📄" },
  { step: "02", label: "AI Supervisor reviews", desc: "6-dimension structured critique in seconds", icon: "🎓" },
  { step: "03", label: "Research gaps identified", desc: "Missing citations, weak methodology, reproducibility issues", icon: "🔍" },
  { step: "04", label: "Reviewer simulation", desc: "See how a journal reviewer would evaluate your work", icon: "📋" },
  { step: "05", label: "Revision suggestions", desc: "Specific, actionable improvements per section", icon: "✏️" },
  { step: "06", label: "Submission ready", desc: "Confident your work meets academic standards", icon: "🚀" },
];

// ── 6 review dimensions ──
const DIMENSIONS = [
  { name: "Structure",            color: "text-indigo-400",  bg: "bg-indigo-500/10  border-indigo-500/20",  desc: "Are all required sections present and well-ordered?" },
  { name: "Citation support",     color: "text-blue-400",    bg: "bg-blue-500/10    border-blue-500/20",    desc: "Are claims supported by appropriate references?" },
  { name: "Methodological rigor", color: "text-violet-400",  bg: "bg-violet-500/10  border-violet-500/20",  desc: "Are baselines, metrics, and validation protocols adequate?" },
  { name: "Novelty framing",      color: "text-purple-400",  bg: "bg-purple-500/10  border-purple-500/20",  desc: "Is the contribution and research gap clearly stated?" },
  { name: "Reproducibility",      color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", desc: "Can the work be independently verified and replicated?" },
  { name: "Academic writing",     color: "text-teal-400",    bg: "bg-teal-500/10    border-teal-500/20",    desc: "Is the register, tone, and clarity appropriate?" },
];

// ── Audience cards ──
const AUDIENCES = [
  {
    icon: GraduationCap,
    title: "MSc Students",
    color: "text-indigo-400",
    border: "border-indigo-500/20",
    items: ["Thesis chapter feedback", "Structure review", "Defense preparation", "Grammar & writing check"],
  },
  {
    icon: GraduationCap,
    title: "PhD Candidates",
    color: "text-purple-400",
    border: "border-purple-500/20",
    items: ["Literature gap analysis", "Methodology critique", "Reviewer simulation", "Viva readiness check"],
  },
  {
    icon: FlaskConical,
    title: "Research Associates",
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    items: ["Paper review & scoring", "Reproducibility audits", "Dataset documentation", "Venue-specific feedback"],
  },
  {
    icon: Building2,
    title: "Universities & Labs",
    color: "text-amber-400",
    border: "border-amber-500/20",
    items: ["Scalable supervision support", "Research quality workflows", "Multi-user lab access", "Institutional dataset catalogue"],
  },
];

// ── Comparison table ──
const COMPARE = [
  { feature: "Generates research text",           chatgpt: true,  ros: false, note: "ResearchOS reviews, not writes" },
  { feature: "Supervisor-style critique",         chatgpt: false, ros: true  },
  { feature: "6-dimension scoring",               chatgpt: false, ros: true  },
  { feature: "Reproducibility scoring",           chatgpt: false, ros: true  },
  { feature: "Reviewer simulation",               chatgpt: false, ros: true  },
  { feature: "Dataset documentation",             chatgpt: false, ros: true  },
  { feature: "Research memory (methods, papers)", chatgpt: false, ros: true  },
  { feature: "Grammar & academic writing check",  chatgpt: "partial", ros: true },
  { feature: "Context-aware (abstract vs paper)", chatgpt: false, ros: true  },
  { feature: "Ethical — never ghostwrites",       chatgpt: false, ros: true  },
];

// ── Product suite ──
const PRODUCTS = [
  {
    icon: BookOpen,
    title: "AI Supervisor",
    status: "Live",
    statusColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    color: "text-indigo-400",
    border: "border-indigo-500/20",
    bg: "bg-indigo-500/10",
    desc: "Structured supervisor-style critique of thesis chapters, exposés, paper drafts, results sections, and viva readiness. Scores 6 research dimensions. Context-aware — abstract gets abstract feedback.",
    href: "/supervisor",
    cta: "Try free →",
  },
  {
    icon: Database,
    title: "Dataset Hub",
    status: "Live",
    statusColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/10",
    desc: "Generate a complete dataset card and reproducibility report. Checks for data files, README, license, environment, schema, citation metadata, and ethical considerations.",
    href: "/datasets",
    cta: "Check dataset →",
  },
  {
    icon: Brain,
    title: "Research Memory",
    status: "Beta",
    statusColor: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    color: "text-purple-400",
    border: "border-purple-500/20",
    bg: "bg-purple-500/10",
    desc: "Extract and remember methods, datasets, institutions, and results across your documents. Build a defensible research memory that connects papers, datasets, and outcomes.",
    href: "/graph",
    cta: "Build memory →",
  },
];

// ── Example review score (illustrative) ──
const EXAMPLE_SCORES = [
  { name: "Structure",            value: 8.2, color: "bg-emerald-500" },
  { name: "Citation support",     value: 6.4, color: "bg-amber-500" },
  { name: "Methodological rigor", value: 7.1, color: "bg-emerald-500" },
  { name: "Novelty framing",      value: 5.8, color: "bg-amber-500" },
  { name: "Reproducibility",      value: 4.9, color: "bg-red-500" },
  { name: "Academic writing",     value: 8.6, color: "bg-emerald-500" },
];

export default function Home() {
  return (
    <div className="space-y-32 pt-12">

      {/* ── HERO ── */}
      <section className="relative text-center space-y-8 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm text-indigo-300">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          AI Supervisor — free to try, no account required
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08]">
          Get feedback<br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
            before your supervisor does.
          </span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          ResearchOS reviews your thesis, paper, proposal, dataset, and research project
          using structured supervisor-style critique, reproducibility scoring,
          reviewer simulation, and research memory.
        </p>

        <div className="flex flex-wrap gap-4 justify-center pt-2">
          <Link href="/supervisor" className="btn text-base px-8 py-3.5 gap-2">
            Try Supervisor Review Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/supervisor#example" className="btn-outline text-base px-8 py-3.5">
            See example review
          </Link>
        </div>

        {/* Trust line */}
        <div className="pt-4 space-y-3">
          <p className="text-xs text-slate-600 uppercase tracking-widest">Built by researchers at</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {["TU Dortmund University", "Lamarr Institute for ML & AI", "University of Hamburg"].map(org => (
              <span key={org} className="text-sm font-medium text-slate-400">{org}</span>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-2xl mx-auto">
          {[
            { v: "6", l: "Review dimensions" },
            { v: "4", l: "Review modes" },
            { v: "Free", l: "No account needed" },
            { v: "€19", l: "Student plan/month" },
          ].map(s => (
            <div key={s.l} className="bg-white/3 border border-white/6 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{s.v}</div>
              <div className="text-xs text-slate-500 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT IT IS / WHAT IT ISN'T ── */}
      <section className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Why ResearchOS</p>
          <h2 className="text-3xl font-bold">Not another AI writing tool.</h2>
          <p className="text-slate-400 max-w-xl mx-auto">ResearchOS does not generate your research. It reviews it — the way a real supervisor would.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* ChatGPT column */}
          <div className="card border border-red-500/15 space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="font-bold text-slate-300">ChatGPT / Generic AI</span>
            </div>
            {COMPARE.map((row) => (
              <div key={row.feature} className="flex items-start gap-3 text-sm">
                {row.chatgpt === true ? (
                  <CheckCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                ) : row.chatgpt === "partial" ? (
                  <span className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5 text-xs font-bold">~</span>
                ) : (
                  <X className="w-4 h-4 text-red-500/60 flex-shrink-0 mt-0.5" />
                )}
                <span className={row.chatgpt ? "text-slate-300" : "text-slate-600 line-through"}>{row.feature}</span>
              </div>
            ))}
          </div>

          {/* ResearchOS column */}
          <div className="card border border-indigo-500/30 bg-indigo-500/5 space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="font-bold text-indigo-300">ResearchOS</span>
            </div>
            {COMPARE.map((row) => (
              <div key={row.feature} className="flex items-start gap-3 text-sm">
                {row.ros ? (
                  <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                )}
                <span className={row.ros ? "text-slate-200" : "text-slate-600"}>
                  {row.feature}
                  {row.note && <span className="ml-1 text-xs text-indigo-400/70">({row.note})</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <section className="max-w-5xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">How it works</p>
          <h2 className="text-3xl font-bold">From draft to submission-ready.</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {WORKFLOW.map((w, i) => (
            <div key={w.step} className={`card flex gap-4 ${i < 5 ? "border-white/7" : "border-indigo-500/30 bg-indigo-500/5"}`}>
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-xl">
                  {w.icon}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-600 font-mono mb-0.5">{w.step}</div>
                <h3 className="font-bold text-sm text-white mb-1">{w.label}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── EXAMPLE REVIEW ── */}
      <section id="example" className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Example output</p>
          <h2 className="text-3xl font-bold">What a supervisor review looks like.</h2>
          <p className="text-slate-400 text-sm">Real output on a methodology section. Scores are explanatory, not just numerical.</p>
        </div>

        <div className="card border border-indigo-500/20 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Overall score</p>
              <div className="text-5xl font-bold text-amber-400">6.8<span className="text-xl text-slate-600 font-normal"> /10</span></div>
            </div>
            <div className="text-right">
              <span className="badge badge-amber">Revise before submission</span>
              <p className="text-xs text-slate-500 mt-1.5">supervisor mode · engineering</p>
            </div>
          </div>

          <div className="space-y-3">
            {EXAMPLE_SCORES.map(s => (
              <div key={s.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">{s.name}</span>
                  <span className="font-bold tabular-nums text-slate-300">{s.value.toFixed(1)}</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${(s.value/10)*100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
            <div className="space-y-2">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider">⚠ Major concern</p>
              <div className="text-sm text-red-300 bg-red-500/8 border border-red-500/15 rounded-lg p-3">
                Reproducibility is weak: no repository link, environment file, random seeds, or data availability statement.
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">✅ Next action</p>
              <div className="text-sm text-emerald-300 bg-emerald-500/8 border border-emerald-500/15 rounded-lg p-3">
                Add a reproducibility appendix: environment, parameters, seeds, and dataset availability.
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link href="/supervisor" className="btn px-8 py-3">
              Try with your own document <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6 DIMENSIONS ── */}
      <section className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Review framework</p>
          <h2 className="text-3xl font-bold">6 dimensions. Every review.</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">The same structured framework your supervisor uses — applied in seconds.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DIMENSIONS.map((d, i) => (
            <div key={d.name} className={`card-sm border flex items-start gap-3 ${d.bg}`}>
              <div className={`text-2xl font-black tabular-nums ${d.color} opacity-30 flex-shrink-0 w-6`}>{i+1}</div>
              <div>
                <h3 className={`font-bold text-sm ${d.color} mb-1`}>{d.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AUDIENCE ── */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Who it's for</p>
          <h2 className="text-3xl font-bold">Built for every stage of research.</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {AUDIENCES.map(a => (
            <div key={a.title} className={`card border ${a.border} flex flex-col`}>
              <div className="flex items-center gap-3 mb-4">
                <a.icon className={`w-5 h-5 ${a.color}`} />
                <h3 className={`font-bold text-sm ${a.color}`}>{a.title}</h3>
              </div>
              <ul className="space-y-2 flex-1">
                {a.items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-400">
                    <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCT SUITE ── */}
      <section className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Product suite</p>
          <h2 className="text-3xl font-bold">One platform. Three capabilities.</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">ResearchOS is a single product. AI Supervisor is the core. Dataset Hub and Research Memory extend it.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {PRODUCTS.map((p, i) => (
            <div key={p.title} className={`card border ${p.border} flex flex-col ${i === 0 ? "md:ring-1 md:ring-indigo-500/20" : ""}`}>
              {i === 0 && (
                <div className="text-center mb-3">
                  <span className="badge badge-indigo text-xs">Core product</span>
                </div>
              )}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${p.bg}`}>
                  <p.icon className={`w-5 h-5 ${p.color}`} />
                </div>
                <span className={`badge border text-xs ${p.statusColor}`}>{p.status}</span>
              </div>
              <h3 className="text-lg font-bold mb-2">{p.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-5">{p.desc}</p>
              <Link href={p.href} className="btn-outline w-full justify-center text-sm">
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── ETHICS STATEMENT ── */}
      <section className="max-w-3xl mx-auto px-4">
        <div className="card border border-white/8 text-center space-y-4 py-10">
          <Shield className="w-8 h-8 text-indigo-400 mx-auto" />
          <h2 className="text-xl font-bold">Ethical by design.</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            {[
              { title: "Never ghostwrites", desc: "Reviews, audits, and improves. Never generates your research for you." },
              { title: "No false promises", desc: "No guaranteed acceptance. No plagiarism bypass. No automated grading." },
              { title: "Researcher-first", desc: "Built by active researchers. Designed to support, not replace, academic judgment." },
            ].map(e => (
              <div key={e.title} className="space-y-1.5">
                <p className="font-semibold text-slate-200">{e.title}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="max-w-3xl mx-auto px-4">
        <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-violet-600/10 border border-white/10 rounded-3xl p-12 text-center space-y-6">
          <h2 className="text-4xl font-extrabold">Ready to review your research?</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
            Free to start. No account required for basic supervisor review.
            Paste any thesis chapter, paper draft, abstract, or results section.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/supervisor" className="btn text-base px-10 py-3.5 inline-flex">
              Try Supervisor Review Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/pricing" className="btn-outline text-base px-8 py-3.5">
              See pricing
            </Link>
          </div>
          <p className="text-xs text-slate-600">
            Built by researchers at TU Dortmund University · Lamarr Institute · University of Hamburg
          </p>
        </div>
      </section>

    </div>
  );
}
