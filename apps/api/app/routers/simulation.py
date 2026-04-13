import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.project import Project
from app.models.dataset import Dataset
from app.models.model_config import ModelConfig
from app.models.simulation import SimulationRun
from app.models.user import UserProfile
from app.engine.core import SimulationEngine, SimulationState

router = APIRouter()


async def _get_user_project(
    project_id: uuid.UUID, user: UserProfile, db: AsyncSession
) -> Project:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


async def _build_engine(project: Project, db: AsyncSession) -> SimulationEngine:
    """Build a SimulationEngine from the current project state."""
    state = SimulationState()

    # Apply wizard config
    if project.model_purpose:
        state.model_purpose = project.model_purpose
        state.target_domain = project.target_domain or "general"
        state.model_language = project.model_language or "en"
        state.model_type = project.model_type or "base"

    # Apply dataset if exists
    result = await db.execute(
        select(Dataset)
        .where(Dataset.project_id == project.id)
        .order_by(Dataset.created_at.desc())
        .limit(1)
    )
    dataset = result.scalar_one_or_none()
    if dataset:
        state.dataset_quality = dataset.quality_score or 0
        state.data_quality = dataset.cleaned_quality_score or dataset.quality_score or 0
        state.duplicate_ratio = dataset.duplicate_ratio or 0
        state.dataset_rows = dataset.row_count or 0
        state.cleaned_rows = dataset.cleaned_row_count or dataset.row_count or 0
        state.avg_text_length = dataset.avg_text_length or 200
        state.token_count = dataset.token_count or 0
        state.context_utilization = dataset.context_utilization or 0
        if dataset.tokenizer_type:
            state.tokenizer_type = dataset.tokenizer_type

    # Apply model config if exists
    result = await db.execute(
        select(ModelConfig).where(ModelConfig.project_id == project.id)
    )
    model_config = result.scalar_one_or_none()
    if model_config:
        state.model_size = model_config.model_size or "medium"
        state.context_window = model_config.context_window or 4096
        state.architecture_type = model_config.architecture_type or "dense"
        state.epochs = model_config.epochs
        state.batch_size = model_config.batch_size
        state.learning_rate = model_config.learning_rate
        state.optimizer = model_config.optimizer
        state.fp16 = model_config.fp16
        state.gpu_requirement = model_config.gpu_requirement or 4
        state.training_hours = model_config.estimated_training_hours or 0
        state.training_cost = model_config.estimated_training_cost or 0
        if model_config.model_size:
            state.architecture_capability = {
                "small": 40, "medium": 70, "large": 95
            }.get(model_config.model_size, 60)

    return SimulationEngine(state)


# ── Simulation endpoints ─────────────────────────────────────────────────

class TrainingSimRequest(BaseModel):
    locale: str = "en"


@router.post("/{project_id}/simulate/training")
async def run_training_simulation(
    project_id: uuid.UUID,
    data: TrainingSimRequest = TrainingSimRequest(),
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_user_project(project_id, user, db)
    engine = await _build_engine(project, db)

    # Run training config scoring first
    engine.apply_training_config(
        epochs=engine.state.epochs,
        batch_size=engine.state.batch_size,
        learning_rate=engine.state.learning_rate,
        optimizer=engine.state.optimizer,
        fp16=engine.state.fp16,
    )

    result = engine.run_training(locale=data.locale)

    # Save simulation run
    run = SimulationRun(
        project_id=project.id,
        run_type="pretraining",
        input_state=engine.state.to_dict(),
        scores=result["scores"],
        loss_curve=result["loss_curve"],
        gpu_usage=result["gpu_usage"],
        training_logs=result["training_logs"],
        checkpoints=result["checkpoints"],
        warnings=result["warnings"],
        completed_at=datetime.now(timezone.utc),
    )
    db.add(run)

    if project.current_step < 8:
        project.current_step = 8

    await db.commit()
    await db.refresh(run)

    return {
        "id": str(run.id),
        **result,
    }


@router.get("/{project_id}/report")
async def get_report(
    project_id: uuid.UUID,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_user_project(project_id, user, db)
    engine = await _build_engine(project, db)

    # Need to compute performance first
    engine.apply_training_config(
        epochs=engine.state.epochs,
        batch_size=engine.state.batch_size,
        learning_rate=engine.state.learning_rate,
        optimizer=engine.state.optimizer,
    )
    engine.run_training()

    return engine.generate_report()


class CustomizationRequest(BaseModel):
    customization_type: str


@router.post("/{project_id}/simulate/customization")
async def apply_customization(
    project_id: uuid.UUID,
    data: CustomizationRequest,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_user_project(project_id, user, db)
    engine = await _build_engine(project, db)
    return engine.apply_customization(data.customization_type)


class RAGRequest(BaseModel):
    chunk_size: int = 512
    top_k: int = 5


@router.post("/{project_id}/simulate/rag")
async def run_rag_simulation(
    project_id: uuid.UUID,
    data: RAGRequest = RAGRequest(),
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_user_project(project_id, user, db)
    engine = await _build_engine(project, db)
    return engine.run_rag(chunk_size=data.chunk_size, top_k=data.top_k)


class FineTuneRequest(BaseModel):
    finetune_epochs: int = 3
    finetune_lr: float = 2e-5


@router.post("/{project_id}/simulate/finetune")
async def run_finetune_simulation(
    project_id: uuid.UUID,
    data: FineTuneRequest = FineTuneRequest(),
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_user_project(project_id, user, db)
    engine = await _build_engine(project, db)
    return engine.run_finetune(finetune_epochs=data.finetune_epochs, finetune_lr=data.finetune_lr)


class PlaygroundRequest(BaseModel):
    prompt: str
    model_variant: str = "base"


@router.post("/{project_id}/playground")
async def run_playground(
    project_id: uuid.UUID,
    data: PlaygroundRequest,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_user_project(project_id, user, db)
    engine = await _build_engine(project, db)
    return engine.run_playground(prompt=data.prompt, model_variant=data.model_variant)


@router.post("/{project_id}/simulate/evaluation")
async def run_evaluation(
    project_id: uuid.UUID,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_user_project(project_id, user, db)
    engine = await _build_engine(project, db)
    return engine.run_evaluation()


@router.post("/{project_id}/simulate/deployment")
async def run_deployment_simulation(
    project_id: uuid.UUID,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_user_project(project_id, user, db)
    engine = await _build_engine(project, db)
    return engine.run_deployment()


@router.get("/{project_id}/simulations")
async def list_simulations(
    project_id: uuid.UUID,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_user_project(project_id, user, db)

    result = await db.execute(
        select(SimulationRun)
        .where(SimulationRun.project_id == project_id)
        .order_by(SimulationRun.created_at.desc())
    )
    runs = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "run_type": r.run_type,
            "scores": r.scores,
            "created_at": r.created_at.isoformat(),
        }
        for r in runs
    ]
