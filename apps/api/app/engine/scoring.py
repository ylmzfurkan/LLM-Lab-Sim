"""
Simulation scoring formulas.

Each user decision maps to a numeric influence on one or more of the four core scores.
Scores propagate forward: wizard -> data -> training -> performance -> cost.
"""

import math
import random


def clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


# ── Wizard scoring ──────────────────────────────────────────────────────────

PURPOSE_WEIGHTS = {
    "chatbot": {"complexity": 0.6, "data_need": 0.7},
    "code_assistant": {"complexity": 0.8, "data_need": 0.9},
    "translation": {"complexity": 0.7, "data_need": 0.8},
    "summarization": {"complexity": 0.5, "data_need": 0.6},
    "general": {"complexity": 0.9, "data_need": 0.9},
}

DOMAIN_WEIGHTS = {
    "general": {"specificity": 0.3, "data_availability": 0.9},
    "medical": {"specificity": 0.9, "data_availability": 0.4},
    "legal": {"specificity": 0.8, "data_availability": 0.5},
    "finance": {"specificity": 0.7, "data_availability": 0.6},
    "tech": {"specificity": 0.6, "data_availability": 0.8},
    "education": {"specificity": 0.5, "data_availability": 0.7},
}


def score_wizard(
    model_purpose: str,
    target_domain: str,
    model_language: str,
    model_type: str,
) -> dict:
    """Returns baseline difficulty and recommendation scores from wizard choices."""
    purpose = PURPOSE_WEIGHTS.get(model_purpose, PURPOSE_WEIGHTS["general"])
    domain = DOMAIN_WEIGHTS.get(target_domain, DOMAIN_WEIGHTS["general"])

    # Higher complexity + specificity = harder project = lower initial scores
    difficulty = (purpose["complexity"] + domain["specificity"]) / 2
    data_challenge = 1.0 - (purpose["data_need"] + (1.0 - domain["data_availability"])) / 2

    # Multilingual is harder
    lang_penalty = 0.0
    if model_language == "multilingual":
        lang_penalty = 10.0
    elif model_language == "tr":
        lang_penalty = 5.0  # Less training data available

    base_data_quality = clamp(50.0 * data_challenge + 25.0 - lang_penalty)
    base_cost_efficiency = clamp(70.0 - difficulty * 30.0 - lang_penalty * 0.5)

    return {
        "difficulty": difficulty,
        "data_challenge": data_challenge,
        "base_data_quality": round(base_data_quality, 1),
        "base_cost_efficiency": round(base_cost_efficiency, 1),
        "recommended_model_size": _recommend_model_size(purpose["complexity"]),
        "recommended_dataset_size": _recommend_dataset_size(purpose["data_need"], domain["specificity"]),
    }


def _recommend_model_size(complexity: float) -> str:
    if complexity >= 0.8:
        return "large"
    elif complexity >= 0.6:
        return "medium"
    return "small"


def _recommend_dataset_size(data_need: float, specificity: float) -> str:
    score = (data_need + specificity) / 2
    if score >= 0.8:
        return "100K+ samples"
    elif score >= 0.6:
        return "50K-100K samples"
    elif score >= 0.4:
        return "10K-50K samples"
    return "5K-10K samples"


# ── Dataset scoring ─────────────────────────────────────────────────────────

FILE_TYPE_QUALITY = {
    "jsonl": 0.9,
    "csv": 0.7,
    "text": 0.5,
    "pdf": 0.4,
}


def score_dataset(
    file_type: str,
    file_size_bytes: int,
    row_count: int | None,
    model_language: str,
    target_domain: str,
) -> dict:
    """Compute simulated dataset quality metrics."""
    type_quality = FILE_TYPE_QUALITY.get(file_type, 0.5)

    # Size scoring (larger is better, with diminishing returns)
    size_mb = file_size_bytes / (1024 * 1024)
    size_factor = min(1.0, math.log2(max(1, size_mb)) / 10.0)

    # Estimate row count if not provided
    estimated_rows = row_count or int(size_mb * 1000 * type_quality)

    # Simulate quality score
    base_quality = type_quality * 60 + size_factor * 25
    noise = random.uniform(-3, 3)
    quality_score = clamp(base_quality + noise)

    # Simulate duplicate ratio (structured formats have fewer dupes)
    duplicate_ratio = clamp(
        random.uniform(0.02, 0.15) + (1 - type_quality) * 0.1,
        lo=0.01,
        hi=0.35,
    )

    # Language distribution
    if model_language == "multilingual":
        lang_dist = {"en": 0.55, "tr": 0.30, "other": 0.15}
    elif model_language == "tr":
        lang_dist = {"tr": 0.85, "en": 0.10, "other": 0.05}
    else:
        lang_dist = {"en": 0.90, "tr": 0.05, "other": 0.05}

    avg_text_length = random.uniform(50, 500) * type_quality

    return {
        "quality_score": round(quality_score, 1),
        "duplicate_ratio": round(duplicate_ratio, 3),
        "language_distribution": lang_dist,
        "avg_text_length": round(avg_text_length, 1),
        "estimated_rows": estimated_rows,
    }


# ── Cleaning scoring ────────────────────────────────────────────────────────

def score_cleaning(
    quality_score: float,
    duplicate_ratio: float,
    row_count: int,
    remove_duplicates: bool,
    filter_spam: bool,
    mask_pii: bool,
) -> dict:
    """Compute quality improvement from cleaning operations."""
    improvement = 0.0
    rows_removed = 0

    if remove_duplicates:
        improvement += duplicate_ratio * 20
        rows_removed += int(row_count * duplicate_ratio)

    if filter_spam:
        spam_ratio = random.uniform(0.02, 0.08)
        improvement += spam_ratio * 15
        rows_removed += int(row_count * spam_ratio)

    if mask_pii:
        improvement += 3.0  # Small quality bump for privacy compliance

    cleaned_quality = clamp(quality_score + improvement)
    cleaned_rows = max(1, row_count - rows_removed)

    return {
        "cleaned_quality_score": round(cleaned_quality, 1),
        "cleaned_row_count": cleaned_rows,
        "quality_improvement": round(improvement, 1),
        "rows_removed": rows_removed,
    }


# ── Tokenizer scoring ──────────────────────────────────────────────────────

TOKENIZER_SPECS = {
    "general": {"efficiency": 0.7, "cost_per_1k": 0.002, "name": "BPE (GPT-style)"},
    "turkish_optimized": {"efficiency": 0.85, "cost_per_1k": 0.0018, "name": "Turkish BPE"},
    "code": {"efficiency": 0.75, "cost_per_1k": 0.0022, "name": "Code-aware BPE"},
}


def score_tokenizer(
    tokenizer_type: str,
    cleaned_rows: int,
    avg_text_length: float,
    model_language: str,
    context_window: int = 4096,
) -> dict:
    """Compute tokenizer metrics."""
    spec = TOKENIZER_SPECS.get(tokenizer_type, TOKENIZER_SPECS["general"])

    # Language match bonus
    lang_bonus = 1.0
    if tokenizer_type == "turkish_optimized" and model_language in ("tr", "multilingual"):
        lang_bonus = 1.15
    elif tokenizer_type == "code" and model_language == "en":
        lang_bonus = 1.05

    total_chars = cleaned_rows * avg_text_length
    # Average 4 chars per token for English, 3 for optimized
    chars_per_token = 4.0 / (spec["efficiency"] * lang_bonus)
    token_count = int(total_chars / chars_per_token)

    estimated_cost = token_count * spec["cost_per_1k"] / 1000
    avg_tokens_per_sample = token_count / max(1, cleaned_rows)
    context_utilization = min(1.0, avg_tokens_per_sample / context_window)

    return {
        "token_count": token_count,
        "estimated_cost": round(estimated_cost, 2),
        "context_utilization": round(context_utilization, 3),
        "avg_tokens_per_sample": round(avg_tokens_per_sample, 1),
        "tokenizer_name": spec["name"],
        "efficiency_score": round(spec["efficiency"] * lang_bonus * 100, 1),
    }


# ── Architecture scoring ───────────────────────────────────────────────────

MODEL_SPECS = {
    "small": {
        "params": 1_000_000_000,
        "layers": 24,
        "hidden": 2048,
        "heads": 16,
        "gpu_min": 1,
        "base_hours": 24,
        "cost_per_hour": 2.5,
    },
    "medium": {
        "params": 7_000_000_000,
        "layers": 32,
        "hidden": 4096,
        "heads": 32,
        "gpu_min": 4,
        "base_hours": 168,
        "cost_per_hour": 10.0,
    },
    "large": {
        "params": 70_000_000_000,
        "layers": 80,
        "hidden": 8192,
        "heads": 64,
        "gpu_min": 16,
        "base_hours": 720,
        "cost_per_hour": 40.0,
    },
}

CONTEXT_COST_MULTIPLIER = {
    2048: 0.8,
    4096: 1.0,
    8192: 1.3,
    16384: 1.8,
    32768: 2.5,
}


def score_architecture(
    model_size: str,
    context_window: int,
    architecture_type: str,
    token_count: int,
) -> dict:
    """Compute architecture requirements and estimates."""
    spec = MODEL_SPECS.get(model_size, MODEL_SPECS["medium"])
    ctx_mult = CONTEXT_COST_MULTIPLIER.get(context_window, 1.0)

    gpu_requirement = spec["gpu_min"]
    training_hours = spec["base_hours"] * ctx_mult

    # MoE reduces compute but increases memory
    if architecture_type == "moe":
        training_hours *= 0.6
        gpu_requirement = int(gpu_requirement * 1.5)

    # Scale by dataset size (more tokens = more training)
    data_scale = min(2.0, max(0.5, token_count / 1_000_000_000))
    training_hours *= data_scale

    training_cost = training_hours * spec["cost_per_hour"]

    return {
        "parameter_count": spec["params"],
        "num_layers": spec["layers"],
        "hidden_size": spec["hidden"],
        "num_attention_heads": spec["heads"],
        "gpu_requirement": gpu_requirement,
        "estimated_training_hours": round(training_hours, 1),
        "estimated_training_cost": round(training_cost, 2),
        "architecture_capability": _compute_capability(model_size, context_window, architecture_type),
    }


def _compute_capability(model_size: str, context_window: int, arch_type: str) -> float:
    size_score = {"small": 0.4, "medium": 0.7, "large": 0.95}.get(model_size, 0.5)
    ctx_score = min(1.0, context_window / 32768)
    moe_bonus = 0.1 if arch_type == "moe" else 0.0
    return round(clamp((size_score * 0.6 + ctx_score * 0.3 + moe_bonus) * 100), 1)


# ── Training config scoring ────────────────────────────────────────────────

def score_training_config(
    epochs: int,
    batch_size: int,
    learning_rate: float,
    optimizer: str,
    model_size: str,
    data_quality: float,
) -> dict:
    """Score the training configuration for stability prediction."""
    stability = 50.0

    # Learning rate assessment
    ideal_lr = {"small": 3e-4, "medium": 1e-4, "large": 3e-5}.get(model_size, 1e-4)
    lr_ratio = learning_rate / ideal_lr
    if 0.5 <= lr_ratio <= 2.0:
        stability += 15
    elif 0.2 <= lr_ratio <= 5.0:
        stability += 5
    else:
        stability -= 20  # Too far from ideal

    # LR too high is dangerous
    if lr_ratio > 10:
        stability -= 30

    # Optimizer bonus
    opt_bonus = {"adamw": 10, "adam": 8, "adafactor": 7, "sgd": 0}.get(optimizer, 5)
    stability += opt_bonus

    # Epoch assessment (too few = underfit, too many = overfit)
    if 2 <= epochs <= 5:
        stability += 10
    elif epochs == 1:
        stability -= 5
    elif epochs > 10:
        stability -= 10

    # Batch size (powers of 2 are better, very small is unstable)
    if batch_size >= 16 and (batch_size & (batch_size - 1)) == 0:
        stability += 5
    if batch_size < 8:
        stability -= 10

    # Data quality influence
    stability += (data_quality - 50) * 0.2

    return {
        "training_stability": round(clamp(stability), 1),
        "lr_assessment": "optimal" if 0.5 <= lr_ratio <= 2.0 else "suboptimal" if 0.2 <= lr_ratio <= 5.0 else "risky",
        "convergence_prediction": "fast" if stability > 70 else "normal" if stability > 50 else "slow",
        "overfitting_risk": "high" if epochs > 8 else "medium" if epochs > 5 else "low",
    }
