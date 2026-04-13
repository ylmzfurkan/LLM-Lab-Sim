"""
Default configurations for beginner mode.

Provides sensible defaults based on wizard choices.
"""

BEGINNER_PRESETS = {
    "chatbot": {
        "model_size": "medium",
        "context_window": 4096,
        "architecture_type": "dense",
        "epochs": 3,
        "batch_size": 32,
        "learning_rate": 1e-4,
        "optimizer": "adamw",
    },
    "code_assistant": {
        "model_size": "medium",
        "context_window": 8192,
        "architecture_type": "dense",
        "epochs": 3,
        "batch_size": 16,
        "learning_rate": 5e-5,
        "optimizer": "adamw",
    },
    "translation": {
        "model_size": "medium",
        "context_window": 4096,
        "architecture_type": "dense",
        "epochs": 5,
        "batch_size": 32,
        "learning_rate": 1e-4,
        "optimizer": "adamw",
    },
    "summarization": {
        "model_size": "small",
        "context_window": 8192,
        "architecture_type": "dense",
        "epochs": 3,
        "batch_size": 16,
        "learning_rate": 2e-4,
        "optimizer": "adamw",
    },
    "general": {
        "model_size": "large",
        "context_window": 4096,
        "architecture_type": "moe",
        "epochs": 3,
        "batch_size": 32,
        "learning_rate": 3e-5,
        "optimizer": "adamw",
    },
}


def get_preset(model_purpose: str) -> dict:
    """Get beginner-mode defaults for a given model purpose."""
    return BEGINNER_PRESETS.get(model_purpose, BEGINNER_PRESETS["general"])
