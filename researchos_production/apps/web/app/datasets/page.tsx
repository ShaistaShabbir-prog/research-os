'use client';
import { useState } from 'react';
import { apiPost } from '@/lib/api';
export default function Datasets(){
 const [name,setName]=useState('Machining Audio Stability Dataset'); const [abstract,setAbstract]=useState('Audio and process data for machining stability experiments.'); const [files,setFiles]=useState('README.md\ndata.csv\nmetadata.json\nrequirements.txt\nLICENSE'); const [card,setCard]=useState<any>(null);
 async function run(){ const res:any=await apiPost('/datasets/card',{name,abstract,files:files.split('\n').filter(Boolean),license:'CC-BY-4.0',domain:'manufacturing AI'}); setCard(res); }
 return <div className="space-y-6"><h1 className="text-4xl font-bold">Academic Dataset Hub</h1><input className="input" value={name} onChange={e=>setName(e.target.value)}/><textarea className="input" value={abstract} onChange={e=>setAbstract(e.target.value)}/><textarea className="input min-h-40" value={files} onChange={e=>setFiles(e.target.value)}/><button className="btn" onClick={run}>Generate dataset card</button>{card&&<div className="card"><h2 className="text-2xl font-bold">Reproducibility score: {card.reproducibility_score}%</h2><pre className="mt-4 overflow-auto rounded-xl bg-black/30 p-4 text-sm">{JSON.stringify(card.dataset_card,null,2)}</pre>{card.issues.length>0&&<ul className="mt-4 list-disc pl-6 text-slate-300">{card.issues.map((x:string)=><li key={x}>{x}</li>)}</ul>}</div>}</div>
}
