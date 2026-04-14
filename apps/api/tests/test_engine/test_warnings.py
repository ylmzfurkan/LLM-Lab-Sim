"""Warning generator tests."""

from app.engine.warnings import generate_warnings


def test_high_lr_warning():
    w = generate_warnings(locale="en", model_size="small", learning_rate=1.0)
    assert any("Learning rate" in x["message"] for x in w)


def test_low_data_warning_severity():
    w = generate_warnings(locale="en", model_size="large", row_count=1000)
    assert any(x["severity"] == "high" for x in w)


def test_duplicate_warning_threshold():
    none = generate_warnings(locale="en", duplicate_ratio=0.1)
    fires = generate_warnings(locale="en", duplicate_ratio=0.3)
    assert not any("duplicate" in x["message"].lower() for x in none)
    assert any("duplicate" in x["message"].lower() for x in fires)


def test_tr_locale():
    w = generate_warnings(locale="tr", model_size="small", learning_rate=1.0)
    assert any("Öğrenme" in x["message"] for x in w)


def test_positive_feedback_on_clean_config():
    w = generate_warnings(
        locale="en",
        model_size="medium",
        learning_rate=1e-4,
        epochs=3,
        row_count=50000,
        duplicate_ratio=0.02,
        training_stability=80,
    )
    assert any(x["severity"] == "info" for x in w)
