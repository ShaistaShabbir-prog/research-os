"use client";
import { useState } from "react";
import { GitBranch, Loader2, AlertTriangle } from "lucide-react";
import { apiClient } from "@/lib/api";

const LABEL_BADGE: Record<string, string> = {
  Paper:"badge-indigo",Thesis:"badge-indigo",Method:"badge-purple",Dataset:"badge-green",Institution:"badge-amber",
};

export default function GraphPage() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [sourceType, setSourceType] = useState("paper");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleExtract = async () => {
    if (!title.trim() || !text.trim()) { setError("Title and text are required."); return; }
    setLoading(true); setError(""); setResult(null);
    try { setResult(await apiClient.graphIngest({ title, text, source_type: sourceType })); }
    catch (e: any) { setError(e.message || "Extraction failed."); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto pt-10 space-y-8">
      <div><h1 className="text-4xl font-bold mb-2">Knowledge Graph</h1>
        <p className="text-slate-400 text-sm">Extract methods, datasets, and institutions. Build your research memory graph.</p></div>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="card space-y-4">
          <div className="space-y-1.5"><label className="label">Document title *</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} className="input" placeholder="e.g. Low-Cost Acoustic Monitoring for CNC Milling"/></div>
          <div className="space-y-1.5"><label className="label">Source type</label>
            <select value={sourceType} onChange={e=>setSourceType(e.target.value)} className="input">
              {["paper","thesis","expose","dataset"].map(t=><option key={t}>{t}</option>)}</select></div>
          <div className="space-y-1.5"><label className="label">Document text *</label>
            <textarea value={text} onChange={e=>setText(e.target.value)} rows={14}
              className="input resize-y font-mono text-xs" placeholder="Paste your paper or thesis text here…"/></div>
          {error && <div className="flex gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-300"><AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0"/>{error}</div>}
          <button onClick={handleExtract} disabled={loading} className="btn w-full justify-center py-3 disabled:opacity-40">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Extracting…</> : <><GitBranch className="w-4 h-4"/>Extract graph</>}
          </button>
        </div>
        <div>
          {!result && !loading && (
            <div className="card flex flex-col items-center justify-center text-center py-24 space-y-3 text-slate-600 h-full">
              <GitBranch className="w-10 h-10 opacity-20"/><p className="text-sm">Nodes and edges appear here.</p>
            </div>
          )}
          {loading && <div className="card flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-purple-400"/></div>}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[{l:"Nodes",v:result.nodes.length},{l:"Edges",v:result.edges.length},{l:"Methods",v:result.nodes.filter((n:any)=>n.label==="Method").length}].map(s=>(
                  <div key={s.l} className="card text-center"><div className="text-3xl font-bold text-purple-400">{s.v}</div><div className="text-xs text-slate-400 mt-1">{s.l}</div></div>
                ))}
              </div>
              <div className="card">
                <p className="section-title">Extracted nodes</p>
                <div className="flex flex-wrap gap-2">
                  {result.nodes.map((n:any,i:number)=>(
                    <span key={i} className={`badge ${LABEL_BADGE[n.label]||"badge-indigo"}`}>{n.label}: {n.name}</span>
                  ))}
                </div>
              </div>
              <div className="card">
                <p className="section-title">Relations ({result.edges.length})</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {result.edges.map((e:any,i:number)=>(
                    <div key={i} className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="truncate max-w-[120px] text-slate-300">{e.source}</span>
                      <span className="badge badge-purple text-[10px] shrink-0">{e.relation}</span>
                      <span className="truncate max-w-[120px] text-purple-300">{e.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
