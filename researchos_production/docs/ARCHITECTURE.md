# Architecture

## Services
- Web app: Next.js, TypeScript, Tailwind.
- API: FastAPI, SQLAlchemy, Postgres.
- Workers: Celery + Redis for long review/dataset jobs.
- Storage: S3-compatible object storage.
- Vector DB: Qdrant for semantic search over papers and documents.
- Graph DB: Neo4j for research knowledge graph.
- Billing: Stripe.
- Auth: Clerk/Auth0/Keycloak.

## Data flow
1. User creates project.
2. User uploads document/dataset.
3. API extracts text/metadata.
4. Supervisor engine creates review.
5. Dataset engine creates dataset card and reproducibility score.
6. Graph engine extracts entities/relations.
7. Vector/graph indices update asynchronously.

## Security baseline
- Per-tenant access isolation.
- Signed upload/download URLs.
- Malware scanning.
- Audit logs.
- Encryption in transit and at rest.
- Retention/deletion workflows.
- Explicit privacy mode for unpublished thesis/papers.
