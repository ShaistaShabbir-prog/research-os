<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=200&section=header&text=ResearchOS&fontSize=60&fontColor=fff&animation=twinkling&fontAlignY=38&desc=The%20Operating%20System%20for%20Modern%20Research&descAlignY=58&descSize=18" width="100%"/>

<br/>

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python%203.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![SQLite](https://img.shields.io/badge/SQLite%20%7C%20Postgres-003B57?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)

<br/>

[![Tests](https://img.shields.io/badge/Tests-9%20passing-22c55e?style=flat-square&logo=pytest&logoColor=white)](https://github.com/ShaistaShabbir-prog/research-os/actions)
[![License](https://img.shields.io/badge/License-MIT-a855f7?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ec4899?style=flat-square)](https://github.com/ShaistaShabbir-prog/research-os/pulls)
[![Made by](https://img.shields.io/badge/Made%20by-Shaista%20Shabbir-7c3aed?style=flat-square)](https://shaistashabbir-prog.github.io)

</div>

---

## 🧠 What is ResearchOS?

> **ResearchOS does not ghostwrite. It reviews, audits, structures, and helps researchers improve their own work — ethically.**

ResearchOS is a **research workflow SaaS** built for MSc students, PhD candidates, research associates, supervisors, and research groups. It combines three tightly integrated tools:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Phase 1 ──► AI Supervisor      Structured critique of         │
│               (Live)             thesis, paper, results, viva   │
│                                                                 │
│   Phase 2 ──► Dataset Hub        Dataset card generation +      │
│               (Live)             reproducibility scoring        │
│                                                                 │
│   Phase 3 ──► Knowledge Graph    Extract methods, datasets,     │
│               (Beta)             institutions → memory graph    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🎓 AI Supervisor
- **6-dimension heuristic scoring** — Structure, Citation Support, Methodological Rigor, Novelty Framing, Reproducibility, Academic Writing
- **4 review modes** — Supervisor review · Peer reviewer · Viva/defense prep · Results audit
- **Structured output** — Overall score, decision, major concerns, minor concerns, supervisor comments, defense questions, next actions
- **Section detection** — Automatically identifies Abstract, Introduction, Methodology, Results, Discussion, Limitations, Conclusion, References
- Works **offline** with heuristics; plug in any LLM API key for deeper AI critique

### 📊 Dataset Hub
- **Dataset card generation** — name, domain, abstract, file inventory, license, metadata requirements, ethical considerations
- **Reproducibility scoring** — 100-point checklist: data files, README, environment, license, schema, citation metadata
- Covers formats: CSV, JSON, Parquet, NPZ, H5, ZIP, Python, Jupyter, R

### 🕸️ Knowledge Graph
- **Entity extraction** — methods (CNN, LSTM, BERT...), datasets, institutions
- **Relation mapping** — USES_METHOD, USES_DATASET, AFFILIATED_WITH
- Neo4j-ready node/edge export for persistent graph memory

---

## 🚀 Quick Start

### Option 1 — Full stack with Docker (recommended)

```bash
git clone https://github.com/ShaistaShabbir-prog/research-os.git
cd research-os/researchos_production
cp .env.example .env
docker compose up --build
```

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:3000 |
| ⚡ API | http://localhost:8000 |
| 📚 API Docs | http://localhost:8000/docs |
| 🗄️ MinIO | http://localhost:9001 |
| 🔴 Neo4j | http://localhost:7474 |

### Option 2 — Local development (no Docker)

**Backend:**
```bash
cd researchos_production/apps/api
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd researchos_production/apps/web
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

**Run tests:**
```bash
cd researchos_production/apps/api
PYTHONPATH=. python -m pytest app/tests/ -v
# 9 passed ✅
```

---

## 🏗️ Architecture

```
researchos_production/
│
├── apps/
│   ├── api/                          # FastAPI backend (Python 3.12)
│   │   ├── app/
│   │   │   ├── main.py               # App entry point, lifespan, CORS
│   │   │   ├── api/
│   │   │   │   └── routes.py         # All API endpoints
│   │   │   ├── core/
│   │   │   │   ├── config.py         # Pydantic settings (env vars)
│   │   │   │   └── db.py             # SQLAlchemy engine + session
│   │   │   ├── models/
│   │   │   │   └── entities.py       # ORM: User, Project, Document, Review, Dataset, Graph
│   │   │   ├── schemas/
│   │   │   │   └── api.py            # Pydantic request/response models
│   │   │   ├── services/
│   │   │   │   ├── supervisor_engine.py   ← core heuristic scorer
│   │   │   │   ├── dataset_engine.py      ← card generator + repro check
│   │   │   │   ├── graph_engine.py        ← entity/relation extractor
│   │   │   │   ├── text_extract.py        ← PDF + DOCX + plain text
│   │   │   │   ├── llm/                   ← OpenAI / Anthropic / Gemini
│   │   │   │   ├── auth/                  ← multi-tenant isolation
│   │   │   │   ├── billing/               ← plan limits
│   │   │   │   └── storage/               ← S3 / MinIO
│   │   │   ├── utils/
│   │   │   │   ├── limits.py         # Plan-based rate limits
│   │   │   │   └── redaction.py      # PII redaction
│   │   │   ├── workers/
│   │   │   │   ├── celery_app.py     # Celery + Redis background tasks
│   │   │   │   └── tasks.py          # Async review/dataset jobs
│   │   │   └── tests/
│   │   │       └── test_engines.py   # 9 tests, all passing ✅
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   └── web/                          # Next.js 15 frontend (TypeScript + Tailwind 3)
│       ├── app/
│       │   ├── page.tsx              # Landing page
│       │   ├── supervisor/           # AI Supervisor review UI
│       │   ├── datasets/             # Dataset Hub UI
│       │   ├── graph/                # Knowledge Graph UI
│       │   ├── pricing/              # Pricing page
│       │   ├── dashboard/            # User dashboard
│       │   └── auth/                 # Login / signup
│       ├── components/
│       │   ├── Nav.tsx               # Sticky nav with mobile menu
│       │   └── ScoreCard.tsx         # Reusable metric card
│       ├── lib/
│       │   └── api.ts                # Typed API client
│       └── Dockerfile
│
├── docker-compose.yml                # Full stack: API + Web + Postgres + Redis + MinIO + Qdrant + Neo4j
├── .env.example                      # All environment variables documented
│
├── docs/
│   ├── PRODUCT_PRD.md                # Product requirements
│   ├── ARCHITECTURE.md               # System design
│   ├── BUSINESS_STRATEGY.md          # Positioning, pricing, moat
│   ├── ROADMAP.md                    # Feature roadmap
│   ├── LAUNCH_PLAN.md                # Go-to-market plan
│   ├── SECURITY_CHECKLIST.md         # Security requirements
│   └── COMPLIANCE_PRIVACY.md         # GDPR / privacy notes
│
├── packages/
│   ├── prompts/                      # Reusable LLM system prompts
│   └── shared/                       # Shared schema definitions
│
└── infra/
    └── nginx/                        # Nginx reverse proxy config
```

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/projects` | Create a project |
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/documents/upload` | Upload PDF/DOCX/TXT |
| `POST` | `/api/supervisor/review` | Run supervisor review |
| `POST` | `/api/datasets/card` | Generate dataset card |
| `POST` | `/api/graph/ingest` | Extract knowledge graph |

**Full interactive docs:** `http://localhost:8000/docs` (Swagger UI)

### Example — Supervisor Review

```bash
curl -X POST http://localhost:8000/api/supervisor/review \
  -H "Content-Type: application/json" \
  -d '{
    "document_text": "Abstract\nThis paper proposes a novel CNN-based approach...",
    "mode": "supervisor",
    "discipline": "computer science"
  }'
```

```json
{
  "overall_score": 7.4,
  "report": {
    "decision": "Revise before submission",
    "scores": [
      {"name": "Structure", "value": 8.2, "rationale": "..."},
      {"name": "Citation support", "value": 6.8, "rationale": "..."},
      {"name": "Methodological rigor", "value": 7.5, "rationale": "..."},
      {"name": "Novelty framing", "value": 7.0, "rationale": "..."},
      {"name": "Reproducibility", "value": 6.5, "rationale": "..."},
      {"name": "Academic writing", "value": 8.4, "rationale": "..."}
    ],
    "major_concerns": ["..."],
    "minor_concerns": ["..."],
    "defense_questions": ["..."],
    "next_actions": ["..."]
  }
}
```

---

## 💰 Pricing

| Plan | Price | Reviews/month | Storage | Seats |
|------|-------|--------------|---------|-------|
| **Free** | €0 | 3 | — | 1 |
| **Student** | €9/mo | 50 | 50MB | 1 |
| **PhD** | €19/mo | 200 | 200MB | 1 |
| **Researcher** | €39/mo | Unlimited | 500MB | 1 |
| **Lab** | €199/mo | Unlimited | 2GB | 20 |
| **University** | €5k–€50k/yr | Unlimited | Custom | Unlimited |

---

## ☁️ Deploy to Production

### Frontend → Vercel (free tier works)

```
1. Go to vercel.com → Add New Project
2. Import: ShaistaShabbir-prog/research-os
3. Root Directory: researchos_production/apps/web
4. Environment variable: NEXT_PUBLIC_API_BASE_URL=https://your-api.railway.app
5. Deploy ✅
```

### Backend → Railway

```
1. railway.app → New Project → Deploy from GitHub
2. Root Directory: researchos_production/apps/api
3. Add env vars from .env.example
4. Railway auto-detects Dockerfile → deploys ✅
```

### Backend → Render (alternative)

```
Build Command:  pip install -r requirements.txt
Start Command:  uvicorn app.main:app --host 0.0.0.0 --port $PORT
Root:           researchos_production/apps/api
```

### Database

For production, replace SQLite with **Railway Postgres** or **Supabase**:
```env
DATABASE_URL=postgresql+psycopg://user:password@host:5432/researchos
```

---

## 🧪 Test Results

```
$ PYTHONPATH=. python -m pytest app/tests/ -v

test_supervisor_returns_all_fields    PASSED ✅
test_supervisor_score_range           PASSED ✅
test_supervisor_detects_sections      PASSED ✅
test_supervisor_defense_mode          PASSED ✅
test_dataset_card_fields              PASSED ✅
test_reproducibility_good             PASSED ✅
test_reproducibility_poor             PASSED ✅
test_graph_extracts_methods           PASSED ✅
test_graph_has_edges                  PASSED ✅

========================= 9 passed in 0.04s =========================
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI 0.115 · SQLAlchemy 2 · Pydantic 2 · Python 3.12 |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **Frontend** | Next.js 15 · TypeScript · Tailwind CSS 3 · Lucide Icons |
| **Background** | Celery + Redis |
| **Storage** | MinIO / S3-compatible |
| **Vector DB** | Qdrant |
| **Graph DB** | Neo4j 5 |
| **Auth** | JWT (dev) / Clerk or Auth0 (prod) |
| **Payments** | Stripe |
| **CI** | GitHub Actions |
| **Deploy** | Vercel (frontend) + Railway/Render (backend) |

---

## 🗺️ Roadmap

- [x] Heuristic supervisor engine (9/9 tests passing)
- [x] Dataset card + reproducibility scoring
- [x] Knowledge graph extraction
- [x] PDF/DOCX text extraction
- [x] REST API with FastAPI
- [x] Next.js frontend with full UI
- [x] Docker Compose full stack
- [x] CI pipeline (GitHub Actions)
- [ ] LLM-enhanced review (Claude/GPT/Gemini integration)
- [ ] User authentication (Clerk/Auth0)
- [ ] Stripe billing integration
- [ ] File upload to S3/MinIO
- [ ] Celery background jobs for long reviews
- [ ] Qdrant semantic search over documents
- [ ] Neo4j persistent knowledge graph
- [ ] Benchmark comparison against Papers With Code
- [ ] Institutional dashboard and API access
- [ ] GDPR export/delete workflows

---

## 🤝 Contributing

```bash
# Fork → clone → branch → commit → PR
git checkout -b feat/your-feature
# Make changes
PYTHONPATH=. python -m pytest app/tests/ -v  # all must pass
git commit -m "feat: your feature"
git push origin feat/your-feature
# Open PR on GitHub
```

---

## ⚠️ Important Notes

> This is a production-ready **foundation**, not a legally audited academic compliance product.
> Before selling to universities, conduct:
> - Legal review for your jurisdiction
> - Security penetration testing
> - DPIA / GDPR review (`docs/security/GDPR_DPIA_TEMPLATE.md`)
> - Institutional data-processing agreements

---

## 👩‍🔬 Created By

**Shaista Shabbir**
Research Associate · TU Dortmund University · Lamarr Institute for ML & AI

[![Portfolio](https://img.shields.io/badge/Portfolio-shaistashabbir--prog.github.io-7c3aed?style=flat-square&logo=github)](https://shaistashabbir-prog.github.io)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/shaista-shabbir-a32a6b210)
[![ResearchGate](https://img.shields.io/badge/ResearchGate-Profile-00CCBB?style=flat-square&logo=researchgate)](https://www.researchgate.net/profile/Shaista-Shabbir)

---

<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=100&section=footer" width="100%"/>
<sub>ResearchOS · Ethical research feedback · Dataset reproducibility · Knowledge graph memory</sub>
</div>
