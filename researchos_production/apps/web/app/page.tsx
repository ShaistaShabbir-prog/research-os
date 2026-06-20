"use client";
import Link from "next/link";
import { ArrowRight, CheckCircle, Scale, Search, Users, Brain, Award, MessageSquare, BookOpen, FileText, Shield } from "lucide-react";

const TOOLS = [
  { href:"/review-copilot",      icon:"⚖️",  title:"Review Copilot",        desc:"AI-powered paper analysis — claims, reproducibility, citations, meta-review",    badge:"AI + Heuristic", color:"#7c3aed" },
  { href:"/claim-verification",  icon:"🔍",  title:"Claim Verification",    desc:"Extract claims, score evidence support, flag unsupported assertions",            badge:"Phase 2",        color:"#3b82f6" },
  { href:"/reviewer-fatigue",    icon:"👥",  title:"Reviewer Fatigue",      desc:"Summarise reviews, disagreement matrix, AC briefing, meta-review draft",         badge:"Phase 3",        color:"#10b981" },
  { href:"/research-memory",     icon:"🧠",  title:"Research Memory",       desc:"Compare 2–10 papers — novelty overlap, citation overlap, contribution diff",     badge:"Phase 4",        color:"#f59e0b" },
  { href:"/badges",              icon:"🏅",  title:"Reproducibility Badges","Generate embeddable SVG badges — A–F grade, NeurIPS checklist, embed code",          badge:"Issue #16",      color:"#ec4899" },
  { href:"/copilot",             icon:"💬",  title:"Copilot Chat",          desc:"Context-aware research assistant — Claude-powered with heuristic fallback",       badge:"Issue #13",      color:"#8b5cf6" },
  { href:"/supervisor",          icon:"👩‍🏫",  title:"Supervisor Review",     desc:"6-dimension structured review of thesis chapters, papers, and proposals",        badge:"Phase 1",        color:"#06b6d4" },
  { href:"/datasets",            icon:"📊",  title:"Dataset Card Generator","Reproducibility-first dataset documentation and scoring",                              badge:"Feature",        color:"#84cc16" },
];

const STATS = [
  { n:"247+", label:"Tests passing" },
  { n:"10",   label:"Languages" },
  { n:"24",   label:"API endpoints" },
  { n:"4",    label:"AI modules" },
];

export default function HomePage() {
  return (
    <main style={{ minHeight:"100vh", padding:"40px 16px", fontFamily:"Inter,system-ui,sans-serif", maxWidth:1100, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:48 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#a78bfa", marginBottom:10 }}>
          ResearchOS
        </div>
        <h1 style={{ fontSize:"clamp(1.8rem,4vw,2.8rem)", fontWeight:900, color:"#fff", margin:"0 0 14px", lineHeight:1.2 }}>
          AI-powered peer review quality platform
        </h1>
        <p style={{ fontSize:15, color:"rgba(255,255,255,.5)", maxWidth:580, margin:"0 auto 24px", lineHeight:1.7 }}>
          For reviewers, area chairs, supervisors, and students.
          Heuristic-first — works without an API key. Claude AI optional.
        </p>
        <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
          <Link href="/review-copilot" style={{ padding:"11px 24px", borderRadius:10, background:"#7c3aed", color:"#fff", fontSize:14, fontWeight:700, textDecoration:"none", display:"flex", alignItems:"center", gap:7 }}>
            <Scale style={{ width:15 }} />Try Review Copilot
          </Link>
          <Link href="/supervisor" style={{ padding:"11px 20px", borderRadius:10, border:"1px solid rgba(255,255,255,.15)", background:"transparent", color:"rgba(255,255,255,.7)", fontSize:14, textDecoration:"none" }}>
            Supervisor Review →
          </Link>
        </div>

        {/* Ethics disclaimer */}
        <div style={{ margin:"20px auto 0", maxWidth:560, padding:"10px 16px", borderRadius:9, background:"rgba(245,158,11,.06)", border:"1px solid rgba(245,158,11,.2)", fontSize:12, color:"rgba(255,255,255,.55)", lineHeight:1.6 }}>
          ⚠ This tool supports human review and must not be used as an automated decision system.
          All outputs require human verification.
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:48 }}>
        {STATS.map(s => (
          <div key={s.label} style={{ padding:"16px", borderRadius:12, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", textAlign:"center" }}>
            <div style={{ fontSize:26, fontWeight:900, color:"#fff" }}>{s.n}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tools grid */}
      <h2 style={{ fontSize:16, fontWeight:800, color:"#fff", marginBottom:16 }}>All tools</h2>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14, marginBottom:48 }}>
        {TOOLS.map(tool => (
          <Link key={tool.href} href={tool.href} style={{ textDecoration:"none" }}>
            <div style={{ padding:20, borderRadius:14, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", height:"100%", transition:"border-color .15s", cursor:"pointer" }}
                 onMouseEnter={e => (e.currentTarget.style.borderColor = tool.color + "50")}
                 onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,.08)")}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontSize:22 }}>{tool.icon}</span>
                <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:`${tool.color}20`, color:tool.color }}>{tool.badge}</span>
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:6 }}>{tool.title}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.5)", lineHeight:1.6 }}>{tool.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Live links */}
      <div style={{ padding:20, borderRadius:14, background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", display:"flex", flexWrap:"wrap", gap:16, alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>Live at:</span>
        <a href="https://research-os-phi.vercel.app" target="_blank" rel="noopener" style={{ fontSize:13, color:"#a78bfa", textDecoration:"none" }}>research-os-phi.vercel.app ↗</a>
        <span style={{ color:"rgba(255,255,255,.15)" }}>·</span>
        <a href="https://researchos-api-8zqh.onrender.com/health" target="_blank" rel="noopener" style={{ fontSize:13, color:"#4ade80", textDecoration:"none" }}>API health ↗</a>
        <span style={{ color:"rgba(255,255,255,.15)" }}>·</span>
        <a href="https://github.com/ShaistaShabbir-prog/research-os" target="_blank" rel="noopener" style={{ fontSize:13, color:"rgba(255,255,255,.4)", textDecoration:"none" }}>GitHub ↗</a>
      </div>
    </main>
  );
}