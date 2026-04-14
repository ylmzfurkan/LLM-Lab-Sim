"""
Simulated benchmark score generators.

Generates realistic-looking benchmark results based on model configuration and scores.
"""

import random

from app.engine.scoring import clamp


BENCHMARKS = {
    "mmlu": {"name": "MMLU", "description": "Massive Multitask Language Understanding", "max": 90},
    "hellaswag": {"name": "HellaSwag", "description": "Commonsense Reasoning", "max": 95},
    "arc": {"name": "ARC-Challenge", "description": "Science Questions", "max": 85},
    "truthfulqa": {"name": "TruthfulQA", "description": "Truthfulness", "max": 70},
    "winogrande": {"name": "WinoGrande", "description": "Coreference Resolution", "max": 85},
    "gsm8k": {"name": "GSM8K", "description": "Grade School Math", "max": 80},
}

CODE_BENCHMARKS = {
    "humaneval": {"name": "HumanEval", "description": "Code Generation", "max": 75},
    "mbpp": {"name": "MBPP", "description": "Python Programming", "max": 70},
}


def generate_benchmarks(
    model_performance: float,
    model_size: str,
    model_purpose: str,
    target_domain: str,
    data_quality: float,
) -> dict:
    """Generate simulated benchmark scores."""
    results = {}
    perf_factor = model_performance / 100.0
    quality_factor = data_quality / 100.0
    size_factor = {"small": 0.5, "medium": 0.75, "large": 0.95}.get(model_size, 0.6)

    for key, bench in BENCHMARKS.items():
        base = bench["max"] * perf_factor * size_factor
        noise = random.gauss(0, 3)

        # Domain bonuses
        if key == "mmlu" and target_domain in ("education", "general"):
            base *= 1.1
        if key == "truthfulqa" and data_quality > 70:
            base *= 1.1
        if key == "gsm8k" and model_purpose == "code_assistant":
            base *= 1.15

        score = clamp(base + noise, lo=15, hi=bench["max"])
        results[key] = {
            "name": bench["name"],
            "description": bench["description"],
            "score": round(score, 1),
            "max": bench["max"],
        }

    # Add code benchmarks for code models
    if model_purpose == "code_assistant":
        for key, bench in CODE_BENCHMARKS.items():
            base = bench["max"] * perf_factor * size_factor * 1.1
            noise = random.gauss(0, 2)
            score = clamp(base + noise, lo=5, hi=bench["max"])
            results[key] = {
                "name": bench["name"],
                "description": bench["description"],
                "score": round(score, 1),
                "max": bench["max"],
            }

    return results


WEAKNESS_STRINGS = {
    "en": {
        "benchmark_suggestion": "Consider adding more {desc} training data.",
        "data_quality_area": "Data Quality",
        "data_quality_suggestion": "Improve dataset quality through better cleaning and curation.",
        "training_stability_area": "Training Stability",
        "training_stability_suggestion": "Tune hyperparameters for more stable training convergence.",
    },
    "tr": {
        "benchmark_suggestion": "Daha fazla {desc} eğitim verisi eklemeyi düşünün.",
        "data_quality_area": "Veri Kalitesi",
        "data_quality_suggestion": "Daha iyi temizleme ve düzenleme ile veri seti kalitesini artırın.",
        "training_stability_area": "Eğitim Kararlılığı",
        "training_stability_suggestion": "Daha kararlı bir eğitim yakınsaması için hiperparametreleri ayarlayın.",
    },
}

BENCHMARK_DESC_TR = {
    "mmlu": "genel bilgi",
    "hellaswag": "sağduyu muhakemesi",
    "arc": "fen sorusu",
    "truthfulqa": "doğruluk",
    "winogrande": "zamir çözümleme",
    "gsm8k": "ilkokul matematik",
    "humaneval": "kod üretimi",
    "mbpp": "Python programlama",
}


def generate_weakness_analysis(
    benchmarks: dict,
    data_quality: float,
    training_stability: float,
    locale: str = "en",
) -> list[dict]:
    """Identify model weaknesses based on benchmark results."""
    lang = "tr" if locale == "tr" else "en"
    strings = WEAKNESS_STRINGS[lang]
    weaknesses = []

    if benchmarks:
        sorted_benches = sorted(benchmarks.items(), key=lambda x: x[1]["score"] / x[1]["max"])
        weakest_key, weakest = sorted_benches[0]
        if lang == "tr":
            desc = BENCHMARK_DESC_TR.get(weakest_key, weakest["description"].lower())
        else:
            desc = weakest["description"].lower()
        weaknesses.append({
            "area": weakest["name"],
            "score": weakest["score"],
            "suggestion": strings["benchmark_suggestion"].format(desc=desc),
        })

    if data_quality < 50:
        weaknesses.append({
            "area": strings["data_quality_area"],
            "score": data_quality,
            "suggestion": strings["data_quality_suggestion"],
        })

    if training_stability < 50:
        weaknesses.append({
            "area": strings["training_stability_area"],
            "score": training_stability,
            "suggestion": strings["training_stability_suggestion"],
        })

    return weaknesses
