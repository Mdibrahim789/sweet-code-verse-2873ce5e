# Flag-Themed Background per Theme

Right now changing the theme only swaps colors. This adds a subtle, low-opacity flag pattern in the page background for each country theme (Argentina → Argentina flag feel, Brazil → Brazil, Saudi → Saudi, etc.), kept faint enough that all content stays fully readable.

## Approach

Use a single fixed, full-screen background layer driven by the existing `data-theme` attribute on `<html>`. No JS logic change is needed — it's pure CSS reacting to the theme that's already applied. Each theme's flag is recreated with CSS gradients (stripes, sun, star, crescent shapes), so no image files are required and it themes instantly when the master admin switches.

```text
[ fixed background layer (flag pattern, low opacity) ]  <-- z-index behind
        [ sidebar / main content / cards ]              <-- normal flow on top
```

## What will change

1. **`src/index.css`**
   - Add a fixed full-viewport pseudo-background element (e.g. `body::before`) positioned behind all content (`position: fixed; inset:0; z-index:-1; pointer-events:none`).
   - For each theme via `[data-theme="..."]`, set a flag-evoking `background` using CSS gradients at low opacity (roughly 6–12%) so content stays clearly legible:
     - **argentina** — horizontal sky-blue / white / sky-blue bands + a faint gold sun glow center.
     - **brazil** — green field with a faint yellow diamond + blue circle.
     - **portugal** — green/red split with a faint gold ring.
     - **spain** — red / gold / red horizontal bands.
     - **saudi** — green field with a faint white band (sword/script suggestion).
     - **morocco** — red field with a faint green star.
     - **worldcup / dark / light** — keep current look (no flag overlay, or a neutral subtle grid) so existing themes are unchanged.
   - Tune opacity per light vs dark backgrounds so the watermark never overpowers text.

2. **No component changes required** — the layer sits behind the existing layout. I'll verify content (cards, sidebar, modals) still renders above it and remains readable.

## Notes / tradeoffs

- Patterns are stylized flag impressions via CSS gradients, not photographic flags — this keeps it lightweight, instant-switching, and on-theme. If you'd prefer real flag images instead, that can be done but adds image assets and load weight.
- Opacity is intentionally low so readability is unaffected; the exact values can be tuned after you see it live.
