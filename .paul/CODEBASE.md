# Codebase Map — RedonePaypro

> Generated: 2026-06-13 | Source: full codebase scan

## Project Identity

- **Name:** RedonePaypro
- **Type:** Production & Payroll Management SPA for piece-rate workers
- **Company:** PT. REDONE BERKAH MANDIRI UTAMA (bag manufacturing, Cileungsi)
- **Live URL:** https://paypro.redone.my.id (Vercel, auto-deploy from GitHub `main`)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Browser (React 19 SPA + PWA)                   │
│  state-based routing, dark/light mode           │
├─────────────────────────────────────────────────┤
│  dataService.ts  ──fetch──▶  /api/*             │
│  (frontend service layer)    (Vercel Functions) │
├─────────────────────────────────────────────────┤
│                              │                  │
│                         Drizzle ORM             │
│                              │                  │
│                         NeonDB (PostgreSQL)     │
└─────────────────────────────────────────────────┘
```

- **Frontend:** React 19 + TypeScript + Vite 6 + Tailwind CSS v3 + lucide-react
- **Backend:** 6 Vercel Serverless Functions (Node.js, compiled by `@vercel/node`/ncc)
- **Database:** NeonDB (serverless PostgreSQL) via `@neondatabase/serverless` HTTP driver + Drizzle ORM
- **Auth:** localStorage session, plaintext passwords (deferred hardening)
- **PDF Export:** jsPDF + jspdf-autotable (loaded via CDN in SW)

---

## Directory Structure

```
/
├── api/                    # Vercel Serverless Functions (backend)
│   ├── auth.ts             # POST - login (username/password)
│   ├── employees.ts        # GET/POST/DELETE - employee CRUD + dependency check
│   ├── components.ts       # GET/POST/DELETE - component CRUD + dependency check
│   ├── production-logs.ts  # GET/POST/DELETE - production log CRUD + bulk delete
│   ├── payments.ts         # GET/POST/DELETE - payment CRUD + bulk delete
│   ├── users.ts            # GET/POST/PUT/DELETE - user CRUD + password change
│   └── tsconfig.json       # CJS override for ncc compilation
│
├── components/             # React UI components (views)
│   ├── Login.tsx           # Username/password login form
│   ├── Dashboard.tsx       # Home: stats, company info, financial summary
│   ├── Employees.tsx       # Employee master data (ADMIN only)
│   ├── Components.tsx      # Component/piece-rate item master data
│   ├── Production.tsx      # Daily production logging, PDF export (slip gaji)
│   ├── Payments.tsx        # Payment/Kasbon management, PDF export
│   ├── Finance.tsx         # Full financial ledger with running balance
│   ├── RekapHasil.tsx      # Period summary per employee
│   └── ConfirmModal.tsx    # Reusable confirmation dialog
│
├── contexts/
│   └── AuthContext.tsx      # Auth provider: login/logout, localStorage session
│
├── services/
│   └── dataService.ts      # Frontend API layer: fetch wrappers for /api/*
│
├── db/                     # Database layer
│   ├── schema.ts           # Drizzle ORM schema (5 tables)
│   ├── index.ts            # Drizzle + NeonDB connection init
│   └── seed.ts             # Seed script: 27 employees + 61 components
│
├── public/                 # Static assets (PWA)
│   ├── sw.js               # Service Worker v7 (stale-while-revalidate)
│   ├── manifest.json       # PWA manifest (id: redonepaypro-app-v2)
│   ├── icon.svg            # Custom "RP" monogram SVG
│   ├── icon-192.png        # PWA icon 192x192
│   ├── icon-512.png        # PWA icon 512x512
│   └── apple-icon-180.png  # iOS icon
│
├── App.tsx                 # Root: AuthProvider + Toaster + RootContainer
├── index.tsx               # Entry point: React root + SW registration
├── index.html              # HTML shell with meta tags + importmap
├── index.css               # Tailwind directives + custom scrollbar
├── types.ts                # Shared TypeScript interfaces + ViewState enum
├── tailwind.config.js      # Tailwind v3: custom colors (primary green), dark mode
├── postcss.config.js       # PostCSS: tailwindcss + autoprefixer
├── vite.config.ts          # Vite 6: port 3000, @ alias, GEMINI_API_KEY define
├── tsconfig.json           # Root TS: ES2022, bundler resolution, paths: @/*
├── drizzle.config.ts       # Drizzle Kit: PostgreSQL, schema at db/schema.ts
├── vercel.json             # Vercel routing: /api/* pass-through, /* → SPA fallback
├── package.json            # Dependencies + scripts (dev/build/preview)
├── .env.example            # Environment variable template
└── metadata.json           # AI Studio metadata
```

---

## Database Schema (5 Tables)

| Table | Primary Key | Key Columns | Notes |
|-------|------------|-------------|-------|
| `employees` | `id` (text, KPRD-XXX) | name, address | 27 seeded employees |
| `components` | `id` (text, KP-XXX) | name, price (numeric 15,2) | 61 seeded piece-rate items |
| `production_logs` | `id` (text) | date, employee_id → employees, component_id → components, qty, price_snapshot, total, created_at | Tracks daily output per employee |
| `payments` | `id` (text) | date, employee_id → employees, amount, type (KASBON/SALARY), note, created_at | Tracks payments to employees |
| `app_users` | `username` (text) | password, role (ADMIN/USER), employee_id → employees, full_name | Auth users (plaintext passwords) |

**Relationships:**
- `production_logs.employee_id` → `employees.id`
- `production_logs.component_id` → `components.id`
- `payments.employee_id` → `employees.id`
- `app_users.employee_id` → `employees.id`

---

## API Routes (Vercel Serverless Functions)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/auth` | POST | Login: validates username+password, returns UserAccount or null |
| `/api/employees` | GET, POST, DELETE | Employee CRUD; GET with `?checkDeps=1&id=X` checks referential integrity |
| `/api/components` | GET, POST, DELETE | Component CRUD; GET with `?checkDeps=1&id=X` checks production_logs references |
| `/api/production-logs` | GET, POST, DELETE | Production log CRUD; DELETE with `?all=1` for bulk cleanup |
| `/api/payments` | GET, POST, DELETE | Payment CRUD; DELETE with `?all=1` for bulk cleanup |
| `/api/users` | GET, POST, PUT, DELETE | User CRUD; PUT with `?action=password` for password change |

**Patterns across all routes:**
- All use `db` from `db/index.ts` (Drizzle + NeonDB HTTP)
- `GET` returns JSON array/object; `POST` does upsert (onConflictDoUpdate); `DELETE` deletes by ID
- Error handling: try/catch → `res.status(500).json({ error: err.message })`
- No authentication middleware (API is open — auth enforced at UI level)

---

## Frontend Architecture

### Routing
- **State-based routing** (not URL routing): `ViewState` enum controls which component renders
- `vercel.json` has SPA fallback: all non-API paths → `/index.html`
- Role-based menu visibility: ADMIN sees all; USER sees limited menu

### Component Tree
```
App
├── AuthProvider (context)
│   ├── Login (when !isAuthenticated)
│   └── AppLayout (when isAuthenticated)
│       ├── Sidebar (role-filtered menu items)
│       ├── Header (theme toggle, profile dropdown, password change)
│       ├── Main Content (conditional render by ViewState)
│       │   ├── Dashboard (Home, stats, financial summary)
│       │   ├── Employees (ADMIN only, master data)
│       │   ├── Components (master data, both roles)
│       │   ├── Production (daily logs, input form, PDF export)
│       │   ├── Payments (payment/kasbon, input form, PDF export)
│       │   ├── Finance (ADMIN only, full ledger)
│       │   └── RekapHasil (ADMIN only, period summary)
│       └── Mobile Bottom Nav (4 items, md:hidden)
└── Toaster (react-hot-toast)
```

### Auth Flow
1. `AuthProvider` checks `localStorage['borongan_current_user']` on mount
2. If found → `isAuthenticated = true` → renders `AppLayout`
3. If not → renders `Login` component
4. Login POSTs to `/api/auth` → on success, stores user in localStorage via `login()`
5. Logout clears localStorage + resets state
6. Password change: PUT `/api/users?action=password` → updates localStorage if self

### RBAC (Role-Based Access Control)
- **ADMIN:** Full access to all views and all data
- **USER:** Filtered to own `employeeId`:
  - Dashboard: stats filtered to own production/payments
  - Production: only own logs, auto-set employee filter
  - Payments: only own payments, auto-set employee filter
  - Components: view-only (can see list but not edit)
  - Cannot access: Employees, Finance, RekapHasil
- **UI enforcement only** (API is open — no server-side RBAC)

---

## Key Data Flows

### Production Logging Flow
1. User selects Employee + Component + Date + Qty
2. Frontend calculates `total = qty × price` (price from component)
3. `priceSnapshot` stored to freeze price at entry time
4. POST to `/api/production-logs`

### Payment Flow (Kasbon/Salary)
1. User selects Employee + Type (KASBON/SALARY) + Amount + Date
2. Shows current balance (`totalProduction - totalPayments`) for that employee
3. If SALARY type and amount > balance → overpay warning (confirms as Kasbon)
4. POST to `/api/payments`

### Financial Ledger (Finance.tsx)
1. Fetches ALL production_logs + payments + employees + components
2. Merges into `LedgerItem[]` with IN (production) / OUT (payment) types
3. Sorts by date then type (IN before OUT on same date)
4. Calculates running balance
5. Displays with pagination + date filters

### Rekapitulasi (RekapHasil.tsx)
1. User picks date range → per-employee aggregation
2. For each employee: sum production → totalUpah, sum payments → totalDibayar, saldo = upah - dibayar
3. Two PDF export modes: "Global" (summary table) and "Detail" (per-employee breakdown)

---

## Build & Deploy

| Aspect | Detail |
|--------|--------|
| **Dev server** | `npm run dev` → Vite on port 3000 |
| **Build** | `npm run build` → Vite outputs to `dist/` |
| **Preview** | `npm run preview` |
| **Seed DB** | `npx tsx db/seed.ts` |
| **Schema push** | `npx drizzle-kit push` |
| **Hosting** | Vercel (project: redone-paypro) |
| **Deploy** | GitHub push → Vercel auto-deploy |
| **Domain** | paypro.redone.my.id (Vercel-managed SSL) |
| **Database** | NeonDB (connection via DATABASE_URL env var) |
| **API bundler** | ncc (via @vercel/node) — compiles to CJS |

### Environment Variables
| Variable | Used By | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | db/index.ts (runtime) | NeonDB pooled connection |
| `DATABASE_URL_UNPOOLED` | drizzle-kit, seed.ts | NeonDB direct connection |
| `GEMINI_API_KEY` | vite.config.ts (build-time only) | Defined but not actively used |

---

## PWA Configuration

- **Service Worker:** `public/sw.js` v7 — caches cdnjs (jsPDF libraries) + root `/`
- **Cache strategy:** Stale-while-revalidate for static assets; network-first for navigation
- **API bypass:** `/api/*` requests never cached
- **Manifest:** `public/manifest.json` — `id: redonepaypro-app-v2`, theme_color: #22c55e, bg: #0f172a
- **Icons:** SVG monogram "RP" + 192/512 PNG + 180 Apple icon

---

## Design System

- **Framework:** Tailwind CSS v3 with custom theme
- **Primary color:** Green (#22c55e) — used for production/positive amounts
- **Dark mode:** Class-based (`dark:` prefix), slate-900 backgrounds
- **Custom colors defined:** `primary` (50/100/500/600/700/900), `dark` (bg/card/border)
- **Fonts:** Inter (body), JetBrains Mono (mono, for numbers)
- **Icons:** lucide-react (Tree-shakeable SVG icons)
- **Animations:** `fade-in` keyframe (0.2s ease-out, scale 0.95→1)

---

## Known Concerns

| Concern | Severity | Notes |
|---------|----------|-------|
| Plaintext passwords in DB | High | app_users.password stored as plaintext |
| No server-side auth | Medium | API routes have no auth middleware — anyone with URL can call them |
| Tailwind v3 deprecated | Low | v4 uses different config format; upgrade deferred |
| jsPDF loaded via CDN | Low | Relies on cdnjs CDN; SW caches it but offline mode may fail for PDF |
| State-based routing | Low | No URL sharing/bookmarking; all navigation resets on refresh |
| No input validation at API layer | Low | Validation only in frontend forms |

---

## File Size Summary

| Directory | Files | Primary Purpose |
|-----------|-------|-----------------|
| `api/` | 7 | Vercel serverless functions (backend) |
| `components/` | 10 | React UI views |
| `contexts/` | 1 | Auth state management |
| `services/` | 1 | Frontend API layer |
| `db/` | 3 | Database schema + connection + seed |
| `public/` | 6 | PWA assets |
| Root | 12 | Config, entry point, types |
