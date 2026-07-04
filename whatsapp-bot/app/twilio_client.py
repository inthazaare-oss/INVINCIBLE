from __future__ import annotations

import logging

from twilio.rest import Client

from .config import settings

logger = logging.getLogger(__name__)

# Stay comfortably under WhatsApp/Twilio's 1600-character body limit.
_MAX_WHATSAPP_BODY_CHARS = 1500

_client = Client(settings.twilio_account_sid, settings.twilio_auth_token)


def _chunk(text: str, size: int) -> list[str]:
    if len(text) <= size:
        return [text]
    return [text[i : i + size] for i in range(0, len(text), size)]


def send_whatsapp_message(to: str, body: str) -> None:
    """Sends `body` to `to` via the Twilio REST API, splitting long replies
    into multiple WhatsApp messages. Synchronous (blocking network I/O) --
    call via asyncio.to_thread from async code."""
    for chunk in _chunk(body, _MAX_WHATSAPP_BODY_CHARS):
        try:
            _client.messages.create(from_=settings.twilio_whatsapp_number, to=to, body=chunk)
        except Exception:
            logger.exception("Failed to send WhatsApp message to %s", to)
            raise
