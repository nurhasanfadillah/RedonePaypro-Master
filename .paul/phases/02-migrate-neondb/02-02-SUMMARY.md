---
phase: 02-migrate-neondb
plan: 02
subsystem: api
tags: [drizzle-orm, neondb, vercel-serverless, typescript]

requires:
  - phase: 02-01
    provides: Drizzle ORM setup, db/index.ts client, db/schema.ts (5 tables live di NeonDB)

provides:
  - 6 Vercel Serverless Functions di /api/ yang handle semua CRUD operations
  - Backend HTTP layer antara frontend dan NeonDB via Drizzle
  - Endpoint untuk employees, components, production-logs, payments, auth, users

affects: 02-03 (frontend rewrite dataService.ts akan hit endpoints ini)

tech-stack:
  added: []
  patterns:
    - "Vercel Serverless Function pattern: VercelRequest/VercelResponse handler"
    - "Drizzle upsert via onConflictDoUpdate"
    - "numeric PostgreSQL columns di-parseFloat() sebelum JSON response"
    - "Foreign key delete order: app_users sebelum employees"

key-files:
  created:
    - api/employees.ts
    - api/components.ts
    - api/production-logs.ts
    - api/payments.ts
    - api/auth.ts
    - api/users.ts
  modified: []

key-decisions:
  - "Semua endpoint accessible tanpa auth middleware (consistent dengan Supabase anon key model)"
  - "Password plaintext — tidak di-hash (consistent dengan implementasi existing)"
  - "DELETE all menggunakan db.delete(table) tanpa WHERE — Drizzle default, intentional"

patterns-established:
  - "API handler: try/catch wrapper, 405 untuk unsupported method, 500 untuk DB error"
  - "Numeric fields dari PostgreSQL selalu di-parseFloat() sebelum dikirim ke client"
  - "Dependency check (checkDeps) menggunakan count() query, bukan full select"

duration: ~30min
started: 2026-06-12T00:00:00Z
completed: 2026-06-12T00:30:00Z
---

# Phase 2 Plan 02: API Routes Summary

**6 Vercel Serverless Functions terbuat di /api/ — full CRUD untuk employees, components, production-logs, payments, auth, dan users via Drizzle ORM ke NeonDB.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~30 menit |
| Started | 2026-06-12 |
| Completed | 2026-06-12 |
| Tasks | 3 of 3 completed |
| Files modified | 6 created, 0 modified |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Employee endpoint berfungsi | Pass | GET all, GET checkDeps, POST upsert, DELETE dengan FK order |
| AC-2: Auth endpoint berfungsi | Pass | POST returns UserAccount atau null (HTTP 200) |
| AC-3: Numeric fields sebagai Number | Pass | price, priceSnapshot, total, amount semua di-parseFloat() |
| AC-4: Error handling konsisten | Pass | 405 method not allowed, 500 DB error, 400/409 untuk kasus spesifik |

## Accomplishments

- 6 API route files terbuat, menggantikan seluruh akses Supabase PostgREST
- Foreign key constraint dijaga dengan benar: `app_users` dihapus sebelum `employees` di DELETE
- Semua numeric columns dari PostgreSQL dikonversi ke JavaScript number sebelum response
- Dependency check endpoint untuk employees dan components (untuk UI konfirmasi sebelum delete)
- Delete-all operation (production-logs dan payments) tersedia untuk reset data

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `api/employees.ts` | Created | CRUD karyawan: GET all/checkDeps, POST upsert, DELETE (dengan FK cleanup) |
| `api/components.ts` | Created | CRUD komponen: GET all/checkDeps (price as float), POST upsert, DELETE |
| `api/production-logs.ts` | Created | CRUD log produksi: GET (priceSnapshot/total as float), POST upsert, DELETE by id/all |
| `api/payments.ts` | Created | CRUD pembayaran: GET (amount as float), POST upsert, DELETE by id/all |
| `api/auth.ts` | Created | POST login: verify credentials, returns UserAccount atau null |
| `api/users.ts` | Created | GET all/by-employeeId, POST upsert (409 dup), PUT password, DELETE by employeeId |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Tidak ada auth middleware | Consistent dengan Supabase anon key model — security model tidak berubah | Semua endpoint accessible tanpa token; scope 02-03 tidak perlu ubah auth logic |
| Password plaintext | Consistent dengan implementasi existing | dataService.ts 02-03 tidak perlu ubah password handling |
| `db.delete(table)` tanpa WHERE untuk deleteAll | Drizzle supports ini secara eksplisit; intentional | deleteAll production-logs dan payments berfungsi seperti Supabase .neq('id','0') workaround |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 0 | — |
| Scope additions | 0 | — |
| Deferred | 0 | — |

**Total impact:** None — plan dieksekusi tepat sesuai spec.

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| `tsc --noEmit` melaporkan error dari drizzle-orm internal types | Gunakan `--skipLibCheck` — error ada di library node_modules, bukan kode kita |
| `supabaseClient.ts` error karena `@supabase/supabase-js` tidak terinstall | Pre-existing, di luar scope — akan dihapus di Plan 02-03 |

## Next Phase Readiness

**Ready:**
- 6 endpoint API siap dipanggil oleh dataService.ts baru
- Pattern HTTP calls sudah bisa diinfer dari endpoint spec
- Semua data types sudah benar (camelCase dari Drizzle schema, numerics sebagai number)

**Concerns:**
- `supabaseClient.ts` masih ada — dataService.ts masih import Supabase. Plan 02-03 harus hapus ini bersama.
- Seed data (admin user) belum ada di NeonDB — perlu dilakukan setelah 02-03 selesai atau manual

**Blockers:**
- None

---
*Phase: 02-migrate-neondb, Plan: 02*
*Completed: 2026-06-12*
