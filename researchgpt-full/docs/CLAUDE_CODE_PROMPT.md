# Prompt for Claude Code / Codex

You are building ResearchGPT, a production SaaS AI Research Copilot. Use the provided scaffold.

Tasks:
1. Make the app run locally with Docker Compose.
2. Add real OpenAI and Anthropic provider selection.
3. Implement pgvector embeddings and similarity search.
4. Add Clerk authentication.
5. Add Stripe subscription plans: Student, Researcher, Lab, University.
6. Implement exports: Markdown, LaTeX, DOCX, PDF.
7. Improve dashboard UI with project sidebar, document table, saved agent runs.
8. Add citation-aware generation: every claim should reference uploaded context when possible.
9. Add dataset upload and statistics agent using pandas/scipy.
10. Add tests for API routes and services.

Constraints:
- Keep existing API contracts stable unless clearly improving them.
- Use environment variables for secrets.
- Do not hard-code API keys.
- Maintain clean separation between frontend, backend, prompts, and infra.
- Write readable code suitable for a startup MVP.
