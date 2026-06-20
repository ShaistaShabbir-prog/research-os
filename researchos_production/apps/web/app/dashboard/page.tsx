"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart2, CheckCircle, Loader2, Scale, Search, Award, MessageSquare, Brain, Users } from "lucide-react";

const TOOLS = [
  { href:"/review-copilot",     icon:<Scale style={{width:16}}/>,      label:"Review Copilot"    },
  { href:"/claim-verification", icon:<Search style={{width:16}}/>,     label:"Claim Verification"},
  { href:"/reviewer-fatigue",   icon:<Users style={{width:16}}/>,      label:"Reviewer Fatigue"  },
  { href:"/research-memory",    icon:<Brain style={{width:16}}/>,      label:"Research Memory"   },
  { href:"/badges",             icon:<Award style={{width:16}}/>,      label:"Badges"            },
  { href:"/copilot",            icon:<MessageSquare style={{width:16}}/>, label:"Copilot Chat"  },
];

interface HealthStatus { status: string; checks: Record<string,string>; elapsed_ms: number; phases_live: string[] }

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${API}/api/health/deep`)
      .then(r => r.json())
      .then(d => { setHealth(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [API]);

  const card: React.CSSProperties = {
    background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)",
    borderRadius:14, padding:18,
  };

  return (
    <main style={{minHeight:"100vh",padding:"32px 16px",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{maxWidth:1060,margin:"0 auto"}}>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#a78bfa",marginBottom:6}}>ResearchOS</div>
          <h1 style={{fontSize:24,fontWeight:800,color:"#fff",margin:0}}>Dashboard</h1>
          <p style={{fontSize:13,color:"rgba(255,255,255,.45)",marginTop:4}}>System status and quick access to all tools.</p>
        </div>

        {/* Quick actions */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginBottom:24}}>
          {TOOLS.map(t=>(
            <Link key={t.href} href={t.href} style={{textDecoration:"none"}}>
              <div style={{...card,display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"14px 16px"}}>
                <span style={{color:"#a78bfa"}}>{t.icon}</span>
                <span style={{fontSize:12,fontWeight:700,color:"#fff"}}>{t.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* System health */}
        <div style={card}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <BarChart2 style={{width:16,color:"#a78bfa"}}/>
            <span style={{fontSize:14,fontWeight:700,color:"#fff"}}>System health</span>
            {loading && <Loader2 style={{width:13,animation:"spin 1s linear infinite",color:"rgba(255,255,255,.4)"}}/>}
            {health && (
              <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,
                background:health.status==="healthy"?"rgba(16,185,129,.15)":"rgba(245,158,11,.12)",
                color:health.status==="healthy"?"#4ade80":"#fbbf24"}}>
                {health.status} · {health.elapsed_ms}ms
              </span>
            )}
          </div>
          {health ? (
            <div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8,marginBottom:16}}>
                {Object.entries(health.checks).map(([key,val])=>(
                  <div key={key} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,
                    background:val==="ok"?"rgba(16,185,129,.06)":"rgba(239,68,68,.06)",
                    border:`1px solid ${val==="ok"?"rgba(16,185,129,.2)":"rgba(239,68,68,.2)"}`}}>
                    <CheckCircle style={{width:12,color:val==="ok"?"#4ade80":"#f87171",flexShrink:0}}/>
                    <span style={{fontSize:11,color:"rgba(255,255,255,.7)"}}>{key.replaceAll("_"," ")}</span>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>
                Phases live: {health.phases_live?.join(", ")}
              </div>
            </div>
          ) : loading ? (
            <div style={{fontSize:13,color:"rgba(255,255,255,.3)"}}>Checking API health…</div>
          ) : (
            <div style={{fontSize:13,color:"#f87171"}}>API unreachable — check NEXT_PUBLIC_API_BASE_URL</div>
          )}
        </div>

        {/* Ethics */}
        <div style={{...card,marginTop:16,background:"rgba(245,158,11,.04)",borderColor:"rgba(245,158,11,.15)"}}>
          <p style={{fontSize:12,color:"rgba(255,255,255,.5)",margin:0,lineHeight:1.7}}>
            ⚠ <strong style={{color:"#fbbf24"}}>Disclaimer:</strong> ResearchOS supports human review and must not be used as an automated decision system. All outputs require human verification.
          </p>
        </div>
      </div>
    </main>
  );
}