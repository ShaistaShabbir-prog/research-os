"use client";
import { useState, useEffect } from "react";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "researchos2026";
const SESSION_KEY = "ros_admin_auth";

export function withAdminAuth<T extends object>(Component: React.ComponentType<T>) {
  return function GuardedComponent(props: T) {
    const [authed, setAuthed] = useState(false);
    const [pw, setPw] = useState("");
    const [error, setError] = useState("");
    const [checking, setChecking] = useState(true);

    useEffect(() => {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved === ADMIN_PASSWORD) setAuthed(true);
      setChecking(false);
    }, []);

    const login = (e: React.FormEvent) => {
      e.preventDefault();
      if (pw === ADMIN_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, pw);
        setAuthed(true);
      } else {
        setError("Incorrect password.");
        setTimeout(() => setError(""), 2000);
      }
    };

    if (checking) return null;
    if (authed) return <Component {...props} />;

    return (
      <div style={{
        minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
        background:"#0a0d14", fontFamily:'"Inter",sans-serif',
      }}>
        <div style={{background:"#111520",border:"1px solid rgba(255,255,255,.08)",borderRadius:"20px",padding:"40px",width:"360px",boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}>
          <div style={{textAlign:"center",marginBottom:"28px"}}>
            <div style={{width:"48px",height:"48px",borderRadius:"14px",background:"linear-gradient(135deg,#6366F1,#4F46E5)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:"22px"}}>⚙️</div>
            <h1 style={{fontWeight:900,fontSize:"20px",color:"#f1f5f9",margin:"0 0 4px"}}>Admin Access</h1>
            <p style={{fontSize:"13px",color:"#64748b",margin:0}}>Enter password to continue</p>
          </div>
          <form onSubmit={login} style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            <input
              type="password" value={pw} onChange={e=>setPw(e.target.value)}
              placeholder="Admin password" autoFocus
              style={{padding:"12px 16px",border:"1.5px solid rgba(255,255,255,.1)",borderRadius:"10px",background:"rgba(255,255,255,.05)",color:"#f1f5f9",fontSize:"14px",outline:"none",fontFamily:"inherit"}}
            />
            {error && <p style={{color:"#ef4444",fontSize:"13px",textAlign:"center",margin:0}}>{error}</p>}
            <button type="submit" style={{padding:"12px",background:"linear-gradient(135deg,#6366F1,#4F46E5)",color:"#fff",border:"none",borderRadius:"10px",fontWeight:700,fontSize:"14px",cursor:"pointer"}}>
              Enter Admin →
            </button>
          </form>
          <p style={{fontSize:"11px",color:"#374151",textAlign:"center",marginTop:"16px"}}>
            Set password in Vercel env: NEXT_PUBLIC_ADMIN_PASSWORD
          </p>
        </div>
      </div>
    );
  };
}
