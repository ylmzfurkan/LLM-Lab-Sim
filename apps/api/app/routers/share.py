import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.project import Project
from app.models.share import ShareToken
from app.models.user import UserProfile
from app.routers.simulation import _build_engine

router = APIRouter()


@router.post("/api/projects/{project_id}/share")
async def create_share_token(
    project_id: uuid.UUID,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Return existing token if already shared
    existing = await db.execute(
        select(ShareToken).where(ShareToken.project_id == project_id)
    )
    token_row = existing.scalar_one_or_none()
    if token_row:
        return {"token": token_row.token}

    token_row = ShareToken(project_id=project_id)
    db.add(token_row)
    await db.commit()
    await db.refresh(token_row)
    return {"token": token_row.token}


@router.get("/api/share/{token}")
async def get_shared_report(token: str, locale: str = "en", db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ShareToken).where(ShareToken.token == token))
    token_row = result.scalar_one_or_none()
    if not token_row:
        raise HTTPException(status_code=404, detail="Share link not found")

    proj_result = await db.execute(select(Project).where(Project.id == token_row.project_id))
    project = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    engine = await _build_engine(project, db)
    engine.apply_training_config(
        epochs=engine.state.epochs,
        batch_size=engine.state.batch_size,
        learning_rate=engine.state.learning_rate,
        optimizer=engine.state.optimizer,
    )
    engine.run_training()
    report = engine.generate_report(locale=locale)

    return {
        "project": {
            "name": project.name,
            "description": project.description,
            "model_purpose": project.model_purpose,
            "target_domain": project.target_domain,
            "model_language": project.model_language,
            "model_type": project.model_type,
        },
        "report": report,
    }
