from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "ResearchGPT"
    env: str = "development"
    database_url: str = "postgresql+psycopg://researchgpt:researchgpt@localhost:5432/researchgpt"
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
