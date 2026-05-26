## Goal

Mobile header আর desktop sidebar এ একটা small badge দেখাবে current trimester ও season (যেমন `Summer '26 · T2`)। Master/CR admin panel থেকে এটা manage করা যাবে।

## Database (Supabase)

নতুন একটা table `academic_terms`:

- `season` — text (Spring / Summer / Fall)
- `year` — integer (যেমন 2026)
- `trimester_number` — integer (1, 2, বা 3)
- `start_date` — date
- `end_date` — date
- `is_active` — boolean (একসাথে শুধু একটাই active থাকবে)
- + standard id / created_at / updated_at / created_by

**Access rules (plain English):**
- যেকোনো visitor (authenticated বা guest) current/active term দেখতে পারবে
- শুধু master role অথবা `academic` permission ওয়ালা CR/teacher এই term add/edit/delete করতে পারবে

একটা trigger থাকবে যাতে নতুন কোনো term `is_active = true` করে set করলে আগের active term গুলো automatically `false` হয়ে যায় (একটাই active term guarantee)।

## Frontend Changes

### 1. New hook `src/hooks/useAcademicTerms.ts`
- `useActiveTerm()` — current active term fetch করবে
- `useAcademicTerms()` — সব terms list (admin panel এর জন্য)
- `useUpsertTerm()`, `useDeleteTerm()`, `useSetActiveTerm()` — mutations

### 2. New component `src/components/dashboard/TermBadge.tsx`
Compact badge দেখাবে: `Summer '26 · T2` style. Active term না থাকলে কিছু render করবে না। Click করলে tooltip/popover এ full info (season, year, trimester, start–end date, কত days বাকি)।

### 3. Placement
- **MobileHeader.tsx** — logo এর পাশে badge insert
- **Sidebar.tsx** — top section এ (logo এর নিচে) badge insert

### 4. Admin Panel (`AdminSection.tsx`)
নতুন একটা "Academic Terms" tab/card:
- Active term দেখাবে highlight করে
- Add new term form (season dropdown, year, trimester number, start/end date)
- List of all terms (Set Active / Edit / Delete)

## Technical Details

```text
academic_terms
├── season: 'Spring' | 'Summer' | 'Fall'
├── year: int
├── trimester_number: 1 | 2 | 3
├── start_date, end_date
└── is_active (only one true at a time, enforced by trigger)
```

Badge format examples:
- `Summer '26 · T2`
- Tooltip: "Summer 2026 — 2nd Trimester · 45 days remaining (May 1 – Aug 31)"

Files to create:
- `src/hooks/useAcademicTerms.ts`
- `src/components/dashboard/TermBadge.tsx`
- `src/components/dashboard/AcademicTermsManager.tsx` (admin form/list)

Files to edit:
- `src/components/dashboard/MobileHeader.tsx` — add `<TermBadge />`
- `src/components/dashboard/Sidebar.tsx` — add `<TermBadge />`
- `src/components/dashboard/AdminSection.tsx` — mount the terms manager

## Out of Scope (এখন না)

- Home page এ big card / banner (পরে চাইলে add করা যাবে — হুক ready থাকবে)
- Auto-rollover (term end হলে next term auto-active) — manual control রাখছি
- Multiple parallel sessions (diploma vs regular)
