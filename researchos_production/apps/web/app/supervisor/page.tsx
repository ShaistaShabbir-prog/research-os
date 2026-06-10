"use client";
import { useState, useRef, useEffect } from "react";
import {
  Upload, FileText, Loader2, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Info, X, Zap, BookOpen, Wifi, WifiOff
} from "lucide-react";
import { apiClient, type WritingSuggestion } from "@/lib/api";

const MODES = [
  { value: "supervisor", label: "🎓 Supervisor review", desc: "Structured critique from a supervisor perspective" },
  { value: "reviewer",   label: "📝 Peer reviewer",    desc: "Simulate a journal/conference reviewer" },
  { value: "defense",    label: "🏛️ Viva / defense",   desc: "Defense questions and readiness check" },
  { value: "results",    label: "📊 Results audit",     desc: "Deep-dive on methodology and results" },
];

const DISCIPLINES = [
  "general","computer science","engineering","medicine",
  "social sciences","physics","chemistry","biology","economics","education",
];

const SEVERITY_COLOR = {
  error:   "text-red-400 bg-red-500/10 border-red-500/20",
  warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  info:    "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

const SEVERITY_ICON = {
  error:   "🔴",
  warning: "🟡",
  info:    "🔵",
};

const TYPE_LABEL = {
  citation:   "Missing citation",
  style:      "Style",
  word_choice:"Word choice",
  clarity:    "Clarity",
  tone:       "Tone",
  grammar:    "Grammar",
};

function ScoreBar({ name, value, rationale }: { name: string; value: number; rationale: string }) {
  const pct = (value / 10) * 100;
  const color = value >= 7 ? "bg-emerald-500" : value >= 5 ? "bg-amber-500" : "bg-red-500";
  const textColor = value >= 7 ? "text-emerald-400" : value >= 5 ? "text-amber-400" : "text-red-400";
  return (
    <div className="space-y-1.5" title={rationale}>
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-300">{name}</span>
        <span className={`font-bold tabular-nums ${textColor}`}>{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Accordion({ id, label, open, onToggle, children }: any) {
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      <button onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors">
        <span className="font-semibold text-sm">{label}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-2.5 border-t border-white/5 pt-4">{children}</div>}
    </div>
  );
}

export default function SupervisorPage() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("supervisor");
  const [discipline, setDiscipline] = useState("general");
  const [loading, setLoading] = useState(false);
  const [warming, setWarming] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [openSection, setOpenSection] = useState<string | null>("major");
  const [writing, setWriting] = useState<WritingSuggestion[]>([]);
  const [activeTab, setActiveTab] = useState<"review" | "writing">("review");
  const [writingFilter, setWritingFilter] = useState<string>("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  // Warm up API on page load
  useEffect(() => {
    setWarming(true);
    fetch((process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000") + "/ping")
      .then(() => { setApiOnline(true); setWarming(false); })
      .catch(() => { setApiOnline(false); setWarming(false); });
  }, []);

  // Live writing analysis
  useEffect(() => {
    if (text.trim().length < 100) { setWriting([]); return; }
    const timer = setTimeout(() => {
      setWriting(apiClient.analyzeWriting(text));
    }, 800);
    return () => clearTimeout(timer);
  }, [text]);

  const toggleSection = (id: string) => setOpenSection(s => s === id ? null : id);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "text/plain") setText(await file.text());
    else setError("Paste text directly, or upload a .txt file.");
  };

  const handleReview = async () => {
    if (!text.trim()) { setError("Please paste your document text."); return; }
    if (wordCount < 50) { setError("Need at least 50 words for meaningful analysis."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await apiClient.supervisorReview({ document_text: text, mode, discipline });
      setResult(data);
      setOpenSection("major");
      setActiveTab("review");
    } catch (e: any) {
      setError(e.message || "Review failed.");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (v: number) => v >= 7 ? "text-emerald-400" : v >= 5 ? "text-amber-400" : "text-red-400";
  const decisionClass = (d: string) =>
    d?.includes("Strong") ? "badge-green" : d?.includes("Major") ? "badge-red" : "badge-amber";

  const filteredWriting = writingFilter === "all"
    ? writing
    : writing.filter(s => s.type === writingFilter || s.severity === writingFilter);

  const writingCounts = {
    error: writing.filter(s => s.severity === "error").length,
    warning: writing.filter(s => s.severity === "warning").length,
    info: writing.filter(s => s.severity === "info").length,
  };

  return (
    <div className="max-w-6xl mx-auto pt-10 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-1">AI Supervisor Review</h1>
          <p className="text-slate-400 text-sm">Structured critique + live writing analysis for thesis, paper, and viva readiness.</p>
        </div>
        {/* API status pill */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          apiOnline === true ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
          apiOnline === false ? "bg-red-500/10 text-red-400 border-red-500/20" :
          "bg-amber-500/10 text-amber-400 border-amber-500/20"
        }`}>
          {warming ? <Loader2 className="w-3 h-3 animate-spin" /> :
           apiOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {warming ? "Connecting…" : apiOnline ? "API online" : "API cold — first review may take ~30s"}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">

        {/* ── LEFT INPUT ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Mode selector */}
          <div className="card space-y-4">
            <div className="space-y-2">
              <label className="label">Review mode</label>
              {MODES.map(m => (
                <label key={m.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
                  ${mode === m.value ? "border-indigo-500/40 bg-indigo-500/8" : "border-white/8 hover:border-white/15"}`}>
                  <input type="radio" name="mode" value={m.value} checked={mode === m.value}
                    onChange={() => setMode(m.value)} className="mt-0.5 accent-indigo-500" />
                  <div>
                    <div className="text-sm font-semibold">{m.label}</div>
                    <div className="text-xs text-slate-500">{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="space-y-1.5">
              <label className="label">Discipline</label>
              <select value={discipline} onChange={e => setDiscipline(e.target.value)} className="input">
                {DISCIPLINES.map(d => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Text input */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Document text</label>
              <button onClick={() => fileRef.current?.click()} className="btn-ghost text-xs py-1 px-2 gap-1.5">
                <Upload className="w-3 h-3" /> Load .txt
              </button>
              <input ref={fileRef} type="file" accept=".txt" onChange={handleFile} className="hidden" />
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your thesis chapter, paper draft, exposé, or results section here…&#10;&#10;Live writing analysis activates after 100 words."
              rows={16}
              className="input resize-y font-mono text-xs leading-relaxed"
            />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className={wordCount > 0 && wordCount < 50 ? "text-amber-400" : ""}>{wordCount} words</span>
              <div className="flex items-center gap-3">
                {writing.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="text-amber-400">{writing.length} writing suggestions</span>
                  </span>
                )}
                {text && <button onClick={() => { setText(""); setResult(null); setWriting([]); }}
                  className="text-slate-500 hover:text-red-400 flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear
                </button>}
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p>{error}</p>
                {error.includes("waking up") && (
                  <button onClick={handleReview} className="mt-2 text-xs underline text-red-400">Try again →</button>
                )}
              </div>
            </div>
          )}

          <button onClick={handleReview} disabled={loading || !text.trim()}
            className="btn w-full justify-center py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</>
              : <><FileText className="w-4 h-4" /> Run supervisor review</>
            }
          </button>
          <p className="text-xs text-slate-600 text-center">
            {apiOnline === false ? "⚠️ API waking up — first review may take ~30s" : "Heuristic analysis · no data sent to LLM"}
          </p>
        </div>

        {/* ── RIGHT RESULTS ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Tabs */}
          {(result || writing.length > 0) && (
            <div className="flex bg-slate-900/60 rounded-xl p-1 gap-1">
              <button onClick={() => setActiveTab("review")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
                  ${activeTab === "review" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>
                <BookOpen className="w-4 h-4" /> Supervisor Review
                {result && <span className={`text-xs ${scoreColor(result.overall_score)}`}>{result.overall_score.toFixed(1)}</span>}
              </button>
              <button onClick={() => setActiveTab("writing")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
                  ${activeTab === "writing" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>
                <Zap className="w-4 h-4" /> Writing Analysis
                {writing.length > 0 && (
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full">{writing.length}</span>
                )}
              </button>
            </div>
          )}

          {/* ── WRITING TAB ── */}
          {activeTab === "writing" && (
            <div className="space-y-4">
              {writing.length === 0 && (
                <div className="card flex flex-col items-center justify-center text-center py-16 space-y-3 text-slate-600">
                  <Zap className="w-10 h-10 opacity-20" />
                  <p className="text-sm">Paste 100+ words to activate live writing analysis.</p>
                </div>
              )}
              {writing.length > 0 && (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Critical", count: writingCounts.error, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                      { label: "Warnings", count: writingCounts.warning, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                      { label: "Style tips", count: writingCounts.info, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                    ].map(s => (
                      <div key={s.label} className={`card-sm border text-center ${s.bg}`}>
                        <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
                        <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Filter */}
                  <div className="flex gap-2 flex-wrap">
                    {["all","error","warning","info","citation","style","word_choice","clarity"].map(f => (
                      <button key={f} onClick={() => setWritingFilter(f)}
                        className={`text-xs px-3 py-1 rounded-full border transition-all ${
                          writingFilter === f
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "border-white/10 text-slate-400 hover:border-white/20"
                        }`}>
                        {f === "all" ? "All" : f.replace("_"," ")}
                      </button>
                    ))}
                  </div>

                  {/* Suggestions list */}
                  <div className="space-y-2.5">
                    {filteredWriting.map((s, i) => (
                      <div key={i} className={`border rounded-xl p-4 ${SEVERITY_COLOR[s.severity]}`}>
                        <div className="flex items-start gap-3">
                          <span className="text-base flex-shrink-0 mt-0.5">{SEVERITY_ICON[s.severity]}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                                {TYPE_LABEL[s.type as keyof typeof TYPE_LABEL] || s.type}
                              </span>
                            </div>
                            <p className="text-sm font-medium mb-1">{s.message}</p>
                            <div className="font-mono text-xs opacity-60 bg-black/20 rounded px-2 py-1 truncate">
                              "…{s.text.slice(0, 60)}{s.text.length > 60 ? "…" : ""}"
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── REVIEW TAB ── */}
          {activeTab === "review" && (
            <>
              {!result && !loading && (
                <div className="card flex flex-col items-center justify-center text-center py-24 space-y-4 text-slate-600">
                  <FileText className="w-12 h-12 opacity-20" />
                  <p className="text-sm">Paste your document and run a review.<br />Results appear here.</p>
                </div>
              )}

              {loading && (
                <div className="card flex items-center justify-center py-24">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mx-auto" />
                    <p className="text-slate-400 text-sm">Analysing document…</p>
                    <p className="text-slate-600 text-xs">If API is cold starting, this may take ~30s</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {/* Score overview */}
                  <div className="card space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Overall score</p>
                        <div className={`text-6xl font-bold tabular-nums ${scoreColor(result.overall_score)}`}>
                          {result.overall_score.toFixed(1)}
                          <span className="text-2xl text-slate-600 font-normal"> /10</span>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <span className={`badge ${decisionClass(result.report?.decision)}`}>
                          {result.report?.decision}
                        </span>
                        <p className="text-xs text-slate-500">{result.report?.mode} · {result.report?.discipline}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {(result.report?.scores || []).map((s: any) => (
                        <ScoreBar key={s.name} name={s.name} value={s.value} rationale={s.rationale} />
                      ))}
                    </div>
                  </div>

                  {/* Section checklist */}
                  <div className="card-sm">
                    <p className="section-title">Section checklist</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(result.report?.section_presence || {}).map(([k, v]) => (
                        <span key={k} className={`badge text-xs ${v ? "badge-green" : "badge-red"}`}>
                          {v ? "✓" : "✗"} {k.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Accordion id="major" open={openSection === "major"} onToggle={toggleSection}
                    label={`⚠️ Major concerns (${(result.report?.major_concerns || []).length})`}>
                    {(result.report?.major_concerns || []).map((c: string, i: number) => (
                      <div key={i} className="flex gap-3 text-sm text-red-300 bg-red-500/8 border border-red-500/15 rounded-lg p-3">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{c}
                      </div>
                    ))}
                  </Accordion>

                  <Accordion id="minor" open={openSection === "minor"} onToggle={toggleSection}
                    label={`💡 Minor concerns (${(result.report?.minor_concerns || []).length})`}>
                    {(result.report?.minor_concerns || []).map((c: string, i: number) => (
                      <div key={i} className="text-sm text-amber-300 bg-amber-500/8 border border-amber-500/15 rounded-lg p-3">{c}</div>
                    ))}
                  </Accordion>

                  <Accordion id="comments" open={openSection === "comments"} onToggle={toggleSection}
                    label="📋 Supervisor comments">
                    {(result.report?.supervisor_comments || []).map((c: string, i: number) => (
                      <div key={i} className="flex gap-3 text-sm text-slate-300 bg-white/3 border border-white/8 rounded-lg p-3">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-400" />{c}
                      </div>
                    ))}
                  </Accordion>

                  <Accordion id="questions" open={openSection === "questions"} onToggle={toggleSection}
                    label={`🎓 ${mode === "defense" ? "Defense" : "Discussion"} questions`}>
                    {(result.report?.defense_questions || []).map((q: string, i: number) => (
                      <div key={i} className="text-sm text-slate-300 bg-white/3 border border-white/8 rounded-lg p-3">
                        <span className="text-indigo-400 font-bold">Q{i + 1}. </span>{q}
                      </div>
                    ))}
                  </Accordion>

                  <Accordion id="next" open={openSection === "next"} onToggle={toggleSection}
                    label="✅ Next actions">
                    {(result.report?.next_actions || []).map((a: string, i: number) => (
                      <div key={i} className="flex gap-3 text-sm text-emerald-300 bg-emerald-500/8 border border-emerald-500/15 rounded-lg p-3">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{a}
                      </div>
                    ))}
                  </Accordion>

                  {/* Writing suggestions callout */}
                  {writing.length > 0 && (
                    <button onClick={() => setActiveTab("writing")}
                      className="w-full flex items-center gap-3 p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl text-sm text-amber-300 hover:bg-amber-500/12 transition-colors">
                      <Zap className="w-5 h-5 flex-shrink-0" />
                      <div className="text-left">
                        <p className="font-semibold">{writing.length} writing suggestions detected</p>
                        <p className="text-xs text-amber-400/70 mt-0.5">{writingCounts.error} critical · {writingCounts.warning} warnings · {writingCounts.info} style tips → Click to view</p>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
