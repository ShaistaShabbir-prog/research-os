"use client";
import Link from "next/link";
import { Check, X } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "€0",
    period: "/forever",
    desc: "Start reviewing today.",
    border: "border-white/8",
    cta: "Start free",
    href: "/supervisor",
    features: [
      "3 supervisor reviews/month",
      "Abstract & section feedback",
      "Basic grammar check",
      "Dataset card generator (3/month)",
      "No account required",
    ],
    missing: ["Review history", "PDF export", "Venue-specific mode", "Reviewer simulation"],
  },
  {
    name: "Student",
    price: "€19",
    period: "/month",
    desc: "For MSc students.",
    border: "border-indigo-500/40",
    featured: true,
    cta: "Start Student plan",
    href: "/auth",
    features: [
      "50 supervisor reviews/month",
      "All 4 review modes",
      "PDF & DOCX upload",
      "Review history & export",
      "50 dataset cards/month",
      "Research Memory extraction",
      "Grammar & writing analysis",
    ],
    missing: ["Venue-specific mode", "Before/after comparison"],
  },
  {
    name: "PhD",
    price: "€29",
    period: "/month",
    desc: "For PhD candidates.",
    border: "border-purple-500/25",
    cta: "Start PhD plan",
    href: "/auth",
    features: [
      "200 reviews/month",
      "All review modes",
      "Venue-specific review",
      "Before/after comparison",
      "200MB document uploads",
      "Full Research Memory graph",
      "Priority support",
    ],
    missing: [],
  },
  {
    name: "Researcher",
    price: "€39",
    period: "/month",
    desc: "For active researchers.",
    border: "border-emerald-500/20",
    cta: "Start Researcher plan",
    href: "/auth",
    features: [
      "Unlimited reviews",
      "500MB storage",
      "API access",
      "All PhD features",
      "LLM-enhanced review",
      "Benchmark tracking",
    ],
    missing: [],
  },
  {
    name: "Lab",
    price: "€199",
    period: "/month",
    desc: "For research groups.",
    border: "border-amber-500/20",
    cta: "Contact us",
    href: "mailto:hello@researchos.io",
    features: [
      "Unlimited reviews",
      "Up to 20 seats",
      "Shared project workspace",
      "2GB storage",
      "Institutional dataset catalogue",
      "All Researcher features",
    ],
    missing: [],
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto pt-10 space-y-12 px-4">
      <div className="text-center space-y-3">
        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Pricing</p>
        <h1 className="text-5xl font-extrabold">Simple, honest pricing.</h1>
        <p className="text-slate-400 max-w-xl mx-auto">No lock-in. Start free — no account required. Upgrade when you need more reviews, modes, or team features.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {PLANS.map(p => (
          <div key={p.name} className={`card border flex flex-col ${p.border} ${p.featured ? "ring-1 ring-indigo-500/30" : ""}`}>
            {p.featured && <div className="text-center mb-3"><span className="badge badge-indigo text-xs">Most popular</span></div>}
            <h3 className="text-lg font-bold">{p.name}</h3>
            <div className="mt-1.5 mb-1">
              <span className="text-3xl font-extrabold">{p.price}</span>
              <span className="text-slate-400 text-sm">{p.period}</span>
            </div>
            <p className="text-xs text-slate-500 mb-5">{p.desc}</p>
            <ul className="space-y-2 flex-1 mb-6">
              {p.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />{f}
                </li>
              ))}
              {p.missing?.map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                  <X className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
            <Link href={p.href} className={`${p.featured ? "btn" : "btn-outline"} w-full justify-center text-sm`}>
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-slate-500">
        University site licence from €5,000/year. &nbsp;
        <a href="mailto:hello@researchos.io" className="text-indigo-400 hover:text-indigo-300">Get in touch →</a>
      </p>
    </div>
  );
}
