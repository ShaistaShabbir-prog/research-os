"use client";
import { useState, useRef, useEffect } from "react";
import { STARTERS, findLocalAnswer } from "@/lib/chatbot-knowledge";

interface Message { role: "user" | "assistant"; content: string; }

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! 👋 I'm the ResearchOS assistant. Ask me anything about using the platform!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100); } }, [open]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    const newMsgs: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const pageContext = document.querySelector("main")?.textContent?.slice(0, 12000) || "";
      const local = findLocalAnswer(msg, pageContext);
      const res = await fetch("/chatbot-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, pageContext }),
      });
      const data = res.ok ? await res.json() : local;
      const source = data.sources?.[0];
      const reply = `${data.answer || local.answer}${source ? `\n\nSource: ${source.label}${source.href ? ` (${source.href})` : ""}` : ""}`;
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      const local = findLocalAnswer(msg, document.querySelector("main")?.textContent?.slice(0, 12000) || "");
      const source = local.sources[0];
      setMessages(prev => [...prev, { role: "assistant", content: `${local.answer}${source ? `\n\nSource: ${source.label}${source.href ? ` (${source.href})` : ""}` : ""}` }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(o => !o)} aria-label="Open assistant"
        style={{
          position:"fixed",bottom:"24px",left:"24px",zIndex:9998,
          width:"56px",height:"56px",borderRadius:"50%",
          background:"linear-gradient(135deg,#6366F1,#4F46E5)",
          border:"none",boxShadow:"0 4px 20px rgba(0,0,0,.3)",
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
        }}>
        {open
          ? <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="11" r="1" fill="rgba(255,255,255,.8)"/><circle cx="12" cy="11" r="1" fill="rgba(255,255,255,.8)"/><circle cx="15" cy="11" r="1" fill="rgba(255,255,255,.8)"/></svg>
        }
        {unread > 0 && !open && (
          <span style={{position:"absolute",top:"-4px",right:"-4px",width:"18px",height:"18px",background:"#EF4444",borderRadius:"50%",fontSize:"10px",fontWeight:700,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position:"fixed",bottom:"90px",left:"24px",zIndex:9999,
          width:"min(360px,calc(100vw - 32px))",
          height:"min(520px,calc(100vh - 120px))",
          background:"#0a0f1e",border:"1px solid rgba(255,255,255,.08)",
          borderRadius:"20px",boxShadow:"0 20px 60px rgba(0,0,0,.5)",
          display:"flex",flexDirection:"column",overflow:"hidden",
          animation:"slideUp .2s ease-out",fontFamily:'"Inter",sans-serif',
        }}>
          <div style={{background:"linear-gradient(135deg,#6366F1,#4F46E5)",padding:"14px 16px",display:"flex",alignItems:"center",gap:"10px",flexShrink:0}}>
            <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:"14px",color:"#fff",flexShrink:0}}>
              R
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:"13px",color:"#fff"}}>{`ResearchOS Assistant`}</div>
              <div style={{fontSize:"10px",color:"rgba(255,255,255,.6)",display:"flex",alignItems:"center",gap:"4px"}}>
                <span style={{width:"5px",height:"5px",borderRadius:"50%",background:"#22C55E",display:"inline-block"}}/>Online
              </div>
            </div>
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"14px",display:"flex",flexDirection:"column",gap:"10px"}}>
            {messages.map((m,i) => (
              <div key={i} style={{display:"flex",flexDirection:m.role==="user"?"row-reverse":"row",gap:"8px",alignItems:"flex-end"}}>
                {m.role==="assistant" && <div style={{width:"24px",height:"24px",borderRadius:"50%",background:`linear-gradient(135deg,#6366F1,#4F46E5)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:900,color:"#fff",flexShrink:0}}>{"R"}</div>}
                <div style={{maxWidth:"78%",padding:"9px 12px",
                  borderRadius:m.role==="user"?"14px 14px 2px 14px":"14px 14px 14px 2px",
                  background:m.role==="user"?`linear-gradient(135deg,#6366F1,#4F46E5)`:"rgba(255,255,255,.08)",
                  color:"#f1f5f9",fontSize:"13px",lineHeight:1.6,whiteSpace:"pre-wrap"}}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{display:"flex",gap:"8px",alignItems:"flex-end"}}>
                <div style={{width:"24px",height:"24px",borderRadius:"50%",background:`linear-gradient(135deg,#6366F1,#4F46E5)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:900,color:"#fff"}}>{"R"}</div>
                <div style={{background:"rgba(255,255,255,.08)",padding:"10px 14px",borderRadius:"14px 14px 14px 2px",display:"flex",gap:"4px"}}>
                  {[0,1,2].map(i=><span key={i} style={{width:"5px",height:"5px",borderRadius:"50%",background:"#94A3B8",animation:`bounce 1s ${i*0.15}s infinite`,display:"inline-block"}}/>)}
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>

          <div style={{padding:"10px 12px",borderTop:"1px solid rgba(255,255,255,.06)",display:"flex",gap:"8px",alignItems:"center",flexShrink:0}}>
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
              placeholder="Ask a question…" disabled={loading}
              style={{flex:1,padding:"9px 12px",border:"1.5px solid rgba(255,255,255,.1)",borderRadius:"10px",fontSize:"13px",background:"rgba(255,255,255,.06)",color:"#f1f5f9",outline:"none"}}
            />
            <button onClick={()=>send()} disabled={loading||!input.trim()}
              style={{width:"34px",height:"34px",borderRadius:"8px",background:input.trim()?`linear-gradient(135deg,#6366F1,#4F46E5)`:"rgba(255,255,255,.1)",border:"none",cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
          {messages.length === 1 && <div style={{padding:"0 12px 10px",display:"flex",gap:"6px",flexWrap:"wrap"}}>{STARTERS.map(s=><button key={s} onClick={()=>send(s)} style={{fontSize:"10px",padding:"5px 8px",borderRadius:"12px",border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.06)",color:"#cbd5e1",cursor:"pointer"}}>{s}</button>)}</div>}
          <p style={{fontSize:"10px",color:"rgba(255,255,255,.25)",textAlign:"center",padding:"0 12px 8px"}}>AI assistant · Not professional advice</p>
        </div>
      )}
      <style>{`
        @keyframes slideUp {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounce {0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
      `}</style>
    </>
  );
}
