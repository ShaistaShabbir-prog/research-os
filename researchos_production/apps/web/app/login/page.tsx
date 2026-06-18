"use client";
import { useState } from "react";
import { LogIn, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email,setEmail]=useState(""); const [pass,setPass]=useState("");
  const [show,setShow]=useState(false); const [loading,setLoading]=useState(false);
  const [error,setError]=useState(""); const [ok,setOk]=useState(false);
  const API=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:8000";
  const card:React.CSSProperties={background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:28};
  const inp:React.CSSProperties={width:"100%",padding:"10px 14px",borderRadius:9,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.1)",color:"#f1f5f9",fontSize:14,outline:"none",boxSizing:"border-box"};
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault(); setLoading(true); setError("");
    try{
      const r=await fetch(`${API}/api/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password:pass})});
      const d=await r.json();
      if(!r.ok)throw new Error(d.detail||"Login failed");
      localStorage.setItem("ros_token",d.token);
      setOk(true);
    }catch(e:any){setError(e.message);}finally{setLoading(false);}
  };
  return(
    <main style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#a78bfa",marginBottom:8}}>ResearchOS</div>
          <h1 style={{fontSize:24,fontWeight:800,color:"#fff",margin:0}}>Sign in</h1>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.45)",marginTop:6}}>Access your projects and analyses</p>
        </div>
        {ok?(
          <div style={{...card,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:12}}>✅</div>
            <div style={{fontSize:14,fontWeight:700,color:"#4ade80"}}>Signed in successfully</div>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:6}}>Redirecting…</p>
          </div>
        ):(
          <form onSubmit={submit} style={card}>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:6}}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" style={inp}/>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:6}}>Password</label>
              <div style={{position:"relative"}}>
                <input type={show?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} required placeholder="••••••••" style={{...inp,paddingRight:42}}/>
                <button type="button" onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",padding:0}}>
                  {show?<EyeOff style={{width:16}}/>:<Eye style={{width:16}}/>}
                </button>
              </div>
            </div>
            {error&&<div style={{marginBottom:14,padding:"10px 14px",borderRadius:8,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",fontSize:12,color:"#fca5a5"}}>{error}</div>}
            <button type="submit" disabled={loading} style={{width:"100%",padding:"11px",borderRadius:9,border:"none",background:loading?"#4c1d95":"#7c3aed",color:"#fff",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
              {loading?<><Loader2 style={{width:15,animation:"spin 1s linear infinite"}}/>Signing in…</>:<><LogIn style={{width:15}}/>Sign in</>}
            </button>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.4)",textAlign:"center",marginTop:14}}>Don&apos;t have an account? <a href="/register" style={{color:"#a78bfa"}}>Register</a></p>
          </form>
        )}
      </div>
    </main>
  );
}