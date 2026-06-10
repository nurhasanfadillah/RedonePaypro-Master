# Project: RedonePaypro

## Value Proposition
Sistem Manajemen Produksi & Penggajian untuk pekerja borongan (piece-rate) di PT. REDONE BERKAH MANDIRI UTAMA. Mengelola pencatatan hasil produksi harian, pembayaran gaji/kasbon, dan laporan keuangan per karyawan.

## Application Type
- Frontend-only SPA (React + Vite)
- Backend-as-a-Service: Supabase (PostgreSQL)
- Target hosting: Vercel
- Target domain: paypro.redone.my.id

## Core Constraints
- Tidak ada custom backend — hanya Supabase
- State-based routing (bukan URL routing) — tidak perlu vercel.json rewrites
- PWA (sw.js + manifest.json harus tersedia di root domain)
- Tailwind CSS dan jsPDF diload via CDN (bukan npm)

## User Roles
| Role | Akses |
|------|-------|
| ADMIN | Full access |
| USER | Terbatas: Produksi, Pembayaran, Komponen (filtered ke employee sendiri) |

## Tech Stack
- React 19 + TypeScript + Vite 6
- Supabase JS SDK v2
- Tailwind CSS (CDN), lucide-react, recharts, react-hot-toast

## Environment Variables
| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `GEMINI_API_KEY` | Google Gemini (belum aktif digunakan) |
