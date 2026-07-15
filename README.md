# Velora - Project & Team Management Dashboard

> A modern, full-featured SaaS project management platform built as a monorepo with a React/Vite web app and a NestJS API.

---

## Features

- **Dashboard** - KPI cards, analytics charts, workload signals, and activity summaries.
- **Kanban Board** - Project task board with drag-and-drop columns and work items.
- **Task Management** - Work item detail modal, subtasks, comments, activity history, assignee/status/priority updates, and optimistic UI.
- **Project Management** - Project listing, project detail workspace, members, archive/restore flows, and workflow columns.
- **Notifications** - Notification dropdown with unread count, grouped task updates, mark-read flows, and click-through to tasks.
- **Authentication** - API-backed login, refresh token flow, protected routes, and user menu.
- **Command Palette** - Global keyboard navigation powered by `cmdk`.
- **Theme** - Light, dark, and system theme modes.

---

## Tech Stack

| Category     | Technology                      |
| ------------ | ------------------------------- |
| Web app      | React 19 + Vite 8               |
| API          | Node.js + NestJS                |
| Language     | TypeScript 6                    |
| Styling      | Tailwind CSS v4                 |
| UI           | shadcn/ui + Radix UI primitives |
| Server state | TanStack Query                  |
| Client state | Zustand                         |
| Routing      | React Router v7                 |
| Forms        | React Hook Form + Zod           |
| Charts       | Recharts                        |
| Database     | PostgreSQL + Prisma             |
| Code quality | ESLint + Prettier               |

---

## Monorepo Layout

```
apps/
  web/                 # React/Vite frontend dashboard
    src/
      app/             # Router, providers, global styles
      pages/           # Route entry points
      widgets/         # Layout/header/sidebar/composite UI
      features/        # Business features
      components/      # Shared UI primitives
      shared/          # Shared frontend utilities and API clients
  api/                 # NestJS REST API
packages/              # Future shared packages
scripts/               # Repository maintenance scripts
```

The web app follows Feature-Sliced Design boundaries while the API owns backend contracts, persistence, and integration tests.

---

## Getting Started

### Prerequisites

- Node.js >= 22
- npm
- PostgreSQL for API-backed flows

### Install

```bash
npm install
```

### Run the web app

```bash
npm run dev
```

The web app runs at `http://localhost:5173`.

### Run the API

```bash
npm run dev:api
```

The API runs at `http://localhost:3000/api/v1`.

### Useful Scripts

```bash
npm run lint:web        # Lint apps/web
npm run build:web       # Build apps/web
npm run lint:api        # Lint apps/api
npm run build:api       # Build apps/api
npm run docs:check      # Check documentation encoding/format guardrails
npm run db:migrate      # Run Prisma migrations for the API
npm run db:seed         # Seed local API data
```

---

## Roadmap

Velora is organized as a multi-app monorepo:

- [x] `apps/web` - React frontend dashboard
- [x] `apps/api` - REST API backend (Node.js / NestJS)
- [ ] `apps/admin` - Internal admin panel
- [ ] `packages/*` - Shared contracts, config, and reusable packages

See `documentation/en/ROADMAP.md` and `documentation/vi/ROADMAP.md` for detailed phase planning.

---

## Author

Built by **Huu Nhan** as a personal project to demonstrate production-minded product engineering across frontend, backend, UI systems, and documentation.

- GitHub: [@git-huunhan](https://github.com/git-huunhan)
