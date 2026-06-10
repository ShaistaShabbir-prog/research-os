from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.core.config import settings
from app.core.db import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"DB init warning: {e}")
    yield


app = FastAPI(
    title="ResearchOS API",
    version="1.0.0",
    description="AI Supervisor · Dataset Hub · Research Knowledge Graph",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {"service": "ResearchOS API", "version": "1.0.0", "status": "ok"}


@app.get("/ping")
def ping():
    """Keep-alive endpoint for Render free tier"""
    return {"pong": True}
