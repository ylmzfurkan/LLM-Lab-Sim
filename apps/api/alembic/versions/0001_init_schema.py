"""init schema

Revision ID: 0001_init_schema
Revises:
Create Date: 2026-04-13

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_init_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("auth_id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("display_name", sa.String(), nullable=True),
        sa.Column("preferred_locale", sa.String(), nullable=False, server_default="en"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("auth_id"),
    )

    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="draft"),
        sa.Column("current_step", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("model_purpose", sa.String(), nullable=True),
        sa.Column("target_domain", sa.String(), nullable=True),
        sa.Column("model_language", sa.String(), nullable=True),
        sa.Column("model_type", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user_profiles.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "datasets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("file_name", sa.String(), nullable=False),
        sa.Column("file_type", sa.String(), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("row_count", sa.Integer(), nullable=True),
        sa.Column("quality_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("duplicate_ratio", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("language_distribution", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("avg_text_length", sa.Float(), nullable=True),
        sa.Column("is_cleaned", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("cleaning_config", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("cleaned_row_count", sa.Integer(), nullable=True),
        sa.Column("cleaned_quality_score", sa.Float(), nullable=True),
        sa.Column("tokenizer_type", sa.String(), nullable=True),
        sa.Column("token_count", sa.BigInteger(), nullable=True),
        sa.Column("estimated_cost", sa.Float(), nullable=True),
        sa.Column("context_utilization", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "model_configs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("model_size", sa.String(), nullable=True),
        sa.Column("parameter_count", sa.BigInteger(), nullable=True),
        sa.Column("context_window", sa.Integer(), nullable=True),
        sa.Column("architecture_type", sa.String(), nullable=True),
        sa.Column("num_layers", sa.Integer(), nullable=True),
        sa.Column("hidden_size", sa.Integer(), nullable=True),
        sa.Column("num_attention_heads", sa.Integer(), nullable=True),
        sa.Column("gpu_requirement", sa.Integer(), nullable=True),
        sa.Column("estimated_training_hours", sa.Float(), nullable=True),
        sa.Column("estimated_training_cost", sa.Float(), nullable=True),
        sa.Column("mode", sa.String(), nullable=False, server_default="beginner"),
        sa.Column("epochs", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("batch_size", sa.Integer(), nullable=False, server_default="32"),
        sa.Column("learning_rate", sa.Float(), nullable=False, server_default="0.0001"),
        sa.Column("optimizer", sa.String(), nullable=False, server_default="adamw"),
        sa.Column("warmup_steps", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("weight_decay", sa.Float(), nullable=False, server_default="0.01"),
        sa.Column("gradient_accumulation_steps", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("fp16", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("project_id"),
    )

    op.create_table(
        "simulation_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("run_type", sa.String(), nullable=False),
        sa.Column("input_state", postgresql.JSONB(), nullable=False),
        sa.Column("scores", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("loss_curve", postgresql.JSONB(), nullable=True),
        sa.Column("gpu_usage", postgresql.JSONB(), nullable=True),
        sa.Column("training_logs", postgresql.JSONB(), nullable=True),
        sa.Column("checkpoints", postgresql.JSONB(), nullable=True),
        sa.Column("warnings", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("benchmark_results", postgresql.JSONB(), nullable=True),
        sa.Column("customization_type", sa.String(), nullable=True),
        sa.Column("customization_config", postgresql.JSONB(), nullable=True),
        sa.Column("customization_results", postgresql.JSONB(), nullable=True),
        sa.Column("deployment_config", postgresql.JSONB(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
    )

    op.create_index("ix_projects_user_id", "projects", ["user_id"])
    op.create_index("ix_datasets_project_id", "datasets", ["project_id"])
    op.create_index("ix_simulation_runs_project_id", "simulation_runs", ["project_id"])


def downgrade() -> None:
    op.drop_index("ix_simulation_runs_project_id", table_name="simulation_runs")
    op.drop_index("ix_datasets_project_id", table_name="datasets")
    op.drop_index("ix_projects_user_id", table_name="projects")
    op.drop_table("simulation_runs")
    op.drop_table("model_configs")
    op.drop_table("datasets")
    op.drop_table("projects")
    op.drop_table("user_profiles")
