"""
SimulationEngine - the central nervous system of the platform.

Converts user decisions into realistic AI outcomes through score propagation.
Each apply_* method is idempotent given the same inputs.
"""

from dataclasses import dataclass, field, asdict

from app.engine.scoring import (
    clamp,
    score_wizard,
    score_dataset,
    score_cleaning,
    score_tokenizer,
    score_architecture,
    score_training_config,
)
from app.engine.curves import (
    generate_loss_curve,
    generate_gpu_usage,
    generate_training_logs,
    generate_checkpoints,
)
from app.engine.benchmarks import generate_benchmarks, generate_weakness_analysis
from app.engine.warnings import generate_warnings
from app.engine.costs import estimate_training_cost, estimate_deployment_cost


@dataclass
class SimulationState:
    # Wizard
    model_purpose: str = "general"
    target_domain: str = "general"
    model_language: str = "en"
    model_type: str = "base"

    # Scores
    data_quality: float = 0.0
    training_stability: float = 0.0
    model_performance: float = 0.0
    cost_efficiency: float = 0.0

    # Sub-scores
    wizard_difficulty: float = 0.5
    dataset_quality: float = 0.0
    cleaned_quality: float = 0.0
    dataset_rows: int = 0
    cleaned_rows: int = 0
    duplicate_ratio: float = 0.0
    avg_text_length: float = 0.0
    tokenizer_efficiency: float = 0.0
    token_count: int = 0
    context_utilization: float = 0.0
    architecture_capability: float = 0.0

    # Config
    model_size: str = "medium"
    context_window: int = 4096
    architecture_type: str = "dense"
    tokenizer_type: str = "general"
    epochs: int = 3
    batch_size: int = 32
    learning_rate: float = 0.0001
    optimizer: str = "adamw"
    fp16: bool = True
    gpu_requirement: int = 4
    training_hours: float = 0.0
    training_cost: float = 0.0

    # Customization
    customization_type: str | None = None
    customization_boost: float = 0.0

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "SimulationState":
        valid_fields = {f.name for f in cls.__dataclass_fields__.values()}
        filtered = {k: v for k, v in data.items() if k in valid_fields}
        return cls(**filtered)


class SimulationEngine:
    def __init__(self, state: SimulationState | None = None):
        self.state = state or SimulationState()

    def apply_wizard(
        self,
        model_purpose: str,
        target_domain: str,
        model_language: str,
        model_type: str,
    ) -> dict:
        """Apply wizard configuration and return initial scores."""
        self.state.model_purpose = model_purpose
        self.state.target_domain = target_domain
        self.state.model_language = model_language
        self.state.model_type = model_type

        result = score_wizard(model_purpose, target_domain, model_language, model_type)

        self.state.wizard_difficulty = result["difficulty"]
        self.state.data_quality = result["base_data_quality"]
        self.state.cost_efficiency = result["base_cost_efficiency"]

        return {
            "scores": self._get_scores(),
            **result,
        }

    def apply_dataset(
        self,
        file_type: str,
        file_size_bytes: int,
        row_count: int | None,
    ) -> dict:
        """Apply dataset and compute quality metrics."""
        result = score_dataset(
            file_type=file_type,
            file_size_bytes=file_size_bytes,
            row_count=row_count,
            model_language=self.state.model_language,
            target_domain=self.state.target_domain,
        )

        self.state.dataset_quality = result["quality_score"]
        self.state.data_quality = result["quality_score"]
        self.state.duplicate_ratio = result["duplicate_ratio"]
        self.state.avg_text_length = result["avg_text_length"]
        self.state.dataset_rows = result["estimated_rows"]

        return {
            "scores": self._get_scores(),
            **result,
        }

    def apply_cleaning(
        self,
        remove_duplicates: bool,
        filter_spam: bool,
        mask_pii: bool,
    ) -> dict:
        """Apply data cleaning operations."""
        result = score_cleaning(
            quality_score=self.state.dataset_quality,
            duplicate_ratio=self.state.duplicate_ratio,
            row_count=self.state.dataset_rows,
            remove_duplicates=remove_duplicates,
            filter_spam=filter_spam,
            mask_pii=mask_pii,
        )

        self.state.cleaned_quality = result["cleaned_quality_score"]
        self.state.data_quality = result["cleaned_quality_score"]
        self.state.cleaned_rows = result["cleaned_row_count"]

        return {
            "scores": self._get_scores(),
            **result,
        }

    def apply_tokenizer(self, tokenizer_type: str) -> dict:
        """Apply tokenizer selection."""
        self.state.tokenizer_type = tokenizer_type

        result = score_tokenizer(
            tokenizer_type=tokenizer_type,
            cleaned_rows=self.state.cleaned_rows or self.state.dataset_rows,
            avg_text_length=self.state.avg_text_length or 200,
            model_language=self.state.model_language,
            context_window=self.state.context_window,
        )

        self.state.tokenizer_efficiency = result["efficiency_score"]
        self.state.token_count = result["token_count"]
        self.state.context_utilization = result["context_utilization"]

        return {
            "scores": self._get_scores(),
            **result,
        }

    def apply_architecture(
        self,
        model_size: str,
        context_window: int,
        architecture_type: str,
    ) -> dict:
        """Apply model architecture selection."""
        self.state.model_size = model_size
        self.state.context_window = context_window
        self.state.architecture_type = architecture_type

        result = score_architecture(
            model_size=model_size,
            context_window=context_window,
            architecture_type=architecture_type,
            token_count=self.state.token_count or 1_000_000,
        )

        self.state.architecture_capability = result["architecture_capability"]
        self.state.gpu_requirement = result["gpu_requirement"]
        self.state.training_hours = result["estimated_training_hours"]
        self.state.training_cost = result["estimated_training_cost"]

        # Update cost efficiency
        max_cost = 100000
        self.state.cost_efficiency = clamp(100 - (result["estimated_training_cost"] / max_cost * 100))

        return {
            "scores": self._get_scores(),
            **result,
        }

    def apply_training_config(
        self,
        epochs: int,
        batch_size: int,
        learning_rate: float,
        optimizer: str,
        fp16: bool = True,
    ) -> dict:
        """Apply training hyperparameters."""
        self.state.epochs = epochs
        self.state.batch_size = batch_size
        self.state.learning_rate = learning_rate
        self.state.optimizer = optimizer
        self.state.fp16 = fp16

        result = score_training_config(
            epochs=epochs,
            batch_size=batch_size,
            learning_rate=learning_rate,
            optimizer=optimizer,
            model_size=self.state.model_size,
            data_quality=self.state.data_quality,
        )

        self.state.training_stability = result["training_stability"]

        return {
            "scores": self._get_scores(),
            **result,
        }

    def run_training(self, locale: str = "en") -> dict:
        """Run the full training simulation."""
        # Compute model performance from all factors
        self.state.model_performance = clamp(
            self.state.architecture_capability * 0.3
            + self.state.data_quality * 0.3
            + self.state.training_stability * 0.3
            + self.state.tokenizer_efficiency * 0.1
        )

        loss_curve = generate_loss_curve(
            epochs=self.state.epochs,
            learning_rate=self.state.learning_rate,
            training_stability=self.state.training_stability,
            data_quality=self.state.data_quality,
        )

        gpu_usage = generate_gpu_usage(
            epochs=self.state.epochs,
            model_size=self.state.model_size,
            batch_size=self.state.batch_size,
            fp16=self.state.fp16,
        )

        logs = generate_training_logs(
            epochs=self.state.epochs,
            learning_rate=self.state.learning_rate,
            training_stability=self.state.training_stability,
            loss_curve=loss_curve,
        )

        checkpoints = generate_checkpoints(
            epochs=self.state.epochs,
            loss_curve=loss_curve,
        )

        warnings = generate_warnings(
            locale=locale,
            model_size=self.state.model_size,
            learning_rate=self.state.learning_rate,
            epochs=self.state.epochs,
            row_count=self.state.cleaned_rows or self.state.dataset_rows,
            duplicate_ratio=self.state.duplicate_ratio,
            tokenizer_type=self.state.tokenizer_type,
            model_language=self.state.model_language,
            context_utilization=self.state.context_utilization,
            architecture_type=self.state.architecture_type,
            training_stability=self.state.training_stability,
        )

        return {
            "scores": self._get_scores(),
            "loss_curve": loss_curve,
            "gpu_usage": gpu_usage,
            "training_logs": logs,
            "checkpoints": checkpoints,
            "warnings": warnings,
        }

    def generate_report(self) -> dict:
        """Generate the base model report with benchmarks."""
        benchmarks = generate_benchmarks(
            model_performance=self.state.model_performance,
            model_size=self.state.model_size,
            model_purpose=self.state.model_purpose,
            target_domain=self.state.target_domain,
            data_quality=self.state.data_quality,
        )

        weaknesses = generate_weakness_analysis(
            benchmarks=benchmarks,
            data_quality=self.state.data_quality,
            training_stability=self.state.training_stability,
        )

        return {
            "scores": self._get_scores(),
            "benchmarks": benchmarks,
            "weaknesses": weaknesses,
            "model_summary": {
                "size": self.state.model_size,
                "parameters": {"small": "1B", "medium": "7B", "large": "70B"}.get(self.state.model_size, "7B"),
                "architecture": self.state.architecture_type,
                "context_window": self.state.context_window,
                "training_epochs": self.state.epochs,
                "dataset_rows": self.state.cleaned_rows or self.state.dataset_rows,
            },
        }

    def apply_customization(self, customization_type: str) -> dict:
        """Apply a customization method."""
        self.state.customization_type = customization_type

        boost = {
            "rag": 8,
            "finetune": 15,
            "lora": 12,
            "instruction_tuning": 10,
        }.get(customization_type, 10)

        self.state.customization_boost = boost
        self.state.model_performance = clamp(self.state.model_performance + boost)

        return {
            "scores": self._get_scores(),
            "customization_type": customization_type,
            "performance_boost": boost,
        }

    def run_rag(self, chunk_size: int = 512, top_k: int = 5) -> dict:
        """Simulate RAG pipeline."""
        retrieval_accuracy = clamp(
            60 + self.state.data_quality * 0.2 + (1 - chunk_size / 2048) * 15
        )
        answer_quality = clamp(
            self.state.model_performance * 0.5 + retrieval_accuracy * 0.5
        )

        return {
            "scores": self._get_scores(),
            "chunk_size": chunk_size,
            "top_k": top_k,
            "retrieval_accuracy": round(retrieval_accuracy, 1),
            "answer_quality": round(answer_quality, 1),
            "pipeline_steps": [
                {"step": "Chunking", "detail": f"Split into {chunk_size}-token chunks"},
                {"step": "Embedding", "detail": "Generated vector embeddings"},
                {"step": "Retrieval", "detail": f"Retrieved top-{top_k} relevant chunks"},
                {"step": "Generation", "detail": "Generated answer with context"},
            ],
        }

    def run_finetune(self, finetune_epochs: int = 3, finetune_lr: float = 2e-5) -> dict:
        """Simulate fine-tuning."""
        base_perf = self.state.model_performance
        improvement = clamp(
            10 + self.state.data_quality * 0.1 + finetune_epochs * 2,
            lo=5, hi=25,
        )

        accuracy_before = base_perf
        accuracy_after = clamp(base_perf + improvement)
        hallucination_before = clamp(100 - base_perf)
        hallucination_after = clamp(hallucination_before - improvement * 0.8)

        self.state.model_performance = accuracy_after

        return {
            "scores": self._get_scores(),
            "accuracy_before": round(accuracy_before, 1),
            "accuracy_after": round(accuracy_after, 1),
            "accuracy_improvement": round(improvement, 1),
            "hallucination_before": round(hallucination_before, 1),
            "hallucination_after": round(hallucination_after, 1),
            "dataset_split": {"train": 0.8, "validation": 0.1, "test": 0.1},
        }

    def run_playground(self, prompt: str, model_variant: str) -> dict:
        """Simulate model response for playground."""
        quality_map = {
            "base": self.state.model_performance * 0.6,
            "finetuned": self.state.model_performance,
            "rag": self.state.model_performance * 0.9,
        }
        quality = quality_map.get(model_variant, self.state.model_performance * 0.7)

        latency = {"base": 120, "finetuned": 150, "rag": 250}.get(model_variant, 150)

        return {
            "model_variant": model_variant,
            "response_quality": round(quality, 1),
            "latency_ms": latency,
            "confidence": round(clamp(quality + 10), 1),
        }

    def run_evaluation(self) -> dict:
        """Run comprehensive evaluation."""
        base_perf = self.state.model_performance

        return {
            "scores": self._get_scores(),
            "metrics": {
                "accuracy": round(clamp(base_perf + 5), 1),
                "hallucination_risk": round(clamp(100 - base_perf), 1),
                "response_quality": round(clamp(base_perf - 3), 1),
                "latency_ms": {"small": 50, "medium": 150, "large": 500}.get(self.state.model_size, 150),
            },
            "comparison": {
                "base": round(base_perf * 0.6, 1),
                "finetuned": round(base_perf, 1),
                "rag": round(base_perf * 0.9, 1),
            },
        }

    def run_deployment(self) -> dict:
        """Simulate deployment."""
        training_costs = estimate_training_cost(
            model_size=self.state.model_size,
            training_hours=self.state.training_hours,
            gpu_count=self.state.gpu_requirement,
            architecture_type=self.state.architecture_type,
        )

        deployment_costs = estimate_deployment_cost(
            model_size=self.state.model_size,
        )

        api_endpoint = f"https://api.llm-lab.ai/v1/models/{self.state.model_purpose}-{self.state.model_size}/completions"

        return {
            "scores": self._get_scores(),
            "training_costs": training_costs,
            "deployment_costs": deployment_costs,
            "api_endpoint": api_endpoint,
            "api_example": {
                "method": "POST",
                "url": api_endpoint,
                "body": {
                    "prompt": "Hello, world!",
                    "max_tokens": 100,
                    "temperature": 0.7,
                },
            },
        }

    def _get_scores(self) -> dict:
        return {
            "data_quality": round(self.state.data_quality, 1),
            "training_stability": round(self.state.training_stability, 1),
            "model_performance": round(self.state.model_performance, 1),
            "cost_efficiency": round(self.state.cost_efficiency, 1),
        }
