#!/usr/bin/env python3
"""Generate placeholder artwork images (SVG) so the gallery can be seen working
before the artist uploads real photographs of their paintings.

Run:  python3 tools/make-placeholders.py
Delete site/images/works/*.svg once real images are in place.
"""
import math, os, random

OUT = os.path.join(os.path.dirname(__file__), "..", "site", "images", "works")
os.makedirs(OUT, exist_ok=True)

# id: (palette top->bottom, motif)
WORKS = {
    "dawn-over-the-dunes":      (["#f6d9a8", "#eab873", "#d98f4e", "#a85f37", "#6d3a24"], "dunes"),
    "the-water-carrier":        (["#f3e4cd", "#e6c79a", "#cf9a68", "#9c5f3e"], "figure"),
    "spiti-crossing":           (["#cfe2ef", "#9dc0d8", "#6f8fae", "#3f5871", "#26364a"], "peaks"),
    "herder-at-the-pass":       (["#e8e4dc", "#c8c2b6", "#8f8779", "#4a453d"], "figure"),
    "ghats-at-first-light":     (["#fbe3c6", "#f0bb8c", "#c98a63", "#7d5346", "#3f2c2a"], "river"),
    "boatman-varanasi":         (["#efe7d8", "#cdbfa6", "#8c7d63", "#3d372c"], "boat"),
    "monsoon-fields":           (["#dfeccd", "#a9cf94", "#6aa46b", "#356b4f", "#1e4437"], "fields"),
    "grandmother-kutch":        (["#f2ded0", "#d9ae95", "#b2755c", "#6f3f30"], "figure"),
    "pichwai-notes":            (["#f5ecd6", "#d9c98f", "#8fae7a", "#2f6b57", "#1c3f3a"], "motif"),
    "festival-of-colour":       (["#fde2e4", "#f9a8b8", "#e0629b", "#8e3b8f", "#4a2361"], "crowd"),
    "assembly":                 (["#e9e4d8", "#c2b7a0", "#8a7c62", "#4b4335", "#241f18"], "crowd"),
    "march-in-the-rain":        (["#dfe3e6", "#b6bcc2", "#7d858d", "#3c4249"], "crowd"),
    "delta-abstract-iii":       (["#e6efe8", "#9fc6bd", "#5f9a9b", "#2f5d6e", "#17313f"], "abstract"),
    "market-morning-marrakesh": (["#fbe8cf", "#efc08a", "#d0824f", "#9a4b32", "#5b2a20"], "market"),
    "summer-heat-abstract":     (["#fdf0c9", "#f7c95c", "#e8893a", "#b8442b"], "abstract"),
}

def band_path(y, amp, w, h, seed):
    r = random.Random(seed)
    pts = []
    steps = 8
    for i in range(steps + 1):
        x = w * i / steps
        yy = y + math.sin(i * 1.3 + seed) * amp + r.uniform(-amp / 3, amp / 3)
        pts.append((x, yy))
    d = f"M0,{h} L0,{pts[0][1]:.1f} "
    for i in range(1, len(pts)):
        x0, y0 = pts[i - 1]
        x1, y1 = pts[i]
        cx = (x0 + x1) / 2
        d += f"Q{cx:.1f},{y0:.1f} {x1:.1f},{y1:.1f} "
    d += f"L{w},{h} Z"
    return d

def svg(work_id, palette, motif, w, h):
    r = random.Random(sum(ord(c) for c in work_id))
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="Placeholder image for {work_id}">',
        '<defs>',
        '<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>'
        '<feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.10"/></feComponentTransfer></filter>',
        f'<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="{palette[0]}"/><stop offset="1" stop-color="{palette[1]}"/></linearGradient>',
        '</defs>',
        f'<rect width="{w}" height="{h}" fill="url(#sky)"/>',
    ]
    if motif in ("dunes", "peaks", "river", "fields", "market", "boat", "crowd", "figure", "motif"):
        parts.append(f'<circle cx="{w*r.uniform(0.2,0.8):.0f}" cy="{h*r.uniform(0.15,0.3):.0f}" '
                     f'r="{min(w,h)*0.07:.0f}" fill="{palette[0]}" opacity="0.85"/>')
    n = len(palette) - 1
    for i in range(1, n + 1):
        y = h * (0.32 + 0.62 * (i - 1) / max(n - 1, 1))
        amp = h * (0.05 if motif in ("peaks", "dunes") else 0.028)
        parts.append(f'<path d="{band_path(y, amp, w, h, i*3+len(work_id))}" fill="{palette[i]}" opacity="{0.92 if i<n else 1}"/>')
    if motif in ("figure", "crowd", "market", "boat"):
        count = {"figure": 1, "boat": 2, "market": 5, "crowd": 9}[motif]
        for i in range(count):
            fx = w * (0.5 if count == 1 else (0.12 + 0.76 * i / max(count - 1, 1)) + r.uniform(-0.03, 0.03))
            fh = h * r.uniform(0.20, 0.34)
            fy = h * r.uniform(0.60, 0.78)
            fw = fh * 0.26
            col = palette[-1]
            parts.append(f'<g fill="{col}" opacity="{r.uniform(0.55,0.9):.2f}">'
                         f'<ellipse cx="{fx:.0f}" cy="{fy-fh:.0f}" rx="{fw*0.45:.0f}" ry="{fw*0.52:.0f}"/>'
                         f'<path d="M{fx-fw/2:.0f},{fy:.0f} Q{fx:.0f},{fy-fh*0.98:.0f} {fx+fw/2:.0f},{fy:.0f} Z"/></g>')
    if motif == "abstract":
        for i in range(7):
            parts.append(f'<rect x="{w*r.uniform(0,0.8):.0f}" y="{h*r.uniform(0,0.8):.0f}" '
                         f'width="{w*r.uniform(0.08,0.35):.0f}" height="{h*r.uniform(0.05,0.3):.0f}" '
                         f'fill="{r.choice(palette)}" opacity="{r.uniform(0.25,0.6):.2f}" '
                         f'transform="rotate({r.uniform(-12,12):.1f} {w/2:.0f} {h/2:.0f})"/>')
    parts.append(f'<rect width="{w}" height="{h}" filter="url(#g)" opacity="0.5"/>')
    parts.append(f'<rect x="0.5" y="0.5" width="{w-1}" height="{h-1}" fill="none" stroke="#00000022"/>')
    parts.append(f'<text x="{w-10}" y="{h-10}" text-anchor="end" font-family="Georgia,serif" '
                 f'font-size="{max(9, int(min(w,h)*0.028))}" fill="#00000055">sample image — replace</text>')
    parts.append('</svg>')
    return "".join(parts)

# width x height in px, roughly matching each work's aspect ratio
SIZES = {
    "dawn-over-the-dunes": (1200, 800), "the-water-carrier": (760, 1040),
    "spiti-crossing": (900, 1200), "herder-at-the-pass": (840, 1180),
    "ghats-at-first-light": (1200, 800), "boatman-varanasi": (760, 1060),
    "monsoon-fields": (1000, 1000), "grandmother-kutch": (900, 1200),
    "pichwai-notes": (960, 1200), "festival-of-colour": (900, 1200),
    "assembly": (1000, 1200), "march-in-the-rain": (860, 1200),
    "delta-abstract-iii": (1000, 1000), "market-morning-marrakesh": (820, 1200),
    "summer-heat-abstract": (1000, 1000),
}

for wid, (pal, motif) in WORKS.items():
    w, h = SIZES[wid]
    with open(os.path.join(OUT, wid + ".svg"), "w") as f:
        f.write(svg(wid, pal, motif, w, h))
print(f"wrote {len(WORKS)} placeholder images to site/images/works/")
