/* gallery.js — filtering, sorting and searching the collection. */
(function () {
  "use strict";
  var S = window.Studio;
  var grid = document.getElementById("gallery-grid");
  var countEl = document.getElementById("result-count");
  if (!grid) return;

  var state = { theme: "all", style: "all", medium: "all", status: "all", sort: "newest", q: "" };

  /* read the query string so gallery.html?theme=rivers works from any link */
  var params = new URLSearchParams(location.search);
  ["theme", "style", "medium", "status", "sort", "q"].forEach(function (k) {
    if (params.get(k)) state[k] = params.get(k);
  });

  /* ---- build the filter controls from the data itself ------------------- */
  var works = S.works();
  var uniq = function (key) {
    return works.map(function (w) { return w[key]; })
      .filter(function (v, i, a) { return v && a.indexOf(v) === i; }).sort();
  };

  var themeBar = document.getElementById("theme-chips");
  themeBar.innerHTML = ['<button class="chip" data-theme="all">All work</button>']
    .concat((S.site.themes || []).map(function (t) {
      var n = S.countByTheme(t.id);
      return '<button class="chip" data-theme="' + t.id + '">' + S.esc(t.name) +
             (n ? ' <span class="muted">' + n + "</span>" : "") + "</button>";
    })).join("");

  function fillSelect(id, values, allLabel) {
    var el = document.getElementById(id);
    el.innerHTML = '<option value="all">' + allLabel + "</option>" +
      values.map(function (v) { return '<option value="' + S.esc(v) + '">' + S.esc(v) + "</option>"; }).join("");
  }
  fillSelect("f-style", uniq("style"), "All styles");
  fillSelect("f-medium", uniq("medium"), "All media");

  /* ---- apply ------------------------------------------------------------ */
  function matches(w) {
    if (state.theme !== "all" && (w.themes || []).indexOf(state.theme) === -1) return false;
    if (state.style !== "all" && w.style !== state.style) return false;
    if (state.medium !== "all" && w.medium !== state.medium) return false;
    if (state.status === "forsale" && ["sold", "nfs"].indexOf(w.status) > -1) return false;
    if (state.status !== "all" && state.status !== "forsale" && w.status !== state.status) return false;
    if (state.q) {
      var hay = [w.title, w.medium, w.place, w.story, w.style, (w.themes || []).map(S.themeName).join(" ")]
        .join(" ").toLowerCase();
      if (hay.indexOf(state.q.toLowerCase()) === -1) return false;
    }
    return true;
  }
  var SORTS = {
    newest:    function (a, b) { return (b.year || 0) - (a.year || 0); },
    priceUp:   function (a, b) { return (a.price == null ? Infinity : a.price) - (b.price == null ? Infinity : b.price); },
    priceDown: function (a, b) { return (b.price == null ? -1 : b.price) - (a.price == null ? -1 : a.price); },
    title:     function (a, b) { return String(a.title).localeCompare(String(b.title)); },
    largest:   function (a, b) { return (b.w_cm * b.h_cm || 0) - (a.w_cm * a.h_cm || 0); }
  };

  function syncUrl() {
    var p = new URLSearchParams();
    Object.keys(state).forEach(function (k) {
      if (state[k] && state[k] !== "all" && !(k === "sort" && state[k] === "newest")) p.set(k, state[k]);
    });
    var url = location.pathname + (p.toString() ? "?" + p.toString() : "");
    history.replaceState(null, "", url);
  }

  function render() {
    var list = works.filter(matches).sort(SORTS[state.sort] || SORTS.newest);
    S.renderCards(grid, list,
      "No works match these filters yet. Clear a filter, or ask me about a commission on this subject.");
    countEl.textContent = list.length + (list.length === 1 ? " work" : " works") +
      (state.theme !== "all" ? " in " + S.themeName(state.theme) : "");
    S.$$("#theme-chips .chip").forEach(function (c) {
      c.setAttribute("aria-pressed", String(c.getAttribute("data-theme") === state.theme));
    });
    document.getElementById("f-style").value = state.style;
    document.getElementById("f-medium").value = state.medium;
    document.getElementById("f-status").value = state.status;
    document.getElementById("f-sort").value = state.sort;
    document.getElementById("f-search").value = state.q;
    var head = document.getElementById("gallery-title");
    if (head) head.textContent = state.theme === "all" ? "The collection" : S.themeName(state.theme);
    var blurb = document.getElementById("gallery-blurb");
    var t = (S.site.themes || []).filter(function (x) { return x.id === state.theme; })[0];
    if (blurb) blurb.textContent = t ? t.blurb :
      "Originals, studies and drawings. Everything marked available can be bought directly from the studio.";
    syncUrl();
  }

  themeBar.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    state.theme = chip.getAttribute("data-theme");
    render();
  });
  ["style", "medium", "status", "sort"].forEach(function (k) {
    document.getElementById("f-" + k).addEventListener("change", function (e) {
      state[k] = e.target.value; render();
    });
  });
  var searchTimer;
  document.getElementById("f-search").addEventListener("input", function (e) {
    clearTimeout(searchTimer);
    var v = e.target.value;
    searchTimer = setTimeout(function () { state.q = v; render(); }, 180);
  });
  document.getElementById("f-clear").addEventListener("click", function () {
    state = { theme: "all", style: "all", medium: "all", status: "all", sort: "newest", q: "" };
    render();
  });

  render();
})();
