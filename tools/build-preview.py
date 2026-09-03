#!/usr/bin/env python3
"""Build a single self-contained landing page from the real site.

Everything — stylesheet, scripts, data and images — is folded into one HTML file
that works with no web server at all: double-click it, email it, or put it on a
tablet in the studio. Links that would go to another page become jumps to the
matching section, so the preview reads as a complete one-page site.

    python3 tools/build-preview.py
    → preview/bvk-art-studio-landing.html
"""
import base64, mimetypes, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SITE = os.path.join(ROOT, "site")
OUT = os.path.join(ROOT, "preview", "bvk-art-studio-landing.html")

def read(*parts):
    with open(os.path.join(SITE, *parts), encoding="utf-8") as f:
        return f.read()

# ---- every image in the site, as a data: URI -------------------------------
images = {}
for folder, _, files in os.walk(os.path.join(SITE, "images")):
    for name in files:
        full = os.path.join(folder, name)
        rel = os.path.relpath(full, SITE).replace(os.sep, "/")
        mime = mimetypes.guess_type(name)[0] or "application/octet-stream"
        with open(full, "rb") as f:
            images[rel] = "data:%s;base64,%s" % (mime, base64.b64encode(f.read()).decode())

def inline_images(text):
    # longest paths first so "images/works/a.svg" never half-matches
    for rel in sorted(images, key=len, reverse=True):
        text = text.replace(rel, images[rel])
    return text

# ---- the page itself --------------------------------------------------------
html = read("index.html")
title = re.search(r"<title>(.*?)</title>", html, re.S).group(1)

body = html[html.index("<a class=\"visually-hidden\""):html.rindex("</body>")]

# the inline page script is kept; the external ones are folded in
body = re.sub(r'<script src="[^"]+"></script>\s*', "", body)
scripts = "\n".join(
    "<script>\n%s\n</script>" % read(*p.split("/"))
    for p in ["data/site.js", "data/artworks.js", "data/products.js", "assets/js/app.js"]
)
page_script = re.search(r"<script>\n\(function \(\) \{.*?</script>", body, re.S)
body = body.replace(page_script.group(0), "")          # move it after the libraries

# ---- links to other pages become jumps to the matching section --------------
SECTIONS = {
    "index.html": "#top", "gallery.html": "#work", "artwork.html": "#work",
    "commission.html": "#commission", "spaces.html": "#spaces",
    "shop.html": "#materials", "about.html": "#about", "contact.html": "#contact",
    "admin.html": "#top",
}
def relink(match):
    href = match.group(1)
    page = href.split("?")[0].split("#")[0]
    return 'href="%s"' % SECTIONS[page] if page in SECTIONS else match.group(0)
body = re.sub(r'href="([^"]+)"', relink, body)

# in-page links that JavaScript writes out (gallery cards, product cards)
extra_js = """
<script>
/* The preview is a single page, so links the scripts write out at run time are
   caught here: a painting or a jar opens full size, anything else jumps to the
   section that covers it. */
(function () {
  var SECTIONS = {
    "index.html": "#top", "gallery.html": "#work", "artwork.html": "#work",
    "commission.html": "#commission", "spaces.html": "#spaces",
    "shop.html": "#materials", "about.html": "#about", "contact.html": "#contact",
    "admin.html": "#top"
  };
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href.indexOf(".html") === -1) return;          // real links are left alone
    e.preventDefault();
    var card = e.target.closest("a.card");
    if (card) {
      var img = card.querySelector("img");
      var title = card.querySelector(".card__title");
      if (img) { window.Studio.lightbox(img.src, title ? title.textContent : ""); return; }
    }
    var target = document.querySelector(SECTIONS[href.split("?")[0].split("#")[0]] || "#top");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, true);
})();
</script>
"""

note = ('<p class="small muted" style="margin-top:1rem">This is the landing page as a single '
        'self-contained file. In the real site, the links above open separate pages for the '
        'gallery, commissions, space work and the studio shop.</p>')
body = body.replace('<span><a href="#top">Studio panel</a></span>', '<span>Preview</span>')
body = body.replace('</div>\n    <div class="footer__bottom">', '</div>\n    ' + note + '\n    <div class="footer__bottom">')

out = (
    "<title>%s</title>\n" % title
    + '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    + '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">\n'
    + "<style>\n" + read("assets", "css", "style.css") + "\n</style>\n"
    + '<div id="top"></div>\n'
    + body
    + scripts + "\n"
    + page_script.group(0) + "\n"
    + extra_js
)
out = inline_images(out)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(out)
print("wrote %s (%.0f KB)" % (os.path.relpath(OUT, ROOT), len(out.encode()) / 1024))
