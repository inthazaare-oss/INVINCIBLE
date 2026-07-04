from app import config, ratelimit


def test_rate_limit_allows_up_to_max_then_blocks(monkeypatch):
    monkeypatch.setattr(config.settings, "rate_limit_max_messages", 2)
    monkeypatch.setattr(config.settings, "rate_limit_window_seconds", 60)
    ratelimit._hits.clear()

    number = "whatsapp:+15551230000"
    assert ratelimit.is_rate_limited(number) is False
    assert ratelimit.is_rate_limited(number) is False
    assert ratelimit.is_rate_limited(number) is True


def test_rate_limit_is_isolated_per_number(monkeypatch):
    monkeypatch.setattr(config.settings, "rate_limit_max_messages", 1)
    monkeypatch.setattr(config.settings, "rate_limit_window_seconds", 60)
    ratelimit._hits.clear()

    assert ratelimit.is_rate_limited("whatsapp:+1111") is False
    assert ratelimit.is_rate_limited("whatsapp:+2222") is False
    assert ratelimit.is_rate_limited("whatsapp:+1111") is True
