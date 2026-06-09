# ResearchOS

ResearchOS is a production-oriented monorepo for a research workflow SaaS:

1. **AI Supervisor** — launch-first product for thesis, exposé, paper, and results feedback.
2. **Academic Dataset Hub** — launch-second product for dataset cards, reproducibility checks, and benchmark records.
3. **Research Knowledge Graph** — long-term moat that links papers, datasets, methods, authors, institutions, and results.

This repository is designed as a serious SaaS starter: Dockerized FastAPI backend, Next.js frontend, Postgres, Redis, Qdrant, Neo4j, object storage, CI, tests, prompt packs, API schema, product docs, and deployment notes.

> Important: This is a production-ready foundation, not a legally audited medical/education compliance product. Before selling to universities, add legal review, security review, DPIA/GDPR review, and institutional data-processing agreements.

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

Open:

- Web: http://localhost:3000
- API: http://localhost:8000/docs
- MinIO: http://localhost:9001
- Neo4j: http://localhost:7474

## Local backend only

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Local frontend only

```bash
cd apps/web
npm install
npm run dev
```

## Core modules

- `apps/api/app/services/supervisor_engine.py` — supervisor/reviewer scoring and optional LLM review.
- `apps/api/app/services/dataset_engine.py` — dataset card generation and reproducibility scoring.
- `apps/api/app/services/graph_engine.py` — knowledge graph extraction and Neo4j-ready relations.
- `packages/prompts` — reusable system prompts for Claude/Codex/LLM providers.
- `docs` — PRD, architecture, roadmap, pricing, moat, launch plan, privacy.

## Production checklist

- Set strong `SECRET_KEY` and provider API keys.
- Use managed Postgres, Redis, S3-compatible storage, Qdrant, Neo4j.
- Configure HTTPS and CORS with production domains only.
- Add real authentication provider: Clerk/Auth0/Keycloak.
- Add Stripe webhooks.
- Add malware scanning for uploads.
- Add GDPR consent, DPA, retention policies, export/delete workflows.
- Add background workers for long document/dataset jobs.
