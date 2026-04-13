"""
Parametric curve generators for training simulation.

Loss curves are generated mathematically (not randomly) based on user decisions.
"""

import math
import random


def generate_loss_curve(
    epochs: int,
    learning_rate: float,
    training_stability: float,
    data_quality: float,
    total_steps_per_epoch: int = 100,
) -> list[dict]:
    """
    Generate training and validation loss curves.

    Base shape: exponential decay  L(t) = a * exp(-b * t) + c

    - Higher stability -> smoother curve, lower final loss
    - Lower stability -> more noise, potential divergence spikes
    - Poor data quality -> higher floor (c), val_loss diverges from train_loss
    - LR too high -> initial oscillation
    """
    points = []

    # Parameters derived from scores
    stability_factor = training_stability / 100.0
    quality_factor = data_quality / 100.0

    # Initial loss (higher for harder configs)
    initial_loss = 4.0 - stability_factor * 1.5

    # Final loss floor (lower for better data quality)
    final_floor = 0.3 + (1.0 - quality_factor) * 0.8 + (1.0 - stability_factor) * 0.5

    # Decay rate (faster for good configs)
    decay_rate = 0.3 + stability_factor * 0.4

    # Noise level (more noise for unstable configs)
    noise_level = 0.15 * (1.0 - stability_factor) + 0.02

    # Val-train gap (larger for poor data quality / overfitting)
    val_gap_base = 0.05 + (1.0 - quality_factor) * 0.15

    # LR-related oscillation
    lr_oscillation = max(0, (learning_rate - 1e-4) * 5000)

    total_steps = epochs * total_steps_per_epoch

    for step in range(total_steps + 1):
        t = step / total_steps if total_steps > 0 else 0
        epoch = step / total_steps_per_epoch

        # Base exponential decay
        train_loss = (initial_loss - final_floor) * math.exp(-decay_rate * t * 10) + final_floor

        # Add controlled noise
        noise = random.gauss(0, noise_level) * (1 - t * 0.5)
        train_loss += noise

        # LR oscillation (dampens over time)
        if lr_oscillation > 0:
            oscillation = lr_oscillation * math.sin(t * 30) * math.exp(-t * 5)
            train_loss += oscillation

        # Validation loss (slightly higher, gap grows if overfitting)
        val_gap = val_gap_base * (1 + t * 0.5)  # Gap grows slightly over training
        val_loss = train_loss + val_gap + random.gauss(0, noise_level * 0.5)

        # Clamp to reasonable values
        train_loss = max(0.01, train_loss)
        val_loss = max(train_loss * 0.95, val_loss)

        if step % max(1, total_steps_per_epoch // 10) == 0:
            points.append({
                "step": step,
                "epoch": round(epoch, 2),
                "train_loss": round(train_loss, 4),
                "val_loss": round(val_loss, 4),
            })

    return points


def generate_gpu_usage(
    epochs: int,
    model_size: str,
    batch_size: int,
    fp16: bool,
    total_steps_per_epoch: int = 100,
) -> list[dict]:
    """Generate simulated GPU utilization and memory usage data."""
    points = []

    base_util = {"small": 0.65, "medium": 0.80, "large": 0.92}.get(model_size, 0.75)
    base_memory = {"small": 0.40, "medium": 0.65, "large": 0.88}.get(model_size, 0.60)

    # FP16 reduces memory
    if fp16:
        base_memory *= 0.6

    # Larger batch = more memory, more utilization
    batch_factor = min(1.0, batch_size / 64)
    base_memory += batch_factor * 0.15
    base_util += batch_factor * 0.1

    total_steps = epochs * total_steps_per_epoch

    for step in range(0, total_steps + 1, max(1, total_steps_per_epoch // 5)):
        # Utilization fluctuates slightly
        util = min(0.99, base_util + random.gauss(0, 0.03))
        memory = min(0.95, base_memory + random.gauss(0, 0.02))

        # Checkpoint saves cause brief util spikes
        if step > 0 and step % total_steps_per_epoch == 0:
            util = min(0.99, util + 0.05)

        points.append({
            "step": step,
            "epoch": round(step / total_steps_per_epoch, 2),
            "gpu_utilization": round(max(0.1, util), 3),
            "memory_usage": round(max(0.1, memory), 3),
        })

    return points


def generate_training_logs(
    epochs: int,
    learning_rate: float,
    training_stability: float,
    loss_curve: list[dict],
) -> list[dict]:
    """Generate simulated training log entries."""
    logs = []

    logs.append({
        "level": "info",
        "message": f"Starting training: {epochs} epochs, lr={learning_rate}",
    })

    stability_factor = training_stability / 100.0

    for epoch in range(1, epochs + 1):
        # Find loss at this epoch from curve
        epoch_points = [p for p in loss_curve if abs(p["epoch"] - epoch) < 0.5]
        if epoch_points:
            loss = epoch_points[-1]["train_loss"]
            val_loss = epoch_points[-1]["val_loss"]
        else:
            loss = 2.0
            val_loss = 2.2

        logs.append({
            "level": "info",
            "message": f"Epoch {epoch}/{epochs} - loss: {loss:.4f}, val_loss: {val_loss:.4f}",
        })

        # Warnings based on conditions
        if val_loss > loss * 1.3:
            logs.append({
                "level": "warning",
                "message": f"Epoch {epoch}: Validation loss is {((val_loss/loss - 1)*100):.0f}% higher than training loss. Possible overfitting.",
            })

        if loss > 3.0 and epoch > 1:
            logs.append({
                "level": "warning",
                "message": f"Epoch {epoch}: Loss is still high ({loss:.3f}). Training may be struggling to converge.",
            })

        if stability_factor < 0.4 and epoch <= 2:
            logs.append({
                "level": "warning",
                "message": f"Epoch {epoch}: Unstable gradients detected. Consider reducing learning rate.",
            })

        # Checkpoint
        logs.append({
            "level": "info",
            "message": f"Checkpoint saved: epoch_{epoch}_loss_{loss:.4f}",
        })

    logs.append({
        "level": "info",
        "message": f"Training completed. Final loss: {loss_curve[-1]['train_loss']:.4f}",
    })

    return logs


def generate_checkpoints(
    epochs: int,
    loss_curve: list[dict],
) -> list[dict]:
    """Generate checkpoint data."""
    checkpoints = []

    for epoch in range(1, epochs + 1):
        epoch_points = [p for p in loss_curve if abs(p["epoch"] - epoch) < 0.5]
        loss = epoch_points[-1]["train_loss"] if epoch_points else 2.0

        checkpoints.append({
            "epoch": epoch,
            "loss": round(loss, 4),
            "is_best": False,
        })

    # Mark best checkpoint
    if checkpoints:
        best = min(checkpoints, key=lambda c: c["loss"])
        best["is_best"] = True

    return checkpoints
