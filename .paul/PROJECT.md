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
| ✓ Tailwind CSS via PostCSS (bukan CDN) | Phase 3 | 42.93 kB CSS bundle, no CORS error |
| ✓ PWA SW bersih (tidak cache CDN URLs) | Phase 3 | CACHE_NAME v6, urlsToCache clean |
| ✓ PWA meta tags lengkap | Phase 3 | apple + mobile-web-app-capable |
| ✓ importmap bersih dari dead entries | Phase 3 | recharts + supabase dihapus |
| ✓ Label button ringkas (satu kata) di header | Phase 6 | Employees & Components: Cleanup Data→Cleanup, Ekspor PDF→Ekspor |
| ✓ Data master karyawan di-seed (27 orang) | Phase 5 | KPRD-001 s/d KPRD-049 via db/seed.ts |
| ✓ Data master komponen di-seed (61 item) | Phase 5 | KP-001 s/d KP-061 via db/seed.ts |
| ✓ Ikon app modern (SVG + PNG local) | Phase 7 | Monogram "RP", zero CDN dependency |

## Key Decisions (Phase 7)
| Decision | Rationale |
|----------|-----------|
| SVG custom monogram "RP" sebagai app icon | Modern, scalable, zero CDN dependency |
| PNG generated via sharp (temp, removed setelah use) | Satu kali konversi untuk PWA manifest + iOS |
| Bump manifest `id` ke v2 | Force PWA re-register dengan ikon baru |

## Key Decisions (Phase 6)
| Decision | Rationale |
|----------|-----------|
| Label button Cleanup/Ekspor/Tambah di Employees & Components | Konsisten dengan Phase 4 (satu kata) |

## Key Decisions (Phase 5)
| Decision | Rationale |
|----------|-----------|
| Seed via `npx tsx db/seed.ts` (bukan API endpoint) | Tidak perlu dev server running; lebih cepat untuk bulk insert |
| loadEnv() manual tanpa dotenv | Tidak menambah dependency ke project |
| onConflictDoUpdate (upsert) | Script aman dijalankan ulang tanpa error duplikat |

## Key Decisions (Phase 4)
| Decision | Rationale |
|----------|-----------|
| Label button satu kata (Ekspor, Cleanup, Input, Periode, Detail, Global) | Icon sudah menjelaskan fungsi; label panjang boros ruang di layar kecil |

## Key Decisions (Phase 3)
| Decision | Rationale |
|----------|-----------|
| Tailwind v3 via PostCSS, bukan v4 | v4 config format berbeda; v3 match existing theme config |
| CJS format untuk tailwind.config.js | package.json tanpa type:module — CJS default |
| Bump SW CACHE_NAME v5→v6 | Force replacement SW lama yang masih cache CDN URL |

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
*Last updated: 2026-06-12 after Phase 7 (07-modernize-app-icon)*
