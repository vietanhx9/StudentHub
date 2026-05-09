# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (primary development target)
```bash
cd frontend
npm install       # install dependencies
npm run dev       # dev server at http://localhost:5173
npm run build     # production build
npm run lint      # ESLint check
npm run preview   # preview production build
```

### Backend (legacy, mostly unused)
```bash
cd backend
node server.js    # Express server on port 5000
```

The backend (`backend/server.js`) is a legacy Express+Supabase proxy that predates the current architecture. All active features go through the frontend Supabase client directly — the backend is not used in the current app.

## Environment Setup

Create `frontend/.env.local` with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The `.env.local` file is gitignored. Without it, the app throws at startup (`src/lib/supabase.js`).

## Architecture

**Single-page React app** (Vite + React 18 + Ant Design 5) that talks directly to Supabase — no custom API layer.

### Auth flow
`App.jsx` wraps everything in `ThemeProvider → AuthProvider`. `AppContent` reads `useAuth()` and renders either `AuthPage` (unauthenticated) or `OldApp` (authenticated Dashboard). Auth state comes from `AuthContext.jsx`, which wraps Supabase Auth and also loads a `users` table profile row.

On signup (`AuthContext.signUp`), three things are created atomically:
1. Supabase Auth user
2. Row in `users` table (username + random 4-digit `friend_code`)
3. Initial `inventory` rows (10 water, 0 golden_water, 0 booster, 1 seed)

### Theme
`ThemeContext` persists `light`/`dark` in `localStorage` and sets `data-theme` on `<body>`. Ant Design theming is applied via `ConfigProvider` in `App.jsx`. CSS variables (e.g. `--bg-primary`, `--text-primary`, `--border-color`) are used throughout for custom styling.

### Main Dashboard (`OldApp.jsx`)
Named `OldApp` but is the active dashboard. Renders a sidebar layout with 6 tabs via `activeKey` state (no router):
- `1` — Dashboard (today's tasks + stats)
- `2` — Master Schedule (tasks by day of week)
- `3` — Deep Work / Pomodoro timer
- `4` — `TreePage`
- `5` — `AchievementsPage`
- `6` — `ProfilePage`

All Supabase queries in the dashboard are called directly — no intermediate service layer.

### Gamification logic
- **XP**: +15 XP per completed task, +2 XP per Pomodoro minute, +10 XP per tree watering
- **Streak**: calculated using Vietnam timezone (`getVNDateStr()`) — increments if last_active was yesterday
- **Level**: `floor(log2(current_xp / 50 + 1)) + 1`
- **Tree growth stage**: `min(5, floor(total_xp / 200) + 1)` — stages 1–5
- **Water**: earned by completing tasks (+1 per completion), consumed by tree watering (-1)
- **Achievements**: checked after task completion and Pomodoro finish via `checkAchievements()` in `OldApp.jsx`

### Database tables (Supabase/PostgreSQL)
All tables use Row Level Security (RLS). Key ones:
- `users` — profile data (xp, streak, level metadata, pomo_sessions, deep_work_minutes)
- `tasks` — columns: `Task_Name`, `day_of_week`, `description`, `priority`, `is_completed`, `user_id`
- `trees` — `tree_type` (cherry/apple/palm/bamboo), `growth_stage`, `is_active`, `tree_name`
- `inventory` — `item_type` (water/golden_water/booster/seed), `quantity`
- `achievements` — `achievement_code`, `reward_xp`

### Key coupling to note
- `OldApp.jsx` imports `supabase` directly from `../../lib/supabase` — it's one level above components
- `TreePage` growth stage is derived from `profile.total_xp`, not a separate counter
- The `backend/server.js` references a `Tasks` table (capital T) — this is the old schema; current schema uses lowercase `tasks` with `Task_Name` column
