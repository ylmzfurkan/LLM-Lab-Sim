import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.dataset import Dataset
from app.models.project import Project
from app.models.user import UserProfile
from app.engine.scoring import score_dataset, score_cleaning, score_tokenizer

router = APIRouter()


class DatasetCreate(BaseModel):
    file_name: str
    file_type: str
    file_size_bytes: int
    row_count: int | None = None


class CleaningConfig(BaseModel):
    remove_duplicates: bool = True
    filter_spam: bool = True
    mask_pii: bool = False


class TokenizerConfig(BaseModel):
    tokenizer_type: str


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


@router.post("/{project_id}/dataset")
async def create_dataset(
    project_id: uuid.UUID,
    data: DatasetCreate,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_user_project(project_id, user, db)

    # Run simulation engine scoring
    metrics = score_dataset(
        file_type=data.file_type,
        file_size_bytes=data.file_size_bytes,
        row_count=data.row_count,
        model_language=project.model_language or "en",
        target_domain=project.target_domain or "general",
    )

    dataset = Dataset(
        project_id=project.id,
        file_name=data.file_name,
        file_type=data.file_type,
        file_size_bytes=data.file_size_bytes,
        row_count=metrics["estimated_rows"],
        quality_score=metrics["quality_score"],
        duplicate_ratio=metrics["duplicate_ratio"],
        language_distribution=metrics["language_distribution"],
        avg_text_length=metrics["avg_text_length"],
    )
    db.add(dataset)

    if project.current_step < 3:
        project.current_step = 3

    await db.commit()
    await db.refresh(dataset)

    return {
        "id": str(dataset.id),
        **metrics,
    }


@router.put("/{project_id}/dataset/{dataset_id}/clean")
async def clean_dataset(
    project_id: uuid.UUID,
    dataset_id: uuid.UUID,
    data: CleaningConfig,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_user_project(project_id, user, db)

    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id, Dataset.project_id == project_id)
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    metrics = score_cleaning(
        quality_score=dataset.quality_score,
        duplicate_ratio=dataset.duplicate_ratio,
        row_count=dataset.row_count or 1000,
        remove_duplicates=data.remove_duplicates,
        filter_spam=data.filter_spam,
        mask_pii=data.mask_pii,
    )

    dataset.is_cleaned = True
    dataset.cleaning_config = data.model_dump()
    dataset.cleaned_quality_score = metrics["cleaned_quality_score"]
    dataset.cleaned_row_count = metrics["cleaned_row_count"]

    if project.current_step < 4:
        project.current_step = 4

    await db.commit()
    await db.refresh(dataset)

    return {
        "id": str(dataset.id),
        **metrics,
    }


@router.put("/{project_id}/dataset/{dataset_id}/tokenizer")
async def set_tokenizer(
    project_id: uuid.UUID,
    dataset_id: uuid.UUID,
    data: TokenizerConfig,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_user_project(project_id, user, db)

    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id, Dataset.project_id == project_id)
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    rows = dataset.cleaned_row_count or dataset.row_count or 1000
    avg_len = dataset.avg_text_length or 200

    metrics = score_tokenizer(
        tokenizer_type=data.tokenizer_type,
        cleaned_rows=rows,
        avg_text_length=avg_len,
        model_language=project.model_language or "en",
    )

    dataset.tokenizer_type = data.tokenizer_type
    dataset.token_count = metrics["token_count"]
    dataset.estimated_cost = metrics["estimated_cost"]
    dataset.context_utilization = metrics["context_utilization"]

    if project.current_step < 5:
        project.current_step = 5

    await db.commit()
    await db.refresh(dataset)

    return {
        "id": str(dataset.id),
        **metrics,
    }


@router.get("/{project_id}/datasets")
async def list_datasets(
    project_id: uuid.UUID,
    user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_user_project(project_id, user, db)

    result = await db.execute(
        select(Dataset)
        .where(Dataset.project_id == project_id)
        .order_by(Dataset.created_at.desc())
    )
    datasets = result.scalars().all()
    return [
        {
            "id": str(d.id),
            "file_name": d.file_name,
            "file_type": d.file_type,
            "quality_score": d.quality_score,
            "cleaned_quality_score": d.cleaned_quality_score,
            "is_cleaned": d.is_cleaned,
            "tokenizer_type": d.tokenizer_type,
            "row_count": d.row_count,
        }
        for d in datasets
    ]
