# Review Copilot Design

Review Copilot is a ResearchOS module for research-quality, peer-review, and supervision workflows. It assists reviewers, supervisors, students, area chairs, and editors by highlighting issues, drafting structured notes, and exporting evidence-backed review artifacts for human verification.

It does not replace reviewers, supervisors, area chairs, editors, or scientific judgment.

## Goals

- Parse paper-like text, Markdown, or LaTeX-like source into a paper structure.
- Surface structured reviewer workspace findings: summary, novelty, strengths, weaknesses, methods critique, missing baselines, missing ablations, limitations, ethical concerns, reproducibility concerns, and reviewer questions.
- Flag citation, claim, and reproducibility risks with evidence spans.
- Draft meta-review support from multiple reviewer reports.
- Produce a lightweight research knowledge graph.
- Export Markdown, JSON, and GraphML artifacts.

## Current Architecture

Backend:

- `researchos_production/apps/api/app/services/review_copilot.py`
- `researchos_production/apps/api/app/api/routes.py`
- `researchos_production/apps/api/app/schemas/api.py`

Frontend:

- `researchos_production/apps/web/app/review-copilot/page.tsx`
- `researchos_production/apps/web/lib/api.ts`
- `researchos_production/apps/web/components/Nav.tsx`

Examples:

- `researchos_production/examples/demo_paper.md`
- `researchos_production/examples/demo_reviews.json`
- `researchos_production/examples/demo_review_output.md`

Tests:

- `researchos_production/apps/api/app/tests/test_review_copilot.py`

## Provider Model

The MVP uses a local heuristic provider by default. This is deliberate: paper content is not sent to external APIs unless a future provider is explicitly configured.

Provider hooks exist for:

- `LocalMockProvider`
- `OpenAIProvider`
- `FutureAnthropicProvider`

The external-provider classes are intentionally inert in the MVP. They raise errors instead of sending content.

## Data Flow

1. Frontend sends paper text and optional review reports to `/api/review-copilot/analyze`.
2. Backend validates input length.
3. Paper intake extracts title, abstract, sections, references, and figure/table captions.
4. Review Copilot runs local structured auditors.
5. Backend returns findings, exports, ethics warnings, and a lightweight knowledge graph.
6. Frontend renders tabs and supports copy/export.

## Robustness Decisions

- Input shorter than 30 characters is rejected.
- Input longer than 200,000 characters is rejected.
- If no headings are detected, the parser creates a `Full Text` fallback section.
- Every finding includes `human_verification_required: true`.
- Structured backend errors include a stable code and human-readable message.
- Export strings are generated on the backend and downloaded or copied from the frontend.

## Dependency And Security Note

During verification, `npm install` reported 4 npm audit findings: 2 low and 2 moderate. The versions were not auto-fixed because forced fixes can introduce breaking changes in the Next.js dependency tree.

TODO:

- Run a targeted dependency audit before release.
- Review whether non-breaking upgrades are available.
- Avoid `npm audit fix --force` unless the resulting dependency changes are tested.
