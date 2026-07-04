# whatsapp-bridge

Go service that maintains the WhatsApp connection and local history.

## Run

```bash
go run .
```

First run prints a QR code — scan it from WhatsApp on your phone under
Settings → Linked Devices → Link a Device. Session state lives in
`store/whatsapp.db` (device/session keys) so you won't need to re-scan on
restart.

Chat/message history is synced into `store/messages.db`, which
`whatsapp-mcp-server` reads directly.

## REST API

Listens on `127.0.0.1:8080` by default (override with `BRIDGE_PORT`).

- `POST /api/send` — `{"recipient": "15551234567", "message": "hi"}`
- `POST /api/send/media` — `{"recipient": "...", "media_path": "/abs/path/file.jpg"}`
- `POST /api/download` — `{"message_id": "...", "chat_jid": "..."}` → downloads
  the media referenced by a stored message and returns its local path.

`recipient` accepts either a bare phone number (digits, with country code) or
a full JID (`1555...@s.whatsapp.net` for a person, `...@g.us` for a group).

## Notes

- Requires outbound network access to WhatsApp's servers — this will not work
  in a sandboxed environment with restricted egress.
- `store/` is gitignored; it holds your session credentials and message
  history and should never be committed.
