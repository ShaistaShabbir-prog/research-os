# ResearchGPT Product Specification

## Vision
ResearchGPT is a domain-specific AI copilot for academic research workflows. It helps students, PhD candidates, researchers, supervisors, labs, and universities reduce repetitive writing and analysis work.

## Primary Users
- MSc students writing thesis
- PhD researchers writing papers
- Supervisors reviewing drafts
- Research labs managing literature and datasets
- Universities needing institutional AI support

## MVP Features
1. Project workspace
2. Upload papers/thesis/datasets
3. Extract and chunk documents
4. Run research agents
5. Generate structured outputs
6. Save agent runs
7. Export-ready content

## V1 Extensions
- True vector embeddings with pgvector
- Clerk authentication
- Stripe subscriptions
- Supabase/S3 document storage
- Word/PDF/LaTeX export
- Team collaboration
- Department templates and university knowledge base
- Citation verification
- Plagiarism and originality warnings

## Safety and Trust
- Always show source context when available
- Never invent citations without warning
- Add “verify before submission” notices
- Keep user data isolated per workspace
