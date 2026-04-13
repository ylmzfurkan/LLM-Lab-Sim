import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Float, BigInteger, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )

    # Upload info
    file_name: Mapped[str] = mapped_column(String, nullable=False)
    file_type: Mapped[str] = mapped_column(String, nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    row_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Simulated quality metrics (Module 2)
    quality_score: Mapped[float] = mapped_column(Float, default=0.0)
    duplicate_ratio: Mapped[float] = mapped_column(Float, default=0.0)
    language_distribution: Mapped[dict] = mapped_column(JSONB, default=dict)
    avg_text_length: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Cleaning results (Module 3)
    is_cleaned: Mapped[bool] = mapped_column(Boolean, default=False)
    cleaning_config: Mapped[dict] = mapped_column(JSONB, default=dict)
    cleaned_row_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cleaned_quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Tokenizer results (Module 4)
    tokenizer_type: Mapped[str | None] = mapped_column(String, nullable=True)
    token_count: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    estimated_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    context_utilization: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    project: Mapped["Project"] = relationship(back_populates="datasets")
