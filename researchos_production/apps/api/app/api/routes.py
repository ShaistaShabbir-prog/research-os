from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.entities import Document, Project, Review
from app.schemas.api import (
    CopilotChatRequest,
    UserRegisterRequest, UserLoginRequest, UserOut, UserUpdateRequest,
    ClaimVerificationOut, ClaimVerificationRequest,
    DatasetCardOut, DatasetCardRequest,
    GraphIngestOut, GraphIngestRequest,
    ProjectCreate, ProjectOut,
    ResearchMemoryOut, ResearchMemoryRequest,
    ReviewCopilotOut, ReviewCopilotRequest,
    ReviewerFatigueOut, ReviewerFatigueRequest,
    ReviewOut, ReviewRequest,
)
from app.services.auth_service import (
    register_user, login_user, get_current_user, update_profile
)
from app.services.badge_service import (
    register_badge, get_badge, list_badges,
    generate_badge_svg, generate_score_svg, badge_report,
)
from app.services.ai_review_copilot import run_ai_review_copilot, estimate_cost
from app.services.claim_verification import run_claim_verification
from app.services.dataset_engine import create_dataset_card, reproducibility_check
from app.services.graph_engine import extract_graph
from app.services.research_memory import run_research_memory
from app.services.review_copilot import run_review_copilot, validate_review_copilot_input
from app.services.reviewer_fatigue import run_reviewer_fatigue
from app.services.supervisor_engine import review_document
from app.services.text_extract import extract_text, extract_structured

router = APIRouter()


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "researchos-api", "version": "1.0.0"}


@router.post("/projects", response_model=ProjectOut)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        title=payload.title,
        project_type=payload.project_type,
        description=payload.description,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return ProjectOut(
        id=project.id,
        title=project.title,
        project_type=project.project_type.value,
        description=project.description,
    )


@router.get("/projects")
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.id.desc()).limit(50).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "project_type": p.project_type.value,
            "description": p.description,
            "created_at": p.created_at.isoformat(),
        }
        for p in projects
    ]


@router.post("/documents/upload")
async def upload_document(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    content = await file.read()
    text = extract_text(file.filename or "upload.txt", content)
    doc = Document(
        project_id=project_id,
        filename=file.filename or "upload",
        content_type=file.content_type or "application/octet-stream",
        extracted_text=text,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"id": doc.id, "filename": doc.filename, "chars": len(text), "preview": text[:800]}


@router.post("/supervisor/review", response_model=ReviewOut)
def supervisor_review(payload: ReviewRequest, db: Session = Depends(get_db)):
    text = payload.document_text or ""
    if payload.document_id:
        doc = db.get(Document, payload.document_id)
        if not doc:
            raise HTTPException(404, "Document not found")
        text = doc.extracted_text or ""
    if not text.strip():
        raise HTTPException(400, "No document text provided")

    report = review_document(text=text, mode=payload.mode, discipline=payload.discipline)
    review = Review(
        project_id=payload.project_id or 0,
        document_id=payload.document_id,
        mode=payload.mode,
        overall_score=report["overall_score"],
        report=report,
    )
    db.add(review)
    db.commit()
    return ReviewOut(overall_score=report["overall_score"], report=report)


@router.post("/datasets/card", response_model=DatasetCardOut)
def dataset_card_endpoint(payload: DatasetCardRequest):
    card = create_dataset_card(
        payload.name, payload.abstract, payload.files, payload.license, payload.domain
    )
    score, issues = reproducibility_check(payload.files)
    return DatasetCardOut(dataset_card=card, reproducibility_score=score, issues=issues)


@router.post("/graph/ingest", response_model=GraphIngestOut)
def graph_ingest(payload: GraphIngestRequest):
    result = extract_graph(payload.title, payload.text, payload.source_type)
    return GraphIngestOut(nodes=result["nodes"], edges=result["edges"])


@router.post("/review-copilot/analyze", response_model=ReviewCopilotOut)
def review_copilot_analyze(payload: ReviewCopilotRequest):
    try:
        validate_review_copilot_input(payload.document_text)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "invalid_review_copilot_input",
                "message": str(exc),
                "human_verification_required": True,
            },
        ) from exc
    reviews = [review.model_dump() for review in payload.reviews]
    return run_review_copilot(payload.document_text, reviews)


# ── Phase 2: Claim Verification Engine ────────────────────────────────────

@router.post("/claim-verification/analyze", response_model=ClaimVerificationOut)
def claim_verification_analyze(payload: ClaimVerificationRequest):
    """Extract and verify claims. Returns claim list, evidence, support scores."""
    try:
        if not payload.document_text or len(payload.document_text.strip()) < 30:
            raise ValueError("document_text must be at least 30 characters.")
        return run_claim_verification(payload.document_text)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


# ── Phase 3: Reviewer Fatigue Assistant ───────────────────────────────────

@router.post("/reviewer-fatigue/analyze", response_model=ReviewerFatigueOut)
def reviewer_fatigue_analyze(payload: ReviewerFatigueRequest):
    """Summarise reviews, disagreement matrix, AC briefing, meta-review draft."""
    try:
        reviews = [r.model_dump() for r in payload.reviews]
        return run_reviewer_fatigue(payload.document_text, reviews)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


# ── Phase 4: Research Memory ───────────────────────────────────────────────

@router.post("/research-memory/compare", response_model=ResearchMemoryOut)
def research_memory_compare(payload: ResearchMemoryRequest):
    """Compare 2–10 papers: novelty, citation, contribution overlap."""
    try:
        papers = [p.model_dump() for p in payload.papers]
        return run_research_memory(papers)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

# ── Phase 5: AI-Powered Review Copilot ───────────────────────────────────

@router.post("/ai-review-copilot/analyze")
def ai_review_copilot_analyze(payload: ReviewCopilotRequest):
    """
    AI-powered Review Copilot using Claude.
    Falls back to heuristic analysis if API key is unavailable.
    Returns ai_powered=true/false so frontend can show mode clearly.
    """
    try:
        validate_review_copilot_input(payload.document_text)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    reviews = [r.model_dump() for r in payload.reviews]
    return run_ai_review_copilot(payload.document_text, reviews)


@router.get("/ai-review-copilot/cost-estimate")
def ai_cost_estimate(paper_chars: int = 5000, review_count: int = 3):
    """Return a cost estimate before running the AI analysis."""
    return estimate_cost(paper_chars, review_count)

# ── Phase 17: Structured PDF extraction ──────────────────────────────────

@router.post("/documents/extract-structured")
async def extract_structured_endpoint(
    file: UploadFile = File(...),
):
    """
    Full structured extraction from PDF, DOCX, or plain text.
    Returns sections, tables (as Markdown), structured references,
    figure captions, and PDF metadata.
    Detects scanned PDFs and returns a clear warning.
    """
    content = await file.read()
    paper   = extract_structured(file.filename or "upload.pdf", content)
    return {
        "filename":           file.filename,
        "extraction_method":  paper.extraction_method,
        "is_scanned":         paper.is_scanned,
        "page_count":         paper.page_count,
        "char_count":         paper.char_count,
        "raw_text_preview":   paper.raw_text[:800],
        "section_count":      len(paper.sections),
        "sections":           paper.sections[:20],
        "table_count":        len(paper.tables),
        "tables":             paper.tables[:10],
        "reference_count":    len(paper.references),
        "references":         paper.references[:40],
        "figure_count":       len(paper.figures),
        "figures":            paper.figures[:20],
        "metadata":           paper.metadata,
        "warnings":           paper.warnings,
    }

# ── Issue #16: Reproducibility Badge System ───────────────────────────────

@router.post("/badge/register")
def badge_register(payload: ReviewCopilotRequest):
    """Analyse paper and register a reproducibility badge."""
    try:
        return register_badge(payload.document_text)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/badge/{paper_hash_id}.svg")
def badge_svg(paper_hash_id: str, style: str = "flat"):
    """Serve embeddable SVG badge. style: flat | flat-square | for-the-badge"""
    from fastapi.responses import Response
    svg = generate_badge_svg(paper_hash_id, style=style)
    return Response(content=svg, media_type="image/svg+xml",
                    headers={"Cache-Control": "max-age=3600"})


@router.get("/badge/{paper_hash_id}/report")
def badge_report_endpoint(paper_hash_id: str):
    """Return Markdown reproducibility report for a paper."""
    data = get_badge(paper_hash_id)
    if not data:
        raise HTTPException(status_code=404, detail="Badge not found")
    return {"hash": paper_hash_id, "report": badge_report(paper_hash_id), "data": data}


@router.get("/badge/score/{score}.svg")
def score_svg(score: int, label: str = "Reproducibility"):
    """Quick SVG badge from raw score (0-100)."""
    from fastapi.responses import Response
    if not 0 <= score <= 100:
        raise HTTPException(status_code=422, detail="Score must be 0-100")
    svg = generate_score_svg(score, label)
    return Response(content=svg, media_type="image/svg+xml")


@router.get("/badges")
def badges_list():
    """Public registry — list all registered paper badges."""
    return {"badges": list_badges(), "count": len(list_badges())}

# ── Issue #10: User Auth ──────────────────────────────────────────────────

@router.post("/auth/register", response_model=UserOut)
def auth_register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new user. Returns JWT token."""
    try:
        return register_user(db, payload.email, payload.password, payload.full_name or "")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/auth/login", response_model=UserOut)
def auth_login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """Login with email + password. Returns JWT token."""
    try:
        return login_user(db, payload.email, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.get("/auth/me", response_model=UserOut)
def auth_me(authorization: str = "", db: Session = Depends(get_db)):
    """Return current user from Bearer token."""
    token = authorization.replace("Bearer ", "").strip()
    user = get_current_user(db, token) if token else None
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    from app.services.auth_service import _user_out
    return _user_out(user)


@router.patch("/auth/profile", response_model=UserOut)
def auth_update_profile(
    payload: UserUpdateRequest,
    authorization: str = "",
    db: Session = Depends(get_db),
):
    """Update user profile (name, plan)."""
    token = authorization.replace("Bearer ", "").strip()
    user  = get_current_user(db, token) if token else None
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")
    return update_profile(db, user, payload.full_name, payload.plan)

# ── Issue #18: Enhanced health check ─────────────────────────────────────

@router.get("/health/deep")
def health_deep(db: Session = Depends(get_db)):
    """Deep health check — verifies DB connection and key services."""
    import time as _time
    t0 = _time.time()
    checks: dict[str, Any] = {}
    
    # DB check
    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {str(e)[:50]}"
    
    # Service imports
    for svc in ["review_copilot","claim_verification","reviewer_fatigue","research_memory","badge_service"]:
        try:
            __import__(f"app.services.{svc}")
            checks[svc] = "ok"
        except Exception as e:
            checks[svc] = f"error: {str(e)[:30]}"
    
    elapsed = round((_time.time() - t0) * 1000, 1)
    all_ok  = all(v == "ok" for v in checks.values())
    
    return {
        "status":        "healthy" if all_ok else "degraded",
        "checks":        checks,
        "elapsed_ms":    elapsed,
        "version":       "1.0.0",
        "phases_live":   ["phase1_review_copilot","phase2_claim_verification",
                          "phase3_reviewer_fatigue","phase4_research_memory",
                          "phase5_ai_copilot","issue16_badges","issue17_pdf",
                          "issue10_auth","issue13_chat","issue14_api_keys",
                          "issue15_conference"],
    }

# ── Issue #29: Copilot Chat ────────────────────────────────────────────────

@router.post("/copilot/chat")
def copilot_chat_endpoint(payload: CopilotChatRequest):
    """
    Context-aware research assistant chat.
    Claude-powered with heuristic fallback.
    """
    from app.services.copilot_chat import chat, suggested_questions
    try:
        history = [m.model_dump() for m in payload.history]
        result  = chat(payload.question, history, payload.context)
        return {
            **result,
            "suggested_questions": suggested_questions(payload.context),
        }
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/copilot/suggestions")
def copilot_suggestions(paper_hash: str | None = None):
    """Return suggested questions for the copilot."""
    from app.services.copilot_chat import suggested_questions
    context = {"paper_hash": paper_hash} if paper_hash else None
    return {"suggestions": suggested_questions(context)}
# ── Issue #33: API Key Middleware ─────────────────────────────────────────

from fastapi import Header

async def verify_api_key_dep(x_api_key: str = Header(None)):
    """Dependency: validate X-API-Key header. Skip if no key configured (dev mode)."""
    import os
    if os.getenv("API_KEY_ENFORCEMENT", "false").lower() != "true":
        return None  # dev mode — skip enforcement
    if not x_api_key:
        raise HTTPException(status_code=401, detail="X-API-Key header required.")
    from app.services.api_key_service import verify_api_key
    data = verify_api_key(x_api_key)
    if not data:
        raise HTTPException(status_code=401, detail="Invalid or rate-limited API key.")
    return data


@router.post("/keys/generate")
def generate_key(user_id: int = 1, plan: str = "free", email: str = "user@example.com"):
    """Generate a new API key. In production this requires auth."""
    from app.services.api_key_service import generate_api_key
    return generate_api_key(user_id, email, plan)


@router.delete("/keys/{key_id}")
def revoke_key(key_id: str, user_id: int = 1):
    """Revoke an API key."""
    from app.services.api_key_service import revoke_key
    if not revoke_key(key_id, user_id):
        raise HTTPException(status_code=404, detail="Key not found or not owned by user.")
    return {"revoked": True, "key_id": key_id}


@router.get("/keys")
def list_keys(user_id: int = 1):
    """List API keys for a user."""
    from app.services.api_key_service import list_keys
    return {"keys": list_keys(user_id)}
