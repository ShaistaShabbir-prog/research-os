const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

let warmedUp = false;
export async function warmUpAPI() {
  if (warmedUp) return;
  try { await fetch(`${API_BASE}/ping`); warmedUp = true; } catch {}
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      signal: controller.signal,
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
      const detail = err.detail;
      const message = typeof detail === "string"
        ? detail
        : detail?.message || err.message || `Request failed: ${res.status}`;
      throw new Error(message);
    }
    return res.json() as Promise<T>;
  } catch (e: any) {
    if (e.name === "AbortError") throw new Error("Request timed out. API may be starting up — please try again in 30 seconds.");
    if (e.message?.includes("fetch") || e.message?.includes("Failed")) throw new Error("Cannot reach API. Server may be waking up (~30s on free tier). Please try again.");
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export interface ReviewReport {
  mode: string;
  discipline: string;
  doc_type: string;
  word_count: number;
  overall_score: number;
  decision: string;
  scores: Array<{ name: string; value: number; rationale: string }>;
  section_presence: Record<string, boolean>;
  major_concerns: string[];
  minor_concerns: string[];
  supervisor_comments: string[];
  defense_questions: string[];
  next_actions: string[];
}

export interface ReviewResponse {
  overall_score: number;
  report: ReviewReport;
}

export interface ReviewCopilotFinding {
  category: string;
  title: string;
  description: string;
  severity: string;
  priority: string;
  evidence_span: { text: string; start_char?: number | null; end_char?: number | null };
  section_reference: string;
  suggested_action: string;
  confidence: number;
  human_verification_required: boolean;
}

export interface ReviewCopilotResponse {
  paper: {
    title: string;
    abstract: string;
    sections: Array<{ title: string; text: string; level: number; start_char?: number; end_char?: number }>;
    references: Array<Record<string, unknown>>;
    figures_tables: string[];
  };
  reviewer_analysis: Record<string, any>;
  citation_audit: { findings: ReviewCopilotFinding[] };
  claim_audit: { findings: ReviewCopilotFinding[] };
  reproducibility_audit: Record<string, any> & { findings: ReviewCopilotFinding[] };
  meta_review: Record<string, any>;
  knowledge_graph: { nodes: Array<Record<string, any>>; edges: Array<Record<string, any>> };
  ethics: string[];
  exports: Record<string, string>;
}

export const apiClient = {
  health: () => request<{ status: string }>("/api/health"),
  warmUp: warmUpAPI,

  supervisorReview: (payload: {
    document_text?: string;
    document_id?: number;
    project_id?: number;
    mode?: string;
    discipline?: string;
  }) => request<ReviewResponse>("/api/supervisor/review", {
    method: "POST",
    body: JSON.stringify(payload),
  }),

  datasetCard: (payload: {
    name: string; abstract: string; files?: string[]; license?: string; domain?: string;
  }) => request<{
    dataset_card: Record<string, unknown>;
    reproducibility_score: number;
    issues: string[];
  }>("/api/datasets/card", { method: "POST", body: JSON.stringify(payload) }),

  graphIngest: (payload: { title: string; text: string; source_type?: string }) =>
    request<{ nodes: Array<{ label: string; name: string; properties: Record<string, unknown> }>; edges: Array<{ source: string; target: string; relation: string }> }>("/api/graph/ingest", {
      method: "POST", body: JSON.stringify(payload),
    }),

  reviewCopilot: (payload: {
    document_text: string;
    reviews?: Array<{
      reviewer_id: string;
      summary: string;
      strengths?: string[];
      weaknesses?: string[];
      recommendation?: string;
    }>;
  }) => request<ReviewCopilotResponse>("/api/review-copilot/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  }),


  claimVerification: (payload: { document_text: string }) =>
    request<{
      claim_count: number; supported_count: number; unsupported_count: number;
      support_rate: number; claims: Array<Record<string, any>>;
      unsupported_claims: Array<Record<string, any>>;
      ethics: string[]; human_verification_required: boolean;
    }>("/api/claim-verification/analyze", { method: "POST", body: JSON.stringify(payload) }),

  reviewerFatigue: (payload: { document_text?: string; reviews: Array<{ reviewer_id: string; summary: string; strengths?: string[]; weaknesses?: string[]; recommendation?: string }> }) =>
    request<{
      reviewer_summaries: Array<Record<string, any>>;
      disagreement_matrix: Record<string, any>;
      ac_briefing: Record<string, any>;
      meta_review_draft: string;
      exports: Record<string, string>;
      ethics: string[]; human_verification_required: boolean;
    }>("/api/reviewer-fatigue/analyze", { method: "POST", body: JSON.stringify(payload) }),

  researchMemory: (payload: { papers: Array<{ id?: string; title?: string; text: string }> }) =>
    request<{
      paper_count: number; papers: Array<Record<string, any>>;
      summary: Array<Record<string, any>>;
      novelty_overlap: Record<string, any>;
      citation_overlap: Record<string, any>;
      contribution_overlap: Record<string, any>;
      exports: Record<string, string>;
      ethics: string[]; human_verification_required: boolean;
    }>("/api/research-memory/compare", { method: "POST", body: JSON.stringify(payload) }),


  copilotChat: (payload: {
    question: string;
    history?: Array<{ role: string; content: string }>;
    context?: Record<string, any> | null;
  }) =>
    request<{
      answer: string;
      ai_powered: boolean;
      model: string;
      human_verification_required: boolean;
      suggested_questions: string[];
      fallback_reason?: string;
    }>("/api/copilot/chat", { method: "POST", body: JSON.stringify(payload) }),

  copilotSuggestions: (paperHash?: string) =>
    request<{ suggestions: string[] }>(
      `/api/copilot/suggestions${paperHash ? `?paper_hash=${paperHash}` : ""}`
    ),

  listProjects: () => request<any[]>("/api/projects"),
  createProject: (p: { title: string; project_type: string; description?: string }) =>
    request<any>("/api/projects", { method: "POST", body: JSON.stringify(p) }),
  listReports: () => request<Array<{
    id: number; file_name: string; stability_class: string;
    chatter_probability: number; confidence: number; created_at: string;
  }>>("/api/reports"),
  getReport: (id: number) => request<{ id: number; stability_class: string; report_md: string; created_at: string }>(`/api/reports/${id}`),
};
