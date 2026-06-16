"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Clipboard,
  ClipboardCheck,
  Download,
  FileText,
  GitBranch,
  Loader2,
  Scale,
  Search,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { apiClient, type ReviewCopilotFinding, type ReviewCopilotResponse } from "@/lib/api";

const TABS = [
  "Paper Intake",
  "Reviewer Analysis",
  "Citation Audit",
  "Claim Audit",
  "Reproducibility Audit",
  "Meta-Review Copilot",
  "Knowledge Graph",
  "Ethics & Safety",
] as const;

const DEMO_TEXT = `# Synthetic Efficient Review Networks

## Abstract
We introduce a lightweight review-assistance model for synthetic research supervision scenarios. The method improves reviewer calibration on a toy benchmark, but the current draft does not prove general superiority. Experiments compare two simple baselines on a synthetic dataset.

## Introduction
Peer review workflows require careful human judgment. Automated systems can assist with consistency checks, but they should never replace reviewers.

## Method
The system uses a rule-based parser and a small classifier. We train for 10 epochs with a learning rate of 0.001 and batch size 16. Code is planned for release in a repository.

## Experiments
We evaluate on a synthetic dataset with two baselines. Table 1 reports accuracy. Figure 1 shows reviewer workload.

## Discussion
The study is limited to synthetic examples and does not establish real conference outcomes.

## References
1. Doe, J. Synthetic Peer Review Benchmarks. Journal of Toy Evaluation. 2024. doi:10.0000/demo
2. Smith, A. Human-Centered Review Assistance. Proceedings of Synthetic HCI. 2023. arXiv:2301.00001`;

const DEMO_REVIEWS = [
  {
    reviewer_id: "R1",
    summary: "The paper addresses an important problem but needs clearer reproducibility details.",
    strengths: ["important problem", "clear motivation"],
    weaknesses: ["missing random seeds", "limited synthetic-only evaluation"],
    recommendation: "weak accept",
  },
  {
    reviewer_id: "R2",
    summary: "The system is useful as a checklist, but claims should be more carefully qualified.",
    strengths: ["important problem"],
    weaknesses: ["limited synthetic-only evaluation", "needs more baselines"],
    recommendation: "borderline",
  },
];

const MAX_INPUT_CHARS = 200000;

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: filename.endsWith(".json") ? "application/json" : "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyText(content: string) {
  await navigator.clipboard.writeText(content);
}

function severityClass(severity: string) {
  if (severity === "high") return "badge-red";
  if (severity === "low") return "badge-green";
  return "badge-amber";
}

function FindingList({ findings }: { findings: ReviewCopilotFinding[] }) {
  if (!findings?.length) {
    return (
      <div className="card-sm flex items-center gap-3 text-sm text-emerald-300">
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
        No automated finding in this category. Human verification is still required.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {findings.map((finding, index) => (
        <article key={`${finding.category}-${index}`} className="card-sm space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge ${severityClass(finding.severity)}`}>{finding.severity}</span>
                <span className="badge badge-indigo">{finding.priority} priority</span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-white">{finding.title}</h3>
            </div>
            <span className="text-xs text-slate-500 tabular-nums">
              {Math.round((finding.confidence || 0) * 100)}%
            </span>
          </div>
          <p className="text-sm leading-6 text-slate-300">{finding.description}</p>
          <div className="rounded-lg border border-white/8 bg-black/15 p-3 text-xs leading-5 text-slate-400">
            <div className="mb-1 font-semibold text-slate-300">Evidence: {finding.section_reference}</div>
            {finding.evidence_span?.text || "No evidence span captured."}
          </div>
          <div className="text-sm text-violet-200">Suggested action: {finding.suggested_action}</div>
        </article>
      ))}
    </div>
  );
}

function ExportButton({ result, filename }: { result: ReviewCopilotResponse | null; filename: string }) {
  return (
    <button
      disabled={!result?.exports?.[filename]}
      onClick={() => result?.exports?.[filename] && downloadFile(filename, result.exports[filename])}
      className="btn-outline disabled:opacity-40 disabled:cursor-not-allowed"
      title={`Export ${filename}`}
    >
      <Download className="w-4 h-4" />
      {filename}
    </button>
  );
}

export default function ReviewCopilotPage() {
  const [text, setText] = useState(DEMO_TEXT);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Paper Intake");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [result, setResult] = useState<ReviewCopilotResponse | null>(null);

  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const charsRemaining = MAX_INPUT_CHARS - text.length;
  const reviewerFindings = result
    ? [
        ...(result.reviewer_analysis.novelty_analysis || []),
        ...(result.reviewer_analysis.strengths || []),
        ...(result.reviewer_analysis.weaknesses || []),
        ...(result.reviewer_analysis.methodology_critique || []),
        ...(result.reviewer_analysis.missing_baselines || []),
        ...(result.reviewer_analysis.missing_ablations || []),
        ...(result.reviewer_analysis.limitations || []),
        ...(result.reviewer_analysis.ethical_concerns || []),
        ...(result.reviewer_analysis.reproducibility_concerns || []),
        ...(result.reviewer_analysis.reviewer_questions || []),
      ]
    : [];

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError("Please paste paper text or LaTeX source.");
      return;
    }
    if (text.length > MAX_INPUT_CHARS) {
      setError(`Input is too long. Please keep paper text under ${MAX_INPUT_CHARS.toLocaleString()} characters.`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.reviewCopilot({ document_text: text, reviews: DEMO_REVIEWS });
      setResult(response);
    } catch (err: any) {
      setError(err.message || "Review Copilot failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (filename: string) => {
    const content = result?.exports?.[filename];
    if (!content) return;
    await copyText(content);
    setCopied(filename);
    setTimeout(() => setCopied(""), 1400);
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setText(await file.text());
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-violet-300">
                <Scale className="w-4 h-4" />
                ResearchOS
              </div>
              <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Review Copilot</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                Assists research quality, peer review, and supervision by highlighting issues and drafting structured notes for human judgment.
              </p>
            </div>

            <div className="card space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="label mb-0">Paper PDF text, Markdown, or LaTeX source</label>
                <label className="btn-ghost">
                  <Upload className="w-4 h-4" />
                  Upload source
                  <input type="file" className="hidden" accept=".txt,.md,.tex" onChange={handleFile} />
                </label>
              </div>
              <textarea
                className="input min-h-[320px] resize-y font-mono text-xs leading-5"
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={`text-xs ${charsRemaining < 0 ? "text-red-300" : "text-slate-500"}`}>
                  {wordCount} words · {text.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()} characters
                </span>
                <button onClick={handleAnalyze} disabled={loading} className="btn disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {loading ? "Analyzing" : "Analyze paper"}
                </button>
              </div>
              {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
            </div>
          </div>

          <aside className="card h-fit space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              Ethics & Safety
            </div>
            <div className="space-y-3">
              {(result?.ethics || [
                "The system assists, but does not replace human scientific judgment.",
                "Do not submit AI-generated reviews without human verification.",
                "The reviewer remains responsible for correctness, fairness, and confidentiality.",
                "No paper content should be sent to external APIs unless explicitly configured.",
              ]).map((warning) => (
                <div key={warning} className="flex gap-2 text-sm leading-5 text-slate-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="space-y-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  activeTab === tab ? "bg-violet-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/8 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {!result ? (
            <div className="card flex flex-col gap-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-violet-300" /> : <FileText className="w-5 h-5 text-violet-300" />}
                <span>{loading ? "Review Copilot is parsing sections and running local audits." : "Run analysis to populate the Review Copilot workspace."}</span>
              </div>
              {!loading && (
                <button onClick={() => setText(DEMO_TEXT)} className="btn-outline">
                  Load demo
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {activeTab === "Paper Intake" && (
                <div className="card space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{result.paper.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{result.paper.abstract || "No abstract detected."}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="card-sm"><div className="text-2xl font-bold text-white">{result.paper.sections.length}</div><div className="text-xs text-slate-500">sections</div></div>
                    <div className="card-sm"><div className="text-2xl font-bold text-white">{result.paper.references.length}</div><div className="text-xs text-slate-500">references</div></div>
                    <div className="card-sm"><div className="text-2xl font-bold text-white">{result.paper.figures_tables.length}</div><div className="text-xs text-slate-500">figures/tables</div></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ExportButton result={result} filename="review_analysis.md" />
                    <ExportButton result={result} filename="review_analysis.json" />
                  </div>
                </div>
              )}

              {activeTab === "Reviewer Analysis" && (
                <div className="space-y-4">
                  <div className="card text-sm leading-6 text-slate-300">{result.reviewer_analysis.paper_summary}</div>
                  <FindingList findings={reviewerFindings} />
                  <div className="flex flex-wrap gap-2">
                    <ExportButton result={result} filename="review_analysis.md" />
                    <ExportButton result={result} filename="review_analysis.json" />
                    <button
                      onClick={() => handleCopy("review_analysis.md")}
                      className="btn-outline"
                      title="Copy review analysis Markdown"
                    >
                      {copied === "review_analysis.md" ? <ClipboardCheck className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                      {copied === "review_analysis.md" ? "Copied" : "Copy Markdown"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "Citation Audit" && (
                <div className="space-y-4">
                  <FindingList findings={result.citation_audit.findings} />
                  <ExportButton result={result} filename="citation_audit.json" />
                </div>
              )}

              {activeTab === "Claim Audit" && (
                <div className="space-y-4">
                  <FindingList findings={result.claim_audit.findings} />
                  <ExportButton result={result} filename="claim_audit.json" />
                </div>
              )}

              {activeTab === "Reproducibility Audit" && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {Object.entries(result.reproducibility_audit)
                      .filter(([, value]) => typeof value === "boolean")
                      .map(([key, value]) => (
                        <div key={key} className="card-sm flex items-center justify-between gap-3">
                          <span className="text-xs text-slate-300">{key.replaceAll("_", " ")}</span>
                          {value ? <CheckCircle className="h-4 w-4 text-emerald-300" /> : <AlertTriangle className="h-4 w-4 text-amber-300" />}
                        </div>
                      ))}
                  </div>
                  <FindingList findings={result.reproducibility_audit.findings} />
                  <ExportButton result={result} filename="reproducibility_checklist.md" />
                </div>
              )}

              {activeTab === "Meta-Review Copilot" && (
                <div className="space-y-4">
                  <div className="card text-sm leading-6 text-slate-300">{result.meta_review.balanced_meta_review}</div>
                  <FindingList
                    findings={[
                      ...(result.meta_review.agreement_points || []),
                      ...(result.meta_review.disagreement_points || []),
                      ...(result.meta_review.missing_discussion_points || []),
                      ...(result.meta_review.review_quality_issues || []),
                    ]}
                  />
                  <ExportButton result={result} filename="meta_review_draft.md" />
                </div>
              )}

              {activeTab === "Knowledge Graph" && (
                <div className="card space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="card-sm flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-violet-300" />
                      <div><div className="text-2xl font-bold text-white">{result.knowledge_graph.nodes.length}</div><div className="text-xs text-slate-500">nodes</div></div>
                    </div>
                    <div className="card-sm flex items-center gap-3">
                      <GitBranch className="w-5 h-5 text-violet-300" />
                      <div><div className="text-2xl font-bold text-white">{result.knowledge_graph.edges.length}</div><div className="text-xs text-slate-500">edges</div></div>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-auto rounded-lg border border-white/8 bg-black/15 p-4">
                    <pre className="text-xs leading-5 text-slate-300">{JSON.stringify(result.knowledge_graph, null, 2)}</pre>
                  </div>
                  <ExportButton result={result} filename="research_kg.graphml" />
                </div>
              )}

              {activeTab === "Ethics & Safety" && (
                <div className="card space-y-3">
                  {result.ethics.map((warning) => (
                    <div key={warning} className="flex gap-3 rounded-lg border border-amber-400/20 bg-amber-400/8 p-3 text-sm text-amber-100">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      {warning}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
