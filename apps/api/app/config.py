from pydantic import field_validator
from pydantic_settings import BaseSettings


_PLACEHOLDER_JWT_SECRETS = {"", "your-jwt-secret", "changeme"}


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/llm_lab"
    redis_url: str = "redis://localhost:6379/0"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    api_cors_origins: str = "http://localhost:3000"
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    require_auth: bool = True
    rate_limit_simulate: str = "60/minute"
    rate_limit_enabled: bool = True

    model_config = {"env_file": "../../.env", "extra": "ignore"}

    @field_validator("jwt_secret")
    @classmethod
    def _validate_jwt_secret(cls, v: str) -> str:
        return v


settings = Settings()


def assert_auth_configured() -> None:
    """Fail fast at startup if auth is required but JWT secret is missing.

    Supabase issues JWTs signed with the project JWT secret (Dashboard →
    Settings → API → JWT Secret). Without it, every request will 401.
    Skip this check only if `REQUIRE_AUTH=false` is set explicitly.
    """
    if not settings.require_auth:
        return
    if settings.jwt_secret.strip() in _PLACEHOLDER_JWT_SECRETS:
        raise RuntimeError(
            "JWT_SECRET is not configured. Set it in .env from "
            "Supabase Dashboard → Settings → API → JWT Secret, "
            "or set REQUIRE_AUTH=false to disable auth for local dev."
        )
