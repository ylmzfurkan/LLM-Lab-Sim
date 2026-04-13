import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Float, BigInteger, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ModelConfig(Base):
    __tablename__ = "model_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # Architecture (Module 5)
    model_size: Mapped[str | None] = mapped_column(String, nullable=True)
    parameter_count: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    context_window: Mapped[int | None] = mapped_column(Integer, nullable=True)
    architecture_type: Mapped[str | None] = mapped_column(String, nullable=True)
    num_layers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hidden_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    num_attention_heads: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gpu_requirement: Mapped[int | None] = mapped_column(Integer, nullable=True)
    estimated_training_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_training_cost: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Training config (Module 6)
    mode: Mapped[str] = mapped_column(String, default="beginner")
    epochs: Mapped[int] = mapped_column(Integer, default=3)
    batch_size: Mapped[int] = mapped_column(Integer, default=32)
    learning_rate: Mapped[float] = mapped_column(Float, default=0.0001)
    optimizer: Mapped[str] = mapped_column(String, default="adamw")
    warmup_steps: Mapped[int] = mapped_column(Integer, default=100)
    weight_decay: Mapped[float] = mapped_column(Float, default=0.01)
    gradient_accumulation_steps: Mapped[int] = mapped_column(Integer, default=1)
    fp16: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    project: Mapped["Project"] = relationship(back_populates="model_config_rel")
