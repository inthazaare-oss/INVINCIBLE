import os

# Settings() is constructed at import time in app.config, so required env
# vars must exist before any `from app...` import happens in test modules.
# conftest.py is collected first, which makes this the right place.
os.environ.setdefault("TWILIO_ACCOUNT_SID", "ACtest0000000000000000000000000")
os.environ.setdefault("TWILIO_AUTH_TOKEN", "test_auth_token")
os.environ.setdefault("TWILIO_WHATSAPP_NUMBER", "whatsapp:+15550001111")
os.environ.setdefault("WEBHOOK_URL", "https://example.com/webhook/whatsapp")
os.environ.setdefault("ANTHROPIC_API_KEY", "sk-ant-test")
