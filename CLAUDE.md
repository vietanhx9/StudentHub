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

The backend (`backend/server.js`) is a legacy Express+Supabase proxy — not used in the current app. All active features go through the frontend Supabase client directly.

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
Named `OldApp` but is the active dashboard. Renders a sidebar layout with tabs via `activeKey` state (no router):
- `1` — Dashboard (today's tasks + stats + daily quests)
- `2` — Master Schedule (tasks by day of week)
- `3` — Deep Work / Pomodoro timer + Focus Mode
- `4` — `TreePage`
- `5` — `AchievementsPage`
- `6` — `ProfilePage`

All Supabase queries are called directly — no intermediate service layer.

### Gamification logic
- **XP**: +15 XP per completed task, +2 XP per Pomodoro minute, +10 XP per tree watering
- **Streak**: calculated using Vietnam timezone (`getVNDateStr()`) — increments if last_active was yesterday
- **Streak XP bonus**: ×1.2 (3–6 days), ×1.5 (7–13 days), ×1.8 (14–29 days), ×2.0 (≥30 days)
- **Level**: `floor(log2(current_xp / 50 + 1)) + 1`
- **Tree growth stage**: `min(5, floor(total_xp / 200) + 1)` — stages 1–5
- **Water**: earned by completing tasks (+1 per completion), consumed by tree watering (-1)
- **Achievements**: checked after task completion and Pomodoro finish via `checkAchievements()` in `OldApp.jsx`

### Features implemented
- **Task deadlines**: `deadline` column on `tasks` table; countdown "còn X ngày", overdue = red, near = yellow
- **Streak bonus**: XP multiplier displayed on Dashboard banner
- **Daily Quest**: 3 quests generated daily via seeded LCG random (keyed by date); stored in `localStorage`; progress tracked live; XP reward on claim; resets at midnight VN time
- **Focus Mode**: Full-screen overlay in Deep Work tab — hides sidebar/header, shows only large countdown timer + music controls; toggled by "🎯 Vào Focus Mode" button
- **Animations**: confetti on level-up (canvas, no npm), floating "+X XP" text, XP tag pulse, task complete flash, timer glow, card hover lift, button press scale; all via CSS `@keyframes` in `style.css`
- **Browser notifications**: deadline reminders (1 day and same-day) via `Notification` API; permission requested on login

### Database tables (Supabase/PostgreSQL)
All tables use Row Level Security (RLS). Key ones:
- `users` — profile data (xp, streak, level metadata, pomo_sessions, deep_work_minutes)
- `tasks` — `Task_Name`, `day_of_week`, `description`, `priority`, `is_completed`, `user_id`, `deadline`
- `trees` — `tree_type` (cherry/apple/palm/bamboo), `growth_stage`, `is_active`, `tree_name`
- `inventory` — `item_type` (water/golden_water/booster/seed), `quantity`
- `achievements` — `achievement_code`, `reward_xp`
- `daily_logs` — `date`, `deep_work_minutes`, `tasks_completed`, `user_id`

### Key coupling to note
- `OldApp.jsx` imports `supabase` directly from `../../lib/supabase` (one level above components)
- `TreePage` growth stage is derived from `profile.total_xp`, not a separate counter
- Daily quests use `localStorage` key `daily_quests_YYYY-MM-DD`; old keys are auto-cleaned on new day
- `todayLog` state in `OldApp` is updated directly by `upsertDailyLog` (no re-fetch) to keep quest progress live
