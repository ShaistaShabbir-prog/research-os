<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=200&section=header&text=ResearchOS&fontSize=60&fontColor=fff&animation=twinkling&fontAlignY=38&desc=Your%20AI%20Research%20Supervisor&descAlignY=58&descSize=18" width="100%"/>

<br/>

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python%203.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

<br/>

[![Live](https://img.shields.io/badge/🌐%20Live-research--os--phi.vercel.app-7c3aed?style=flat-square)](https://research-os-phi.vercel.app)
[![API](https://img.shields.io/badge/⚡%20API-researchos--api--8zqh.onrender.com-059669?style=flat-square)](https://researchos-api-8zqh.onrender.com/api/health)
[![Tests](https://img.shields.io/badge/Tests-9%20passing-22c55e?style=flat-square)](https://github.com/ShaistaShabbir-prog/research-os/actions)
[![Made by](https://img.shields.io/badge/Made%20by-Shaista%20Shabbir-a855f7?style=flat-square)](https://shaistashabbir-prog.github.io)

</div>

---

## 🎓 What is ResearchOS?

> **ResearchOS does not ghostwrite. It reviews, audits, and helps researchers improve their own work — ethically.**

**ResearchOS is your AI Research Supervisor.**

Upload your thesis, paper, proposal, dataset, or research project and receive structured supervisor-style feedback, reproducibility checks, reviewer simulation, and research memory.

```
ResearchOS
├── AI Supervisor     ← Structured critique, 6 dimensions, 4 modes
├── Dataset Hub       ← Dataset cards, reproducibility scoring
└── Research Memory   ← Methods, datasets, institutions — extracted & connected
```

### Who it is for

| User | What they get |
|------|--------------|
| 🎓 MSc Students | Thesis feedback, structure review, defense preparation |
| 🎓 PhD Candidates | Literature review, methodology critique, reviewer simulation |
| 🔬 Research Associates | Paper review, reproducibility audits, dataset documentation |
| 🏛️ Universities & Labs | Scalable supervision support, research quality workflows |

---

## ✨ Features

### 🎓 AI Supervisor — 6 Review Dimensions
Every review scores across 6 dimensions:

| Dimension | What it checks |
|-----------|---------------|
| **Structure** | Are all required sections present and well-ordered? |
| **Citation support** | Are claims supported by appropriate references? |
| **Methodological rigor** | Are baselines, metrics, and validation protocols adequate? |
| **Novelty framing** | Is the contribution and research gap clearly stated? |
| **Reproducibility** | Can the work be independently verified and replicated? |
| **Academic writing** | Is the register, tone, and clarity appropriate? |

**4 Review modes:** Supervisor · Peer reviewer · Viva/defense prep · Results audit

**Context-aware:** Abstract gets abstract feedback. Full paper gets full critique.

**Venue-specific:** NeurIPS · IEEE · Nature · ACM · PLOS · PhD Thesis

### 📊 Dataset Hub
- Dataset card generation
- Reproducibility scoring (100-point checklist)
- Covers: CSV, JSON, Parquet, Python, Jupyter, R

### 🧠 Research Memory
- Extract methods (CNN, LSTM, BERT...), datasets, institutions
- Relation mapping: USES\_METHOD, USES\_DATASET, AFFILIATED\_WITH

### 📝 Grammar & Writing Check (Grammarly-style)
- Article errors, passive voice, weak words, punctuation
- Missing citation detection
- Tone and first-person opinion check
- Live — activates as you type

### 🆕 New Features
- **Before/after comparison** — paste v1 and v2, see score diff per dimension
- **Review history** — last 20 reviews with progress tracking
- **Export to Markdown** — download full review report
- **Venue-specific feedback** — calibrated to NeurIPS, IEEE, Nature, ACM

---

## 🚀 Quick Start

### Docker (recommended)
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

### Local Development
```bash
# Backend
cd researchos_production/apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd researchos_production/apps/web
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev

# Tests
PYTHONPATH=. python -m pytest app/tests/ -v
# 9 passed ✅
```

---

## 🌐 Live URLs

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | [research-os-phi.vercel.app](https://research-os-phi.vercel.app) | ✅ Live |
| **Backend API** | [researchos-api-8zqh.onrender.com](https://researchos-api-8zqh.onrender.com) | ✅ Live |
| **API Docs** | [researchos-api-8zqh.onrender.com/docs](https://researchos-api-8zqh.onrender.com/docs) | ✅ Live |
| **Health check** | [/api/health](https://researchos-api-8zqh.onrender.com/api/health) | ✅ `{"status":"ok"}` |

> ⚠️ Free tier: Backend may take ~30s to wake up on first request.

---

## 🏗️ Architecture

```
researchos_production/
├── apps/
│   ├── api/                    FastAPI backend (Python 3.12)
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── api/routes.py   6 endpoints
│   │   │   ├── core/           config, db (SQLite → Postgres)
│   │   │   ├── models/         SQLAlchemy ORM
│   │   │   ├── schemas/        Pydantic models
│   │   │   └── services/
│   │   │       ├── supervisor_engine.py  ← core heuristic scorer
│   │   │       ├── dataset_engine.py
│   │   │       ├── graph_engine.py
│   │   │       └── text_extract.py
│   │   └── tests/test_engines.py  9/9 passing ✅
│   └── web/                    Next.js 15 (TypeScript + Tailwind 3)
│       ├── app/
│       │   ├── page.tsx         Landing page — problem-centric
│       │   ├── supervisor/      AI Supervisor — 4 tabs
│       │   ├── datasets/        Dataset Hub
│       │   ├── graph/           Research Memory
│       │   └── pricing/         5 tiers
│       ├── components/Nav.tsx
│       └── lib/
│           ├── api.ts           Typed API client
│           └── grammar.ts       Grammarly-style checker
├── docker-compose.yml
├── .env.example
└── render.yaml
```

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/projects` | Create project |
| `GET` | `/api/projects` | List projects |
| `POST` | `/api/documents/upload` | Upload PDF/DOCX/TXT |
| `POST` | `/api/supervisor/review` | Run supervisor review |
| `POST` | `/api/datasets/card` | Generate dataset card |
| `POST` | `/api/graph/ingest` | Extract research memory |

### Example
```bash
curl -X POST https://researchos-api-8zqh.onrender.com/api/supervisor/review \
  -H "Content-Type: application/json" \
  -d '{"document_text": "Abstract\nThis paper proposes...", "mode": "supervisor", "discipline": "engineering"}'
```

---

## 💰 Pricing

| Plan | Price | Reviews/month |
|------|-------|--------------|
| Free | €0 | 3 |
| Student | €19/mo | 50 |
| PhD | €29/mo | 200 |
| Researcher | €39/mo | Unlimited |
| Lab | €199/mo | Unlimited + 20 seats |
| University | Custom | Site licence |

---

## 🧪 Tests

```
PYTHONPATH=. python -m pytest app/tests/ -v

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

## 👩‍🔬 Created By

**Shaista Shabbir** — Research Associate · TU Dortmund University · Lamarr Institute for ML & AI

[![Portfolio](https://img.shields.io/badge/Portfolio-shaistashabbir--prog.github.io-7c3aed?style=flat-square)](https://shaistashabbir-prog.github.io)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/shaista-shabbir-a32a6b210)
[![ResearchGate](https://img.shields.io/badge/ResearchGate-Profile-00CCBB?style=flat-square&logo=researchgate)](https://www.researchgate.net/profile/Shaista-Shabbir)

---

<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=100&section=footer" width="100%"/>
<sub>ResearchOS · Never ghostwrites · Reviews, audits, and helps researchers improve their own work ethically</sub>
</div>
