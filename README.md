# Velora — Project & Team Management Dashboard

> A modern, full-featured SaaS project management web application built with React 19, TypeScript, and a clean Feature-Sliced Design architecture. Designed to showcase production-level frontend engineering practices.

---

## ✨ Features

- **Dashboard** — KPI overview cards with analytics charts (Recharts) and real-time data summaries
- **Kanban Board** — Drag-and-drop task management (dnd-kit) with multi-column layouts, task cards, and priority indicators
- **Task Management** — Full CRUD with a detail modal, sidebar metadata panel, priority/status/assignee management, and form validation (React Hook Form + Zod)
- **Project Management** — Project listing, project detail view, and per-project task boards
- **User Management** — Team member overview with role-based display
- **Authentication** — Login flow with protected route guards
- **Command Palette** — Global keyboard-driven navigation (`⌘K` / `Ctrl+K`) powered by `cmdk`
- **Theme** — Light / Dark mode toggle via `next-themes`
- **Responsive Layout** — Collapsible sidebar, adaptive header, and mobile-aware design

---

## 🛠 Tech Stack

| Category               | Technology                      |
| ---------------------- | ------------------------------- |
| **Framework**          | React 19 + Vite 8               |
| **Language**           | TypeScript 6 (strict mode)      |
| **Styling**            | Tailwind CSS v4                 |
| **UI Components**      | shadcn/ui + Radix UI primitives |
| **State Management**   | Zustand                         |
| **Server State**       | TanStack Query (React Query v5) |
| **Routing**            | React Router v7                 |
| **Forms & Validation** | React Hook Form + Zod           |
| **Drag & Drop**        | dnd-kit                         |
| **Charts**             | Recharts                        |
| **HTTP Client**        | Axios                           |
| **Code Quality**       | ESLint + Prettier               |

---

## 🏗 Architecture

This project follows **Feature-Sliced Design (FSD)** — a scalable architectural methodology for frontend applications.

```
src/
├── app/               # App-level config: router, providers, global styles
├── pages/             # Page-level components (route entry points)
│   ├── DashboardPage/
│   ├── KanbanPage/
│   ├── ProjectsPage/
│   ├── ProjectDetailPage/
│   ├── UsersPage/
│   ├── ProfilePage/
│   └── LoginPage/
├── widgets/           # Composite UI blocks used across pages
│   ├── Sidebar/
│   ├── Header/
│   ├── Layout/
│   └── CommandPalette/
├── features/          # Isolated business features
│   ├── tasks/         # Kanban board, task cards, modals, CRUD
│   ├── dashboard/     # Metrics, charts, overview widgets
│   ├── projects/      # Project list & detail
│   ├── users/         # User management
│   └── auth/          # Login, auth guards
└── shared/            # Reusable utilities, hooks, types, API client
    ├── api/
    ├── hooks/
    ├── lib/
    ├── types/
    └── ui/
```

> Each feature slice is self-contained with its own `api/`, `model/`, and `ui/` layers — making the codebase easy to scale and maintain across teams.

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/huunhan/velora.git
cd velora

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Available Scripts

```bash
npm run dev       # Start dev server with HMR
npm run build     # Type-check and build for production
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

---

## 📐 Key Design Decisions

### Feature-Sliced Design

Chosen over a traditional layered structure to enforce clear boundaries between business domains, prevent cross-feature coupling, and improve long-term maintainability as the project grows to include a backend and admin panel.

### TanStack Query for Server State

Separates server state (async, remote) from client state (UI, local). Provides caching, background refetching, and loading/error states out of the box — avoiding prop drilling or Redux boilerplate for data fetching.

### Zustand for Client State

Lightweight and boilerplate-free. Used for UI state (sidebar collapse, command palette open state) that needs to be shared across the component tree without the overhead of Redux.

### shadcn/ui + Radix UI

Accessible, unstyled primitives with full control over styling. Components are copied into the codebase rather than imported as a black-box library, allowing full customization without fighting a design system.

---

## 🗺 Roadmap

Velora is evolving into a monorepo so its applications can share contracts,
tooling, and release workflows:

- [x] `apps/web` — React frontend dashboard (currently at the repository root)
- [ ] `apps/api` — REST API backend (Node.js / NestJS)
- [ ] `apps/admin` — Internal admin panel
- [ ] `packages/*` — Shared contracts, configuration, and reusable packages

The frontend will move into `apps/web` as part of the monorepo migration. Each
application remains independently buildable and deployable.

---

## 👤 Author

Built by **Huu Nhan** as a personal project to demonstrate production-level frontend architecture, modern React patterns, and UI engineering skills.

- GitHub: [@git-huunhan](https://github.com/git-huunhan)
