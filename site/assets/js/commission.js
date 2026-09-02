/* commission.js — the booking page: process, prices, FAQ and brief prefills. */
(function () {
  "use strict";
  var S = window.Studio;

  /* --- process steps ----------------------------------------------------- */
  var steps = document.getElementById("commission-steps");
  if (steps) {
    steps.innerHTML = (S.site.commissionSteps || []).map(function (s) {
      return '<li class="step reveal"><div><h3>' + S.esc(s.title) + "</h3><p>" + S.esc(s.text) + "</p></div></li>";
    }).join("");
  }

  /* --- indicative price table -------------------------------------------- */
  var pricing = S.site.commissionPricing || {};
  var block = document.getElementById("pricing-block");
  if (block) {
    if (!pricing.show || !(pricing.tiers || []).length) {
      block.parentNode.hidden = true;
    } else {
      document.getElementById("pricing-table").innerHTML =
        "<thead><tr><th>Work</th><th>Typical size</th><th class='num'>From</th></tr></thead><tbody>" +
        pricing.tiers.map(function (t) {
          return "<tr><td>" + S.esc(t.work) + "</td><td>" + S.esc(t.size) + "</td>" +
                 "<td class='num'>" + (pricing.currency || "₹") + Number(t.from).toLocaleString("en-IN") + "</td></tr>";
        }).join("") + "</tbody>";
      document.getElementById("pricing-note").textContent = pricing.note || "";
    }
  }

  /* --- FAQ ---------------------------------------------------------------- */
  var faq = document.getElementById("faq-list");
  if (faq) {
    faq.innerHTML = (S.site.faq || []).map(function (f) {
      return "<details><summary>" + S.esc(f.q) + "</summary><p>" + S.esc(f.a) + "</p></details>";
    }).join("");
  }

  /* --- the form ----------------------------------------------------------- */
  var form = document.getElementById("commission-form");
  if (!form) return;

  /* theme dropdown built from the artist's own series list */
  var themeSel = document.getElementById("c-theme");
  (S.site.themes || []).forEach(function (t) {
    var o = document.createElement("option");
    o.value = t.name; o.textContent = t.name;
    themeSel.appendChild(o);
  });

  /* "I have an exact size" reveals a free-text box */
  var exact = document.getElementById("c-size-exact");
  form.addEventListener("change", function (e) {
    if (e.target.name === "size") {
      var wantsExact = /exact size/i.test(e.target.value);
      exact.hidden = !wantsExact;
      if (wantsExact) exact.focus();
    }
  });

  /* prefill from links like commission.html?ref=spiti-crossing&theme=rivers */
  var p = new URLSearchParams(location.search);
  var ref = p.get("ref");
  if (ref) {
    var w = S.find(ref);
    if (w) {
      var box = document.getElementById("c-subject");
      box.value = "Something in the spirit of “" + w.title + "” (" + w.medium + ", " +
                  w.w_cm + "×" + w.h_cm + " cm). ";
      themeSel.value = S.themeName((w.themes || [])[0]) || "";
      var note = document.createElement("p");
      note.className = "form-status is-info";
      note.textContent = "Starting from " + w.title + " — edit the description below to say what you would like changed.";
      form.prepend(note);
    }
  }
  var th = p.get("theme");
  if (th) {
    var name = S.themeName(th);
    if (name) themeSel.value = name;
  }

  S.reveal(document);
})();
