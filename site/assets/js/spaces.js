/* spaces.js — design work made for a particular room, wall or building. */
(function () {
  "use strict";
  var S = window.Studio;
  var sp = S.site.spaces || {};
  var form = document.getElementById("space-form");
  if (!form) return;

  document.getElementById("space-intro").textContent = sp.intro || "";
  document.getElementById("space-heading").textContent = sp.heading || "Work made for a particular wall";

  document.getElementById("space-types").innerHTML = (sp.types || []).map(function (t) {
    return '<div class="theme-card reveal"><div><h3 class="theme-card__name">' + S.esc(t.name) + "</h3>" +
           '<p class="theme-card__blurb">' + S.esc(t.blurb) + "</p></div></div>";
  }).join("");

  document.getElementById("space-steps").innerHTML = (sp.process || []).map(function (s) {
    return '<li class="step reveal"><div><h3>' + S.esc(s.title) + "</h3><p>" + S.esc(s.text) + "</p></div></li>";
  }).join("");

  var priced = sp.priced || [];
  if (!priced.length) {
    document.getElementById("space-pricing").hidden = true;
  } else {
    document.getElementById("space-price-table").innerHTML =
      "<thead><tr><th>Work</th><th>Quoted</th><th class='num'>From</th></tr></thead><tbody>" +
      priced.map(function (t) {
        return "<tr><td>" + S.esc(t.work) + "</td><td>" + S.esc(t.basis) + "</td>" +
               "<td class='num'>₹" + Number(t.from).toLocaleString("en-IN") + "</td></tr>";
      }).join("") + "</tbody>";
    document.getElementById("space-price-note").textContent = sp.pricingNote || "";
  }

  /* the type of space decides which follow-up question matters */
  var siteVisit = document.getElementById("space-visit-note");
  form.addEventListener("change", function (e) {
    if (e.target.name !== "space_type") return;
    var onSite = /mural|hotel|restaurant|office|public/i.test(e.target.value);
    siteVisit.hidden = !onSite;
  });

  S.enquiry.bind(form);
  S.reveal(document);
})();
