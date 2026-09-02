/* artwork.js — the single-artwork page, including its buy/enquire form. */
(function () {
  "use strict";
  var S = window.Studio;
  var root = document.getElementById("work-root");
  if (!root) return;

  var id = new URLSearchParams(location.search).get("id");
  var works = S.works();
  var w = S.find(id);

  if (!w) {
    root.innerHTML =
      '<div class="wrap-narrow center" style="padding:4rem 0">' +
      "<h1>That work isn't here</h1>" +
      '<p class="lede" style="margin-inline:auto">It may have been sold and archived, or the link may be old. ' +
      "The full collection is a click away.</p>" +
      '<a class="btn" href="gallery.html">Browse the collection</a></div>';
    return;
  }

  document.title = w.title + " — " + (S.site.artist.studio || S.site.artist.name);
  var st = S.statusOf(w);
  var idx = works.map(function (x) { return x.id; }).indexOf(w.id);
  var prev = works[(idx - 1 + works.length) % works.length];
  var next = works[(idx + 1) % works.length];
  var forSale = ["sold", "nfs"].indexOf(w.status) === -1;

  var priceBlock = w.status === "sold"
    ? '<p class="price-line">Sold</p><p class="small muted">This painting has found its collector. ' +
      (w.prints ? "Limited-edition prints may still be available — ask below." :
                  "A similar work can be commissioned — ask below.") + "</p>"
    : w.status === "nfs"
    ? '<p class="price-line">Not for sale</p><p class="small muted">Currently held by the studio or on loan for exhibition.</p>'
    : '<p class="price-line">' + S.money(w.price) + "</p>" +
      '<p class="small muted">' + (w.framed ? "Framed. " : "Unframed. ") +
      "Shipping and taxes quoted at cost." + (w.status === "reserved" ? " Currently reserved — join the waiting list below." : "") + "</p>";

  root.innerHTML =
    '<div class="wrap">' +
      '<p class="small muted" style="margin-bottom:1.4rem">' +
        '<a href="gallery.html">Collection</a> · ' +
        (w.themes || []).map(function (t) {
          return '<a href="gallery.html?theme=' + encodeURIComponent(t) + '">' + S.esc(S.themeName(t)) + "</a>";
        }).join(" · ") +
      "</p>" +
      '<div class="work">' +
        '<figure class="work__image" style="margin:0" id="work-image">' +
          '<img src="' + S.esc(w.image) + '" alt="' + S.esc(w.title) + " — " + S.esc(w.medium) + '">' +
        "</figure>" +
        '<div class="work__aside">' +
          '<span class="tag ' + st.cls + '">' + st.label + "</span>" +
          '<h1 style="font-size:clamp(2rem,4vw,3rem);margin:.6rem 0 .1rem">' + S.esc(w.title) + "</h1>" +
          '<p class="muted" style="margin-bottom:1.2rem">' + S.esc(w.year) + (w.place && w.place !== "—" ? " · " + S.esc(w.place) : "") + "</p>" +
          (w.story ? '<p style="color:var(--ink-2)">' + S.esc(w.story) + "</p>" : "") +
          '<table class="spec"><tbody>' +
            row("Medium", w.medium) +
            row("Dimensions", S.dims(w)) +
            row("Style", w.style) +
            row("Series", (w.themes || []).map(S.themeName).join(", ")) +
            row("Year", w.year) +
            row("Framing", w.framed ? "Framed" : "Unframed") +
            row("Prints", w.prints ? "Limited edition available" : "Original only") +
          "</tbody></table>" +
          priceBlock +
          '<div class="hero__actions" style="margin-top:1.4rem">' +
            '<a class="btn" href="#enquire">' + (forSale ? "Enquire to buy" : "Ask about this work") + "</a>" +
            '<a class="btn btn--ghost" href="commission.html?ref=' + encodeURIComponent(w.id) + '">Commission something like it</a>' +
          "</div>" +
          '<ul class="terms">' + (S.site.saleTerms || []).map(function (t) { return "<li>" + S.esc(t) + "</li>"; }).join("") + "</ul>" +
        "</div>" +
      "</div>" +

      '<div class="section" id="enquire">' +
        '<div class="wrap-narrow panel" style="margin-inline:0;max-width:720px">' +
          '<span class="eyebrow">Enquiry</span>' +
          "<h2>Ask about " + S.esc(w.title) + "</h2>" +
          '<p class="small muted">Price, condition, framing, shipping to your city, viewing in the studio, ' +
            "or whether a print edition exists — ask anything. I answer every message myself.</p>" +
          '<form class="form" data-enquiry="Artwork enquiry" novalidate>' +
            '<input type="hidden" name="artwork" value="' + S.esc(w.title) + '">' +
            '<input type="hidden" name="artwork_id" value="' + S.esc(w.id) + '">' +
            '<input type="hidden" name="listed_price" value="' + S.esc(w.price == null ? "on request" : w.price) + '">' +
            '<div style="position:absolute;left:-9999px" aria-hidden="true"><input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></div>' +
            '<div class="row">' +
              '<div class="field"><label for="e-name">Your name</label><input class="input" id="e-name" name="name" required></div>' +
              '<div class="field"><label for="e-email">Email</label><input class="input" id="e-email" name="email" type="email" required></div>' +
            "</div>" +
            '<div class="row">' +
              '<div class="field"><label for="e-phone">Phone or WhatsApp <span class="muted">(optional)</span></label><input class="input" id="e-phone" name="phone"></div>' +
              '<div class="field"><label for="e-city">Delivery city &amp; country</label><input class="input" id="e-city" name="city" placeholder="Hyderabad, India"></div>' +
            "</div>" +
            '<div class="field"><span class="field__label">I am asking about</span><div class="choices">' +
              choice("interest", forSale ? "Buying this work" : "A similar work", true) +
              choice("interest", "A print of this work") +
              choice("interest", "Seeing it in the studio") +
              choice("interest", "Something else") +
            "</div></div>" +
            '<div class="field"><label for="e-msg">Message</label>' +
              '<textarea class="textarea" id="e-msg" name="message" placeholder="Anything you would like to know."></textarea></div>' +
            '<label class="check"><input type="checkbox" name="consent" required><span data-site="forms.consentText">I agree to be contacted about this enquiry.</span></label>' +
            '<div class="form-status" role="status"></div>' +
            '<div><button class="btn btn--accent" type="submit">Send enquiry</button></div>' +
          "</form>" +
        "</div>" +
      "</div>" +

      '<div class="section">' +
        '<div class="head-row section-head"><div><span class="eyebrow">Continue looking</span><h2>From the same series</h2></div>' +
        '<a class="link-arrow" href="gallery.html">All work</a></div>' +
        '<div class="grid grid--3" id="related"></div>' +
        '<div class="head-row" style="margin-top:2.5rem;border-top:1px solid var(--rule);padding-top:1.2rem">' +
          '<a class="link-arrow" href="' + S.workUrl(prev) + '" style="transform:scaleX(1)">← ' + S.esc(prev.title) + "</a>" +
          '<a class="link-arrow" href="' + S.workUrl(next) + '">' + S.esc(next.title) + "</a>" +
        "</div>" +
      "</div>" +
    "</div>";

  function row(label, value) {
    if (!value && value !== 0) return "";
    return "<tr><th>" + S.esc(label) + "</th><td>" + S.esc(value) + "</td></tr>";
  }
  function choice(name, label, checked) {
    return '<label class="choice"><input type="radio" name="' + name + '" value="' + S.esc(label) + '"' +
      (checked ? " checked" : "") + '><span>' + S.esc(label) + "</span></label>";
  }

  /* related works: same theme first, then anything else */
  var related = works.filter(function (x) {
    return x.id !== w.id && (x.themes || []).some(function (t) { return (w.themes || []).indexOf(t) > -1; });
  });
  if (related.length < 3) {
    related = related.concat(works.filter(function (x) {
      return x.id !== w.id && related.indexOf(x) === -1;
    }));
  }
  S.renderCards(document.getElementById("related"), related.slice(0, 3));

  var fig = document.getElementById("work-image");
  fig.addEventListener("click", function () { S.lightbox(w.image, w.title + " — " + w.medium + " · " + S.dims(w)); });

  S.enquiry.bind(root.querySelector("[data-enquiry]"));
  S.reveal(root);
})();
