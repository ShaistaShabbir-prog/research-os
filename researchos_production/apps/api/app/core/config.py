from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')
    app_env: str = 'development'
    secret_key: str = 'change-me'
    database_url: str = 'sqlite:///./researchos.db'
    redis_url: str = 'redis://localhost:6379/0'
    s3_endpoint: str | None = None
    s3_access_key: str | None = None
    s3_secret_key: str | None = None
    s3_bucket: str = 'researchos'
    qdrant_url: str | None = None
    neo4j_uri: str | None = None
    neo4j_user: str | None = None
    neo4j_password: str | None = None
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    gemini_api_key: str | None = None
    llm_provider: str = 'offline'
    cors_origins: str = 'http://localhost:3000'

settings = Settings()
