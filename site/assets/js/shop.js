/* =============================================================================
   shop.js — the studio materials shop.
   There is no card payment here on purpose: an order becomes a clear, itemised
   email to the artist, who replies with a total and a payment link. That keeps
   the site free to run and keeps a human in the loop on packing and postage.
   ========================================================================== */
(function () {
  "use strict";
  var S = window.Studio;
  var grid = document.getElementById("shop-grid");
  if (!grid) return;

  var CART_KEY = "studio.order.v1";
  var PRODUCTS = (window.PRODUCTS || []).slice();
  var shop = S.site.shop || {};
  var STATUS = {
    instock:     { label: "In stock",     cls: "tag--available", orderable: true },
    madetoorder: { label: "Made to order", cls: "tag--reserved",  orderable: true },
    soldout:     { label: "Sold out",     cls: "tag--sold",       orderable: false }
  };
  var state = { category: "all", cart: {} };

  try { state.cart = JSON.parse(localStorage.getItem(CART_KEY) || "{}"); } catch (e) { state.cart = {}; }
  var params = new URLSearchParams(location.search);
  if (params.get("category")) state.category = params.get("category");

  function find(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }
  function statusOf(p) { return STATUS[p.status] || STATUS.instock; }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch (e) { /* private mode */ }
  }
  function cartLines() {
    return Object.keys(state.cart).map(function (id) {
      var p = find(id);
      return p ? { p: p, qty: state.cart[id] } : null;
    }).filter(Boolean);
  }
  function cartTotal() {
    return cartLines().reduce(function (sum, l) {
      return sum + (l.p.price == null ? 0 : l.p.price * l.qty);
    }, 0);
  }
  function hasOnRequest() {
    return cartLines().some(function (l) { return l.p.price == null; });
  }

  /* ------------------------------------------------------------- category */
  document.getElementById("shop-chips").innerHTML =
    ['<button class="chip" data-category="all">Everything</button>']
      .concat((shop.categories || []).map(function (c) {
        var n = PRODUCTS.filter(function (p) { return p.category === c.id; }).length;
        return '<button class="chip" data-category="' + S.esc(c.id) + '">' + S.esc(c.name) +
               (n ? ' <span class="muted">' + n + "</span>" : "") + "</button>";
      })).join("");

  /* ---------------------------------------------------------------- cards */
  function cardHTML(p) {
    var st = statusOf(p);
    var qty = state.cart[p.id] || 0;
    return '<article class="product reveal" id="p-' + S.esc(p.id) + '">' +
      '<div class="product__frame">' +
        '<img src="' + S.esc(p.image) + '" alt="' + S.esc(p.name) + '" loading="lazy">' +
        '<span class="tag ' + st.cls + '">' + st.label + "</span>" +
      "</div>" +
      '<div class="product__body">' +
        '<h3 class="product__name">' + S.esc(p.name) + "</h3>" +
        '<p class="product__unit">' + S.esc(p.unit || "") +
          (p.batch ? ' · <span class="muted">' + S.esc(p.batch) + "</span>" : "") + "</p>" +
        (p.madeFrom ? '<p class="product__made">' + S.esc(p.madeFrom) + "</p>" : "") +
        (p.notes ? "<details class='product__more'><summary>How to use it</summary><p>" +
                   S.esc(p.notes) + "</p></details>" : "") +
        '<div class="product__foot">' +
          '<span class="product__price">' + S.money(p.price) +
            (p.status === "madetoorder" && p.lead ? '<span class="product__lead">ready in ' + S.esc(p.lead) + "</span>" : "") +
          "</span>" +
          (st.orderable
            ? (qty
              ? '<span class="stepper" data-id="' + S.esc(p.id) + '">' +
                  '<button type="button" data-step="-1" aria-label="One less ' + S.esc(p.name) + '">−</button>' +
                  '<b aria-live="polite">' + qty + "</b>" +
                  '<button type="button" data-step="1" aria-label="One more ' + S.esc(p.name) + '">+</button>' +
                "</span>"
              : '<button class="btn btn--sm btn--ghost" type="button" data-add="' + S.esc(p.id) + '">Add to order</button>')
            : '<span class="small muted">Ask when it returns</span>') +
        "</div>" +
      "</div></article>";
  }

  function render() {
    var list = PRODUCTS.filter(function (p) {
      return state.category === "all" || p.category === state.category;
    });
    grid.innerHTML = list.length ? list.map(cardHTML).join("")
      : '<p class="muted">Nothing in this part of the shop at the moment.</p>';
    S.$$("#shop-chips .chip").forEach(function (c) {
      c.setAttribute("aria-pressed", String(c.getAttribute("data-category") === state.category));
    });
    /* the intro already sits at the top of the page — under the filters, only a
       chosen category has anything new to say */
    var cat = (shop.categories || []).filter(function (c) { return c.id === state.category; })[0];
    var blurb = document.getElementById("shop-blurb");
    blurb.textContent = cat ? cat.blurb : "";
    blurb.hidden = !cat;
    S.reveal(grid);
    renderOrder();
  }

  /* ---------------------------------------------------------------- order */
  function renderOrder() {
    var lines = cartLines();
    var bar = document.getElementById("order-bar");
    var count = lines.reduce(function (n, l) { return n + l.qty; }, 0);
    bar.hidden = count === 0;
    document.getElementById("order-bar-count").textContent =
      count + (count === 1 ? " item" : " items") + " · " + S.money(cartTotal()) +
      (hasOnRequest() ? " + items priced on request" : "");

    var box = document.getElementById("order-lines");
    var empty = document.getElementById("order-empty");
    var form = document.getElementById("order-form");
    empty.hidden = lines.length > 0;
    form.hidden = lines.length === 0;
    if (!lines.length) { box.innerHTML = ""; return; }

    box.innerHTML =
      '<table class="table"><thead><tr><th>Item</th><th>Unit</th><th class="num">Qty</th><th class="num">Amount</th><th></th></tr></thead><tbody>' +
      lines.map(function (l) {
        return "<tr><td>" + S.esc(l.p.name) + "</td><td>" + S.esc(l.p.unit || "") + "</td>" +
          '<td class="num"><span class="stepper" data-id="' + S.esc(l.p.id) + '">' +
            '<button type="button" data-step="-1" aria-label="One less">−</button><b>' + l.qty +
            '</b><button type="button" data-step="1" aria-label="One more">+</button></span></td>' +
          '<td class="num">' + (l.p.price == null ? "On request" : S.money(l.p.price * l.qty)) + "</td>" +
          '<td class="num"><button class="chip" type="button" data-remove="' + S.esc(l.p.id) + '">Remove</button></td></tr>';
      }).join("") +
      '<tr><th colspan="3">Items total</th><th class="num">' + S.money(cartTotal()) + "</th><th></th></tr>" +
      "</tbody></table>" +
      '<p class="small muted">Packing and delivery are added when I reply — they depend on ' +
      "weight and your pin code. Nothing is charged on this website.</p>";

    /* keep the hidden fields the email is built from in step with the basket */
    form.items.value = lines.map(function (l) {
      return l.qty + " × " + l.p.name + " (" + (l.p.unit || "") + ", " +
             (l.p.price == null ? "price on request" : S.money(l.p.price) + " each") + ")";
    }).join("; ");
    form.items_total.value = S.money(cartTotal()) + (hasOnRequest() ? " plus items priced on request" : "");
  }

  function change(id, delta) {
    var p = find(id);
    if (!p || !statusOf(p).orderable) return;
    var next = (state.cart[id] || 0) + delta;
    if (next <= 0) delete state.cart[id]; else state.cart[id] = Math.min(next, 99);
    saveCart();
    render();
  }

  /* --------------------------------------------------------------- events */
  document.getElementById("shop-chips").addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    state.category = chip.getAttribute("data-category");
    var p = new URLSearchParams();
    if (state.category !== "all") p.set("category", state.category);
    history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
    render();
  });

  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-add]");
    if (add) { change(add.getAttribute("data-add"), 1); S.toast("Added to your order"); return; }
    var step = e.target.closest("[data-step]");
    if (step) { change(step.parentNode.getAttribute("data-id"), Number(step.getAttribute("data-step"))); return; }
    var rm = e.target.closest("[data-remove]");
    if (rm) { delete state.cart[rm.getAttribute("data-remove")]; saveCart(); render(); }
  });

  document.getElementById("order-clear").addEventListener("click", function () {
    state.cart = {}; saveCart(); render(); S.toast("Order cleared");
  });

  /* terms and category intro text from site.js */
  document.getElementById("shop-terms").innerHTML =
    (shop.terms || []).map(function (t) { return "<li>" + S.esc(t) + "</li>"; }).join("");
  document.getElementById("order-note").textContent = shop.orderNote || "";

  var orderForm = document.getElementById("order-form");
  S.enquiry.bind(orderForm);

  /* Once the order has actually gone, empty the basket so nobody sends it twice.
     In mailto mode the visitor still has to press send in their own email
     programme, so the basket is left alone until they come back. */
  orderForm.addEventListener("enquiry:sent", function (e) {
    if (e.detail && e.detail.via === "mailto") return;
    state.cart = {};
    saveCart();
    render();
  });

  /* The floating bar is a shortcut to the order section — hide it once you are
     looking at the order section, where it would only cover the form. */
  var orderSection = document.getElementById("order");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      document.getElementById("order-bar").classList.toggle("is-parked", entries[0].isIntersecting);
    }, { threshold: 0.08 }).observe(orderSection);
  }

  render();
})();
