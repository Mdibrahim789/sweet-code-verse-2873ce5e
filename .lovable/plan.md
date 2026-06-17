# World Cup Schedule + Results card & Theme label on banner

Two changes to the Home page (`HomeSection.tsx`):

## 1. Show selected theme name on the banner
Add a small pill in the banner (top-right) showing the currently active theme label (e.g. "Theme: Brazil") read from `useTheme()`. It updates live whenever the master changes the theme.

## 2. World Cup schedule + match results (admin-managed)
A new **"World Cup"** card directly below the banner that lists upcoming fixtures and latest results, managed by the Master Admin.

### Database (migration)
New table `public.matches`:
```text
matches
  id            uuid pk
  team_a        text
  team_b        text
  team_a_flag   text   (emoji/short code, optional)
  team_b_flag   text   (optional)
  match_time    timestamptz   (kickoff)
  stage         text   (e.g. "Group A", "Round of 16", optional)
  status        text   ('scheduled' | 'finished')  default 'scheduled'
  score_a       int    (nullable)
  score_b       int    (nullable)
  created_at / updated_at
```
- GRANT SELECT to `anon` + `authenticated` (everyone sees fixtures).
- GRANT INSERT/UPDATE/DELETE to `authenticated`; RLS write policies restricted to master via `has_role(auth.uid(),'master')`.
- Read policy: anyone can SELECT.
- Realtime-enabled so updates appear live.
- `updated_at` trigger.

### Home card (`HomeSection.tsx`)
- New `WorldCupCard` showing two groups:
  - **Upcoming** (status scheduled, sorted by kickoff) — teams, stage, date/time via date-fns.
  - **Results** (status finished, most recent first) — teams with final score highlighted.
- Live via realtime subscription (cleanup on unmount).
- Hidden entirely if there are no matches, so it never shows an empty box.
- Styled with existing neon/semantic tokens to match the theme.

### Admin panel (`AdminSection.tsx`)
New **"World Cup Matches"** card (master only):
- Form to add a match: team A, team B, optional flags/emoji, stage, kickoff date-time.
- List of existing matches with: set/edit score + mark finished, and delete.
- Writes go to the `matches` table (RLS enforces master-only).

## Notes
- All UI text in English.
- Re-uses semantic tokens; no new colors.
- A data hook (`useMatches`) handles fetch + realtime, shared by Home and Admin.
- I'll verify by adding a sample match and screenshotting the home card.
