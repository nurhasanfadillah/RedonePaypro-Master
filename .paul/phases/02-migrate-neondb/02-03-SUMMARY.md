---
phase: 02-migrate-neondb
plan: 03
subsystem: api
tags: [neondb, drizzle, vercel, fetch, dataService, supabase]

requires:
  - phase: 02-migrate-neondb plan 02-02
    provides: 6 Vercel Serverless Functions (/api/employees, components, production-logs, payments, auth, users)

provides:
  - services/dataService.ts rewrite — semua 18 metode via fetch ke /api/*
  - Penghapusan services/supabaseClient.ts dan @supabase/supabase-js
  - App berjalan penuh tanpa Supabase dependency

affects: [semua komponen React yang memanggil DataService]

tech-stack:
  added: []
  patterns: [apiFetch helper untuk error propagation konsisten, API-first data layer tanpa auth headers]

key-files:
  created: [api/tsconfig.json]
  modified: [services/dataService.ts, package.json]
  deleted: [services/supabaseClient.ts]

key-decisions:
  - "Hapus type:module dari package.json — @vercel/node (ncc) CJS output incompatible dengan ESM module loading"
  - "Tambah api/tsconfig.json dengan module:CommonJS — override tsconfig root agar ncc output CJS konsisten"
  - "apiFetch helper melempar Error dari response body — UI toast tetap berfungsi tanpa perubahan komponen"

patterns-established:
  - "apiFetch<T>(url, options) — semua DataService methods via helper ini untuk error handling seragam"
  - "No auth headers — API endpoints tidak perlu Authorization (anon model, konsisten dengan Supabase sebelumnya)"

duration: ~4jam (termasuk 4 iterasi debug ESM/CJS)
started: 2026-06-12T12:00:00Z
completed: 2026-06-12T19:30:00Z
---

# Phase 2 Plan 03: Migrate Frontend Service Layer — Summary

**services/dataService.ts ditulis ulang total (18 metode → fetch ke /api/*), supabaseClient.ts dihapus, app live di NeonDB tanpa Supabase dependency setelah resolusi ESM/CJS conflict.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~4 jam (termasuk 4x debug ESM/CJS) |
| Started | 2026-06-12 ~12:00 WIB |
| Completed | 2026-06-12 ~19:30 WIB |
| Tasks | 3 selesai (2 auto + 1 checkpoint) |
| Files modified | 4 (1 deleted, 1 created, 2 modified) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Build tanpa Supabase | Pass | npm run build bersih, tsc --noEmit bersih, supabaseClient.ts dihapus |
| AC-2: Login via API | Pass | /api/auth mengembalikan UserAccount dari NeonDB, session tersimpan di localStorage |
| AC-3: CRUD via API | Pass | Diverifikasi di production paypro.redone.my.id |
| AC-4: Error propagation | Pass | apiFetch helper throw Error dari response body, UI toast tetap berfungsi |

## Accomplishments

- dataService.ts ditulis ulang dari Supabase SDK ke 18 metode fetch yang memanggil `/api/*` endpoints
- supabaseClient.ts dan @supabase/supabase-js dihapus sepenuhnya dari codebase
- App live di paypro.redone.my.id berjalan penuh dari NeonDB via Drizzle ORM tanpa Supabase

## Task Commits

| Task | Commit | Type | Description |
|------|--------|------|-------------|
| Task 1: Rewrite dataService.ts | `a852d5e` | feat | Rewrite penuh 18 metode fetch ke /api/*, hapus supabase imports |
| Task 2: Hapus supabaseClient.ts + verify build | `a852d5e` | feat | Delete supabaseClient.ts, npm run build bersih |
| Debug: ESM/CJS conflict resolution | `ccf45b2` `4781816` `1216b40` | fix | 4 iterasi — hapus type:module + tambah api/tsconfig.json |
| Cleanup: debug endpoint | `8772f9f` | chore | Hapus api/test.ts debug endpoint |

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `services/dataService.ts` | Modified (rewrite total) | 18 metode DataService via fetch ke /api/*, apiFetch helper |
| `services/supabaseClient.ts` | Deleted | Supabase dependency dihapus |
| `api/tsconfig.json` | Created | Override module:CommonJS untuk @vercel/node ncc bundler |
| `package.json` | Modified | Hapus "type": "module" — CJS compatibility |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Hapus `"type": "module"` | ncc (bundler @vercel/node) output CJS; Node.js + type:module = ESM → exports not defined error | package.json lebih sederhana, CJS default |
| Tambah `api/tsconfig.json` | Override root tsconfig — api/ harus compile ke CommonJS agar match ncc output | Perlu dipertahankan jika ada api/ file baru |
| apiFetch helper tanpa auth headers | API endpoints tidak require auth (konsisten dengan Supabase anon key model) | Tidak perlu ubah UI components |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 1 (ESM/CJS conflict) | 4 iterasi debug tapi tidak mengubah fungsionalitas |
| Scope additions | 1 (api/tsconfig.json) | Konfigurasi tambahan diperlukan untuk deploy |
| Deferred | 0 | — |

**Total impact:** Resolusi konfigurasi deployment, tidak ada perubahan fungsional atau scope creep.

### Auto-fixed Issues

**1. [Config] ESM/CJS module conflict pada Vercel Serverless Functions**
- **Found during:** Task 2 (verify build + deploy)
- **Issue:** `"type": "module"` di package.json menyebabkan Node.js load ncc output sebagai ESM, tapi ncc generate CJS (`exports.xxx`) → `exports is not defined` runtime error
- **Fix:** Hapus `"type": "module"` dari package.json + tambah `api/tsconfig.json` dengan `module: CommonJS` agar ncc input/output keduanya CJS
- **Files:** `package.json`, `api/tsconfig.json` (baru)
- **Verification:** Deploy ke Vercel, cek `/api/employees` mengembalikan data, login di production berhasil
- **Commits:** `ccf45b2`, `4781816`, `1216b40`, `8772f9f`

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| ESM/CJS conflict: `exports is not defined` di Vercel runtime | Hapus `"type": "module"` + tambah `api/tsconfig.json` dengan CommonJS |
| api/test.ts debug endpoint tertinggal setelah debugging | Dihapus di commit `8772f9f` |

## Next Phase Readiness

**Ready:**
- App live di paypro.redone.my.id berjalan penuh tanpa Supabase
- Semua DataService methods terpetakan ke /api/* endpoints
- NeonDB + Drizzle ORM sebagai data layer yang stabil
- api/tsconfig.json pattern sudah established untuk serverless functions

**Concerns:**
- Password di-store sebagai plaintext di NeonDB (scope bukan migrasi ini, tapi perlu diperhatikan)
- Seed data admin harus dilakukan manual via Neon Console

**Blockers:**
- None — Phase 02 complete, Milestone v1.1 siap ditutup

---
*Phase: 02-migrate-neondb, Plan: 03*
*Completed: 2026-06-12*
