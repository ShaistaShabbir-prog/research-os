import { NextResponse } from "next/server";
import { FAQS, findLocalAnswer } from "@/lib/chatbot-knowledge";

const SYSTEM = `You are the ResearchOS product assistant. Answer only from the supplied ResearchOS FAQs and current-page context. Be concise and precise. Never fabricate platform features, research facts, citations, or results. Do not ghostwrite research.`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 1000) : "";
  const pageContext = typeof body.pageContext === "string" ? body.pageContext.slice(0, 12000) : "";
  if (!message) return NextResponse.json({ error: "A message is required." }, { status: 400 });

  const local = findLocalAnswer(message, pageContext);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ ...local, mode: "local" });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 450,
      system: SYSTEM,
      messages: [{ role: "user", content: `Question: ${message}\n\nFAQs:\n${FAQS.map((faq) => `${faq.question}\n${faq.answer}\nSource: ${faq.href}`).join("\n\n")}\n\nCurrent page:\n${pageContext}` }],
    }),
  });
  if (!response.ok) return NextResponse.json({ ...local, mode: "local", warning: "Claude unavailable." });
  const data = await response.json();
  const answer = data.content?.find((item: { type?: string }) => item.type === "text")?.text;
  return NextResponse.json({ answer: answer || local.answer, sources: local.sources, mode: "claude" });
}
