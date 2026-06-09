const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
export async function api(path:string, options:RequestInit={}){const res=await fetch(`${API_URL}${path}`,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}}); if(!res.ok) throw new Error(await res.text()); return res.json();}
export async function upload(projectId:string, file:File){const fd=new FormData(); fd.append('file',file); const res=await fetch(`${API_URL}/projects/${projectId}/upload`,{method:'POST',body:fd}); if(!res.ok) throw new Error(await res.text()); return res.json();}
