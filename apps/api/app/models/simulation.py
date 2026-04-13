import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    run_type: Mapped[str] = mapped_column(String, nullable=False)

    # Simulation state snapshot
    input_state: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Results
    scores: Mapped[dict] = mapped_column(JSONB, default=dict)
    loss_curve: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    gpu_usage: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    training_logs: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    checkpoints: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    warnings: Mapped[list] = mapped_column(JSONB, default=list)
    benchmark_results: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Customization-specific
    customization_type: Mapped[str | None] = mapped_column(String, nullable=True)
    customization_config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    customization_results: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Deployment-specific
    deployment_config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    project: Mapped["Project"] = relationship(back_populates="simulation_runs")
