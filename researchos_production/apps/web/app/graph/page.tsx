'use client';
import { useState } from 'react';
import { apiPost } from '@/lib/api';
export default function Graph(){
 const [text,setText]=useState('We use CNN and Random Forest on TS1 Dataset for chatter detection.'); const [graph,setGraph]=useState<any>(null);
 async function run(){ const res:any=await apiPost('/graph/ingest',{title:'Demo paper',text,source_type:'paper'}); setGraph(res); }
 return <div className="space-y-6"><h1 className="text-4xl font-bold">Research Knowledge Graph</h1><p className="text-slate-300">This is the moat: papers, methods, datasets, authors, experiments, and results become linked memory.</p><textarea className="input min-h-52" value={text} onChange={e=>setText(e.target.value)}/><button className="btn" onClick={run}>Extract graph</button>{graph&&<div className="grid gap-4 md:grid-cols-2"><div className="card"><h2 className="font-bold">Nodes</h2><pre className="text-sm">{JSON.stringify(graph.nodes,null,2)}</pre></div><div className="card"><h2 className="font-bold">Edges</h2><pre className="text-sm">{JSON.stringify(graph.edges,null,2)}</pre></div></div>}</div>
}
