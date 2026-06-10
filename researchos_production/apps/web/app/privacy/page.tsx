"use client";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto pt-12 pb-24 px-4 space-y-10">

      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        <p className="text-slate-400 text-sm">Last updated: June 2026 · GDPR compliant</p>
      </div>

      <div className="space-y-8 text-slate-300 leading-relaxed">

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">Data Controller</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm space-y-1">
            <p><strong>Shaista Shabbir</strong></p>
            <p>TU Dortmund University · Lamarr Institute for ML & AI</p>
            <p>Dortmund, Germany</p>
            <p>Email: <a href="mailto:shaista.s.shabbir@gmail.com" className="text-indigo-400">shaista.s.shabbir@gmail.com</a></p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">What Data We Collect</h2>
          <div className="space-y-3">
            <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4 space-y-1.5">
              <p className="font-semibold text-emerald-300">Free tier (no account)</p>
              <ul className="list-disc pl-5 text-sm text-slate-400 space-y-1">
                <li>Document text submitted for review — processed in memory, not stored</li>
                <li>Anonymous usage analytics (page views, feature usage)</li>
                <li>No personal data collected</li>
              </ul>
            </div>
            <div className="bg-indigo-500/8 border border-indigo-500/20 rounded-xl p-4 space-y-1.5">
              <p className="font-semibold text-indigo-300">Registered accounts (paid plans)</p>
              <ul className="list-disc pl-5 text-sm text-slate-400 space-y-1">
                <li>Email address (authentication only)</li>
                <li>Review history (stored locally in your browser)</li>
                <li>Payment information (processed by Stripe — we do not store card data)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-400">
            <li>To provide supervisor review, dataset, and research memory services</li>
            <li>To improve the heuristic review engine (anonymised, aggregated only)</li>
            <li>We do NOT sell your data to third parties</li>
            <li>We do NOT use your research content for AI training</li>
            <li>We do NOT send your documents to LLM providers without your explicit opt-in</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">Your Rights (GDPR)</h2>
          <p>Under GDPR, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-400">
            <li><strong className="text-white">Access</strong> — Request a copy of your personal data</li>
            <li><strong className="text-white">Rectification</strong> — Correct inaccurate data</li>
            <li><strong className="text-white">Erasure</strong> — Request deletion of your data</li>
            <li><strong className="text-white">Portability</strong> — Export your data</li>
            <li><strong className="text-white">Objection</strong> — Object to processing</li>
          </ul>
          <p className="text-sm">To exercise any right: <a href="mailto:shaista.s.shabbir@gmail.com" className="text-indigo-400">shaista.s.shabbir@gmail.com</a></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">Cookies</h2>
          <p>ResearchOS uses minimal cookies for session management only. We do not use advertising or tracking cookies. Review history is stored in your browser&apos;s localStorage — never on our servers.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">Data Retention</h2>
          <p>Free tier: document text is not retained after your session. Account data is retained for the duration of your subscription plus 30 days after cancellation.</p>
        </section>

      </div>
    </div>
  );
}
