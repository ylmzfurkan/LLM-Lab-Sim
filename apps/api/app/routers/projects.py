import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.project import Project
from app.models.user import UserProfile
from app.schemas.project import ProjectCreate, ProjectResponse, WizardConfig
from app.engine.core import SimulationEngine
from app.engine.presets import get_preset

router = APIRouter()


@router.post("", response_model=ProjectResponse)
async def create_project(
    data: ProjectCreate,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = Project(
        user_id=user.id,
        name=data.name,
        description=data.description,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.user_id == user.id).order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()
    return [ProjectResponse.model_validate(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
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
    return ProjectResponse.model_validate(project)


@router.put("/{project_id}/wizard", response_model=ProjectResponse)
async def update_wizard(
    project_id: uuid.UUID,
    data: WizardConfig,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.model_purpose = data.model_purpose
    project.target_domain = data.target_domain
    project.model_language = data.model_language
    project.model_type = data.model_type
    project.status = "in_progress"
    if project.current_step < 2:
        project.current_step = 2

    # Run simulation engine to get initial scores
    engine = SimulationEngine()
    wizard_result = engine.apply_wizard(
        data.model_purpose, data.target_domain, data.model_language, data.model_type
    )
    preset = get_preset(data.model_purpose)

    await db.commit()
    await db.refresh(project)

    response = ProjectResponse.model_validate(project)
    return {
        **response.model_dump(),
        "wizard_result": wizard_result,
        "preset": preset,
    }


@router.delete("/{project_id}")
async def delete_project(
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

    await db.delete(project)
    await db.commit()
    return {"detail": "Project deleted"}
