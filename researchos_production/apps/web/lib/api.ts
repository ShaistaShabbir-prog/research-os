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
      throw new Error(err.detail || `Request failed: ${res.status}`);
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

export const apiClient = {
  health: () => request<{ status: string }>("/api/health"),
  warmUp: warmUpAPI,
  supervisorReview: (payload: { document_text?: string; document_id?: number; project_id?: number; mode?: string; discipline?: string }) =>
    request<{ overall_score: number; report: Record<string, unknown> }>("/api/supervisor/review", { method: "POST", body: JSON.stringify(payload) }),
  datasetCard: (payload: { name: string; abstract: string; files?: string[]; license?: string; domain?: string }) =>
    request<{ dataset_card: Record<string, unknown>; reproducibility_score: number; issues: string[] }>("/api/datasets/card", { method: "POST", body: JSON.stringify(payload) }),
  graphIngest: (payload: { title: string; text: string; source_type?: string }) =>
    request<{ nodes: any[]; edges: any[] }>("/api/graph/ingest", { method: "POST", body: JSON.stringify(payload) }),
  listProjects: () => request<any[]>("/api/projects"),
  createProject: (p: { title: string; project_type: string; description?: string }) =>
    request<any>("/api/projects", { method: "POST", body: JSON.stringify(p) }),
};
