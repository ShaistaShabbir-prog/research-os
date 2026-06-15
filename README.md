<div align="center">

<h1>📚 ResearchOS</h1>

<p><strong>The Research Quality Platform</strong><br>
Structured feedback · Reviewer simulation · Reproducibility scoring · Research memory</p>

[![Live](https://img.shields.io/badge/🌐_Live-research--os--phi.vercel.app-7C3AED?style=for-the-badge)](https://research-os-phi.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python_3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

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

### 🧑‍⚖️ Review Copilot
- **Paper intake:** parses title, abstract, sections, references, and figure/table captions from text, Markdown, or LaTeX-like source
- **Reviewer workspace:** assists with structured summary, novelty notes, strengths, weaknesses, methods critique, limitations, ethics, reproducibility, and reviewer questions
- **Citation and claim auditors:** flags sparse citation coverage, suspicious references, overclaims, unsupported causal language, and abstract/results mismatch for human checking
- **Reproducibility auditor:** highlights code, dataset, preprocessing, hyperparameter, seed, environment, baseline, ablation, significance, and limitation gaps
- **Meta-review copilot:** drafts agreement, disagreement, missing discussion points, review-quality issues, and author-facing clarification questions from reviewer reports
- **Exports:** Markdown and JSON review analysis, citation/claim audit JSON, reproducibility checklist Markdown, meta-review Markdown, and GraphML knowledge graph

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
│   │   │   ├── review-copilot/   # Review Copilot workspace
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
│           │   ├── review_copilot.py # Peer-review assistance engine
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
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd apps/web
npm install
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env.local
npm run dev   # http://localhost:3000
```

Review Copilot is available at:

- Frontend: `http://localhost:3000/review-copilot`
- Backend endpoint: `POST http://localhost:8000/api/review-copilot/analyze`

### Review Copilot API Example

Request:

```bash
curl -X POST http://localhost:8000/api/review-copilot/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "document_text": "# Demo Paper\n\n## Abstract\nThis paper studies a synthetic review workflow.\n\n## Method\nWe compare baselines on a synthetic dataset.",
    "reviews": [
      {
        "reviewer_id": "R1",
        "summary": "Promising but needs clearer reproducibility details.",
        "strengths": ["important problem"],
        "weaknesses": ["missing seeds"],
        "recommendation": "borderline"
      }
    ]
  }'
```

Response excerpt:

```json
{
  "paper": {
    "title": "Demo Paper",
    "abstract": "This paper studies a synthetic review workflow."
  },
  "reviewer_analysis": {
    "paper_summary": "Demo Paper: This paper studies a synthetic review workflow.",
    "human_verification_required": true
  },
  "exports": {
    "review_analysis.md": "# Review Analysis...",
    "review_analysis.json": "{...}"
  },
  "ethics": [
    "The system assists, but does not replace human scientific judgment."
  ]
}
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

Review Copilot assists, highlights, drafts, flags, and supports human judgment. It does not replace reviewers, supervisors, area chairs, editors, or scientific judgment. Do not submit AI-generated reviews without human verification. No confidential paper content should be sent to external APIs unless explicitly configured and authorized.

## Dependency And Security Notes

During local verification, `npm install` reported 4 npm audit findings: 2 low and 2 moderate. These were documented but not auto-fixed because forced dependency upgrades can introduce breaking changes.

TODO: run a targeted dependency audit before release, apply safe non-breaking upgrades where available, and avoid `npm audit fix --force` unless the resulting dependency changes are tested.

## Review Copilot Docs

- [Review Copilot Design](./docs/review_copilot_design.md)
- [Ethical Review Policy](./docs/ethical_review_policy.md)
- [Review Copilot API](./docs/api_review_copilot.md)

---

## 📄 License

MIT License - see [LICENSE](./LICENSE).

## Chatbot configuration

The website assistant works without an AI provider by matching product FAQs
and visible content from the current page. To enhance those grounded answers
with Claude, set `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` in the web app's
server environment. Never expose the key through a `NEXT_PUBLIC_` variable.
