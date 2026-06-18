"use client";
import { useState } from "react";
import { Award, Download, Copy, CheckCircle, Loader2 } from "lucide-react";

const DEMO = `# Chatter Detection with LightGBM
## Abstract
We propose LightGBM for chatter detection at 91.4% F1. Random seed: 42. Code on GitHub.
## Method
LightGBM learning rate 0.05, 300 estimators, random_state=42.
## Experiments
Table 1: SVM 83.6%, LightGBM 91.4%. p < 0.05.`;

interface BadgeData {
  paper_hash: string; title: string; reproducibility_score: number;
  items_passed: number; items_total: number; overall_grade: string;
  claim_count: number; verified_claims: number;
  embed_markdown: string; embed_svg_url: string; embed_html: string;
  checklist: Record<string,boolean>; grade_color: string; score_color: string;
}

const GRADE_COLOR: Record<string,string> = {
  A:"#22c55e", B:"#84cc16", C:"#f59e0b", D:"#f97316", F:"#ef4444"
};

export default function BadgePage() {
  const [text, setText] = useState(DEMO);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BadgeData|null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const register = async () => {
    if (!text.trim()) { setError("Paste paper text first."); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API}/api/badge/register`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ document_text: text, reviews: [] }),
      });
      if (!r.ok) throw new Error((await r.json()).detail || "Failed");
      setResult(await r.json());
    } catch(e:any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const copy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key); setTimeout(()=>setCopied(""),1400);
  };

  const card: React.CSSProperties = {
    background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
    borderRadius:16, padding:20,
  };

  return (
    <main style={{minHeight:"100vh",padding:"32px 16px",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{maxWidth:1000,margin:"0 auto"}}>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#a78bfa",marginBottom:6}}>
            ResearchOS · Issue #16
          </div>
          <h1 style={{fontSize:26,fontWeight:800,color:"#fff",margin:0}}>Reproducibility Badge</h1>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.45)",marginTop:6}}>
            Generate an embeddable SVG badge for your paper. Paste your manuscript and get a shareable badge for GitHub, arXiv, or your paper website.
          </p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16,marginBottom:20}}>
          <div style={card}>
            <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.6)",marginBottom:8}}>
              Paper text (Markdown, LaTeX, or plain)
            </div>
            <textarea value={text} onChange={e=>setText(e.target.value)}
              style={{width:"100%",minHeight:260,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.08)",
                      borderRadius:10,padding:12,color:"#f1f5f9",fontSize:12,lineHeight:1.6,
                      fontFamily:"monospace",outline:"none",resize:"vertical"}}/>
            <div style={{display:"flex",gap:8,marginTop:12,justifyContent:"flex-end"}}>
              <button onClick={()=>setText(DEMO)}
                style={{padding:"8px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",
                        background:"transparent",color:"rgba(255,255,255,0.5)",fontSize:12,cursor:"pointer"}}>
                Load demo
              </button>
              <button onClick={register} disabled={loading}
                style={{padding:"8px 20px",borderRadius:8,border:"none",
                        background:loading?"#4c1d95":"#7c3aed",color:"#fff",
                        fontSize:13,fontWeight:700,cursor:loading?"not-allowed":"pointer",
                        display:"flex",alignItems:"center",gap:7}}>
                {loading ? <><Loader2 style={{width:14,animation:"spin 1s linear infinite"}}/>Generating…</>
                         : <><Award style={{width:14}}/>Generate badge</>}
              </button>
            </div>
            {error && <div style={{marginTop:10,padding:"10px 14px",borderRadius:8,
              background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",
              fontSize:12,color:"#fca5a5"}}>{error}</div>}
          </div>

          <div style={card}>
            <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:14}}>How it works</div>
            {[
              ["1","Paste paper","Manuscript text, LaTeX, or Markdown"],
              ["2","Generate","We analyse reproducibility (12 items)"],
              ["3","Embed","Copy badge code into README or arXiv"],
            ].map(([n,t,d])=>(
              <div key={n} style={{display:"flex",gap:10,marginBottom:14}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:"rgba(139,92,246,0.2)",
                  border:"1px solid rgba(139,92,246,0.4)",display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:11,fontWeight:800,color:"#a78bfa",flexShrink:0}}>{n}</div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"#fff"}}>{t}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>{d}</div>
                </div>
              </div>
            ))}
            <div style={{marginTop:8,padding:"10px 12px",borderRadius:9,
              background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.15)",
              fontSize:11,color:"rgba(255,255,255,0.55)",lineHeight:1.6}}>
              ⚠ Badges are heuristic estimates. Human verification required.
            </div>
          </div>
        </div>

        {result && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Score card */}
            <div style={{...card,display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
              {/* Grade circle */}
              <div style={{textAlign:"center",flexShrink:0}}>
                <div style={{width:80,height:80,borderRadius:"50%",
                  background:`${GRADE_COLOR[result.overall_grade]}20`,
                  border:`3px solid ${GRADE_COLOR[result.overall_grade]}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:32,fontWeight:800,color:GRADE_COLOR[result.overall_grade]}}>
                  {result.overall_grade}
                </div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:6}}>Overall Grade</div>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:800,color:"#fff",marginBottom:4}}>{result.title}</div>
                <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:8}}>
                  {[
                    {label:"Score",val:`${result.reproducibility_score}%`,color:result.score_color},
                    {label:"Items",val:`${result.items_passed}/${result.items_total}`,color:"#a78bfa"},
                    {label:"Claims verified",val:`${result.verified_claims}/${result.claim_count}`,color:"#60a5fa"},
                  ].map(s=>(
                    <div key={s.label} style={{padding:"8px 14px",borderRadius:10,
                      background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
                      <div style={{fontSize:18,fontWeight:800,color:s.color}}>{s.val}</div>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Progress bar */}
                <div style={{height:6,borderRadius:3,background:"rgba(255,255,255,0.07)"}}>
                  <div style={{height:"100%",borderRadius:3,
                    width:`${result.reproducibility_score}%`,
                    background:result.score_color,transition:"width 0.8s ease"}}/>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div style={card}>
              <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:12}}>
                Reproducibility Checklist
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
                {Object.entries(result.checklist).map(([k,v])=>(
                  <div key={k} style={{display:"flex",alignItems:"center",gap:8,
                    padding:"8px 12px",borderRadius:9,
                    background:v?"rgba(16,185,129,0.07)":"rgba(245,158,11,0.06)",
                    border:`1px solid ${v?"rgba(16,185,129,0.2)":"rgba(245,158,11,0.15)"}`}}>
                    {v ? <CheckCircle style={{width:13,color:"#4ade80",flexShrink:0}}/>
                       : <span style={{width:13,height:13,borderRadius:"50%",
                           border:"1.5px solid #fbbf24",display:"inline-block",flexShrink:0}}/>}
                    <span style={{fontSize:11,color:v?"#86efac":"#fde68a"}}>{k.replaceAll("_"," ")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Embed codes */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              {[
                {label:"Markdown (README / arXiv)",key:"md",val:result.embed_markdown},
                {label:"HTML",key:"html",val:result.embed_html},
              ].map(e=>(
                <div key={e.key} style={card}>
                  <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.6)",marginBottom:8}}>{e.label}</div>
                  <pre style={{fontSize:11,color:"#a78bfa",background:"rgba(0,0,0,0.3)",
                    borderRadius:8,padding:"10px 12px",margin:0,overflowX:"auto",
                    whiteSpace:"pre-wrap",wordBreak:"break-all"}}>{e.val}</pre>
                  <button onClick={()=>copy(e.key,e.val)}
                    style={{marginTop:8,padding:"6px 12px",borderRadius:7,
                      border:"1px solid rgba(255,255,255,0.1)",background:"transparent",
                      color:"rgba(255,255,255,0.6)",fontSize:11,cursor:"pointer",
                      display:"flex",alignItems:"center",gap:5}}>
                    {copied===e.key
                      ? <><CheckCircle style={{width:12}}/>Copied!</>
                      : <><Copy style={{width:12}}/>Copy</>}
                  </button>
                </div>
              ))}
            </div>

            <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",textAlign:"center",paddingBottom:8}}>
              Badge hash: <code style={{color:"#a78bfa"}}>{result.paper_hash}</code>
              {" · "}
              <a href={`${API}/api/badge/${result.paper_hash}.svg`} target="_blank"
                style={{color:"#60a5fa"}}>Preview SVG ↗</a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}