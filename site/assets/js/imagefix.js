/* =============================================================================
   imagefix.js — prepares a photograph of a painting for the web.

   Runs entirely in the browser, on the artist's own machine, when a photograph
   is dropped into the Studio Panel. In order:

     1. trims flat black or white borders  (phone screenshots, video frames,
        scans and photographs of a picture on a wall all arrive with them)
     2. resizes down in two steps, which keeps far more detail than one jump
     3. stretches the levels so the darkest and lightest parts of the painting
        reach true black and white — this is what makes a dull photograph of a
        bright canvas suddenly look like the canvas
     4. lifts saturation a little, because photographs of paint always lose some
     5. sharpens with an unsharp mask, gently, after the resize
     6. saves as a high quality JPEG

   None of this invents detail that the photograph does not contain. A blurred
   or low-resolution photograph comes out cleaner, not sharper in truth: the
   only real fix for that is to photograph the painting again in daylight.
   ========================================================================== */
(function () {
  "use strict";

  var DEFAULTS = { enhance: true, maxEdge: 2000, quality: 0.9 };

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("That file could not be read as an image.")); };
      img.src = url;
    });
  }

  function canvasOf(w, h) {
    var c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  }

  /* --- 1. trim flat borders ------------------------------------------------ *
   * A row or column counts as border when almost every pixel in it is very
   * dark or very light AND it is close to flat. Only the outer quarter of the
   * image is ever considered, so a genuinely dark painting is never cropped
   * into.                                                                     */
  function findEdges(ctx, w, h) {
    var data = ctx.getImageData(0, 0, w, h).data;
    var lum = function (i) { return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; };

    function rowIsBorder(y) {
      var dark = 0, light = 0, min = 255, max = 0, step = Math.max(1, Math.floor(w / 240));
      var n = 0;
      for (var x = 0; x < w; x += step) {
        var l = lum((y * w + x) * 4);
        if (l < 42) dark++;
        if (l > 232) light++;
        if (l < min) min = l;
        if (l > max) max = l;
        n++;
      }
      return (dark / n > 0.86 && max - min < 150) || (light / n > 0.94 && max - min < 40);
    }
    function colIsBorder(x) {
      var dark = 0, light = 0, min = 255, max = 0, step = Math.max(1, Math.floor(h / 240));
      var n = 0;
      for (var y = 0; y < h; y += step) {
        var l = lum((y * w + x) * 4);
        if (l < 42) dark++;
        if (l > 232) light++;
        if (l < min) min = l;
        if (l > max) max = l;
        n++;
      }
      return (dark / n > 0.86 && max - min < 150) || (light / n > 0.94 && max - min < 40);
    }

    var top = 0, bottom = h - 1, left = 0, right = w - 1;
    var maxY = Math.floor(h * 0.25), maxX = Math.floor(w * 0.25);
    while (top < maxY && rowIsBorder(top)) top++;
    while (bottom > h - 1 - maxY && rowIsBorder(bottom)) bottom--;
    while (left < maxX && colIsBorder(left)) left++;
    while (right > w - 1 - maxX && colIsBorder(right)) right--;
    return { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
  }

  /* --- 3. levels ----------------------------------------------------------- *
   * The black and white points come from the luminance histogram and are then
   * applied to all three channels equally, so contrast improves without the
   * colours shifting.                                                         */
  function stretchLevels(px) {
    var hist = new Uint32Array(256), i, l;
    for (i = 0; i < px.length; i += 4) {
      l = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) | 0;
      hist[l]++;
    }
    var total = px.length / 4, clip = total * 0.004, sum = 0, lo = 0, hi = 255;
    for (i = 0; i < 256; i++) { sum += hist[i]; if (sum > clip) { lo = i; break; } }
    sum = 0;
    for (i = 255; i >= 0; i--) { sum += hist[i]; if (sum > clip) { hi = i; break; } }
    if (hi - lo < 24) return false;                      // already using the full range
    var lut = new Uint8ClampedArray(256), scale = 255 / (hi - lo);
    for (i = 0; i < 256; i++) lut[i] = Math.max(0, Math.min(255, (i - lo) * scale));
    for (i = 0; i < px.length; i += 4) {
      px[i] = lut[px[i]]; px[i + 1] = lut[px[i + 1]]; px[i + 2] = lut[px[i + 2]];
    }
    return true;
  }

  /* --- 4. saturation ------------------------------------------------------- */
  function saturate(px, amount) {
    for (var i = 0; i < px.length; i += 4) {
      var g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      px[i]     = Math.max(0, Math.min(255, g + (px[i] - g) * amount));
      px[i + 1] = Math.max(0, Math.min(255, g + (px[i + 1] - g) * amount));
      px[i + 2] = Math.max(0, Math.min(255, g + (px[i + 2] - g) * amount));
    }
  }

  /* --- 5. unsharp mask ----------------------------------------------------- */
  function unsharp(px, w, h, amount) {
    var src = new Uint8ClampedArray(px);
    var idx, k, o, c, sum;
    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        idx = (y * w + x) * 4;
        for (c = 0; c < 3; c++) {
          o = idx + c;
          sum = 0;
          for (k = -1; k <= 1; k++) {
            sum += src[o + (k * w - 1) * 4] + src[o + k * w * 4] + src[o + (k * w + 1) * 4];
          }
          var blur = sum / 9;
          px[o] = Math.max(0, Math.min(255, src[o] + (src[o] - blur) * amount));
        }
      }
    }
  }

  /* --- 2. two-step downscale ----------------------------------------------- */
  function drawScaled(source, sx, sy, sw, sh, tw, th) {
    var canvas = source, cw = sw, ch = sh, first = true;
    while (cw / 2 > tw && ch / 2 > th) {                  // halve until one step is left
      var half = canvasOf(cw / 2, ch / 2);
      var hctx = half.getContext("2d");
      hctx.imageSmoothingEnabled = true;
      hctx.imageSmoothingQuality = "high";
      if (first) { hctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, half.width, half.height); first = false; }
      else hctx.drawImage(canvas, 0, 0, half.width, half.height);
      canvas = half; cw = half.width; ch = half.height;
    }
    var out = canvasOf(tw, th);
    var octx = out.getContext("2d");
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = "high";
    if (first) octx.drawImage(canvas, sx, sy, sw, sh, 0, 0, tw, th);
    else octx.drawImage(canvas, 0, 0, tw, th);
    return out;
  }

  function toBlob(canvas, quality) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (b) { resolve(b); }, "image/jpeg", quality);
    });
  }

  function prepare(file, options) {
    var opt = Object.assign({}, DEFAULTS, options || {});
    return loadImage(file).then(function (img) {
      var full = canvasOf(img.naturalWidth, img.naturalHeight);
      full.getContext("2d").drawImage(img, 0, 0);

      var notes = [];
      var crop = { x: 0, y: 0, w: full.width, h: full.height };
      if (opt.enhance) {
        var found = findEdges(full.getContext("2d"), full.width, full.height);
        if (found.w > full.width * 0.4 && found.h > full.height * 0.4 &&
            (found.w < full.width - 4 || found.h < full.height - 4)) {
          crop = found;
          notes.push("trimmed " + (full.width - crop.w) + "×" + (full.height - crop.h) + "px of flat border");
        }
      }

      var scale = Math.min(1, opt.maxEdge / Math.max(crop.w, crop.h));
      var tw = Math.round(crop.w * scale), th = Math.round(crop.h * scale);
      var out = drawScaled(full, crop.x, crop.y, crop.w, crop.h, tw, th);
      var octx = out.getContext("2d");

      /* the untouched version, for the before/after comparison */
      var plain = drawScaled(full, 0, 0, full.width, full.height, Math.round(full.width * Math.min(1, opt.maxEdge / Math.max(full.width, full.height))), Math.round(full.height * Math.min(1, opt.maxEdge / Math.max(full.width, full.height))));
      var originalUrl = plain.toDataURL("image/jpeg", 0.85);

      if (opt.enhance) {
        var image = octx.getImageData(0, 0, out.width, out.height);
        if (stretchLevels(image.data)) notes.push("levels stretched");
        saturate(image.data, 1.08);
        unsharp(image.data, out.width, out.height, 0.42);
        octx.putImageData(image, 0, 0);
        notes.push("colour and sharpness lifted");
      }

      return toBlob(out, opt.quality).then(function (blob) {
        return {
          blob: blob,
          dataUrl: out.toDataURL("image/jpeg", opt.quality),
          originalUrl: originalUrl,
          width: out.width, height: out.height,
          ratio: out.width / out.height,
          enhanced: !!opt.enhance,
          notes: notes
        };
      });
    });
  }

  window.StudioImage = { prepare: prepare };
})();
