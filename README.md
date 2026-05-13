# Absence Manager — Pro Edition

A modern React application for managing student absences in vocational training centers. Features bulk attendance entry, role-based access control, calendar history, and a premium SaaS-style UI.

## Features

- **Bulk Attendance Grid (Registre de Présence)** — spreadsheet-style grid with S1–S4 time slots; submit an entire class's absences in one action
- **Calendar History** — date-range calendar view showing each student's absence days at a glance (red = unjustified, green = justified)
- **Absence Management** — list view with search, filters (date range, class, status), edit justifications, and delete
- **Student Management** — browse by sector → programme → class; add, edit, and remove students
- **Statistics Dashboard** — KPI cards (total, justified, unjustified hours) with justification rate progress bars
- **Prof Management** — admin can create, edit, and delete professor accounts
- **Role-based access (RBAC)**
  - `admin` — full access (statistics, delete, prof management)
  - `prof` — scoped to their assigned programmes; can record and view absences
- **Toast notifications** — success / warning / error feedback with animated progress bar
- **Error Boundary** — app-level catch for unexpected render errors

## Tech Stack

| Layer | Library |
|---|---|
| UI Framework | React 18 |
| State | Redux Toolkit 1.9 |
| Routing | React Router DOM 6 |
| HTTP | Axios 1.x |
| Styles | Bootstrap 5.3 + Bootstrap Icons 1.11 |
| Calendar | react-calendar 6 |
| Build | Vite 5 |
| Font | Inter (Google Fonts) |

## Getting Started

### Prerequisites

- Node.js 18+
- A running instance of the [Absence Manager API](https://github.com/0xsnowZ/absence-manager--redux) (Laravel backend)

### Install

```bash
git clone https://github.com/0xsnowZ/absence-manager--redux.git
cd absence-manager--redux
npm install
```

### Configure

Copy the example env file and set your backend URL:

```bash
cp .env.example .env
```

```env
# .env
VITE_API_URL=http://localhost:8000
```

### Run

```bash
npm run dev
```

Opens at `http://localhost:5173`. Requests to `/api/*` are proxied to `VITE_API_URL`.

### Build for production

```bash
npm run build
```

Output is in `dist/`. Source maps are disabled in production builds.

## Project Structure

```
src/
├── components/
│   ├── Navigation.jsx        # Sticky frosted-glass navbar with RBAC tabs
│   ├── ProtectedRoute.jsx    # Route guard (redirects to /login if unauthenticated)
│   ├── ErrorBoundary.jsx     # App-level error boundary with reload fallback
│   ├── ToastProvider.jsx     # Global toast context (useToast hook)
│   ├── AbsenceForm.jsx       # Edit justification modal form
│   ├── AbsenceList.jsx       # Paginated absence table with search
│   ├── CalendarHistory.jsx   # Date-range calendar grid per class
│   ├── Filters.jsx           # Absence filter panel (date, class, status)
│   ├── StagiaireForm.jsx     # Add / edit student form
│   └── StagiaireList.jsx     # Student table per programme
├── pages/
│   ├── LoginPage.jsx         # Authentication page
│   ├── SaisiePage.jsx        # Bulk attendance entry grid
│   ├── AbsencesPage.jsx      # Absence list + calendar history
│   ├── StagiairesPage.jsx    # Sector → Programme → Student drill-down
│   ├── StatisticsPage.jsx    # KPI dashboard (admin only)
│   └── ProfsPage.jsx         # Professor management (admin only)
├── store/
│   ├── store.jsx             # Redux store configuration
│   ├── authSlice.jsx         # Login / logout / token persistence
│   ├── absenceSlice.jsx      # Attendance CRUD + normalization
│   ├── stagiaireSlice.jsx    # Student CRUD
│   ├── profSlice.jsx         # Professor CRUD
│   ├── sessionSlice.jsx      # Session find-or-create + time blocks
│   ├── programmeSlice.jsx    # Programme list
│   └── secteurSlice.jsx      # Sector list
├── services/
│   └── api.js                # Axios instance (Bearer token, 401 redirect)
├── index.css                 # Design tokens, global styles, shared components
├── index.jsx                 # App entry point
└── App.jsx                   # Router + providers
```

## Authentication

The app uses Laravel Sanctum token-based authentication. On login the token is stored in `localStorage` and attached as a `Bearer` header on every API request. A 401 response automatically redirects to `/login`.

Default test accounts (depend on your backend seed data):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@school.ma` | `password` |
| Professeur | `teacher@school.ma` | `password` |

## Deploy to GitHub Pages

1. Push to the `main` branch.
2. In **Settings → Pages**, set source to the `gh-pages` branch.
3. The workflow in `.github/workflows/deploy.yml` builds and deploys automatically.

App URL: `https://<your-username>.github.io/absence-manager--redux/`

## License

For educational purposes.
