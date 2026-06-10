import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import Chatbot from "@/components/Chatbot";

export const metadata: Metadata = {
  title: { default: "ResearchOS — Your AI Research Supervisor", template: "%s | ResearchOS" },
  description: "ResearchOS reviews your thesis, paper, proposal, dataset, and research project using structured supervisor-style critique, reproducibility scoring, reviewer simulation, and research memory. Built by researchers at TU Dortmund and Lamarr Institute.",
  keywords: ["AI research supervisor", "thesis feedback", "academic writing", "reproducibility", "PhD tools", "research review", "paper critique", "academic AI"],
  authors: [{ name: "Shaista Shabbir", url: "https://shaistashabbir-prog.github.io" }],
  openGraph: {
    title: "ResearchOS — Your AI Research Supervisor",
    description: "Get structured supervisor-style feedback on your research before submission.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Nav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
          {children}
        </main>
        <Chatbot />
        <footer className="border-t border-white/5 py-10 text-center">
          <p className="text-sm text-slate-500">ResearchOS — AI Research Supervisor</p>
          <p className="text-xs text-slate-700 mt-1.5">Built by researchers at TU Dortmund University · Lamarr Institute for ML & AI · University of Hamburg</p>
          <p className="text-xs text-slate-700 mt-1">Never ghostwrites. Reviews, audits, and helps researchers improve their own work ethically.</p>
          <p className="text-xs text-slate-700 mt-2">
            © 2026 Shaista Shabbir. All Rights Reserved. &nbsp;·&nbsp;
            <a href="/terms" className="hover:text-slate-500">Terms of Service</a> &nbsp;·&nbsp;
            <a href="/privacy" className="hover:text-slate-500">Privacy Policy</a> &nbsp;·&nbsp;
            <a href="mailto:shaista.s.shabbir@gmail.com" className="hover:text-slate-500">Licensing</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
