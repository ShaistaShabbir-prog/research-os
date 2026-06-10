"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle, X, BookOpen, Database, Brain, Shield, Quote } from "lucide-react";

const REVIEWER_QUOTES = [
  { quote: "Insufficient novelty framing.", label: "Typical reviewer comment" },
  { quote: "Methodology lacks justification.", label: "Typical reviewer comment" },
  { quote: "Missing citations for key claims.", label: "Typical reviewer comment" },
  { quote: "Reproducibility unclear.", label: "Typical reviewer comment" },
];

const WORKFLOW = [
  { n:"01", icon:"📄", title:"Upload your draft", desc:"Thesis chapter, paper, proposal, results section — any format" },
  { n:"02", icon:"🔍", title:"Quality dimensions scored", desc:"6-dimension structured analysis in seconds" },
  { n:"03", icon:"🧠", title:"Weaknesses identified", desc:"Missing citations, methodology gaps, reproducibility issues" },
  { n:"04", icon:"📋", title:"Reviewer simulation", desc:"See how a journal reviewer would evaluate your work" },
  { n:"05", icon:"✅", title:"Submission-ready", desc:"Confident your work meets academic standards" },
];

const DIMENSIONS = [
  { n:"1", name:"Structure",              color:"text-indigo-400",  bg:"bg-indigo-500/10 border-indigo-500/20",   score:8.0 },
  { n:"2", name:"Citation Support",       color:"text-blue-400",    bg:"bg-blue-500/10 border-blue-500/20",       score:7.5 },
  { n:"3", name:"Methodological Rigor",   color:"text-violet-400",  bg:"bg-violet-500/10 border-violet-500/20",   score:8.5 },
  { n:"4", name:"Novelty Framing",        color:"text-purple-400",  bg:"bg-purple-500/10 border-purple-500/20",   score:7.0 },
  { n:"5", name:"Reproducibility",        color:"text-emerald-400", bg:"bg-emerald-500/10 border-emerald-500/20", score:8.0 },
  { n:"6", name:"Academic Writing",       color:"text-teal-400",    bg:"bg-teal-500/10 border-teal-500/20",       score:7.5 },
];

const WHO = [
  { title:"MSc Students",       icon:"🎓", color:"border-indigo-500/20",  items:["Thesis feedback","Structure review","Defense prep","Writing check"] },
  { title:"PhD Candidates",     icon:"🎓", color:"border-purple-500/20",  items:["Literature gaps","Methodology critique","Reviewer simulation","Viva readiness"] },
  { title:"Research Associates",icon:"🔬", color:"border-emerald-500/20", items:["Paper review","Reproducibility audit","Dataset docs","Venue feedback"] },
  { title:"Professors",         icon:"🏛️", color:"border-amber-500/20",   items:["Consistent feedback","Student progress","Draft screening","Quality workflows"] },
  { title:"Research Groups",    icon:"🔗", color:"border-blue-500/20",    items:["Knowledge preservation","Institutional memory","Dataset catalogue","Multi-user access"] },
  { title:"Universities",       icon:"🏫", color:"border-rose-500/20",    items:["Scalable supervision","Research quality KPIs","Reproducibility standards","Lab onboarding"] },
];

const COMPARE = [
  { f:"Generates text for you",           chatgpt:true,  ros:false, note:"ResearchOS reviews — never writes for you" },
  { f:"Structured 6-dimension scoring",   chatgpt:false, ros:true  },
  { f:"Reproducibility assessment",       chatgpt:false, ros:true  },
  { f:"Reviewer simulation",              chatgpt:false, ros:true  },
  { f:"Dataset documentation",            chatgpt:false, ros:true  },
  { f:"Research memory across documents", chatgpt:false, ros:true  },
  { f:"Context-aware (abstract vs paper)",chatgpt:false, ros:true  },
  { f:"Grammar & academic writing check", chatgpt:"~",   ros:true  },
  { f:"Venue-specific feedback",          chatgpt:false, ros:true  },
  { f:"Ethical — never ghostwrites",      chatgpt:false, ros:true  },
];

const FAQ = [
  { q:"Does ResearchOS write my research for me?", a:"No. ResearchOS reviews, critiques, and helps you improve your own work. It identifies weaknesses before reviewers do. It never generates research content for you." },
  { q:"How is this different from ChatGPT?", a:"ChatGPT generates text. ResearchOS reviews research quality. It scores 6 structured dimensions, simulates reviewers, checks reproducibility, and remembers your research history." },
  { q:"Do I need an account to try it?", a:"No. The free tier requires no account. Paste any abstract, thesis chapter, or paper draft and receive immediate structured feedback." },
  { q:"Is my research data private?", a:"On the free tier, document text is processed in memory and not stored. See our Privacy Policy for full details." },
  { q:"What file formats are supported?", a:"Paste text directly, or upload .txt files. PDF and DOCX upload are available on paid plans." },
];

export default function Home() {
  return (
    <div className="space-y-0">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                Free to try · No account required
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.08]">
                  Improve Research Quality<br />
                  <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                    Before Submission.
                  </span>
                </h1>
                <p className="text-xl text-slate-400 leading-relaxed max-w-xl">
                  ResearchOS helps students, researchers, and supervisors identify weaknesses in papers,
                  theses, datasets, and research workflows — before they become reviewer comments.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/supervisor" className="btn text-base px-8 py-3.5 gap-2">
                  Get a Free Research Review <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/supervisor#example" className="btn-outline text-base px-8 py-3.5">
                  See Example Feedback
                </Link>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-600 uppercase tracking-widest">Built by researchers at</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {["TU Dortmund University","Lamarr Institute for ML & AI","University of Hamburg"].map(o=>(
                    <span key={o} className="text-sm font-medium text-slate-400">{o}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Product graphic */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-3xl" />
              <div className="relative w-full max-w-xl">
                <div className="absolute -inset-px bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl blur-sm" />
                <Image
                  src="/assets/researchos_hero.png"
                  alt="ResearchOS — Research Quality Platform product preview showing 6-dimension review, supervisor feedback, and research memory"
                  width={720}
                  height={540}
                  className="relative w-full rounded-2xl border border-white/10 shadow-2xl"
                  priority
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── PROBLEM — Reviewer comments ── */}
      <section className="py-20 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest">The problem</p>
            <h2 className="text-3xl font-bold">These reviewer comments are preventable.</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm">ResearchOS identifies these issues before submission — so they never reach a reviewer.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {REVIEWER_QUOTES.map((q,i) => (
              <div key={i} className="card border border-red-500/15 bg-red-500/5 space-y-3">
                <Quote className="w-5 h-5 text-red-400/50" />
                <p className="text-sm font-semibold text-red-300 italic">&ldquo;{q.quote}&rdquo;</p>
                <p className="text-xs text-slate-600">{q.label}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-6 py-4">
              <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <p className="text-sm text-indigo-300 font-medium">ResearchOS identifies all of the above before you submit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHO IT HELPS ── */}
      <section className="py-20 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Who it helps</p>
            <h2 className="text-3xl font-bold">Designed for every stage of research.</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">ResearchOS does not replace supervision. It reduces repetitive feedback cycles and improves research quality at scale.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHO.map(w => (
              <div key={w.title} className={`card border ${w.color} flex flex-col`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{w.icon}</span>
                  <h3 className="font-bold">{w.title}</h3>
                </div>
                <ul className="space-y-2 flex-1">
                  {w.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs text-slate-400">
                      <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-600" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 space-y-10">
          <div className="text-center">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">How it works</p>
            <h2 className="text-3xl font-bold mt-2">From draft to submission-ready in 5 steps.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {WORKFLOW.map((w,i) => (
              <div key={w.n} className={`card-sm border ${i===4?"border-indigo-500/30 bg-indigo-500/5":"border-white/7"} space-y-3`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{w.icon}</span>
                  <span className="text-xs font-mono text-slate-600">{w.n}</span>
                </div>
                <h3 className="font-bold text-sm">{w.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6 QUALITY DIMENSIONS ── */}
      <section id="example" className="py-20 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Research quality dimensions</p>
            <h2 className="text-3xl font-bold">6 dimensions. Every review.</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">The same structured framework your supervisor uses — delivered in seconds, with explanations.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-3">
              {DIMENSIONS.map(d => (
                <div key={d.name} className={`card-sm border ${d.bg} flex items-center gap-4`}>
                  <div className={`text-xl font-black tabular-nums opacity-30 flex-shrink-0 ${d.color} w-6`}>{d.n}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`font-bold text-sm ${d.color}`}>{d.name}</span>
                      <span className="text-sm font-bold tabular-nums text-slate-300">{d.score.toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${d.color.replace("text-","bg-")}`} style={{width:`${(d.score/10)*100}%`}} />
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-600 text-center pt-1">Example scores — illustrative only</p>
            </div>

            <div className="space-y-4">
              <div className="card border border-white/8 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Overall score</p>
                    <div className="text-5xl font-bold text-amber-400">7.8<span className="text-xl text-slate-600 font-normal"> /10</span></div>
                  </div>
                  <span className="badge badge-amber">Revise before submission</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">⚠️ Major concerns</p>
                  {["Clarify research gap in Introduction — reviewers will challenge this.","Add more recent citations (2022–2024) — the literature review appears outdated.","Methodology section needs more detail on validation protocol."].map((c,i)=>(
                    <div key={i} className="text-xs text-red-300 bg-red-500/8 border border-red-500/15 rounded-lg p-2.5">{c}</div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">✅ Next actions</p>
                  {["Strengthen related work section.","Add ablation study.","Address limitations explicitly."].map((a,i)=>(
                    <div key={i} className="text-xs text-emerald-300 bg-emerald-500/8 border border-emerald-500/15 rounded-lg p-2.5">{a}</div>
                  ))}
                </div>
                <Link href="/supervisor" className="btn w-full justify-center text-sm">
                  Get your own review <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VS CHATGPT ── */}
      <section className="py-20 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Why ResearchOS</p>
            <h2 className="text-3xl font-bold">Not another AI writing tool.</h2>
            <p className="text-slate-400 text-sm">ResearchOS does not generate your research. It reviews it — the way a real supervisor would.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card border border-red-500/15 space-y-2.5">
              <div className="flex items-center gap-2 mb-4"><div className="w-2 h-2 rounded-full bg-red-400"/><span className="font-bold text-slate-300">ChatGPT / Generic AI</span></div>
              {COMPARE.map(row=>(
                <div key={row.f} className="flex items-start gap-2.5 text-sm">
                  {row.chatgpt===true?<CheckCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5"/>:row.chatgpt==="~"?<span className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5 text-xs font-bold">~</span>:<X className="w-4 h-4 text-red-500/60 flex-shrink-0 mt-0.5"/>}
                  <span className={row.chatgpt?"text-slate-300":"text-slate-600 line-through"}>{row.f}</span>
                </div>
              ))}
            </div>
            <div className="card border border-indigo-500/30 bg-indigo-500/5 space-y-2.5">
              <div className="flex items-center gap-2 mb-4"><div className="w-2 h-2 rounded-full bg-indigo-400"/><span className="font-bold text-indigo-300">ResearchOS</span></div>
              {COMPARE.map(row=>(
                <div key={row.f} className="flex items-start gap-2.5 text-sm">
                  {row.ros?<CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5"/>:<X className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5"/>}
                  <span className={row.ros?"text-slate-200":"text-slate-600"}>
                    {row.f}{row.note&&<span className="ml-1 text-xs text-indigo-400/70">({row.note})</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── INSTITUTIONAL BENEFITS ── */}
      <section className="py-20 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">For research groups & universities</p>
            <h2 className="text-3xl font-bold">Research quality infrastructure at scale.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon:"📊", title:"Consistent feedback standards", desc:"Every student receives the same structured 6-dimension evaluation — no supervisor inconsistency." },
              { icon:"🧠", title:"Institutional knowledge preserved", desc:"Research Memory captures methods, datasets, and outcomes across your group's history." },
              { icon:"♻️", title:"Reduced repetitive review cycles", desc:"Supervisors spend less time on elementary feedback and more time on high-level guidance." },
              { icon:"📋", title:"Dataset quality workflows", desc:"Every dataset submitted gets a reproducibility score and documentation audit." },
              { icon:"📈", title:"Visible research progress", desc:"Track how student drafts improve across revisions over time." },
              { icon:"🔒", title:"Privacy-first by design", desc:"Document content is not stored on the free tier. No LLM training on your research." },
            ].map(b=>(
              <div key={b.title} className="card-sm border border-white/8 space-y-2">
                <span className="text-2xl">{b.icon}</span>
                <h3 className="font-bold text-sm">{b.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section className="py-20 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Platform modules</p>
            <h2 className="text-3xl font-bold">One platform. Three capabilities.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon:BookOpen, title:"AI Supervisor", status:"Live", color:"text-indigo-400", border:"border-indigo-500/25", bg:"bg-indigo-500/10", href:"/supervisor", desc:"Structured 6-dimension critique — abstract-aware, venue-specific, with reviewer simulation, before/after comparison, and review history.", core:true },
              { icon:Database, title:"Dataset Hub", status:"Live", color:"text-emerald-400", border:"border-emerald-500/20", bg:"bg-emerald-500/10", href:"/datasets", desc:"Dataset card generation, reproducibility scoring, metadata audit, missing field warnings, and documentation recommendations." },
              { icon:Brain, title:"Research Memory", status:"Beta", color:"text-purple-400", border:"border-purple-500/20", bg:"bg-purple-500/10", href:"/graph", desc:"Extract methods, datasets, institutions, and results from your documents. Preserve institutional knowledge across your research group." },
            ].map(p=>(
              <div key={p.title} className={`card border ${p.border} flex flex-col ${p.core?"ring-1 ring-indigo-500/20":""}`}>
                {p.core&&<div className="text-center mb-3"><span className="badge badge-indigo text-xs">Core module</span></div>}
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${p.bg}`}><p.icon className={`w-5 h-5 ${p.color}`}/></div>
                  <span className={`badge text-xs ${p.status==="Live"?"badge-green":"badge-amber"}`}>{p.status}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{p.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-5">{p.desc}</p>
                <Link href={p.href} className="btn-outline w-full justify-center text-sm">Open →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">FAQ</p>
            <h2 className="text-3xl font-bold">Common questions.</h2>
          </div>
          {FAQ.map((f,i)=>(
            <div key={i} className="card-sm border border-white/8 space-y-2">
              <h3 className="font-bold text-sm text-white">{f.q}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ETHICS ── */}
      <section className="py-16 border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4">
          <div className="card border border-white/8 text-center space-y-4 py-10">
            <Shield className="w-8 h-8 text-indigo-400 mx-auto"/>
            <h2 className="text-xl font-bold">Ethical by design.</h2>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              {[
                { title:"Never ghostwrites", desc:"Reviews and improves. Never generates research content for you." },
                { title:"No false promises", desc:"No guaranteed acceptance. No plagiarism bypass. No automated grading." },
                { title:"Researcher-first", desc:"Built by active researchers. Designed to support — never replace — academic judgment." },
              ].map(e=>(
                <div key={e.title} className="space-y-1.5">
                  <p className="font-semibold text-slate-200">{e.title}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{e.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-violet-600/10 border border-white/10 rounded-3xl p-12 text-center space-y-6">
            <h2 className="text-4xl font-extrabold">Improve your research before submission.</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">Free to start. No account required. Paste any thesis chapter, paper draft, abstract, or results section and receive immediate structured feedback.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/supervisor" className="btn text-base px-10 py-3.5 inline-flex gap-2">
                Get a Free Research Review <ArrowRight className="w-5 h-5"/>
              </Link>
              <Link href="/pricing" className="btn-outline text-base px-8 py-3.5">See pricing</Link>
            </div>
            <p className="text-xs text-slate-600">Built by researchers at TU Dortmund · Lamarr Institute · University of Hamburg</p>
          </div>
        </div>
      </section>

    </div>
  );
}
