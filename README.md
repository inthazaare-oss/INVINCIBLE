# INVINCIBLE

## NotebookLM setup

This repo is set up to use [notebooklm-py](https://github.com/teng-lin/notebooklm-py) — an unofficial Python API/CLI for Google NotebookLM, with a Claude Code skill for agent-driven use.

Install the package and authenticate:

```bash
pip install -r requirements.txt
notebooklm login                    # opens a browser for Google sign-in
notebooklm auth check --test --json # verify: expect "status": "ok"
```

The Claude Code / Agent Skills definitions are already installed at project scope in `.claude/skills/notebooklm/` and `.agents/skills/notebooklm/` (via `notebooklm skill install --scope project`). To refresh them after upgrading the package:

```bash
notebooklm skill install --scope project --force
```

See [notebooklm-py's installation guide](https://github.com/teng-lin/notebooklm-py/blob/main/docs/installation.md) for headless/CI auth (`NOTEBOOKLM_AUTH_JSON`) and other setups.