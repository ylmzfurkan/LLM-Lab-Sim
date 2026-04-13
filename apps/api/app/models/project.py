import uuid
from datetime import datetime

from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="draft")
    current_step: Mapped[int] = mapped_column(Integer, default=1)

    # Wizard config (Module 1)
    model_purpose: Mapped[str | None] = mapped_column(String, nullable=True)
    target_domain: Mapped[str | None] = mapped_column(String, nullable=True)
    model_language: Mapped[str | None] = mapped_column(String, nullable=True)
    model_type: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["UserProfile"] = relationship(back_populates="projects")
    datasets: Mapped[list["Dataset"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    model_config_rel: Mapped["ModelConfig | None"] = relationship(
        back_populates="project", cascade="all, delete-orphan", uselist=False
    )
    simulation_runs: Mapped[list["SimulationRun"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
