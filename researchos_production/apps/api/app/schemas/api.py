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


# ── Phase 2: Claim Verification Engine ────────────────────────────────────

class ClaimVerificationRequest(BaseModel):
    document_text: str


class ClaimVerificationOut(BaseModel):
    claim_count: int
    supported_count: int
    unsupported_count: int
    support_rate: float
    claims: list[dict]
    unsupported_claims: list[dict]
    ethics: list[str]
    human_verification_required: bool


# ── Phase 3: Reviewer Fatigue Assistant ───────────────────────────────────

class ReviewerFatigueReviewInput(BaseModel):
    reviewer_id: str
    summary: str
    strengths: list[str] = []
    weaknesses: list[str] = []
    recommendation: str | None = None


class ReviewerFatigueRequest(BaseModel):
    document_text: str = ""
    reviews: list[ReviewerFatigueReviewInput]


class ReviewerFatigueOut(BaseModel):
    reviewer_summaries: list[dict]
    disagreement_matrix: dict
    ac_briefing: dict
    meta_review_draft: str
    exports: dict[str, str]
    ethics: list[str]
    human_verification_required: bool


# ── Phase 4: Research Memory ───────────────────────────────────────────────

class ResearchMemoryPaperInput(BaseModel):
    id: str | None = None
    title: str | None = None
    text: str


class ResearchMemoryRequest(BaseModel):
    papers: list[ResearchMemoryPaperInput]


class ResearchMemoryOut(BaseModel):
    paper_count: int
    papers: list[dict]
    summary: list[dict]
    novelty_overlap: dict
    citation_overlap: dict
    contribution_overlap: dict
    exports: dict[str, str]
    ethics: list[str]
    human_verification_required: bool
