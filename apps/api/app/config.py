from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/llm_lab"
    redis_url: str = "redis://localhost:6379/0"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    api_cors_origins: str = "http://localhost:3000"
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"

    model_config = {"env_file": "../../.env", "extra": "ignore"}


settings = Settings()
