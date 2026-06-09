"use client";
import Link from "next/link";
import { FileText, Database, GitBranch, TrendingUp, Plus, ArrowRight } from "lucide-react";

const STATS = [
  {icon:FileText,label:"Projects",value:"–",color:"text-indigo-400",bg:"bg-indigo-500/10"},
  {icon:TrendingUp,label:"Avg. score",value:"–",color:"text-emerald-400",bg:"bg-emerald-500/10"},
  {icon:Database,label:"Datasets",value:"–",color:"text-amber-400",bg:"bg-amber-500/10"},
  {icon:GitBranch,label:"Graph nodes",value:"–",color:"text-purple-400",bg:"bg-purple-500/10"},
];

const QUICK = [
  {icon:FileText,label:"New supervisor review",href:"/supervisor",color:"text-indigo-400"},
  {icon:Database,label:"Generate dataset card",href:"/datasets",color:"text-emerald-400"},
  {icon:GitBranch,label:"Extract knowledge graph",href:"/graph",color:"text-purple-400"},
];

export default function DashboardPage() {
  return (
    <div className="pt-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <Link href="/supervisor" className="btn"><Plus className="w-4 h-4"/>New review</Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(s=>(
          <div key={s.label} className="card flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.bg}`}><s.icon className={`w-6 h-6 ${s.color}`}/></div>
            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-sm text-slate-400">{s.label}</p></div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {QUICK.map(q=>(
          <Link key={q.label} href={q.href} className="card flex items-center justify-between group hover:border-white/20 transition-colors">
            <div className="flex items-center gap-3"><q.icon className={`w-5 h-5 ${q.color}`}/><span className="font-medium text-sm">{q.label}</span></div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors"/>
          </Link>
        ))}
      </div>
      <div className="card">
        <p className="text-sm text-slate-500 text-center py-12">No reviews yet. <Link href="/supervisor" className="text-indigo-400 hover:text-indigo-300">Start your first review →</Link></p>
      </div>
    </div>
  );
}
