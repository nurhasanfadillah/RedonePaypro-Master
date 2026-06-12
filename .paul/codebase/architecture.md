# Architecture

## Layer Overview
```
┌─────────────────────────────────────────────┐
│              Presentation Layer             │
│  App.tsx · components/*.tsx                 │
├─────────────────────────────────────────────┤
│           Auth / Navigation Layer           │
│  contexts/AuthContext.tsx · App.tsx         │
├─────────────────────────────────────────────┤
│              Data Access Layer              │
│  services/dataService.ts                    │
│  services/supabaseClient.ts                 │
├─────────────────────────────────────────────┤
│                   Backend                   │
│  Supabase (PostgreSQL) — cloud              │
└─────────────────────────────────────────────┘
```

## Routing
**State-based routing** (tidak menggunakan React Router).

```typescript
// types.ts:44-52
enum ViewState { DASHBOARD, EMPLOYEES, COMPONENTS, PRODUCTION, PAYMENTS, FINANCE, REKAP }

// App.tsx — kondisional render
{currentView === ViewState.DASHBOARD && <Dashboard />}
{currentView === ViewState.PRODUCTION && <Production />}
// dst.
```

Navigasi via `setCurrentView(view)` dipanggil dari sidebar/bottom nav. Tidak ada URL yang berubah — back button browser tidak bekerja.

## Authentication Flow
```
App mount
  → AuthProvider: cek localStorage 'borongan_current_user'
  → Ada? → restore user state → tampilkan AppLayout
  → Tidak? → tampilkan Login component
      ↓
Login submit → DataService.login(username, password)
  → query app_users: SELECT WHERE username=? AND password=?
  → match → AuthContext.login(userData) → localStorage + state
  → AppLayout tampil
      ↓
Logout → AuthContext.logout() → clear state + localStorage
```

Tidak menggunakan Supabase Auth — custom user table `app_users` dengan password plaintext.

## Component Hierarchy
```
index.tsx
└── App (AuthProvider wrapper)
    ├── Login.tsx [unauthenticated]
    └── AppLayout [authenticated]
        ├── Sidebar (desktop nav)
        ├── Bottom nav (mobile)
        ├── Header (profile, dark mode)
        └── Content area (ViewState dispatch)
            ├── Dashboard.tsx (DASHBOARD)
            ├── Employees.tsx (EMPLOYEES — ADMIN only)
            │   └── EmployeeDetail.tsx (modal)
            ├── Components.tsx (COMPONENTS)
            ├── Production.tsx (PRODUCTION)
            ├── Payments.tsx (PAYMENTS)
            ├── Finance.tsx (FINANCE — ADMIN only, legacy)
            └── RekapHasil.tsx (REKAP — ADMIN only)
```

### Page Components
| File | ViewState | Lines | Role |
|------|-----------|-------|------|
| `components/Dashboard.tsx` | DASHBOARD | 218 | ALL |
| `components/Employees.tsx` | EMPLOYEES | ~1,039 | ADMIN |
| `components/Components.tsx` | COMPONENTS | ~548 | ALL |
| `components/Production.tsx` | PRODUCTION | ~1,378 | ALL |
| `components/Payments.tsx` | PAYMENTS | ~1,211 | ALL |
| `components/Finance.tsx` | FINANCE | ~412 | ADMIN (legacy) |
| `components/RekapHasil.tsx` | REKAP | ~555 | ADMIN |
| `App.tsx` | (layout) | ~636 | — |

*Line counts diperbarui 2026-06-12. Peningkatan signifikan dari commit `428a029` (toast) & `c6c4f83` (core modules).*

### Shared Components
| File | Purpose |
|------|---------|
| `components/Login.tsx` | Form login (~129 baris) |
| `components/ConfirmModal.tsx` | Modal konfirmasi reusable (~79 baris) |
| `components/EmployeeDetail.tsx` | Detail/edit karyawan (modal, ~490 baris) |
| `components/Kasbon.tsx` | **Deprecated** (16 baris, masih diimport di App.tsx:35) |

## Data Models (`types.ts`)
```typescript
Employee    { id, name, address }
Component   { id, name, price }
ProductionLog { id, date, employeeId, componentId, qty, priceSnapshot, total }
Payment     { id, date, employeeId, amount, type: 'KASBON'|'SALARY', note? }
LedgerItem  { id, date, employeeId, employeeName, description, type: 'IN'|'OUT', amount, balance }
UserAccount { username, password, role: 'ADMIN'|'USER', employeeId?, fullName }
enum ViewState { DASHBOARD, EMPLOYEES, COMPONENTS, PRODUCTION, PAYMENTS, FINANCE, REKAP }
```

## Service Layer (`services/dataService.ts`)
Object literal export (bukan class). Semua fungsi `async`. ~371 baris.

```
DataService
├── Employees:  getEmployees, saveEmployee, deleteEmployee, checkEmployeeDependencies, cleanupEmployees
├── Components: getComponents, saveComponent, deleteComponent, checkComponentDependencies, cleanupComponents
├── Production: getProductionLogs, saveProductionLog, deleteProductionLog, deleteAllProductionLogs
├── Payments:   getPayments, savePayment, deletePayment, deleteAllPayments
├── Auth/Users: login, getUsers, getUserByEmployeeId, saveUser, updatePassword, deleteUserByEmployeeId
└── Utils:      resetData (localStorage cleanup)
```

**Save pattern** (upsert manual):
1. SELECT id WHERE id = emp.id
2. Ada → UPDATE; tidak ada → INSERT

**Fetch pattern**: `.limit(999999)` — semua record tanpa pagination DB.

**Data mapping**: snake_case (DB) ↔ camelCase (JS) dilakukan manual di setiap fungsi (tidak konsisten — hanya production_logs & payments yang di-map eksplisit).

## Data Flow
```
Supabase PostgreSQL (cloud)
    ↓
services/supabaseClient.ts (init koneksi)
    ↓
services/dataService.ts (CRUD, transformasi data)
    ↓
Page Component (loadData() → setState)
  ├── Filter RBAC di sisi React (bukan DB)
  ├── Render table / list
  └── Modal form → DataService.save/delete
          ↓
    Toast notification (react-hot-toast)
    + loadData() refresh
```

## Module Boundaries
- **Semua akses DB melalui DataService** — tidak ada direct Supabase call di komponen
- **Tidak ada circular import**: dataService → types; components → dataService + types
- **Tidak ada component yang import component lain** (kecuali App.tsx import halaman)
- **RBAC enforcement di React** (filter di komponen) — tidak di database level
