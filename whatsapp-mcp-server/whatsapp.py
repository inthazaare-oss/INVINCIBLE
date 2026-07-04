"""Read access to the Go bridge's SQLite history, plus HTTP calls into its
REST API for anything that needs a live WhatsApp connection (sending,
downloading media)."""

from __future__ import annotations

import os
import sqlite3
from dataclasses import dataclass

import requests

MESSAGES_DB_PATH = os.environ.get(
    "WHATSAPP_MESSAGES_DB",
    os.path.join(os.path.dirname(__file__), "..", "whatsapp-bridge", "store", "messages.db"),
)
BRIDGE_API_URL = os.environ.get("WHATSAPP_BRIDGE_URL", "http://127.0.0.1:8080")


@dataclass
class Message:
    id: str
    chat_jid: str
    sender: str
    content: str
    timestamp: str
    is_from_me: bool
    media_type: str | None = None
    filename: str | None = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "chat_jid": self.chat_jid,
            "sender": self.sender,
            "content": self.content,
            "timestamp": self.timestamp,
            "is_from_me": self.is_from_me,
            "media_type": self.media_type,
            "filename": self.filename,
        }


@dataclass
class Chat:
    jid: str
    name: str
    last_message_time: str | None = None
    last_message: str | None = None

    def to_dict(self) -> dict:
        return {
            "jid": self.jid,
            "name": self.name,
            "last_message_time": self.last_message_time,
            "last_message": self.last_message,
        }


def _connect() -> sqlite3.Connection:
    if not os.path.exists(MESSAGES_DB_PATH):
        raise FileNotFoundError(
            f"WhatsApp messages database not found at {MESSAGES_DB_PATH}. "
            "Make sure the whatsapp-bridge Go process is running and has "
            "completed its initial sync."
        )
    conn = sqlite3.connect(MESSAGES_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _paginate(limit: int, page: int) -> tuple[int, int]:
    limit = max(1, min(limit, 200))
    page = max(0, page)
    return limit, limit * page


def search_contacts(query: str) -> list[dict]:
    """Search synced chats for a name/number match (WhatsApp doesn't expose a
    separate contacts table locally beyond what we've seen in chat metadata)."""
    conn = _connect()
    try:
        like = f"%{query}%"
        rows = conn.execute(
            """
            SELECT DISTINCT jid, name FROM chats
            WHERE jid NOT LIKE '%@g.us' AND (name LIKE ? OR jid LIKE ?)
            ORDER BY name
            LIMIT 50
            """,
            (like, like),
        ).fetchall()
        return [{"jid": r["jid"], "name": r["name"]} for r in rows]
    finally:
        conn.close()


def list_chats(
    query: str | None = None,
    limit: int = 20,
    page: int = 0,
    include_last_message: bool = True,
    sort_by: str = "last_active",
) -> list[dict]:
    limit, offset = _paginate(limit, page)
    order = "last_message_time DESC" if sort_by == "last_active" else "name ASC"

    conn = _connect()
    try:
        sql = "SELECT jid, name, last_message_time FROM chats"
        params: list = []
        if query:
            sql += " WHERE name LIKE ? OR jid LIKE ?"
            like = f"%{query}%"
            params += [like, like]
        sql += f" ORDER BY {order} LIMIT ? OFFSET ?"
        params += [limit, offset]

        chats = []
        for row in conn.execute(sql, params).fetchall():
            last_message = None
            if include_last_message:
                msg_row = conn.execute(
                    """
                    SELECT content, media_type FROM messages
                    WHERE chat_jid = ? ORDER BY timestamp DESC LIMIT 1
                    """,
                    (row["jid"],),
                ).fetchone()
                if msg_row:
                    last_message = msg_row["content"] or f"<{msg_row['media_type']}>"
            chats.append(
                Chat(
                    jid=row["jid"],
                    name=row["name"],
                    last_message_time=row["last_message_time"],
                    last_message=last_message,
                ).to_dict()
            )
        return chats
    finally:
        conn.close()


def get_chat(chat_jid: str, include_last_message: bool = True) -> dict | None:
    conn = _connect()
    try:
        row = conn.execute("SELECT jid, name, last_message_time FROM chats WHERE jid = ?", (chat_jid,)).fetchone()
        if not row:
            return None
        last_message = None
        if include_last_message:
            msg_row = conn.execute(
                "SELECT content, media_type FROM messages WHERE chat_jid = ? ORDER BY timestamp DESC LIMIT 1",
                (chat_jid,),
            ).fetchone()
            if msg_row:
                last_message = msg_row["content"] or f"<{msg_row['media_type']}>"
        return Chat(row["jid"], row["name"], row["last_message_time"], last_message).to_dict()
    finally:
        conn.close()


def get_direct_chat_by_contact(sender_phone_number: str) -> dict | None:
    digits = "".join(c for c in sender_phone_number if c.isdigit())
    return get_chat(f"{digits}@s.whatsapp.net")


def get_contact_chats(jid: str, limit: int = 20, page: int = 0) -> list[dict]:
    limit, offset = _paginate(limit, page)
    conn = _connect()
    try:
        rows = conn.execute(
            """
            SELECT DISTINCT c.jid, c.name, c.last_message_time
            FROM chats c JOIN messages m ON m.chat_jid = c.jid
            WHERE m.sender = ?
            ORDER BY c.last_message_time DESC
            LIMIT ? OFFSET ?
            """,
            (jid, limit, offset),
        ).fetchall()
        return [Chat(r["jid"], r["name"], r["last_message_time"]).to_dict() for r in rows]
    finally:
        conn.close()


def get_last_interaction(jid: str) -> dict | None:
    conn = _connect()
    try:
        row = conn.execute(
            """
            SELECT id, chat_jid, sender, content, timestamp, is_from_me, media_type, filename
            FROM messages WHERE sender = ? OR chat_jid = ?
            ORDER BY timestamp DESC LIMIT 1
            """,
            (jid, jid),
        ).fetchone()
        if not row:
            return None
        return Message(*row).to_dict()
    finally:
        conn.close()


def list_messages(
    after: str | None = None,
    before: str | None = None,
    sender_phone_number: str | None = None,
    chat_jid: str | None = None,
    query: str | None = None,
    limit: int = 20,
    page: int = 0,
    include_context: bool = True,
    context_before: int = 1,
    context_after: int = 1,
) -> list[dict]:
    limit, offset = _paginate(limit, page)
    conn = _connect()
    try:
        sql = """
            SELECT id, chat_jid, sender, content, timestamp, is_from_me, media_type, filename
            FROM messages WHERE 1=1
        """
        params: list = []
        if after:
            sql += " AND timestamp >= ?"
            params.append(after)
        if before:
            sql += " AND timestamp <= ?"
            params.append(before)
        if sender_phone_number:
            sql += " AND sender = ?"
            params.append(sender_phone_number)
        if chat_jid:
            sql += " AND chat_jid = ?"
            params.append(chat_jid)
        if query:
            sql += " AND content LIKE ?"
            params.append(f"%{query}%")
        sql += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params += [limit, offset]

        rows = conn.execute(sql, params).fetchall()
        messages = [Message(*row).to_dict() for row in rows]

        if include_context and query:
            for msg in list(messages):
                ctx = get_message_context(msg["id"], before=context_before, after=context_after)
                msg["context"] = ctx
        return messages
    finally:
        conn.close()


def get_message_context(message_id: str, before: int = 5, after: int = 5) -> dict:
    conn = _connect()
    try:
        anchor = conn.execute(
            """
            SELECT id, chat_jid, sender, content, timestamp, is_from_me, media_type, filename
            FROM messages WHERE id = ? LIMIT 1
            """,
            (message_id,),
        ).fetchone()
        if not anchor:
            return {"before": [], "message": None, "after": []}

        before_rows = conn.execute(
            """
            SELECT id, chat_jid, sender, content, timestamp, is_from_me, media_type, filename
            FROM messages WHERE chat_jid = ? AND timestamp < ?
            ORDER BY timestamp DESC LIMIT ?
            """,
            (anchor["chat_jid"], anchor["timestamp"], before),
        ).fetchall()
        after_rows = conn.execute(
            """
            SELECT id, chat_jid, sender, content, timestamp, is_from_me, media_type, filename
            FROM messages WHERE chat_jid = ? AND timestamp > ?
            ORDER BY timestamp ASC LIMIT ?
            """,
            (anchor["chat_jid"], anchor["timestamp"], after),
        ).fetchall()

        return {
            "before": [Message(*r).to_dict() for r in reversed(before_rows)],
            "message": Message(*anchor).to_dict(),
            "after": [Message(*r).to_dict() for r in after_rows],
        }
    finally:
        conn.close()


def _bridge_post(path: str, payload: dict) -> dict:
    try:
        resp = requests.post(f"{BRIDGE_API_URL}{path}", json=payload, timeout=120)
    except requests.RequestException as e:
        return {"success": False, "message": f"could not reach whatsapp-bridge at {BRIDGE_API_URL}: {e}"}
    try:
        return resp.json()
    except ValueError:
        return {"success": False, "message": f"bridge returned non-JSON response: {resp.text[:200]}"}


def send_message(recipient: str, message: str) -> dict:
    return _bridge_post("/api/send", {"recipient": recipient, "message": message})


def send_file(recipient: str, media_path: str) -> dict:
    return _bridge_post("/api/send/media", {"recipient": recipient, "media_path": media_path})


def send_audio_message(recipient: str, media_path: str) -> dict:
    return _bridge_post("/api/send/media", {"recipient": recipient, "media_path": media_path})


def download_media(message_id: str, chat_jid: str) -> dict:
    return _bridge_post("/api/download", {"message_id": message_id, "chat_jid": chat_jid})


def get_group_members(chat_jid: str) -> dict:
    return _bridge_post("/api/group/members", {"chat_jid": chat_jid})
