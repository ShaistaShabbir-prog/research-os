"use client";
import { useState, useRef, useEffect } from "react";
import { Upload, FileText, Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info, X, Zap, BookOpen, Wifi, WifiOff } from "lucide-react";
import { apiClient } from "@/lib/api";
import { analyzeGrammar, TYPE_LABEL, SEVERITY_COLOR, SEVERITY_DOT, type GrammarIssue } from "@/lib/grammar";

const MODES = [
  { value:"supervisor", label:"🎓 Supervisor review",  desc:"Structured critique from a supervisor perspective" },
  { value:"reviewer",   label:"📝 Peer reviewer",      desc:"Simulate a journal/conference reviewer" },
  { value:"defense",    label:"🏛️ Viva / defense prep", desc:"Defense questions and readiness check" },
  { value:"results",    label:"📊 Results audit",       desc:"Deep-dive on methodology and results" },
];
const DISCIPLINES = ["general","computer science","engineering","medicine","social sciences","physics","chemistry","biology","economics","education"];

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

function Accordion({id,label,open,onToggle,children}:any){
  return(
    <div className="border border-white/8 rounded-xl overflow-hidden">
      <button onClick={()=>onToggle(id)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors">
        <span className="font-semibold text-sm">{label}</span>
        {open?<ChevronUp className="w-4 h-4 text-slate-400"/>:<ChevronDown className="w-4 h-4 text-slate-400"/>}
      </button>
      {open&&<div className="px-5 pb-5 space-y-2.5 border-t border-white/5 pt-4">{children}</div>}
    </div>
  );
}

export default function SupervisorPage(){
  const [text,setText]=useState("");
  const [mode,setMode]=useState("supervisor");
  const [discipline,setDiscipline]=useState("general");
  const [loading,setLoading]=useState(false);
  const [apiOnline,setApiOnline]=useState<boolean|null>(null);
  const [result,setResult]=useState<any>(null);
  const [error,setError]=useState("");
  const [openSection,setOpenSection]=useState<string|null>("major");
  const [grammar,setGrammar]=useState<GrammarIssue[]>([]);
  const [activeTab,setActiveTab]=useState<"review"|"writing">("review");
  const [filterSev,setFilterSev]=useState("all");
  const [filterType,setFilterType]=useState("all");
  const fileRef=useRef<HTMLInputElement>(null);
  const wc=text.trim().split(/\s+/).filter(Boolean).length;

  // Warm up API
  useEffect(()=>{
    fetch((process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:8000")+"/ping")
      .then(()=>setApiOnline(true)).catch(()=>setApiOnline(false));
  },[]);

  // Live grammar analysis (debounced)
  useEffect(()=>{
    if(text.trim().length<50){setGrammar([]);return;}
    const t=setTimeout(()=>setGrammar(analyzeGrammar(text)),600);
    return()=>clearTimeout(t);
  },[text]);

  const toggle=(id:string)=>setOpenSection(s=>s===id?null:id);

  const handleFile=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0]; if(!f) return;
    if(f.type==="text/plain") setText(await f.text());
    else setError("Upload a .txt file or paste text directly.");
  };

  const handleReview=async()=>{
    if(!text.trim()){setError("Please paste your document text.");return;}
    if(wc<30){setError("Need at least 30 words for analysis.");return;}
    setLoading(true);setError("");setResult(null);
    try{
      const data=await apiClient.supervisorReview({document_text:text,mode,discipline});
      setResult(data);setOpenSection("major");setActiveTab("review");
    }catch(e:any){setError(e.message||"Review failed.");}
    finally{setLoading(false);}
  };

  const scoreColor=(v:number)=>v>=7?"text-emerald-400":v>=5?"text-amber-400":"text-red-400";
  const decisionClass=(d:string)=>d?.includes("Strong")?"badge-green":d?.includes("Major")?"badge-red":"badge-amber";

  const errCount=grammar.filter(g=>g.severity==="error").length;
  const warnCount=grammar.filter(g=>g.severity==="warning").length;
  const infoCount=grammar.filter(g=>g.severity==="info").length;

  const filtered=grammar.filter(g=>{
    if(filterSev!=="all"&&g.severity!==filterSev) return false;
    if(filterType!=="all"&&g.type!==filterType) return false;
    return true;
  });

  return(
    <div className="max-w-6xl mx-auto pt-10 space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-1">AI Supervisor Review</h1>
          <p className="text-slate-400 text-sm">Structured critique · Live grammar & writing check · Context-aware feedback</p>
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
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card space-y-4">
            <div className="space-y-2">
              <label className="label">Review mode</label>
              {MODES.map(m=>(
                <label key={m.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${mode===m.value?"border-indigo-500/40 bg-indigo-500/8":"border-white/8 hover:border-white/15"}`}>
                  <input type="radio" name="mode" value={m.value} checked={mode===m.value} onChange={()=>setMode(m.value)} className="mt-0.5 accent-indigo-500"/>
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
          </div>

          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Document text</label>
              <button onClick={()=>fileRef.current?.click()} className="btn-ghost text-xs py-1 px-2 gap-1">
                <Upload className="w-3 h-3"/>Load .txt
              </button>
              <input ref={fileRef} type="file" accept=".txt" onChange={handleFile} className="hidden"/>
            </div>
            <textarea value={text} onChange={e=>setText(e.target.value)}
              placeholder={"Paste abstract, thesis chapter, paper draft, or section here…\n\nGrammar & writing check activates automatically."}
              rows={16} className="input resize-y font-mono text-xs leading-relaxed"/>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className={wc>0&&wc<30?"text-amber-400":""}>{wc} words</span>
              <div className="flex items-center gap-3">
                {grammar.length>0&&(
                  <span className="flex items-center gap-1 text-amber-400">
                    <Zap className="w-3 h-3"/>{grammar.length} issues
                    {errCount>0&&<span className="ml-1 text-red-400">({errCount} critical)</span>}
                  </span>
                )}
                {text&&<button onClick={()=>{setText("");setResult(null);setGrammar([]);}} className="hover:text-red-400 flex items-center gap-1"><X className="w-3 h-3"/>Clear</button>}
              </div>
            </div>
          </div>

          {error&&(
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5"/>
              <div>
                <p>{error}</p>
                {(error.includes("waking")||error.includes("cold")||error.includes("try again"))&&(
                  <button onClick={handleReview} className="mt-2 text-xs underline">Try again →</button>
                )}
              </div>
            </div>
          )}

          <button onClick={handleReview} disabled={loading||!text.trim()}
            className="btn w-full justify-center py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed">
            {loading?<><Loader2 className="w-4 h-4 animate-spin"/>Analysing…</>:<><FileText className="w-4 h-4"/>Run supervisor review</>}
          </button>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tab switcher */}
          <div className="flex bg-slate-900/60 rounded-xl p-1 gap-1">
            <button onClick={()=>setActiveTab("review")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab==="review"?"bg-indigo-600 text-white":"text-slate-400 hover:text-white"}`}>
              <BookOpen className="w-4 h-4"/>Supervisor Review
              {result&&<span className={`text-xs font-bold ${scoreColor(result.overall_score)}`}>{result.overall_score.toFixed(1)}</span>}
            </button>
            <button onClick={()=>setActiveTab("writing")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab==="writing"?"bg-indigo-600 text-white":"text-slate-400 hover:text-white"}`}>
              <Zap className="w-4 h-4"/>Grammar & Writing
              {grammar.length>0&&<span className={`text-xs px-1.5 py-0.5 rounded-full ${errCount>0?"bg-red-500/20 text-red-300":warnCount>0?"bg-amber-500/20 text-amber-300":"bg-sky-500/20 text-sky-300"}`}>{grammar.length}</span>}
            </button>
          </div>

          {/* ── WRITING TAB ── */}
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
                {/* Score cards */}
                <div className="grid grid-cols-3 gap-3">
                  {[{l:"Critical",c:errCount,col:"text-red-400",bg:"bg-red-500/10 border-red-500/20"},{l:"Warnings",c:warnCount,col:"text-amber-400",bg:"bg-amber-500/10 border-amber-500/20"},{l:"Suggestions",c:infoCount,col:"text-sky-400",bg:"bg-sky-500/10 border-sky-500/20"}].map(s=>(
                    <div key={s.l} className={`card-sm border text-center ${s.bg}`}>
                      <div className={`text-2xl font-bold ${s.col}`}>{s.c}</div>
                      <div className="text-xs text-slate-400 mt-1">{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-slate-500 self-center mr-1">Severity:</span>
                  {["all","error","warning","info"].map(f=>(
                    <button key={f} onClick={()=>setFilterSev(f)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${filterSev===f?"bg-indigo-600 text-white border-indigo-600":"border-white/10 text-slate-400 hover:border-white/25"}`}>
                      {f==="all"?"All":f.charAt(0).toUpperCase()+f.slice(1)}
                    </button>
                  ))}
                  <span className="text-xs text-slate-500 self-center ml-2 mr-1">Type:</span>
                  {["all","grammar","punctuation","word_choice","citation","style","tone","clarity"].map(f=>(
                    <button key={f} onClick={()=>setFilterType(f)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${filterType===f?"bg-indigo-600 text-white border-indigo-600":"border-white/10 text-slate-400 hover:border-white/25"}`}>
                      {f==="all"?"All":TYPE_LABEL[f]||f}
                    </button>
                  ))}
                </div>

                {/* Issues list */}
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

          {/* ── REVIEW TAB ── */}
          {activeTab==="review"&&<>
            {!result&&!loading&&(
              <div className="card flex flex-col items-center justify-center text-center py-24 space-y-3 text-slate-600">
                <FileText className="w-12 h-12 opacity-20"/>
                <p className="text-sm">Paste your document and run a review.<br/>Feedback is scaled to document type: abstract, section, or full paper.</p>
              </div>
            )}
            {loading&&(
              <div className="card flex items-center justify-center py-24">
                <div className="text-center space-y-3">
                  <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mx-auto"/>
                  <p className="text-slate-400 text-sm">Analysing your document…</p>
                  {apiOnline===false&&<p className="text-slate-600 text-xs">API cold starting — may take ~30s</p>}
                </div>
              </div>
            )}
            {result&&(
              <div className="space-y-4">
                {/* Doc type banner */}
                <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-500/8 border border-indigo-500/20 rounded-xl text-sm">
                  <Info className="w-4 h-4 text-indigo-400 flex-shrink-0"/>
                  <span className="text-indigo-300">
                    Analysed as: <strong>{String(result.report?.doc_type||"document").replace(/_/g," ")}</strong>
                    &nbsp;·&nbsp;{result.report?.word_count||wc} words
                    &nbsp;·&nbsp;Feedback scaled accordingly
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
                    <div key={i} className="flex gap-3 text-sm text-red-300 bg-red-500/8 border border-red-500/15 rounded-lg p-3">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5"/>{c}
                    </div>
                  ))}
                </Accordion>
                <Accordion id="minor" open={openSection==="minor"} onToggle={toggle} label={`💡 Minor concerns (${(result.report?.minor_concerns||[]).length})`}>
                  {(result.report?.minor_concerns||[]).map((c:string,i:number)=>(
                    <div key={i} className="text-sm text-amber-300 bg-amber-500/8 border border-amber-500/15 rounded-lg p-3">{c}</div>
                  ))}
                </Accordion>
                <Accordion id="comments" open={openSection==="comments"} onToggle={toggle} label="📋 Supervisor comments">
                  {(result.report?.supervisor_comments||[]).map((c:string,i:number)=>(
                    <div key={i} className="flex gap-3 text-sm text-slate-300 bg-white/3 border border-white/8 rounded-lg p-3">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-400"/>{c}
                    </div>
                  ))}
                </Accordion>
                <Accordion id="questions" open={openSection==="questions"} onToggle={toggle} label={`🎓 Discussion questions (${(result.report?.defense_questions||[]).length})`}>
                  {(result.report?.defense_questions||[]).map((q:string,i:number)=>(
                    <div key={i} className="text-sm text-slate-300 bg-white/3 border border-white/8 rounded-lg p-3">
                      <span className="text-indigo-400 font-bold">Q{i+1}. </span>{q}
                    </div>
                  ))}
                </Accordion>
                <Accordion id="next" open={openSection==="next"} onToggle={toggle} label="✅ Next actions">
                  {(result.report?.next_actions||[]).map((a:string,i:number)=>(
                    <div key={i} className="flex gap-3 text-sm text-emerald-300 bg-emerald-500/8 border border-emerald-500/15 rounded-lg p-3">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/>{a}
                    </div>
                  ))}
                </Accordion>

                {grammar.length>0&&(
                  <button onClick={()=>setActiveTab("writing")}
                    className="w-full flex items-center gap-3 p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl hover:bg-amber-500/12 transition-colors">
                    <Zap className="w-5 h-5 text-amber-400 flex-shrink-0"/>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-amber-300">{grammar.length} grammar & writing issues found</p>
                      <p className="text-xs text-amber-400/70 mt-0.5">{errCount} critical · {warnCount} warnings · {infoCount} suggestions → Click to view</p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </>}
        </div>
      </div>
    </div>
  );
}
