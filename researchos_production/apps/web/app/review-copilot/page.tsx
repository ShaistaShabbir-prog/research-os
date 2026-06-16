"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  AlertTriangle, BookOpen, CheckCircle, Clipboard, ClipboardCheck,
  ChevronDown, ChevronUp, Download, FileText, GitBranch, Loader2,
  Scale, Search, ShieldCheck, Upload, TrendingUp, Users, Zap,
  AlertCircle, Info, BarChart2, Network, FileCheck,
} from "lucide-react";
import { apiClient, type ReviewCopilotFinding, type ReviewCopilotResponse } from "@/lib/api";

// ── Demo data ──────────────────────────────────────────────────────────────
const DEMO_TEXT = `# Acoustic-Based Chatter Detection in CNC Milling Using Lightweight Explainable Models

## Abstract
We propose a lightweight, explainable machine learning pipeline for real-time chatter detection in CNC milling using acoustic emission signals. Unlike prior deep-learning approaches that require GPU inference, our method achieves 91.4% F1-score using a gradient-boosted tree with SHAP explanations, running on embedded hardware at 48ms latency. We are the first to combine reproducibility, explainability, and embedded-deployment constraints. We release a reproducible benchmark dataset of 2,400 labelled milling cycles. Random seed: 42. Code available on GitHub.

## Introduction
Machining instability causes surface defects and tool wear. We address three gaps: reproducibility, explainability, and latency. Prior work [Smith et al., 2023] uses ResNet-34 at 420ms—infeasible for closed-loop control.

## Related Work
Smith et al. [2023] use ResNet-34 achieving 94% accuracy at 420ms. Jones & Lee [2022] apply SVM; dataset not released. Brown [2021] proposes 1-D CNN but omits learning-rate schedules.

## Dataset
We collected AE signals from a DMG MORI DMU 50. Sampling rate: 500 kHz. Random seed for all splits: 42. Dataset DOI: doi:10.5281/zenodo.DEMO.

## Method
LightGBM with learning rate 0.05, 300 estimators, random_state=42, batch size 16. SHAP TreeExplainer for feature attributions.

## Experiments
Baselines: threshold (71.2%), SVM (83.6%), 1-D CNN (88.9%), ResNet-34 (94.1%), Transformer (93.4%). Our method: F1 91.4%, 48ms latency, 5-fold CV: 91.4 ± 1.2%.

## Conclusion
Reproducible, explainable, embedded-deployable chatter detection achieving 91.4% F1 at 48ms latency.

## References
1. Smith, A. et al. (2023). Deep chatter detection. Int. J. Mach. Tools, 185.
2. Jones, D., Lee, E. (2022). SVM milling stability. Mech. Syst. Signal Process.
3. Brown, F. (2021). 1-D CNN for AE. J. Manuf. Sci. Eng.
4. Chen, G. et al. (2024). Transformer chatter. Rob. Comput.-Integr. Manuf.
5. Ke, G. et al. (2017). LightGBM. NeurIPS.`;

const DEMO_REVIEWS = [
  {
    reviewer_id: "R1",
    summary: "Strong reproducibility story. Dataset release is the key contribution. Latency advantage is compelling but hardware spec is missing.",
    strengths: ["excellent reproducibility", "dataset release", "SHAP explanations", "five-baseline comparison"],
    weaknesses: ["single machine dataset", "no statistical significance test", "hardware spec missing for latency"],
    recommendation: "weak accept",
  },
  {
    reviewer_id: "R2",
    summary: "Good engineering contribution. Novelty claim in abstract is overstated. No concept-drift discussion.",
    strengths: ["five-baseline comparison", "dataset release", "clear limitation section"],
    weaknesses: ["novelty claim overstated", "no concept-drift analysis", "SHAP not validated with engineers"],
    recommendation: "borderline",
  },
  {
    reviewer_id: "R3",
    summary: "Embedded deployment claim unvalidated. Hardware spec missing. Safety fail-safe not discussed.",
    strengths: ["latency focus is novel", "realistic operating conditions"],
    weaknesses: ["hardware spec missing", "no fail-safe discussion", "no power consumption data"],
    recommendation: "weak reject",
  },
];

const MAX_INPUT_CHARS = 200_000;

// ── Utilities ──────────────────────────────────────────────────────────────
function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], {
    type: filename.endsWith(".json") ? "application/json" : "text/plain",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildACReport(result: ReviewCopilotResponse): string {
  const now = new Date().toISOString().slice(0, 10);
  const scores = deriveScores(result);
  const top5 = getTop5Issues(result);

  return `# Area Chair Report — Review Copilot\n**Generated:** ${now}  \n**Tool:** ResearchOS Review Copilot (human verification required)\n\n---\n\n## Executive Scores\n\n| Dimension | Score |\n|---|---|\n| Research Quality | ${scores.quality}/100 |\n| Novelty | ${scores.novelty}/100 |\n| Reproducibility | ${scores.reproducibility}/100 |\n| Citation Coverage | ${scores.citation}/100 |\n| Review Risk | ${scores.risk}/100 |\n\n---\n\n## Paper\n**Title:** ${result.paper.title}\n\n${result.paper.abstract}\n\n---\n\n## Top 5 Issues\n\n${top5.map((f, i) => `### ${i + 1}. ${f.title}\n- **Severity:** ${f.severity}\n- **Section:** ${f.section_reference}\n- **Suggested action:** ${f.suggested_action}\n`).join("\n")}\n\n---\n\n## Reviewer Consensus\n\n${result.meta_review?.balanced_meta_review || "Meta-review not available."}\n\n---\n\n## Reproducibility Checklist\n\n${Object.entries(result.reproducibility_audit)
    .filter(([, v]) => typeof v === "boolean")
    .map(([k, v]) => `- [${v ? "x" : " "}] ${k.replaceAll("_", " ")}`)
    .join("\n")}\n\n---\n\n## Ethics\n\n${result.ethics.map(w => `> ⚠️ ${w}`).join("\n")}\n\n---\n*This report was generated by an automated assistant. All findings require human verification.*\n`;
}

// ── Score derivation (heuristic, frontend-only) ────────────────────────────
function deriveScores(result: ReviewCopilotResponse) {
  const allFindings: ReviewCopilotFinding[] = [
    ...(result.claim_audit?.findings || []),
    ...(result.citation_audit?.findings || []),
    ...(result.reproducibility_audit?.findings || []),
  ];

  const highCount = allFindings.filter(f => f.severity === "high").length;
  const medCount  = allFindings.filter(f => f.severity === "medium").length;
  const penalty   = highCount * 12 + medCount * 5;

  const reproItems = Object.entries(result.reproducibility_audit)
    .filter(([, v]) => typeof v === "boolean");
  const reproPass = reproItems.filter(([, v]) => v).length;
  const reproScore = reproItems.length > 0
    ? Math.round((reproPass / reproItems.length) * 100)
    : 50;

  const refCount = result.paper.references.length;
  const citationScore = Math.min(100, refCount * 8);

  const noveltyFindings = allFindings.filter(f =>
    f.category.includes("claim") || f.category.includes("novel"));
  const noveltyScore = Math.max(20, 85 - noveltyFindings.length * 15);

  const quality = Math.max(10, Math.min(100, 78 - penalty));
  const risk    = Math.min(100, highCount * 20 + medCount * 8);

  return {
    quality,
    novelty:       noveltyScore,
    reproducibility: reproScore,
    citation:      citationScore,
    risk,
  };
}

function getTop5Issues(result: ReviewCopilotResponse): ReviewCopilotFinding[] {
  const all: ReviewCopilotFinding[] = [
    ...(result.claim_audit?.findings || []),
    ...(result.citation_audit?.findings || []),
    ...(result.reproducibility_audit?.findings || []),
    ...(Object.values(result.reviewer_analysis || {})
      .filter(Array.isArray)
      .flat() as ReviewCopilotFinding[]),
  ];

  const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return all
    .sort((a, b) => (order[a.severity] ?? 1) - (order[b.severity] ?? 1))
    .slice(0, 5);
}

// ── Sub-components ─────────────────────────────────────────────────────────

/** Circular score ring */
function ScoreRing({
  value, label, color, size = 80,
}: { value: number; label: string; color: string; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth={size * 0.1} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={size * 0.1}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }} />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          className="rotate-90 origin-center"
          style={{ fill: "#fff", fontSize: size * 0.22, fontWeight: 700, rotate: "90deg" }}
          transform={`rotate(90, ${size / 2}, ${size / 2})`}>
          {value}
        </text>
      </svg>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.3, maxWidth: size }}>
        {label}
      </span>
    </div>
  );
}

/** Mini horizontal bar */
function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${value}%`, borderRadius: 4,
        background: color, transition: "width 0.8s ease",
      }} />
    </div>
  );
}

/** Severity badge */
function SevBadge({ severity }: { severity: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    high:   { bg: "rgba(239,68,68,0.15)",   text: "#f87171", label: "High" },
    medium: { bg: "rgba(245,158,11,0.15)",  text: "#fbbf24", label: "Med" },
    low:    { bg: "rgba(34,197,94,0.15)",   text: "#4ade80", label: "Low" },
  };
  const s = map[severity] || map.medium;
  return (
    <span style={{
      padding: "1px 7px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.text,
    }}>
      {s.label}
    </span>
  );
}

/** Collapsible finding card */
function FindingCard({ finding, defaultOpen = false }: {
  finding: ReviewCopilotFinding; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12, overflow: "hidden",
      background: "rgba(255,255,255,0.03)",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <SevBadge severity={finding.severity} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>
            {finding.title}
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: "auto", marginRight: 8 }}>
            {finding.section_reference}
          </span>
        </div>
        {open
          ? <ChevronUp style={{ width: 15, color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
          : <ChevronDown style={{ width: 15, color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
        }
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: "10px 0 8px" }}>
            {finding.description}
          </p>
          {finding.evidence_span?.text && (
            <div style={{
              background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "8px 12px",
              fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6,
              fontFamily: "monospace", marginBottom: 8,
            }}>
              {finding.evidence_span.text}
            </div>
          )}
          <div style={{ fontSize: 12, color: "#a78bfa" }}>
            → {finding.suggested_action}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>
            Confidence: {Math.round((finding.confidence || 0) * 100)}% · Human verification required
          </div>
        </div>
      )}
    </div>
  );
}

/** Knowledge graph canvas */
function KGraphCanvas({ nodes, edges }: {
  nodes: Array<Record<string, any>>;
  edges: Array<Record<string, any>>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodes.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Layout: simple force-like positions using deterministic spiral
    const positions: Record<string, { x: number; y: number }> = {};
    const cx = W / 2, cy = H / 2;

    nodes.forEach((n, i) => {
      if (i === 0) { positions[n.id || n.label || i] = { x: cx, y: cy }; return; }
      const angle = (i / nodes.length) * Math.PI * 2;
      const r = Math.min(W, H) * 0.35;
      positions[n.id || n.label || i] = {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
      };
    });

    // Color by node type
    const nodeColors: Record<string, string> = {
      Method: "#8b5cf6", Dataset: "#3b82f6", Model: "#10b981",
      Result: "#f59e0b", Concept: "#ec4899",
    };

    // Draw edges
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    edges.forEach(e => {
      const s = positions[e.source];
      const t = positions[e.target];
      if (!s || !t) return;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();

      // Edge label
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "9px Inter, system-ui";
      ctx.fillText(e.relation || "", (s.x + t.x) / 2, (s.y + t.y) / 2);
    });

    // Draw nodes
    nodes.forEach((n, i) => {
      const id = n.id || n.label || i;
      const pos = positions[id];
      if (!pos) return;
      const color = nodeColors[n.label] || "#6366f1";

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = color + "30";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Node label
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "bold 10px Inter, system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const name = (n.name || n.label || id).slice(0, 12);
      ctx.fillText(name, pos.x, pos.y);

      // Type label below
      ctx.fillStyle = color;
      ctx.font = "8px Inter, system-ui";
      ctx.fillText(n.label || "", pos.x, pos.y + 28);
    });
  }, [nodes, edges]);

  return (
    <canvas
      ref={canvasRef}
      width={680}
      height={340}
      style={{ width: "100%", borderRadius: 12, background: "rgba(0,0,0,0.3)" }}
    />
  );
}

/** Reproducibility checklist grid */
function ReproGrid({ audit }: { audit: Record<string, any> }) {
  const items = Object.entries(audit).filter(([, v]) => typeof v === "boolean");
  const passed = items.filter(([, v]) => v).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          {passed} / {items.length} items met
        </span>
        <MiniBar value={Math.round((passed / items.length) * 100)} color="#10b981" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 8 }}>
        {items.map(([key, val]) => (
          <div key={key} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 12px", borderRadius: 10,
            background: val ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.06)",
            border: `1px solid ${val ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.15)"}`,
          }}>
            {val
              ? <CheckCircle style={{ width: 14, color: "#4ade80", flexShrink: 0 }} />
              : <AlertTriangle style={{ width: 14, color: "#fbbf24", flexShrink: 0 }} />
            }
            <span style={{ fontSize: 11, color: val ? "#86efac" : "#fde68a", lineHeight: 1.3 }}>
              {key.replaceAll("_", " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Reviewer consensus panel */
function ConsensusPanel({ meta }: { meta: Record<string, any> }) {
  const agreements   = (meta.agreement_points    || []) as ReviewCopilotFinding[];
  const disagreements = (meta.disagreement_points || []) as ReviewCopilotFinding[];
  const missing       = (meta.missing_discussion_points || []) as ReviewCopilotFinding[];

  const Section = ({ items, color, label, icon }: {
    items: ReviewCopilotFinding[]; color: string; label: string; icon: React.ReactNode;
  }) => (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label} ({items.length})
        </span>
      </div>
      {items.length === 0
        ? <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", padding: "8px 0" }}>None identified.</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map((item, i) => (
              <div key={i} style={{
                padding: "9px 12px", borderRadius: 9,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid rgba(255,255,255,0.07)`,
                fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5,
              }}>
                {item.title || item.description?.slice(0, 120) || JSON.stringify(item).slice(0, 80)}
              </div>
            ))}
          </div>
        )
      }
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
      <Section items={agreements} color="#4ade80" label="Agreements"
        icon={<CheckCircle style={{ width: 14, color: "#4ade80" }} />} />
      <Section items={disagreements} color="#f87171" label="Disagreements"
        icon={<AlertCircle style={{ width: 14, color: "#f87171" }} />} />
      <Section items={missing} color="#a78bfa" label="Missing discussion"
        icon={<Info style={{ width: 14, color: "#a78bfa" }} />} />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ReviewCopilotPage() {
  const [text, setText]       = useState(DEMO_TEXT);
  const [activeTab, setActiveTab] = useState<"input" | "dashboard" | "findings" | "consensus" | "graph" | "export">("input");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [result, setResult]   = useState<ReviewCopilotResponse | null>(null);
  const [copied, setCopied]   = useState("");

  const wordCount      = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const charsRemaining = MAX_INPUT_CHARS - text.length;

  const scores  = useMemo(() => result ? deriveScores(result) : null, [result]);
  const top5    = useMemo(() => result ? getTop5Issues(result) : [],  [result]);

  const allFindings: ReviewCopilotFinding[] = result
    ? [
        ...(result.claim_audit?.findings || []),
        ...(result.citation_audit?.findings || []),
        ...(result.reproducibility_audit?.findings || []),
        ...(Object.values(result.reviewer_analysis || {})
          .filter(Array.isArray)
          .flat() as ReviewCopilotFinding[]),
      ]
    : [];

  const handleAnalyze = async () => {
    if (!text.trim()) { setError("Please paste paper text or LaTeX source."); return; }
    if (text.length > MAX_INPUT_CHARS) { setError("Input too long."); return; }
    setLoading(true); setError("");
    try {
      const response = await apiClient.reviewCopilot({ document_text: text, reviews: DEMO_REVIEWS });
      setResult(response);
      setActiveTab("dashboard");
    } catch (err: any) {
      setError(err.message || "Review Copilot failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setText(await file.text());
  };

  const handleCopy = async (key: string) => {
    const c = result?.exports?.[key];
    if (!c) return;
    await navigator.clipboard.writeText(c);
    setCopied(key); setTimeout(() => setCopied(""), 1400);
  };

  const handleExportAC = () => {
    if (!result) return;
    downloadFile("ac_report.md", buildACReport(result));
  };

  // ── Styles (inline for portability) ─────────────────────────────────────
  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: 20,
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer",
    fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
    background: active ? "#7c3aed" : "rgba(255,255,255,0.05)",
    color: active ? "#fff" : "rgba(255,255,255,0.5)",
    transition: "all 0.15s",
  });

  const TABS_DEF = [
    { key: "input",     label: "📄 Paper Input",      disabled: false },
    { key: "dashboard", label: "📊 Executive Summary", disabled: !result },
    { key: "findings",  label: "🔍 All Findings",      disabled: !result },
    { key: "consensus", label: "🤝 Reviewer Consensus", disabled: !result },
    { key: "graph",     label: "🕸 Knowledge Graph",   disabled: !result },
    { key: "export",    label: "⬇ Export",             disabled: !result },
  ] as const;

  return (
    <main style={{ minHeight: "100vh", padding: "32px 16px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Scale style={{ width: 16, color: "#a78bfa" }} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#a78bfa" }}>
              ResearchOS · Review Copilot
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0 }}>
            Review Copilot
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 6, maxWidth: 580 }}>
            Executive-level research quality analysis for reviewers, area chairs, supervisors, and students.
            Surfaces critical issues first. Human verification required for all outputs.
          </p>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 20 }}>
          {TABS_DEF.map(tab => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setActiveTab(tab.key)}
              disabled={tab.disabled}
              style={{
                ...tabBtn(activeTab === tab.key),
                opacity: tab.disabled ? 0.35 : 1,
                cursor: tab.disabled ? "not-allowed" : "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════
            TAB: PAPER INPUT
        ════════════════════════════════════════════════ */}
        {activeTab === "input" && (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 320px" }}>
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                  Paper text, Markdown, or LaTeX source
                </span>
                <label style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: 12, color: "rgba(255,255,255,0.6)",
                }}>
                  <Upload style={{ width: 13 }} /> Upload
                  <input type="file" className="hidden" accept=".txt,.md,.tex" onChange={handleFile} style={{ display: "none" }} />
                </label>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                style={{
                  width: "100%", minHeight: 380, resize: "vertical",
                  background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, padding: 14, color: "#f1f5f9",
                  fontSize: 12, lineHeight: 1.6, fontFamily: "monospace",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                <span style={{ fontSize: 11, color: charsRemaining < 0 ? "#f87171" : "rgba(255,255,255,0.3)" }}>
                  {wordCount.toLocaleString()} words · {text.length.toLocaleString()} chars
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setText(DEMO_TEXT)}
                    style={{
                      padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
                      background: "transparent", color: "rgba(255,255,255,0.5)",
                      fontSize: 13, cursor: "pointer",
                    }}
                  >
                    Load demo
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    style={{
                      padding: "8px 20px", borderRadius: 8, border: "none",
                      background: loading ? "#4c1d95" : "#7c3aed",
                      color: "#fff", fontSize: 13, fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: 7,
                    }}
                  >
                    {loading
                      ? <><Loader2 style={{ width: 14, animation: "spin 1s linear infinite" }} /> Analyzing…</>
                      : <><Search style={{ width: 14 }} /> Analyze paper</>
                    }
                  </button>
                </div>
              </div>
              {error && (
                <div style={{
                  marginTop: 10, padding: "10px 14px", borderRadius: 8,
                  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                  fontSize: 12, color: "#fca5a5",
                }}>
                  {error}
                </div>
              )}
            </div>

            {/* Ethics sidebar */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <ShieldCheck style={{ width: 16, color: "#4ade80" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Ethics & Safety</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(result?.ethics || [
                  "This tool supports human review and must not be used as an automated decision system.",
                  "Do not submit AI-generated reviews without human verification.",
                  "Reviewer remains responsible for correctness, fairness, and confidentiality.",
                  "No paper content should be sent to external APIs unless explicitly configured.",
                ]).map((w, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 8, padding: "9px 12px", borderRadius: 9,
                    background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
                    fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.6,
                  }}>
                    <AlertTriangle style={{ width: 13, color: "#fbbf24", flexShrink: 0, marginTop: 2 }} />
                    {w}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: EXECUTIVE DASHBOARD
        ════════════════════════════════════════════════ */}
        {activeTab === "dashboard" && result && scores && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Score rings */}
            <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: 20, padding: 28 }}>
              <ScoreRing value={scores.quality}        label="Research Quality"  color="#8b5cf6" size={90} />
              <ScoreRing value={scores.novelty}        label="Novelty"           color="#3b82f6" size={90} />
              <ScoreRing value={scores.reproducibility} label="Reproducibility"  color="#10b981" size={90} />
              <ScoreRing value={scores.citation}       label="Citation Coverage"  color="#f59e0b" size={90} />
              <ScoreRing value={scores.risk}           label="Review Risk ↑"      color="#ef4444" size={90} />
            </div>

            {/* Paper overview + top issues 2-col */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* Paper overview */}
              <div style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <FileText style={{ width: 15, color: "#a78bfa" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Paper Overview</span>
                </div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 8, lineHeight: 1.4 }}>
                  {result.paper.title}
                </h2>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 14 }}>
                  {result.paper.abstract?.slice(0, 220)}{result.paper.abstract?.length > 220 ? "…" : ""}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Sections",       val: result.paper.sections.length },
                    { label: "References",      val: result.paper.references.length },
                    { label: "Figures/Tables",  val: result.paper.figures_tables.length },
                  ].map(s => (
                    <div key={s.label} style={{
                      padding: "10px 12px", borderRadius: 10,
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{s.val}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 5 issues */}
              <div style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Zap style={{ width: 15, color: "#f87171" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Top 5 Issues</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>
                    highest priority first
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {top5.length === 0
                    ? <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No high-priority issues found.</p>
                    : top5.map((f, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "9px 12px", borderRadius: 9,
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                      }}>
                        <span style={{
                          width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                          background: i === 0 ? "#ef4444" : i === 1 ? "#f59e0b" : "rgba(255,255,255,0.1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 800, color: "#fff",
                        }}>
                          {i + 1}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", marginBottom: 2 }}>
                            {f.title}
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                            {f.section_reference} · <SevBadge severity={f.severity} />
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            {/* Reproducibility summary */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <FileCheck style={{ width: 15, color: "#10b981" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Reproducibility Checklist</span>
              </div>
              <ReproGrid audit={result.reproducibility_audit} />
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: ALL FINDINGS
        ════════════════════════════════════════════════ */}
        {activeTab === "findings" && result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Summary bar */}
            {[
              { label: "Claim Audit",           findings: result.claim_audit?.findings || [],          color: "#8b5cf6" },
              { label: "Citation Audit",         findings: result.citation_audit?.findings || [],        color: "#f59e0b" },
              { label: "Reproducibility Audit",  findings: result.reproducibility_audit?.findings || [], color: "#10b981" },
              { label: "Reviewer Analysis",      findings: (Object.values(result.reviewer_analysis || {}).filter(Array.isArray).flat() as ReviewCopilotFinding[]), color: "#3b82f6" },
            ].map(section => (
              <div key={section.label} style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 3, height: 20, borderRadius: 2, background: section.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{section.label}</span>
                  <span style={{
                    padding: "1px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: `${section.color}20`, color: section.color,
                  }}>
                    {section.findings.length}
                  </span>
                </div>
                {section.findings.length === 0
                  ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#4ade80" }}>
                      <CheckCircle style={{ width: 14 }} />
                      No findings. Human verification still required.
                    </div>
                  )
                  : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {section.findings.map((f, i) => (
                        <FindingCard key={i} finding={f} defaultOpen={i === 0} />
                      ))}
                    </div>
                  )
                }
              </div>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: REVIEWER CONSENSUS
        ════════════════════════════════════════════════ */}
        {activeTab === "consensus" && result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Balanced meta-review */}
            <div style={{ ...card, borderLeft: "3px solid #a78bfa" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Users style={{ width: 15, color: "#a78bfa" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Balanced Meta-Review Draft</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>
                  requires human verification
                </span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.75 }}>
                {result.meta_review?.balanced_meta_review || "Meta-review not available."}
              </p>
            </div>

            {/* Consensus grid */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <BarChart2 style={{ width: 15, color: "#fff" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Reviewer Signals</span>
              </div>
              <ConsensusPanel meta={result.meta_review || {}} />
            </div>

            {/* AC clarification questions */}
            {result.meta_review?.author_clarification_questions?.length > 0 && (
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
                  📋 Author Clarification Questions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(result.meta_review.author_clarification_questions as ReviewCopilotFinding[]).map((q, i) => (
                    <FindingCard key={i} finding={q} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: KNOWLEDGE GRAPH
        ════════════════════════════════════════════════ */}
        {activeTab === "graph" && result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Network style={{ width: 15, color: "#a78bfa" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Research Knowledge Graph</span>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  {[
                    { color: "#8b5cf6", label: "Method" }, { color: "#3b82f6", label: "Dataset" },
                    { color: "#10b981", label: "Model" },  { color: "#f59e0b", label: "Result" },
                    { color: "#ec4899", label: "Concept" },
                  ].map(l => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>
              <KGraphCanvas nodes={result.knowledge_graph.nodes} edges={result.knowledge_graph.edges} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                <div style={{
                  padding: "12px 16px", borderRadius: 10,
                  background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <BookOpen style={{ width: 18, color: "#a78bfa" }} />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{result.knowledge_graph.nodes.length}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>nodes</div>
                  </div>
                </div>
                <div style={{
                  padding: "12px 16px", borderRadius: 10,
                  background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <GitBranch style={{ width: 18, color: "#60a5fa" }} />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{result.knowledge_graph.edges.length}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>edges</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => result.exports?.["research_kg.graphml"] && downloadFile("research_kg.graphml", result.exports["research_kg.graphml"])}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
                  color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <Download style={{ width: 13 }} /> Export GraphML
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: EXPORT
        ════════════════════════════════════════════════ */}
        {activeTab === "export" && result && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              {
                title: "AC Report (Markdown)",
                desc: "Executive summary, scores, top issues, reproducibility checklist, and meta-review draft. Formatted for area chair use.",
                icon: <FileText style={{ width: 20, color: "#a78bfa" }} />,
                action: handleExportAC,
                label: "Export AC Report",
                accent: "#7c3aed",
              },
              {
                title: "Review Analysis",
                desc: "Full structured review analysis with all findings, claim audit, citation audit, and reviewer analysis.",
                icon: <Clipboard style={{ width: 20, color: "#3b82f6" }} />,
                action: () => result.exports?.["review_analysis.md"] && downloadFile("review_analysis.md", result.exports["review_analysis.md"]),
                copyKey: "review_analysis.md",
                label: "Download Markdown",
                accent: "#3b82f6",
              },
              {
                title: "Structured JSON",
                desc: "Machine-readable output for integration with review management systems.",
                icon: <BarChart2 style={{ width: 20, color: "#10b981" }} />,
                action: () => result.exports?.["review_analysis.json"] && downloadFile("review_analysis.json", result.exports["review_analysis.json"]),
                label: "Download JSON",
                accent: "#10b981",
              },
              {
                title: "Reproducibility Checklist",
                desc: "Standalone checklist in Markdown format, suitable for author submission portals.",
                icon: <FileCheck style={{ width: 20, color: "#f59e0b" }} />,
                action: () => result.exports?.["reproducibility_checklist.md"] && downloadFile("reproducibility_checklist.md", result.exports["reproducibility_checklist.md"] || ""),
                label: "Download Checklist",
                accent: "#f59e0b",
              },
            ].map(item => (
              <div key={item.title} style={{
                ...card,
                borderTop: `3px solid ${item.accent}`,
                display: "flex", flexDirection: "column", gap: 12,
              }}>
                {item.icon}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 5 }}>{item.title}</div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{item.desc}</p>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  <button onClick={item.action} style={{
                    padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: item.accent, color: "#fff", fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <Download style={{ width: 13 }} /> {item.label}
                  </button>
                  {item.copyKey && (
                    <button onClick={() => handleCopy(item.copyKey!)} style={{
                      padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                      border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
                      color: "rgba(255,255,255,0.5)", fontSize: 12,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      {copied === item.copyKey
                        ? <><ClipboardCheck style={{ width: 13 }} /> Copied</>
                        : <><Clipboard style={{ width: 13 }} /> Copy</>
                      }
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Disclaimer */}
            <div style={{ ...card, gridColumn: "1 / -1", background: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.15)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <ShieldCheck style={{ width: 16, color: "#fbbf24", flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
                  <strong style={{ color: "#fbbf24" }}>Disclaimer:</strong>{" "}
                  All exported content was generated by an automated assistant and requires human verification.
                  Review Copilot supports but does not replace human peer review, editorial decisions, or
                  supervisory judgment. Do not submit AI-generated review content without independent verification.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
