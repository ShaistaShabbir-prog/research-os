export function ScoreCard({title,value,description}:{title:string;value:string;description:string}){
 return <div className="card"><div className="text-sm text-indigo-200">{title}</div><div className="mt-2 text-4xl font-bold">{value}</div><p className="mt-3 text-sm text-slate-300">{description}</p></div>
}
