# Codebase Overview

## Purpose
RedonePaypro adalah **Sistem Manajemen Produksi & Penggajian** untuk pekerja borongan (piece-rate) di PT. REDONE BERKAH MANDIRI UTAMA. Aplikasi mengelola pencatatan hasil produksi harian, pembayaran gaji/kasbon, dan laporan keuangan per karyawan.

## Domain
- Manajemen karyawan dengan ID format `KY-001`
- Manajemen komponen/item produksi dengan ID format `KP-001`
- Pencatatan log produksi (jumlah unit yang diselesaikan × harga satuan)
- Pembayaran: SALARY (gaji) dan KASBON (pinjaman/uang muka)
- Buku kas / ledger per karyawan
- Rekap dan laporan PDF

## User Roles
| Role | Akses |
|------|-------|
| ADMIN | Full access: semua menu termasuk Karyawan, Keuangan, Rekap |
| USER | Terbatas: hanya Produksi, Pembayaran, Komponen — data difilter ke employee milik user sendiri |

## Key Features
1. CRUD karyawan + manajemen akun login per karyawan
2. CRUD komponen/item dengan harga satuan
3. Input log produksi harian (qty × harga → total)
4. Input pembayaran (gaji / kasbon)
5. Dashboard statistik (total karyawan, komponen, produksi, pembayaran)
6. Laporan keuangan: ledger, rekap per periode
7. Export PDF (via jsPDF CDN)
8. Dark mode toggle (persisted ke localStorage)
9. Responsive: sidebar desktop + bottom nav mobile
10. PWA (installable, offline-capable via sw.js)

## Language
UI dalam Bahasa Indonesia. Business logic/kode dalam Bahasa Inggris.

## Application Type
- **Frontend-only SPA** (Single Page Application) tanpa backend custom
- Backend-as-a-Service: **Supabase** (PostgreSQL + anon key access)
- Routing: state-based (tidak menggunakan React Router — navigasi via `currentView: ViewState`)

## Entry Points
- `index.tsx` — React root mount + Service Worker registration
- `App.tsx` — Auth check, layout, routing via ViewState
- `contexts/AuthContext.tsx` — Session persistence via localStorage key `borongan_current_user`
