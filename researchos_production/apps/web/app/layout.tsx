import './globals.css';
import { Nav } from '@/components/Nav';
export const metadata = { title: 'ResearchOS', description: 'AI Supervisor, Dataset Hub, and Research Knowledge Graph' };
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body><main className="mx-auto max-w-6xl px-6"><Nav />{children}<footer className="py-10 text-sm text-slate-400">ResearchOS — ethical research feedback, dataset reproducibility, and graph memory.</footer></main></body></html>
}
