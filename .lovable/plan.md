## Problem

In guest mode the bottom tab bar (`BottomTabBar.tsx`) shows every route, including ones guests can't access (Academic, Students, Notices, Faculty, Polls, etc.). Tapping them just lands on an encrypted/locked screen. Guests should only have access to the public paths (`/bus`, `/about`), consistent with how the desktop `Sidebar.tsx` already restricts via `GUEST_ALLOWED_PATHS`.

## Goal

When in guest mode, the bottom tab bar should only surface guest-accessible destinations, so guests aren't presented with tabs that lead to locked content.

## Changes (`src/components/dashboard/BottomTabBar.tsx`)

1. Add a `GUEST_ALLOWED_PATHS = ['/bus', '/about']` constant (mirroring `DashboardLayout.tsx` `PUBLIC_PATHS`).
2. Read `isGuestMode` + `user` from context (already imported).
3. When in guest mode and not logged in, restructure the bottom bar so guest-accessible items are the focus:
   - Make **Bus** the center tab and surface **About** as a visible tab.
   - Hide the inaccessible main tabs (Academic, Students, Notices).
   - In the "More" sheet, show only guest-allowed items (`/about`) plus the existing "Login for Full Access" button; hide all restricted items.
4. For logged-in / normal users, keep the existing tabs and full "More" list unchanged.

### Approach detail
Compute the rendered `TABS` and `MORE_ITEMS` based on guest state (e.g. a guest-specific tab set), rather than always rendering the full arrays. This keeps the design tokens/styling identical and only filters what's shown.

No backend, routing, or auth-logic changes — purely presentation filtering in the bottom nav.</content>
<summary>Filter the mobile bottom tab bar so guests only see guest-accessible routes (Bus/About), matching the existing sidebar restriction.</summary>
</invoke>
