/* =============================================================================
   app.js — shared behaviour for every page.
   Depends on data/site.js (window.SITE) and data/artworks.js (window.ARTWORKS).
   Written in plain browser JavaScript: no build step, no libraries, no npm.
   ========================================================================== */
(function () {
  "use strict";

  var SITE = window.SITE || {};
  var WORKS = window.ARTWORKS || [];

  /* --- small helpers ---------------------------------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function get(obj, path) {
    return path.split(".").reduce(function (o, k) { return (o == null ? undefined : o[k]); }, obj);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function money(n) {
    if (n == null || n === "" || isNaN(n)) return "Price on request";
    return "₹" + Number(n).toLocaleString("en-IN");
  }
  function dims(w) {
    if (!w.w_cm || !w.h_cm) return "";
    var inch = function (cm) { return Math.round(cm / 2.54); };
    return w.w_cm + " × " + w.h_cm + " cm (" + inch(w.w_cm) + " × " + inch(w.h_cm) + " in)";
  }
  var STATUS = {
    available: { label: "Available", cls: "tag--available" },
    reserved:  { label: "Reserved",  cls: "tag--reserved" },
    sold:      { label: "Sold",      cls: "tag--sold" },
    nfs:       { label: "Not for sale", cls: "tag--nfs" }
  };
  function statusOf(w) { return STATUS[w.status] || STATUS.available; }
  function themeName(id) {
    var t = (SITE.themes || []).filter(function (x) { return x.id === id; })[0];
    return t ? t.name : id;
  }
  function workUrl(w) { return "artwork.html?id=" + encodeURIComponent(w.id); }

  /* --- data access ------------------------------------------------------ *
   * If the optional Node server is running, it serves the live gallery from
   * /api/artworks. Otherwise the file data/artworks.js is the gallery.       */
  function allWorks() { return (window.ARTWORKS || []).slice(); }
  function findWork(id) {
    return allWorks().filter(function (w) { return w.id === id; })[0] || null;
  }
  function countByTheme(id) {
    return allWorks().filter(function (w) { return (w.themes || []).indexOf(id) > -1; }).length;
  }

  /* --- text bindings: <span data-site="artist.name"> --------------------- */
  function applyBindings(root) {
    $$("[data-site]", root).forEach(function (el) {
      var v = get(SITE, el.getAttribute("data-site"));
      if (v != null && v !== "") el.textContent = v;
    });
    $$("[data-site-html]", root).forEach(function (el) {
      var v = get(SITE, el.getAttribute("data-site-html"));
      if (Array.isArray(v)) el.innerHTML = v.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    });
    $$("[data-site-attr]", root).forEach(function (el) {
      // format:  data-site-attr="href:contact.email|mailto:"
      var spec = el.getAttribute("data-site-attr").split("|");
      var pair = spec[0].split(":");
      var prefix = spec[1] || "";
      var v = get(SITE, pair[1]);
      if (v == null || v === "") { el.hidden = true; return; }
      el.setAttribute(pair[0], prefix + v);
      if (el.hasAttribute("data-site-fill")) el.textContent = v;
    });
  }

  /* --- header / navigation ---------------------------------------------- */
  function initChrome() {
    var header = $(".site-header");
    if (header) {
      var onScroll = function () { header.classList.toggle("is-stuck", window.scrollY > 8); };
      onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    }
    var toggle = $(".nav-toggle"), nav = $(".nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      $$(".nav a").forEach(function (a) {
        a.addEventListener("click", function () { nav.classList.remove("is-open"); });
      });
    }
    /* mark the current page in the nav. A link carrying a query string
       (India Series) only counts when that query string is showing too, so
       "Work" and "India Series" are never both underlined at once. */
    var here = (location.pathname.split("/").pop() || "index.html") + location.search;
    var links = $$(".nav a").filter(function (a) { return !a.classList.contains("btn"); });
    var exact = links.filter(function (a) { return a.getAttribute("href") === here; });
    (exact.length ? exact : links.filter(function (a) {
      var href = a.getAttribute("href") || "";
      return href.indexOf("?") === -1 && href === here.split("?")[0];
    })).forEach(function (a) { a.setAttribute("aria-current", "page"); });
    var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  }

  /* --- reveal on scroll -------------------------------------------------- */
  function initReveal(root) {
    var els = $$(".reveal", root || document);
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); }); return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* --- lightbox ---------------------------------------------------------- */
  var lightbox;
  function openLightbox(src, caption) {
    if (!lightbox) {
      lightbox = document.createElement("div");
      lightbox.className = "lightbox";
      lightbox.innerHTML =
        '<button class="lightbox__close" aria-label="Close image">✕</button>' +
        '<img alt=""><p class="lightbox__caption"></p>';
      document.body.appendChild(lightbox);
      lightbox.addEventListener("click", function (e) {
        if (e.target === lightbox || e.target.classList.contains("lightbox__close")) closeLightbox();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeLightbox();
      });
    }
    $("img", lightbox).src = src;
    $("img", lightbox).alt = caption || "";
    $(".lightbox__caption", lightbox).textContent = caption || "";
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    if (lightbox) lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  /* --- toast ------------------------------------------------------------- */
  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast"; toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("is-open");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-open"); }, 3200);
  }

  /* --- artwork card ------------------------------------------------------ */
  function cardHTML(w) {
    var st = statusOf(w);
    var priceHTML = w.status === "sold" ? '<span class="sold">Sold</span>'
      : w.status === "nfs" ? '<span class="sold">Not for sale</span>'
      : money(w.price);
    return '<a class="card reveal" href="' + workUrl(w) + '">' +
      '<div class="card__frame">' +
        '<img src="' + esc(w.image) + '" alt="' + esc(w.title) + ' — ' + esc(w.medium) + '" loading="lazy">' +
        '<span class="tag ' + st.cls + '">' + st.label + '</span>' +
      '</div>' +
      '<div class="card__body">' +
        '<h3 class="card__title">' + esc(w.title) + '</h3>' +
        '<p class="card__meta">' + esc(w.medium) + (w.w_cm ? " · " + w.w_cm + "×" + w.h_cm + " cm" : "") +
          (w.year ? " · " + esc(w.year) : "") + '</p>' +
        '<p class="card__price">' + priceHTML + '</p>' +
      '</div></a>';
  }
  function renderCards(container, works, emptyMsg) {
    if (!container) return;
    if (!works.length) {
      container.innerHTML = '<p class="muted">' + esc(emptyMsg || "No works to show yet.") + "</p>";
      return;
    }
    container.innerHTML = works.map(cardHTML).join("");
    initReveal(container);
  }

  /* =============================================================== ENQUIRY */
  /* Turns any form into a structured enquiry and delivers it by the method
     chosen in site.js → forms.mode. Falls back to mailto if a POST fails,
     so an enquiry is never silently lost.                                    */
  var Enquiry = {
    collect: function (form) {
      var data = {};
      new FormData(form).forEach(function (v, k) {
        if (v instanceof File) { if (v.name) data[k] = "(file: " + v.name + ")"; return; }
        data[k] = data[k] ? data[k] + ", " + v : v;
      });
      return data;
    },
    asText: function (data, subject) {
      var lines = [subject, "".padEnd ? "".padEnd(subject.length, "=") : "======", ""];
      Object.keys(data).forEach(function (k) {
        if (k === "consent" || k === "_gotcha" || !data[k]) return;
        lines.push(labelFor(k) + ": " + data[k]);
      });
      lines.push("", "Sent from " + location.href);
      return lines.join("\n");
    },
    mailto: function (data, subject) {
      var to = get(SITE, "contact.email") || "";
      return "mailto:" + to + "?subject=" + encodeURIComponent(subject) +
             "&body=" + encodeURIComponent(Enquiry.asText(data, subject));
    },
    send: function (form, subject) {
      var mode = get(SITE, "forms.mode") || "mailto";
      var data = Enquiry.collect(form);
      data._subject = subject;
      data._page = location.href;
      if (mode === "mailto") {
        window.location.href = Enquiry.mailto(data, subject);
        return Promise.resolve({ ok: true, via: "mailto" });
      }
      var url = mode === "server" ? "/api/enquiry" : get(SITE, "forms.formEndpoint");
      if (!url) {
        window.location.href = Enquiry.mailto(data, subject);
        return Promise.resolve({ ok: true, via: "mailto" });
      }
      var body;
      var headers = { "Accept": "application/json" };
      var key = get(SITE, "forms.accessKey");
      if (key) data.access_key = key;                 // Web3Forms
      data.subject = subject;                          // most services use this
      if (form.querySelector('input[type="file"]') && mode !== "server") {
        body = new FormData(form);                     // keeps attachments
        Object.keys(data).forEach(function (k) { if (!body.has(k)) body.append(k, data[k]); });
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(data);
      }
      return fetch(url, { method: "POST", headers: headers, body: body })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return { ok: true, via: mode };
        });
    },
    /* Wire a <form data-enquiry="Subject line"> element up completely. */
    bind: function (form) {
      if (!form) return;
      var status = $(".form-status", form) || form.parentNode.querySelector(".form-status");
      var button = form.querySelector('[type="submit"]');
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (form.querySelector('[name="_gotcha"]') && form.querySelector('[name="_gotcha"]').value) return; // bot
        if (!form.reportValidity()) return;
        var subject = form.getAttribute("data-enquiry") || "Website enquiry";
        var title = form.querySelector('[name="artwork"]');
        if (title && title.value) subject += " — " + title.value;
        var original = button ? button.textContent : "";
        if (button) { button.disabled = true; button.textContent = "Sending…"; }
        Enquiry.send(form, subject).then(function (res) {
          if (status) {
            status.className = "form-status is-ok";
            status.textContent = res.via === "mailto"
              ? "Your email programme should now be open with the enquiry filled in — press send there to deliver it."
              : (get(SITE, "forms.successMessage") || "Thank you — your enquiry has been sent.");
          }
          if (res.via !== "mailto") form.reset();
          form.setAttribute("data-sent", "true");
          /* pages that hold state of their own (the shop basket) listen for this */
          form.dispatchEvent(new CustomEvent("enquiry:sent", { bubbles: true, detail: { via: res.via } }));
        }).catch(function (err) {
          if (status) {
            status.className = "form-status is-err";
            status.innerHTML = "The form could not be delivered (" + esc(err.message) + "). " +
              '<a href="' + esc(Enquiry.mailto(Enquiry.collect(form), form.getAttribute("data-enquiry") || "Enquiry")) +
              '">Send it by email instead</a>, or write to ' +
              '<a href="mailto:' + esc(get(SITE, "contact.email")) + '">' + esc(get(SITE, "contact.email")) + "</a>.";
          }
        }).then(function () {
          if (button) { button.disabled = false; button.textContent = original; }
        });
      });
    }
  };
  var LABELS = {
    name: "Name", email: "Email", phone: "Phone", city: "City", country: "Country",
    type: "Type of work", subject_matter: "Subject", theme: "Theme", medium: "Preferred medium",
    size: "Size", budget: "Budget", deadline: "Needed by", framing: "Framing",
    reference_links: "Reference links", usage: "Intended use", message: "Message",
    artwork: "Artwork", heard: "How they found you", prints: "Interested in prints"
  };
  function labelFor(k) { return LABELS[k] || k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, " "); }

  /* --- boot -------------------------------------------------------------- */
  function init() {
    applyBindings(document);
    initChrome();
    initReveal(document);
    $$("[data-enquiry]").forEach(Enquiry.bind);
    $$("[data-lightbox]").forEach(function (el) {
      el.addEventListener("click", function () {
        openLightbox(el.getAttribute("data-lightbox"), el.getAttribute("data-caption") || "");
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  /* --- public surface used by page scripts -------------------------------- */
  window.Studio = {
    $: $, $$: $$, esc: esc, money: money, dims: dims, get: get,
    works: allWorks, find: findWork, countByTheme: countByTheme,
    themeName: themeName, statusOf: statusOf, workUrl: workUrl,
    cardHTML: cardHTML, renderCards: renderCards,
    reveal: initReveal, lightbox: openLightbox, toast: toast,
    enquiry: Enquiry, site: SITE
  };
})();
