# KDP Profit Machine — Elementor Import Guide

Poori landing page **59 alag Elementor sections** mein convert ho chuki hai.

## Folder Structure

```
elementor/
├── kdp-mafia-full-page.json    ← Poori page ek shot mein (59 sections)
├── manifest.json               ← Section list + order
├── elementor-custom.css        ← Saari styling (styles.css copy)
├── elementor-custom.js         ← Countdown, marquee, sticky bar, scroll
├── generate-elementor-json.py  ← Dobara generate karne ke liye
└── sections/                   ← Har section alag JSON (01–59)
    ├── 01-top-ticker-bar-dime-sale-ticker.json
    ├── 02-header.json
    ├── 03-hero-section-....json
    └── ... (59 files total)
```

---

## Step 1 — WordPress Setup

1. **Elementor** (free ya Pro) install karo
2. **Poppins font:** Elementor → Site Settings → Global Fonts → Primary = Poppins  
   (Google Fonts se auto load hoga)
3. Naya page banao: **"KDP Profit Machine Landing"**
4. Page template: **Elementor Canvas** (header/footer hide)

---

## Step 2 — CSS & JS Add Karo (Zaroori)

Design bina iske nahi dikhega.

### CSS
**Elementor → Site Settings → Custom CSS**  
Poora `elementor-custom.css` paste karo.

### JavaScript
**Elementor → Custom Code → Footer** (ya theme footer)  
Poora `elementor-custom.js` paste karo.

> Ya **Code Snippets** plugin se site-wide enqueue karo.

---

## Step 3 — Images Upload Karo

`assets/` folder ki saari images WordPress Media Library mein upload karo:

```
/wp-content/uploads/kdp-mafia/assets/
  ├── logo.png
  ├── bundle.png
  ├── analytics_3d.png
  └── ... (baaki sab)
```

JSON mein paths already set hain:  
`/wp-content/uploads/kdp-mafia/assets/logo.png`

Agar alag folder use karo to **Find & Replace** karo JSON files mein.

---

## Step 4 — Full Page Import (Recommended)

1. Page kholo → **Edit with Elementor**
2. Left panel → **Folder icon** (Templates) → **Import**
3. `kdp-mafia-full-page.json` select karo
4. **Insert** / Replace karo
5. **Update** save karo

Ab Navigator mein **59 sections** dikhengi — har ek alag edit ho sakti hai.

---

## Step 5 — Section-by-Section Import (Optional)

Agar ek-ek karke lagana ho:

1. Khali Elementor page kholo
2. Har file `sections/01-...json` se `59-...json` tak import karo
3. Order `manifest.json` ke hisaab se rakho

---

## Step 6 — Checkout URL Update

Sirf **1 jagah** real checkout URL daalo:

Section **52** (Offer / Pricing box) → HTML widget →  
`Grab KDP Profit Machine Now!` button ka href:

```
https://checkout.example.com/kdp-mafia
```

Apna real checkout link yahan lagao.

Baaki saare CTAs `#checkout` pe scroll karte hain (JS se).

---

## Elementor Mein Edit Kaise Karein

| Section type | Kaise edit |
|---|---|
| Simple text/button | HTML widget kholo → code edit |
| Better editing chahiye | HTML widget hata ke native Heading / Text / Button widgets lagao |
| Section background | Section → Style → Background |
| Section name | Navigator mein `_title` dikhega (01. Hero, 04. Trust Bar...) |

Har section = **1 Elementor Section → 1 Column → 1 HTML Widget**

---

## 59 Sections List

| # | Section |
|---|---------|
| 01 | Top Ticker Bar |
| 02 | Header |
| 03 | Hero |
| 04 | Trust Bar (Marquee) |
| 05 | Royalty Proof |
| 06–10 | Problem / Opportunity / Walls |
| 11–17 | Solution + 6 Team Roles |
| 18 | 4-Step Workflow |
| 19 | CTA Break #1 |
| 20–23 | USP Matrix + Book Types |
| 24 | CTA Break #2 |
| 25–34 | Feature Suite (20–29) |
| 35–37 | Demo + Who For + Benefits |
| 38–42 | Profit Angles (5) |
| 43–45 | Comparison + Testimonials + Why Now |
| 46–50 | Objection Killers (5) |
| 51 | Bonuses |
| 52 | **Pricing / Checkout (#checkout)** |
| 53 | CTA Break #3 |
| 54 | FAQ |
| 55–57 | Close + Final CTA + P.S. |
| 58 | Footer |
| 59 | Sticky Bar |

Full detail: `manifest.json`

---

## Dobara Generate Karna

Agar `index.html` change karo:

```bash
python elementor/generate-elementor-json.py
```

---

## Known Limits

- HTML widgets Elementor visual editor mein live preview limited dete hain — **Preview page** se check karo
- Sticky footer ke liye JS zaroori hai
- Tables / complex layout HTML widget mein hain — baad mein Elementor Table widget se replace kar sakte ho
- `initCtaBreakSections()` Elementor mein zaroori nahi — CTA Break sections already full HTML ke saath import hain

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Design broken | CSS add kiya? Poppins set kiya? |
| Images nahi dikh rahi | Media upload path check karo |
| Countdown / marquee nahi chal raha | JS footer mein add karo |
| Import fail | Elementor update karo; file `0.4` version compatible hai |
| Section order galat | `manifest.json` order follow karo |
