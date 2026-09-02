/* =============================================================================
   products.js — THE STUDIO SHOP: your hand-made paints, pigments and materials.
   Managed from admin.html (the "Materials" tab), same as the paintings.
   -----------------------------------------------------------------------------
   category:  must match a category id in site.js -> shop.categories
   status:    "instock" | "madetoorder" | "soldout"
   price:     a number in rupees, or null for "Price on request"
   unit:      what one order gets you — "50 g jar", "12 half pans", "5 sheets"
   madeFrom:  the raw material. For hand-made pigments this is the whole story.
   lead:      how long before it ships, for made-to-order items
   -----------------------------------------------------------------------------
   Everything below is SAMPLE DATA with placeholder images and INVENTED PRICES.
   Replace it with your own materials before the site goes public.
   ========================================================================== */

window.PRODUCTS = [
  {
    "id": "indian-yellow-pigment",
    "name": "Indian Yellow",
    "category": "pigments",
    "unit": "50 g jar",
    "price": 850,
    "status": "instock",
    "batch": "Batch 04 · 2026",
    "madeFrom": "Hand-ground and levigated in the studio; a warm transparent yellow.",
    "notes": "Grind with gum arabic for watercolour, or with stand oil for oils. Lightfastness tested over six months on the studio wall.",
    "image": "images/products/indian-yellow-pigment.svg",
    "featured": true
  },
  {
    "id": "lapis-blue-pigment",
    "name": "Lapis Ultramarine",
    "category": "pigments",
    "unit": "25 g jar",
    "price": 4200,
    "status": "madetoorder",
    "lead": "2–3 weeks",
    "batch": "Ground to order",
    "madeFrom": "Natural lapis lazuli, washed and separated by hand over several days.",
    "notes": "The old blue. Expensive because the process is slow, not because it is rare. Made only to order, in small quantities.",
    "image": "images/products/lapis-blue-pigment.svg",
    "featured": true
  },
  {
    "id": "red-ochre-kutch",
    "name": "Kutch Red Ochre",
    "category": "pigments",
    "unit": "100 g jar",
    "price": 450,
    "status": "instock",
    "batch": "Batch 11 · 2026",
    "madeFrom": "Earth collected on painting trips, washed, dried and ground.",
    "notes": "An opaque earth red that behaves well in every medium.",
    "image": "images/products/red-ochre-kutch.svg",
    "featured": false
  },
  {
    "id": "lamp-black-pigment",
    "name": "Lamp Black",
    "category": "pigments",
    "unit": "50 g jar",
    "price": 380,
    "status": "instock",
    "batch": "Batch 09 · 2026",
    "madeFrom": "Soot collected from oil lamps, in the traditional way.",
    "notes": "Very fine, very strong. A little goes a long way.",
    "image": "images/products/lamp-black-pigment.svg",
    "featured": false
  },
  {
    "id": "malachite-green-pigment",
    "name": "Malachite Green",
    "category": "pigments",
    "unit": "25 g jar",
    "price": 3600,
    "status": "madetoorder",
    "lead": "2–3 weeks",
    "madeFrom": "Mineral malachite, hand-ground; the coarser the grind, the deeper the green.",
    "notes": "Tell me in your order whether you want a coarse or fine grind.",
    "image": "images/products/malachite-green-pigment.svg",
    "featured": false
  },
  {
    "id": "earth-watercolour-set",
    "name": "Earth Watercolour Set",
    "category": "paints",
    "unit": "12 half pans in a tin",
    "price": 2400,
    "status": "instock",
    "batch": "Batch 06 · 2026",
    "madeFrom": "My own pigments, hand-mulled with gum arabic and honey, poured into pans.",
    "notes": "The palette I actually travel with: six earths, two yellows, two blues, a green and a black.",
    "image": "images/products/earth-watercolour-set.svg",
    "featured": true
  },
  {
    "id": "earth-pigment-starter",
    "name": "Starter Set — Six Earths",
    "category": "kits",
    "unit": "6 × 30 g jars",
    "price": 2900,
    "status": "instock",
    "batch": "Batch 03 · 2026",
    "madeFrom": "Six hand-ground earth pigments with a printed sheet on how to bind them.",
    "notes": "The set I recommend to anyone grinding their own paint for the first time.",
    "image": "images/products/earth-pigment-starter.svg",
    "featured": true
  },
  {
    "id": "gum-arabic-binder",
    "name": "Gum Arabic Binder",
    "category": "mediums",
    "unit": "100 ml bottle",
    "price": 520,
    "status": "instock",
    "batch": "Batch 12 · 2026",
    "madeFrom": "Prepared in the studio, strained, with a little honey and clove oil.",
    "notes": "For mulling watercolour and gouache. Keeps six months in a cool place.",
    "image": "images/products/gum-arabic-binder.svg",
    "featured": false
  },
  {
    "id": "chalk-ground-gesso",
    "name": "Chalk Ground",
    "category": "grounds",
    "unit": "250 g tub",
    "price": 600,
    "status": "instock",
    "batch": "Batch 08 · 2026",
    "madeFrom": "Chalk and rabbit-skin-free size, mixed for panels and boards.",
    "notes": "Two thin coats, sanded between, gives the surface I use for portrait panels.",
    "image": "images/products/chalk-ground-gesso.svg",
    "featured": false
  },
  {
    "id": "cotton-rag-paper",
    "name": "Cotton Rag Paper",
    "category": "grounds",
    "unit": "5 sheets · 38 × 56 cm",
    "price": 900,
    "status": "instock",
    "madeFrom": "Handmade cotton rag paper, cold pressed, sized for watercolour.",
    "notes": "Bought from a papermaker I have used for years, not made by me — sold on because it suits these paints.",
    "image": "images/products/cotton-rag-paper.svg",
    "featured": false
  }
];
