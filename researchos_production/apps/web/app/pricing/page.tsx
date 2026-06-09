"use client";
import Link from "next/link";
import { Check } from "lucide-react";

const PLANS = [
  {name:"Free",price:"€0",period:"/forever",desc:"Get started.",color:"border-white/8",cta:"Start free",href:"/supervisor",
    features:["3 supervisor reviews/month","Basic heuristic scoring","Dataset card generator (3/month)","No account required"]},
  {name:"Student",price:"€9",period:"/month",desc:"For MSc students.",color:"border-indigo-500/40",featured:true,cta:"Start Student",href:"/auth",
    features:["50 reviews/month","All 4 review modes","PDF & DOCX upload","50 dataset cards/month","Knowledge graph extraction","Review history"]},
  {name:"PhD",price:"€19",period:"/month",desc:"For PhD candidates.",color:"border-purple-500/25",cta:"Start PhD",href:"/auth",
    features:["200 reviews/month","200MB document uploads","LLM-enhanced review (with API key)","Full knowledge graph","Benchmark tracking","Priority support"]},
  {name:"Lab",price:"€199",period:"/month",desc:"For research groups.",color:"border-emerald-500/25",cta:"Contact us",href:"mailto:hello@researchos.io",
    features:["Unlimited reviews","Up to 20 seats","Shared workspace","2GB storage","Institutional dataset catalogue","API access"]},
];

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto pt-10 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-5xl font-bold">Simple, honest pricing.</h1>
        <p className="text-slate-400 max-w-xl mx-auto">No lock-in. Start free. Upgrade when you need more reviews, uploads, or team features.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map(p=>(
          <div key={p.name} className={`card border flex flex-col ${p.color} ${p.featured?"ring-1 ring-indigo-500/30":""}`}>
            {p.featured && <div className="text-center mb-4"><span className="badge badge-indigo">Most popular</span></div>}
            <h3 className="text-xl font-bold">{p.name}</h3>
            <div className="mt-2 mb-1"><span className="text-4xl font-bold">{p.price}</span><span className="text-slate-400 text-sm">{p.period}</span></div>
            <p className="text-sm text-slate-500 mb-6">{p.desc}</p>
            <ul className="space-y-2.5 flex-1 mb-8">
              {p.features.map(f=>(
                <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5"/>{f}
                </li>
              ))}
            </ul>
            <Link href={p.href} className={p.featured?"btn w-full justify-center":"btn-outline w-full justify-center"}>{p.cta}</Link>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-slate-500">University site licence from €5,000/year. <a href="mailto:hello@researchos.io" className="text-indigo-400">Get in touch →</a></p>
    </div>
  );
}
