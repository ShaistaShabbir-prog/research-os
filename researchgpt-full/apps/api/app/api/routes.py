from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Project, Document, Chunk, AgentRun
from app.schemas.schemas import ProjectCreate, ProjectOut, AgentRequest, AgentResponse
from app.services.pdf import extract_pdf_text, chunk_text
from app.services.ai import run_agent

router = APIRouter()

@router.get('/health')
def health():
    return {"status": "ok", "service": "ResearchGPT API"}

@router.post('/projects', response_model=ProjectOut)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(**payload.model_dump())
    db.add(project); db.commit(); db.refresh(project)
    return project

@router.get('/projects')
def list_projects(owner_id: str = 'demo-user', db: Session = Depends(get_db)):
    return db.query(Project).filter(Project.owner_id == owner_id).order_by(Project.created_at.desc()).all()

@router.post('/projects/{project_id}/upload')
async def upload_document(project_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')
    data = await file.read()
    text = extract_pdf_text(data) if file.filename.lower().endswith('.pdf') else data.decode('utf-8', errors='ignore')
    doc = Document(project_id=project_id, filename=file.filename, mime_type=file.content_type or 'application/octet-stream', text=text)
    db.add(doc); db.commit(); db.refresh(doc)
    for i, ch in enumerate(chunk_text(text)):
        db.add(Chunk(document_id=doc.id, project_id=project_id, chunk_index=i, text=ch))
    db.commit()
    return {"document_id": doc.id, "filename": file.filename, "chunks": len(chunk_text(text))}

@router.get('/projects/{project_id}/documents')
def documents(project_id: str, db: Session = Depends(get_db)):
    return db.query(Document).filter(Document.project_id == project_id).all()

@router.post('/agents/run', response_model=AgentResponse)
async def run_research_agent(payload: AgentRequest, db: Session = Depends(get_db)):
    chunks = db.query(Chunk).filter(Chunk.project_id == payload.project_id).limit(8).all()
    context = "\n\n".join([c.text for c in chunks])
    output = await run_agent(payload.agent_type, payload.task, context, payload.style, payload.target_venue)
    run = AgentRun(project_id=payload.project_id, agent_type=payload.agent_type, input_json=payload.model_dump(), output_text=output)
    db.add(run); db.commit(); db.refresh(run)
    return AgentResponse(run_id=run.id, output=output)
