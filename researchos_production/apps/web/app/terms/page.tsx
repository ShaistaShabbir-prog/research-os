"use client";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto pt-12 pb-24 px-4 space-y-10">

      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Terms of Service</h1>
        <p className="text-slate-400 text-sm">Last updated: June 2026 · Effective immediately</p>
      </div>

      <div className="prose prose-invert max-w-none space-y-8 text-slate-300 leading-relaxed">

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">1. Ownership & Intellectual Property</h2>
          <p>ResearchOS is proprietary software created and owned exclusively by <strong>Shaista Shabbir</strong>, Research Associate at TU Dortmund University and the Lamarr Institute for Machine Learning and Artificial Intelligence.</p>
          <p>All source code, algorithms, review methodologies, UI designs, content, documentation, and the ResearchOS brand are the exclusive intellectual property of Shaista Shabbir. © 2026 All Rights Reserved.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">2. Permitted Use</h2>
          <p>You may use ResearchOS to review and improve your own research work. You may not:</p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-400">
            <li>Copy, reproduce, or redistribute any part of this platform</li>
            <li>Reverse engineer, decompile, or attempt to extract source code</li>
            <li>Create derivative products or competing services based on ResearchOS</li>
            <li>Use ResearchOS to ghostwrite or generate research for submission as your own</li>
            <li>Resell or sublicense access to ResearchOS</li>
            <li>Use automated tools to scrape or bulk-access the platform</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">3. Ethical Use Policy</h2>
          <p>ResearchOS is designed to help researchers <strong>improve</strong> their own work — not to replace it. By using this platform, you agree that:</p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-400">
            <li>All research you submit remains your own work</li>
            <li>You will not misrepresent AI-generated suggestions as original research</li>
            <li>You acknowledge that ResearchOS feedback is heuristic and does not guarantee acceptance</li>
            <li>You will comply with your institution's policies on AI tool use</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">4. Data & Privacy</h2>
          <p>Documents and text submitted for review are processed to generate feedback. On the free tier, no data is sent to external LLM providers by default. See our <a href="/privacy" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</a> for full details.</p>
          <p>We do not store your document content beyond the current session on the free tier.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">5. Disclaimer</h2>
          <p>ResearchOS provides heuristic feedback for educational and improvement purposes. It does not guarantee academic acceptance, approval, or any specific outcome. All feedback should be evaluated critically by the researcher.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">6. Governing Law</h2>
          <p>These terms are governed by the laws of the Federal Republic of Germany. Any disputes shall be subject to the jurisdiction of the courts of Dortmund, Germany.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">7. Contact</h2>
          <p>For licensing, legal, or partnership inquiries:</p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm space-y-1">
            <p><strong>Shaista Shabbir</strong></p>
            <p>Research Associate · TU Dortmund University · Lamarr Institute</p>
            <p>Email: <a href="mailto:shaista.s.shabbir@gmail.com" className="text-indigo-400">shaista.s.shabbir@gmail.com</a></p>
            <p>Portfolio: <a href="https://shaistashabbir-prog.github.io" className="text-indigo-400" target="_blank">shaistashabbir-prog.github.io</a></p>
          </div>
        </section>

      </div>
    </div>
  );
}
