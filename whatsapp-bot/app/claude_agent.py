from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ResultMessage,
    TextBlock,
    query,
)

from . import db
from .config import HARD_BLOCKED_TOOLS, settings

logger = logging.getLogger(__name__)

FALLBACK_ERROR_REPLY = "Sorry, something went wrong on my end. Please try again in a moment."
FALLBACK_LIMIT_REPLY = "I hit a limit finishing that request. Try asking something shorter, or send it again."

# One lock per WhatsApp number so two rapid-fire messages from the same user
# can't race on the same on-disk Claude session / sandbox directory.
_user_locks: dict[str, asyncio.Lock] = {}


def _lock_for(phone_number: str) -> asyncio.Lock:
    return _user_locks.setdefault(phone_number, asyncio.Lock())


def _sandbox_dir(phone_number: str) -> Path:
    safe_name = "".join(c for c in phone_number if c.isalnum()) or "unknown"
    path = settings.sandbox_root / safe_name
    path.mkdir(parents=True, exist_ok=True)
    return path


async def generate_reply(phone_number: str, message_text: str) -> str:
    """Runs one turn of the Claude Agent SDK for this WhatsApp user, resuming
    their prior session if one exists, and returns the text to send back."""
    async with _lock_for(phone_number):
        session_id = await db.get_session_id(phone_number)

        # Defense in depth: tools=[] disables all built-in tools outright, and
        # disallowed_tools blocks the dangerous ones even if ALLOWED_TOOLS is
        # ever misconfigured to include them. This bot is reachable by anyone
        # who can message the Twilio number, so shell/file tools stay off by
        # default (see ALLOWED_TOOLS in .env.example).
        tools = [t for t in settings.allowed_tools if t not in HARD_BLOCKED_TOOLS]

        options = ClaudeAgentOptions(
            resume=session_id,
            system_prompt=settings.system_prompt,
            model=settings.claude_model,
            tools=tools,
            allowed_tools=tools,
            disallowed_tools=list(HARD_BLOCKED_TOOLS),
            max_turns=settings.max_turns,
            max_budget_usd=settings.max_budget_usd,
            cwd=str(_sandbox_dir(phone_number)),
            setting_sources=[],
        )

        reply_parts: list[str] = []
        new_session_id = session_id
        had_error = False

        try:
            async for message in query(prompt=message_text, options=options):
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            reply_parts.append(block.text)
                elif isinstance(message, ResultMessage):
                    new_session_id = message.session_id
                    if message.subtype != "success":
                        had_error = True
                        logger.warning(
                            "Claude query for %s ended with subtype=%s", phone_number, message.subtype
                        )
        except Exception:
            logger.exception("Claude query raised for %s", phone_number)
            return FALLBACK_ERROR_REPLY

        if new_session_id and new_session_id != session_id:
            await db.save_session_id(phone_number, new_session_id)

        reply = "".join(reply_parts).strip()
        if reply:
            return reply
        return FALLBACK_LIMIT_REPLY if had_error else FALLBACK_ERROR_REPLY
