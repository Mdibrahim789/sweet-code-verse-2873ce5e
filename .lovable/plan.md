
# Plan: PWA Install Pop-up

## যা করা হবে
App install করা না থাকলে একটি সুন্দর pop-up/banner দেখাবে যেটা user কে app install করতে উৎসাহিত করবে। এটি `usePWAInstall` hook ব্যবহার করবে।

## Technical Changes

### 1. নতুন component তৈরি: `src/components/dashboard/PWAInstallPrompt.tsx`
- Fixed position bottom-এ (bottom tab bar এর উপরে) একটি card/banner দেখাবে
- "Install App" button থাকবে যেটা native install prompt trigger করবে
- Close/dismiss button থাকবে — dismiss করলে `localStorage` তে save হবে যাতে বারবার না দেখায় (৭ দিন পর আবার দেখাবে)
- শুধু তখনই দেখাবে যখন:
  - App installable (`isInstallable === true`)
  - User আগে dismiss করেনি (বা ৭ দিন পার হয়ে গেছে)
  - App standalone mode তে নেই
- WhatsApp-style notification card design — icon, message, action button

### 2. `DashboardLayout.tsx` এ PWAInstallPrompt যোগ করা
- `<PWAInstallPrompt />` component render করা layout এ

## Design
- Card style pop-up, bottom-এ fixed (mobile bottom tab এর উপরে)
- Download icon + "অ্যাপ ইনস্টল করুন" text + "ইনস্টল" button + close button
- Subtle animation (fade-up)
- Auto-dismiss after install
