"""Benchmark and weakness generator tests."""

from app.engine.benchmarks import generate_benchmarks, generate_weakness_analysis


def test_benchmarks_scale_with_performance():
    low = generate_benchmarks(30, "small", "chatbot", "general", 50)
    high = generate_benchmarks(90, "large", "chatbot", "general", 90)
    assert high["mmlu"]["score"] > low["mmlu"]["score"]


def test_code_benchmarks_only_for_code_models():
    chat = generate_benchmarks(70, "medium", "chatbot", "general", 70)
    code = generate_benchmarks(70, "medium", "code_assistant", "tech", 70)
    assert "humaneval" not in chat
    assert "humaneval" in code
    assert "mbpp" in code


def test_benchmark_bounds():
    r = generate_benchmarks(100, "large", "chatbot", "general", 100)
    for b in r.values():
        assert 0 <= b["score"] <= b["max"]


def test_weakness_analysis_flags_low_quality():
    benches = generate_benchmarks(60, "medium", "chatbot", "general", 30)
    w = generate_weakness_analysis(benches, data_quality=30, training_stability=80)
    assert any("Data Quality" in x["area"] or "Veri" in x["area"] for x in w)


def test_weakness_analysis_locale_tr():
    benches = generate_benchmarks(60, "medium", "chatbot", "general", 30)
    w = generate_weakness_analysis(benches, 30, 30, locale="tr")
    assert any("Veri Kalitesi" == x["area"] for x in w)
