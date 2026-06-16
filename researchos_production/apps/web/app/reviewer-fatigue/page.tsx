"use client";
import { useState } from "react";
import { Users, Loader2, AlertTriangle, CheckCircle, Download, ShieldCheck, BarChart2 } from "lucide-react";

const DEMO_REVIEWS = [
  { reviewer_id: "R1", summary: "Strong reproducibility story. Dataset release is the key contribution. Latency advantage compelling but hardware spec missing.", strengths: ["excellent reproducibility", "dataset release", "SHAP explanations", "five-baseline comparison"], weaknesses: ["single machine dataset", "no statistical significance test", "hardware spec missing"], recommendation: "weak accept" },
  { reviewer_id: "R2", summary: "Good engineering contribution. Novelty claim in abstract is overstated. No concept-drift discussion.", strengths: ["five-baseline comparison", "dataset release", "clear limitation section"], weaknesses: ["novelty claim overstated", "no concept-drift analysis", "SHAP not validated with engineers"], recommendation: "borderline" },
  { reviewer_id: "R3", summary: "Embedded deployment claim unvalidated. Hardware spec missing. Safety fail-safe not discussed.", strengths: ["latency focus is novel", "realistic operating conditions"], weaknesses: ["hardware spec missing", "no fail-safe discussion", "no power consumption data"], recommendation: "weak reject" },
];

const REC_COLOR: Record<string, string> = {
  "accept": "#4ade80", "strong accept": "#22c55e",
  "weak accept": "#86efac", "borderline": "#fbbf24",
  "weak reject": "#f97316", "reject": "#f87171", "strong reject": "#ef4444",
};

interface ReviewerFatigueResult {
  reviewer_summaries: Array<{ reviewer_id: string; recommendation: string; sentiment: string; top_strength: string; top_weakness: string; strength_count: number; weakness_count: number; dimension_coverage: Record<string, string>; one_line: string }>;
  disagreement_matrix: { matrix: Record<string, Record<string, string>>; disagreements: Array<{ dimension: string; stances: Record<string, string>; severity: string }>; disagreement_count: number; recommendation_spread: number; recommendation_spread_label: string; reviewer_ids: string[]; dimensions: string[] };
  ac_briefing: { reviewer_count: number; recommendation_distribution: Record<string, number>; suggested_decision: string; consensus_strengths: string[]; consensus_weaknesses: string[]; key_disagreements: Array<{ dimension: string; stances: Record<string, string> }>; action_items: string[]; average_rec_score: number; human_verification_required: boolean };
  meta_review_draft: string;
  exports: Record<string, string>;
  ethics: string[];
  human_verification_required: boolean;
}

function download(filename: string, content: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
  a.download = filename; a.click();
}

const STANCE_COLOR: Record<string, string> = { raised: "#f87171", praised: "#4ade80", not_mentioned: "rgba(255,255,255,0.2)" };
const STANCE_LABEL: Record<string, string> = { raised: "⚠ raised", praised: "✓ praised", not_mentioned: "–" };

export default function ReviewerFatiguePage() {
  const [reviews, setReviews]   = useState(JSON.stringify(DEMO_REVIEWS, null, 2));
  const [docText, setDocText]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [result, setResult]     = useState<ReviewerFatigueResult | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const analyze = async () => {
    let parsed;
    try { parsed = JSON.parse(reviews); } catch { setError("Reviews must be valid JSON."); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API_BASE}/api/reviewer-fatigue/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_text: docText, reviews: parsed }),
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
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a78bfa", marginBottom: 6 }}>ResearchOS · Phase 3</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0 }}>Reviewer Fatigue Assistant</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>Summarise reviews · Disagreement matrix · AC briefing · Meta-review draft. Solves the ARR review overload problem.</p>
        </div>

        {/* Input */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Reviews JSON (array)</div>
            <textarea value={reviews} onChange={e => setReviews(e.target.value)}
              style={{ width: "100%", minHeight: 260, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 12, color: "#f1f5f9", fontSize: 11, lineHeight: 1.6, fontFamily: "monospace", outline: "none", resize: "vertical" }} />
          </div>
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Paper abstract (optional)</div>
            <textarea value={docText} onChange={e => setDocText(e.target.value)}
              placeholder="Paste abstract or introduction for context…"
              style={{ width: "100%", minHeight: 200, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 12, color: "#f1f5f9", fontSize: 12, lineHeight: 1.6, outline: "none", resize: "vertical" }} />
            <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setReviews(JSON.stringify(DEMO_REVIEWS, null, 2)); setDocText(""); }}
                style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>Load demo</button>
              <button onClick={analyze} disabled={loading}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: loading ? "#4c1d95" : "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                {loading ? <><Loader2 style={{ width: 14, animation: "spin 1s linear infinite" }} />Analysing…</> : <><Users style={{ width: 14 }} />Run assistant</>}
              </button>
            </div>
            {error && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#fca5a5" }}>{error}</div>}
          </div>
        </div>

        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Reviewer summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${result.reviewer_summaries.length}, 1fr)`, gap: 12 }}>
              {result.reviewer_summaries.map(s => (
                <div key={s.reviewer_id} style={{ ...card, borderTop: `3px solid ${REC_COLOR[s.recommendation] || "#94a3b8"}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{s.reviewer_id}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${REC_COLOR[s.recommendation] || "#94a3b8"}20`, color: REC_COLOR[s.recommendation] || "#94a3b8" }}>{s.recommendation}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 10, lineHeight: 1.6 }}>{s.one_line.slice(s.reviewer_id.length + 20, 180)}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                      <div style={{ fontSize: 10, color: "#4ade80", fontWeight: 700, marginBottom: 3 }}>TOP STRENGTH</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{s.top_strength}</div>
                    </div>
                    <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                      <div style={{ fontSize: 10, color: "#f87171", fontWeight: 700, marginBottom: 3 }}>TOP WEAKNESS</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{s.top_weakness}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Disagreement matrix */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <BarChart2 style={{ width: 16, color: "#a78bfa" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Disagreement Matrix</span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: `${result.disagreement_matrix.disagreement_count > 0 ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)"}`, color: result.disagreement_matrix.disagreement_count > 0 ? "#f87171" : "#4ade80" }}>
                  {result.disagreement_matrix.disagreement_count} disagreements · {result.disagreement_matrix.recommendation_spread_label}
                </span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Dimension</th>
                      {result.disagreement_matrix.reviewer_ids.map(rid => (
                        <th key={rid} style={{ padding: "8px 12px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{rid}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.disagreement_matrix.matrix).map(([dim, row]) => {
                      const stances = Object.values(row).filter(s => s !== "not_mentioned");
                      const hasDisagreement = stances.length > 1 && new Set(stances).size > 1;
                      return (
                        <tr key={dim} style={{ background: hasDisagreement ? "rgba(239,68,68,0.05)" : "transparent" }}>
                          <td style={{ padding: "9px 12px", color: "rgba(255,255,255,0.7)", borderBottom: "1px solid rgba(255,255,255,0.05)", fontWeight: hasDisagreement ? 700 : 400 }}>
                            {hasDisagreement && "⚠ "}{dim.replaceAll("_", " ")}
                          </td>
                          {result.disagreement_matrix.reviewer_ids.map(rid => (
                            <td key={rid} style={{ padding: "9px 12px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 20, background: `${STANCE_COLOR[row[rid]] || "rgba(255,255,255,0.1)"}20`, color: STANCE_COLOR[row[rid]] || "rgba(255,255,255,0.3)" }}>
                                {STANCE_LABEL[row[rid]] || "–"}
                              </span>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AC Briefing */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ ...card, borderLeft: "3px solid #7c3aed" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>📋 AC Briefing</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: result.ac_briefing.suggested_decision.includes("Accept") ? "#4ade80" : result.ac_briefing.suggested_decision.includes("Borderline") ? "#fbbf24" : "#f87171", marginBottom: 4 }}>
                  {result.ac_briefing.suggested_decision}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>avg score {result.ac_briefing.average_rec_score}/5 · human verification required</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Action items</div>
                {result.ac_briefing.action_items.map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", padding: "6px 10px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 5 }}>→ {item}</div>
                ))}
              </div>
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>Consensus</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Strengths</div>
                {result.ac_briefing.consensus_strengths.length > 0
                  ? result.ac_briefing.consensus_strengths.map((s, i) => <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 4 }}>✓ {s}</div>)
                  : <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No consensus strengths identified.</div>
                }
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, marginTop: 12 }}>Weaknesses</div>
                {result.ac_briefing.consensus_weaknesses.length > 0
                  ? result.ac_briefing.consensus_weaknesses.map((w, i) => <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 4 }}>⚠ {w}</div>)
                  : <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No consensus weaknesses identified.</div>
                }
              </div>
            </div>

            {/* Meta-review draft */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>📝 Meta-Review Draft</div>
                <button onClick={() => download("meta_review_draft.md", result.meta_review_draft)}
                  style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <Download style={{ width: 13 }} />Export Markdown
                </button>
              </div>
              <pre style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word", background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 16, margin: 0, maxHeight: 400, overflowY: "auto" }}>
                {result.meta_review_draft}
              </pre>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
