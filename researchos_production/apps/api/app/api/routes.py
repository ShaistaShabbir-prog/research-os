from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.core.db import Base, engine, get_db
from app.models.entities import Document, Project, Review, Dataset
from app.schemas.api import DatasetCardOut, DatasetCardRequest, GraphIngestOut, GraphIngestRequest, ProjectCreate, ProjectOut, ReviewOut, ReviewRequest
from app.services.dataset_engine import create_dataset_card, reproducibility_check
from app.services.graph_engine import extract_graph
from app.services.supervisor_engine import review_document
from app.services.text_extract import extract_text

router = APIRouter()

@router.on_event('startup')
def init_db() -> None:
    Base.metadata.create_all(bind=engine)

@router.get('/health')
def health() -> dict:
    return {'status': 'ok', 'service': 'researchos-api'}

@router.post('/projects', response_model=ProjectOut)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(title=payload.title, project_type=payload.project_type, description=payload.description)
    db.add(project); db.commit(); db.refresh(project)
    return {'id': project.id, 'title': project.title, 'project_type': project.project_type.value, 'description': project.description}

@router.get('/projects')
def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).order_by(Project.id.desc()).limit(50).all()

@router.post('/documents/upload')
async def upload_document(project_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, 'Project not found')
    content = await file.read()
    text = extract_text(file.filename or 'upload.txt', content)
    doc = Document(project_id=project_id, filename=file.filename or 'upload', content_type=file.content_type or 'application/octet-stream', extracted_text=text)
    db.add(doc); db.commit(); db.refresh(doc)
    return {'id': doc.id, 'filename': doc.filename, 'chars': len(text), 'preview': text[:1200]}

@router.post('/supervisor/review', response_model=ReviewOut)
def supervisor_review(payload: ReviewRequest, db: Session = Depends(get_db)):
    text = payload.document_text or ''
    if payload.document_id:
        doc = db.get(Document, payload.document_id)
        if not doc:
            raise HTTPException(404, 'Document not found')
        text = doc.extracted_text or ''
    if not text.strip():
        raise HTTPException(400, 'No document text provided')
    report = review_document(text=text, mode=payload.mode, discipline=payload.discipline)
    review = Review(project_id=payload.project_id, document_id=payload.document_id, mode=payload.mode, overall_score=report['overall_score'], report=report)
    db.add(review); db.commit()
    return {'overall_score': report['overall_score'], 'report': report}

@router.post('/datasets/card', response_model=DatasetCardOut)
def dataset_card(payload: DatasetCardRequest):
    card = create_dataset_card(payload.name, payload.abstract, payload.files, payload.license, payload.domain)
    score, issues = reproducibility_check(payload.files)
    return {'dataset_card': card, 'reproducibility_score': score, 'issues': issues}

@router.post('/graph/ingest', response_model=GraphIngestOut)
def graph_ingest(payload: GraphIngestRequest):
    graph = extract_graph(payload.title, payload.text, payload.source_type)
    return graph
