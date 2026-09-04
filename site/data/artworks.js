/* =============================================================================
   artworks.js — the gallery. Written by the Studio Panel on 2026-09-04T01:57:10.699Z.
   ========================================================================== */

/* -----------------------------------------------------------------------------
   THE THREE ENTRIES AT THE TOP are Venkatesham's own paintings, written up ready
   for their photographs. Open admin.html, click the entry, drop the photograph
   on it, and the image, size and file name fill in by themselves.

   Their titles are working titles, not his — rename them. Year, medium, size,
   price and the story behind each are deliberately left empty rather than
   guessed at.
   -------------------------------------------------------------------------- */

window.ARTWORKS = [
  {
    "id": "farmhouse-in-the-foothills",
    "title": "Farmhouse in the Foothills",
    "year": null,
    "themes": [
      "landscapes"
    ],
    "style": "",
    "medium": "",
    "w_cm": null,
    "h_cm": null,
    "price": null,
    "status": "available",
    "prints": false,
    "framed": false,
    "place": "",
    "story": "",
    "image": "",
    "featured": false
  },
  {
    "id": "portrait-in-lockdown",
    "title": "Portrait in Lockdown",
    "year": null,
    "themes": [
      "portraits",
      "abstract",
      "political"
    ],
    "style": "Abstract",
    "medium": "",
    "w_cm": null,
    "h_cm": null,
    "price": null,
    "status": "available",
    "prints": false,
    "framed": false,
    "place": "",
    "story": "",
    "image": "",
    "featured": false
  },
  {
    "id": "two-cranes-at-sunrise",
    "title": "Two Cranes at Sunrise",
    "year": 2025,
    "themes": [
      "landscapes"
    ],
    "style": "",
    "medium": "",
    "w_cm": null,
    "h_cm": null,
    "price": null,
    "status": "available",
    "prints": false,
    "framed": false,
    "place": "",
    "story": "",
    "image": "",
    "featured": false
  },
  {
    "id": "the-dancer",
    "title": "The Dancer",
    "year": null,
    "themes": [
      "abstract",
      "life-studies",
      "traditional"
    ],
    "style": "",
    "medium": "",
    "w_cm": null,
    "h_cm": null,
    "price": null,
    "status": "available",
    "prints": false,
    "framed": false,
    "place": "",
    "story": "",
    "image": "",
    "featured": false
  },
  {
    "id": "dawn-over-the-dunes",
    "title": "Dawn over the Dunes",
    "year": 2025,
    "themes": [
      "deserts",
      "landscapes"
    ],
    "style": "Impressionist",
    "medium": "Oil on canvas",
    "w_cm": 90,
    "h_cm": 60,
    "price": 68000,
    "status": "available",
    "prints": true,
    "framed": false,
    "place": "Jaisalmer, Rajasthan",
    "story": "Painted over four mornings from the same ridge. The dunes change colour twice before the heat arrives, and I wanted the second change — the moment the sand stops being pink and becomes ochre.",
    "image": "images/works/dawn-over-the-dunes.svg",
    "featured": true
  },
  {
    "id": "the-water-carrier",
    "title": "The Water Carrier",
    "year": 2024,
    "themes": [
      "deserts",
      "life-studies"
    ],
    "style": "Realist",
    "medium": "Watercolour on paper",
    "w_cm": 28,
    "h_cm": 38,
    "price": 14000,
    "status": "sold",
    "prints": true,
    "framed": true,
    "place": "Barmer district, Rajasthan",
    "story": "A study made in an afternoon, of a walk that is made twice a day.",
    "image": "images/works/the-water-carrier.svg",
    "featured": false
  },
  {
    "id": "spiti-crossing",
    "title": "Spiti Crossing",
    "year": 2025,
    "themes": [
      "mountains",
      "landscapes"
    ],
    "style": "Impressionist",
    "medium": "Oil on canvas",
    "w_cm": 76,
    "h_cm": 101,
    "price": 92000,
    "status": "available",
    "prints": false,
    "framed": false,
    "place": "Spiti Valley, Himachal Pradesh",
    "story": "Cold light, thin air, and a bridge that has been rebuilt four times.",
    "image": "images/works/spiti-crossing.svg",
    "featured": true
  },
  {
    "id": "herder-at-the-pass",
    "title": "Herder at the Pass",
    "year": 2024,
    "themes": [
      "mountains",
      "portraits",
      "life-studies"
    ],
    "style": "Line drawing",
    "medium": "Charcoal on paper",
    "w_cm": 30,
    "h_cm": 42,
    "price": 18000,
    "status": "available",
    "prints": true,
    "framed": false,
    "place": "Zanskar range",
    "story": "Twenty minutes of sitting still, which is a long time when it is that cold.",
    "image": "images/works/herder-at-the-pass.svg",
    "featured": false
  },
  {
    "id": "ghats-at-first-light",
    "title": "Ghats at First Light",
    "year": 2025,
    "themes": [
      "rivers",
      "landscapes",
      "india-states"
    ],
    "style": "Impressionist",
    "medium": "Oil on canvas",
    "w_cm": 90,
    "h_cm": 60,
    "price": 74000,
    "status": "reserved",
    "prints": true,
    "framed": false,
    "place": "Varanasi, Uttar Pradesh",
    "story": "The river gives back more light than the sky does at that hour.",
    "image": "images/works/ghats-at-first-light.svg",
    "featured": true
  },
  {
    "id": "boatman-varanasi",
    "title": "Boatman",
    "year": 2023,
    "themes": [
      "rivers",
      "life-studies",
      "portraits"
    ],
    "style": "Realist",
    "medium": "Ink and wash on paper",
    "w_cm": 30,
    "h_cm": 42,
    "price": 16000,
    "status": "available",
    "prints": false,
    "framed": false,
    "place": "Varanasi, Uttar Pradesh",
    "story": "Drawn from the boat, which is why the horizon is not straight.",
    "image": "images/works/boatman-varanasi.svg",
    "featured": false
  },
  {
    "id": "monsoon-fields",
    "title": "Monsoon Fields",
    "year": 2024,
    "themes": [
      "landscapes",
      "india-states"
    ],
    "style": "Impressionist",
    "medium": "Acrylic on canvas",
    "w_cm": 60,
    "h_cm": 60,
    "price": 46000,
    "status": "available",
    "prints": true,
    "framed": false,
    "place": "Konaseema, Andhra Pradesh",
    "story": "Three greens, and the water underneath doing most of the work.",
    "image": "images/works/monsoon-fields.svg",
    "featured": false
  },
  {
    "id": "grandmother-kutch",
    "title": "Grandmother, Kutch",
    "year": 2025,
    "themes": [
      "portraits",
      "india-states",
      "traditional"
    ],
    "style": "Realist",
    "medium": "Oil on canvas board",
    "w_cm": 45,
    "h_cm": 60,
    "price": 52000,
    "status": "available",
    "prints": false,
    "framed": true,
    "place": "Bhuj, Gujarat",
    "story": "Her embroidery took a year. The portrait took nine days.",
    "image": "images/works/grandmother-kutch.svg",
    "featured": true
  },
  {
    "id": "pichwai-notes",
    "title": "Pichwai Notes",
    "year": 2024,
    "themes": [
      "traditional",
      "india-states"
    ],
    "style": "Traditional",
    "medium": "Gouache and gold on paper",
    "w_cm": 40,
    "h_cm": 50,
    "price": 38000,
    "status": "available",
    "prints": true,
    "framed": true,
    "place": "Nathdwara, Rajasthan",
    "story": "Working in a tradition is not copying it; it is learning what the rules were for before you decide which one to keep.",
    "image": "images/works/pichwai-notes.svg",
    "featured": false
  },
  {
    "id": "festival-of-colour",
    "title": "Festival of Colour",
    "year": 2023,
    "themes": [
      "india-states",
      "traditional",
      "life-studies"
    ],
    "style": "Impressionist",
    "medium": "Acrylic on canvas",
    "w_cm": 90,
    "h_cm": 120,
    "price": 130000,
    "status": "sold",
    "prints": true,
    "framed": false,
    "place": "Mathura, Uttar Pradesh",
    "story": "Painted afterwards, from memory and from very dirty clothes.",
    "image": "images/works/festival-of-colour.svg",
    "featured": false
  },
  {
    "id": "assembly",
    "title": "Assembly",
    "year": 2025,
    "themes": [
      "political",
      "life-studies"
    ],
    "style": "Realist",
    "medium": "Oil on canvas",
    "w_cm": 100,
    "h_cm": 120,
    "price": null,
    "status": "nfs",
    "prints": false,
    "framed": false,
    "place": "—",
    "story": "Part of a continuing series on public life and the crowd. Currently on loan for exhibition and not for sale.",
    "image": "images/works/assembly.svg",
    "featured": false
  },
  {
    "id": "march-in-the-rain",
    "title": "March in the Rain",
    "year": 2024,
    "themes": [
      "political",
      "life-studies"
    ],
    "style": "Line drawing",
    "medium": "Charcoal and wash on paper",
    "w_cm": 50,
    "h_cm": 70,
    "price": 28000,
    "status": "available",
    "prints": false,
    "framed": false,
    "place": "—",
    "story": "Umbrellas make a crowd read as one body rather than many.",
    "image": "images/works/march-in-the-rain.svg",
    "featured": false
  },
  {
    "id": "delta-abstract-iii",
    "title": "Delta III",
    "year": 2025,
    "themes": [
      "abstract",
      "rivers"
    ],
    "style": "Abstract",
    "medium": "Mixed media on canvas",
    "w_cm": 80,
    "h_cm": 80,
    "price": 64000,
    "status": "available",
    "prints": false,
    "framed": false,
    "place": "—",
    "story": "The same river as the Varanasi paintings, reduced to its silt.",
    "image": "images/works/delta-abstract-iii.svg",
    "featured": true
  },
  {
    "id": "market-morning-marrakesh",
    "title": "Market Morning, Marrakesh",
    "year": 2023,
    "themes": [
      "world",
      "life-studies"
    ],
    "style": "Impressionist",
    "medium": "Watercolour on paper",
    "w_cm": 38,
    "h_cm": 56,
    "price": 24000,
    "status": "available",
    "prints": true,
    "framed": false,
    "place": "Marrakesh, Morocco",
    "story": "A different desert, and a very similar morning.",
    "image": "images/works/market-morning-marrakesh.svg",
    "featured": false
  },
  {
    "id": "summer-heat-abstract",
    "title": "Summer Heat",
    "year": 2024,
    "themes": [
      "abstract",
      "deserts"
    ],
    "style": "Abstract",
    "medium": "Acrylic on canvas",
    "w_cm": 70,
    "h_cm": 70,
    "price": 42000,
    "status": "available",
    "prints": false,
    "framed": false,
    "place": "—",
    "story": "An attempt to paint a temperature rather than a place.",
    "image": "images/works/summer-heat-abstract.svg",
    "featured": false
  }
];
