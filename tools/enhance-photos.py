#!/usr/bin/env python3
"""Prepare photographs of paintings for the website, from the command line.

Does exactly what the Studio Panel does in the browser (assets/js/imagefix.py's
counterpart, site/assets/js/imagefix.js), for when you have the files on a
computer and would rather run one command than drop them in one at a time:

  1. trims flat black or white borders (screenshots, video frames, scans)
  2. resizes down to 2000px on the longest side, with a good filter
  3. stretches the levels so darks reach black and lights reach white
  4. lifts saturation a little — photographs of paint always lose some
  5. sharpens gently, after the resize
  6. saves a quality-90 JPEG

It cannot invent detail the photograph does not hold. Flat daylight, no flash,
camera square to the canvas, cropped to the edge of the work — that is still
what makes the difference.

    pip install Pillow
    python3 tools/enhance-photos.py incoming/            # → site/images/works/
    python3 tools/enhance-photos.py incoming/ --products # → site/images/products/
    python3 tools/enhance-photos.py photo.jpg --name two-cranes-at-sunrise
"""
import argparse, os, sys

try:
    from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageStat
except ImportError:
    sys.exit("Pillow is needed:  pip install Pillow")

MAX_EDGE = 2000
QUALITY = 90
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}


def trim_flat_border(img):
    """Remove near-black or near-white bands around the picture."""
    grey = img.convert("L")
    w, h = grey.size
    px = grey.load()

    def band_is_flat(fixed, horizontal):
        step = max(1, (w if horizontal else h) // 240)
        dark = light = n = 0
        lo, hi = 255, 0
        rng = range(0, w if horizontal else h, step)
        for i in rng:
            v = px[i, fixed] if horizontal else px[fixed, i]
            dark += v < 42
            light += v > 232
            lo, hi = min(lo, v), max(hi, v)
            n += 1
        return (dark / n > 0.86 and hi - lo < 150) or (light / n > 0.94 and hi - lo < 40)

    top, bottom, left, right = 0, h - 1, 0, w - 1
    max_y, max_x = int(h * 0.25), int(w * 0.25)
    while top < max_y and band_is_flat(top, True):
        top += 1
    while bottom > h - 1 - max_y and band_is_flat(bottom, True):
        bottom -= 1
    while left < max_x and band_is_flat(left, False):
        left += 1
    while right > w - 1 - max_x and band_is_flat(right, False):
        right -= 1

    box = (left, top, right + 1, bottom + 1)
    if box[2] - box[0] > w * 0.4 and box[3] - box[1] > h * 0.4 and box != (0, 0, w, h):
        return img.crop(box), (w - (box[2] - box[0]), h - (box[3] - box[1]))
    return img, (0, 0)


def stretch_levels(img, clip=0.4):
    """Pull the darkest and lightest 0.4% to black and white, keeping the hue."""
    before = ImageStat.Stat(img.convert("L")).extrema[0]
    out = ImageOps.autocontrast(img, cutoff=clip, preserve_tone=True)
    after = ImageStat.Stat(out.convert("L")).extrema[0]
    return out, before, after


def prepare(path, out_dir, name=None):
    img = Image.open(path)
    img = ImageOps.exif_transpose(img)          # honour the phone's rotation
    img = img.convert("RGB")
    notes = []

    img, trimmed = trim_flat_border(img)
    if any(trimmed):
        notes.append("trimmed %d×%dpx of flat border" % trimmed)

    if max(img.size) > MAX_EDGE:
        scale = MAX_EDGE / max(img.size)
        img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)

    img, before, after = stretch_levels(img)
    if after != before:
        notes.append("levels %s→%s" % (before, after))

    img = ImageEnhance.Color(img).enhance(1.08)
    img = img.filter(ImageFilter.UnsharpMask(radius=1.4, percent=60, threshold=3))
    notes.append("colour and sharpness lifted")

    base = name or os.path.splitext(os.path.basename(path))[0]
    base = "".join(c if c.isalnum() else "-" for c in base.lower()).strip("-")
    while "--" in base:
        base = base.replace("--", "-")
    os.makedirs(out_dir, exist_ok=True)
    dest = os.path.join(out_dir, base + ".jpg")
    img.save(dest, "JPEG", quality=QUALITY, optimize=True, progressive=True)

    print("%-28s → %s  (%d×%d, %d KB)\n    %s"
          % (os.path.basename(path), os.path.relpath(dest), img.width, img.height,
             os.path.getsize(dest) // 1024, "; ".join(notes)))
    return dest


def main():
    ap = argparse.ArgumentParser(description="Prepare painting photographs for the website.")
    ap.add_argument("source", help="an image file, or a folder of them")
    ap.add_argument("--products", action="store_true", help="save into images/products/ instead of images/works/")
    ap.add_argument("--name", help="file name to use (single file only), e.g. two-cranes-at-sunrise")
    args = ap.parse_args()

    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
    out_dir = os.path.join(root, "site", "images", "products" if args.products else "works")

    if os.path.isdir(args.source):
        files = sorted(os.path.join(args.source, f) for f in os.listdir(args.source)
                       if os.path.splitext(f)[1].lower() in EXTS)
        if not files:
            sys.exit("No images found in " + args.source)
        for f in files:
            prepare(f, out_dir)
        print("\n%d photographs prepared. Point each artwork entry at its file in admin.html." % len(files))
    else:
        prepare(args.source, out_dir, args.name)


if __name__ == "__main__":
    main()
