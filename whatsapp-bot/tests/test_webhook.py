import asyncio

import pytest
from fastapi import Request
from httpx import ASGITransport, AsyncClient

from app import config, db, main, security


@pytest.fixture
async def client(tmp_path, monkeypatch):
    monkeypatch.setattr(config.settings, "database_path", tmp_path / "test.sqlite3")
    monkeypatch.setattr(config.settings, "sandbox_root", tmp_path / "sandboxes")
    monkeypatch.setattr(config.settings, "allowed_phone_numbers", [])
    monkeypatch.setattr(config.settings, "rate_limit_max_messages", 10)
    monkeypatch.setattr(config.settings, "rate_limit_window_seconds", 60)

    from app import ratelimit

    ratelimit._hits.clear()
    await db.init_db()

    async def fake_verify(request: Request):
        form = await request.form()
        return dict(form)

    async def fake_generate_reply(phone_number, message_text):
        return f"echo: {message_text}"

    sent: list[tuple[str, str]] = []

    def fake_send(to, body):
        sent.append((to, body))

    main.app.dependency_overrides[security.verify_twilio_signature] = fake_verify
    monkeypatch.setattr(main, "generate_reply", fake_generate_reply)
    monkeypatch.setattr(main, "send_whatsapp_message", fake_send)

    transport = ASGITransport(app=main.app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac, sent

    main.app.dependency_overrides.clear()


async def _post(ac, **fields):
    resp = await ac.post("/webhook/whatsapp", data=fields)
    await asyncio.sleep(0.05)  # let the background task run
    return resp


async def test_webhook_replies_to_new_message(client):
    ac, sent = client
    resp = await _post(ac, From="whatsapp:+15551230000", Body="hello", MessageSid="SM1")

    assert resp.status_code == 200
    assert sent == [("whatsapp:+15551230000", "echo: hello")]


async def test_webhook_dedupes_retried_message_sid(client):
    ac, sent = client
    payload = dict(From="whatsapp:+15551230000", Body="hello", MessageSid="SM-dup")

    await _post(ac, **payload)
    await _post(ac, **payload)

    assert sent == [("whatsapp:+15551230000", "echo: hello")]


async def test_webhook_rejects_non_allowlisted_number(client):
    ac, sent = client
    config_settings = __import__("app.config", fromlist=["settings"]).settings
    config_settings.allowed_phone_numbers = ["whatsapp:+19998887777"]
    try:
        resp = await _post(ac, From="whatsapp:+15551230000", Body="hi", MessageSid="SM2")
        assert resp.status_code == 200
        assert sent == []
    finally:
        config_settings.allowed_phone_numbers = []


async def test_webhook_enforces_rate_limit(client):
    ac, sent = client
    config.settings.rate_limit_max_messages = 1

    await _post(ac, From="whatsapp:+15551230000", Body="one", MessageSid="SM-a")
    await _post(ac, From="whatsapp:+15551230000", Body="two", MessageSid="SM-b")

    assert len(sent) == 2
    assert sent[0] == ("whatsapp:+15551230000", "echo: one")
    assert "too quickly" in sent[1][1]
