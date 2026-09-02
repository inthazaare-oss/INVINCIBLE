# What Indian art websites do, and what a painter's own site should do differently

A working analysis behind the design in `site/`. Written for the artist, not for developers.

---

## 0. How this was researched — and its limits

Please read this first, because it affects how much weight to put on section 2.

- The research was done from a sandboxed machine whose network **blocks direct access
  to most websites**. I could run web searches and read the search engine's summaries
  and result listings, but I **could not open ArtZolo, Mojarto, Indian Art Ideas,
  MyIndianArt, MemeRaki, Laasya Art or any other site to inspect it page by page.**
- So the platform-specific statements in section 2 are drawn from search-result
  summaries plus general knowledge of how these sites are built. They are a reasonable
  working picture, **not a verified audit**. Treat anything specific — price ranges,
  exact filters, exact policies — as "probably, check it".
- **What to do about that:** spend an evening opening five or six of these sites
  yourself with the checklist in section 3 open beside you. You will learn more in two
  hours than any summary can give you, and you will see what your own competitors in
  your own city and price band are actually doing.
- Nothing here should be read as legal, tax or financial advice. Where money and law
  are involved (section 7) I have flagged what I am unsure about; verify with a
  chartered accountant.

---

## 1. Three kinds of art website exist in India

**a. Marketplaces / aggregators.** Many artists, one shop. Search results consistently
name ArtZolo, Mojarto, Indian Art Ideas, MyIndianArt, IndianArtZone, Artsera, Fizdi and
Artoreal in this category, alongside global players (Saatchi Art, Artfinder, Etsy) that
also sell into India. They win on traffic and on trust-at-scale. They take a commission,
they own the customer relationship, and your work sits beside two thousand others.

**b. Curated gallery / studio sites.** A gallery or a specialist house presenting a
selected roster, usually with a "commission an artist" service attached. Laasya Art and
Housethome appeared in searches as examples that coordinate commissions on a client's
behalf; MemeRaki appeared as a specialist in India's traditional and folk art forms,
combining a shop with masterclasses and artist stories.

**c. The individual artist's own site.** One painter, their whole body of work, and a
direct line to them. This is what you are building. It cannot beat a marketplace on
traffic. It beats them on everything else — margin, voice, and the fact that a
collector is talking to the person who held the brush.

**Strategic conclusion:** do not try to build a marketplace. Be listed on one or two of
them for discovery if you like, but make your own site the place where the serious
buyer, the commission client and the gallery curator all end up. Marketplaces sell
*paintings*. Your site sells *you painting*.

---

## 2. What the platforms do well (and you should copy)

From the search evidence and general practice, the recurring features are:

| Feature | Why it matters | In this site? |
|---|---|---|
| Filter by subject / medium / style / size / price | Buyers arrive with a wall, a colour and a budget in mind | ✅ subject, style, medium, availability, sort, free-text search |
| Clear price on the listing | Hidden prices lose the casual buyer entirely | ✅ price, or an honest "Price on request" |
| Availability status | "Sold" is social proof; "Reserved" creates urgency | ✅ Available / Reserved / Sold / Not for sale |
| Certificate of authenticity | The single biggest trust device in original art | ✅ stated on every artwork page and in the FAQ |
| Insured shipping, packed properly | The number-one buyer anxiety for a large canvas | ✅ stated; quoted at cost |
| Multiple payment options | Card, UPI, netbanking, bank transfer, international | ⚠️ not yet — see section 6 |
| Artist profile / story | Turns a decorative object into a collectible one | ✅ About page, plus a story on each work |
| A commission / custom-painting route | Highest-value, highest-margin work | ✅ the whole of `commission.html` |
| Prints and editions alongside originals | Lets a ₹3,000 admirer buy something | ⚠️ flagged per work; no print shop yet |
| Workshops, blogs, art-form explainers | Traffic, authority, and a second income line | ⚠️ roadmap |
| WhatsApp / phone contact | In India this converts better than a form | ✅ WhatsApp and phone in the footer and contact page |
| EMI / instalments on higher-value work | Widens the buyer pool considerably | ⚠️ roadmap, gateway-dependent |

Advice found repeatedly in artist-business writing, which the commission page follows:
put the commission form where it is easy to find; separate commissioned work from
personal work so neither confuses the buyer; ask for a deposit up front (50% is the
commonly cited figure, sometimes 30% plus instalments); state the number of revisions
included; make licensing and reproduction rights explicit; and answer fast, because an
unanswered enquiry is a lost job.

## 3. Your own audit checklist

Open five Indian art sites, and one artist you admire abroad, and answer these:

1. How many clicks from the front page to a price? (Yours: one.)
2. Can I filter to "landscape, under ₹50,000, available"? (Yours: yes.)
3. Does the artwork page tell me a story, or only specifications?
4. How do they explain shipping a 120 cm canvas to my city?
5. What exactly does their commission process promise, and what does it cost?
6. Is there a reason to come back next month?
7. On a phone, is the picture bigger than the navigation? (It should be.)
8. How quickly do they reply when you send an enquiry as a normal buyer? Time it.

Answer 8 honestly on your own site once a month. It is the only metric that matters
until you have traffic.

---

## 4. Where a marketplace is weak, and you can win

- **No voice.** A marketplace listing is a spec sheet. You can put three sentences
  under a painting about the four mornings you spent on that ridge; nobody else can.
- **No series.** Your eleven running series — landscapes, portraits, life studies,
  traditional, abstract, India's states, world cultures, deserts, mountains, rivers,
  political life — read as a *body of work* on your own site and as scattered stock on
  a marketplace. Depth in a subject is what gets an artist an exhibition, a
  commission, or a press mention.
- **No commission pathway.** Marketplaces sell what exists. Your highest-value client
  wants something that does not exist yet, sized to their wall.
- **Commission (the other kind).** Selling direct keeps the 20–40% that a platform
  or a gallery would take. That is the whole margin of a working studio.
- **No relationship.** The collector who bought a river painting is the best possible
  buyer for the next river painting. Only you can keep that list.

---

## 5. The design decisions in this site, and why

1. **Subject-first navigation.** Your work spans eleven subjects and two idioms
   (traditional and abstract). Sorting only by date would hide that. Every series is a
   filter, a landing page and a shareable link (`gallery.html?theme=deserts`).
2. **Both idioms shown side by side, filterable apart.** A visitor who came for
   abstracts should not have to scroll past portraits, and vice versa — but they
   should be able to discover that the same hand made both. Style is a separate filter
   from subject for exactly this reason.
3. **Price and availability on the card.** Concealing price to force an enquiry
   costs more sales than it creates. "Price on request" stays available for works
   where you genuinely want a conversation.
4. **A story field on every work.** Two or three sentences. This is the field that
   converts, and it is why the admin panel nags you for it.
5. **The commission brief asks structured questions.** Subject, size, medium, budget
   band, deadline, delivery city, intended use, reference links. A brief with a budget
   and a date can be quoted in one reply instead of five.
6. **Intended use is asked explicitly** — home, gift, office/hotel, or commercial
   reproduction — because reproduction rights should be priced separately, and you
   cannot price what you did not ask about.
7. **Indicative prices published.** Starting prices let a visitor self-qualify. It
   costs you a few unaffordable enquiries and gains you serious ones.
8. **Every enquiry has a fallback.** If a form service fails, the form falls back to
   opening the visitor's email with the brief filled in and shows your address. A lost
   enquiry is worse than an ugly one.
9. **The admin panel is a browser page, not a database.** No hosting bill, no
   passwords to lose, no upgrade to break. It writes a plain file you upload. When you
   outgrow that, the same panel drives the optional server with a Publish button.
10. **The site is plain HTML, CSS and JavaScript.** No framework, no build step, no
    npm. Three years from now it will still open, and any web person in any city can
    edit it. Art outlives software fashions; the site should too.

---

## 6. What is deliberately not built yet

Ordered by what I would add next. None of it is hard; all of it needs a decision from
you first.

**Phase 2 — selling without a conversation**
- **Online checkout.** A payment gateway (Razorpay, Cashfree, PayU and Instamojo are
  the usual Indian options; Stripe for international) plus an order confirmation.
  Worth doing once enquiries exceed roughly one a week.
- **Prints on demand.** A print of a sold painting is the only way to sell it twice.
  Needs a giclée printer you trust and an editions policy (edition size, signing,
  numbering).
- **A short film of the studio.** Thirty seconds of brush on canvas outsells any
  paragraph.

**Phase 3 — being found**
- **Search-engine groundwork.** `schema.org` structured data for each painting
  (`VisualArtwork`, `Offer`), a sitemap, per-work Open Graph images. Long-tail searches
  like "original Rajasthan desert oil painting for sale" are winnable; "buy art online"
  is not.
- **Writing.** One page per series explaining the subject — the ghats, the Kutch
  embroidery, why you paint crowds. This is what earns links and press.
- **A mailing list.** The single highest-return channel in art. New work, studio
  notes, one email a month.

**Phase 4 — scale**
- Multi-currency and international shipping quotes.
- Hindi and one regional language, if your subjects are regional.
- Exhibition/press kit page with high-resolution downloads on request.
- Client area for commissions in progress (progress photographs, approvals, payments).

---

## 7. Practical matters in India — verify these, do not take my word

I am flagging these because getting them wrong is expensive, and because I cannot
verify current rules from here.

- **GST.** Original works of art and hand-made paintings have historically attracted a
  lower GST rate than manufactured goods, and there are registration thresholds below
  which you need not register at all. I am **not confident** of the current rate or
  threshold, and both have changed over the years. **Ask a chartered accountant**
  before you publish prices "inclusive of taxes", and put the answer in
  `site/data/site.js`.
- **Payment gateways** charge roughly 2% plus GST on domestic transactions and more on
  international cards; exact rates vary by provider and negotiation. Confirm before
  quoting a price that assumes a margin.
- **Exporting artwork** from India can involve customs paperwork, and antiquities law
  restricts export of works over a certain age (that restriction concerns old art, not
  new work by a living artist — but confirm the paperwork with your courier).
- **Shipping.** Domestic art logistics is usually a rigid crate for stretched canvas or
  a tube for rolled canvas; several national couriers handle this, and specialist art
  logistics firms exist in the metros. Get quotes before promising a delivery price.
- **Commission contracts.** Put in writing: the advance (50% is standard practice),
  what the advance covers if the client cancels, how many revisions are included, who
  pays for framing and delivery, and who owns reproduction rights. The site states
  these; make sure the words in `site/data/site.js` match what you actually intend,
  because they now function as your published terms.

---

## 8. What to measure

Once the site is live, four numbers tell you everything:

1. **Enquiries per month** (the only number that pays).
2. **Reply time** — measured in hours, not days.
3. **Which series people filter to** — tells you what to paint more of.
4. **Which paintings get opened but not enquired about** — usually a price or a
   photograph problem, and the photograph is easier to fix.

A privacy-respecting analytics tool (Plausible, Fathom, or Cloudflare's free web
analytics) is enough. You do not need Google Analytics for this.

---

## Sources consulted

Search-result listings and summaries only — see the caveat in section 0. I could not
open these pages directly from this environment, so please verify anything specific.

- [Top websites to buy art online — ArtZolo blog](https://www.artzolo.com/blogs/art-logs/top-websites-to-buy-art-online)
- [ArtZolo](https://www.artzolo.com/) · [MyIndianArt](https://www.myindianart.com/) · [Indian Art Ideas](https://indianartideas.in/online-art-gallery) · [IndianArtZone](https://indianartzone.com/) · [MemeRaki](https://www.memeraki.com/)
- [Handpicked best websites to buy Indian paintings online — Caleidoscope](https://caleidoscope.in/art-culture/indian-paintings-online-2)
- [Commissioning Indian art — Laasya Art](https://laasyaart.com/commissioning-indian-art/) · [Commission art — Housethome](https://housethome.com/commission-art/)
- [A framework for accepting art commissions — Art Biz Success](https://artbizsuccess.com/art-commissions/)
- [8 tips for artists accepting commissions — The Abundant Artist](https://theabundantartist.com/8-tips-artists-accepting-commissions/)
- [Art commissions guide — Art Prof](https://artprof.org/pro-development/business-selling/art-commissions/)
- [19 artist portfolio websites worth learning from — Pixpa](https://www.pixpa.com/blog/artist-portfolio-websites)
