

# Plan: Push Notification System with OneSignal

## Current State
- `usePushNotifications` hook exists with OneSignal SDK integration
- `NotificationPrompt` and `SendNotificationCheckbox` components exist
- `push_subscriptions` table exists in database
- `ONESIGNAL_APP_ID` and `ONESIGNAL_REST_API_KEY` secrets are configured
- **Missing**: `send-push-notification` edge function (the folder doesn't exist)
- **Missing**: `VITE_ONESIGNAL_APP_ID` in `.env` file

## Changes

### 1. Add `VITE_ONESIGNAL_APP_ID` to `.env`
- Add the OneSignal App ID as a client-side env variable so the SDK can initialize

### 2. Create Edge Function: `supabase/functions/send-push-notification/index.ts`
- Accepts `{ title, message, url?, data? }` from authenticated master admin
- Validates JWT using `getClaims()`
- Checks master role via Supabase admin client
- Calls OneSignal REST API (`https://onesignal.com/api/v1/notifications`) with `included_segments: ["All"]`
- Uses `ONESIGNAL_APP_ID` and `ONESIGNAL_REST_API_KEY` secrets
- Returns recipient count
- Includes CORS headers

### 3. Translate UI text to English
- `NotificationPrompt.tsx`: Bengali → English (title, description, buttons)
- `usePushNotifications.ts`: Bengali toast messages → English
- `SendNotificationCheckbox.tsx`: Bengali label → English

### 4. Integration check
- `NoticesSection` already calls `sendNotification()` when checkbox is checked — this will work once the edge function is deployed

## Result
Master Admin can send push notifications to all subscribers when posting notices. Users see an English-language prompt to enable notifications.

