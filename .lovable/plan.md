
# Plan: PWA Install Button যোগ করা

## যা করা হবে
একটি "Install App" বাটন যোগ করা হবে যেটা `beforeinstallprompt` event ব্যবহার করে ব্রাউজারের native install prompt trigger করবে।

## Technical Changes

### 1. `src/hooks/usePWAInstall.ts` — নতুন hook তৈরি
- `beforeinstallprompt` event listen করবে
- `isInstallable` state ও `promptInstall()` function expose করবে
- App already installed থাকলে বাটন hide হবে (`display-mode: standalone` check)

### 2. `src/components/dashboard/MobileHeader.tsx` — Install বাটন যোগ করা
- Mobile header এ একটি ছোট install icon button দেখাবে (Download icon)
- শুধু তখনই দেখাবে যখন app installable (`isInstallable === true`)
- Already installed হলে বা desktop browser এ support না থাকলে বাটন hide থাকবে

### 3. `src/pages/LandingPage.tsx` — Landing page এও install option
- Hero section এ বা header এ install button দেখাবে যখন available

## গুরুত্বপূর্ণ
- Install prompt শুধু published site এ কাজ করবে (preview তে কাজ করবে না)
- Chrome/Edge/Samsung Browser এ কাজ করবে, Safari তে "Add to Home Screen" manually করতে হবে
