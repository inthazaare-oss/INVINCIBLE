from __future__ import annotations

from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Tools that are never allowed, regardless of ALLOWED_TOOLS configuration.
# This bot talks to arbitrary WhatsApp users, so remote code execution and
# shell access must never be reachable from a chat message.
HARD_BLOCKED_TOOLS = frozenset({"Bash", "BashOutput", "KillShell"})


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Twilio ---
    twilio_account_sid: str
    twilio_auth_token: str
    twilio_whatsapp_number: str  # e.g. "whatsapp:+14155238886"
    # Exact public URL Twilio is configured to POST inbound messages to.
    # Must match byte-for-byte (scheme/host/path) for signature validation to pass.
    webhook_url: str

    # --- Anthropic / Claude Agent SDK ---
    anthropic_api_key: str
    claude_model: str = "claude-sonnet-5"
    system_prompt: str = (
        "You are a concise, friendly assistant chatting with a user over WhatsApp. "
        "Keep replies short and mobile-friendly unless asked for detail."
    )
    max_turns: int = 8
    max_budget_usd: float = 0.50
    # Extra tools to expose beyond plain conversation. Defaults to none (pure chat).
    allowed_tools: list[str] = Field(default_factory=list)

    # --- Storage ---
    database_path: Path = Path("data/whatsapp_bot.sqlite3")
    sandbox_root: Path = Path("data/sandboxes")

    # --- Rate limiting (per process; use a shared store for multi-instance deploys) ---
    rate_limit_max_messages: int = 10
    rate_limit_window_seconds: int = 60

    # --- Access control ---
    # Optional allowlist of WhatsApp numbers, e.g. ["whatsapp:+15551234567"].
    # Empty means anyone who messages the Twilio number is served.
    allowed_phone_numbers: list[str] = Field(default_factory=list)

    log_level: str = "INFO"

    @field_validator("allowed_tools")
    @classmethod
    def _strip_hard_blocked_tools(cls, tools: list[str]) -> list[str]:
        return [t for t in tools if t not in HARD_BLOCKED_TOOLS]


settings = Settings()
