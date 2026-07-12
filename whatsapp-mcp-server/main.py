"""MCP server exposing personal WhatsApp data/actions to Claude.

Reads come straight from the SQLite database the whatsapp-bridge Go process
keeps in sync; sends and media downloads are proxied to that same process's
REST API, since only it holds the live WhatsApp connection.
"""

from __future__ import annotations

from typing import Optional

from mcp.server.fastmcp import FastMCP

import whatsapp

mcp = FastMCP("whatsapp")


@mcp.tool()
def search_contacts(query: str) -> list[dict]:
    """Search WhatsApp contacts by name or phone number fragment."""
    return whatsapp.search_contacts(query)


@mcp.tool()
def list_chats(
    query: Optional[str] = None,
    limit: int = 20,
    page: int = 0,
    include_last_message: bool = True,
    sort_by: str = "last_active",
) -> list[dict]:
    """List WhatsApp chats, optionally filtered by name/JID.

    sort_by is either "last_active" or "name".
    """
    return whatsapp.list_chats(query, limit, page, include_last_message, sort_by)


@mcp.tool()
def get_chat(chat_jid: str, include_last_message: bool = True) -> Optional[dict]:
    """Get metadata for a single chat by its JID."""
    return whatsapp.get_chat(chat_jid, include_last_message)


@mcp.tool()
def get_direct_chat_by_contact(sender_phone_number: str) -> Optional[dict]:
    """Get the direct-message chat for a contact's phone number."""
    return whatsapp.get_direct_chat_by_contact(sender_phone_number)


@mcp.tool()
def get_contact_chats(jid: str, limit: int = 20, page: int = 0) -> list[dict]:
    """List all chats (including groups) that a contact JID appears in."""
    return whatsapp.get_contact_chats(jid, limit, page)


@mcp.tool()
def get_last_interaction(jid: str) -> Optional[dict]:
    """Get the most recent message involving the given contact or chat JID."""
    return whatsapp.get_last_interaction(jid)


@mcp.tool()
def list_messages(
    after: Optional[str] = None,
    before: Optional[str] = None,
    sender_phone_number: Optional[str] = None,
    chat_jid: Optional[str] = None,
    query: Optional[str] = None,
    limit: int = 20,
    page: int = 0,
    include_context: bool = True,
    context_before: int = 1,
    context_after: int = 1,
) -> list[dict]:
    """Search/list stored messages with optional filters.

    Timestamps (after/before) are ISO-8601 strings. When query is set and
    include_context is true, each result also carries a few surrounding
    messages from the same chat.
    """
    return whatsapp.list_messages(
        after, before, sender_phone_number, chat_jid, query,
        limit, page, include_context, context_before, context_after,
    )


@mcp.tool()
def get_message_context(message_id: str, before: int = 5, after: int = 5) -> dict:
    """Get the messages immediately before/after a given message in its chat."""
    return whatsapp.get_message_context(message_id, before, after)


@mcp.tool()
def send_message(recipient: str, message: str) -> dict:
    """Send a WhatsApp text message.

    recipient is a phone number (digits only, with country code) or a full
    JID for a person or group.
    """
    if not recipient:
        return {"success": False, "message": "recipient is required"}
    return whatsapp.send_message(recipient, message)


@mcp.tool()
def send_file(recipient: str, media_path: str) -> dict:
    """Send a file (image, video, or document) from a local path to a recipient."""
    return whatsapp.send_file(recipient, media_path)


@mcp.tool()
def send_audio_message(recipient: str, media_path: str) -> dict:
    """Send an audio file as a WhatsApp voice message."""
    return whatsapp.send_audio_message(recipient, media_path)


@mcp.tool()
def download_media(message_id: str, chat_jid: str) -> dict:
    """Download the media attached to a stored message and return its local path."""
    return whatsapp.download_media(message_id, chat_jid)


@mcp.tool()
def get_group_members(chat_jid: str) -> dict:
    """List the members of a WhatsApp group, with name, phone number, and admin status.

    chat_jid must be a group JID (ends in @g.us) - use list_chats or search_contacts
    to find it first.
    """
    return whatsapp.get_group_members(chat_jid)


@mcp.tool()
def export_chat_to_markdown(chat_jid: str, output_path: Optional[str] = None) -> dict:
    """Export a chat's full synced message history to a local Markdown (.md) file.

    chat_jid is a group (ends in @g.us) or direct (ends in @s.whatsapp.net) chat -
    use list_chats or search_contacts to find it first. If output_path is omitted,
    writes to whatsapp-mcp-server/exports/<chat name>.md and returns that path.
    """
    return whatsapp.export_chat_to_markdown(chat_jid, output_path)


if __name__ == "__main__":
    mcp.run(transport="stdio")
