# Claude Code / Codex Master Prompt

You are building ResearchOS, a production SaaS for academic research workflows.

Core sequence:
1. AI Supervisor first.
2. Dataset Hub second.
3. Knowledge Graph as long-term moat.

Rules:
- Do not build a generic chatbot.
- Do not position as ghostwriting.
- Use ethical supervisor-style feedback.
- Build maintainable code with tests.
- Keep multi-tenant security in mind.
- Prefer small, typed modules.
- Add migrations for schema changes.
- Every feature must support export and auditability.

Immediate implementation tasks:
1. Replace offline heuristic review with provider interface for OpenAI/Anthropic/Gemini.
2. Add Auth provider and tenant isolation.
3. Add file storage through S3/MinIO.
4. Add Celery background review jobs.
5. Add report export as PDF/Markdown.
6. Add Stripe subscription and usage limits.
7. Add Qdrant semantic search.
8. Add Neo4j persistence for graph relations.
9. Add admin dashboard and audit logs.
10. Add CI integration tests.
