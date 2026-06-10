const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Warm up Render free tier (cold starts take ~50s)
let warmedUp = false;
export async function warmUpAPI() {
  if (warmedUp) return;
  try {
    await fetch(`${API_BASE}/ping`, { method: "GET" });
    warmedUp = true;
  } catch {}
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000); // 90s for cold start

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
    if (e.name === "AbortError") throw new Error("Request timed out. The API may be starting up — please try again in 30 seconds.");
    if (e.message?.includes("fetch")) throw new Error("Cannot reach API. If this is the first request, the server may be waking up (~30s). Please try again.");
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export const apiClient = {
  health: () => request<{ status: string; service: string }>("/api/health"),
  warmUp: warmUpAPI,

  createProject: (payload: { title: string; project_type: string; description?: string }) =>
    request<{ id: number; title: string; project_type: string }>("/api/projects", {
      method: "POST", body: JSON.stringify(payload),
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
      method: "POST", body: JSON.stringify(payload),
    }),

  datasetCard: (payload: {
    name: string; abstract: string; files?: string[]; license?: string; domain?: string;
  }) =>
    request<{ dataset_card: Record<string, unknown>; reproducibility_score: number; issues: string[] }>("/api/datasets/card", {
      method: "POST", body: JSON.stringify(payload),
    }),

  graphIngest: (payload: { title: string; text: string; source_type?: string }) =>
    request<{ nodes: any[]; edges: any[] }>("/api/graph/ingest", {
      method: "POST", body: JSON.stringify(payload),
    }),

  // Writing analysis (client-side Grammarly-style)
  analyzeWriting: (text: string): WritingSuggestion[] => {
    const suggestions: WritingSuggestion[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    // 1. Passive voice
    const passiveRegex = /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi;
    let m;
    while ((m = passiveRegex.exec(text)) !== null) {
      suggestions.push({ type: "style", severity: "info", text: m[0], message: "Passive voice — consider rewriting in active voice for clarity.", start: m.index, end: m.index + m[0].length });
    }

    // 2. Weak/vague words
    const weak = ["very", "really", "basically", "quite", "rather", "somewhat", "fairly", "pretty", "just", "stuff", "things", "good", "bad", "nice"];
    weak.forEach(w => {
      const re = new RegExp(`\\b${w}\\b`, "gi");
      while ((m = re.exec(text)) !== null) {
        suggestions.push({ type: "word_choice", severity: "warning", text: m[0], message: `"${w}" is vague in academic writing — use a more precise term.`, start: m.index, end: m.index + m[0].length });
      }
    });

    // 3. Long sentences (>40 words)
    sentences.forEach(s => {
      const wc = s.trim().split(/\s+/).length;
      if (wc > 40) {
        const idx = text.indexOf(s.trim());
        suggestions.push({ type: "clarity", severity: "warning", text: s.trim().slice(0, 60) + "...", message: `Sentence is ${wc} words — consider splitting for readability.`, start: idx, end: idx + s.length });
      }
    });

    // 4. Missing citations on claims
    const claimWords = ["shows", "proves", "demonstrates", "confirms", "indicates", "suggests", "found that", "reported"];
    claimWords.forEach(w => {
      const re = new RegExp(`\\b${w}\\b`, "gi");
      while ((m = re.exec(text)) !== null) {
        const surrounding = text.slice(Math.max(0, m.index - 5), m.index + 80);
        if (!/\[|\(\d{4}\)|et al/.test(surrounding)) {
          suggestions.push({ type: "citation", severity: "error", text: m[0], message: `Claim "${w}" may need a citation — unsupported claims weaken credibility.`, start: m.index, end: m.index + m[0].length });
        }
      }
    });

    // 5. First person in results/methods
    const firstPerson = /\b(I think|I believe|I feel|in my opinion)\b/gi;
    while ((m = firstPerson.exec(text)) !== null) {
      suggestions.push({ type: "tone", severity: "error", text: m[0], message: "Avoid first-person opinion language in academic writing.", start: m.index, end: m.index + m[0].length });
    }

    return suggestions.slice(0, 20); // max 20 suggestions
  }
};

export interface WritingSuggestion {
  type: "style" | "word_choice" | "clarity" | "citation" | "tone" | "grammar";
  severity: "info" | "warning" | "error";
  text: string;
  message: string;
  start: number;
  end: number;
}
