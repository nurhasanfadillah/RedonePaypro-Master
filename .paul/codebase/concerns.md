# Concerns & Technical Debt

## CRITICAL (Harus diperbaiki sebelum produksi)

### [SEC-1] Kredensial Supabase Hardcoded di Source Code
- **File**: `services/supabaseClient.ts:10-11`
- **Issue**: URL dan Anon Key di-hardcode sebagai fallback
- **Risk**: Siapa pun dengan akses repo bisa mengakses database
- **Fix**: Hapus hardcode, gunakan env vars saja. Rotate key di Supabase dashboard.

### [SEC-2] Password Disimpan Plaintext
- **File**: `services/dataService.ts:274`, `types.ts:59`
- **Issue**: `app_users.password` disimpan dan dibandingkan tanpa hashing
- **Risk**: Database breach = semua password user terekspos
- **Fix**: Implementasi bcrypt/argon2 untuk hash password

### [SEC-3] Password User Disimpan di localStorage
- **File**: `contexts/AuthContext.tsx:26`
- **Issue**: Full `UserAccount` object (termasuk password) diserialisasi ke localStorage
- **Risk**: XSS attack bisa mencuri semua kredensial; visible di browser DevTools
- **Fix**: Jangan simpan password. Gunakan session token saja.

### [SEC-4] RBAC Enforcement Hanya di React (Client-side)
- **File**: Semua page components (Production.tsx, Payments.tsx, dll.)
- **Issue**: Filter data berdasarkan role hanya dilakukan di komponen React, bukan di database (tidak ada RLS Supabase)
- **Risk**: User bisa bypass filter dengan memodifikasi client-side code
- **Fix**: Implementasi Row-Level Security (RLS) di Supabase untuk semua tabel

---

## HIGH

### [PERF-1] `.limit(999999)` — Tidak Ada Pagination di Database
- **File**: `services/dataService.ts:16, 98, 167, 223`
- **Issue**: Semua record diambil sekaligus tanpa batasan
- **Risk**: Performa degradasi seiring bertambahnya data; memory overhead
- **Fix**: Implementasi cursor/offset pagination di DataService

### [TYPE-1] Penggunaan `any` di Banyak Tempat
- **Files**: `App.tsx:40` (icon props), `Dashboard.tsx:60` (StatCard props), `dataService.ts:173,227,292` (Supabase mapping), `Production.tsx:30`
- **Issue**: Type safety tidak terjaga pada komponen dan response Supabase
- **Fix**: Buat proper interface untuk semua component props dan Supabase response

### [ERR-1] Unhandled Promise Rejections
- **File**: `App.tsx:439-443` (DataService.init() tanpa catch), beberapa komponen panggil loadData() tanpa catch
- **Issue**: Promise rejection tidak ter-handle bisa silent fail atau crash
- **Fix**: Tambah try-catch atau .catch() pada semua operasi async

---

## MEDIUM

### [DUP-1] Logika PDF Export Duplikat di 5 Komponen
- **Files**: `Employees.tsx:208-295`, `Components.tsx:131-221`, `Production.tsx:228-482`, `Payments.tsx:217-351`, `RekapHasil.tsx:115-378`
- **Issue**: Inisialisasi jsPDF, header, styling tabel hampir identik di semua komponen
- **Fix**: Ekstrak ke `utils/pdfExporter.ts`

### [DUP-2] Logika Pagination Duplikat di 4 Komponen
- **Files**: `Components.tsx`, `Production.tsx`, `Payments.tsx`, `Finance.tsx`
- **Issue**: State `currentPage`, `totalPages`, `itemsPerPage` dan kalkulasinya diulang
- **Fix**: Buat custom hook `usePagination(items, itemsPerPage)`

### [DUP-3] Logika Filter Panel Duplikat
- **Files**: `Production.tsx:585-640`, `Payments.tsx:468-503`
- **Issue**: Collapsible filter section dengan struktur dan styling identik
- **Fix**: Ekstrak ke reusable `FilterPanel` component

### [SIZE-1] Production.tsx — 951 Baris
- **Issue**: Satu file berisi form logic, PDF export, cleanup, filter, pagination, desktop + mobile view
- **Risk**: Sulit di-maintain, high merge conflict risk
- **Fix**: Split ke `ProductionForm.tsx`, `ProductionTable.tsx`, `ProductionExport.tsx`

### [SIZE-2] Payments.tsx — 804 Baris & Employees.tsx — 760 Baris
- **Issue**: Sama dengan Production.tsx — terlalu banyak concern dalam satu file
- **Fix**: Ekstrak form dan export ke file terpisah

### [ERR-2] Tidak Ada Error Boundary
- **File**: `App.tsx` — tidak ada React Error Boundary
- **Issue**: Error di satu komponen bisa crash seluruh app
- **Fix**: Bungkus AppLayout dengan `ErrorBoundary` component

### [PERF-2] Tidak Ada Memoization
- **Files**: `Production.tsx`, `Payments.tsx` — event handlers dibuat ulang tiap render
- **Issue**: Child components re-render tidak perlu saat parent state berubah
- **Fix**: Pakai `useCallback` untuk event handlers, `React.memo` untuk NavItem

### [PERF-3] Multiple Supabase Queries Tanpa Caching
- **Files**: `Dashboard.tsx:24-51`, `EmployeeDetail.tsx:31-98`
- **Issue**: Setiap navigasi halaman memicu 4+ query Supabase baru; tidak ada caching antar halaman
- **Fix**: Pertimbangkan centralized state (Zustand) atau react-query untuk caching

### [DB-1] Kemungkinan Missing Indexes
- **Issue**: `employee_id` dan `component_id` di `production_logs` dan `payments` mungkin tidak terindex
- **Risk**: Query filter by employee lambat saat data besar
- **Fix**: `CREATE INDEX idx_prod_employee ON production_logs(employee_id);`

### [VAL-1] Tidak Ada Schema Validation Library
- **Issue**: Validasi form hanya cek trim/length — tidak ada regex, range check, format date yang ketat
- **Fix**: Gunakan `zod` untuk schema validation yang konsisten

### [MISC-1] Kasbon.tsx Deprecated Masih Diimport
- **File**: `App.tsx:35`, `components/Kasbon.tsx` (16 baris)
- **Issue**: File deprecated masih ada dan diimport walaupun tidak digunakan di menu
- **Fix**: Hapus import dan file

---

## LOW

### [SEC-5] `window as any` untuk jsPDF Access
- **Files**: `Production.tsx:232`, `Payments.tsx:219,229`
- **Issue**: Type cast `as any` untuk akses `window.jspdf` — tidak type-safe
- **Fix**: Buat declaration file `jspdf.d.ts` dengan type untuk global `window.jspdf`

### [DB-2] Tidak Ada Timestamp Audit
- **Issue**: Tabel `employees` dan `components` kemungkinan tidak punya `created_at`/`updated_at`
- **Fix**: Tambah timestamp columns dengan default `NOW()`

### [PWA-1] Icon PWA dari External CDN
- **File**: `manifest.json`
- **Issue**: Icon 192×192 dan 512×512 dihosting di Flaticon CDN — dependency external
- **Fix**: Copy icon ke project, serve locally

### [ROUTE-1] Tidak Ada URL Routing
- **Issue**: State-based navigation — URL tidak berubah saat navigasi, back button tidak bekerja, tidak bisa bookmark halaman tertentu
- **Fix**: Migrasi ke React Router v6 jika perlu shareable URLs

---

## Summary
| Severity | Count |
|----------|-------|
| CRITICAL | 4 |
| HIGH | 3 |
| MEDIUM | 9 |
| LOW | 4 |
| **Total** | **20** |

**Top 3 prioritas immediate action:**
1. Rotate Supabase credentials + pindah ke env vars
2. Hash password dengan bcrypt
3. Hapus password dari localStorage
