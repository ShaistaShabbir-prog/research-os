import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: { default: "ResearchOS", template: "%s | ResearchOS" },
  description: "AI Supervisor · Dataset Hub · Research Knowledge Graph — the operating system for modern research.",
  keywords: ["research", "AI supervisor", "thesis review", "dataset reproducibility", "academic"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Nav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
          {children}
        </main>
        <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-500">
          <p>ResearchOS — ethical research feedback, dataset reproducibility, and knowledge graph memory.</p>
          <p className="mt-1 text-slate-600 text-xs">Does not ghostwrite. Reviews, audits, and helps researchers improve their own work.</p>
        </footer>
      </body>
    </html>
  );
}
