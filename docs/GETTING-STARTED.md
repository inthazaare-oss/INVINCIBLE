# Your website — a plain-language guide

No programming needed for anything in this guide.

The site now covers **three** things you sell:

1. **Finished paintings** — the gallery, with prices and enquiry forms.
2. **Work made to order** — commissions (`commission.html`) and design work for a
   particular room, wall or building (`spaces.html`).
3. **Hand-made paints and materials** — the studio shop (`shop.html`), where a visitor
   picks what they want and sends you an itemised order.

---

## 1. What the site is made of

```
site/
  index.html        the front page
  gallery.html      all your work, with filters
  artwork.html      one painting, with its price and an enquiry form
  commission.html   the booking form clients fill in
  about.html        your story
  contact.html      contact details, message form, FAQ
  spaces.html       design work for rooms, walls and buildings
  shop.html         your hand-made paints, pigments and materials
  admin.html        YOUR panel: paintings AND materials  ← not for visitors
  data/site.js      all the words: your name, bio, email, prices, FAQ, shop and spaces text
  data/artworks.js  the gallery itself (the admin panel writes this for you)
  data/products.js  the shop itself (the admin panel writes this too)
  images/works/     photographs of your paintings
  images/products/  photographs of your paints and materials
server/             OPTIONAL. Only if you want uploads and publishing automated.
```

Two files hold everything that is personal to you: **`site/data/site.js`** (words)
and **`site/data/artworks.js`** (paintings). Nothing else needs touching.

---

## 2. First things to change

Open `site/data/site.js` in any text editor (Notepad, TextEdit, VS Code). Change only
the text between quote marks. Every line marked `// SAMPLE` is placeholder text
written for you as an example — replace it with your own.

The site is named **BVK ART Studio**; that name lives in `artist.studio` and appears in
the header, the footer, every browser tab and every link preview. Change it there and it
changes everywhere.

Change at minimum:

| What | Where |
|---|---|
| The studio name in the header and browser tab | `artist.studio` — currently **BVK ART Studio** |
| The small line under it | `artist.role` |
| Your own name, for your bio and signature | `artist.name` |
| One-line description | `artist.tagline` |
| Your bio | `artist.shortBio` and `artist.longBio` |
| **Your email address** | `contact.email` — this is where every enquiry goes |
| Phone / WhatsApp / Instagram | `contact.*` — leave `""` to hide one |
| Commission prices | `commissionPricing.tiers` |
| Shop introduction, categories, order terms | `shop` |
| Space-work types, process and prices | `spaces` |
| Commission terms (advance %, revisions) | `commissionSteps` |
| Exhibitions | `exhibitions` — set to `[]` to hide the section |

Save the file and refresh the page in your browser. That is the whole edit cycle.

---

## 3. Adding your paintings

1. Open **`site/admin.html`** in your browser.
2. Press **+ Add a work**.
3. Type the title, then drag the photograph onto the drop area. The panel prepares it
   for the web automatically: it trims any flat black or white border (the bars you get
   from screenshots and video frames), resizes it in careful steps to 2000 pixels on its
   longest side, pulls the darkest and lightest parts back to true black and white, lifts
   the colour a little, and sharpens gently. Hold *"hold to see the original"* under the
   preview to judge the change, or switch **Improve photographs automatically** off at the
   top of the panel to keep a photograph exactly as taken.

   It cannot invent detail that is not in the photograph. Flat daylight, no flash, camera
   square to the canvas, cropped to the edge of the work — that is still what makes the
   difference.
4. Fill in year, size, medium, price and which of your series it belongs to.
5. Press **Save this work**.
6. When you have added everything, press **Export gallery file**. Your browser
   downloads `artworks.js`. Also press **Download image file** for each painting.
7. Put the downloaded `artworks.js` into your website's `data/` folder (replacing
   the old one), and the images into `images/works/`. Your site is updated.

*(Step 6–7 disappear if you run the optional server — see section 6 — where a single
**Publish live** button does all of it.)*

Photographing paintings: flat daylight, no flash, camera square to the canvas, crop
to the edge of the work. A good photograph sells; a yellow, tilted one does not.

---

### Six entries are already waiting for you

**Buddha Head**, **Still Life with Wine and Grapes**, **Farmhouse in the Foothills**,
**Portrait in Lockdown**, **Two Cranes at Sunrise** and **The Dancer** are in the panel with
no photograph yet. Click one, drop its photograph on it, and the image fills in by itself.
Those are working titles — rename them to whatever you actually call the paintings, and add
the year, medium, size and price while you are there.

## 3b. Adding your paints and materials

Same panel, second tab.

1. Open **`site/admin.html`** and press **Materials** at the top.
2. Press **+ Add a material**, name it, and drop in a photograph. A jar against a plain
   background with a brushed swatch of the colour beside it sells better than the jar alone.
3. Fill in what one order gets (`50 g jar`, `12 half pans`), the price, and whether it is
   in stock or ground to order.
4. **Made from** is the field that matters most. "Earth collected on painting trips,
   washed and ground" is why someone buys your ochre instead of a factory tube.
5. Save, then **Export shop file** (or **Publish live**) exactly as with paintings — the
   file is `products.js`, and it goes in your site's `data/` folder.

### How an order actually works

There is no card payment on the site, on purpose. A visitor adds jars to their order and
sends it; you receive an itemised email — quantities, sizes, and the items total. You
reply with the real total including packing and postage to their pin code, and a UPI or
bank transfer request.

That is deliberate: postage for jars of pigment is never a flat rate, and a payment
gateway costs money and paperwork you do not need for your first hundred orders. When
orders outgrow it, adding a gateway is a contained job — the shop already knows what is
in the basket.

Two things to get right before you sell materials:

- **Labelling.** Put the colour name, the batch, the weight and a safety line on the jar.
  Pigment powders are not food; say so on the label and in the shop terms (there is
  already a line about this in `site/data/site.js` — keep it).
- **Postage.** Ask your courier what they will and will not carry. Powders and liquids are
  sometimes restricted, especially by air. I have written that caution into the shop terms;
  confirm the specifics for your own courier and city.

### Doing it from a computer instead

If the photographs are already on a computer, one command prepares a whole folder of them —
the same trimming, resizing, levels, colour and sharpening the panel does:

```bash
pip install Pillow
python3 tools/enhance-photos.py ~/Desktop/paintings/          # → site/images/works/
python3 tools/enhance-photos.py photo.jpg --name two-cranes-at-sunrise
python3 tools/enhance-photos.py ~/Desktop/pigments/ --products
```

Then open the panel and point each entry at its file.

---

## 4. Making enquiries reach your inbox

Out of the box the site uses **`mailto`**: when a visitor presses Send, their own
email programme opens with the enquiry already written out. It works everywhere with
no setup, but it depends on the visitor having email configured, and it cannot carry
attachments.

For a proper form that emails you directly, sign up for a free form service —
[Web3Forms](https://web3forms.com) and [Formspree](https://formspree.io) are the
common ones — and put its address into `site/data/site.js`:

```js
forms: {
  mode: "endpoint",
  formEndpoint: "https://api.web3forms.com/submit",
  accessKey: "paste-your-access-key-here",
  ...
}
```

If a send ever fails, the form falls back to `mailto` automatically and shows your
email address, so an enquiry is never simply lost.

---

## 5. Putting the site on the internet

The `site/` folder is a complete website. Any of these work, and the first two are free:

- **Netlify / Cloudflare Pages** — drag the `site` folder onto their upload page.
- **GitHub Pages** — push this repository and point Pages at the `site` folder.
- **Any ordinary web host (cPanel, Hostinger, etc.)** — upload the contents of
  `site/` by FTP into `public_html`.

Buy a domain in your own name (`yourname.com` or `.in`) rather than using a free
subdomain — it costs a few hundred rupees a year and it is your address for decades.

**One caution:** on plain hosting, `admin.html` is a public address. Anyone who
guesses it can open it and play with their own copy, though they cannot change your
live gallery (that needs your hosting password). If you would rather it were locked,
either rename the file to something only you know, delete it from the uploaded copy
and keep it locally, or run the server below, which puts a password on it.

---

## 6. The optional studio server

Only worth it if you would like: real uploads, one-click publishing, a stored copy of
every enquiry, and a password on your panel. It needs Node.js installed, and nothing
else — no `npm install`.

```bash
STUDIO_PASSWORD="something-only-you-know" node server/server.mjs
# then open http://localhost:4000
```

Full options are in `server/README.md`.

---

## 7. Things worth doing in the first month

1. Replace every `// SAMPLE` line in `site/data/site.js` with your own words.
2. Photograph and add 15–25 works — enough that the filters feel worth using.
3. Write two or three sentences of story for each painting. This is what makes a
   stranger write to you, more than the price does.
3b. Photograph your materials the same way, and give each colour its "made from" line.
4. Set up a real form endpoint (section 4) and send yourself a test enquiry.
5. Put the site's address in your Instagram bio, and on the back of your business card.
