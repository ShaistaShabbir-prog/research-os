from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.entities import Document, Project, Review
from app.schemas.api import (
    ClaimVerificationOut, ClaimVerificationRequest,
    DatasetCardOut, DatasetCardRequest,
    GraphIngestOut, GraphIngestRequest,
    ProjectCreate, ProjectOut,
    ResearchMemoryOut, ResearchMemoryRequest,
    ReviewCopilotOut, ReviewCopilotRequest,
    ReviewerFatigueOut, ReviewerFatigueRequest,
    ReviewOut, ReviewRequest,
)
from app.services.claim_verification import run_claim_verification
from app.services.dataset_engine import create_dataset_card, reproducibility_check
from app.services.graph_engine import extract_graph
from app.services.research_memory import run_research_memory
from app.services.review_copilot import run_review_copilot, validate_review_copilot_input
from app.services.reviewer_fatigue import run_reviewer_fatigue
from app.services.supervisor_engine import review_document
from app.services.text_extract import extract_text

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
