## Plan: Add Tools Section

### What to build
A new **Tools** page in the portal listing external utilities for students. First entry: **UU Top Page** (https://uutoppage.pro.bd/) — Uttara University assignment/lab cover page generator.

### Changes

1. **New component** `src/components/dashboard/ToolsSection.tsx`
   - Grid of tool cards (responsive: 1 col mobile, 2 cols desktop)
   - First card: UU Top Page
     - Title: "UU Top Page"
     - Description: "Generate print-ready assignment & lab report cover pages with official Uttara University templates."
     - Icon: `FileText` (lucide-react)
     - Badge: "External"
     - Button "Open Tool" → opens https://uutoppage.pro.bd/ in new tab (`target="_blank"`, `rel="noopener noreferrer"`)
   - Layout matches existing sections (header + cards using design tokens)

2. **Routing** `src/pages/Index.tsx`
   - Add `tools` to active section state and render `<ToolsSection />`

3. **Navigation**
   - `src/components/dashboard/Sidebar.tsx` — add "Tools" item with `Wrench` icon
   - `src/components/dashboard/BottomTabBar.tsx` — add "Tools" tab (if space; otherwise put under a "More" overflow if 5 tabs already exist — will verify on implementation)

4. **Skeleton loader** in `SectionSkeletons.tsx` for the Tools page

### Out of scope
- No backend changes, no DB tables — purely a frontend external-link directory
- No auth/permission gating (visible to all logged-in users like other sections)

### Future-friendly
Tool list will be defined as an array in `ToolsSection.tsx` so adding more tools later = one object entry.
