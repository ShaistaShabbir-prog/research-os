export interface Faq {
  question: string;
  answer: string;
  keywords: string[];
  href: string;
}

export const FAQS: Faq[] = [
  { question: "What does the AI Supervisor review?", answer: "The AI Supervisor reviews structure, citations, methodology, novelty, reproducibility, and writing. It provides critique and improvement guidance; it does not replace a human supervisor or peer review.", keywords: ["supervisor", "review", "structure", "citation", "methodology", "novelty", "writing"], href: "/supervisor" },
  { question: "What is the Dataset Hub?", answer: "The Dataset Hub organizes dataset cards and reproducibility information so researchers can document data provenance, access, licensing, and reuse conditions.", keywords: ["dataset", "data", "reproducibility", "card", "provenance"], href: "/datasets" },
  { question: "What is Research Memory?", answer: "Research Memory extracts and connects methods, datasets, institutions, and other entities from research material to help build a structured project knowledge graph.", keywords: ["memory", "graph", "entity", "method", "institution", "paper"], href: "/graph" },
  { question: "Does ResearchOS write my paper?", answer: "No. ResearchOS is designed to review, audit, and explain your own work rather than ghostwrite research. You remain responsible for authorship, claims, citations, and compliance with your institution's AI policy.", keywords: ["write", "ghostwrite", "paper", "thesis", "authorship", "ethics"], href: "/terms" },
  { question: "Can I export a report?", answer: "ResearchOS includes report and review-history workflows. Open the reports area to see the outputs available for your project.", keywords: ["export", "report", "download", "history", "result"], href: "/reports" },
];

export const STARTERS = FAQS.slice(0, 4).map((faq) => faq.question);
const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

export function findLocalAnswer(question: string, pageContext = "") {
  const tokens = normalize(question).split(" ").filter((token) => token.length > 2);
  const ranked = FAQS.map((faq) => ({
    faq,
    score: tokens.reduce((score, token) => score + (normalize(`${faq.question} ${faq.answer} ${faq.keywords.join(" ")}`).includes(token) ? 1 : 0), 0),
  })).sort((a, b) => b.score - a.score);
  if (ranked[0]?.score > 0) return { answer: ranked[0].faq.answer, sources: [{ label: ranked[0].faq.question, href: ranked[0].faq.href }] };

  const matches = pageContext.split(/(?<=[.!?])\s+/).map((sentence) => ({
    sentence: sentence.trim(),
    score: tokens.reduce((score, token) => score + (normalize(sentence).includes(token) ? 1 : 0), 0),
  })).filter((item) => item.score > 0 && item.sentence.length > 35 && item.sentence.length < 320).sort((a, b) => b.score - a.score).slice(0, 2);
  if (matches.length) return { answer: `Based on this page: ${matches.map((item) => item.sentence).join(" ")}`, sources: [{ label: "Current website page", href: "" }] };
  return { answer: "I could not find that in the ResearchOS FAQs or on this page. Ask about supervisor reviews, datasets, research memory, reports, or research ethics.", sources: [] };
}
