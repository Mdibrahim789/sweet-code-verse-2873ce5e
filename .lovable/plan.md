

# Plan: Clone test-versity-app Repository

## What This App Is
A university batch portal ("49 Eve-D Batch EEE Portal") for Uttara University's EEE department. It includes authentication, a dashboard with sidebar navigation, and sections for academics, students, faculty, notices, attendance, polls, gallery, bus schedules, and admin management. It uses Supabase for backend (auth, database, storage).

## Project Scope
This is a very large project with **40+ custom files** across:
- **4 pages**: Index, LandingPage, ResetPassword, NotFound
- **22 dashboard components**: HomeSection, AcademicSection, StudentsSection, FacultySection, NoticesSection, AttendanceSection, PollsSection, GallerySection, BusSection, AboutSection, AdminSection, ProfileSection, DashboardLayout, Sidebar, MobileHeader, AuthModal, and more
- **3 contexts**: AuthContext, ThemeContext, GuestContext
- **13 custom hooks**: useRoutines, useNotices, usePolls, useGallery, useBus, useAttendance, useFaculty, useAcademic, useProfiles, useUserRoles, useCRKeys, useAboutWebsite, usePushNotifications
- **Supabase integration**: client config + 768-line types file with ~15 database tables
- **Custom design system**: Electric Engineering theme with Inter/Lora/Space Mono fonts, cyan primary, navy sidebar
- **Additional deps**: jspdf, lucide-react, recharts, date-fns, etc.

## Implementation Strategy

Due to the sheer size, this will need to be done in **multiple rounds**. Each round will create a batch of files.

### Round 1: Foundation
1. Update `package.json` with all new dependencies (jspdf, recharts, lucide-react, etc.)
2. Replace `index.css` with the full Electric Engineering design system (custom colors, fonts, dark mode)
3. Create `src/integrations/supabase/client.ts` and `src/integrations/supabase/types.ts`
4. Create all 3 context files (AuthContext, ThemeContext, GuestContext)
5. Update `App.tsx` with all routes and providers

### Round 2: Hooks
6. Create all 13 custom hooks (useRoutines, useNotices, usePolls, etc.)

### Round 3: Dashboard Core
7. Create DashboardLayout, Sidebar, MobileHeader, AuthModal, ThemeToggle
8. Create GuestRestrictedContent, EditModeToggle, NotificationPrompt, SendNotificationCheckbox

### Round 4: Dashboard Sections (Part 1)
9. Create HomeSection, AcademicSection, StudentsSection, FacultySection

### Round 5: Dashboard Sections (Part 2)
10. Create NoticesSection, AttendanceSection, PollsSection, GallerySection

### Round 6: Dashboard Sections (Part 3)
11. Create BusSection, AboutSection, AdminSection, ProfileSection
12. Create AddStudentModal, StudentDetailModal

### Round 7: Pages
13. Create/update Index.tsx, LandingPage.tsx, ResetPassword.tsx

## Technical Notes
- The app uses Supabase via environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) -- these will need to be configured in Lovable Cloud or project settings
- The Supabase types file defines ~15 tables including: profiles, user_roles, routines, notices, polls, poll_votes, gallery_images, bus_schedules, bus_locations, attendance_records, faculty, academic_subjects, cr_keys, about_website, push_subscriptions
- Each file will be fetched from the GitHub raw URL and recreated in the project

## Important Caveat
The Supabase backend (database tables, RLS policies, edge functions) won't be automatically cloned -- only the frontend code. You'll need to either connect the same Supabase project or set up equivalent tables in Lovable Cloud.

