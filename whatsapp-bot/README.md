# Claude WhatsApp Bot

A production-ready service that lets WhatsApp users chat with Claude, built with:

- **[Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)** for the messaging transport
- **[Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/python)** for the Claude side, one persistent conversation session per WhatsApp number
- **FastAPI** as the webhook server

## How it works

1. Twilio POSTs an inbound WhatsApp message to `POST /webhook/whatsapp`.
2. The request's `X-Twilio-Signature` is validated (`app/security.py`) before anything else runs.
3. The `MessageSid` is recorded in SQLite to dedupe Twilio's automatic webhook retries.
4. A per-number rate limit is checked.
5. The webhook responds immediately with empty TwiML — Claude turns can take longer than Twilio's webhook timeout, so the actual work happens in a background task.
6. The background task resumes that number's Claude Agent SDK session (`app/claude_agent.py`), gets a reply, and sends it back via the Twilio REST API, splitting long replies across multiple WhatsApp messages.

Each WhatsApp number maps to one persistent Claude session ID (stored in SQLite) and one isolated sandbox directory (`data/sandboxes/<number>/`), so conversation history and any tool-created files never leak between users.

## Security defaults

This bot is reachable by anyone who can message your Twilio number, so it ships locked down:

- **No tool access by default.** `ClaudeAgentOptions(tools=[])` disables every built-in tool — the bot is pure conversation unless you opt into specific tools via `ALLOWED_TOOLS`.
- **Hard-blocked tools.** `Bash`, `BashOutput`, and `KillShell` are stripped from `ALLOWED_TOOLS` and explicitly added to `disallowed_tools` no matter what you configure — a chat message must never be able to run shell commands.
- **Signature verification** on every webhook request, using Twilio's `RequestValidator`.
- **Message dedup** so retried webhooks can't trigger duplicate (billed) Claude calls.
- **Per-number rate limiting** to cap abuse and runaway cost.
- **Per-number spend cap** via `MAX_BUDGET_USD` and `MAX_TURNS` on every Claude query.
- **Optional allowlist** (`ALLOWED_PHONE_NUMBERS`) to restrict the bot to specific numbers while testing.

If you enable extra tools (e.g. `WebSearch`), review what they expose before going to production — `setting_sources=[]` is set so the agent never loads project-level `.claude/settings.json` or `CLAUDE.md` files from its sandbox.

## Setup

### 1. Twilio

- Create a Twilio account and either use the **WhatsApp Sandbox** (for testing — join with the code Twilio gives you) or apply for a production **WhatsApp-enabled sender**.
- Note your **Account SID** and **Auth Token** from the Twilio console.
- You'll set the sandbox/number's "When a message comes in" webhook to `https://<your-domain>/webhook/whatsapp` once your server is reachable (see local dev below for `ngrok`).

### 2. Anthropic

- Get an API key from the [Anthropic Console](https://console.anthropic.com/) and set it as `ANTHROPIC_API_KEY`.

### 3. Configure

```bash
cd whatsapp-bot
cp .env.example .env
# fill in TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER,
# WEBHOOK_URL, and ANTHROPIC_API_KEY
```

`WEBHOOK_URL` must exactly match (scheme, host, path) the URL you configure in the Twilio console — Twilio signs requests against that literal URL, and signature validation will fail on any mismatch (including behind reverse proxies that terminate TLS).

### 4. Run locally

```bash
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

Expose it to Twilio during development with a tunnel, e.g.:

```bash
ngrok http 8000
```

Then set the sandbox webhook to `https://<ngrok-subdomain>.ngrok.app/webhook/whatsapp` and set `WEBHOOK_URL` in `.env` to that same URL.

### 5. Run with Docker (production)

```bash
docker compose up -d --build
```

`data/` is mounted as a volume so the SQLite session store and sandbox directories survive restarts — without persistence, every restart loses conversation history and resets rate limits.

## Testing

```bash
pip install -r requirements-dev.txt
pytest
```

Tests cover signature validation, rate limiting, tool-blocklist enforcement, and the webhook flow (dedup, allowlist, rate limit, reply delivery) with Twilio and the Claude Agent SDK mocked out — no real Twilio/Anthropic credentials or network access needed.

## Scaling beyond one process

The rate limiter and per-user locks in this codebase are in-memory and correct for a **single process**. Running multiple workers or replicas needs:

- A shared rate-limit store (e.g. Redis) instead of `app/ratelimit.py`'s in-memory sliding window.
- Shared, durable storage for `DATABASE_PATH` and `SANDBOX_ROOT` (e.g. a network volume, or move sessions to Postgres) so a user's session resumes correctly regardless of which replica handles their next message.
