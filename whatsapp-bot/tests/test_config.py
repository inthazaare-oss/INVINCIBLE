from app.config import HARD_BLOCKED_TOOLS, Settings


def test_hard_blocked_tools_are_stripped_from_allowed_tools(monkeypatch):
    monkeypatch.setenv("ALLOWED_TOOLS", '["WebSearch", "Bash", "KillShell"]')
    s = Settings()
    assert s.allowed_tools == ["WebSearch"]
    assert HARD_BLOCKED_TOOLS.isdisjoint(s.allowed_tools)


def test_default_allowed_tools_is_empty():
    s = Settings()
    assert s.allowed_tools == []
