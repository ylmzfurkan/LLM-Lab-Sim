import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.model_config import ModelConfig
from app.models.project import Project
from app.models.user import UserProfile
from app.engine.scoring import score_architecture, score_training_config

router = APIRouter()


class ArchitectureConfig(BaseModel):
    model_size: str
    context_window: int = 4096
    architecture_type: str = "dense"


class TrainingConfigRequest(BaseModel):
    mode: str = "beginner"
    epochs: int = 3
    batch_size: int = 32
    learning_rate: float = 0.0001
    optimizer: str = "adamw"
    warmup_steps: int = 100
    weight_decay: float = 0.01
    gradient_accumulation_steps: int = 1
    fp16: bool = True


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


async def _get_or_create_config(
    project_id: uuid.UUID, db: AsyncSession
) -> ModelConfig:
    result = await db.execute(
        select(ModelConfig).where(ModelConfig.project_id == project_id)
    )
    config = result.scalar_one_or_none()
    if not config:
        config = ModelConfig(project_id=project_id)
        db.add(config)
    return config


@router.post("/{project_id}/model-config/architecture")
async def set_architecture(
    project_id: uuid.UUID,
    data: ArchitectureConfig,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_user_project(project_id, user, db)
    config = await _get_or_create_config(project.id, db)

    # Get token count from dataset if available
    from app.models.dataset import Dataset
    ds_result = await db.execute(
        select(Dataset).where(Dataset.project_id == project.id).order_by(Dataset.created_at.desc()).limit(1)
    )
    dataset = ds_result.scalar_one_or_none()
    token_count = dataset.token_count if dataset and dataset.token_count else 1_000_000

    metrics = score_architecture(
        model_size=data.model_size,
        context_window=data.context_window,
        architecture_type=data.architecture_type,
        token_count=token_count,
    )

    config.model_size = data.model_size
    config.context_window = data.context_window
    config.architecture_type = data.architecture_type
    config.parameter_count = metrics["parameter_count"]
    config.num_layers = metrics["num_layers"]
    config.hidden_size = metrics["hidden_size"]
    config.num_attention_heads = metrics["num_attention_heads"]
    config.gpu_requirement = metrics["gpu_requirement"]
    config.estimated_training_hours = metrics["estimated_training_hours"]
    config.estimated_training_cost = metrics["estimated_training_cost"]

    if project.current_step < 6:
        project.current_step = 6

    await db.commit()

    return metrics


@router.post("/{project_id}/model-config/training")
async def set_training_config(
    project_id: uuid.UUID,
    data: TrainingConfigRequest,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_user_project(project_id, user, db)
    config = await _get_or_create_config(project.id, db)

    # Get current data quality
    data_quality = 50.0  # default
    from app.models.dataset import Dataset
    ds_result = await db.execute(
        select(Dataset).where(Dataset.project_id == project.id).order_by(Dataset.created_at.desc()).limit(1)
    )
    dataset = ds_result.scalar_one_or_none()
    if dataset:
        data_quality = dataset.cleaned_quality_score or dataset.quality_score or 50.0

    metrics = score_training_config(
        epochs=data.epochs,
        batch_size=data.batch_size,
        learning_rate=data.learning_rate,
        optimizer=data.optimizer,
        model_size=config.model_size or "medium",
        data_quality=data_quality,
    )

    config.mode = data.mode
    config.epochs = data.epochs
    config.batch_size = data.batch_size
    config.learning_rate = data.learning_rate
    config.optimizer = data.optimizer
    config.warmup_steps = data.warmup_steps
    config.weight_decay = data.weight_decay
    config.gradient_accumulation_steps = data.gradient_accumulation_steps
    config.fp16 = data.fp16

    if project.current_step < 7:
        project.current_step = 7

    await db.commit()

    return metrics


@router.get("/{project_id}/model-config")
async def get_model_config(
    project_id: uuid.UUID,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_user_project(project_id, user, db)

    result = await db.execute(
        select(ModelConfig).where(ModelConfig.project_id == project_id)
    )
    config = result.scalar_one_or_none()
    if not config:
        return None

    return {
        "model_size": config.model_size,
        "parameter_count": config.parameter_count,
        "context_window": config.context_window,
        "architecture_type": config.architecture_type,
        "num_layers": config.num_layers,
        "hidden_size": config.hidden_size,
        "num_attention_heads": config.num_attention_heads,
        "gpu_requirement": config.gpu_requirement,
        "estimated_training_hours": config.estimated_training_hours,
        "estimated_training_cost": config.estimated_training_cost,
        "mode": config.mode,
        "epochs": config.epochs,
        "batch_size": config.batch_size,
        "learning_rate": config.learning_rate,
        "optimizer": config.optimizer,
        "fp16": config.fp16,
    }
