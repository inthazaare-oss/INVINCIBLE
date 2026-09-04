/* =============================================================================
   admin.js — the Studio Panel.
   Lets the artist add, edit, reorder and remove works without touching code.

   It works in two modes, detected automatically:
     • FILE MODE (default, no server): edits are kept in this browser and are
       saved out as a replacement data/artworks.js file you upload to your host.
     • SERVER MODE (the optional Node server in /server is running): images are
       uploaded and the gallery is published live with one click.
   ========================================================================== */
(function () {
  "use strict";
  var S = window.Studio;
  var root = document.getElementById("admin");
  if (!root) return;

  var DRAFT_KEY = "studio.artworks.draft.v1";
  var MAX_EDGE = 2000;          // longest side of a stored image, in pixels
  var JPEG_QUALITY = 0.9;

  var state = {
    works: [],
    selected: null,
    server: false,
    dirty: false,
    pendingImage: null          // { dataUrl, blob, filename }
  };

  /* ---------------------------------------------------------------- load -- */
  function load() {
    var draft = null;
    try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) { draft = null; }
    state.works = (draft && draft.works) ? draft.works : S.works();
    if (draft) {
      state.dirty = true;
      flag("A local draft from " + new Date(draft.saved).toLocaleString() +
           " was restored. " + (state.server ? "Press Publish live" : "Export the gallery file") +
           " to make it public, or Discard draft to go back to what is published.", "is-info");
    } else {
      flag(state.server
        ? "Connected to the studio server: images upload themselves and Publish live puts changes on the site straight away."
        : "Working in file mode: changes are kept in this browser until you press <strong>Export gallery file</strong> and upload it to your host.",
        "is-info");
    }
    renderList();
    if (state.works.length) select(state.works[0].id);
  }
  function saveDraft() {
    state.dirty = true;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ saved: Date.now(), works: state.works }));
    } catch (e) {
      flag("This browser could not store the draft (" + e.message + "). Export the file now so nothing is lost.", "is-err");
    }
    updateBar();
  }

  /* --------------------------------------------------------- server check -- */
  function detectServer() {
    return fetch("/api/health", { method: "GET" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { state.server = !!(j && j.ok); })
      .catch(function () { state.server = false; })
      .then(updateBar);
  }

  /* ------------------------------------------------------------- helpers -- */
  function slug(s) {
    return String(s || "").toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "untitled";
  }
  function uniqueId(base, ignoreId) {
    var id = base, n = 2;
    while (state.works.some(function (w) { return w.id === id && w.id !== ignoreId; })) { id = base + "-" + n++; }
    return id;
  }
  function flag(msg, cls) { flagIn("admin-status", msg, cls); }
  function flagIn(id, msg, cls) {
    var el = document.getElementById(id);
    if (!el) return;
    el.className = "form-status " + (cls || "is-info");
    el.innerHTML = msg;
  }
  function blank() {
    return {
      id: "", title: "", year: new Date().getFullYear(), themes: [], style: "Impressionist",
      medium: "Oil on canvas", w_cm: 60, h_cm: 45, price: null, status: "available",
      prints: false, framed: false, place: "", story: "", image: "", featured: false
    };
  }

  /* ---------------------------------------------------------------- list -- */
  function renderList() {
    var q = (document.getElementById("admin-search").value || "").toLowerCase();
    var list = state.works.filter(function (w) {
      return !q || (w.title + " " + w.medium + " " + (w.place || "")).toLowerCase().indexOf(q) > -1;
    });
    document.getElementById("admin-list").innerHTML = list.map(function (w) {
      return "<li><button type='button' data-id='" + S.esc(w.id) + "'" +
        (state.selected === w.id ? " class='is-active'" : "") + ">" +
        "<img src='" + S.esc(w.image || "images/ui/artist.svg") + "' alt=''>" +
        "<span><span class='t'>" + S.esc(w.title || "(untitled)") + "</span><br>" +
        "<span class='s'>" + S.esc(w.year || "") + " · " + S.esc(S.statusOf(w).label) +
        (w.featured ? " · featured" : "") + "</span></span></button></li>";
    }).join("") || "<li><span class='s' style='display:block;padding:1rem'>No works yet.</span></li>";
    document.getElementById("admin-count").textContent =
      state.works.length + (state.works.length === 1 ? " work" : " works");
  }

  /* ---------------------------------------------------------------- form -- */
  function select(id) {
    state.selected = id;
    state.pendingImage = null;
    var w = state.works.filter(function (x) { return x.id === id; })[0];
    if (!w) return;
    var f = document.getElementById("work-form");
    f.hidden = false;
    document.getElementById("empty-note").hidden = true;
    f.title_.value = w.title || "";
    f.year.value = w.year || "";
    f.medium.value = w.medium || "";
    f.style_.value = w.style || "";
    f.w_cm.value = w.w_cm || "";
    f.h_cm.value = w.h_cm || "";
    f.price.value = (w.price == null ? "" : w.price);
    f.status.value = w.status || "available";
    f.place.value = w.place || "";
    f.story.value = w.story || "";
    f.image.value = w.image || "";
    f.prints.checked = !!w.prints;
    f.framed.checked = !!w.framed;
    f.featured.checked = !!w.featured;
    document.getElementById("theme-boxes").querySelectorAll("input").forEach(function (cb) {
      cb.checked = (w.themes || []).indexOf(cb.value) > -1;
    });
    showPreview(w.image);
    renderList();
  }

  function readForm() {
    var f = document.getElementById("work-form");
    var themes = [];
    document.getElementById("theme-boxes").querySelectorAll("input:checked")
      .forEach(function (cb) { themes.push(cb.value); });
    return {
      title: f.title_.value.trim(),
      year: Number(f.year.value) || new Date().getFullYear(),
      medium: f.medium.value.trim(),
      style: f.style_.value.trim(),
      w_cm: Number(f.w_cm.value) || null,
      h_cm: Number(f.h_cm.value) || null,
      price: f.price.value === "" ? null : Number(f.price.value),
      status: f.status.value,
      place: f.place.value.trim(),
      story: f.story.value.trim(),
      image: f.image.value.trim(),
      prints: f.prints.checked,
      framed: f.framed.checked,
      featured: f.featured.checked,
      themes: themes
    };
  }

  function applyForm() {
    var i = state.works.map(function (w) { return w.id; }).indexOf(state.selected);
    if (i < 0) return null;
    var next = Object.assign({}, state.works[i], readForm());
    if (!next.title) { flag("Give the work a title before saving.", "is-err"); return null; }
    /* A brand new entry takes its id from its title the first time it is saved.
       An existing entry keeps its id, so links and image paths never break. */
    if (next._new) {
      next.id = uniqueId(slug(next.title), state.works[i].id);
      delete next._new;
    }
    state.works[i] = next;
    state.selected = next.id;
    saveDraft();
    renderList();
    return next;
  }

  /* --------------------------------------------------------------- image -- */
  function showPreview(src) {
    var dz = document.getElementById("dropzone");
    dz.innerHTML = src
      ? "<img src='" + S.esc(src) + "' alt='Preview'><span class='s'>Click, or drop a new photograph, to replace</span>"
      : "<strong>Drop a photograph of the painting here</strong><br><span class='s'>or click to choose a file — JPG or PNG</span>";
  }

  function enhanceOn() {
    var box = document.getElementById("enhance-toggle");
    return !box || box.checked;
  }

  /* Photographs are trimmed, resized, levelled, saturated and sharpened by
     assets/js/imagefix.js before they ever reach the site. */
  function resize(file) {
    return window.StudioImage.prepare(file, { enhance: enhanceOn(), maxEdge: MAX_EDGE, quality: JPEG_QUALITY });
  }

  /* the preview keeps the untouched version so the artist can judge the change */
  function previewWithCompare(dzId, out) {
    var dz = document.getElementById(dzId);
    dz.innerHTML = "<img src='" + S.esc(out.dataUrl) + "' alt='Preview' data-after='" + S.esc(out.dataUrl) +
      "' data-before='" + S.esc(out.originalUrl) + "'>" +
      "<span class='s'>" + (out.enhanced
        ? "Improved: " + S.esc(out.notes.join(", ") || "no change needed") +
          " — <button type='button' class='chip' data-compare>hold to see the original</button>"
        : "Saved as photographed.") +
      "</span>";
    var btn = dz.querySelector("[data-compare]");
    if (!btn) return;
    var img = dz.querySelector("img");
    var show = function (which) { img.src = img.getAttribute("data-" + which); };
    ["mousedown", "touchstart"].forEach(function (ev) {
      btn.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); show("before"); });
    });
    ["mouseup", "mouseleave", "touchend"].forEach(function (ev) {
      btn.addEventListener(ev, function (e) { e.stopPropagation(); show("after"); });
    });
    btn.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); });
  }

  function handleFile(file) {
    if (!file || !/^image\//.test(file.type)) { flag("Please choose a JPG or PNG image.", "is-err"); return; }
    flag("Preparing the image…", "is-info");
    resize(file).then(function (out) {
      var f = document.getElementById("work-form");
      var base = slug(f.title_.value || file.name.replace(/\.[^.]+$/, ""));
      state.pendingImage = { dataUrl: out.dataUrl, blob: out.blob, filename: base + ".jpg" };
      previewWithCompare("dropzone", out);

      /* suggest the dimensions ratio if the artist has not filled them in */
      if (!f.w_cm.value && !f.h_cm.value) {
        f.w_cm.value = out.ratio >= 1 ? 60 : Math.round(60 * out.ratio);
        f.h_cm.value = out.ratio >= 1 ? Math.round(60 / out.ratio) : 60;
      }

      if (state.server) {
        var fd = new FormData();
        fd.append("file", out.blob, state.pendingImage.filename);
        return fetch("/api/upload", { method: "POST", body: fd })
          .then(function (r) { return r.json(); })
          .then(function (j) {
            if (!j.ok) throw new Error(j.error || "upload failed");
            f.image.value = j.path;
            flag("Uploaded as <code>" + S.esc(j.path) + "</code> (" + out.width + "×" + out.height + "px" +
                 (out.notes.length ? "; " + S.esc(out.notes.join(", ")) : "") + ").", "is-ok");
          });
      }
      f.image.value = "images/works/" + state.pendingImage.filename;
      flag("Image ready (" + out.width + "×" + out.height + "px, " +
           Math.round(out.blob.size / 1024) + " KB" +
           (out.notes.length ? "; " + S.esc(out.notes.join(", ")) : "") +
           "). Use <strong>Download image file</strong> below, " +
           "then put the file into your site's <code>images/works/</code> folder — or press " +
           "<strong>Embed image in file</strong> to carry it inside the gallery file instead.", "is-info");
    }).catch(function (e) { flag(e.message, "is-err"); });
  }

  /* -------------------------------------------------------------- export -- */
  function fileText() {
    var header =
      "/* =============================================================================\n" +
      "   artworks.js — the gallery, written by the Studio Panel on " +
      new Date().toLocaleString() + ".\n" +
      "   Upload this file to your website as data/artworks.js to publish these changes.\n" +
      "   ========================================================================== */\n\n";
    return header + "window.ARTWORKS = " + JSON.stringify(state.works, null, 2) + ";\n";
  }
  function download(name, blob) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  function publish() {
    if (!state.server) { flag("The studio server is not running, so there is nothing to publish to. Use “Export gallery file” instead.", "is-err"); return; }
    fetch("/api/artworks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ works: state.works })
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.ok) throw new Error(j.error || "save failed");
      state.dirty = false;
      localStorage.removeItem(DRAFT_KEY);
      updateBar();
      flag("Published. The live gallery now shows " + state.works.length + " works.", "is-ok");
    }).catch(function (e) { flag("Could not publish: " + e.message, "is-err"); });
  }

  function updateBar() {
    document.getElementById("mode-badge").textContent = state.server ? "Server mode — live publishing" : "File mode — export to publish";
    document.getElementById("mode-badge").className = "badge" + (state.server ? " badge--live" : "");
    document.getElementById("dirty-badge").hidden = !(state.dirty || pstate.dirty);
    document.getElementById("btn-publish").hidden = !state.server;
    document.getElementById("p-btn-publish").hidden = !state.server;
  }

  /* ------------------------------------------------------------ enquiries -- */
  function loadEnquiries() {
    var box = document.getElementById("enquiries");
    if (!state.server) {
      box.innerHTML = "<p class='small muted'>Enquiries are emailed straight to you, so there is nothing to " +
        "show here in file mode. Run the optional studio server if you would like a copy of every enquiry " +
        "kept and listed on this page.</p>";
      return;
    }
    fetch("/api/enquiries").then(function (r) { return r.json(); }).then(function (j) {
      var rows = (j.enquiries || []).slice().reverse();
      box.innerHTML = rows.length
        ? "<div class='table-scroll'><table class='table'><thead><tr><th>When</th><th>From</th><th>Subject</th><th>Details</th></tr></thead><tbody>" +
          rows.map(function (e) {
            return "<tr><td>" + S.esc(new Date(e.received).toLocaleString()) + "</td>" +
              "<td>" + S.esc(e.data.name || "") + "<br><span class='s'>" + S.esc(e.data.email || "") + "</span></td>" +
              "<td>" + S.esc(e.data._subject || e.data.subject || "") + "</td>" +
              "<td><details><summary>Open</summary><pre class='code'>" +
              S.esc(JSON.stringify(e.data, null, 2)) + "</pre></details></td></tr>";
          }).join("") + "</tbody></table></div>"
        : "<p class='small muted'>No enquiries recorded yet.</p>";
    }).catch(function (e) { box.innerHTML = "<p class='small muted'>Could not load enquiries: " + S.esc(e.message) + "</p>"; });
  }

  /* --------------------------------------------------------------- wiring -- */
  document.getElementById("theme-boxes").innerHTML = (S.site.themes || []).map(function (t) {
    return "<label class='choice'><input type='checkbox' value='" + S.esc(t.id) + "'><span>" + S.esc(t.name) + "</span></label>";
  }).join("");

  document.getElementById("admin-list").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-id]");
    if (b) select(b.getAttribute("data-id"));
  });
  document.getElementById("admin-search").addEventListener("input", renderList);

  document.getElementById("btn-new").addEventListener("click", function () {
    var w = blank();
    w.id = uniqueId("untitled");
    w.title = "";
    w._new = true;
    state.works.unshift(w);
    saveDraft(); renderList(); select(w.id);
    document.getElementById("work-form").title_.focus();
    flag("New entry started. Give it a title, drop in a photograph, then press Save.", "is-info");
  });

  document.getElementById("work-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var w = applyForm();
    if (w) flag("Saved to this browser. " + (state.server ? "Press Publish to make it live." :
      "Press “Export gallery file” when you are ready to put the changes on your website."), "is-ok");
  });

  document.getElementById("btn-delete").addEventListener("click", function () {
    var w = state.works.filter(function (x) { return x.id === state.selected; })[0];
    if (!w) return;
    if (!confirm("Remove “" + (w.title || "this work") + "” from the gallery? The image file itself is not deleted.")) return;
    state.works = state.works.filter(function (x) { return x.id !== state.selected; });
    saveDraft(); renderList();
    document.getElementById("work-form").hidden = true;
    document.getElementById("empty-note").hidden = false;
    flag("Removed.", "is-info");
  });

  document.getElementById("btn-duplicate").addEventListener("click", function () {
    var w = state.works.filter(function (x) { return x.id === state.selected; })[0];
    if (!w) return;
    var copy = Object.assign({}, w, { id: uniqueId(w.id + "-copy"), title: w.title + " (copy)" });
    state.works.unshift(copy);
    saveDraft(); renderList(); select(copy.id);
  });

  document.getElementById("btn-up").addEventListener("click", function () { move(-1); });
  document.getElementById("btn-down").addEventListener("click", function () { move(1); });
  function move(dir) {
    var i = state.works.map(function (w) { return w.id; }).indexOf(state.selected);
    var j = i + dir;
    if (i < 0 || j < 0 || j >= state.works.length) return;
    var tmp = state.works[i]; state.works[i] = state.works[j]; state.works[j] = tmp;
    saveDraft(); renderList();
  }

  var dz = document.getElementById("dropzone");
  var picker = document.getElementById("file-input");
  dz.addEventListener("click", function () { picker.click(); });
  picker.addEventListener("change", function () { handleFile(picker.files[0]); });
  ["dragenter", "dragover"].forEach(function (ev) {
    dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("is-over"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("is-over"); });
  });
  dz.addEventListener("drop", function (e) { handleFile(e.dataTransfer.files[0]); });

  document.getElementById("btn-download-image").addEventListener("click", function () {
    if (!state.pendingImage) { flag("Drop a photograph in first.", "is-err"); return; }
    download(state.pendingImage.filename, state.pendingImage.blob);
    flag("Image downloaded as <code>" + S.esc(state.pendingImage.filename) + "</code>. Put it in your site's " +
         "<code>images/works/</code> folder, keeping the name exactly as it is.", "is-ok");
  });

  document.getElementById("btn-embed-image").addEventListener("click", function () {
    if (!state.pendingImage) { flag("Drop a photograph in first.", "is-err"); return; }
    document.getElementById("work-form").image.value = state.pendingImage.dataUrl;
    flag("Image embedded in the entry. This needs no file uploading at all, but it makes the gallery " +
         "file larger — fine for a handful of works, slower once you have dozens.", "is-info");
  });

  document.getElementById("btn-export").addEventListener("click", function () {
    applyForm();
    download("artworks.js", new Blob([fileText()], { type: "text/javascript" }));
    flag("Downloaded <code>artworks.js</code>. Upload it to your website, replacing the old " +
         "<code>data/artworks.js</code>, and the gallery is updated.", "is-ok");
  });

  document.getElementById("btn-copy").addEventListener("click", function () {
    applyForm();
    navigator.clipboard.writeText(fileText())
      .then(function () { S.toast("Gallery file copied to the clipboard"); })
      .catch(function () { flag("This browser would not copy automatically — use Export instead.", "is-err"); });
  });

  document.getElementById("btn-import").addEventListener("click", function () {
    document.getElementById("import-input").click();
  });
  document.getElementById("import-input").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    file.text().then(function (text) {
      var m = text.match(/window\.ARTWORKS\s*=\s*([\s\S]*?);\s*$/);
      var json = m ? m[1] : text;
      var parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) throw new Error("that file does not contain a list of works");
      state.works = parsed;
      saveDraft(); renderList();
      if (state.works.length) select(state.works[0].id);
      flag("Imported " + parsed.length + " works from " + S.esc(file.name) + ".", "is-ok");
    }).catch(function (err) { flag("Could not read that file: " + S.esc(err.message), "is-err"); });
  });

  document.getElementById("btn-publish").addEventListener("click", function () { applyForm(); publish(); });

  document.getElementById("btn-discard").addEventListener("click", function () {
    if (!confirm("Throw away the local draft and go back to the published gallery?")) return;
    localStorage.removeItem(DRAFT_KEY);
    state.dirty = false;
    state.works = S.works();
    renderList();
    if (state.works.length) select(state.works[0].id);
    flag("Draft discarded.", "is-info");
  });

  window.addEventListener("beforeunload", function (e) {
    if (!state.dirty && !pstate.dirty) return;
    e.preventDefault(); e.returnValue = "";
  });


  /* ===========================================================================
     MATERIALS — the studio shop. Same shape as the paintings above: a list, a
     form, a draft kept in this browser, and either an export or a live publish.
     ======================================================================== */
  var P_DRAFT_KEY = "studio.products.draft.v1";
  var pstate = { items: [], selected: null, dirty: false, pendingImage: null };

  function pFlag(msg, cls) { flagIn("p-status", msg, cls); }
  function pSaveDraft() {
    pstate.dirty = true;
    try { localStorage.setItem(P_DRAFT_KEY, JSON.stringify({ saved: Date.now(), items: pstate.items })); }
    catch (e) { pFlag("This browser could not store the draft (" + e.message + "). Export the shop file now.", "is-err"); }
    updateBar();
  }
  function pUniqueId(base, ignoreId) {
    var id = base, n = 2;
    while (pstate.items.some(function (x) { return x.id === id && x.id !== ignoreId; })) { id = base + "-" + n++; }
    return id;
  }
  function pBlank() {
    return {
      id: "", name: "", category: (S.site.shop && S.site.shop.categories && S.site.shop.categories[0] || {}).id || "pigments",
      unit: "", price: null, status: "instock", lead: "", batch: "",
      madeFrom: "", notes: "", image: "", featured: false, _new: true
    };
  }
  var P_STATUS = { instock: "In stock", madetoorder: "Made to order", soldout: "Sold out" };

  function pRenderList() {
    var q = (document.getElementById("p-search").value || "").toLowerCase();
    var list = pstate.items.filter(function (x) {
      return !q || ((x.name || "") + " " + (x.madeFrom || "") + " " + (x.unit || "")).toLowerCase().indexOf(q) > -1;
    });
    document.getElementById("p-list").innerHTML = list.map(function (x) {
      return "<li><button type='button' data-pid='" + S.esc(x.id) + "'" +
        (pstate.selected === x.id ? " class='is-active'" : "") + ">" +
        "<img src='" + S.esc(x.image || "images/ui/artist.svg") + "' alt=''>" +
        "<span><span class='t'>" + S.esc(x.name || "(unnamed)") + "</span><br>" +
        "<span class='s'>" + S.esc(x.unit || "") + " · " + S.esc(P_STATUS[x.status] || "") +
        (x.featured ? " · featured" : "") + "</span></span></button></li>";
    }).join("") || "<li><span class='s' style='display:block;padding:1rem'>No materials yet.</span></li>";
    document.getElementById("p-count").textContent =
      pstate.items.length + (pstate.items.length === 1 ? " material" : " materials");
  }

  function pShowPreview(src) {
    var dz = document.getElementById("p-dropzone");
    dz.innerHTML = src
      ? "<img src='" + S.esc(src) + "' alt='Preview'><span class='s'>Click, or drop a new photograph, to replace</span>"
      : "<strong>Drop a photograph of the material here</strong><br><span class='s'>or click to choose a file — JPG or PNG</span>";
  }

  function pSelect(id) {
    pstate.selected = id;
    pstate.pendingImage = null;
    var x = pstate.items.filter(function (i) { return i.id === id; })[0];
    if (!x) return;
    var f = document.getElementById("product-form");
    f.hidden = false;
    document.getElementById("p-empty-note").hidden = true;
    f.name_.value = x.name || "";
    f.category.value = x.category || "";
    f.unit.value = x.unit || "";
    f.madeFrom.value = x.madeFrom || "";
    f.notes.value = x.notes || "";
    f.batch.value = x.batch || "";
    f.price.value = (x.price == null ? "" : x.price);
    f.status.value = x.status || "instock";
    f.lead.value = x.lead || "";
    f.image.value = x.image || "";
    f.featured.checked = !!x.featured;
    pShowPreview(x.image);
    pRenderList();
  }

  function pApplyForm() {
    var i = pstate.items.map(function (x) { return x.id; }).indexOf(pstate.selected);
    if (i < 0) return null;
    var f = document.getElementById("product-form");
    var next = Object.assign({}, pstate.items[i], {
      name: f.name_.value.trim(),
      category: f.category.value,
      unit: f.unit.value.trim(),
      madeFrom: f.madeFrom.value.trim(),
      notes: f.notes.value.trim(),
      batch: f.batch.value.trim(),
      price: f.price.value === "" ? null : Number(f.price.value),
      status: f.status.value,
      lead: f.lead.value.trim(),
      image: f.image.value.trim(),
      featured: f.featured.checked
    });
    if (!next.name) { pFlag("Give the material a name before saving.", "is-err"); return null; }
    if (next._new) { next.id = pUniqueId(slug(next.name), pstate.items[i].id); delete next._new; }
    pstate.items[i] = next;
    pstate.selected = next.id;
    pSaveDraft();
    pRenderList();
    return next;
  }

  function pHandleFile(file) {
    if (!file || !/^image\//.test(file.type)) { pFlag("Please choose a JPG or PNG image.", "is-err"); return; }
    pFlag("Preparing the image…", "is-info");
    resize(file).then(function (out) {
      var f = document.getElementById("product-form");
      var base = slug(f.name_.value || file.name.replace(/\.[^.]+$/, ""));
      pstate.pendingImage = { dataUrl: out.dataUrl, blob: out.blob, filename: base + ".jpg" };
      previewWithCompare("p-dropzone", out);
      if (state.server) {
        var fd = new FormData();
        fd.append("file", out.blob, pstate.pendingImage.filename);
        fd.append("folder", "products");
        return fetch("/api/upload?folder=products", { method: "POST", body: fd })
          .then(function (r) { return r.json(); })
          .then(function (j) {
            if (!j.ok) throw new Error(j.error || "upload failed");
            f.image.value = j.path;
            pFlag("Uploaded as <code>" + S.esc(j.path) + "</code> (" + out.width + "×" + out.height + "px" +
                  (out.notes.length ? "; " + S.esc(out.notes.join(", ")) : "") + ").", "is-ok");
          });
      }
      f.image.value = "images/products/" + pstate.pendingImage.filename;
      pFlag("Image ready (" + out.width + "×" + out.height + "px, " + Math.round(out.blob.size / 1024) +
            " KB" + (out.notes.length ? "; " + S.esc(out.notes.join(", ")) : "") +
            "). Use <strong>Download image file</strong>, then put it in your site's " +
            "<code>images/products/</code> folder — or <strong>Embed image in file</strong>.", "is-info");
    }).catch(function (e) { pFlag(e.message, "is-err"); });
  }

  function pFileText() {
    return "/* =============================================================================\n" +
      "   products.js — the studio shop, written by the Studio Panel on " +
      new Date().toLocaleString() + ".\n" +
      "   Upload this file to your website as data/products.js to publish these changes.\n" +
      "   ========================================================================== */\n\n" +
      "window.PRODUCTS = " + JSON.stringify(pstate.items, null, 2) + ";\n";
  }

  function pPublish() {
    if (!state.server) { pFlag("The studio server is not running. Use “Export shop file” instead.", "is-err"); return; }
    fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: pstate.items })
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.ok) throw new Error(j.error || "save failed");
      pstate.dirty = false;
      localStorage.removeItem(P_DRAFT_KEY);
      updateBar();
      pFlag("Published. The shop now lists " + pstate.items.length + " materials.", "is-ok");
    }).catch(function (e) { pFlag("Could not publish: " + e.message, "is-err"); });
  }

  function pLoad() {
    var draft = null;
    try { draft = JSON.parse(localStorage.getItem(P_DRAFT_KEY) || "null"); } catch (e) { draft = null; }
    pstate.items = (draft && draft.items) ? draft.items : (window.PRODUCTS || []).slice();
    if (draft) {
      pstate.dirty = true;
      pFlag("A local draft from " + new Date(draft.saved).toLocaleString() + " was restored. " +
            (state.server ? "Press Publish live" : "Export the shop file") + " to make it public.", "is-info");
    } else {
      pFlag(state.server
        ? "Connected to the studio server: images upload themselves and Publish live updates the shop straight away."
        : "Working in file mode: changes stay in this browser until you press <strong>Export shop file</strong>.",
        "is-info");
    }
    /* categories come from site.js so the shop pages and this form never disagree */
    document.getElementById("p-category").innerHTML =
      ((S.site.shop && S.site.shop.categories) || []).map(function (c) {
        return "<option value='" + S.esc(c.id) + "'>" + S.esc(c.name) + "</option>";
      }).join("");
    pRenderList();
    if (pstate.items.length) pSelect(pstate.items[0].id);
  }

  /* --- materials wiring --- */
  document.getElementById("p-list").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-pid]");
    if (b) pSelect(b.getAttribute("data-pid"));
  });
  document.getElementById("p-search").addEventListener("input", pRenderList);
  document.getElementById("p-btn-new").addEventListener("click", function () {
    var x = pBlank();
    x.id = pUniqueId("new-material");
    pstate.items.unshift(x);
    pSaveDraft(); pRenderList(); pSelect(x.id);
    document.getElementById("product-form").name_.focus();
    pFlag("New material started. Name it, drop in a photograph, then press Save.", "is-info");
  });
  document.getElementById("product-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var x = pApplyForm();
    if (x) pFlag("Saved to this browser. " + (state.server ? "Press Publish live to make it public."
      : "Press “Export shop file” when you are ready to update your website."), "is-ok");
  });
  document.getElementById("p-btn-delete").addEventListener("click", function () {
    var x = pstate.items.filter(function (i) { return i.id === pstate.selected; })[0];
    if (!x || !confirm("Remove “" + (x.name || "this material") + "” from the shop?")) return;
    pstate.items = pstate.items.filter(function (i) { return i.id !== pstate.selected; });
    pSaveDraft(); pRenderList();
    document.getElementById("product-form").hidden = true;
    document.getElementById("p-empty-note").hidden = false;
    pFlag("Removed.", "is-info");
  });
  document.getElementById("p-btn-duplicate").addEventListener("click", function () {
    var x = pstate.items.filter(function (i) { return i.id === pstate.selected; })[0];
    if (!x) return;
    var copy = Object.assign({}, x, { id: pUniqueId(x.id + "-copy"), name: x.name + " (copy)" });
    pstate.items.unshift(copy);
    pSaveDraft(); pRenderList(); pSelect(copy.id);
  });
  function pMove(dir) {
    var i = pstate.items.map(function (x) { return x.id; }).indexOf(pstate.selected);
    var j = i + dir;
    if (i < 0 || j < 0 || j >= pstate.items.length) return;
    var t = pstate.items[i]; pstate.items[i] = pstate.items[j]; pstate.items[j] = t;
    pSaveDraft(); pRenderList();
  }
  document.getElementById("p-btn-up").addEventListener("click", function () { pMove(-1); });
  document.getElementById("p-btn-down").addEventListener("click", function () { pMove(1); });

  var pdz = document.getElementById("p-dropzone");
  var ppicker = document.getElementById("p-file-input");
  pdz.addEventListener("click", function () { ppicker.click(); });
  ppicker.addEventListener("change", function () { pHandleFile(ppicker.files[0]); });
  ["dragenter", "dragover"].forEach(function (ev) {
    pdz.addEventListener(ev, function (e) { e.preventDefault(); pdz.classList.add("is-over"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    pdz.addEventListener(ev, function (e) { e.preventDefault(); pdz.classList.remove("is-over"); });
  });
  pdz.addEventListener("drop", function (e) { pHandleFile(e.dataTransfer.files[0]); });

  document.getElementById("p-btn-download-image").addEventListener("click", function () {
    if (!pstate.pendingImage) { pFlag("Drop a photograph in first.", "is-err"); return; }
    download(pstate.pendingImage.filename, pstate.pendingImage.blob);
    pFlag("Downloaded as <code>" + S.esc(pstate.pendingImage.filename) + "</code>. Put it in your site's " +
          "<code>images/products/</code> folder, keeping the name.", "is-ok");
  });
  document.getElementById("p-btn-embed-image").addEventListener("click", function () {
    if (!pstate.pendingImage) { pFlag("Drop a photograph in first.", "is-err"); return; }
    document.getElementById("product-form").image.value = pstate.pendingImage.dataUrl;
    pFlag("Image embedded in the entry — no file to upload, but a larger shop file.", "is-info");
  });
  document.getElementById("p-btn-export").addEventListener("click", function () {
    pApplyForm();
    download("products.js", new Blob([pFileText()], { type: "text/javascript" }));
    pFlag("Downloaded <code>products.js</code>. Upload it to your website, replacing " +
          "<code>data/products.js</code>.", "is-ok");
  });
  document.getElementById("p-btn-publish").addEventListener("click", function () { pApplyForm(); pPublish(); });
  document.getElementById("p-btn-import").addEventListener("click", function () {
    document.getElementById("p-import-input").click();
  });
  document.getElementById("p-import-input").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    file.text().then(function (text) {
      var m = text.match(/window\.PRODUCTS\s*=\s*([\s\S]*?);\s*$/);
      var parsed = JSON.parse(m ? m[1] : text);
      if (!Array.isArray(parsed)) throw new Error("that file does not contain a list of materials");
      pstate.items = parsed;
      pSaveDraft(); pRenderList();
      if (pstate.items.length) pSelect(pstate.items[0].id);
      pFlag("Imported " + parsed.length + " materials.", "is-ok");
    }).catch(function (err) { pFlag("Could not read that file: " + S.esc(err.message), "is-err"); });
  });
  document.getElementById("p-btn-discard").addEventListener("click", function () {
    if (!confirm("Throw away the local draft and go back to the published shop?")) return;
    localStorage.removeItem(P_DRAFT_KEY);
    pstate.dirty = false;
    pstate.items = (window.PRODUCTS || []).slice();
    pRenderList();
    if (pstate.items.length) pSelect(pstate.items[0].id);
    pFlag("Draft discarded.", "is-info");
  });

  /* --- tabs --- */
  S.$$(".admin-tabs .chip").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tab = btn.getAttribute("data-tab");
      S.$$(".admin-tabs .chip").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      document.getElementById("tab-works").hidden = tab !== "works";
      document.getElementById("tab-products").hidden = tab !== "products";
    });
  });

  detectServer().then(function () { load(); pLoad(); loadEnquiries(); });
})();
