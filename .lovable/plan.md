

# Plan: Notification Toggle on Notice Page + Notification Pop-up on Home

## Changes

### 1. NoticesSection.tsx — Add notification on/off toggle
- Import `NotificationToggle` from `NotificationPrompt.tsx`
- Add it next to the section title header (beside EditModeToggle)
- Shows for logged-in users to enable/disable push notifications directly from the notice page

### 2. DashboardLayout.tsx — Add NotificationPrompt pop-up
- Import and render `<NotificationPrompt />` in the layout (shows on all pages including Home)
- It already auto-hides when subscribed, dismissed, or not logged in — so it will show the English pop-up asking users to enable notifications

### 3. NoticesSection.tsx — Translate Bengali notification title
- Change `📢 নতুন নোটিশ – 49 D EEE` to `📢 New Notice – 49 D EEE` in the sendNotification call

All text is already in English in `NotificationPrompt.tsx` and `NotificationToggle`. No translation needed there.

