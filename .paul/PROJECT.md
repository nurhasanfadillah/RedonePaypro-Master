# Project: RedonePaypro

## Value Proposition
Sistem Manajemen Produksi & Penggajian untuk pekerja borongan (piece-rate) di PT. REDONE BERKAH MANDIRI UTAMA. Mengelola pencatatan hasil produksi harian, pembayaran gaji/kasbon, dan laporan keuangan per karyawan.

## Application Type
- Frontend SPA (React + Vite)
- Backend: Vercel Serverless Functions di `/api/` + NeonDB (PostgreSQL via Drizzle ORM)
- Target hosting: Vercel
- Target domain: paypro.redone.my.id

## Core Constraints
- Backend: Vercel Functions di /api/ (server-side, credentials tidak di-expose ke browser)
- State-based routing (bukan URL routing) — vercel.json punya 2 rules: api pass-through + SPA fallback
- PWA (sw.js + manifest.json harus tersedia di root domain)
- Tailwind CSS dan jsPDF diload via CDN (bukan npm)

## User Roles
| Role | Akses |
|------|-------|
| ADMIN | Full access |
| USER | Terbatas: Produksi, Pembayaran, Komponen (filtered ke employee sendiri) |

## Tech Stack
- React 19 + TypeScript + Vite 6
- Drizzle ORM + @neondatabase/serverless (HTTP driver)
- Tailwind CSS (CDN), lucide-react, react-hot-toast
- ~~recharts~~ — dihapus Phase 1 (tidak diimport, 200KB bloat)
- ~~@supabase/supabase-js~~ — dihapus Phase 2 (migrasi ke NeonDB)

## Deployment (v1.1 — Shipped 2026-06-12)
- **Production URL:** https://paypro.redone.my.id
- **Hosting:** Vercel (project: redone-paypro)
- **CI/CD:** GitHub → Vercel auto-deploy (push ke `main`)
- **SSL:** Let's Encrypt via Vercel (aktif)
- **Database:** NeonDB (PostgreSQL) via Drizzle ORM + @neondatabase/serverless
- **API:** 6 Vercel Serverless Functions di `/api/`

## Requirements Validated

| Requirement | Phase | Notes |
|-------------|-------|-------|
| ✓ App live di paypro.redone.my.id | Phase 1 | HTTPS, auto-deploy aktif |
| ✓ PWA (sw.js + manifest.json) berjalan | Phase 1 | Files di public/ |
| ✓ Database NeonDB via Drizzle ORM | Phase 2 | 5 tabel, schema live |
| ✓ Backend Vercel Serverless Functions | Phase 2 | 6 routes di /api/ |
| ✓ Zero Supabase dependency | Phase 2 | @supabase/supabase-js dihapus |
| ✓ Semua CRUD via /api/* | Phase 2 | dataService.ts rewrite total |
| ✓ Login/Auth via NeonDB | Phase 2 | /api/auth, session di localStorage |

## Key Decisions (Phase 1)
| Decision | Rationale |
|----------|-----------|
| Deploy via Vercel CLI, bukan manual dashboard | Repeatable, automatable |
| Canonical PWA files di `public/`, bukan root | Vite hanya serve `public/` |
| Hapus `Kasbon.tsx` | Deprecated, fungsionalitas ada di `Payments.tsx` |
| Hapus `recharts` | 200KB bundle bloat, tidak diimport |
| State-based routing → tidak butuh `vercel.json` | App tidak pakai URL routing |

## Key Decisions (Phase 2)
| Decision | Rationale |
|----------|-----------|
| Drizzle ORM + @neondatabase/serverless HTTP driver | Vercel Functions tidak support TCP — HTTP driver required |
| Hapus `"type": "module"` dari package.json | ncc (bundler @vercel/node) output CJS; type:module = ESM conflict |
| `api/tsconfig.json` dengan `module: CommonJS` | Override root tsconfig agar ncc compile ke CJS — perlu dipertahankan |
| apiFetch helper tanpa auth headers | API tidak require auth (konsistent dengan anon key model sebelumnya) |
| Password plaintext di DB (deferred hardening) | Scope migrasi, bukan security hardening — perlu diperhatikan di milestone berikutnya |

## Environment Variables
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | NeonDB pooled connection string (digunakan Vercel Functions saat runtime) |
| `DATABASE_URL_UNPOOLED` | NeonDB direct connection string (digunakan drizzle-kit push/pull) |
| `GEMINI_API_KEY` | Google Gemini (belum aktif digunakan) |

---
*Last updated: 2026-06-12 after Phase 2 (02-migrate-neondb)*
