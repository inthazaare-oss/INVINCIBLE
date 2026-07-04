from __future__ import annotations

from fastapi import HTTPException, Request, status
from twilio.request_validator import RequestValidator

from .config import settings

_validator = RequestValidator(settings.twilio_auth_token)


async def verify_twilio_signature(request: Request) -> dict[str, str]:
    """FastAPI dependency: validates the X-Twilio-Signature header against
    settings.webhook_url + the posted form body, and returns the parsed form
    fields on success. Rejects the request with 403 otherwise.

    settings.webhook_url must exactly match the URL configured in the Twilio
    console (scheme, host, path) -- Twilio signs against that literal URL, not
    whatever the server infers from proxy headers.
    """
    form = await request.form()
    params = dict(form)
    signature = request.headers.get("X-Twilio-Signature", "")

    if not _validator.validate(settings.webhook_url, params, signature):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Twilio signature")

    return params
