# Concerns & Technical Debt

*Diperbarui: 2026-06-12. Semua isu CRITICAL dari map sebelumnya (2026-06-10) dikonfirmasi masih ada.*

## CRITICAL (Harus diperbaiki sebelum produksi)

### [SEC-1] Kredensial Supabase Hardcoded di Source Code
- **File**: `services/supabaseClient.ts:10-11`
- **Issue**: URL dan Anon Key di-hardcode sebagai fallback
- **Evidence**: `'https://sartektzisafnmbiuhwd.supabase.co'` dan JWT key di source
- **Risk**: Siapa pun dengan akses repo bisa mengakses database
- **Fix**: Hapus hardcode, gunakan env vars saja. Rotate key di Supabase dashboard.

### [SEC-2] Password Disimpan Plaintext
- **File**: `services/dataService.ts:274`, `types.ts:59`
- **Issue**: `app_users.password` disimpan dan dibandingkan tanpa hashing
- **Evidence**: `.eq('password', password)` — direct string comparison di login query
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
- **Risk**: Performa degradasi seiring bertambahnya data; memory overhead (dengan ~7K LOC dan pertumbuhan data)
- **Fix**: Implementasi cursor/offset pagination di DataService

### [SIZE-0] Komponen Sangat Besar (Updated 2026-06-12)
- **Files & current line counts**:
  - `components/Production.tsx` — ~1,378 baris
  - `components/Payments.tsx` — ~1,211 baris
  - `components/Employees.tsx` — ~1,039 baris
  - `App.tsx` — ~636 baris
- **Issue**: Tumbuh signifikan sejak commit `c6c4f83` — jauh melebihi 500 baris
- **Risk**: Sulit di-maintain, high merge conflict risk, render performa buruk
- **Fix**: Split ke sub-components dan ekstrak logika ke custom hooks

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
- **Files**: `Employees.tsx`, `Components.tsx`, `Production.tsx`, `Payments.tsx`, `RekapHasil.tsx`
- **Issue**: Inisialisasi jsPDF, header, styling tabel hampir identik di semua komponen
- **Fix**: Ekstrak ke `utils/pdfExporter.ts`

### [DUP-2] Logika Pagination Duplikat di 4 Komponen
- **Files**: `Components.tsx`, `Production.tsx`, `Payments.tsx`, `Finance.tsx`
- **Issue**: State `currentPage`, `totalPages`, `itemsPerPage` dan kalkulasinya diulang
- **Fix**: Buat custom hook `usePagination(items, itemsPerPage)`

### [DUP-3] Logika Filter Panel Duplikat
- **Files**: `Production.tsx`, `Payments.tsx`
- **Issue**: Collapsible filter section dengan struktur dan styling identik
- **Fix**: Ekstrak ke reusable `FilterPanel` component

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

### [MISC-2] recharts Ada di package.json Tapi Tidak Terpakai
- **File**: `package.json`
- **Issue**: `recharts@2.12.7` tercantum sebagai dependency tapi tidak terdeteksi digunakan aktif
- **Risk**: ~200KB bundle bloat
- **Fix**: Cek penggunaan, hapus jika tidak diperlukan: `npm uninstall recharts`

### [MISC-3] Dua Salinan sw.js
- **Files**: `/sw.js` (root) dan `/public/sw.js`
- **Issue**: Tidak jelas mana yang aktif — berpotensi konflik saat update
- **Fix**: Konfirmasi satu lokasi canonical, hapus duplikat

---

## LOW

### [SEC-5] `window as any` untuk jsPDF Access
- **Files**: `Production.tsx`, `Payments.tsx`
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

### [LOCALE-1] Hardcoded Locale `'en-CA'`
- **Files**: Multiple components menggunakan `'en-CA'` untuk format tanggal
- **Issue**: Harus update semua file jika lokalisasi berubah
- **Fix**: Buat konstanta atau utility function `formatDate()`

---

## Summary
| Severity | Count |
|----------|-------|
| CRITICAL | 4 |
| HIGH | 4 |
| MEDIUM | 10 |
| LOW | 5 |
| **Total** | **23** |

**Top 3 prioritas immediate action:**
1. Rotate Supabase credentials + pindah ke env vars
2. Hash password dengan bcrypt
3. Hapus password dari localStorage
