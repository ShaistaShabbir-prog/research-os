from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import settings

# Always use SQLite on free tier - no external DB needed
db_url = settings.database_url
if db_url.startswith("postgresql") or db_url.startswith("postgres"):
    # Try postgres, fall back to sqlite
    try:
        connect_args = {}
        engine = create_engine(db_url, connect_args=connect_args)
    except Exception:
        db_url = "sqlite:///./researchos.db"
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
else:
    connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
    engine = create_engine(db_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
