const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000")
    : (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  health: () =>
    request<{ status: string; service: string }>("/api/health"),

  createProject: (payload: { title: string; project_type: string; description?: string }) =>
    request<{ id: number; title: string; project_type: string }>("/api/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listProjects: () =>
    request<Array<{ id: number; title: string; project_type: string; created_at: string }>>("/api/projects"),

  supervisorReview: (payload: {
    document_text?: string;
    document_id?: number;
    project_id?: number;
    mode?: string;
    discipline?: string;
  }) =>
    request<{ overall_score: number; report: Record<string, unknown> }>("/api/supervisor/review", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  datasetCard: (payload: {
    name: string;
    abstract: string;
    files?: string[];
    license?: string;
    domain?: string;
  }) =>
    request<{
      dataset_card: Record<string, unknown>;
      reproducibility_score: number;
      issues: string[];
    }>("/api/datasets/card", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  graphIngest: (payload: { title: string; text: string; source_type?: string }) =>
    request<{
      nodes: Array<{ label: string; name: string; properties: Record<string, unknown> }>;
      edges: Array<{ source: string; target: string; relation: string }>;
    }>("/api/graph/ingest", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
