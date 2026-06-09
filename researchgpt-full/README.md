# ResearchGPT — AI Research Copilot Platform

A launch-ready MVP scaffold for an AI Research Copilot for MSc students, PhD researchers, supervisors, labs, and universities.

## What is included

- Next.js 15 frontend with dashboard, upload workspace, agents, pricing, auth placeholders
- FastAPI backend with project, document, agent, dataset, export, and billing APIs
- PostgreSQL + pgvector-ready schema via SQLAlchemy
- RAG pipeline skeleton: PDF parsing, chunking, embeddings interface, retrieval, citations
- AI agent prompts for literature review, thesis feedback, paper writing, reviewer simulation, rebuttal, exposé, statistics, and LaTeX
- Docker Compose for local development
- Stripe/Clerk/Supabase integration placeholders
- University licensing architecture notes

## Quick Start

```bash
cp .env.example .env
make dev
```

Frontend: http://localhost:3000  
Backend API: http://localhost:8000/docs

## MVP Scope

This version is designed for fast development with Claude Code/Codex. It contains working architecture, API contracts, data models, UI pages, and agent orchestration patterns. Add your real API keys in `.env` and connect production services before launch.

## Product Modules

1. Research Workspace
2. PDF Upload and RAG
3. Literature Review Agent
4. Thesis Supervisor Agent
5. Paper Writing Agent
6. Reviewer Agent
7. Rebuttal Agent
8. Exposé Generator
9. Statistics Agent
10. LaTeX Agent
11. Citation Agent
12. Pricing / Subscription
13. University Workspace

## Recommended Next Steps

1. Add OpenAI/Claude API keys.
2. Run database migrations.
3. Connect file storage.
4. Add authentication with Clerk.
5. Deploy web to Vercel and API to Railway/Fly.io.
6. Test with 10 real MSc/PhD users.
