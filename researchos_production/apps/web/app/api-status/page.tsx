export default async function ApiStatus(){
 const base=process.env.NEXT_PUBLIC_API_BASE_URL||'http://localhost:8000';
 let data:any={status:'unknown'};
 try{const res=await fetch(`${base}/api/health`,{cache:'no-store'}); data=await res.json();}catch(e){data={status:'offline'}}
 return <div className="card"><h1 className="text-4xl font-bold">API Status</h1><pre className="mt-4">{JSON.stringify(data,null,2)}</pre></div>
}
