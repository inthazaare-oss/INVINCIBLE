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
  var MAX_EDGE = 1800;          // longest side of a stored image, in pixels
  var JPEG_QUALITY = 0.82;

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
  function flag(msg, cls) {
    var el = document.getElementById("admin-status");
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

  function resize(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (blob) {
          resolve({
            blob: blob,
            dataUrl: c.toDataURL("image/jpeg", JPEG_QUALITY),
            width: c.width, height: c.height,
            ratio: c.width / c.height
          });
        }, "image/jpeg", JPEG_QUALITY);
      };
      img.onerror = function () { reject(new Error("That file could not be read as an image.")); };
      img.src = url;
    });
  }

  function handleFile(file) {
    if (!file || !/^image\//.test(file.type)) { flag("Please choose a JPG or PNG image.", "is-err"); return; }
    flag("Preparing the image…", "is-info");
    resize(file).then(function (out) {
      var f = document.getElementById("work-form");
      var base = slug(f.title_.value || file.name.replace(/\.[^.]+$/, ""));
      state.pendingImage = { dataUrl: out.dataUrl, blob: out.blob, filename: base + ".jpg" };
      showPreview(out.dataUrl);

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
            flag("Image uploaded to the studio server as <code>" + S.esc(j.path) + "</code>.", "is-ok");
          });
      }
      f.image.value = "images/works/" + state.pendingImage.filename;
      flag("Image ready (" + out.width + "×" + out.height + "px, " +
           Math.round(out.blob.size / 1024) + " KB). Use <strong>Download image file</strong> below, " +
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
    document.getElementById("dirty-badge").hidden = !state.dirty;
    document.getElementById("btn-publish").hidden = !state.server;
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
    if (!state.dirty) return;
    e.preventDefault(); e.returnValue = "";
  });

  detectServer().then(function () { load(); loadEnquiries(); });
})();
