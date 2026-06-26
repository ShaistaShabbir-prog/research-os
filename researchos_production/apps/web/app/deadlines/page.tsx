"use client";
import { useEffect, useState } from "react";

interface Venue {
  name: string; short: string; type: string; color: string;
  submission: string; notification: string; camera: string; url: string;
}

const VENUES: Venue[] = [
  {name:"Annual Meeting of ACL",        short:"ACL",      type:"NLP",  color:"#7c3aed",
   submission:"2026-02-10",notification:"2026-04-15",camera:"2026-05-20",url:"https://2026.aclweb.org"},
  {name:"EMNLP 2026",                   short:"EMNLP",    type:"NLP",  color:"#3b82f6",
   submission:"2026-06-10",notification:"2026-08-20",camera:"2026-09-15",url:"https://2026.emnlp.org"},
  {name:"NAACL 2026",                   short:"NAACL",    type:"NLP",  color:"#10b981",
   submission:"2026-01-15",notification:"2026-03-20",camera:"2026-04-20",url:"https://2026.naacl.org"},
  {name:"ICLR 2027",                    short:"ICLR",     type:"ML",   color:"#f59e0b",
   submission:"2026-10-01",notification:"2027-01-22",camera:"2027-03-01",url:"https://iclr.cc"},
  {name:"NeurIPS 2026",                 short:"NeurIPS",  type:"ML",   color:"#ec4899",
   submission:"2026-05-22",notification:"2026-09-25",camera:"2026-10-30",url:"https://neurips.cc"},
  {name:"ICML 2026",                    short:"ICML",     type:"ML",   color:"#06b6d4",
   submission:"2026-01-30",notification:"2026-05-01",camera:"2026-06-01",url:"https://icml.cc"},
];

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function pill(d: number) {
  const color = d < 0 ? "#6b7280" : d < 14 ? "#ef4444" : d < 30 ? "#f59e0b" : "#22c55e";
  const label = d < 0 ? "Passed" : d === 0 ? "Today!" : `${d}d`;
  return <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:color+"22",color,border:`1px solid ${color}44`}}>{label}</span>;
}

export default function DeadlinesPage() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(()=>setNow(new Date()),60000); return ()=>clearInterval(t); },[]);

  return (
    <main style={{minHeight:"100vh",padding:"32px 16px",fontFamily:"Inter,system-ui,sans-serif",maxWidth:1000,margin:"0 auto"}}>
      <div style={{marginBottom:28}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#a78bfa",marginBottom:8}}>ResearchOS</div>
        <h1 style={{fontSize:24,fontWeight:800,color:"#fff",margin:"0 0 6px"}}>Conference Deadlines</h1>
        <p style={{fontSize:13,color:"rgba(255,255,255,.45)",margin:0}}>Upcoming NLP / ML submission deadlines. Updated manually.</p>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {VENUES.map(v => {
          const dSub = daysUntil(v.submission);
          const dNot = daysUntil(v.notification);
          const dCam = daysUntil(v.camera);
          return (
            <a key={v.short} href={v.url} target="_blank" rel="noopener"
               style={{textDecoration:"none",display:"block",padding:18,borderRadius:14,
                 background:"rgba(255,255,255,.04)",border:`1px solid rgba(255,255,255,.08)`,
                 transition:"border-color .15s"}}
               onMouseEnter={e=>(e.currentTarget.style.borderColor=v.color+"55")}
               onMouseLeave={e=>(e.currentTarget.style.borderColor="rgba(255,255,255,.08)")}>
              <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:15,fontWeight:800,padding:"3px 10px",borderRadius:8,background:v.color+"22",color:v.color}}>{v.short}</span>
                <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>{v.name}</span>
                <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:"rgba(255,255,255,.06)",color:"rgba(255,255,255,.5)"}}>{v.type}</span>
              </div>
              <div style={{display:"flex",gap:24,marginTop:12,flexWrap:"wrap"}}>
                <div><div style={{fontSize:10,color:"rgba(255,255,255,.35)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:3}}>Submission</div><div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:13,color:"rgba(255,255,255,.7)"}}>{v.submission}</span>{pill(dSub)}</div></div>
                <div><div style={{fontSize:10,color:"rgba(255,255,255,.35)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:3}}>Notification</div><div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:13,color:"rgba(255,255,255,.7)"}}>{v.notification}</span>{pill(dNot)}</div></div>
                <div><div style={{fontSize:10,color:"rgba(255,255,255,.35)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:3}}>Camera-ready</div><div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:13,color:"rgba(255,255,255,.7)"}}>{v.camera}</span>{pill(dCam)}</div></div>
              </div>
            </a>
          );
        })}
      </div>
    </main>
  );
}
