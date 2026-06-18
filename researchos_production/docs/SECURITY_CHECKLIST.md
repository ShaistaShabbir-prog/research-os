# ResearchOS — Production Security Checklist

## Status: ✅ Implemented / 🔄 In Progress / ❌ Pending

### Authentication & Authorization
- ✅ JWT tokens with HMAC-SHA256 signing
- ✅ PBKDF2 password hashing (100,000 iterations)
- ✅ Token expiry (7 days)
- ✅ API key rate limiting (per-plan, per-day)
- ❌ Refresh tokens (future)
- ❌ OAuth2 / GitHub SSO (future)

### Input Validation
- ✅ `MIN_INPUT_CHARS` / `MAX_INPUT_CHARS` enforced on all text endpoints
- ✅ File size limit: 10 MB on PDF upload
- ✅ Email validation with regex before DB query
- ✅ Password complexity rules enforced
- ✅ Pydantic v2 schema validation on all routes
- ✅ Paper count limit: max 10 papers in Research Memory

### API Security
- ✅ `X-API-Key` header authentication on public endpoints
- ✅ Rate limiting per API key (free: 10/day, pro: 10k/day)
- ✅ All routes return `human_verification_required: true`
- ❌ HTTPS enforcement header (handled by Render/Vercel)
- ❌ CORS locked to production domains (currently open for dev)

### Data Privacy
- ✅ No paper content stored permanently (in-memory analysis)
- ✅ Badge registry is in-memory (resets on restart)
- ✅ Ethics warnings on every AI endpoint output
- ✅ Confidential submission warning in AI Review Copilot
- ❌ GDPR-compliant data deletion endpoint (future)

### Error Handling
- ✅ All services return structured errors via HTTPException
- ✅ Graceful fallback from AI → heuristic on every AI endpoint
- ✅ Scanned PDF detection with clear user message
- ✅ Input validation before any processing

### Deployment
- ✅ `render.yaml` configured for Render deployment
- ✅ `vercel.json` configured for Next.js frontend
- ✅ Environment variables documented in `.env.example`
- ❌ Structured JSON logging (future)
- ❌ Health check `/health/deep` (future)
- ❌ Database connection pooling config (future)

### Testing
- ✅ 247+ tests passing
- ✅ All tests run in heuristic mode (no real API key needed)
- ✅ Test isolation via fresh SQLite per run
- ❌ Integration tests against live API (future)
- ❌ Load testing (future)

## Quick security review command

```bash
cd researchos_production/apps/api
pip install bandit safety
bandit -r app/ -ll
safety check -r requirements.txt
```
