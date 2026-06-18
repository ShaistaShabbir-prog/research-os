import enum
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base


class ProjectType(str, enum.Enum):
    thesis = "thesis"
    paper = "paper"
    expose = "expose"
    dataset = "dataset"


class ReviewMode(str, enum.Enum):
    supervisor = "supervisor"
    reviewer = "reviewer"
    defense = "defense"
    results = "results"


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255))
    plan: Mapped[str] = mapped_column(String(50), default="free")
    password_hash: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    projects: Mapped[list["Project"]] = relationship("Project", back_populates="user")


class Project(Base):
    __tablename__ = "projects"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(255))
    project_type: Mapped[ProjectType] = mapped_column(Enum(ProjectType))
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    user: Mapped["User | None"] = relationship("User", back_populates="projects")
    documents: Mapped[list["Document"]] = relationship("Document", back_populates="project")
    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="project")


class Document(Base):
    __tablename__ = "documents"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    filename: Mapped[str] = mapped_column(String(512))
    content_type: Mapped[str] = mapped_column(String(120))
    storage_key: Mapped[str | None] = mapped_column(String(1024))
    extracted_text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    project: Mapped["Project"] = relationship("Project", back_populates="documents")


class Review(Base):
    __tablename__ = "reviews"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    document_id: Mapped[int | None] = mapped_column(ForeignKey("documents.id"))
    mode: Mapped[ReviewMode] = mapped_column(Enum(ReviewMode))
    overall_score: Mapped[float] = mapped_column(Float)
    report: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    project: Mapped["Project"] = relationship("Project", back_populates="reviews")


class Dataset(Base):
    __tablename__ = "datasets"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    name: Mapped[str] = mapped_column(String(255))
    license: Mapped[str | None] = mapped_column(String(120))
    version: Mapped[str] = mapped_column(String(50), default="0.1.0")
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)
    reproducibility_score: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class GraphNode(Base):
    __tablename__ = "graph_nodes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    label: Mapped[str] = mapped_column(String(80), index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    properties: Mapped[dict] = mapped_column(JSON, default=dict)


class GraphEdge(Base):
    __tablename__ = "graph_edges"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("graph_nodes.id"))
    target_id: Mapped[int] = mapped_column(ForeignKey("graph_nodes.id"))
    relation: Mapped[str] = mapped_column(String(80), index=True)
    properties: Mapped[dict] = mapped_column(JSON, default=dict)
