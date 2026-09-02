#!/usr/bin/env python3
"""Placeholder images for the studio materials shop (hand-made paints, pigments).
Delete site/images/products/*.svg once real photographs are in."""
import os, random

OUT = os.path.join(os.path.dirname(__file__), "..", "site", "images", "products")
os.makedirs(OUT, exist_ok=True)

# id: (pigment colour, darker shade, vessel)
ITEMS = {
    "indian-yellow-pigment":   ("#e8a723", "#a56d0d", "jar"),
    "lapis-blue-pigment":      ("#2c4c9b", "#1a2f63", "jar"),
    "red-ochre-kutch":         ("#a8442c", "#6d2718", "jar"),
    "lamp-black-pigment":      ("#2a2724", "#141311", "jar"),
    "malachite-green-pigment": ("#3f8f6e", "#245a44", "jar"),
    "earth-watercolour-set":   ("#b4713f", "#6d3f21", "pans"),
    "gum-arabic-binder":       ("#d8c08a", "#9c8451", "bottle"),
    "chalk-ground-gesso":      ("#e9e2d4", "#b3a892", "bottle"),
    "cotton-rag-paper":        ("#f2ece0", "#cabfa9", "paper"),
    "earth-pigment-starter":   ("#c07a3a", "#7d4620", "pans"),
}

def svg(pid, c, d, vessel):
    r = random.Random(sum(ord(x) for x in pid))
    W = H = 900
    p = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="Placeholder photograph of {pid}">',
         '<defs><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"/>'
         '<feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.09"/>'
         '</feComponentTransfer></filter></defs>',
         f'<rect width="{W}" height="{H}" fill="#efeae1"/>',
         f'<ellipse cx="{W/2}" cy="{H*0.86}" rx="{W*0.34}" ry="{H*0.045}" fill="#000" opacity="0.08"/>']
    if vessel == "jar":
        p += [f'<rect x="{W*0.3}" y="{H*0.3}" width="{W*0.4}" height="{H*0.52}" rx="14" fill="#ffffff" opacity="0.55"/>',
              f'<rect x="{W*0.31}" y="{H*0.46}" width="{W*0.38}" height="{H*0.35}" rx="10" fill="{c}"/>',
              f'<path d="M{W*0.31},{H*0.5} Q{W*0.5},{H*0.42} {W*0.69},{H*0.5} L{W*0.69},{H*0.47} Q{W*0.5},{H*0.4} {W*0.31},{H*0.47} Z" fill="{d}"/>',
              f'<rect x="{W*0.34}" y="{H*0.26}" width="{W*0.32}" height="{H*0.06}" rx="6" fill="{d}"/>']
    elif vessel == "bottle":
        p += [f'<rect x="{W*0.42}" y="{H*0.2}" width="{W*0.16}" height="{H*0.16}" fill="#ffffff" opacity="0.6"/>',
              f'<path d="M{W*0.34},{H*0.36} Q{W*0.5},{H*0.3} {W*0.66},{H*0.36} L{W*0.66},{H*0.82} L{W*0.34},{H*0.82} Z" fill="#ffffff" opacity="0.5"/>',
              f'<path d="M{W*0.35},{H*0.5} L{W*0.65},{H*0.5} L{W*0.65},{H*0.81} L{W*0.35},{H*0.81} Z" fill="{c}"/>']
    elif vessel == "pans":
        p += [f'<rect x="{W*0.16}" y="{H*0.34}" width="{W*0.68}" height="{H*0.4}" rx="10" fill="#3a352f"/>']
        cols = [c, d, "#8c5a2b", "#c9a23f", "#6d7f4a", "#8d3f36"]
        for i in range(6):
            x = W * (0.2 + 0.107 * i)
            p.append(f'<rect x="{x}" y="{H*0.4}" width="{W*0.085}" height="{H*0.13}" rx="3" fill="{cols[i % len(cols)]}"/>')
            p.append(f'<rect x="{x}" y="{H*0.57}" width="{W*0.085}" height="{H*0.13}" rx="3" fill="{cols[(i+3) % len(cols)]}"/>')
    else:  # paper
        for i in range(4):
            off = i * 12
            p.append(f'<rect x="{W*0.2+off}" y="{H*0.24+off}" width="{W*0.6}" height="{H*0.54}" fill="{"#faf6ee" if i%2 else "#f3ecdf"}" stroke="#00000018"/>')
        p.append(f'<path d="M{W*0.28},{H*0.62} Q{W*0.45},{H*0.5} {W*0.62},{H*0.64}" stroke="{c}" stroke-width="10" fill="none" opacity="0.75" stroke-linecap="round"/>')
    # a loose pigment swatch, the thing a buyer actually wants to see
    p.append(f'<path d="M{W*0.16},{H*0.9} q{W*0.2},-{H*0.05} {W*0.36},0 q{W*0.16},{H*0.04} {W*0.3},-0.01" stroke="{c}" stroke-width="16" fill="none" opacity="0.85" stroke-linecap="round"/>')
    p.append(f'<rect width="{W}" height="{H}" filter="url(#g)" opacity="0.5"/>')
    p.append(f'<text x="{W-16}" y="{H-16}" text-anchor="end" font-family="Georgia,serif" font-size="22" fill="#00000055">sample image — replace</text>')
    p.append("</svg>")
    return "".join(p)

for pid, (c, d, vessel) in ITEMS.items():
    open(os.path.join(OUT, pid + ".svg"), "w").write(svg(pid, c, d, vessel))
print(f"wrote {len(ITEMS)} product placeholders to site/images/products/")
