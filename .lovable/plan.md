

# Plan: PWA Support যোগ করা

## সংক্ষেপে
App টি PWA (Progressive Web App) হিসেবে সেটআপ করা হবে যাতে মোবাইলে "Add to Home Screen" এর মাধ্যমে install করা যায়, offline এ কাজ করে, এবং splash screen ও app icon দেখায়।

## গুরুত্বপূর্ণ সতর্কতা
- PWA features (install prompt, offline support) শুধুমাত্র **published version** এ কাজ করবে, Lovable editor preview তে কাজ করবে না
- Editor preview তে service worker disable থাকবে যাতে development এ কোনো সমস্যা না হয়

## যা করা হবে

### 1. `vite-plugin-pwa` install করা
- Package install: `vite-plugin-pwa`

### 2. PWA Icons তৈরি করা
- `public/` folder এ PWA icons তৈরি করা (192x192, 512x512 px) — SVG-based generated icons

### 3. `vite.config.ts` আপডেট করা
- `VitePWA` plugin যোগ করা manifest config সহ:
  - App name, short name, description
  - Theme color, background color
  - Icons (192x192, 512x512)
  - `display: "standalone"`
  - `registerType: "autoUpdate"`
  - `devOptions: { enabled: false }` — preview তে disable
  - `navigateFallbackDenylist: [/^\/~oauth/]`

### 4. `src/main.tsx` আপডেট করা
- iframe/preview host detection guard যোগ করা
- Preview/iframe context এ service worker unregister করা

### 5. `index.html` আপডেট করা
- Apple touch icon meta tags
- `theme-color` meta tag
- `apple-mobile-web-app-capable` ও `apple-mobile-web-app-status-bar-style` meta tags

### 6. Manifest details
- **App Name**: "49EveD EEE in UU" (বা সংক্ষেপে যা আছে)
- **Theme Color**: App এর primary color
- **Display**: standalone
- **Start URL**: `/home`

## ফলাফল
Published site এ যেকোনো মোবাইল browser এ visit করলে "Add to Home Screen" option আসবে। Install করলে app এর মতো open হবে, splash screen দেখাবে, এবং offline এ cached pages দেখাবে।

