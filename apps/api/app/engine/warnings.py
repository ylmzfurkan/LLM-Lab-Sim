"""
Contextual warning and recommendation generator.

Warnings are bilingual (en/tr) and selected based on SimulationState.
"""

WARNINGS_DB = {
    "lr_too_high": {
        "en": "Learning rate {lr} is unusually high for a {size} model. This may cause training divergence.",
        "tr": "Ogrenme orani {lr}, {size} bir model icin asiri yuksek. Bu, egitim sapmasina neden olabilir.",
        "severity": "high",
    },
    "lr_too_low": {
        "en": "Learning rate {lr} is very low. Training will converge slowly.",
        "tr": "Ogrenme orani {lr} cok dusuk. Egitim yavas yakinlasacak.",
        "severity": "medium",
    },
    "data_too_small": {
        "en": "Dataset has only {rows} samples. For a {size} model, at least {recommended} samples are recommended.",
        "tr": "Veri seti sadece {rows} ornek iceriyor. {size} bir model icin en az {recommended} ornek onerilir.",
        "severity": "high",
    },
    "high_duplicate_ratio": {
        "en": "Dataset has {ratio}% duplicates. Consider enabling deduplication.",
        "tr": "Veri setinde %{ratio} tekrar var. Tekrar temizlemeyi etkinlestirmeyi dusunun.",
        "severity": "medium",
    },
    "overfitting_risk": {
        "en": "Training for {epochs} epochs with this dataset size may cause overfitting. Consider reducing epochs or adding regularization.",
        "tr": "Bu veri seti boyutuyla {epochs} epoch egitim, asiri uyuma neden olabilir. Epoch sayisini azaltmayi veya regulasyon eklemeyi dusunun.",
        "severity": "medium",
    },
    "moe_overhead": {
        "en": "Mixture of Experts architecture requires more GPU memory but trains faster. Ensure you have sufficient resources.",
        "tr": "Mixture of Experts mimarisi daha fazla GPU bellek gerektirir ama daha hizli egitir. Yeterli kaynaginiz oldugundan emin olun.",
        "severity": "low",
    },
    "tokenizer_mismatch": {
        "en": "The selected tokenizer is not optimized for {language}. Consider using a {recommended} tokenizer.",
        "tr": "Secilen tokenizer {language} icin optimize edilmemis. {recommended} tokenizer kullanmayi dusunun.",
        "severity": "medium",
    },
    "low_context_utilization": {
        "en": "Average sample length uses only {util}% of the context window. You may be wasting compute on padding.",
        "tr": "Ortalama ornek uzunlugu context penceresinin yalnizca %{util}'ini kullaniyor. Padding icin gereksiz islem gucu harcaniyor olabilir.",
        "severity": "low",
    },
    "large_model_small_data": {
        "en": "A {size} model with only {rows} samples is likely to overfit. Consider using a smaller model or more data.",
        "tr": "Sadece {rows} ornekle {size} bir model muhtemelen asiri uyum saglayacak. Daha kucuk bir model veya daha fazla veri kullanmayi dusunun.",
        "severity": "high",
    },
    "good_configuration": {
        "en": "Your configuration looks well-balanced. Training should proceed smoothly.",
        "tr": "Yapilandirmaniz dengeli gorunuyor. Egitim sorunsuz ilerlemeli.",
        "severity": "info",
    },
}


def generate_warnings(
    locale: str,
    model_size: str | None = None,
    learning_rate: float | None = None,
    epochs: int | None = None,
    row_count: int | None = None,
    duplicate_ratio: float | None = None,
    tokenizer_type: str | None = None,
    model_language: str | None = None,
    context_utilization: float | None = None,
    architecture_type: str | None = None,
    training_stability: float | None = None,
) -> list[dict]:
    """Generate contextual warnings based on current state."""
    warnings = []
    lang = "tr" if locale == "tr" else "en"

    # LR checks
    if learning_rate is not None and model_size:
        ideal_lr = {"small": 3e-4, "medium": 1e-4, "large": 3e-5}.get(model_size, 1e-4)
        if learning_rate > ideal_lr * 10:
            w = WARNINGS_DB["lr_too_high"]
            warnings.append({
                "message": w[lang].format(lr=learning_rate, size=model_size),
                "severity": w["severity"],
            })
        elif learning_rate < ideal_lr * 0.01:
            w = WARNINGS_DB["lr_too_low"]
            warnings.append({
                "message": w[lang].format(lr=learning_rate),
                "severity": w["severity"],
            })

    # Data size checks
    if row_count is not None and model_size:
        min_rows = {"small": 5000, "medium": 20000, "large": 100000}.get(model_size, 10000)
        if row_count < min_rows:
            w = WARNINGS_DB["data_too_small"]
            warnings.append({
                "message": w[lang].format(rows=row_count, size=model_size, recommended=min_rows),
                "severity": w["severity"],
            })

        if model_size == "large" and row_count < 50000:
            w = WARNINGS_DB["large_model_small_data"]
            warnings.append({
                "message": w[lang].format(size=model_size, rows=row_count),
                "severity": w["severity"],
            })

    # Duplicate check
    if duplicate_ratio is not None and duplicate_ratio > 0.15:
        w = WARNINGS_DB["high_duplicate_ratio"]
        warnings.append({
            "message": w[lang].format(ratio=round(duplicate_ratio * 100, 1)),
            "severity": w["severity"],
        })

    # Overfitting check
    if epochs is not None and row_count is not None:
        if epochs > 5 and row_count < 10000:
            w = WARNINGS_DB["overfitting_risk"]
            warnings.append({
                "message": w[lang].format(epochs=epochs),
                "severity": w["severity"],
            })

    # MoE overhead
    if architecture_type == "moe":
        w = WARNINGS_DB["moe_overhead"]
        warnings.append({
            "message": w[lang],
            "severity": w["severity"],
        })

    # Tokenizer mismatch
    if tokenizer_type and model_language:
        if model_language in ("tr", "multilingual") and tokenizer_type == "general":
            w = WARNINGS_DB["tokenizer_mismatch"]
            recommended = "Turkish-optimized"
            warnings.append({
                "message": w[lang].format(language=model_language, recommended=recommended),
                "severity": w["severity"],
            })

    # Low context utilization
    if context_utilization is not None and context_utilization < 0.2:
        w = WARNINGS_DB["low_context_utilization"]
        warnings.append({
            "message": w[lang].format(util=round(context_utilization * 100, 1)),
            "severity": w["severity"],
        })

    # Positive feedback if things look good
    if not warnings and training_stability is not None and training_stability > 65:
        w = WARNINGS_DB["good_configuration"]
        warnings.append({
            "message": w[lang],
            "severity": w["severity"],
        })

    return warnings
