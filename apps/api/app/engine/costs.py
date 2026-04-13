"""
Cost estimation formulas for training and deployment.
"""


def estimate_training_cost(
    model_size: str,
    training_hours: float,
    gpu_count: int,
    architecture_type: str,
) -> dict:
    """Estimate training costs."""
    gpu_cost_per_hour = {
        1: 2.50,   # A100 40GB
        4: 10.00,  # 4x A100
        8: 20.00,  # 8x A100
        16: 40.00, # 16x A100
        32: 80.00, # 32x A100
    }

    hourly_rate = gpu_cost_per_hour.get(gpu_count, gpu_count * 2.50)
    compute_cost = training_hours * hourly_rate

    # Storage costs
    model_storage_gb = {"small": 2, "medium": 14, "large": 140}.get(model_size, 14)
    storage_cost = model_storage_gb * 0.08  # per month

    # Data transfer
    transfer_cost = model_storage_gb * 0.05

    total = compute_cost + storage_cost + transfer_cost

    return {
        "compute_cost": round(compute_cost, 2),
        "storage_cost": round(storage_cost, 2),
        "transfer_cost": round(transfer_cost, 2),
        "total_cost": round(total, 2),
        "hourly_rate": round(hourly_rate, 2),
        "gpu_type": "NVIDIA A100 80GB",
        "gpu_count": gpu_count,
    }


def estimate_deployment_cost(
    model_size: str,
    requests_per_day: int = 1000,
    avg_tokens_per_request: int = 500,
) -> dict:
    """Estimate deployment/inference costs."""
    # Cost per 1K tokens (approximate)
    inference_cost_per_1k = {
        "small": 0.0005,
        "medium": 0.002,
        "large": 0.01,
    }.get(model_size, 0.002)

    daily_tokens = requests_per_day * avg_tokens_per_request
    daily_cost = (daily_tokens / 1000) * inference_cost_per_1k
    monthly_cost = daily_cost * 30

    # Server costs
    server_monthly = {"small": 50, "medium": 200, "large": 1000}.get(model_size, 200)

    # Latency estimates
    avg_latency_ms = {"small": 50, "medium": 150, "large": 500}.get(model_size, 150)

    return {
        "inference_cost_per_1k_tokens": inference_cost_per_1k,
        "daily_inference_cost": round(daily_cost, 2),
        "monthly_inference_cost": round(monthly_cost, 2),
        "monthly_server_cost": server_monthly,
        "total_monthly_cost": round(monthly_cost + server_monthly, 2),
        "avg_latency_ms": avg_latency_ms,
        "requests_per_day": requests_per_day,
    }
