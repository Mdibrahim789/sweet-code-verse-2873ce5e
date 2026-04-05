
Problem found:
- 404 হচ্ছে কারণ app-এর আসল routes আছে `/dashboard/home`, `/dashboard/students`, `/dashboard/bus` ইত্যাদিতে
- কিন্তু অনেক component এখনো পুরনো root-level paths use করছে যেমন `/home`, `/students`, `/bus`, `/profile`, `/login`
- তাই `/students` এর মতো route open করলে `NotFound` page দেখাচ্ছে

What I will change:
1. Route paths standardize করব
- Sidebar nav items:
  - `/home` -> `/dashboard/home`
  - `/academic` -> `/dashboard/academic`
  - `/students` -> `/dashboard/students`
  - `/faculty` -> `/dashboard/faculty`
  - `/notices` -> `/dashboard/notices`
  - `/attendance` -> `/dashboard/attendance`
  - `/polls` -> `/dashboard/polls`
  - `/gallery` -> `/dashboard/gallery`
  - `/bus` -> `/dashboard/bus`
  - `/about` -> `/dashboard/about`
  - `/admin` -> `/dashboard/admin`

2. DashboardLayout update করব
- `PUBLIC_PATHS` কে `/dashboard/bus`, `/dashboard/about` এ change করব
- `SECTION_TITLES` map-এ সব keys `/dashboard/...` format এ দেব
- `/login` special handling remove বা safer pattern এ আনব, কারণ actual route হিসেবে `/login` define করা নেই
- modal close হলে `/home` এর বদলে `/dashboard/home` use করব

3. Internal navigation fix করব
- Sidebar brand link `/dashboard/home`
- profile click `/dashboard/profile`
- HomeSection এর quick navigation:
  - `/notices` -> `/dashboard/notices`
  - `/bus` -> `/dashboard/bus`
  - `/polls` -> `/dashboard/polls`
  - `/gallery` -> `/dashboard/gallery`
- ProfileSection login/profile related navigation dashboard-aware করব

4. Auth modal behavior align করব
- যদি login modal route-based না হয়, তাহলে fake `/login` path-এর উপর dependency কমাব
- login button শুধু modal open করবে, invalid route navigation না

5. Verify affected route families
- landing redirect already looks correct in `Index.tsx`
- check করব যেন `/dashboard/home`, `/dashboard/students`, `/dashboard/profile`, `/dashboard/bus` এ consistent behavior থাকে
- guest mode restrictions only intended dashboard public pages-এ কাজ করে

Technical details:
- Root cause file mismatch:
  - `src/App.tsx` defines nested routes under `/dashboard`
  - `src/components/dashboard/Sidebar.tsx` still links to root paths
  - `src/components/dashboard/DashboardLayout.tsx` still checks root paths
  - `src/components/dashboard/HomeSection.tsx` still navigates to root paths
  - `src/components/dashboard/ProfileSection.tsx` still uses root login/profile assumptions
- This is a routing consistency fix, not a Supabase issue

Expected result after implementation:
- `/dashboard/students`, `/dashboard/faculty`, `/dashboard/notices`, `/dashboard/profile` etc. all open correctly
- sidebar clicks will no longer land on 404
- guest/public pages inside dashboard will work consistently
- direct access to old broken paths can optionally be redirected later if needed

Optional improvement after fix:
- add redirect aliases from old paths (`/students`, `/home`, `/bus`) to new `/dashboard/...` routes so old bookmarks/shared links also keep working
