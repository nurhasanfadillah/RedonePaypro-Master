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
- Tailwind CSS (CDN), lucide-react, react-hot-toast
- ~~recharts~~ — dihapus Phase 1 (tidak diimport, 200KB bloat)

## Deployment (v1.0 — Shipped 2026-06-12)
- **Production URL:** https://paypro.redone.my.id
- **Hosting:** Vercel (project: redone-paypro)
- **CI/CD:** GitHub → Vercel auto-deploy (push ke `main`)
- **SSL:** Let's Encrypt via Vercel (aktif)
- **Env vars:** VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY terset di Vercel

## Key Decisions (Phase 1)
| Decision | Rationale |
|----------|-----------|
| Deploy via Vercel CLI, bukan manual dashboard | Repeatable, automatable |
| Canonical PWA files di `public/`, bukan root | Vite hanya serve `public/` |
| Hapus `Kasbon.tsx` | Deprecated, fungsionalitas ada di `Payments.tsx` |
| Hapus `recharts` | 200KB bundle bloat, tidak diimport |
| State-based routing → tidak butuh `vercel.json` | App tidak pakai URL routing |

## Environment Variables
| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `GEMINI_API_KEY` | Google Gemini (belum aktif digunakan) |
