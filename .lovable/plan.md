
# Plan: Mobile Bottom Tab Navigation Bar

WhatsApp-style bottom navigation bar যোগ করা হবে যেটা শুধু mobile view তে দেখাবে।

## What will be built
- একটি fixed bottom navigation bar যেটা 5টি tab দেখাবে: **Home, Academic, Notices, Bus, More**
- "More" tab এ ক্লিক করলে একটি popup/sheet ওপেন হবে বাকি sections দেখানোর জন্য (Students, Faculty, Attendance, Polls, Gallery, About, Admin, Profile)
- Active tab highlighted হবে primary color দিয়ে
- শুধু mobile (`lg:hidden`) এ দেখাবে, desktop এ sidebar থাকবে

## Files to create/modify

### 1. Create `src/components/dashboard/BottomTabBar.tsx`
- 5 tabs: Home (`/home`), Academic (`/academic`), Notices (`/notices`), Bus (`/bus`), More (opens sheet)
- Icons: Home, BookOpen, Bell, Bus, MoreHorizontal
- Active state detection via `useLocation`
- "More" tab opens a Sheet with remaining nav items
- Fixed bottom, z-50, glass-morphism background matching sidebar theme

### 2. Modify `src/components/dashboard/DashboardLayout.tsx`
- Import and render `<BottomTabBar />` inside the layout
- Add bottom padding to main content area on mobile to avoid overlap (`pb-20` on mobile)

### 3. Modify `src/index.css`
- Add safe-area-inset support for iOS notch devices (`padding-bottom: env(safe-area-inset-bottom)`)

## Design details
- Height: ~64px + safe area
- Background: semi-transparent sidebar color with backdrop blur
- Active tab: primary color icon + label, inactive: muted
- Smooth transition on active state
- Sheet for "More" will list remaining items with icons, same style as sidebar
