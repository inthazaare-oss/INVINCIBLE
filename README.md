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

## claude-mem setup

This repo also uses [claude-mem](https://github.com/thedotmack/claude-mem) — a persistent memory plugin for Claude Code that captures session context, compresses it, and injects relevant memory back into future sessions.

claude-mem is a machine-level (not project-level) install: it registers a Claude Code plugin under `~/.claude/plugins` and runs a local worker service backed by SQLite + a vector store under `~/.claude-mem`. Install it once per machine:

```bash
npx claude-mem install
```

Non-interactive install (CI / headless):

```bash
npx claude-mem install --ide claude-code --provider claude --no-auto-start
npx claude-mem start   # start the worker service
```

Alternatively, install as a Claude Code plugin from within a session:

```
/plugin marketplace add thedotmack/claude-mem
/plugin install claude-mem
```

Requirements: Node.js 20+, Bun and uv (both auto-installed if missing). Restart Claude Code after install for memory from previous sessions to be injected automatically. Useful commands:

```bash
npx claude-mem status   # check worker status
npx claude-mem doctor   # diagnose install/runtime health
npx claude-mem search "<query>"   # search past observations
```