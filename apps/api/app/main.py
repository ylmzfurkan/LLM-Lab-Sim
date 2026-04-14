from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import assert_auth_configured, settings
from app.rate_limit import limiter
from app.routers import auth, projects, datasets, simulation, model_config

assert_auth_configured()

app = FastAPI(
    title="LLM Lab API",
    description="LLM Training & Customization Simulator API",
    version="0.1.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.api_cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(datasets.router, prefix="/api/projects", tags=["datasets"])
app.include_router(model_config.router, prefix="/api/projects", tags=["model-config"])
app.include_router(simulation.router, prefix="/api/projects", tags=["simulation"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
