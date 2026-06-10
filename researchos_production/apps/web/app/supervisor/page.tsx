"use client";
import { useState, useRef, useEffect } from "react";
import {
  Upload, FileText, Loader2, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle, Info, X, Zap, BookOpen, Wifi, WifiOff, Download,
  History, GitCompare, Building, RotateCcw
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { analyzeGrammar, TYPE_LABEL, SEVERITY_COLOR, SEVERITY_DOT, type GrammarIssue } from "@/lib/grammar";

// ── Venue options ──
const VENUES = [
  { value: "general", label: "General academic" },
  { value: "neurips", label: "NeurIPS" },
  { value: "ieee",    label: "IEEE Transactions" },
  { value: "nature",  label: "Nature / Nature journals" },
  { value: "acm",     label: "ACM" },
  { value: "plos",    label: "PLOS ONE" },
  { value: "thesis",  label: "PhD / MSc Thesis" },
];

const VENUE_NOTES: Record<string, string> = {
  neurips: "NeurIPS: reproducibility checklist required, strong empirical baselines, anonymous submission, ethics/broader impact section.",
  ieee:    "IEEE: structured abstract (purpose → method → results → conclusion), third-person passive voice preferred in methodology.",
  nature:  "Nature: structured abstract, methods at end, very high novelty bar, accessible to non-specialists, strict word limits.",
  acm:     "ACM: CCS concepts required, software artefacts and reproducibility packages strongly encouraged.",
  plos:    "PLOS ONE: scientific rigor not novelty, fully reproducible methods, data availability statement required.",
  thesis:  "Thesis: comprehensive literature review, clear contribution statement, limitations chapter, consistent referencing.",
  general: "",
};

const MODES = [
  { value:"supervisor", label:"🎓 Supervisor review",  desc:"Structured critique from a supervisor perspective" },
  { value:"reviewer",   label:"📝 Peer reviewer",      desc:"Simulate a journal/conference reviewer" },
  { value:"defense",    label:"🏛️ Viva / defense prep", desc:"Defense questions and readiness check" },
  { value:"results",    label:"📊 Results audit",       desc:"Deep-dive on methodology and results" },
];

const DISCIPLINES = [
  "general","computer science","engineering","medicine",
  "social sciences","physics","chemistry","biology","economics","education",
];

// ── Local storage helpers ──
const HISTORY_KEY = "researchos_review_history";
interface HistoryEntry {
  id: string;
  date: string;
  mode: string;
  discipline: string;
  venue: string;
  wordCount: number;
  overall_score: number;
  decision: string;
  text_preview: string;
  report: any;
}

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}

function saveToHistory(entry: HistoryEntry) {
  const history = loadHistory();
  history.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
}

// ── Score bar ──
function ScoreBar({ name, value, rationale }: { name:string; value:number; rationale:string }) {
  const pct = (value/10)*100;
  const color = value>=7?"bg-emerald-500":value>=5?"bg-amber-500":"bg-red-500";
  const textColor = value>=7?"text-emerald-400":value>=5?"text-amber-400":"text-red-400";
  return (
    <div className="space-y-1.5" title={rationale}>
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-300">{name}</span>
        <span className={`font-bold tabular-nums ${textColor}`}>{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{width:`${pct}%`}}/>
      </div>
    </div>
  );
}

// ── Accordion ──
function Accordion({id,label,open,onToggle,children}:any) {
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      <button onClick={()=>onToggle(id)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors">
        <span className="font-semibold text-sm">{label}</span>
        {open?<ChevronUp className="w-4 h-4 text-slate-400"/>:<ChevronDown className="w-4 h-4 text-slate-400"/>}
      </button>
      {open&&<div className="px-5 pb-5 space-y-2.5 border-t border-white/5 pt-4">{children}</div>}
    </div>
  );
}

// ── Export to markdown ──
function exportMarkdown(result: any, text: string, mode: string, discipline: string, venue: string) {
  const r = result.report;
  const lines = [
    `# ResearchOS Supervisor Review`,
    ``,
    `**Date:** ${new Date().toLocaleDateString()}  `,
    `**Mode:** ${mode} · **Discipline:** ${discipline} · **Venue:** ${venue}  `,
    `**Word count:** ${r.word_count || 0} · **Document type:** ${r.doc_type || "unknown"}`,
    ``,
    `## Overall Score: ${result.overall_score.toFixed(1)} / 10`,
    `**Decision:** ${r.decision}`,
    ``,
    `## Dimension Scores`,
    ...(r.scores||[]).map((s:any) => `- **${s.name}:** ${s.value.toFixed(1)}/10 — ${s.rationale}`),
    ``,
    `## Section Checklist`,
    ...Object.entries(r.section_presence||{}).map(([k,v]) => `- ${v?"✓":"✗"} ${k.replace("_"," ")}`),
    ``,
    `## Major Concerns`,
    ...(r.major_concerns||[]).map((c:string) => `- ⚠️ ${c}`),
    ``,
    `## Minor Concerns`,
    ...(r.minor_concerns||[]).map((c:string) => `- 💡 ${c}`),
    ``,
    `## Supervisor Comments`,
    ...(r.supervisor_comments||[]).map((c:string) => `- ${c}`),
    ``,
    `## Discussion Questions`,
    ...(r.defense_questions||[]).map((q:string,i:number) => `**Q${i+1}.** ${q}`),
    ``,
    `## Next Actions`,
    ...(r.next_actions||[]).map((a:string) => `- ✅ ${a}`),
    ``,
    `---`,
    `*Generated by ResearchOS — AI Research Supervisor*`,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `researchos-review-${new Date().toISOString().slice(0,10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SupervisorPage() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("supervisor");
  const [discipline, setDiscipline] = useState("general");
  const [venue, setVenue] = useState("general");
  const [loading, setLoading] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean|null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [openSection, setOpenSection] = useState<string|null>("major");
  const [grammar, setGrammar] = useState<GrammarIssue[]>([]);
  const [activeTab, setActiveTab] = useState<"review"|"writing"|"history"|"compare">("review");
  const [filterSev, setFilterSev] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [compareText, setCompareText] = useState("");
  const [compareResult, setCompareResult] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const wc = text.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:8000")+"/ping")
      .then(()=>setApiOnline(true)).catch(()=>setApiOnline(false));
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    if (text.trim().length < 50) { setGrammar([]); return; }
    const t = setTimeout(() => setGrammar(analyzeGrammar(text)), 600);
    return () => clearTimeout(t);
  }, [text]);

  const toggle = (id:string) => setOpenSection(s => s===id ? null : id);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const name = f.name.toLowerCase();
    if (f.type==="text/plain" || name.endsWith(".txt")) {
      setText(await f.text());
    } else if (name.endsWith(".pdf")) {
      // PDF: read as text via FileReader — extracts embedded text
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const buf = ev.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(buf);
        // Extract readable text from PDF byte stream
        let text = "";
        const str = new TextDecoder("latin1").decode(bytes);
        // Pull text between BT/ET markers (basic PDF text extraction)
        const matches = str.matchAll(/\(([^)]{2,})\)/g);
        for (const m of matches) {
          const t = m[1].replace(/\[()\]/g,"").replace(/\n/g," ").trim();
          if (t.length > 2 && /[a-zA-Z]{2,}/.test(t)) text += t + " ";
        }
        if (text.length > 100) {
          setText(text.slice(0, 12000));
        } else {
          setError("PDF text could not be extracted. Please paste the text directly.");
        }
      };
      reader.readAsArrayBuffer(f);
    } else if (name.endsWith(".docx")) {
      setError("DOCX: please copy-paste text from Word directly for now.");
    } else {
      // Try reading as plain text anyway
      try { setText(await f.text()); }
      catch { setError("Could not read file. Please paste text directly."); }
    }
  };

  const handleReview = async () => {
    if (!text.trim()) { setError("Please paste your document text."); return; }
    if (wc < 30) { setError("Need at least 30 words."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await apiClient.supervisorReview({ document_text: text, mode, discipline });
      setResult(data);
      setOpenSection("major");
      setActiveTab("review");
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        mode, discipline, venue,
        wordCount: wc,
        overall_score: data.overall_score,
        decision: data.report?.decision || "",
        text_preview: text.slice(0, 120),
        report: data.report,
      };
      saveToHistory(entry);
      setHistory(loadHistory());
    } catch (e: any) { setError(e.message || "Review failed."); }
    finally { setLoading(false); }
  };

  const handleCompare = async () => {
    if (!compareText.trim() || !result) return;
    setCompareLoading(true);
    try {
      const data = await apiClient.supervisorReview({ document_text: compareText, mode, discipline });
      setCompareResult(data);
    } catch (e: any) { setError(e.message || "Compare failed."); }
    finally { setCompareLoading(false); }
  };

  const scoreColor = (v:number) => v>=7?"text-emerald-400":v>=5?"text-amber-400":"text-red-400";
  const decisionClass = (d:string) => d?.includes("Strong")?"badge-green":d?.includes("Major")?"badge-red":"badge-amber";
  const errCount = grammar.filter(g=>g.severity==="error").length;
  const warnCount = grammar.filter(g=>g.severity==="warning").length;
  const infoCount = grammar.filter(g=>g.severity==="info").length;
  const filtered = grammar.filter(g => {
    if (filterSev!=="all" && g.severity!==filterSev) return false;
    if (filterType!=="all" && g.type!==filterType) return false;
    return true;
  });

  const venueNote = VENUE_NOTES[venue];

  return (
    <div className="max-w-6xl mx-auto pt-10 space-y-8 px-4">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-1">AI Supervisor Review</h1>
          <p className="text-slate-400 text-sm">Structured critique · Grammar check · Venue-specific feedback · Before/after comparison</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          apiOnline===true?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":
          apiOnline===false?"bg-red-500/10 text-red-400 border-red-500/20":
          "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
          {apiOnline===null?<Loader2 className="w-3 h-3 animate-spin"/>:apiOnline?<Wifi className="w-3 h-3"/>:<WifiOff className="w-3 h-3"/>}
          {apiOnline===null?"Connecting…":apiOnline?"API online":"API cold — first review ~30s"}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">

        {/* ── LEFT INPUT ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Settings card */}
          <div className="card space-y-4">
            <div className="space-y-2">
              <label className="label">Review mode</label>
              {MODES.map(m=>(
                <label key={m.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
                  ${mode===m.value?"border-indigo-500/40 bg-indigo-500/8":"border-white/8 hover:border-white/15"}`}>
                  <input type="radio" name="mode" value={m.value} checked={mode===m.value}
                    onChange={()=>setMode(m.value)} className="mt-0.5 accent-indigo-500"/>
                  <div><div className="text-sm font-semibold">{m.label}</div><div className="text-xs text-slate-500">{m.desc}</div></div>
                </label>
              ))}
            </div>
            <div className="space-y-1.5">
              <label className="label">Discipline</label>
              <select value={discipline} onChange={e=>setDiscipline(e.target.value)} className="input">
                {DISCIPLINES.map(d=><option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
              </select>
            </div>

            {/* Venue selector */}
            <div className="space-y-1.5">
              <label className="label flex items-center gap-1.5">
                <Building className="w-3 h-3"/> Target venue
              </label>
              <select value={venue} onChange={e=>setVenue(e.target.value)} className="input">
                {VENUES.map(v=><option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
              {venueNote && (
                <div className="text-xs text-amber-400/80 bg-amber-500/8 border border-amber-500/20 rounded-lg p-2.5 leading-relaxed">
                  {venueNote}
                </div>
              )}
            </div>
          </div>

          {/* Text input */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Document text</label>
              <button onClick={()=>fileRef.current?.click()} className="btn-ghost text-xs py-1 px-2 gap-1">
                <Upload className="w-3 h-3"/>Upload file
              </button>
              <input ref={fileRef} type="file" accept=".txt,.pdf,.docx" onChange={handleFile} className="hidden"/>
            </div>
            <textarea value={text} onChange={e=>setText(e.target.value)}
              placeholder={"Paste abstract, thesis chapter, paper draft, or section here…\n\nGrammar check activates automatically."}
              rows={14} className="input resize-y font-mono text-xs leading-relaxed"/>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className={wc>0&&wc<30?"text-amber-400":""}>{wc} words</span>
              <div className="flex items-center gap-3">
                {grammar.length>0&&<span className="flex items-center gap-1 text-amber-400"><Zap className="w-3 h-3"/>{grammar.length} issues{errCount>0&&<span className="text-red-400">({errCount} critical)</span>}</span>}
                {text&&<button onClick={()=>{setText("");setResult(null);setGrammar([]);}} className="hover:text-red-400 flex items-center gap-1"><X className="w-3 h-3"/>Clear</button>}
              </div>
            </div>
          </div>

          {error&&(
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5"/>
              <div>
                <p>{error}</p>
                {(error.includes("waking")||error.includes("cold")||error.includes("try again"))&&
                  <button onClick={handleReview} className="mt-2 text-xs underline">Try again →</button>}
              </div>
            </div>
          )}

          <button onClick={handleReview} disabled={loading||!text.trim()}
            className="btn w-full justify-center py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed">
            {loading?<><Loader2 className="w-4 h-4 animate-spin"/>Analysing…</>:<><FileText className="w-4 h-4"/>Run supervisor review</>}
          </button>
        </div>

        {/* ── RIGHT RESULTS ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Tabs */}
          <div className="grid grid-cols-4 bg-slate-900/60 rounded-xl p-1 gap-1">
            {[
              { id:"review",  label:"Review",  icon:<BookOpen className="w-3.5 h-3.5"/>, extra: result ? <span className={`text-xs font-bold ml-1 ${scoreColor(result.overall_score)}`}>{result.overall_score.toFixed(1)}</span> : null },
              { id:"writing", label:"Grammar", icon:<Zap className="w-3.5 h-3.5"/>, extra: grammar.length>0 ? <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-1 ${errCount>0?"bg-red-500/20 text-red-300":warnCount>0?"bg-amber-500/20 text-amber-300":"bg-sky-500/20 text-sky-300"}`}>{grammar.length}</span> : null },
              { id:"compare", label:"Compare", icon:<GitCompare className="w-3.5 h-3.5"/>, extra: null },
              { id:"history", label:"History", icon:<History className="w-3.5 h-3.5"/>, extra: history.length>0 ? <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full ml-1">{history.length}</span> : null },
            ].map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id as any)}
                className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5
                  ${activeTab===t.id?"bg-indigo-600 text-white":"text-slate-400 hover:text-white"}`}>
                {t.icon}{t.label}{t.extra}
              </button>
            ))}
          </div>

          {/* ── REVIEW TAB ── */}
          {activeTab==="review"&&<>
            {!result&&!loading&&(
              <div className="card flex flex-col items-center justify-center text-center py-24 space-y-3 text-slate-600">
                <FileText className="w-12 h-12 opacity-20"/>
                <p className="text-sm">Paste your document and run a review.</p>
                <p className="text-xs text-slate-700">Context-aware: abstract gets abstract feedback, full paper gets full critique.</p>
              </div>
            )}
            {loading&&(
              <div className="card flex items-center justify-center py-24">
                <div className="text-center space-y-3">
                  <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mx-auto"/>
                  <p className="text-slate-400 text-sm">Analysing document…</p>
                  {apiOnline===false&&<p className="text-slate-600 text-xs">API waking up — may take ~30s</p>}
                </div>
              </div>
            )}
            {result&&(
              <div className="space-y-4">
                {/* Export button */}
                <div className="flex justify-end">
                  <button onClick={()=>exportMarkdown(result, text, mode, discipline, venue)}
                    className="btn-ghost text-xs gap-1.5 px-3 py-1.5">
                    <Download className="w-3.5 h-3.5"/>Export as Markdown
                  </button>
                </div>

                {/* Doc type banner */}
                <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-500/8 border border-indigo-500/20 rounded-xl text-sm">
                  <Info className="w-4 h-4 text-indigo-400 flex-shrink-0"/>
                  <span className="text-indigo-300">
                    Analysed as: <strong>{String(result.report?.doc_type||"document").replace(/_/g," ")}</strong>
                    &nbsp;·&nbsp;{result.report?.word_count||wc} words
                    {venue!=="general"&&<>&nbsp;·&nbsp;Venue: <strong>{VENUES.find(v=>v.value===venue)?.label}</strong></>}
                  </span>
                </div>

                {/* Score card */}
                <div className="card space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Overall score</p>
                      <div className={`text-6xl font-bold tabular-nums ${scoreColor(result.overall_score)}`}>
                        {result.overall_score.toFixed(1)}<span className="text-2xl text-slate-600 font-normal"> /10</span>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <span className={`badge ${decisionClass(result.report?.decision)}`}>{result.report?.decision}</span>
                      <p className="text-xs text-slate-500">{result.report?.mode} · {result.report?.discipline}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(result.report?.scores||[]).map((s:any)=>(
                      <ScoreBar key={s.name} name={s.name} value={s.value} rationale={s.rationale}/>
                    ))}
                  </div>
                </div>

                {/* Section checklist */}
                <div className="card-sm">
                  <p className="section-title">Section checklist</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(result.report?.section_presence||{}).map(([k,v])=>(
                      <span key={k} className={`badge text-xs ${v?"badge-green":"badge-red"}`}>{v?"✓":"✗"} {k.replace("_"," ")}</span>
                    ))}
                  </div>
                </div>

                <Accordion id="major" open={openSection==="major"} onToggle={toggle} label={`⚠️ Major concerns (${(result.report?.major_concerns||[]).length})`}>
                  {(result.report?.major_concerns||[]).map((c:string,i:number)=>(
                    <div key={i} className="flex gap-3 text-sm text-red-300 bg-red-500/8 border border-red-500/15 rounded-lg p-3"><AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5"/>{c}</div>
                  ))}
                </Accordion>
                <Accordion id="minor" open={openSection==="minor"} onToggle={toggle} label={`💡 Minor concerns (${(result.report?.minor_concerns||[]).length})`}>
                  {(result.report?.minor_concerns||[]).map((c:string,i:number)=>(
                    <div key={i} className="text-sm text-amber-300 bg-amber-500/8 border border-amber-500/15 rounded-lg p-3">{c}</div>
                  ))}
                </Accordion>
                <Accordion id="comments" open={openSection==="comments"} onToggle={toggle} label="📋 Supervisor comments">
                  {(result.report?.supervisor_comments||[]).map((c:string,i:number)=>(
                    <div key={i} className="flex gap-3 text-sm text-slate-300 bg-white/3 border border-white/8 rounded-lg p-3"><Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-400"/>{c}</div>
                  ))}
                </Accordion>
                <Accordion id="questions" open={openSection==="questions"} onToggle={toggle} label={`🎓 Discussion questions`}>
                  {(result.report?.defense_questions||[]).map((q:string,i:number)=>(
                    <div key={i} className="text-sm text-slate-300 bg-white/3 border border-white/8 rounded-lg p-3"><span className="text-indigo-400 font-bold">Q{i+1}. </span>{q}</div>
                  ))}
                </Accordion>
                <Accordion id="next" open={openSection==="next"} onToggle={toggle} label="✅ Next actions">
                  {(result.report?.next_actions||[]).map((a:string,i:number)=>(
                    <div key={i} className="flex gap-3 text-sm text-emerald-300 bg-emerald-500/8 border border-emerald-500/15 rounded-lg p-3"><CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/>{a}</div>
                  ))}
                </Accordion>

                {grammar.length>0&&(
                  <button onClick={()=>setActiveTab("writing")}
                    className="w-full flex items-center gap-3 p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl hover:bg-amber-500/12 transition-colors">
                    <Zap className="w-5 h-5 text-amber-400 flex-shrink-0"/>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-amber-300">{grammar.length} grammar & writing issues</p>
                      <p className="text-xs text-amber-400/70 mt-0.5">{errCount} critical · {warnCount} warnings · {infoCount} suggestions → View tab</p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </>}

          {/* ── GRAMMAR TAB ── */}
          {activeTab==="writing"&&(
            <div className="space-y-4">
              {grammar.length===0&&(
                <div className="card flex flex-col items-center justify-center py-20 text-center space-y-3 text-slate-600">
                  <Zap className="w-10 h-10 opacity-20"/>
                  <p className="text-sm">Paste 50+ words — grammar & writing check activates automatically.</p>
                  <p className="text-xs text-slate-700">Checks: grammar, punctuation, word choice, passive voice, missing citations, tone, style</p>
                </div>
              )}
              {grammar.length>0&&<>
                <div className="grid grid-cols-3 gap-3">
                  {[{l:"Critical",c:errCount,col:"text-red-400",bg:"bg-red-500/10 border-red-500/20"},{l:"Warnings",c:warnCount,col:"text-amber-400",bg:"bg-amber-500/10 border-amber-500/20"},{l:"Suggestions",c:infoCount,col:"text-sky-400",bg:"bg-sky-500/10 border-sky-500/20"}].map(s=>(
                    <div key={s.l} className={`card-sm border text-center ${s.bg}`}>
                      <div className={`text-2xl font-bold ${s.col}`}>{s.c}</div>
                      <div className="text-xs text-slate-400 mt-1">{s.l}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-slate-500 self-center mr-1">Filter:</span>
                  {["all","error","warning","info","grammar","punctuation","word_choice","citation","style","tone"].map(f=>(
                    <button key={f} onClick={()=>{ if(["all","error","warning","info"].includes(f)) setFilterSev(f); else setFilterType(f); }}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        (filterSev===f||filterType===f)?"bg-indigo-600 text-white border-indigo-600":"border-white/10 text-slate-400 hover:border-white/25"
                      }`}>
                      {f==="all"?"All":TYPE_LABEL[f]||f.charAt(0).toUpperCase()+f.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {filtered.length===0&&<p className="text-sm text-slate-500 text-center py-8">No issues match this filter.</p>}
                  {filtered.map((g,i)=>(
                    <div key={i} className={`border rounded-xl p-4 ${SEVERITY_COLOR[g.severity]}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${SEVERITY_DOT[g.severity]}`}/>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider opacity-75">{TYPE_LABEL[g.type]||g.type}</span>
                            <span className="text-xs opacity-50 capitalize">{g.severity}</span>
                          </div>
                          <p className="text-sm font-medium mb-1.5">{g.message}</p>
                          {g.suggestion&&<p className="text-xs opacity-70 mb-2">💡 {g.suggestion}</p>}
                          <div className="font-mono text-xs opacity-60 bg-black/20 rounded px-2 py-1 truncate">
                            &ldquo;{g.text.slice(0,70)}{g.text.length>70?"…":""}&rdquo;
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>}
            </div>
          )}

          {/* ── COMPARE TAB (Before/After) ── */}
          {activeTab==="compare"&&(
            <div className="space-y-4">
              <div className="flex items-start gap-3 px-4 py-3 bg-indigo-500/8 border border-indigo-500/20 rounded-xl text-sm text-indigo-300">
                <GitCompare className="w-4 h-4 flex-shrink-0 mt-0.5"/>
                <div>
                  <p className="font-semibold mb-0.5">Before/after comparison</p>
                  <p className="text-xs text-indigo-400/70">Run a review on your original text first, then paste the revised version here to see score improvements.</p>
                </div>
              </div>

              {!result?(
                <div className="card text-center py-12 text-slate-600 space-y-2">
                  <GitCompare className="w-10 h-10 opacity-20 mx-auto"/>
                  <p className="text-sm">Run a review on your original text first (left panel), then come back here to compare with your revision.</p>
                </div>
              ):(
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="card-sm border border-white/8 text-center">
                      <p className="text-xs text-slate-500 mb-1">Original</p>
                      <div className={`text-3xl font-bold ${scoreColor(result.overall_score)}`}>{result.overall_score.toFixed(1)}</div>
                      <span className={`badge text-xs mt-1 ${decisionClass(result.report?.decision)}`}>{result.report?.decision}</span>
                    </div>
                    <div className="card-sm border border-indigo-500/20 text-center">
                      <p className="text-xs text-slate-500 mb-1">Revision</p>
                      {compareResult?(
                        <>
                          <div className={`text-3xl font-bold ${scoreColor(compareResult.overall_score)}`}>{compareResult.overall_score.toFixed(1)}</div>
                          <div className={`text-xs font-bold mt-1 ${compareResult.overall_score>result.overall_score?"text-emerald-400":compareResult.overall_score<result.overall_score?"text-red-400":"text-slate-400"}`}>
                            {compareResult.overall_score>result.overall_score?"▲":"▼"} {Math.abs(compareResult.overall_score-result.overall_score).toFixed(1)} pts
                          </div>
                        </>
                      ):(
                        <div className="text-slate-600 text-sm">—</div>
                      )}
                    </div>
                  </div>

                  {compareResult&&(
                    <div className="space-y-2">
                      {(result.report?.scores||[]).map((s:any,i:number)=>{
                        const newScore = compareResult.report?.scores?.[i];
                        if (!newScore) return null;
                        const diff = newScore.value - s.value;
                        return (
                          <div key={s.name} className="flex items-center gap-3 text-sm">
                            <span className="text-slate-400 w-40 flex-shrink-0 text-xs">{s.name}</span>
                            <span className="text-slate-500 tabular-nums w-8">{s.value.toFixed(1)}</span>
                            <span className="text-slate-600">→</span>
                            <span className={`tabular-nums w-8 ${diff>0?"text-emerald-400":diff<0?"text-red-400":"text-slate-400"}`}>{newScore.value.toFixed(1)}</span>
                            <span className={`text-xs font-bold ${diff>0?"text-emerald-400":diff<0?"text-red-400":"text-slate-600"}`}>
                              {diff>0?`+${diff.toFixed(1)}`:diff<0?diff.toFixed(1):"="}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="label">Paste revised text</label>
                    <textarea value={compareText} onChange={e=>setCompareText(e.target.value)}
                      placeholder="Paste your revised/improved version here…"
                      rows={10} className="input resize-y font-mono text-xs"/>
                  </div>
                  <button onClick={handleCompare} disabled={compareLoading||!compareText.trim()}
                    className="btn w-full justify-center disabled:opacity-40">
                    {compareLoading?<><Loader2 className="w-4 h-4 animate-spin"/>Reviewing revision…</>:<><GitCompare className="w-4 h-4"/>Compare with revision</>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab==="history"&&(
            <div className="space-y-4">
              {history.length===0?(
                <div className="card text-center py-16 text-slate-600 space-y-2">
                  <History className="w-10 h-10 opacity-20 mx-auto"/>
                  <p className="text-sm">No reviews yet. Run a review to build your history.</p>
                </div>
              ):(
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">{history.length} saved reviews</p>
                    <button onClick={()=>{ localStorage.removeItem(HISTORY_KEY); setHistory([]); }}
                      className="btn-ghost text-xs gap-1 text-red-400 hover:text-red-300">
                      <RotateCcw className="w-3 h-3"/>Clear all
                    </button>
                  </div>
                  <div className="space-y-3">
                    {history.map((h, i) => (
                      <div key={h.id} className="card-sm border border-white/8 space-y-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-2xl font-bold tabular-nums ${scoreColor(h.overall_score)}`}>{h.overall_score.toFixed(1)}</span>
                              <span className={`badge text-xs ${decisionClass(h.decision)}`}>{h.decision}</span>
                            </div>
                            <p className="text-xs text-slate-500">{h.date} · {h.mode} · {h.discipline} · {h.wordCount} words</p>
                          </div>
                          {i>0&&history[i-1]&&(
                            <div className={`text-xs font-bold px-2 py-1 rounded-lg ${h.overall_score>history[i-1].overall_score?"bg-emerald-500/10 text-emerald-400":h.overall_score<history[i-1].overall_score?"bg-red-500/10 text-red-400":"bg-white/5 text-slate-500"}`}>
                              {h.overall_score>history[i-1].overall_score?"▲":"▼"} {Math.abs(h.overall_score-history[i-1].overall_score).toFixed(1)} vs prev
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono truncate">&ldquo;{h.text_preview}…&rdquo;</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(h.report?.scores||[]).map((s:any)=>(
                            <span key={s.name} className={`text-[10px] px-2 py-0.5 rounded-full border ${
                              s.value>=7?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":
                              s.value>=5?"bg-amber-500/10 text-amber-400 border-amber-500/20":
                              "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}>{s.name.split(" ")[0]} {s.value.toFixed(1)}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
