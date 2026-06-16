from pydantic import BaseModel


class ProjectCreate(BaseModel):
    title: str
    project_type: str
    description: str | None = None


class ProjectOut(BaseModel):
    id: int
    title: str
    project_type: str
    description: str | None = None

    class Config:
        from_attributes = True


class ReviewRequest(BaseModel):
    project_id: int | None = None
    document_id: int | None = None
    document_text: str | None = None
    mode: str = "supervisor"
    discipline: str = "general"
    venue: str = "general"


class ReviewOut(BaseModel):
    overall_score: float
    report: dict


class DatasetCardRequest(BaseModel):
    name: str
    abstract: str
    files: list[str] = []
    license: str | None = None
    domain: str = "general"


class DatasetCardOut(BaseModel):
    dataset_card: dict
    reproducibility_score: float
    issues: list[str]


class GraphIngestRequest(BaseModel):
    title: str
    text: str
    source_type: str = "paper"


class GraphIngestOut(BaseModel):
    nodes: list[dict]
    edges: list[dict]


class MetaReviewInput(BaseModel):
    reviewer_id: str
    summary: str
    strengths: list[str] = []
    weaknesses: list[str] = []
    recommendation: str | None = None


class ReviewCopilotRequest(BaseModel):
    document_text: str
    reviews: list[MetaReviewInput] = []


class ReviewCopilotOut(BaseModel):
    paper: dict
    reviewer_analysis: dict
    citation_audit: dict
    claim_audit: dict
    reproducibility_audit: dict
    meta_review: dict
    knowledge_graph: dict
    ethics: list[str]
    exports: dict[str, str]
