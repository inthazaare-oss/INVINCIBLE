/* =============================================================================
   site.js — ALL THE TEXT ON THIS WEBSITE LIVES HERE.
   Edit this one file to change the artist name, bio, email, prices and themes.
   No coding knowledge needed: change only the text between the quote marks.
   NOTE: every value marked  // SAMPLE  is placeholder text — replace it.
   ========================================================================== */

window.SITE = {

  /* --- 1. Identity ------------------------------------------------------ */
  artist: {
    /* The studio name shown in the header, the browser tab and the footer.
       Change the capitalisation here if you prefer "BVK Art Studio". */
    studio: "BVK ART Studio",
    /* Your own name, as it appears in your bio and beside your signature.
       If the studio is just you, this can be your full name. */
    name: "Venkatesham",                                 // write it in full if you prefer
    /* The small line under the studio name in the header. */
    role: "Painter & Draughtsman",
    tagline: "Painter of landscapes, people and the many lives of India", // SAMPLE
    shortBio:
      "I paint what I see and what stays with me afterwards — the light on a " +
      "desert edge, a face in a market, a river town waking up. My work moves " +
      "between traditional representation and abstraction, depending on what " +
      "the subject asks for.",                           // SAMPLE
    longBio: [
      "I have been painting for over two decades, working chiefly in oils, " +
      "watercolour and charcoal. My subjects are drawn from travel and from " +
      "everyday observation: landscapes and nature studies, portraits, and " +
      "drawings of people at work and at rest.",
      "A large part of my practice is a continuing record of India — the " +
      "culture and traditions of its states, its climatic extremes from desert " +
      "to high mountain, the life of its rivers, and the public and political " +
      "life that shapes it. Alongside these I keep an abstract practice, where " +
      "the same subjects return as colour, mass and gesture rather than form.",
      "Original works are available for sale, and I accept a limited number of " +
      "commissions each year."                            // SAMPLE (rewrite in your own voice)
    ],
    location: "Huzurnagar, Suryapet District, Telangana",
    studioNote: "Studio visits by appointment.",
    portrait: "images/ui/artist.svg"                      // replace with a photo of you
  },

  /* --- 2. Contact — where enquiries reach you --------------------------- */
  contact: {
    email: "venkatesh15567@gmail.com",
    /* Left empty on purpose: a placeholder phone number on a live site sends
       real buyers to a dead line. Put your number in and it appears in the
       footer, on the contact page and as a WhatsApp button. */
    phone: "",                                            // e.g. "+91 98765 43210"
    whatsapp: "",                                         // digits only, e.g. "919876543210"
    instagram: "",                                        // your profile link
    facebook: "",                                         // e.g. your Facebook page
    youtube: ""
  },

  /* --- 3. How enquiry forms are delivered ------------------------------- *
   * "mailto"   : opens the visitor's email app with the brief filled in.
   *              Works instantly, needs no signup, but cannot carry file
   *              attachments and depends on the visitor having email set up.
   * "endpoint" : posts the form to a form service (Web3Forms, Formspree,
   *              Getform, Basin ...) which emails it to you. Recommended.
   *              Paste the service's POST URL into formEndpoint below.
   * "server"   : posts to the optional Node server in /server (see its README).
   * If an endpoint fails at send time the form falls back to mailto so an
   * enquiry is never simply lost.                                          */
  forms: {
    mode: "mailto",                                       // "mailto" | "endpoint" | "server"
    formEndpoint: "",                                     // e.g. https://api.web3forms.com/submit
    accessKey: "",                                        // Web3Forms access key, if used
    successMessage:
      "Thank you — your enquiry is on its way. I reply to every message, " +
      "usually within 2–3 working days.",
    consentText:
      "I agree that my details may be used to reply to this enquiry."
  },

  /* --- 4. Themes: the subjects you paint -------------------------------- *
   * "id" is used in the artworks file and in links. Keep ids lowercase.    */
  themes: [
    { id: "landscapes",   name: "Landscapes & Nature",       blurb: "Impressionist studies of light, weather and open country." },
    { id: "portraits",    name: "Portraits",                 blurb: "Commissioned and observed portraits in oil, charcoal and watercolour." },
    { id: "life-studies", name: "Human Life Studies",        blurb: "Drawings of people at work, at rest and in movement." },
    { id: "traditional",  name: "Traditional & Folk",        blurb: "Work in the idiom of India's classical and folk painting traditions." },
    { id: "abstract",     name: "Abstract",                  blurb: "The same subjects returned to as colour, mass and gesture." },
    { id: "india-states", name: "India: States & Traditions",blurb: "A continuing record of regional culture, dress, festival and craft." },
    { id: "world",        name: "World Cultures",            blurb: "Lifestyles and faces from beyond India." },
    { id: "deserts",      name: "Desert Life",               blurb: "Heat, distance and the people who live in it." },
    { id: "mountains",    name: "Mountain Life",             blurb: "High villages, herders and the weather of altitude." },
    { id: "rivers",       name: "Riverscapes",               blurb: "Ghats, boats, floods and river towns." },
    { id: "political",    name: "Political Life",            blurb: "Public life, protest, assembly and the crowd." }
  ],

  /* --- 5. Commission pricing guide -------------------------------------- *
   * Shown on the Commission page. These are STARTING prices, so a visitor
   * can self-qualify before writing to you. Edit freely, or set
   * commissionPricing.show = false to hide the whole table.                */
  commissionPricing: {
    show: true,
    note:
      "Indicative starting prices for 2026. Final price depends on size, " +
      "medium, number of figures and detail. Framing, delivery and taxes are " +
      "quoted separately.",                                // SAMPLE
    currency: "₹",
    tiers: [
      { work: "Portrait — head & shoulders, charcoal", size: "A3 / 30×42 cm", from: 12000 },  // SAMPLE
      { work: "Portrait — half figure, oil on canvas",  size: "45×60 cm",      from: 35000 },  // SAMPLE
      { work: "Landscape / riverscape, oil",            size: "60×90 cm",      from: 55000 },  // SAMPLE
      { work: "Large statement work, oil",              size: "90×120 cm+",    from: 110000 }, // SAMPLE
      { work: "Watercolour study",                      size: "28×38 cm",      from: 9000 }    // SAMPLE
    ]
  },

  /* --- 6. Commission process shown to the client ------------------------ */
  commissionSteps: [
    { title: "You send the brief",  text: "Use the form on this page. Tell me the subject, the wall or room it is for, your size range and your timeline." },
    { title: "We agree the scope",  text: "I reply with a quote, a size and medium recommendation, and a completion date. Nothing is charged at this stage." },
    { title: "Advance & start",     text: "A 50% advance confirms the commission and covers materials. I then send you a sketch or colour study for approval." },  // SAMPLE terms
    { title: "Work in progress",    text: "You receive progress photographs at agreed stages. One round of revisions is included at the study stage." },          // SAMPLE terms
    { title: "Completion & delivery", text: "On approval the balance is due. The work is varnished, documented, packed and shipped — insured, across India and worldwide." } // SAMPLE terms
  ],

  /* --- 7. Frequently asked questions ------------------------------------ */
  faq: [
    { q: "Do you ship outside India?",
      a: "Yes. Works are packed in a rigid crate or rolled in a tube for large canvases, and shipped insured. Shipping is quoted at cost." }, // SAMPLE
    { q: "Can I commission a painting from my own photograph?",
      a: "Yes — most portrait and house commissions begin from photographs. Clear, high-resolution images in natural light work best, and you must own or have permission to use them." },
    { q: "How long does a commission take?",
      a: "Typically four to ten weeks from approval of the study, depending on size and medium. Tell me your deadline in the form and I will say honestly whether it is possible." }, // SAMPLE
    { q: "Do you sell prints?",
      a: "Limited-edition giclée prints are available for selected works. Ask about a specific painting and I will tell you whether an edition exists." },       // SAMPLE
    { q: "Is the work certified?",
      a: "Every original leaves the studio signed, with a dated certificate of authenticity carrying the title, year, medium, dimensions and an image of the work." }, // SAMPLE
    { q: "Can I visit the studio?",
      a: "Yes, by appointment. Write to me with the dates you are in town." }
  ],

  /* --- 7b. What clients have said ---------------------------------------- *
   * EMPTY ON PURPOSE. The landing page hides this section until you add real
   * quotes. Never invent one: a collector can always be asked, and a made-up
   * testimonial is the fastest way to lose the trust the rest of the site builds.
   * Format:  { quote: "…", who: "Name", where: "City · commissioned portrait" }  */
  testimonials: [],

  /* --- 8. Exhibitions / recognition (leave empty [] to hide the section) - */
  exhibitions: [
    { year: "2025", text: "Solo — 'Rivers and Their Towns', State Gallery of Art (SAMPLE, replace)" },
    { year: "2024", text: "Group — Annual Fine Art Exhibition, Lalit Kala Akademi (SAMPLE, replace)" },
    { year: "2023", text: "Artist residency, desert districts of Rajasthan (SAMPLE, replace)" }
  ],

  /* --- 9. Sale terms shown on artwork pages ----------------------------- */
  saleTerms: [
    "Every original is signed and supplied with a certificate of authenticity.",
    "Prices are for the unframed work unless the listing says otherwise.",
    "Insured shipping across India and worldwide, quoted at cost.",
    "Once an enquiry is agreed, the work is reserved for 5 days pending payment." // SAMPLE
  ],

  /* --- 10. The studio shop: your hand-made paints and materials ---------- *
   * The products themselves live in data/products.js and are managed from
   * the Materials tab of admin.html. This section is the words around them. */
  shop: {
    show: true,                                           // false hides the shop entirely
    heading: "Paints made by hand, in the studio",        // SAMPLE
    intro:
      "I grind my own pigments and mull my own paint, because the colour that comes " +
      "out of a jar you filled yourself behaves differently on the brush. What I make " +
      "beyond my own use, I sell — in small batches, to people who want to work the " +
      "same way.",                                        // SAMPLE — rewrite in your own voice
    categories: [
      { id: "pigments", name: "Pigments",            blurb: "Hand-ground earths, minerals and lakes, sold loose by weight." },
      { id: "paints",   name: "Paints & sets",       blurb: "Mulled and poured by hand, ready to paint with." },
      { id: "mediums",  name: "Mediums & binders",   blurb: "What turns a pigment into paint." },
      { id: "grounds",  name: "Grounds & surfaces",  blurb: "Panels, papers and the grounds I prepare them with." },
      { id: "kits",     name: "Kits",                blurb: "Sets put together for someone starting out." }
    ],
    /* How an order is taken. There is no card payment on the site: an order
       becomes an email to you, and you send a payment link or UPI request. */
    orderNote:
      "Choose what you need and send the order. I reply within two working days with " +
      "the total including packing and delivery to your pin code, and a UPI or bank " +
      "transfer link. Nothing is charged on this website.",   // SAMPLE terms
    terms: [
      "Everything is made in small batches, so quantities are limited and colours vary " +
      "slightly from batch to batch. That variation is the point, not a fault.",
      "Pigments are sold as dry powder. Wear a mask when grinding, keep them off food " +
      "surfaces, and away from children.",                    // SAMPLE — keep, it is honest
      "Made-to-order colours are ground after you order; the lead time is on each item.",
      "Dispatch is within 3 working days for stocked items, by courier, across India.",  // SAMPLE
      "Powders and liquids are packed for transport, but some couriers restrict them — " +
      "confirm your city with me before ordering large quantities."
    ]
  },

  /* --- 11. Design work for spaces ---------------------------------------- */
  spaces: {
    show: true,
    heading: "Work made for a particular wall",            // SAMPLE
    intro:
      "A mural in a stairwell, a set of paintings that carries one idea across a " +
      "lobby, artwork chosen and made for a restaurant's rooms. This is design work: " +
      "it starts from your space, its light and its colours, not from what is already " +
      "in my studio.",                                     // SAMPLE
    types: [
      { name: "Murals, painted on site",  blurb: "Directly on the wall, in acrylic or mineral paint. Homes, cafés, schools, lobbies." },
      { name: "A set for one room",       blurb: "Three to nine works planned together, sized and coloured for one space." },
      { name: "Hospitality & offices",    blurb: "Hotels, restaurants and offices — a scheme across several rooms, delivered in phases." },
      { name: "One large statement work", blurb: "A single painting made to the measurements of a wall you already have in mind." }
    ],
    process: [
      { title: "Send the space",   text: "Photographs of the wall, its measurements, and what the room is for. A floor plan if you have one." },
      { title: "Site visit or call", text: "For murals and larger schemes I visit, or we walk the space together on a video call. Travel is quoted separately." },
      { title: "Concept & quote",  text: "You receive a colour concept, a scaled drawing showing the work on your wall, and a fixed quote." },   // SAMPLE
      { title: "Advance & making", text: "50% confirms the dates. Studio work is photographed as it goes; on-site work is scheduled with your builder or manager." }, // SAMPLE
      { title: "Install & hand over", text: "Murals are finished and sealed on site; studio works are delivered, hung and photographed for you." }
    ],
    pricingNote:
      "Murals are usually quoted by area and complexity, sets of works by the piece. " +
      "These are starting points for 2026; travel, scaffolding, materials for on-site " +
      "work and installation are quoted separately.",       // SAMPLE
    priced: [
      { work: "Mural, single colour ground with figures", basis: "per sq ft of wall", from: 900 },   // SAMPLE
      { work: "Mural, detailed narrative work",           basis: "per sq ft of wall", from: 2200 },  // SAMPLE
      { work: "Set of works for a room",                  basis: "per painting",      from: 45000 }, // SAMPLE
      { work: "Concept & colour scheme only",             basis: "per space",         from: 25000 }  // SAMPLE
    ]
  }
};
