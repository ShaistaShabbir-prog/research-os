# Architecture

## Frontend
Next.js + TypeScript + Tailwind.

Pages:
- `/` landing
- `/dashboard` project workspace
- `/agents` agent catalog
- `/pricing` monetization page

## Backend
FastAPI.

Endpoints:
- `GET /api/health`
- `POST /api/projects`
- `GET /api/projects`
- `POST /api/projects/{id}/upload`
- `GET /api/projects/{id}/documents`
- `POST /api/agents/run`

## Data Model
- User
- Project
- Document
- Chunk
- AgentRun

## RAG Pipeline
1. Upload PDF
2. Extract text
3. Chunk text
4. Store chunks
5. Retrieve chunks
6. Run agent with context
7. Save output

## Production Upgrade
Replace naive chunk retrieval with pgvector similarity search. Add embeddings table column using vector(1536/3072 depending on model).
