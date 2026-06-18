"use client";
import { useState } from "react";
import { MessageSquare, Send, Loader2, Sparkles } from "lucide-react";

interface Msg { role:"user"|"assistant"; content:string; ai_powered?:boolean }

const SUGGESTIONS=[
  "What are the main reproducibility gaps?",
  "Which claims are unsupported?",
  "What do reviewers agree on?",
  "How can the authors improve the rebuttal?",
];

export default function CopilotPage() {
  const [msgs,setMsgs]=useState<Msg[]>([{role:"assistant",content:"Hi! I'm ResearchOS Copilot. Paste a paper hash or ask me anything about peer review quality, reproducibility, or claim verification. All outputs require human verification."}]);
  const [input,setInput]=useState(""); const [loading,setLoading]=useState(false);
  const API=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:8000";
  const card:React.CSSProperties={background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:20};

  const send=async(q?:string)=>{
    const question=q||input.trim(); if(!question||loading) return;
    setInput(""); setLoading(true);
    const newMsgs:Msg[]=[...msgs,{role:"user",content:question}];
    setMsgs(newMsgs);
    try{
      const r=await fetch(`${API}/api/copilot/chat`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({question,history:msgs.map(m=>({role:m.role,content:m.content})),context:{}})});
      const d=await r.json();
      setMsgs(m=>[...m,{role:"assistant",content:d.answer||"Sorry, I couldn't answer that.",ai_powered:d.ai_powered}]);
    }catch{
      setMsgs(m=>[...m,{role:"assistant",content:"Error — please try again."}]);
    }finally{setLoading(false);}
  };

  return(
    <main style={{minHeight:"100vh",padding:"32px 16px",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#a78bfa",marginBottom:6}}>ResearchOS · Issue #13</div>
          <h1 style={{fontSize:24,fontWeight:800,color:"#fff",margin:0}}>ResearchOS Copilot</h1>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.45)",marginTop:4}}>Context-aware research assistant. Human verification required for all outputs.</p>
        </div>

        {/* Suggestions */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
          {SUGGESTIONS.map(s=>(
            <button key={s} onClick={()=>send(s)}
              style={{padding:"6px 12px",borderRadius:20,border:"1px solid rgba(139,92,246,0.3)",background:"rgba(139,92,246,0.08)",color:"#a78bfa",fontSize:11,fontWeight:600,cursor:"pointer"}}>
              {s}
            </button>
          ))}
        </div>

        {/* Chat messages */}
        <div style={{...card,minHeight:360,marginBottom:12,display:"flex",flexDirection:"column",gap:12,overflowY:"auto",maxHeight:480}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"82%",padding:"10px 14px",borderRadius:12,
                background:m.role==="user"?"rgba(124,58,237,0.2)":"rgba(255,255,255,0.05)",
                border:`1px solid ${m.role==="user"?"rgba(124,58,237,0.3)":"rgba(255,255,255,0.08)"}`,
                fontSize:13,color:"rgba(255,255,255,0.85)",lineHeight:1.7}}>
                {m.content}
                {m.role==="assistant" && (
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",marginTop:6,display:"flex",alignItems:"center",gap:4}}>
                    {m.ai_powered ? <><Sparkles style={{width:10}}/>Claude</> : "◇ Heuristic"} · Human verification required
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"rgba(255,255,255,0.4)"}}>
              <Loader2 style={{width:13,animation:"spin 1s linear infinite"}}/>Thinking…
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{display:"flex",gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            placeholder="Ask about reproducibility, claims, reviewer consensus…"
            style={{flex:1,padding:"11px 16px",borderRadius:10,background:"rgba(0,0,0,0.3)",
              border:"1px solid rgba(255,255,255,0.1)",color:"#f1f5f9",fontSize:13,outline:"none"}}/>
          <button onClick={()=>send()} disabled={!input.trim()||loading}
            style={{padding:"11px 18px",borderRadius:10,border:"none",background:input.trim()?"#7c3aed":"rgba(255,255,255,0.06)",
              color:"#fff",cursor:input.trim()?"pointer":"not-allowed",display:"flex",alignItems:"center",gap:6}}>
            <Send style={{width:14}}/>
          </button>
        </div>
      </div>
    </main>
  );
}