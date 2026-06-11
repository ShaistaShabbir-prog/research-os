<div align="center">

<h1>📚 ResearchOS</h1>

<p><strong>The Research Quality Platform</strong><br>
Structured feedback · Reviewer simulation · Reproducibility scoring · Research memory</p>

[![Live](https://img.shields.io/badge/🌐_Live-research--os--phi.vercel.app-7C3AED?style=for-the-badge)](https://research-os-phi.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python_3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](./LICENSE)

</div>

---

## What is ResearchOS?

ResearchOS is **not** an AI supervisor or thesis writer.

ResearchOS is a **Research Quality Platform** that helps students, researchers, and supervisors identify weaknesses in papers, theses, datasets, and research workflows — **before they become reviewer comments.**

> Built by researchers at TU Dortmund · Lamarr Institute for ML & AI · University of Hamburg

---

## 🌐 Live

| Service | URL |
|---|---|
| Frontend | [research-os-phi.vercel.app](https://research-os-phi.vercel.app) |
| Backend API | [researchos-api-8zqh.onrender.com](https://researchos-api-8zqh.onrender.com) |
| API Docs | [/docs](https://researchos-api-8zqh.onrender.com/docs) |

---

## ✨ Features

### 🎓 AI Supervisor (Core module)
- **6-dimension structured review:** Structure · Citations · Methodology · Novelty · Reproducibility · Academic Writing
- **Venue-specific feedback:** NeurIPS · IEEE · Nature · ACM · PLOS · Thesis
- **Reviewer simulation** — see how 3 reviewers would evaluate your work
- **Before/after comparison** — track improvement across revisions
- **Context-aware** — abstract gets abstract feedback, full paper gets full critique
- **Review history** — saved to localStorage

### 📁 Dataset Hub
- Dataset card generation
- Reproducibility scoring (0–100)
- Metadata completeness audit
- Missing field warnings and documentation recommendations

### 🧠 Research Memory (Beta)
- Extract methods, datasets, institutions, results from documents
- Preserve institutional knowledge across research groups
- Knowledge graph visualization

### ✒️ Originality Check
- Self-repetition detection
- Boilerplate phrase detection
- Generic claim identification
- Severity scoring (high/medium/low)

### 🤖 AI Chatbot
- Claude-powered research assistant
- Context-aware answers grounded in active platform modules
- Bottom-left floating widget on all pages

### 🔒 Admin Dashboard (`/admin`)
Password protected (`researchos2026` default, env `NEXT_PUBLIC_ADMIN_PASSWORD`)
- Review analytics · Dataset hub · Research memory · API status · Settings

---

## 🏗️ Architecture

```
researchos_production/
├── apps/
│   ├── web/                  # Next.js 15 frontend
│   │   ├── app/
│   │   │   ├── page.tsx          # Homepage — problem-centric positioning
│   │   │   ├── supervisor/       # AI Supervisor review module
│   │   │   ├── datasets/         # Dataset Hub
│   │   │   ├── graph/            # Research Memory (knowledge graph)
│   │   │   ├── plagiarism/       # Originality checker
│   │   │   ├── pricing/          # Pricing page
│   │   │   ├── admin/            # Admin dashboard
│   │   │   └── api/              # Next.js API routes
│   │   └── components/
│   │       ├── Nav.tsx           # Navigation with module badges
│   │       ├── Chatbot.tsx       # Claude AI assistant
│   │       └── AdminGuard.tsx    # Password auth HOC
│   └── api/                  # FastAPI backend
│       └── app/
│           ├── main.py           # FastAPI app
│           ├── services/         # Business logic
│           │   ├── supervisor.py # Review engine
│           │   ├── grammar.py    # Grammar & academic writing check
│           │   └── dataset.py    # Dataset card generator
│           └── models/           # Data models
```

---

## 🛠️ Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python 3.12) |
| Database | SQLite (WAL mode) |
| AI | Anthropic Claude claude-sonnet-4-20250514 |
| Frontend Deploy | Vercel (root: `researchos_production/apps/web`) |
| Backend Deploy | Render free tier |
| Color theme | Pastel violet `#7c3aed` — distinct academic palette |

---

## 🚀 Quick Start

```bash
git clone https://github.com/ShaistaShabbir-prog/research-os
cd research-os/researchos_production

# Backend
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd apps/web
npm install
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env.local
npm run dev   # http://localhost:3000
```

### Vercel Environment Variables
```env
NEXT_PUBLIC_API_BASE_URL=https://researchos-api-8zqh.onrender.com
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password
```

---

## 🎯 Who is it for?

| User | Problem solved |
|---|---|
| MSc Students | Unclear expectations, weak lit review, lack of feedback |
| PhD Candidates | Literature gaps, reviewer prep, publication readiness |
| Research Associates | Consistent feedback for multiple students |
| Professors | Reduced repetitive review cycles |
| Research Groups | Institutional knowledge preservation |

---

## ⚖️ Ethics

ResearchOS **never ghostwrites** research. It reviews, critiques, and improves your own work. No AI-generated content for submission. No plagiarism bypass. Built by active researchers.

---

## 📄 License

Proprietary — All rights reserved © 2026 Shaista Shabbir.
See [LICENSE](./LICENSE).
