"use client";
import { useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const [mode, setMode] = useState<"login"|"signup">("signup");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading] = useState(false);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4">
            <BookOpen className="w-7 h-7 text-white"/>
          </div>
          <h1 className="text-3xl font-bold">ResearchOS</h1>
          <p className="text-slate-400 text-sm">{mode==="signup"?"Create your researcher account":"Sign in to your account"}</p>
        </div>
        <div className="card space-y-4">
          <div className="flex bg-slate-900/60 rounded-xl p-1 gap-1">
            {(["signup","login"] as const).map(m=>(
              <button key={m} onClick={()=>setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode===m?"bg-indigo-600 text-white":"text-slate-400 hover:text-white"}`}>
                {m==="signup"?"Sign up":"Sign in"}
              </button>
            ))}
          </div>
          {mode==="signup"&&<div className="space-y-1.5"><label className="label">Full name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="input" placeholder="Your name"/></div>}
          <div className="space-y-1.5"><label className="label">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="input" placeholder="you@university.edu"/></div>
          <button className="btn w-full justify-center py-3" disabled={loading}>
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:mode==="signup"?"Create account":"Sign in"}
          </button>
          <p className="text-xs text-slate-500 text-center">ResearchOS does not write your research — it helps you improve it.</p>
        </div>
        <p className="text-center text-sm text-slate-400"><Link href="/supervisor" className="text-indigo-400 hover:text-indigo-300">← Try without account first</Link></p>
      </div>
    </div>
  );
}
