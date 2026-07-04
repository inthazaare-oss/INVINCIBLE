# whatsapp-mcp-server

Python MCP server exposing WhatsApp read/search/send tools to Claude. Talks
to `whatsapp-bridge` (must be running) for anything requiring a live
connection, and reads chat/message history directly from the bridge's
SQLite database otherwise.

## Run

```bash
uv sync
uv run main.py
```

## Configuration (environment variables)

- `WHATSAPP_MESSAGES_DB` — path to the bridge's `messages.db`
  (defaults to `../whatsapp-bridge/store/messages.db` relative to this
  directory).
- `WHATSAPP_BRIDGE_URL` — base URL of the bridge's REST API
  (defaults to `http://127.0.0.1:8080`).

## Tools

`search_contacts`, `list_chats`, `get_chat`, `get_direct_chat_by_contact`,
`get_contact_chats`, `get_last_interaction`, `list_messages`,
`get_message_context`, `send_message`, `send_file`, `send_audio_message`,
`download_media`, `get_group_members`.
