/* =============================================================================
   server.mjs — the optional Studio Server.
   -----------------------------------------------------------------------------
   The website works perfectly well without this. Run it when you want:
     • real image uploads from the Studio Panel (no downloading and re-uploading)
     • one-click publishing of the gallery
     • a stored copy of every enquiry, in case an email goes astray
     • a password on the Studio Panel

   It uses nothing but Node's own built-in modules — there is no npm install.
       node server/server.mjs
   Then open http://localhost:4000

   Configure with environment variables (all optional):
       PORT=4000
       STUDIO_USER=artist              # username for the Studio Panel
       STUDIO_PASSWORD=choose-one      # password; if unset the panel is OPEN
       ARTIST_EMAIL=you@example.com    # where enquiries are emailed
       MAIL_PROVIDER=resend            # resend | web3forms | none (default none)
       RESEND_API_KEY=...              # if MAIL_PROVIDER=resend
       MAIL_FROM="Studio <studio@yourdomain.com>"
       WEB3FORMS_KEY=...               # if MAIL_PROVIDER=web3forms
   ========================================================================== */

import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { timingSafeEqual } from "node:crypto";
import vm from "node:vm";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, "..", "site");
const WORKS_FILE = path.join(SITE, "data", "artworks.js");
const PRODUCTS_FILE = path.join(SITE, "data", "products.js");
const IMAGE_DIRS = {                       // where uploads may land, by ?folder=
  works: path.join(SITE, "images", "works"),
  products: path.join(SITE, "images", "products")
};
const DATA_DIR = path.join(HERE, "data");
const ENQUIRY_FILE = path.join(DATA_DIR, "enquiries.json");

const PORT = Number(process.env.PORT || 4000);
const USER = process.env.STUDIO_USER || "artist";
const PASSWORD = process.env.STUDIO_PASSWORD || "";
const ARTIST_EMAIL = process.env.ARTIST_EMAIL || "";
const MAIL_PROVIDER = (process.env.MAIL_PROVIDER || "none").toLowerCase();
const MAX_UPLOAD = 12 * 1024 * 1024;   // 12 MB
const MAX_JSON = 32 * 1024 * 1024;     // gallery file, allowing embedded images

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif",
  ".avif": "image/avif", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2", ".pdf": "application/pdf"
};

/* ------------------------------------------------------------------ utils */
const json = (res, code, obj) => {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
};
const safeEqual = (a, b) => {
  const A = Buffer.from(String(a)), B = Buffer.from(String(b));
  return A.length === B.length && timingSafeEqual(A, B);
};

function authorised(req) {
  if (!PASSWORD) return true;                       // open mode
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return false;
  const [user, pass] = Buffer.from(header.slice(6), "base64").toString("utf8").split(":");
  return safeEqual(user || "", USER) && safeEqual(pass || "", PASSWORD);
}
function demandAuth(res) {
  res.writeHead(401, { "WWW-Authenticate": 'Basic realm="Studio Panel", charset="UTF-8"' });
  res.end("Studio panel: password required.");
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(new Error("payload too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/* ------------------------------------------------------------- gallery io */
async function readDataFile(file, globalName) {
  /* These data files are JavaScript, not JSON — hand-editable, so they may use
     unquoted keys or joined strings — and are evaluated in an empty sandbox
     with no access to this process rather than parsed as JSON. */
  try {
    const text = await fsp.readFile(file, "utf8");
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    new vm.Script(text, { filename: path.basename(file) }).runInContext(sandbox, { timeout: 2000 });
    return Array.isArray(sandbox.window[globalName]) ? sandbox.window[globalName] : [];
  } catch (e) {
    console.error("[data] could not read", file, "-", e.message);
    return [];
  }
}
const readWorks = () => readDataFile(WORKS_FILE, "ARTWORKS");
const readProducts = () => readDataFile(PRODUCTS_FILE, "PRODUCTS");
async function writeDataFile(file, globalName, rows, what) {
  const header =
    "/* =============================================================================\n" +
    `   ${path.basename(file)} — ${what}. Written by the Studio Panel on ` +
    new Date().toISOString() + ".\n" +
    "   ========================================================================== */\n\n";
  const tmp = file + ".tmp";
  await fsp.writeFile(tmp, header + `window.${globalName} = ` + JSON.stringify(rows, null, 2) + ";\n", "utf8");
  await fsp.rename(tmp, file);            // atomic: never a half-written gallery or shop
}
const writeWorks = (works) => writeDataFile(WORKS_FILE, "ARTWORKS", works, "the gallery");
const writeProducts = (items) => writeDataFile(PRODUCTS_FILE, "PRODUCTS", items, "the studio shop");

/* --------------------------------------------------- minimal multipart bit *
 * Parses one file field out of a multipart/form-data body. That is all the
 * Studio Panel sends, and it keeps this server dependency-free.             */
function parseSingleFile(buffer, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  if (!m) return null;
  const boundary = Buffer.from("--" + (m[1] || m[2]).trim());
  let pos = buffer.indexOf(boundary);
  while (pos !== -1) {
    const headerStart = pos + boundary.length + 2;                 // skip CRLF
    const headerEnd = buffer.indexOf("\r\n\r\n", headerStart, "utf8");
    if (headerEnd === -1) break;
    const headers = buffer.slice(headerStart, headerEnd).toString("utf8");
    const next = buffer.indexOf(boundary, headerEnd);
    if (next === -1) break;
    const content = buffer.slice(headerEnd + 4, next - 2);         // drop trailing CRLF
    const name = /filename="([^"]*)"/i.exec(headers);
    if (name && name[1]) {
      const type = /content-type:\s*([^\r\n]+)/i.exec(headers);
      return { filename: name[1], type: type ? type[1].trim() : "application/octet-stream", data: content };
    }
    pos = next;
  }
  return null;
}

/* ------------------------------------------------------------------- mail */
async function forwardEnquiry(data, subject) {
  const lines = Object.entries(data)
    .filter(([k, v]) => v !== "" && v != null && k !== "access_key")
    .map(([k, v]) => `${k}: ${v}`).join("\n");
  const text = `${subject}\n${"=".repeat(subject.length)}\n\n${lines}\n`;

  if (MAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY && ARTIST_EMAIL) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || "Studio <onboarding@resend.dev>",
        to: [ARTIST_EMAIL], reply_to: data.email || undefined, subject, text
      })
    });
    if (!r.ok) throw new Error("resend: HTTP " + r.status + " " + (await r.text()).slice(0, 200));
    return "resend";
  }
  if (MAIL_PROVIDER === "web3forms" && process.env.WEB3FORMS_KEY) {
    const r = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: process.env.WEB3FORMS_KEY, subject, ...data })
    });
    if (!r.ok) throw new Error("web3forms: HTTP " + r.status);
    return "web3forms";
  }
  return "stored-only";
}

async function storeEnquiry(entry) {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  let list = [];
  try { list = JSON.parse(await fsp.readFile(ENQUIRY_FILE, "utf8")); } catch { list = []; }
  list.push(entry);
  await fsp.writeFile(ENQUIRY_FILE, JSON.stringify(list, null, 2), "utf8");
}

/* ---------------------------------------------------------------- routing */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const route = url.pathname;

  try {
    /* ---- API ---------------------------------------------------------- */
    if (route === "/api/health") {
      return json(res, 200, { ok: true, protected: Boolean(PASSWORD), mail: MAIL_PROVIDER });
    }

    if (route === "/api/artworks" && req.method === "GET") {
      return json(res, 200, { ok: true, works: await readWorks() });
    }

    if (route === "/api/artworks" && req.method === "PUT") {
      if (!authorised(req)) return demandAuth(res);
      const body = JSON.parse((await readBody(req, MAX_JSON)).toString("utf8"));
      if (!Array.isArray(body.works)) return json(res, 400, { ok: false, error: "expected { works: [...] }" });
      await writeWorks(body.works);
      return json(res, 200, { ok: true, count: body.works.length });
    }

    if (route === "/api/products" && req.method === "GET") {
      return json(res, 200, { ok: true, products: await readProducts() });
    }

    if (route === "/api/products" && req.method === "PUT") {
      if (!authorised(req)) return demandAuth(res);
      const body = JSON.parse((await readBody(req, MAX_JSON)).toString("utf8"));
      if (!Array.isArray(body.products)) return json(res, 400, { ok: false, error: "expected { products: [...] }" });
      await writeProducts(body.products);
      return json(res, 200, { ok: true, count: body.products.length });
    }

    if (route === "/api/upload" && req.method === "POST") {
      if (!authorised(req)) return demandAuth(res);
      const buf = await readBody(req, MAX_UPLOAD);
      const file = parseSingleFile(buf, req.headers["content-type"]);
      if (!file) return json(res, 400, { ok: false, error: "no file found in the upload" });
      if (!/^image\//.test(file.type)) return json(res, 415, { ok: false, error: "only image files are accepted" });
      const ext = (path.extname(file.filename) || ".jpg").toLowerCase();
      if (![".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"].includes(ext)) {
        return json(res, 415, { ok: false, error: "unsupported image type " + ext });
      }
      const folder = url.searchParams.get("folder") === "products" ? "products" : "works";
      const dir = IMAGE_DIRS[folder];
      const base = path.basename(file.filename, path.extname(file.filename))
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "work";
      await fsp.mkdir(dir, { recursive: true });
      let name = base + ext, n = 2;
      while (fs.existsSync(path.join(dir, name))) name = `${base}-${n++}${ext}`;
      await fsp.writeFile(path.join(dir, name), file.data);
      return json(res, 200, { ok: true, path: `images/${folder}/` + name, bytes: file.data.length });
    }

    if (route === "/api/enquiry" && req.method === "POST") {
      const data = JSON.parse((await readBody(req, 1024 * 256)).toString("utf8"));
      if (data._gotcha) return json(res, 200, { ok: true });            // silently drop bots
      const subject = data._subject || data.subject || "Website enquiry";
      const entry = { received: new Date().toISOString(), ip: req.socket.remoteAddress, data };
      await storeEnquiry(entry);
      let delivery = "stored-only", error = null;
      try { delivery = await forwardEnquiry(data, subject); }
      catch (e) { error = e.message; console.error("[enquiry] email failed:", e.message); }
      return json(res, 200, { ok: true, delivery, error });
    }

    if (route === "/api/enquiries" && req.method === "GET") {
      if (!authorised(req)) return demandAuth(res);
      let list = [];
      try { list = JSON.parse(await fsp.readFile(ENQUIRY_FILE, "utf8")); } catch { list = []; }
      return json(res, 200, { ok: true, enquiries: list });
    }

    /* ---- Studio panel is password-protected when a password is set ----- */
    if (route === "/admin.html" && !authorised(req)) return demandAuth(res);

    /* ---- static files -------------------------------------------------- */
    if (req.method !== "GET" && req.method !== "HEAD") {
      return json(res, 405, { ok: false, error: "method not allowed" });
    }
    let rel = decodeURIComponent(route === "/" ? "/index.html" : route);
    const filePath = path.join(SITE, rel);
    if (!filePath.startsWith(SITE)) { res.writeHead(403); return res.end("Forbidden"); }
    const stat = await fsp.stat(filePath).catch(() => null);
    if (!stat || stat.isDirectory()) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      return res.end("<h1>Not found</h1><p><a href='/'>Back to the gallery</a></p>");
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Content-Length": stat.size,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600"
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error("[error]", err);
    if (!res.headersSent) json(res, 500, { ok: false, error: err.message });
    else res.end();
  }
});

server.listen(PORT, () => {
  console.log(`\n  Studio server running:  http://localhost:${PORT}`);
  console.log(`  Studio panel:           http://localhost:${PORT}/admin.html`);
  console.log(`  Panel password:         ${PASSWORD ? "set" : "NOT SET — the panel is open to anyone who can reach this server"}`);
  console.log(`  Enquiry email:          ${MAIL_PROVIDER === "none" ? "stored only (set MAIL_PROVIDER to email them)" : MAIL_PROVIDER + " → " + (ARTIST_EMAIL || "(no ARTIST_EMAIL set)")}\n`);
});
