# Industry tile photography

The Industries section (`#industries` in `index.html`) shows one photo per tile.
Drop the files below into this folder; no code change is needed.

| File              | Tile        |
| ----------------- | ----------- |
| `support.webp`    | Support     |
| `healthcare.webp` | Healthcare  |
| `ecommerce.webp`  | E-commerce  |
| `banking.webp`    | Banking     |
| `real-estate.webp`| Real estate |
| `hospitality.webp`| Hospitality |
| `education.webp`  | Education   |

## Specs

- **Format** WebP, quality ~78. Keep each file under ~120 KB; the seven load on
  the same screen and the section already carries a gradient and blur cost.
- **Size** 900 x 1100 (portrait, ~4:5). The largest render is the open tile on
  desktop at 326 x 380 CSS px, so 900 x 1100 covers a 2x display with headroom.
- **Safe area** The tile is cropped with `object-fit: cover` from the centre, and its
  shape changes with the breakpoint:

  | Breakpoint        | Collapsed tile   | Open tile        |
  | ----------------- | ---------------- | ---------------- |
  | Desktop >= 1200px | 136 x 170 (0.80) | 326 x 380 (0.86) |
  | Tablet 810-1199px | 99 x 150 (0.66)  | 297 x 320 (0.93) |
  | Mobile <= 809px   | 92 x 130 (0.71)  | 300 x 260 (1.15) |

  That is a ratio swing from 0.66 (tall, narrow) to 1.15 (slightly landscape) on the
  same file, so keep the subject inside the centred square: roughly the middle 65%
  of the frame. Anything near an edge is cropped away at some breakpoint.
- **Tone** Dark or mid-dark frames work best. The tile renders the photo at 70-90%
  opacity over a hue-tinted scrim, so bright or white-heavy images wash out and
  fight the label in the top-left corner.
- **Consistency** All seven should read as one set: same lighting, similar depth of
  field, similar colour temperature. Mismatched stock is the main way this section
  goes wrong.
- **Content** Avoid legible faces, logos and screens with real customer data.

Until a file exists, `main.js` removes that tile's photo layer and the original SVG
icon shows instead, so missing images degrade to the previous design rather than
breaking the tile.
