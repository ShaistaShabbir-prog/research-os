"use client";
import { useState } from "react";
import { Search, Loader2, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

const DEMO_TEXT = `# Acoustic Chatter Detection with LightGBM

## Abstract
We propose a lightweight model that achieves 91.4% F1-score on the benchmark.
We are the first system to combine explainability and embedded deployment in a single pipeline.
Unlike prior approaches, our method outperforms all baselines on every metric.

## Method
We train LightGBM with learning rate 0.05, 300 estimators, random seed 42.

## Experiments
Table 1 shows 91.4% F1 vs 88.9% for baseline. Statistical significance: p < 0.05.
Figure 2 shows inference at 48ms. Ablation confirms temporal features add 4.3% F1.

## References
1. Smith et al. (2023). Deep chatter. IJMT.
2. Jones (2022). SVM milling. doi:10.000`;

interface Claim {
  claim_text: string; section: string; claim_type: string;
  has_overclaim_language: boolean; support_score: number;
  verdict: "supported" | "unsupported"; evidence: Array<{ evidence_text: string; evidence_type: string; section: string }>;
  suggested_action?: string;
}
interface CVResult {
  claim_count: number; supported_count: number; unsupported_count: number;
  support_rate: number; claims: Claim[]; unsupported_claims: Claim[];
  ethics: string[]; human_verification_required: boolean;
}

function ScoreBar({ value, max = 1 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 65 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: color, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 36 }}>{pct}%</span>
    </div>
  );
}

function ClaimCard({ claim, idx }: { claim: Claim; idx: number }) {
  const [open, setOpen] = useState(false);
  const supported = claim.verdict === "supported";
  return (
    <div style={{ border: `1px solid ${supported ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,0.03)" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: supported ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: supported ? "#4ade80" : "#f87171" }}>
          {supported ? "✓ Supported" : "⚠ Unsupported"}
        </span>
        {claim.has_overclaim_language && (
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}>overclaim</span>
        )}
        <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 20, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>{claim.claim_type}</span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{claim.claim_text.slice(0, 80)}…</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 80 }}><ScoreBar value={claim.support_score} /></div>
          {open ? <ChevronUp style={{ width: 14, color: "rgba(255,255,255,0.4)" }} /> : <ChevronDown style={{ width: 14, color: "rgba(255,255,255,0.4)" }} />}
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: "10px 0 8px" }}>{claim.claim_text}</p>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Section: {claim.section}</div>
          {claim.evidence?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Evidence found</div>
              {claim.evidence.slice(0, 2).map((ev, i) => (
                <div key={i} style={{ padding: "7px 10px", borderRadius: 8, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, fontFamily: "monospace" }}>
                  [{ev.evidence_type}] {ev.evidence_text.slice(0, 200)}
                </div>
              ))}
            </div>
          )}
          {claim.suggested_action && (
            <div style={{ fontSize: 12, color: "#a78bfa" }}>→ {claim.suggested_action}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClaimVerificationPage() {
  const [text, setText] = useState(DEMO_TEXT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CVResult | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const analyze = async () => {
    if (!text.trim()) { setError("Paste paper text first."); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API_BASE}/api/claim-verification/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_text: text }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.detail || "API error"); }
      setResult(await r.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const card: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 };

  return (
    <main style={{ minHeight: "100vh", padding: "32px 16px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a78bfa", marginBottom: 6 }}>ResearchOS · Phase 2</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0 }}>Claim Verification Engine</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>Extract claims · Find evidence · Score support · Flag unsupported assertions. Human verification required.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
          <div style={card}>
            <textarea value={text} onChange={e => setText(e.target.value)} style={{ width: "100%", minHeight: 320, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 14, color: "#f1f5f9", fontSize: 12, lineHeight: 1.6, fontFamily: "monospace", outline: "none", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setText(DEMO_TEXT)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>Load demo</button>
              <button onClick={analyze} disabled={loading} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: loading ? "#4c1d95" : "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                {loading ? <><Loader2 style={{ width: 14, animation: "spin 1s linear infinite" }} />Analyzing…</> : <><Search style={{ width: 14 }} />Verify claims</>}
              </button>
            </div>
            {error && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#fca5a5" }}>{error}</div>}
          </div>
          <div style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <ShieldCheck style={{ width: 15, color: "#4ade80" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Ethics</span>
            </div>
            {["Claim verification is heuristic — human judgment required.", "An 'unsupported' flag does not mean a claim is false.", "Always verify findings against the original paper."].map((w, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "9px 12px", borderRadius: 9, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                <AlertTriangle style={{ width: 12, color: "#fbbf24", flexShrink: 0, marginTop: 2 }} />{w}
              </div>
            ))}
          </div>
        </div>

        {result && (
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Summary */}
            <div style={{ ...card, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {[
                { label: "Total claims", val: result.claim_count, color: "#fff" },
                { label: "Supported", val: result.supported_count, color: "#4ade80" },
                { label: "Unsupported", val: result.unsupported_count, color: "#f87171" },
                { label: "Support rate", val: `${Math.round(result.support_rate * 100)}%`, color: result.support_rate >= 0.6 ? "#4ade80" : "#f87171" },
              ].map(s => (
                <div key={s.label} style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Claims */}
            <div style={card}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 12 }}>All Claims ({result.claims.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {result.claims.map((c, i) => <ClaimCard key={i} claim={c} idx={i} />)}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
