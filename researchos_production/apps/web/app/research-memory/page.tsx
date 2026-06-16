"use client";
import { useState, useRef, useEffect } from "react";
import { BookOpen, Loader2, Download, Plus, Trash2, GitMerge } from "lucide-react";

const PAPER_A = `# Acoustic Chatter Detection with LightGBM
## Abstract
We propose a lightweight LightGBM pipeline for chatter detection. We are the first to combine SHAP explanations with embedded deployment at 48ms latency.
## Method
LightGBM with SHAP. Dataset from DMG MORI machine. Random seed 42.
## References
1. Smith et al. (2023)
2. Jones (2022)
3. Brown (2021)`;

const PAPER_B = `# Deep Chatter Detection with ResNet
## Abstract
This paper presents ResNet-34 for chatter detection achieving 94% accuracy. Our contribution is a large-scale CNC dataset with 10,000 labelled cycles.
## Method
ResNet-34 on GPU. 420ms inference.
## References
1. Smith et al. (2023)
2. Chen (2024)
4. Lee (2020)`;

const PAPER_C = `# Transformer-Based Machining Stability
## Abstract
We introduce a transformer model for machining stability prediction. This work contributes multi-modal sensor fusion combining acoustic and vibration signals achieving 93% F1.
## Method
Transformer with attention.
## References
2. Chen (2024)
5. Wang (2021)
6. Kim (2022)`;

interface Paper { id: string; text: string }
interface RMResult {
  paper_count: number;
  papers: Array<{ id: string; title: string }>;
  summary: Array<{ id: string; title: string; contribution_count: number; citation_count: number; concept_count: number; has_first_claim: boolean }>;
  novelty_overlap: { pairs: Array<{ paper_a: string; paper_b: string; similarity: number; shared_concepts: string[]; unique_to_a: string[]; unique_to_b: string[]; overlap_label: string }>; concept_sets: Record<string, string[]>; most_similar: any; least_similar: any };
  citation_overlap: { pairs: Array<{ paper_a: string; paper_b: string; similarity: number; shared_citations: string[]; shared_count: number; unique_to_a: number; unique_to_b: number; overlap_label: string }>; citation_counts: Record<string, number>; shared_by_all: string[]; shared_by_all_count: number };
  contribution_overlap: { comparison: Array<{ paper_id: string; contribution_count: number; has_first_claim: boolean; contributions: string[] }>; first_claims: Record<string, string[]>; overlap_warnings: string[] };
  exports: Record<string, string>;
  ethics: string[];
  human_verification_required: boolean;
}

function HeatCell({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  const bg = value >= 0.4 ? "rgba(239,68,68,0.25)" : value >= 0.2 ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.15)";
  const color = value >= 0.4 ? "#f87171" : value >= 0.2 ? "#fbbf24" : "#4ade80";
  return (
    <div style={{ padding: "14px 10px", borderRadius: 10, background: bg, textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{pct}%</div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>{label}</div>
    </div>
  );
}

function HeatMatrix({ pairs, paperIds }: { pairs: RMResult["novelty_overlap"]["pairs"]; paperIds: string[] }) {
  const getSim = (a: string, b: string) => {
    if (a === b) return 1;
    const p = pairs.find(p => (p.paper_a === a && p.paper_b === b) || (p.paper_a === b && p.paper_b === a));
    return p?.similarity ?? 0;
  };
  const pct = (v: number) => Math.round(v * 100);
  const color = (v: number) => v >= 0.4 ? "#f87171" : v >= 0.2 ? "#fbbf24" : v === 1 ? "#a78bfa" : "#4ade80";

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr>
          <th style={{ padding: "8px", color: "rgba(255,255,255,0.4)" }} />
          {paperIds.map(id => <th key={id} style={{ padding: "8px", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>{id}</th>)}
        </tr>
      </thead>
      <tbody>
        {paperIds.map(rowId => (
          <tr key={rowId}>
            <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>{rowId}</td>
            {paperIds.map(colId => {
              const v = getSim(rowId, colId);
              return (
                <td key={colId} style={{ padding: "8px" }}>
                  <div style={{ padding: "10px", borderRadius: 8, background: v === 1 ? "rgba(139,92,246,0.15)" : v >= 0.4 ? "rgba(239,68,68,0.15)" : v >= 0.15 ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.1)", textAlign: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: color(v) }}>{v === 1 ? "—" : `${pct(v)}%`}</span>
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function download(filename: string, content: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
  a.download = filename; a.click();
}

export default function ResearchMemoryPage() {
  const [papers, setPapers] = useState<Paper[]>([
    { id: "Paper A", text: PAPER_A },
    { id: "Paper B", text: PAPER_B },
    { id: "Paper C", text: PAPER_C },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [result, setResult]   = useState<RMResult | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const addPaper = () => setPapers(p => [...p, { id: `Paper ${String.fromCharCode(65 + p.length)}`, text: "" }]);
  const removePaper = (i: number) => setPapers(p => p.filter((_, j) => j !== i));
  const updatePaper = (i: number, field: keyof Paper, value: string) =>
    setPapers(p => p.map((paper, j) => j === i ? { ...paper, [field]: value } : paper));

  const compare = async () => {
    if (papers.length < 2) { setError("Add at least 2 papers."); return; }
    if (papers.some(p => !p.text.trim())) { setError("All papers must have text."); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API_BASE}/api/research-memory/compare`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ papers }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.detail || "API error"); }
      setResult(await r.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const card: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 };

  return (
    <main style={{ minHeight: "100vh", padding: "32px 16px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a78bfa", marginBottom: 6 }}>ResearchOS · Phase 4</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0 }}>Research Memory</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>Compare 2–10 papers for novelty overlap, citation overlap, and contribution diff. Human verification required for all findings.</p>
        </div>

        {/* Paper inputs */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(papers.length, 3)}, 1fr)`, gap: 12, marginBottom: 16 }}>
          {papers.map((p, i) => (
            <div key={i} style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <input value={p.id} onChange={e => updatePaper(i, "id", e.target.value)}
                  style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "5px 10px", color: "#fff", fontSize: 12, fontWeight: 700, outline: "none" }} />
                {papers.length > 2 && (
                  <button onClick={() => removePaper(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
                    <Trash2 style={{ width: 14 }} />
                  </button>
                )}
              </div>
              <textarea value={p.text} onChange={e => updatePaper(i, "text", e.target.value)}
                placeholder="Paste paper text, Markdown, or LaTeX…"
                style={{ width: "100%", minHeight: 200, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, padding: 12, color: "#f1f5f9", fontSize: 11, lineHeight: 1.6, fontFamily: "monospace", outline: "none", resize: "vertical" }} />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {papers.length < 10 && (
            <button onClick={addPaper} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Plus style={{ width: 13 }} />Add paper
            </button>
          )}
          <button onClick={() => { setPapers([{ id: "Paper A", text: PAPER_A }, { id: "Paper B", text: PAPER_B }, { id: "Paper C", text: PAPER_C }]); setResult(null); }}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>
            Reset demo
          </button>
          <button onClick={compare} disabled={loading}
            style={{ marginLeft: "auto", padding: "8px 24px", borderRadius: 8, border: "none", background: loading ? "#4c1d95" : "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7 }}>
            {loading ? <><Loader2 style={{ width: 14, animation: "spin 1s linear infinite" }} />Comparing…</> : <><GitMerge style={{ width: 14 }} />Compare papers</>}
          </button>
        </div>
        {error && <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#fca5a5" }}>{error}</div>}

        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Summary row */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${result.summary.length}, 1fr)`, gap: 12 }}>
              {result.summary.map(s => (
                <div key={s.id} style={{ ...card, textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 10 }}>{s.id}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 12, height: 32, overflow: "hidden" }}>{s.title}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    {[{ label: "Contributions", val: s.contribution_count }, { label: "Citations", val: s.citation_count }, { label: "Concepts", val: s.concept_count }].map(m => (
                      <div key={m.label} style={{ padding: "8px 4px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{m.val}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                  {s.has_first_claim && <div style={{ marginTop: 8, fontSize: 11, color: "#fbbf24" }}>⚠ Claims to be first</div>}
                </div>
              ))}
            </div>

            {/* Novelty heatmap */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <BookOpen style={{ width: 16, color: "#a78bfa" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Novelty Overlap Heatmap</span>
                <div style={{ display: "flex", gap: 8, marginLeft: "auto", fontSize: 11 }}>
                  {[{ color: "#4ade80", label: "Low (<20%)" }, { color: "#fbbf24", label: "Moderate (20–40%)" }, { color: "#f87171", label: "High (>40%)" }].map(l => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.45)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />{l.label}
                    </div>
                  ))}
                </div>
              </div>
              <HeatMatrix pairs={result.novelty_overlap.pairs} paperIds={result.papers.map(p => p.id)} />
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {result.novelty_overlap.pairs.map((pair, i) => (
                  <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 12 }}>
                    <span style={{ color: "#fff", fontWeight: 700 }}>{pair.paper_a} ↔ {pair.paper_b}</span>
                    <span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>{pair.overlap_label}</span>
                    {pair.shared_concepts.length > 0 && (
                      <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {pair.shared_concepts.slice(0, 8).map((c, j) => (
                          <span key={j} style={{ padding: "1px 7px", borderRadius: 20, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", fontSize: 11, color: "#a78bfa" }}>{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Citation overlap */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <GitMerge style={{ width: 16, color: "#3b82f6" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Citation Overlap</span>
                {result.citation_overlap.shared_by_all_count > 0 && (
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
                    {result.citation_overlap.shared_by_all_count} shared by all
                  </span>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
                {result.citation_overlap.pairs.map((pair, i) => (
                  <HeatCell key={i} value={pair.similarity} label={`${pair.paper_a} ↔ ${pair.paper_b}`} />
                ))}
              </div>
              {result.citation_overlap.shared_by_all.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Cited by all papers</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {result.citation_overlap.shared_by_all.map((c, i) => (
                      <span key={i} style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)", fontSize: 11, color: "#60a5fa" }}>{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contribution diff */}
            <div style={card}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 14 }}>📐 Contribution Comparison</div>
              {result.contribution_overlap.overlap_warnings.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  {result.contribution_overlap.overlap_warnings.map((w, i) => (
                    <div key={i} style={{ padding: "9px 12px", borderRadius: 9, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 12, color: "#fcd34d", marginBottom: 6 }}>⚠ {w}</div>
                  ))}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${result.contribution_overlap.comparison.length}, 1fr)`, gap: 12 }}>
                {result.contribution_overlap.comparison.map(c => (
                  <div key={c.paper_id}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{c.paper_id}</div>
                    {c.contributions.length === 0
                      ? <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>No explicit contributions found.</div>
                      : c.contributions.map((contrib, i) => (
                        <div key={i} style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, marginBottom: 6 }}>
                          {contrib.slice(0, 180)}
                        </div>
                      ))
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* Export */}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => download("research_memory.json", result.exports["research_memory.json"])}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Download style={{ width: 13 }} />Export JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
