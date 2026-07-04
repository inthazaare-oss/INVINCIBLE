import pytest
from fastapi import HTTPException
from twilio.request_validator import RequestValidator

from app import config, security


class FakeRequest:
    def __init__(self, form: dict, signature: str) -> None:
        self._form = form
        self.headers = {"X-Twilio-Signature": signature}

    async def form(self):
        return self._form


async def test_valid_signature_returns_params(monkeypatch):
    monkeypatch.setattr(config.settings, "webhook_url", "https://example.com/webhook/whatsapp")
    monkeypatch.setattr(config.settings, "twilio_auth_token", "test_auth_token")
    monkeypatch.setattr(security, "_validator", RequestValidator("test_auth_token"))

    form = {"Body": "hello", "From": "whatsapp:+15551230000", "MessageSid": "SM123"}
    signature = RequestValidator("test_auth_token").compute_signature(
        "https://example.com/webhook/whatsapp", form
    )

    result = await security.verify_twilio_signature(FakeRequest(form, signature))
    assert result == form


async def test_invalid_signature_raises_403(monkeypatch):
    monkeypatch.setattr(config.settings, "webhook_url", "https://example.com/webhook/whatsapp")
    monkeypatch.setattr(config.settings, "twilio_auth_token", "test_auth_token")
    monkeypatch.setattr(security, "_validator", RequestValidator("test_auth_token"))

    form = {"Body": "hello", "From": "whatsapp:+15551230000", "MessageSid": "SM123"}

    with pytest.raises(HTTPException) as exc_info:
        await security.verify_twilio_signature(FakeRequest(form, "bogus-signature"))
    assert exc_info.value.status_code == 403
