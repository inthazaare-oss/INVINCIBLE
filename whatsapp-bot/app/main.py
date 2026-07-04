from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import BackgroundTasks, Depends, FastAPI, Response
from twilio.twiml.messaging_response import MessagingResponse

from . import db
from .claude_agent import generate_reply
from .config import settings
from .ratelimit import is_rate_limited
from .security import verify_twilio_signature
from .twilio_client import send_whatsapp_message

logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.init_db()
    yield


app = FastAPI(title="Claude WhatsApp Bot", lifespan=lifespan)


def _empty_twiml() -> Response:
    return Response(content=str(MessagingResponse()), media_type="application/xml")


async def _reply_async(to: str, body: str) -> None:
    try:
        await asyncio.to_thread(send_whatsapp_message, to, body)
    except Exception:
        logger.exception("Failed to deliver WhatsApp message to %s", to)


async def _handle_message(from_number: str, body: str) -> None:
    reply = await generate_reply(from_number, body)
    await _reply_async(from_number, reply)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/webhook/whatsapp")
async def whatsapp_webhook(
    background_tasks: BackgroundTasks,
    params: dict = Depends(verify_twilio_signature),
) -> Response:
    from_number = params.get("From", "")
    body = (params.get("Body") or "").strip()
    message_sid = params.get("MessageSid", "")

    if not from_number or not message_sid:
        return Response(status_code=400)

    if settings.allowed_phone_numbers and from_number not in settings.allowed_phone_numbers:
        logger.info("Rejected message from non-allowlisted number %s", from_number)
        return _empty_twiml()

    if not await db.mark_message_processed(message_sid):
        logger.info("Duplicate MessageSid %s from %s ignored", message_sid, from_number)
        return _empty_twiml()

    if is_rate_limited(from_number):
        background_tasks.add_task(
            _reply_async, from_number, "You're sending messages too quickly. Please wait a bit and try again."
        )
        return _empty_twiml()

    if not body:
        background_tasks.add_task(
            _reply_async, from_number, "I can only respond to text messages right now."
        )
        return _empty_twiml()

    # Respond to Twilio immediately; the Claude call and the reply send both
    # happen after the response, since agent turns can easily exceed Twilio's
    # webhook timeout.
    background_tasks.add_task(_handle_message, from_number, body)

    return _empty_twiml()
