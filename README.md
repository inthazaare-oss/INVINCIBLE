# INVINCIBLE

## BVK ART Studio — artist portfolio, commissions & studio shop

A complete website for a working painter who sells three things: **finished paintings**,
**work made to order** (commissions, and design work for a particular room or wall), and
**hand-made paints and pigments** from the studio. Every enquiry and order goes straight to
the artist's inbox, and a private panel lets the artist add work without touching any code.

```
site/     the website — plain HTML, CSS and JavaScript. No build step, no npm.
server/   OPTIONAL Node server for real uploads, one-click publishing and stored enquiries.
docs/     how to use it, and the market analysis behind the design.
preview/  the landing page as a single self-contained file, for showing people.
tools/    scripts: placeholder images, and the preview builder.
```

**Start here → [`docs/GETTING-STARTED.md`](docs/GETTING-STARTED.md)** (plain language, no code)
**Why it is designed this way → [`docs/ANALYSIS-INDIAN-ART-WEBSITES.md`](docs/ANALYSIS-INDIAN-ART-WEBSITES.md)**

### See the landing page without installing anything

`preview/bvk-art-studio-landing.html` is the landing page as **one self-contained file** —
stylesheet, scripts, data and every image folded in. Double-click it, email it, or open it on
a phone; it needs no web server and no internet. Rebuild it after any change with:

```bash
python3 tools/build-preview.py
```

### See the whole site running

```bash
# either: any static server, the site is just files
cd site && python3 -m http.server 8000        # then open http://localhost:8000

# or: with uploads, publishing and stored enquiries
STUDIO_PASSWORD="choose-one" node server/server.mjs   # then open http://localhost:4000
```

### What is where

| I want to change… | Edit |
|---|---|
| The studio name (**BVK ART Studio**), bio, email, prices, FAQ, series | `site/data/site.js` |
| The paintings themselves | `site/admin.html` → Paintings tab (writes `site/data/artworks.js`) |
| The paints and materials you sell | `site/admin.html` → Materials tab (writes `site/data/products.js`) |
| Colours and typography | `site/assets/css/style.css` |

The sample paintings, materials, prices, bio and exhibitions shipped in this repository are
**placeholders**, and the images in `site/images/works/` and `site/images/products/` are
generated stand-ins.
Every line marked `// SAMPLE` in `site/data/site.js` is there to be replaced.

---

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