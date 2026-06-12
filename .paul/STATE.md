## Codebase Map

✅ **Codebase mapped** — 2026-06-13
File: `.paul/CODEBASE.md`
Status: Complete (full directory scan, all source files read)

## Current Position

Milestone: v1.7 Production UI Polish — ✅ Complete
All phases done.
Status: Milestone v1.7 complete
Last activity: 2026-06-13 — Phase 9 complete — Production Card Compact verified

Progress:
- Milestone v1.0: [██████████] 100% (complete)
- Milestone v1.1: [██████████] 100% (complete)
- Milestone v1.2: [██████████] 100% (complete)
- Milestone v1.3: [██████████] 100% (complete)
- Milestone v1.4: [██████████] 100% (complete)
- Milestone v1.5: [██████████] 100% (complete)
- Milestone v1.6: [██████████] 100% (complete)
- Phase 8: [██████████] 100% (1/1 plans)
- Milestone v1.7: [██████████] 100%
- Phase 9: [██████████] 100% (1/1 plans)
- Phase 10: [██████████] 100% (1/1 plans)

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ○        ○        ✓     [Phase 10 complete]
```

## Plans in Phase 01

| Plan | File | Status | Note |
|------|------|--------|------|
| 01-01 | `.paul/phases/01-deploy-vercel/01-01-PLAN.md` | ✓ Complete | Deploy Vercel + domain |
| 01-02 | `.paul/phases/01-deploy-vercel/01-02-PLAN.md` | ✓ Complete | Hapus duplikat sw.js & manifest.json |
| 01-03 | `.paul/phases/01-deploy-vercel/01-03-PLAN.md` | ✓ Complete | Cleanup: recharts, Kasbon.tsx, .gitignore |

## Plans in Phase 02

| Plan | File | Status | Note |
|------|------|--------|------|
| 02-01 | `.paul/phases/02-migrate-neondb/02-01-PLAN.md` | ✓ Complete | Foundation: Drizzle setup + schema push |
| 02-02 | `.paul/phases/02-migrate-neondb/02-02-PLAN.md` | ✓ Complete | API Routes: 6 Vercel serverless functions |
| 02-03 | `.paul/phases/02-migrate-neondb/02-03-PLAN.md` | ✓ Complete | Frontend: rewrite dataService.ts |

## Plans in Phase 03

| Plan | File | Status | Note |
|------|------|--------|------|
| 03-01 | `.paul/phases/03-frontend-hardening/03-01-PLAN.md` | ✓ Complete | Tailwind CDN → PostCSS build |
| 03-02 | `.paul/phases/03-frontend-hardening/03-02-PLAN.md` | ✓ Complete | Fix SW + cleanup index.html |

## Plans in Phase 04

| Plan | File | Status | Note |
|------|------|--------|------|
| 04-01 | `.paul/phases/04-ui-label-polish/04-01-PLAN.md` | ✓ Complete | Persingkat label button di 3 halaman |

## Plans in Phase 05

| Plan | File | Status | Note |
|------|------|--------|------|
| 05-01 | `.paul/phases/05-data-seeding/05-01-PLAN.md` | ✓ Complete | Seed 27 karyawan + 61 komponen |

## Plans in Phase 06

| Plan | File | Status | Note |
|------|------|--------|------|
| 06-01 | `.paul/phases/06-ui-label-polish-employees-components/06-01-PLAN.md` | ✓ Complete | Persingkat label button Employees & Components |

## Plans in Phase 07

| Plan | File | Status | Note |
|------|------|--------|------|
| 07-01 | `.paul/phases/07-modernize-app-icon/07-01-PLAN.md` | ✓ Complete | SVG icon + PNG set + manifest/index.html/App.tsx update |

## Plans in Phase 08

| Plan | File | Status | Note |
|------|------|--------|------|
| 08-01 | `.paul/phases/08-mobile-card-ui/08-01-PLAN.md` | ✓ Complete | Employees mobile (hapus alamat) + Components mobile (2 kolom + toggle aksi) |

## Plans in Phase 09

| Plan | File | Status | Note |
|------|------|--------|------|
| 09-01 | `.paul/phases/09-production-card-compact/09-01-PLAN.md` | ✓ Complete | Mobile card 2 kolom + toggle aksi |

## Plans in Phase 10

| Plan | File | Status | Note |
|------|------|--------|------|
| 10-01 | `.paul/phases/10-pwa-optimization/10-01-PLAN.md` | ✓ Complete | Manifest + SW + offline indicator |

## Session Continuity

Last session: 2026-06-13
Stopped at: Phase 9 + 10 complete — Milestone v1.7 shipped
Next action: Semua phase selesai. Siap untuk milestone berikutnya.
Resume file: N/A
Codebase map: .paul/CODEBASE.md

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-11 | Deploy via Vercel GitHub integration | Auto-deploy per push, SSL gratis |
| 2026-06-12 | Drizzle ORM + @neondatabase/serverless | Vercel Functions tidak support TCP |
| 2026-06-12 | Hapus "type": "module" + api/tsconfig.json | ncc CJS incompatible dengan ESM |
| 2026-06-12 | Tailwind v3 via PostCSS | v4 config format berbeda; v3 match existing |
| 2026-06-12 | Bump SW CACHE_NAME v5→v6 | Force replace SW lama yang cache CDN URL |
| 2026-06-12 | Label button satu kata (Ekspor, Cleanup, Input, dll.) | Icon sudah menjelaskan fungsi; label ringkas hemat ruang di mobile |
| 2026-06-12 | Seed via npx tsx db/seed.ts (bukan API endpoint) | Tidak perlu server running; lebih cepat untuk bulk insert |
| 2026-06-12 | SVG favicon + PNG fallback untuk PWA icon | SVG crisp di semua ukuran, zero CDN dependency |
| 2026-06-12 | Monogram "RP" + green (#22c55e) + dark bg (#0f172a) | Konsisten dengan theme-color & background_color manifest |

## Accumulated Context

### What Was Built

**Milestone v1.0 (Phase 1):** App live di paypro.redone.my.id (Vercel, HTTPS, cleanup dead code)

**Milestone v1.1 (Phase 2):** NeonDB + Drizzle ORM, 6 Vercel Serverless Functions, rewrite dataService.ts

**Milestone v1.2 (Phase 3):**
- tailwind.config.js + postcss.config.js + index.css: Tailwind via PostCSS build
- public/sw.js v6: clean urlsToCache, hapus Supabase check
- index.html: mobile-web-app-capable meta, importmap bersih

**Milestone v1.3 (Phase 4):**
- Production.tsx, Payments.tsx, RekapHasil.tsx: label button header dipersingkat ke satu kata

**Milestone v1.4 (Phase 5):**
- db/seed.ts: 27 karyawan + 61 komponen ter-seed ke NeonDB production

**Phase 6:**
- Employees.tsx: `Cleanup Data` → `Cleanup`, `Ekspor PDF` → `Ekspor`
- Components.tsx: `Cleanup Data` → `Cleanup`, `Ekspor PDF` → `Ekspor`

**Phase 7:**
- public/icon.svg: monogram "RP" SVG custom
- public/icon-192.png, icon-512.png, apple-icon-180.png: PNG variants
- manifest.json: local icon paths, id v2
- index.html: SVG favicon + local apple-touch-icon
- App.tsx: sidebar logo → SVG baru
- Zero Flaticon CDN dependency

### Known Concerns
- Password stored plaintext di NeonDB — perlu hashing di milestone berikutnya
- Tailwind v3 — upgrade ke v4 perlu refactor config
