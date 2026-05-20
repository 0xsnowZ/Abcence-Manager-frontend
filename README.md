<div align="center">

# 🎓 Absence Manager — Frontend

**Modern attendance management UI for ISTA Inezgane · OFPPT**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white)](https://redux-toolkit.js.org)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

[**Live App**](https://absence-app-one.vercel.app) · [**Backend Repo**](https://github.com/0xsnowZ/Absence-Manager-backend) · [**Report Bug**](https://github.com/0xsnowZ/Absence-Manager-frontend/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [State Management](#-state-management)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)

---

## 🌟 Overview

A **professional, dark-mode SaaS dashboard** built for **ISTA Inezgane** to digitize and streamline the attendance tracking process for stagiaires. Replaces paper-based call registers with a real-time, multi-role web application.

| Role | Capabilities |
|---|---|
| **Admin** | Full access — manage stagiaires, profs, programmes, view all stats |
| **Prof** | Record attendance for assigned sessions, view own calendar |

---

## ✨ Features

### Core
- 🔐 **Secure login** — Bearer token auth via Laravel Sanctum
- 👥 **Stagiaire management** — Full CRUD with Excel bulk import
- 📅 **Digital attendance register** — Per-session, per-time-block recording
- ✅ **Justification workflow** — Mark absences as justified / unjustified
- 📊 **Statistics dashboard** — KPI cards, charts, absence rates per programme

### UX
- 🌙 **Dark mode** — Premium glassmorphism design system
- 💀 **Skeleton loading** — Context-aware shimmer loaders (no layout shift)
- 🗓 **Calendar history** — Color-coded monthly absence grid per stagiaire
- 📤 **Excel export** — Download attendance data as `.xlsx`
- 📱 **Responsive** — Works on desktop, tablet, and mobile

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| State | Redux Toolkit + React-Redux |
| Routing | React Router v6 |
| HTTP | Axios (with request/response interceptors) |
| Charts | Recharts |
| Icons | Bootstrap Icons |
| Excel | SheetJS (xlsx) |
| Styles | Vanilla CSS + CSS custom properties |
| Deploy | Vercel (static) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/0xsnowZ/Absence-Manager-frontend.git
cd Absence-Manager-frontend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000/api  (or your Railway URL)

# 4. Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

**Default login (from backend seeder):**
```
Email:    admin@school.ma
Password: password
```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build with code splitting |
| `npm run preview` | Preview production build locally |

---

## 📁 Project Structure

```
src/
├── assets/              # Static images & backgrounds
├── components/          # Reusable UI components
│   ├── AbsenceList.jsx  # Attendance history table
│   ├── AbsenceForm.jsx  # Add/edit absence modal
│   ├── CalendarHistory.jsx  # Monthly absence calendar grid
│   ├── Navigation.jsx   # Sidebar + topbar
│   ├── Skeleton.jsx     # Shimmer skeleton variants
│   ├── Statistics.jsx   # KPI + charts dashboard
│   └── Filters.jsx      # Search & filter controls
├── pages/               # Route-level page components
│   ├── LoginPage.jsx
│   ├── SaisiePage.jsx   # Attendance recording (digital register)
│   ├── AbsencesPage.jsx # Absence management & history
│   ├── StagiairesPage.jsx
│   └── ProfsPage.jsx
├── services/
│   └── api.js           # Axios instance + interceptors
├── store/               # Redux Toolkit slices
│   ├── absenceSlice.jsx
│   ├── stagiaireSlice.jsx
│   ├── authSlice.jsx
│   ├── sessionSlice.jsx
│   └── programmeSlice.jsx
└── utils/
    └── exportExcel.js   # SheetJS export helpers
```

---

## 🔄 State Management

Redux Toolkit is used for all server state. Each slice follows the same pattern:

```
Slice
├── Thunks (async API calls via Axios)
├── normalizer (maps backend shape → frontend shape)
├── extraReducers (pending/fulfilled/rejected)
└── selectors (used with useSelector in components)
```

**Key design decisions:**
- All fetch thunks are **guarded** — only fire if the store is empty (no redundant API calls on navigation)
- All `fulfilled` reducers normalize data immediately via `normalizeAttendance()` / `normalizeStagiaire()`
- Auth state persists in `localStorage` (token + user object)

---

## ☁️ Deployment

The frontend deploys automatically to **Vercel** on every push to `main`.

### Environment Variables (Vercel dashboard)

```env
VITE_API_URL=https://web-production-09c0f.up.railway.app/api
```

### Build Output

| Chunk | Size (gzip) |
|---|---|
| `vendor` (React, Redux, Router) | ~68 kB |
| `index` (app code) | ~65 kB |
| `recharts` | ~107 kB |
| `xlsx` | ~95 kB |
| `lucide` | ~1 kB |

Total initial load: **~133 kB gzipped** (vendor + index only)

---

## 🗺 Roadmap

- [x] Dark mode premium design system
- [x] Skeleton loading (no layout shift)
- [x] Calendar history with color-coded justification status
- [x] Excel import + export
- [x] Multi-role dashboard (admin / prof)
- [x] Vite code splitting (vendor, recharts, xlsx chunks)
- [ ] PWA support (offline attendance recording)
- [ ] Email/SMS notification preferences UI
- [ ] Justification document upload
- [ ] QR code session attendance
- [ ] Arabic RTL language support
- [ ] Customizable dashboard widgets

---

## 👨‍💻 Author

**elgarouani** — ISTA Inezgane · OFPPT

---

<div align="center">
  <sub>Built with ❤️ for ISTA Inezgane · Powered by React + Laravel</sub>
</div>
