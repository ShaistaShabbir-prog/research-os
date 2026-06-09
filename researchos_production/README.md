# ResearchOS

**The operating system for modern research.**

AI Supervisor · Dataset Hub · Research Knowledge Graph

---

## What it does

| Tool | Status | Purpose |
|---|---|---|
| AI Supervisor | ✅ Live | Structured supervisor-style critique of thesis, paper, exposé, results, viva |
| Dataset Hub | ✅ Live | Dataset card generation + reproducibility scoring |
| Knowledge Graph | 🔵 Beta | Extract methods, datasets, institutions → build research memory graph |

**Core principle:** ResearchOS does not ghostwrite. It reviews, audits, and helps researchers improve their own work ethically.

---

## Quick start (local)

```bash
git clone https://github.com/ShaistaShabbir-prog/research-os.git
cd research-os/researchos_production
cp .env.example .env
docker compose up --build
```

Open:
- **Frontend:** http://localhost:3000
- **API docs:** http://localhost:8000/docs
- **API health:** http://localhost:8000/api/health

---

## Local development (no Docker)

**Backend (FastAPI):**
```bash
cd researchos_production/apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. uvicorn app.main:app --reload
```

**Frontend (Next.js):**
```bash
cd researchos_production/apps/web
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

**Run tests:**
```bash
cd researchos_production/apps/api
PYTHONPATH=. python -m pytest app/tests/ -v
```

---

## Deploy to production

### Frontend → Vercel (recommended)
1. Connect `ShaistaShabbir-prog/research-os` to [vercel.com](https://vercel.com)
2. Set root directory: `researchos_production/apps/web`
3. Add env var: `NEXT_PUBLIC_API_BASE_URL=https://your-api.railway.app`
4. Deploy

### Backend → Railway (recommended)
1. New project → deploy from GitHub
2. Set root directory: `researchos_production/apps/api`
3. Add env vars from `.env.example`
4. Railway auto-detects Dockerfile

### Backend → Render
1. New Web Service → connect repo
2. Root: `researchos_production/apps/api`
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## Architecture

```
researchos_production/
├── apps/
│   ├── api/               FastAPI backend (Python 3.12)
│   │   ├── app/
│   │   │   ├── api/       routes.py — all API endpoints
│   │   │   ├── core/      config.py, db.py
│   │   │   ├── models/    SQLAlchemy ORM entities
│   │   │   ├── schemas/   Pydantic request/response models
│   │   │   ├── services/  supervisor_engine, dataset_engine, graph_engine
│   │   │   └── tests/     pytest test suite (9 tests, all passing)
│   │   └── requirements.txt
│   └── web/               Next.js 15 frontend (TypeScript, Tailwind 3)
│       ├── app/           Pages: /, /supervisor, /datasets, /graph, /pricing, /auth
│       ├── components/    Nav, ScoreCard
│       └── lib/api.ts     Typed API client
├── docker-compose.yml     Full stack: API + Web + Postgres + Redis + MinIO + Qdrant + Neo4j
├── .env.example           All environment variables documented
└── docs/                  PRD, architecture, business strategy, roadmap
```

---

## Pricing

| Plan | Price | Reviews/month |
|---|---|---|
| Free | €0 | 3 |
| Student | €9/month | 50 |
| PhD | €19/month | 200 |
| Researcher | €39/month | Unlimited |
| Lab | €199/month | Unlimited + 20 seats |
| University | €5,000–€50,000/year | Site licence |

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | FastAPI 0.115, SQLAlchemy 2, Pydantic 2, Python 3.12 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Frontend | Next.js 15, TypeScript, Tailwind CSS 3 |
| Infra | Docker Compose, Redis, MinIO, Qdrant, Neo4j |
| CI | GitHub Actions (API tests + frontend build) |
| Deploy | Vercel (frontend) + Railway/Render (backend) |

---

## Created by

**Shaista Shabbir** — Research Associate, TU Dortmund University & Lamarr Institute  
[shaistashabbir-prog.github.io](https://shaistashabbir-prog.github.io) · [LinkedIn](https://www.linkedin.com/in/shaista-shabbir-a32a6b210)
