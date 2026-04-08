

# Plan: Fix OneSignal API Key + Hooks Error + Popup Persistence

## Issues Found

1. **OneSignal API key rejected** — Edge function logs show `"Access denied"` from OneSignal. The current `ONESIGNAL_REST_API_KEY` secret is invalid. Your screenshot shows the new key: `os_v2_app_kwbtmy7bsfb6pbm7jmrg7d7zldd3pnsvtlxe6qvbmmx7xijr4x654fdqdykwttoxg2agtwylosarf46gcmwgktnlvlrkywlbm7gdnea`

2. **"Rendered fewer hooks" error** — `NotificationToggle` component has early returns (lines 81, 90) before all hooks are called. React requires hooks to be called in the same order every render.

3. **Popup still shows after permission granted** — The condition on line 42 checks `permission === 'granted'` but the prompt should also hide when `isSubscribed` is true (which it does, but the OneSignal SDK may not sync properly).

## Changes

### 1. Update `ONESIGNAL_REST_API_KEY` secret
- Use the secrets tool to update the key with the new v2 API key from the screenshot

### 2. Redeploy edge function
- Redeploy `send-push-notification` to pick up the new secret

### 3. Fix `NotificationToggle` hooks error
- Move the `usePushNotifications()` hook call to the top and remove early returns that break hook rules — use conditional rendering instead of early returns

### 4. Test the edge function
- Call the edge function with curl to verify the new API key works

