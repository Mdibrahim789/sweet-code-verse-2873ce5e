# Neon FIFA World Cup Theme

The current pitch-green & cream theme doesn't match the vibe of your reference image. The reference is a **dark, near-black stadium look with glowing neon outlines (red, blue, green) and a gold trophy accent**. I'll rebuild the theme around that.

## What changes

### 1. Color tokens (`src/index.css`)
Make the app dark-neon by default:
- **Background**: near-black `240 30% 4%` with a subtle deep-blue tint (like the image)
- **Cards/surfaces**: very dark navy `240 25% 8%` with subtle neon borders
- **Primary**: neon blue `205 100% 55%` (the blue outlines/stars)
- **Accent**: trophy gold `44 80% 58%`
- **Destructive/red glow**: neon red `352 90% 55%`
- **Success/green glow**: neon green `145 80% 50%`
- Sidebar: pure black with neon-blue active states
- Update chart colors to the neon red/blue/green/gold set
- Apply the same neon palette to both `:root` and `.dark` so it looks right regardless of toggle

### 2. Neon utilities & effects (`src/index.css`)
Add reusable helpers:
- `--gradient-neon` and `--glow-*` tokens (red/blue/green/gold drop-shadow glows)
- `.text-glow` / `.neon-border` utility classes (glowing text + glowing card outlines)
- A faint animated neon grid/scanline background behind the dashboard for the stadium-neon feel

### 3. Default theme (`src/App.tsx`)
Switch `defaultTheme="light"` → `defaultTheme="dark"` so the neon look is the default experience.

### 4. Home banner polish (`src/components/dashboard/HomeSection.tsx`)
Update the existing World Cup banner to use the new neon glow (gold trophy + neon-outlined text) so it matches the reference.

## Notes
- Fonts stay **Syne + Plus Jakarta Sans** (already set).
- Only design tokens and presentation are touched — no logic/data changes.
- I'll verify with a screenshot of `/home` after applying.

```text
[ near-black bg ]  +  [ neon blue / red / green glows ]  +  [ gold trophy accent ]
```
