"use client";
import { withAdminAuth } from "@/components/AdminGuard";
import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";

const NAV = [
  { id:"overview",  icon:"📊", label:"Overview" },
  { id:"reviews",   icon:"📝", label:"Reviews" },
  { id:"datasets",  icon:"📁", label:"Datasets" },
  { id:"memory",    icon:"🧠", label:"Research Memory" },
  { id:"settings",  icon:"⚙️", label:"Settings" },
];

function ResearchOSAdmin() {
  const [tab, setTab]       = useState("overview");
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking"|"online"|"offline">("checking");

  useEffect(() => {
    apiClient.health()
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("offline"));
    setLoading(true);
    apiClient.listReports()
      .then(r => { setReports(r); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sidebar = (active: boolean): React.CSSProperties => ({
    display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px",
    borderRadius:"10px", cursor:"pointer", fontSize:"14px",
    fontWeight: active ? 700 : 500,
    background: active ? "linear-gradient(135deg,#6366F1,#4F46E5)" : "transparent",
    color: active ? "#fff" : "#64748B",
    border:"none", width:"100%", textAlign:"left", transition:"all .15s",
  });

  const statCard = (label:string, val:string|number, sub:string, color:string) => (
    <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:"16px",padding:"22px 24px",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
      <div style={{fontSize:"2rem",fontWeight:900,color,lineHeight:1}}>{val}</div>
      <div style={{fontSize:"14px",fontWeight:700,color:"#0F172A",marginTop:"6px"}}>{label}</div>
      <div style={{fontSize:"12px",color:"#94A3B8",marginTop:"2px"}}>{sub}</div>
    </div>
  );

  const decisionColor = (d:string) =>
    d?.includes("Strong") ? "#059669" : d?.includes("Major") ? "#DC2626" : "#D97706";

  const chatterBg = (p: number) =>
    p >= 0.65 ? "#FEF2F2" : p >= 0.35 ? "#FFFBEB" : "#F0FDF4";

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#F8FAFC",fontFamily:'"Inter",sans-serif'}}>

      {/* Sidebar */}
      <div style={{width:"220px",flexShrink:0,background:"#fff",borderRight:"1px solid #E5E7EB",display:"flex",flexDirection:"column",padding:"20px 12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"28px",paddingLeft:"4px"}}>
          <div style={{width:"36px",height:"36px",borderRadius:"10px",background:"linear-gradient(135deg,#6366F1,#4F46E5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:"18px"}}>📚</span>
          </div>
          <div>
            <div style={{fontWeight:900,fontSize:"15px",color:"#0F172A"}}>ResearchOS</div>
            <div style={{fontSize:"11px",color:"#94A3B8"}}>Admin Panel</div>
          </div>
        </div>
        {NAV.map(n => (
          <button key={n.id} onClick={()=>setTab(n.id)} style={sidebar(tab===n.id)}>
            <span style={{fontSize:"16px"}}>{n.icon}</span>{n.label}
          </button>
        ))}
        <div style={{flex:1}}/>
        <div style={{borderTop:"1px solid #F1F5F9",paddingTop:"14px",marginTop:"12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px"}}>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:apiStatus==="online"?"#22C55E":apiStatus==="offline"?"#EF4444":"#F59E0B"}}/>
            <span style={{fontSize:"12px",color:"#64748B",fontWeight:600}}>API {apiStatus}</span>
          </div>
          <Link href="/" style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",fontSize:"13px",color:"#94A3B8",textDecoration:"none"}}>
            ← Back to site
          </Link>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,overflow:"auto"}}>
        <div style={{background:"#fff",borderBottom:"1px solid #E5E7EB",padding:"16px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h1 style={{fontSize:"20px",fontWeight:800,color:"#0F172A",margin:0}}>
            {NAV.find(n=>n.id===tab)?.icon} {NAV.find(n=>n.id===tab)?.label}
          </h1>
          <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
            <a href={(process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:8000")+"/docs"}
              target="_blank" rel="noopener"
              style={{padding:"8px 14px",background:"#F1F5F9",color:"#0F172A",borderRadius:"8px",fontSize:"12px",fontWeight:700,textDecoration:"none"}}>
              API Docs ↗
            </a>
            <Link href="/supervisor" style={{padding:"8px 16px",background:"linear-gradient(135deg,#6366F1,#4F46E5)",color:"#fff",borderRadius:"8px",fontSize:"13px",fontWeight:700,textDecoration:"none"}}>
              + New review
            </Link>
          </div>
        </div>

        <div style={{padding:"28px"}}>

          {/* OVERVIEW */}
          {tab==="overview" && (
            <div style={{display:"flex",flexDirection:"column",gap:"24px"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"16px"}}>
                {statCard("Total Reviews",   reports.length,                                    "All time",          "#6366F1")}
                {statCard("Strong drafts",   reports.filter(r=>r.stability_class?.includes("Strong")||r.chatter_probability===0).length, "Score ≥ 8",  "#059669")}
                {statCard("Major revision",  reports.filter(r=>r.stability_class?.includes("Major")).length,"Need work", "#DC2626")}
                {statCard("Avg score",       reports.length ? (reports.reduce((a,r)=>a+(r.chatter_probability??0),0)/reports.length*10).toFixed(1) : "—", "Overall quality", "#D97706")}
                {statCard("API status",      apiStatus==="online"?"✅ Online":"⚠️ Offline", "Render free tier", apiStatus==="online"?"#059669":"#DC2626")}
                {statCard("Modules",         3, "Supervisor · Datasets · Memory", "#7C3AED")}
              </div>

              {/* Recent reviews */}
              <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:"16px",overflow:"hidden"}}>
                <div style={{padding:"16px 20px",borderBottom:"1px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontWeight:700,fontSize:"15px"}}>📝 Recent reviews</span>
                  <button onClick={()=>setTab("reviews")} style={{fontSize:"12px",color:"#6366F1",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>View all →</button>
                </div>
                {loading ? (
                  <div style={{padding:"32px",textAlign:"center",color:"#94A3B8",fontSize:"14px"}}>Loading…</div>
                ) : reports.length===0 ? (
                  <div style={{padding:"32px",textAlign:"center",color:"#94A3B8",fontSize:"14px"}}>No reviews yet.</div>
                ) : reports.slice(0,5).map((r,i) => (
                  <Link key={i} href={`/reports/${r.id}`} style={{display:"flex",padding:"13px 20px",borderBottom:"1px solid #F9FAFB",justifyContent:"space-between",alignItems:"center",textDecoration:"none",color:"inherit"}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:"14px",color:"#0F172A"}}>{r.file_name||"Document"}</div>
                      <div style={{fontSize:"12px",color:"#94A3B8",marginTop:"2px"}}>{new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                    <span style={{fontSize:"12px",fontWeight:700,padding:"4px 10px",borderRadius:"6px",background:chatterBg(r.chatter_probability??0),color:decisionColor(r.stability_class||"")}}>
                      {r.stability_class||"—"}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Module links */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:"12px"}}>
                {[
                  {icon:"🎓",label:"AI Supervisor",href:"/supervisor",color:"#6366F1"},
                  {icon:"📁",label:"Dataset Hub",  href:"/datasets",  color:"#059669"},
                  {icon:"🧠",label:"Research Memory",href:"/graph",   color:"#7C3AED"},
                  {icon:"💰",label:"Pricing",       href:"/pricing",   color:"#D97706"},
                  {icon:"📋",label:"Terms",         href:"/terms",     color:"#64748B"},
                  {icon:"🔒",label:"Privacy",       href:"/privacy",   color:"#64748B"},
                ].map(l=>(
                  <Link key={l.href} href={l.href} style={{background:"#fff",border:`1px solid ${l.color}25`,borderRadius:"12px",padding:"16px",fontSize:"13px",fontWeight:700,color:l.color,textDecoration:"none",display:"flex",alignItems:"center",gap:"8px",transition:"all .15s"}}>
                    <span style={{fontSize:"18px"}}>{l.icon}</span>{l.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* REVIEWS */}
          {tab==="reviews" && (
            <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px"}}>
                {statCard("Total reviews",  reports.length,  "All reviews",    "#6366F1")}
                {statCard("Today",          reports.filter(r=>new Date(r.created_at).toDateString()===new Date().toDateString()).length, "Today",  "#059669")}
                {statCard("This week",      reports.filter(r=>new Date(r.created_at)>new Date(Date.now()-7*86400000)).length, "Last 7 days", "#D97706")}
              </div>
              {loading ? (
                <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:"16px",padding:"48px",textAlign:"center",color:"#94A3B8"}}>Loading reviews…</div>
              ) : reports.length===0 ? (
                <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:"16px",padding:"48px",textAlign:"center",color:"#94A3B8"}}>
                  <div style={{fontSize:"36px",marginBottom:"12px"}}>📝</div>
                  <div style={{fontWeight:700}}>No reviews yet</div>
                  <Link href="/supervisor" style={{display:"inline-block",marginTop:"14px",padding:"10px 20px",background:"linear-gradient(135deg,#6366F1,#4F46E5)",color:"#fff",borderRadius:"8px",fontWeight:700,fontSize:"13px",textDecoration:"none"}}>
                    Run first review →
                  </Link>
                </div>
              ) : (
                <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:"16px",overflow:"hidden"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr style={{background:"#F8FAFC",borderBottom:"1px solid #E5E7EB"}}>
                        {["#","Document","Decision","Probability","Date","Action"].map(h=>(
                          <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:"11px",fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r,i)=>(
                        <tr key={i} style={{borderBottom:"1px solid #F9FAFB"}}>
                          <td style={{padding:"13px 16px",fontSize:"13px",color:"#94A3B8",fontWeight:600}}>{reports.length-i}</td>
                          <td style={{padding:"13px 16px",fontWeight:600,fontSize:"13px",color:"#0F172A",maxWidth:"180px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.file_name||"Document"}</td>
                          <td style={{padding:"13px 16px"}}>
                            <span style={{fontSize:"12px",fontWeight:700,padding:"3px 8px",borderRadius:"6px",background:chatterBg(r.chatter_probability??0),color:decisionColor(r.stability_class||"")}}>{r.stability_class||"—"}</span>
                          </td>
                          <td style={{padding:"13px 16px",fontSize:"13px",color:"#6B7280"}}>{r.chatter_probability!=null?(r.chatter_probability*100).toFixed(0)+"%":"—"}</td>
                          <td style={{padding:"13px 16px",fontSize:"13px",color:"#6B7280"}}>{new Date(r.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</td>
                          <td style={{padding:"13px 16px"}}>
                            <Link href={`/reports/${r.id}`} style={{fontSize:"12px",fontWeight:700,color:"#6366F1",textDecoration:"none",padding:"4px 10px",border:"1px solid #C7D2FE",borderRadius:"6px"}}>View →</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* DATASETS */}
          {tab==="datasets" && (
            <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:"14px",padding:"20px 24px"}}>
                <h3 style={{fontWeight:800,fontSize:"15px",marginBottom:"10px"}}>📁 Dataset Hub</h3>
                <p style={{fontSize:"14px",color:"#64748B",lineHeight:1.7,marginBottom:"16px"}}>Generate dataset cards with reproducibility scores and metadata audits for machining and research datasets.</p>
                <Link href="/datasets" style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"10px 18px",background:"linear-gradient(135deg,#059669,#047857)",color:"#fff",borderRadius:"8px",fontWeight:700,fontSize:"13px",textDecoration:"none"}}>
                  Open Dataset Hub →
                </Link>
              </div>
              <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"12px",padding:"16px 20px"}}>
                <p style={{fontWeight:700,color:"#1E40AF",marginBottom:"6px",fontSize:"14px"}}>💡 How to use Dataset Hub</p>
                <ul style={{fontSize:"13px",color:"#1E3A8A",lineHeight:1.9,paddingLeft:"18px",margin:0}}>
                  <li>Fill in dataset name, description, and sensors used</li>
                  <li>List all files and add license (CC-BY-4.0 recommended)</li>
                  <li>Add institution, material, and spindle speed for machining datasets</li>
                  <li>Get a reproducibility score out of 100 with specific improvement suggestions</li>
                </ul>
              </div>
            </div>
          )}

          {/* MEMORY */}
          {tab==="memory" && (
            <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:"14px",padding:"20px 24px"}}>
                <h3 style={{fontWeight:800,fontSize:"15px",marginBottom:"10px"}}>🧠 Research Memory</h3>
                <p style={{fontSize:"14px",color:"#64748B",lineHeight:1.7,marginBottom:"16px"}}>Extract and remember methods, datasets, institutions, and results from your documents. Build a defensible research memory across papers.</p>
                <Link href="/graph" style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"10px 18px",background:"linear-gradient(135deg,#7C3AED,#6D28D9)",color:"#fff",borderRadius:"8px",fontWeight:700,fontSize:"13px",textDecoration:"none"}}>
                  Open Research Memory →
                </Link>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {tab==="settings" && (
            <div style={{display:"flex",flexDirection:"column",gap:"14px",maxWidth:"600px"}}>
              {[
                {label:"API Base URL",       value:process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:8000", href:process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:8000"},
                {label:"API Health",         value:"GET /api/health",                                             href:(process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:8000")+"/api/health"},
                {label:"API Docs",           value:"Swagger UI",                                                  href:(process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:8000")+"/docs"},
                {label:"GitHub Repo",        value:"ShaistaShabbir-prog/research-os",                            href:"https://github.com/ShaistaShabbir-prog/research-os"},
                {label:"Vercel Dashboard",   value:"research-os-phi.vercel.app",                                  href:"https://vercel.com"},
                {label:"Render Dashboard",   value:"researchos-api-8zqh.onrender.com",                           href:"https://dashboard.render.com"},
              ].map(s=>(
                <div key={s.label} style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:"12px",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:"11px",fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"4px"}}>{s.label}</div>
                    <div style={{fontSize:"13px",fontWeight:600,color:"#0F172A",fontFamily:"monospace"}}>{s.value}</div>
                  </div>
                  <a href={s.href} target="_blank" rel="noopener" style={{padding:"6px 12px",background:"#F1F5F9",color:"#0F172A",borderRadius:"6px",fontSize:"12px",fontWeight:700,textDecoration:"none"}}>Open →</a>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default withAdminAuth(ResearchOSAdmin);