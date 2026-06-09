"use client";
import { useState, useRef } from "react";
import {
  Upload, FileText, Loader2, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Info, X
} from "lucide-react";
import { apiClient } from "@/lib/api";

const MODES = [
  { value: "supervisor", label: "🎓 Supervisor review", desc: "Structured critique from a supervisor perspective" },
  { value: "reviewer", label: "📝 Peer reviewer", desc: "Simulate a journal/conference reviewer" },
  { value: "defense", label: "🏛️ Viva / defense prep", desc: "Defense questions and readiness check" },
  { value: "results", label: "📊 Results audit", desc: "Deep-dive on methodology and results" },
];

const DISCIPLINES = [
  "general", "computer science", "engineering", "medicine",
  "social sciences", "physics", "chemistry", "biology", "economics", "education",
];

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
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors"
      >
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
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [openSection, setOpenSection] = useState<string | null>("major");
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleSection = (id: string) => setOpenSection(s => s === id ? null : id);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "text/plain") {
      setText(await file.text());
    } else {
      setError("For PDF/DOCX, use the upload endpoint. Plain text (.txt) files are supported here.");
    }
  };

  const handleReview = async () => {
    if (!text.trim()) { setError("Please paste or type your document text."); return; }
    if (wordCount < 50) { setError("Please provide at least 50 words for a meaningful analysis."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await apiClient.supervisorReview({ document_text: text, mode, discipline });
      setResult(data);
      setOpenSection("major");
    } catch (e: any) {
      setError(e.message || "Review failed. Is the API running?");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (v: number) => v >= 7 ? "text-emerald-400" : v >= 5 ? "text-amber-400" : "text-red-400";
  const decisionClass = (d: string) =>
    d?.includes("Strong") ? "badge-green" : d?.includes("Major") ? "badge-red" : "badge-amber";

  const selectedMode = MODES.find(m => m.value === mode);

  return (
    <div className="max-w-6xl mx-auto pt-10 space-y-8">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-bold">AI Supervisor Review</h1>
        <p className="text-slate-400 text-sm max-w-xl">
          Structured critique of thesis chapters, papers, exposés, results sections, and viva readiness.
          Heuristic scoring — no data sent to LLM unless you add an API key.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">

        {/* ── LEFT: INPUT ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Mode selector */}
          <div className="card space-y-4">
            <div className="space-y-1.5">
              <label className="label">Review mode</label>
              <div className="space-y-2">
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
              <button onClick={() => fileRef.current?.click()}
                className="btn-ghost text-xs py-1 px-2 gap-1.5">
                <Upload className="w-3 h-3" /> Load .txt
              </button>
              <input ref={fileRef} type="file" accept=".txt" onChange={handleFile} className="hidden" />
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your thesis chapter, paper draft, exposé, or results section here…&#10;&#10;Minimum ~200 words for meaningful analysis."
              rows={16}
              className="input resize-y font-mono text-xs leading-relaxed"
            />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className={wordCount > 0 && wordCount < 50 ? "text-amber-400" : ""}>{wordCount} words</span>
              {text && <button onClick={() => { setText(""); setResult(null); }} className="text-slate-500 hover:text-red-400 flex items-center gap-1"><X className="w-3 h-3" /> Clear</button>}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <button
            onClick={handleReview}
            disabled={loading || !text.trim()}
            className="btn w-full justify-center py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</>
              : <><FileText className="w-4 h-4" /> Run {selectedMode?.label.split(" ").slice(1).join(" ")}</>
            }
          </button>

          <p className="text-xs text-slate-600 text-center">
            Heuristic analysis. Add an LLM API key for deeper AI critique.
          </p>
        </div>

        {/* ── RIGHT: RESULTS ── */}
        <div className="lg:col-span-3 space-y-4">

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
                <p className="text-slate-400 text-sm">Analysing document structure, citations, methodology…</p>
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

              {/* Section presence */}
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

              {/* Accordions */}
              <Accordion id="major" open={openSection === "major"} onToggle={toggleSection}
                label={`⚠️ Major concerns (${(result.report?.major_concerns || []).length})`}>
                {(result.report?.major_concerns || []).map((c: string, i: number) => (
                  <div key={i} className="flex gap-3 text-sm text-red-300 bg-red-500/8 border border-red-500/15 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {c}
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
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-400" /> {c}
                  </div>
                ))}
              </Accordion>

              <Accordion id="questions" open={openSection === "questions"} onToggle={toggleSection}
                label={`🎓 ${mode === "defense" ? "Defense" : "Discussion"} questions (${(result.report?.defense_questions || []).length})`}>
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
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {a}
                  </div>
                ))}
              </Accordion>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
