# INVINCIBLE

## WhatsApp MCP integration

This repo contains a Model Context Protocol (MCP) integration that lets Claude
read and send your personal WhatsApp messages. It's split into two pieces:

- **`whatsapp-bridge/`** — a Go program that logs into WhatsApp (via a QR
  code, same as WhatsApp Web) using [whatsmeow](https://github.com/tulir/whatsmeow),
  keeps a local SQLite copy of your chats/messages, and exposes a small REST
  API for sending messages and downloading media.
- **`whatsapp-mcp-server/`** — a Python MCP server that Claude Desktop (or any
  MCP client) talks to. It reads chat/message history straight from the
  bridge's SQLite database and calls the bridge's REST API for anything that
  needs a live connection (sending messages/media, downloading media).

All of your message data stays local in `whatsapp-bridge/store/`. Nothing is
sent anywhere except to WhatsApp itself (to sync/send) and to Claude when a
tool is actually invoked during a conversation.

### Setup

**1. Run the bridge** (needs real network access to WhatsApp's servers — run
this on your own machine, not in a sandboxed CI/cloud container):

```bash
cd whatsapp-bridge
go run .
```

On first run it prints a QR code in the terminal. Open WhatsApp on your
phone → Settings → Linked Devices → Link a Device, and scan it. The bridge
then starts syncing your history into `whatsapp-bridge/store/messages.db`
and stays connected, keeping that database up to date and serving the REST
API on `http://127.0.0.1:8080`.

**2. Run the MCP server:**

```bash
cd whatsapp-mcp-server
uv sync
uv run main.py
```

**3. Point Claude Desktop at it.** Add to your
`claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "whatsapp": {
      "command": "uv",
      "args": [
        "--directory",
        "/absolute/path/to/INVINCIBLE/whatsapp-mcp-server",
        "run",
        "main.py"
      ]
    }
  }
}
```

Restart Claude Desktop. You should see the `whatsapp` tools (search_contacts,
list_chats, list_messages, send_message, send_file, download_media, etc.)
available.

### Security note

Chat content you ask Claude to read becomes part of its context, including
messages written by other people. A malicious message could attempt to
prompt-inject the agent (e.g. to make it exfiltrate other chats or send
unwanted messages). Review what an agent does with `send_message`/`send_file`
before granting it unattended, broad access to your account.
