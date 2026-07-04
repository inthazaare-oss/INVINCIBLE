from __future__ import annotations

import datetime as dt

import aiosqlite

from .config import settings

_SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    phone_number TEXT PRIMARY KEY,
    claude_session_id TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS processed_messages (
    message_sid TEXT PRIMARY KEY,
    received_at TEXT NOT NULL
);
"""


def _now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


async def init_db() -> None:
    settings.database_path.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(settings.database_path) as db:
        await db.executescript(_SCHEMA)
        await db.commit()


async def get_session_id(phone_number: str) -> str | None:
    async with aiosqlite.connect(settings.database_path) as db:
        cursor = await db.execute(
            "SELECT claude_session_id FROM sessions WHERE phone_number = ?",
            (phone_number,),
        )
        row = await cursor.fetchone()
        return row[0] if row else None


async def save_session_id(phone_number: str, session_id: str) -> None:
    async with aiosqlite.connect(settings.database_path) as db:
        await db.execute(
            """
            INSERT INTO sessions (phone_number, claude_session_id, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(phone_number) DO UPDATE SET
                claude_session_id = excluded.claude_session_id,
                updated_at = excluded.updated_at
            """,
            (phone_number, session_id, _now()),
        )
        await db.commit()


async def reset_session(phone_number: str) -> None:
    async with aiosqlite.connect(settings.database_path) as db:
        await db.execute("DELETE FROM sessions WHERE phone_number = ?", (phone_number,))
        await db.commit()


async def mark_message_processed(message_sid: str) -> bool:
    """Atomically records a Twilio MessageSid. Returns False if already seen
    (Twilio retries webhooks on slow/failed responses, so inbound messages
    must be deduped before triggering a paid Claude call)."""
    async with aiosqlite.connect(settings.database_path) as db:
        try:
            await db.execute(
                "INSERT INTO processed_messages (message_sid, received_at) VALUES (?, ?)",
                (message_sid, _now()),
            )
            await db.commit()
            return True
        except aiosqlite.IntegrityError:
            return False
