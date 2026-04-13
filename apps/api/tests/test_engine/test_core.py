"""Test the simulation engine core."""

from app.engine.core import SimulationEngine, SimulationState


def test_wizard_basic():
    engine = SimulationEngine()
    result = engine.apply_wizard("chatbot", "general", "en", "chat")
    assert "scores" in result
    assert result["scores"]["data_quality"] > 0
    assert result["scores"]["cost_efficiency"] > 0
    assert "recommended_model_size" in result


def test_full_pipeline():
    """Run through the entire simulation pipeline."""
    engine = SimulationEngine()

    # Step 1: Wizard
    r = engine.apply_wizard("code_assistant", "tech", "en", "code")
    assert r["scores"]["data_quality"] > 0

    # Step 2: Dataset
    r = engine.apply_dataset("jsonl", 50_000_000, 25000)
    assert r["quality_score"] > 0
    assert r["estimated_rows"] > 0

    # Step 3: Cleaning
    r = engine.apply_cleaning(remove_duplicates=True, filter_spam=True, mask_pii=False)
    assert r["cleaned_quality_score"] >= engine.state.dataset_quality

    # Step 4: Tokenizer
    r = engine.apply_tokenizer("code")
    assert r["token_count"] > 0
    assert r["estimated_cost"] > 0

    # Step 5: Architecture
    r = engine.apply_architecture("medium", 8192, "dense")
    assert r["gpu_requirement"] > 0
    assert r["estimated_training_hours"] > 0

    # Step 6: Training config
    r = engine.apply_training_config(
        epochs=3, batch_size=16, learning_rate=5e-5, optimizer="adamw"
    )
    assert r["training_stability"] > 0

    # Step 7: Training
    r = engine.run_training()
    assert len(r["loss_curve"]) > 0
    assert len(r["gpu_usage"]) > 0
    assert len(r["training_logs"]) > 0
    assert len(r["checkpoints"]) > 0

    # Step 8: Report
    r = engine.generate_report()
    assert "benchmarks" in r
    assert len(r["benchmarks"]) > 0

    # Step 9: Customization
    r = engine.apply_customization("finetune")
    assert r["performance_boost"] > 0

    # Step 11: Fine-tune
    r = engine.run_finetune()
    assert r["accuracy_after"] > r["accuracy_before"]

    # Step 12: Playground
    r = engine.run_playground("Write a function", "finetuned")
    assert r["response_quality"] > 0

    # Step 13: Evaluation
    r = engine.run_evaluation()
    assert "metrics" in r

    # Step 14: Deployment
    r = engine.run_deployment()
    assert "api_endpoint" in r
    assert r["deployment_costs"]["total_monthly_cost"] > 0


def test_state_serialization():
    state = SimulationState(model_purpose="chatbot", data_quality=75.0)
    d = state.to_dict()
    restored = SimulationState.from_dict(d)
    assert restored.model_purpose == "chatbot"
    assert restored.data_quality == 75.0


def test_score_propagation():
    """Verify scores change based on decisions."""
    engine1 = SimulationEngine()
    engine1.apply_wizard("chatbot", "general", "en", "chat")
    score1 = engine1.state.data_quality

    engine2 = SimulationEngine()
    engine2.apply_wizard("code_assistant", "medical", "multilingual", "code")
    score2 = engine2.state.data_quality

    # Different choices should produce different scores
    assert score1 != score2
