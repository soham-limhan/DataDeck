# ▫ DataDeck Design System
### *Maximalism, in white.*

---

## ❖ 1. Philosophy

Most "white" interfaces are minimal: empty, quiet, sterile. DataDeck rejects that.

**DataDeck is maximalist — and its entire world is white.**

The richness comes from *layering*, not from color: dozens of tonal whites, deep shadows, embossed edges, fine textures, ornate typography, dense information, decorative rules and glyphs. Think **an ivory-and-marble archive**, a **cut-paper pop-up book**, a **printed atlas** — abundant, ornamented, tactile, and entirely pale.

> **Rule of the system:** *If a surface can carry detail, it should.*
> **Counter-rule:** *Detail must never cost legibility.*

---

## ❖ 2. Palette — The Whites

Twelve named whites. Each has a job. No hue, no saturation — only warmth and depth.

| Token | Hex | Name | Use |
|---|---|---|---|
| `--white-100` | `#FFFFFF` | **Paper** | Cards in focus, modals, highest elevation |
| `--white-90` | `#FDFDFB` | **Snow** | Primary page background |
| `--white-80` | `#FAF9F5` | **Ivory** | Panels, sidebars |
| `--white-70` | `#F5F3EC` | **Pearl** | Inset wells, input fields |
| `--white-60` | `#EFECE3` | **Linen** | Hover states, table zebra |
| `--white-50` | `#E8E4D9` | **Bone** | Borders, dividers |
| `--white-40` | `#DDD8CA` | **Chalk** | Strong borders, ornament strokes |
| `--white-30` | `#CEC8B8` | **Plaster** | Disabled text, grid lines |
| `--white-20` | `#B9B3A1` | **Fog** | Secondary icons, axis ticks |
| `--white-10` | `#A39D8A` | **Ash-white** | Tertiary text, chart secondary strokes |
| `--ink` | `#1C1B18` | **Ink** | Primary text — the single necessary dark |
| `--ink-soft` | `#4A4840` | **Graphite** | Secondary text |

### ⚠ A necessary honesty about ink
Text needs contrast, so **Ink** and **Graphite** are the only non-white tones. They are used for type, data marks, and nothing else. Everything the user *sees as a surface* is white.

### Contrast targets
- Body text (`--ink` on `--white-90`): **≥ 15:1**
- Secondary text (`--ink-soft` on `--white-80`): **≥ 8:1**
- Chart marks must always reach **≥ 3:1** against their background

### Optional escape hatch
If charts become hard to distinguish, introduce **one** accent in a later phase (a single desaturated tone), never a rainbow. This is a decision to revisit at the Compose stage, not now.

---

## ❖ 3. Elevation — Depth Without Color

Because color can't separate layers, **shadow and highlight do all the work.**

```css
:root {
  /* Soft, warm shadows — never pure black */
  --shadow-1: 0 1px 2px rgba(60, 50, 30, .06), 0 1px 1px rgba(60, 50, 30, .04);
  --shadow-2: 0 4px 10px rgba(60, 50, 30, .07), 0 2px 4px rgba(60, 50, 30, .05);
  --shadow-3: 0 12px 28px rgba(60, 50, 30, .09), 0 4px 8px rgba(60, 50, 30, .05);
  --shadow-4: 0 24px 56px rgba(60, 50, 30, .12), 0 8px 16px rgba(60, 50, 30, .06);

  /* Emboss: top highlight + bottom shade */
  --emboss: inset 0 1px 0 rgba(255,255,255,.95), inset 0 -1px 0 rgba(120,105,70,.10);
  /* Deboss: for inputs and wells */
  --deboss: inset 0 2px 4px rgba(90, 75, 40, .10), inset 0 -1px 0 rgba(255,255,255,.9);
}
```

| Layer | Surface | Shadow |
|---|---|---|
| 0 — Page | Snow | none |
| 1 — Panel | Ivory | `--shadow-1` + `--emboss` |
| 2 — Card | Paper | `--shadow-2` + `--emboss` |
| 3 — Raised / hover | Paper | `--shadow-3` |
| 4 — Modal | Paper | `--shadow-4` |
| Inputs | Pearl | `--deboss` |

---

## ❖ 4. Typography — The Ornamental Voice

Maximalism lives in type. Mix **three** families with strong contrast.

| Role | Family | Style |
|---|---|---|
| **Display** | *Fraunces* (or *Playfair Display*) | Variable, high-contrast, italics for flourish, 56–120px |
| **Body / UI** | *Inter* or *DM Sans* | 14–16px, tight tracking |
| **Data / Code** | *JetBrains Mono* | Tabular numerals, 12–13px |
| **Accent** | *Cormorant Garamond Italic* | Captions, pull-quotes, card subtitles |

```css
--font-display: "Fraunces", "Playfair Display", serif;
--font-body:    "Inter", "DM Sans", system-ui, sans-serif;
--font-mono:    "JetBrains Mono", ui-monospace, monospace;
--font-accent:  "Cormorant Garamond", Georgia, serif;
```

**Typographic habits**
- Headlines: huge, tightly tracked, mixed roman + italic in the same line
- Section labels: `UPPERCASE · LETTER-SPACED · 0.18em` with a ❖ ornament
- Numbers: always tabular, always mono
- Drop caps on long-form insight panels
- Small-caps for metadata

---

## ❖ 5. Ornament Library

Decoration is a feature. A standard set of reusable ornaments:

| Ornament | Glyph / Technique | Use |
|---|---|---|
| Section mark | `❖` `◈` `▫` `◻︎` | Section headers, bullets |
| Divider | Double rule + centered glyph: `──── ❖ ────` | Between sections |
| Corner brackets | CSS borders on card corners (⌜ ⌝ ⌞ ⌟) | Card framing |
| Guilloché | SVG repeating curve pattern in `--white-50` | Card headers, backgrounds |
| Fine grid | 8px dotted grid in `--white-60` | Chart canvases |
| Paper grain | SVG noise at 3–4% opacity | Page background |
| Index numerals | `№ 01`, `§ 02`, `Fig. 3` | Labels everywhere |
| Stamps | Circular text-on-path seals | Status: "CLEANED", "FORECAST", "EXPORTED" |
| Ribbon tabs | Notched tab shapes | Stage navigation |

**Density rule:** every screen should feel *full* — at least three ornament types visible at any time — while text remains perfectly readable.

---

## ❖ 6. Texture & Material

Layer these over `--white-90`:

```css
body {
  background:
    url("/textures/grain.svg"),                              /* paper grain, 4% */
    radial-gradient(1200px 600px at 10% -10%, #FFFFFF 0%, transparent 60%),
    radial-gradient(900px 500px at 100% 0%, #F5F3EC 0%, transparent 55%),
    var(--white-90);
}
```

Surface "materials":
- **Vellum** — translucent Paper at 70% opacity + `backdrop-filter: blur(12px)`
- **Cardstock** — Paper + embossed edge + subtle grain
- **Linen** — fine crosshatch pattern in `--white-60`
- **Marble** — very slow, low-contrast SVG turbulence on hero areas

---

## ❖ 7. Layout — The Deck

The product metaphor is a **deck of cards**. The layout embraces it.

- **Stage Rail** (left): four numbered ribbon tabs — ① Ingest · ② Cleanse · ③ Forecast · ④ Compose
- **Card Stack** (center): the active stage is the top card; previous stages fan behind it with slight rotation (±1.5°) and stacked shadow
- **Inspector** (right): lineage log, column details, parameters
- **Marquee Bar** (top): project title in display type, run status stamp, breadcrumb of transformations

Grid: **12 columns**, 24px gutters, 8px base unit. Cards snap to the grid but are allowed to *overlap by 8–16px* for the layered look.

---

## ❖ 8. Components

### Cards
- Radius `14px`, Paper surface, `--shadow-2` + `--emboss`
- 1px `--white-50` border, ornamental corner brackets in `--white-40`
- Header strip: guilloché pattern, index numeral, label in letter-spaced caps

### Buttons
| Variant | Style |
|---|---|
| **Primary** | Ink fill, Paper text, embossed highlight, `--shadow-2` |
| **Secondary** | Paper fill, `--white-50` border, `--emboss` |
| **Ghost** | Transparent, underline in `--white-40` on hover |

### Inputs
Pearl fill, `--deboss`, 1px Bone border; focus = Ink 1px ring + 4px Linen halo.

### Tables
Zebra with Linen, mono tabular numerals, sticky header with guilloché underline. Outlier rows carry a **hatched** background (diagonal lines in `--white-30`) rather than a color.

### Toggles / Chips
Pill, embossed; active state is *debossed* with Ink text.

### Stamps (status)
Circular seals, rotated −8°, double border, uppercase mono text. Appear with a quick press animation.

---

## ❖ 9. Data Visualization in White

The hardest brief: **charts with no color.** Strategy — encode with *form*, not hue.

| Channel | Technique |
|---|---|
| Series separation | **Pattern fills**: solid · diagonal hatch · crosshatch · dots · horizontal lines · vertical lines |
| Line series | Vary **stroke weight**, **dash pattern**, and **marker shape** (○ □ △ ◇ ✕) |
| Emphasis | Ink vs Graphite vs Ash-white value ramp |
| Outliers | Hollow double-ring marker + hatched band |
| Forecast | Dashed line, hatched confidence band, "projection" stamp |
| Background | Fine dotted grid on Pearl canvas |
| Selection | Embossed lift + Ink outline |

**Ramp for sequential data (6 steps):** `#FFFFFF → #EFECE3 → #DDD8CA → #B9B3A1 → #4A4840 → #1C1B18`

Every chart has: a figure number (`Fig. 4`), a display-type title, an italic caption, and an ornamental frame.

---

## ❖ 10. Motion

Maximalist, but graceful — never frantic.

- **Card deal:** stage cards slide in with a 40ms stagger and slight rotation settle
- **Stamp press:** scale 1.3 → 1.0 with a tiny shadow squash
- **Fan:** previous stages fan out on hover (rotate ±2°, translate 6px)
- **Paper fold:** modals unfold from a crease line
- **Numbers:** tick up with tabular alignment preserved
- Easing: `cubic-bezier(.2, .8, .2, 1)`, durations 180–420ms
- Respect `prefers-reduced-motion`: replace with opacity fades

---

## ❖ 11. Iconography

- Line icons, 1.5px stroke, rounded joins (Lucide as a base)
- Drawn in Ink / Graphite only
- Key icons may sit inside an embossed circular "medallion"

---

## ❖ 12. Voice & Microcopy

Literary, precise, a little theatrical.

| Instead of | Write |
|---|---|
| "Upload file" | "Deal in your data" |
| "Processing…" | "Shuffling the deck…" |
| "Outliers removed" | "14 strays set aside" |
| "Error" | "A card slipped — here's why" |
| "Export" | "Print this card" |

---

## ❖ 13. Accessibility (non-negotiable)

- All text meets contrast targets in §2
- Patterns *and* labels distinguish chart series — never texture alone
- Full keyboard navigation; visible Ink focus rings
- `prefers-reduced-motion` and `prefers-contrast` respected
- Ornament is `aria-hidden`; never carries meaning alone
- Minimum body size 14px; interactive targets ≥ 40px

---

## ❖ 14. Design Tokens (starter file)

```css
:root {
  /* whites */
  --white-100:#FFFFFF; --white-90:#FDFDFB; --white-80:#FAF9F5;
  --white-70:#F5F3EC;  --white-60:#EFECE3; --white-50:#E8E4D9;
  --white-40:#DDD8CA;  --white-30:#CEC8B8; --white-20:#B9B3A1;
  --white-10:#A39D8A;
  /* ink */
  --ink:#1C1B18; --ink-soft:#4A4840;
  /* radius */
  --r-sm:6px; --r-md:10px; --r-lg:14px; --r-xl:22px;
  /* spacing (8px base) */
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:24px; --s-6:32px; --s-7:48px; --s-8:72px;
  /* motion */
  --ease:cubic-bezier(.2,.8,.2,1); --t-fast:180ms; --t-base:280ms; --t-slow:420ms;
}
```

---

<div align="center">

──── ❖ ────

*More is more — as long as it is all white.*

</div>
