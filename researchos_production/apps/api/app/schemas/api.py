from pydantic import BaseModel, Field

class ProjectCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    project_type: str
    description: str | None = None

class ProjectOut(ProjectCreate):
    id: int

class ReviewRequest(BaseModel):
    project_id: int
    document_text: str | None = None
    document_id: int | None = None
    mode: str = 'supervisor'
    discipline: str = 'general computer science / engineering'

class ReviewOut(BaseModel):
    overall_score: float
    report: dict

class DatasetCardRequest(BaseModel):
    name: str
    abstract: str
    files: list[str] = []
    license: str | None = None
    domain: str = 'general research'

class DatasetCardOut(BaseModel):
    dataset_card: dict
    reproducibility_score: float
    issues: list[str]

class GraphIngestRequest(BaseModel):
    title: str
    text: str
    source_type: str = 'paper'

class GraphIngestOut(BaseModel):
    nodes: list[dict]
    edges: list[dict]
