# The optional Studio Server

The website in `site/` is complete without this. Run the server only if you want:

- photographs to upload themselves from the Studio Panel (no download-and-re-upload),
- a **Publish live** button instead of exporting a file,
- a stored copy of every enquiry, so nothing is lost to a spam folder,
- a password on the Studio Panel.

It needs **Node.js 18 or newer** and nothing else. There are no dependencies and no
`npm install` — it uses only modules that come with Node.

## Running it

```bash
node server/server.mjs                      # open, no password — local use only
STUDIO_PASSWORD="something-only-you-know" node server/server.mjs
```

Then open <http://localhost:4000>. The Studio Panel is at `/admin.html`.

## Settings (all optional, all environment variables)

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `4000` | Port to listen on |
| `STUDIO_USER` | `artist` | Username for the panel |
| `STUDIO_PASSWORD` | *(none)* | Password for the panel. **If unset, the panel is open to anyone who can reach the server.** Always set it if the server is on the internet. |
| `ARTIST_EMAIL` | *(none)* | Where enquiries are emailed |
| `MAIL_PROVIDER` | `none` | `resend`, `web3forms`, or `none` (store only) |
| `RESEND_API_KEY` | | If `MAIL_PROVIDER=resend` |
| `MAIL_FROM` | | Sender address for Resend, e.g. `"Studio <studio@yourdomain.com>"` |
| `WEB3FORMS_KEY` | | If `MAIL_PROVIDER=web3forms` |

Example:

```bash
PORT=4000 \
STUDIO_PASSWORD="a-long-phrase-you-remember" \
ARTIST_EMAIL="you@example.com" \
MAIL_PROVIDER=resend \
RESEND_API_KEY=re_xxxxxxxx \
MAIL_FROM="Studio <studio@yourdomain.com>" \
node server/server.mjs
```

Point the website at the server by setting `forms.mode` to `"server"` in
`site/data/site.js`.

## What it does

| Route | Method | Purpose |
|---|---|---|
| `/api/health` | GET | How the Studio Panel detects the server |
| `/api/artworks` | GET | The gallery as JSON |
| `/api/artworks` | PUT | Publish the gallery (password) — writes `site/data/artworks.js` atomically |
| `/api/upload` | POST | Save an uploaded image into `site/images/works/` (password) |
| `/api/enquiry` | POST | Store an enquiry and email it on |
| `/api/enquiries` | GET | List stored enquiries (password) |
| everything else | GET | Serves the `site/` folder |

Enquiries are stored in `server/data/enquiries.json`. That file is not tracked by git,
because it contains other people's names, emails and phone numbers — keep it private
and back it up somewhere safe.

## If you put this on the internet

- Always set `STUDIO_PASSWORD`.
- Put it behind HTTPS (a reverse proxy such as Caddy or nginx, or a host that
  terminates TLS for you). The panel password is sent with HTTP Basic authentication,
  which is only safe over HTTPS.
- Take a copy of `site/data/artworks.js`, `site/images/` and `server/data/` regularly.
  They are your gallery and your enquiry history.
