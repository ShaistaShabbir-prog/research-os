from pydantic import BaseModel

class ProjectCreate(BaseModel):
    owner_id: str = "demo-user"
    title: str
    kind: str = "thesis"
    description: str | None = None

class ProjectOut(ProjectCreate):
    id: str

class AgentRequest(BaseModel):
    project_id: str
    agent_type: str
    task: str
    style: str = "academic"
    target_venue: str | None = None

class AgentResponse(BaseModel):
    run_id: str
    output: str
