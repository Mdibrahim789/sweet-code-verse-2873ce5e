# Master-Controlled Multi-Theme System

The master admin picks one site theme from the admin panel; it's saved in Supabase and applied to **every** user in real time. Themes available:

**Core 3:** World Cup (neon, current), Light/White, Dark
**Flags:** Argentina, Brazil, Portugal, Spain, Saudi Arabia, Morocco

## 1. Database (migration)
Create a single-row global settings table:
```text
public.site_settings
  id           int primary key default 1 (locked to one row)
  active_theme text not null default 'worldcup'
  updated_at   timestamptz default now()
```
- GRANT SELECT to `anon` + `authenticated` (everyone reads the active theme).
- GRANT UPDATE to `authenticated`; RLS UPDATE policy restricted to master via `has_role(auth.uid(),'master')`.
- Seed the single row with `worldcup`.
- Add table to `supabase_realtime` publication so theme changes push live to all clients.

## 2. Theme tokens (`src/index.css`)
Define a token block per theme using a `data-theme` attribute on `<html>`:
- `worldcup` → current neon tokens (keep as-is)
- `light` → clean white/light palette
- `dark` → classic neutral dark
- `argentina` → sky-blue (#75AADB) + white + gold sun accent
- `brazil` → green (#009C3B) + yellow (#FFDF00) + blue accent
- `portugal` → deep red (#DA291C) + green (#006600) + gold
- `spain` → red (#AA151B) + yellow/gold (#F1BF00)
- `saudi` → green (#006C35) + white
- `morocco` → red (#C1272D) + green (#006233)

Each block overrides the same semantic tokens (`--background`, `--card`, `--primary`, `--accent`, `--foreground`, `--border`, sidebar, charts, glows) so all existing components re-skin automatically — no per-component edits.

## 3. Theme context (`src/contexts/ThemeContext.tsx`)
Rewrite to support named themes:
- On load: read `active_theme` from `site_settings`, apply it by setting `data-theme` on `<html>` (plus the matching `light`/`dark` base class for shadcn).
- Subscribe to realtime changes on `site_settings` → instantly re-apply when master switches.
- Expose `theme`, `setTheme` (writes to DB, master only), and the theme list.
- Local fallback to last-known theme (localStorage) for instant first paint before the DB responds.

## 4. Admin panel UI (`src/components/dashboard/AdminSection.tsx`)
Add a **"Site Theme"** card (master only) near the top:
- A responsive grid of theme cards, each showing the theme name + a small color swatch preview (the flag/accent colors).
- Active theme highlighted; clicking one updates `site_settings.active_theme` and toasts "Theme updated for everyone".

## 5. Landing toggle (`src/components/dashboard/ThemeToggle.tsx`)
Since theme is now global, the sun/moon toggle no longer fits. I'll remove it from the landing header (or leave a static look) so it doesn't conflict with the global theme.

## Notes
- All re-skinning is via semantic tokens — no component logic changes.
- Non-master users only read the theme; the picker is master-only and enforced by RLS.
- I'll verify by switching themes in the admin panel and screenshotting.
