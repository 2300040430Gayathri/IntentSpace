# IntentSpace

**Organize. Reflect. Grow.**

IntentSpace is a Personal Life Operating System — a production-ready MERN Stack SaaS that combines habit tracking, task management, daily planning, journaling, memory preservation, skill development, focus timing, analytics, and AI coaching.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), Framer Motion, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Auth | JWT, Email Verification, Password Reset |
| Deploy | Netlify (frontend), Render (backend) |

## Features

- **Authentication** — Register, login, email verification, forgot/reset password, protected routes
- **Dashboard** — Tasks, habits, focus, skills, memories, mood, AI summary, quick actions
- **Habits** — Yes/No & range types, streaks, calendar, monthly reports, AI suggestions
- **Tasks** — Priorities, deadlines, tags, drag-and-drop, archive, AI prioritization
- **Planner** — Morning/afternoon/evening/night blocks, completion tracking, AI review
- **Diary** — Rich text editor, mood tracking, search, AI reflection, English analysis & coach
- **Smart Notepad** — Create/edit/delete notes, auto-save, categories, pin, search
- **Progress Tracker** — Writing streaks, English scores, weekly/monthly graphs
- **Voice AI** — Real-time speech conversation with transcript & history
- **Admin Dashboard** — User management, platform analytics (admin role required)
- **Memories** — Mood tags, on-this-day, monthly/yearly recaps
- **Skills** — Unlimited skills, practice journal, calendar, AI weekly insights
- **Focus** — Pomodoro timer (25/5, 50/10, custom), modes, fullscreen, AI coach
- **Insights** — Analytics charts for habits, tasks, focus, moods, memories
- **Settings** — Profile, theme, notifications, export/import, delete account
- **Daily Check-in** — Mood tracking on app open

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, email credentials
npm install
npm run dev
```

Server runs at `http://localhost:5000`

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Environment Variables

### Backend (.env)

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000/api
```

## Deployment

### Backend → Render

1. Connect your repo to Render
2. Use `backend/render.yaml` or set:
   - Build: `npm install`
   - Start: `npm start`
3. Add environment variables from `.env.example`

### Frontend → Netlify

1. Connect repo, set base directory to `frontend`
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set `VITE_API_URL` to your Render API URL (e.g. `https://your-api.onrender.com/api`)

### Admin Access

Promote a user to admin after registration:

```bash
cd backend
node scripts/makeAdmin.js user@example.com
```

## API Routes

| Route | Description |
|-------|------------|
| `/api/auth` | Register, login, profile, verification |
| `/api/dashboard` | Dashboard widgets data |
| `/api/habits` | Habit CRUD & entries |
| `/api/tasks` | Task CRUD & reorder |
| `/api/planner` | Daily planner blocks |
| `/api/diary` | Journal entries + English analysis |
| `/api/notes` | Smart notepad CRUD |
| `/api/progress` | Writing progress & timeline |
| `/api/admin` | Admin dashboard (admin only) |
| `/api/voice` | Voice assistant sessions |
| `/api/memories` | Memory journal |
| `/api/skills` | Skills & practice entries |
| `/api/focus` | Focus sessions |
| `/api/moods` | Daily check-in |
| `/api/notifications` | User notifications |
| `/api/ai` | AI reports & generation |
| `/api/insights` | Analytics data |

## Project Structure

```
IntentSpace/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
└── frontend/
    └── src/
        ├── components/
        ├── context/
        ├── layouts/
        ├── pages/
        ├── services/
        ├── styles/
        └── utils/
```

## License

ISC
