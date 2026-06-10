"use client";
import { useState } from "react";
import { Shield, Loader2, AlertTriangle, CheckCircle, Search } from "lucide-react";

interface Match {
  sentence: string;
  type: "exact_phrase" | "near_duplicate" | "self_repeat" | "boilerplate";
  severity: "high" | "medium" | "low";
  reason: string;
  suggestion: string;
}

interface PlagiarismResult {
  overall_risk: "low" | "medium" | "high";
  risk_score: number;
  unique_score: number;
  matches: Match[];
  self_repeat_pairs: Array<{ a: string; b: string; similarity: number }>;
  boilerplate_phrases: string[];
  summary: string;
}

// ── Client-side plagiarism heuristics ──────────────────────────────────────
function analyzeOriginality(text: string): PlagiarismResult {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const matches: Match[] = [];
  const boilerplate: string[] = [];

  // 1. Common boilerplate academic phrases
  const BOILERPLATE = [
    "in recent years",
    "in this paper we present",
    "in this paper we propose",
    "state of the art",
    "to the best of our knowledge",
    "a novel approach",
    "extensive experiments show",
    "outperforms existing methods",
    "significant improvement",
    "previous studies have shown",
    "research has shown that",
    "it is worth noting",
    "it can be seen that",
    "as shown in figure",
    "in conclusion this paper",
    "future work will",
    "this is consistent with",
  ];

  for (const phrase of BOILERPLATE) {
    const re = new RegExp(phrase, "gi");
    if (re.test(text)) {
      boilerplate.push(phrase);
      matches.push({
        sentence: phrase,
        type: "boilerplate",
        severity: "low",
        reason: `"${phrase}" is heavily overused in academic writing and may lower originality scores.`,
        suggestion: "Rephrase with your own specific language describing your actual finding or method.",
      });
    }
  }

  // 2. Self-repetition detection (near-duplicate sentences)
  const selfRepeatPairs: Array<{ a: string; b: string; similarity: number }> = [];
  for (let i = 0; i < sentences.length; i++) {
    for (let j = i + 3; j < sentences.length; j++) {
      const si = sentences[i].trim().toLowerCase().split(/\s+/);
      const sj = sentences[j].trim().toLowerCase().split(/\s+/);
      if (si.length < 8 || sj.length < 8) continue;
      const set1 = new Set(si);
      const intersection = sj.filter(w => set1.has(w) && w.length > 4).length;
      const longer = Math.max(si.length, sj.length);
      const sim = intersection / longer;
      if (sim > 0.65) {
        selfRepeatPairs.push({ a: sentences[i].trim().slice(0, 80), b: sentences[j].trim().slice(0, 80), similarity: Math.round(sim * 100) });
        matches.push({
          sentence: sentences[i].trim().slice(0, 80) + "…",
          type: "self_repeat",
          severity: sim > 0.8 ? "high" : "medium",
          reason: `This sentence is ${Math.round(sim*100)}% similar to a later sentence — possible self-repetition.`,
          suggestion: "Merge the ideas into one sentence or rephrase one of them substantially.",
        });
      }
    }
  }

  // 3. Suspiciously generic claim detection (no personal phrasing)
  const GENERIC_CLAIMS = [
    /deep learning.{0,30}achieves (superior|better|higher|improved)/gi,
    /results show that.{0,20}(outperforms|achieves|demonstrates)/gi,
    /the proposed method.{0,30}(significantly|substantially|considerably)/gi,
    /experimental results confirm/gi,
    /achieves state.{0,5}of.{0,5}the.{0,5}art/gi,
  ];
  for (const pattern of GENERIC_CLAIMS) {
    const m = text.match(pattern);
    if (m) {
      matches.push({
        sentence: m[0].slice(0, 80),
        type: "near_duplicate",
        severity: "medium",
        reason: "This phrasing appears in thousands of papers. It weakens distinctiveness.",
        suggestion: "State the specific metric, dataset, and comparison: 'Our method achieves 94.2% F1 on [Dataset], +3.1% vs [Baseline].'",
      });
    }
  }

  // 4. Over-long exact phrases from common introductions
  const INTRO_PHRASES = [
    "machine learning has emerged as",
    "with the rapid development of",
    "in the era of big data",
    "artificial intelligence has gained",
    "deep learning has revolutionized",
    "convolutional neural networks have",
  ];
  for (const phrase of INTRO_PHRASES) {
    if (text.toLowerCase().includes(phrase)) {
      matches.push({
        sentence: phrase,
        type: "exact_phrase",
        severity: "medium",
        reason: `"${phrase}" is an extremely common introduction phrase found in many papers.`,
        suggestion: "Open with a specific problem statement from your actual research context.",
      });
    }
  }

  // Score calculation
  const highCount = matches.filter(m => m.severity === "high").length;
  const medCount  = matches.filter(m => m.severity === "medium").length;
  const lowCount  = matches.filter(m => m.severity === "low").length;
  const riskScore = Math.min(100, highCount * 20 + medCount * 10 + lowCount * 4);
  const uniqueScore = Math.max(0, 100 - riskScore);

  const overall_risk: "low"|"medium"|"high" =
    riskScore >= 40 ? "high" : riskScore >= 20 ? "medium" : "low";

  const summary =
    overall_risk === "high"
      ? `High originality risk detected — ${matches.length} issues found. Review self-repetition and overused phrases before submission.`
      : overall_risk === "medium"
      ? `Moderate originality concerns — ${matches.length} issue(s) detected. Rephrase generic phrases for stronger originality.`
      : `Low originality risk — ${matches.length > 0 ? "minor suggestions only" : "no significant issues detected"}. Text appears reasonably original.`;

  return { overall_risk, risk_score: riskScore, unique_score: uniqueScore, matches, self_repeat_pairs: selfRepeatPairs, boilerplate_phrases: boilerplate, summary };
}

const SEV_COLOR = {
  high:   "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low:    "text-sky-400 bg-sky-500/10 border-sky-500/20",
};
const TYPE_LABEL = {
  exact_phrase:   "Exact phrase",
  near_duplicate: "Generic claim",
  self_repeat:    "Self-repetition",
  boilerplate:    "Boilerplate",
};

export default function PlagiarismPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const wc = text.trim().split(/\s+/).filter(Boolean).length;

  const run = () => {
    if (text.trim().length < 100) return;
    setLoading(true);
    setTimeout(() => { setResult(analyzeOriginality(text)); setLoading(false); }, 600);
  };

  const filtered = result?.matches.filter(m => filter==="all" || m.severity===filter || m.type===filter) ?? [];

  const riskColor = (r?: string) =>
    r==="high"?"text-red-400":r==="medium"?"text-amber-400":"text-emerald-400";
  const riskBg = (r?: string) =>
    r==="high"?"bg-red-500/10 border-red-500/20":r==="medium"?"bg-amber-500/10 border-amber-500/20":"bg-emerald-500/10 border-emerald-500/20";

  return (
    <div className="max-w-6xl mx-auto pt-10 space-y-8 px-4">
      <div>
        <h1 className="text-4xl font-bold mb-1 flex items-center gap-3">
          <Shield className="w-8 h-8 text-violet-400"/>Originality Check
        </h1>
        <p className="text-slate-400 text-sm max-w-xl">
          Detects self-repetition, boilerplate phrases, generic claims, and overused academic language.
          <span className="text-amber-400 ml-2">Not a plagiarism scanner</span> — use Turnitin for submission-level checks.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Input */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card space-y-3">
            <label className="label">Paste your text</label>
            <textarea value={text} onChange={e=>setText(e.target.value)}
              placeholder="Paste your abstract, introduction, methodology, or any section…&#10;&#10;Minimum 100 words for analysis."
              rows={18} className="input resize-y font-mono text-xs leading-relaxed"/>
            <div className="flex justify-between text-xs text-slate-500">
              <span className={wc<100?"text-amber-400":""}>{wc} words {wc<100?"(need 100+)":""}</span>
              {text && <button onClick={()=>{setText("");setResult(null);}} className="hover:text-red-400">Clear</button>}
            </div>
          </div>
          <button onClick={run} disabled={wc<100||loading}
            className="btn w-full justify-center py-3 disabled:opacity-40">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Analysing…</> : <><Search className="w-4 h-4"/>Check originality</>}
          </button>
          <div className="card-sm border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300 leading-relaxed space-y-1">
            <p className="font-bold">⚠️ Scope of this tool</p>
            <p>Detects: self-repetition, boilerplate, generic claims, overused phrases.</p>
            <p>Does NOT check against external databases. For submission use Turnitin, iThenticate, or Copyleaks.</p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {!result && !loading && (
            <div className="card flex flex-col items-center justify-center text-center py-24 space-y-3 text-slate-600">
              <Shield className="w-12 h-12 opacity-20"/>
              <p className="text-sm">Paste 100+ words and run the check.</p>
            </div>
          )}
          {loading && (
            <div className="card flex items-center justify-center py-24">
              <div className="text-center space-y-3">
                <Loader2 className="w-10 h-10 animate-spin text-violet-400 mx-auto"/>
                <p className="text-slate-400 text-sm">Analysing text for originality issues…</p>
              </div>
            </div>
          )}
          {result && (
            <div className="space-y-4">
              {/* Score overview */}
              <div className={`card border ${riskBg(result.overall_risk)} space-y-4`}>
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Originality risk</p>
                    <div className={`text-5xl font-bold ${riskColor(result.overall_risk)}`}>
                      {result.unique_score}<span className="text-xl text-slate-600 font-normal">/100</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{result.summary}</p>
                  </div>
                  <div className={`badge border ${
                    result.overall_risk==="high"?"badge-chatter":result.overall_risk==="medium"?"badge-meta":"badge-stable"
                  } text-sm px-3 py-1.5`}>
                    {result.overall_risk==="high"?"🔴 High risk":result.overall_risk==="medium"?"🟡 Medium risk":"🟢 Low risk"}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    {l:"Critical",  c:result.matches.filter(m=>m.severity==="high").length,   col:"text-red-400",   bg:"bg-red-500/10"},
                    {l:"Warnings",  c:result.matches.filter(m=>m.severity==="medium").length, col:"text-amber-400", bg:"bg-amber-500/10"},
                    {l:"Suggestions",c:result.matches.filter(m=>m.severity==="low").length,   col:"text-sky-400",   bg:"bg-sky-500/10"},
                  ].map(s=>(
                    <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
                      <div className={`text-2xl font-bold ${s.col}`}>{s.c}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filter */}
              <div className="flex flex-wrap gap-1.5">
                {["all","high","medium","low","boilerplate","self_repeat","exact_phrase","near_duplicate"].map(f=>(
                  <button key={f} onClick={()=>setFilter(f)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      filter===f?"bg-indigo-600 text-white border-indigo-600":"border-white/10 text-slate-400 hover:border-white/20"}`}>
                    {f==="all"?"All":f.replace("_"," ")}
                  </button>
                ))}
              </div>

              {/* Issues list */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filtered.length===0 ? (
                  <div className="card text-center py-12 text-slate-600">
                    <CheckCircle className="w-10 h-10 opacity-20 mx-auto mb-2"/>
                    <p className="text-sm">No issues match this filter.</p>
                  </div>
                ) : filtered.map((m,i)=>(
                  <div key={i} className={`border rounded-xl p-4 ${SEV_COLOR[m.severity]}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-bold uppercase tracking-wider opacity-75">{TYPE_LABEL[m.type]}</span>
                          <span className="text-xs opacity-50 capitalize">{m.severity}</span>
                        </div>
                        <p className="text-sm font-medium mb-1.5">{m.reason}</p>
                        <p className="text-xs opacity-70 mb-2">💡 {m.suggestion}</p>
                        <div className="font-mono text-xs opacity-60 bg-black/20 rounded px-2 py-1 truncate">
                          &ldquo;{m.sentence.slice(0,80)}{m.sentence.length>80?"…":""}&rdquo;
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Self-repeat pairs */}
              {result.self_repeat_pairs.length > 0 && (
                <div className="card border border-amber-500/20 space-y-3">
                  <p className="text-sm font-bold text-amber-300">🔄 Self-repetition pairs ({result.self_repeat_pairs.length})</p>
                  {result.self_repeat_pairs.slice(0,3).map((p,i)=>(
                    <div key={i} className="text-xs bg-amber-500/8 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold">{p.similarity}% similar</span>
                      </div>
                      <p className="text-slate-400 font-mono">&ldquo;{p.a}…&rdquo;</p>
                      <p className="text-slate-400 font-mono">&ldquo;{p.b}…&rdquo;</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
