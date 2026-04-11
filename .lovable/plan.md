

# Plan: Fix PWABuilder Issues in Web Manifest

Based on the PWABuilder report card, there are several manifest issues to fix:

## Issues from Screenshot

1. **Fix icon types** — Icons need proper `type` and possibly additional formats
2. **Fix icon sizes** — Need more icon sizes (at least 48x48, 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512)
3. **Add screenshots** — PWABuilder wants app screenshots for store listing
4. **Add orientation** — Specify `"orientation": "portrait"` in manifest
5. **Service worker** — Already handled by vite-plugin-pwa

## Changes

### 1. Generate missing icon sizes
- Use the existing `pwa-icon-512.png` to generate all required sizes (48, 72, 96, 128, 144, 152, 384) into `public/`

### 2. Take app screenshots
- Capture 2 screenshots of the app (mobile + desktop) and save to `public/screenshots/`

### 3. Update `vite.config.ts` manifest
- Add `orientation: "portrait"`
- Add all icon sizes with correct `type: "image/png"`
- Add `screenshots` array with the captured screenshots
- Ensure `purpose` values are correct (separate entries for `"any"` and `"maskable"`)

### Technical Details

File to edit: `vite.config.ts` — expand the `manifest.icons` array and add `orientation` + `screenshots` fields.

New icons generated via script from `pwa-icon-512.png` using ImageMagick.

