"use client";
import { useState } from "react";
import { Plus, X, Loader2, CheckCircle, AlertTriangle, Database } from "lucide-react";
import { apiClient } from "@/lib/api";

export default function DatasetsPage() {
  const [name, setName] = useState("");
  const [abstract, setAbstract] = useState("");
  const [domain, setDomain] = useState("general");
  const [license, setLicense] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [newFile, setNewFile] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const addFile = () => {
    const f = newFile.trim();
    if (f && !files.includes(f)) { setFiles([...files, f]); setNewFile(""); }
  };
  const removeFile = (f: string) => setFiles(files.filter(x => x !== f));

  const handleGenerate = async () => {
    if (!name.trim()) { setError("Dataset name is required."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await apiClient.datasetCard({ name, abstract, files, license: license || undefined, domain });
      setResult(data);
    } catch (e: any) { setError(e.message || "Failed."); }
    finally { setLoading(false); }
  };

  const scoreColor = (v: number) => v >= 80 ? "text-emerald-400" : v >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="max-w-5xl mx-auto pt-10 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Dataset Hub</h1>
        <p className="text-slate-400 text-sm">Generate a dataset card and reproducibility report for academic publication.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="card space-y-4">
            <div className="space-y-1.5"><label className="label">Dataset name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="e.g. CNC Milling Acoustic Dataset v1.0" /></div>
            <div className="space-y-1.5"><label className="label">Abstract / description</label>
              <textarea value={abstract} onChange={e => setAbstract(e.target.value)} rows={4} className="input resize-y" placeholder="Describe the dataset, collection process, and intended use…" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="label">Domain</label>
                <select value={domain} onChange={e => setDomain(e.target.value)} className="input">
                  {["general","manufacturing","medicine","NLP","computer vision","audio","tabular","time series"].map(d => <option key={d}>{d}</option>)}</select></div>
              <div className="space-y-1.5"><label className="label">License</label>
                <select value={license} onChange={e => setLicense(e.target.value)} className="input">
                  {["","CC-BY-4.0","CC-BY-SA-4.0","CC0","MIT","Apache-2.0","Restricted"].map(l => <option key={l} value={l}>{l || "— select —"}</option>)}</select></div>
            </div>
          </div>
          <div className="card space-y-3">
            <label className="label">File inventory</label>
            <p className="text-xs text-slate-500">Add filenames for reproducibility scoring (e.g. data.csv, README.md, LICENSE).</p>
            <div className="flex gap-2">
              <input value={newFile} onChange={e => setNewFile(e.target.value)} onKeyDown={e => e.key === "Enter" && addFile()}
                className="input flex-1" placeholder="data.csv, README.md, LICENSE…" />
              <button onClick={addFile} className="btn px-3"><Plus className="w-4 h-4" /></button>
            </div>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map(f => (
                  <span key={f} className="inline-flex items-center gap-1.5 bg-slate-700/60 border border-white/10 rounded-lg px-3 py-1 text-xs font-mono">
                    {f}<button onClick={() => removeFile(f)}><X className="w-3 h-3 text-slate-400 hover:text-red-400" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          {error && <div className="flex gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-300"><AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}</div>}
          <button onClick={handleGenerate} disabled={loading} className="btn w-full justify-center py-3 disabled:opacity-40">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Database className="w-4 h-4" /> Generate dataset card</>}
          </button>
        </div>
        <div>
          {!result && !loading && (
            <div className="card flex flex-col items-center justify-center text-center py-20 space-y-3 text-slate-600 h-full">
              <Database className="w-10 h-10 opacity-20" />
              <p className="text-sm">Fill in the form and click generate.</p>
            </div>
          )}
          {loading && <div className="card flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>}
          {result && (
            <div className="space-y-4">
              <div className="card">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Reproducibility score</p>
                <div className={`text-5xl font-bold tabular-nums mb-4 ${scoreColor(result.reproducibility_score)}`}>
                  {result.reproducibility_score}<span className="text-xl text-slate-600 font-normal">%</span>
                </div>
                {result.issues.length > 0 ? (
                  <div className="space-y-2">
                    {result.issues.map((issue: string, i: number) => (
                      <div key={i} className="flex gap-2 text-sm text-amber-300 bg-amber-500/8 border border-amber-500/15 rounded-lg p-3">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{issue}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2 text-sm text-emerald-300"><CheckCircle className="w-4 h-4" />All checks passed!</div>
                )}
              </div>
              <div className="card">
                <p className="section-title">Dataset card</p>
                <pre className="text-xs text-slate-300 overflow-auto leading-relaxed whitespace-pre-wrap max-h-96">
                  {JSON.stringify(result.dataset_card, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
