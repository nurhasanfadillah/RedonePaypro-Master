---
phase: 02-migrate-neondb
plan: 01
subsystem: database
tags: [drizzle-orm, neondb, postgresql, vercel]

requires: []
provides:
  - Drizzle ORM schema (5 tabel) live di NeonDB
  - db/index.ts — Drizzle client instance siap dipakai API routes
  - vercel.json routing yang melindungi /api/* routes
affects: [02-02-api-routes, 02-03-frontend-migration]

tech-stack:
  added: [drizzle-orm, "@neondatabase/serverless", drizzle-kit, "@vercel/node"]
  patterns: ["Drizzle HTTP driver via neon() untuk serverless", "DATABASE_URL (pooled) untuk app, DATABASE_URL_UNPOOLED (direct) untuk migrations"]

key-files:
  created: [db/schema.ts, db/index.ts, drizzle.config.ts, .env]
  modified: [package.json, vercel.json, .env.example, .paul/PROJECT.md]

key-decisions:
  - "drizzle push (bukan generate+migrate): fresh NeonDB instance, tidak perlu migration history"
  - "channel_binding=require dihapus: @neondatabase/serverless HTTP driver tidak mendukung"
  - "DATABASE_URL_UNPOOLED tanpa -pooler: drizzle-kit butuh direct connection untuk DDL"

patterns-established:
  - "db/index.ts export db — semua API routes import dari sini"
  - "numeric columns (price, amount, total) → parseFloat() sebelum dikirim ke client"

duration: ~10min
completed: 2026-06-12
---

# Phase 2 Plan 01: Foundation Summary

**Drizzle ORM + NeonDB foundation terpasang: 5 tabel live di database, vercel.json routing fixed, Supabase dependency dihapus.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Drizzle Schema Terdefinisi | Pass | db/schema.ts dengan 5 pgTable definitions |
| AC-2: Schema Live di NeonDB | Pass | `[✓] Changes applied` dari drizzle-kit push |
| AC-3: Vercel Routing Benar | Pass | 2 rewrite rules: api pass-through + SPA fallback |
| AC-4: Supabase Dihapus | Pass | @supabase/supabase-js tidak ada di package.json |

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `db/schema.ts` | Created | 5 Drizzle pgTable definitions |
| `db/index.ts` | Created | Drizzle client — `export const db` |
| `drizzle.config.ts` | Created | drizzle-kit config dengan DATABASE_URL_UNPOOLED |
| `.env` | Created | NeonDB credentials lokal (gitignored) |
| `package.json` | Modified | Hapus Supabase, tambah Drizzle deps |
| `vercel.json` | Modified | Tambah `/api/(.*)` pass-through rule |
| `.env.example` | Modified | Ganti VITE_SUPABASE_* → DATABASE_URL + DATABASE_URL_UNPOOLED |
| `.paul/PROJECT.md` | Modified | Update tech stack, constraints, env vars |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| `channel_binding=require` dihapus | HTTP driver tidak support parameter ini | Connection string di .env tanpa parameter ini |
| `DATABASE_URL_UNPOOLED` pakai direct hostname (tanpa `-pooler`) | drizzle-kit push butuh direct connection untuk DDL | Dua env vars: satu untuk app, satu untuk migrations |
| `drizzle push` bukan `generate+migrate` | NeonDB fresh instance, tidak ada migration history | Tidak ada file di `drizzle/` folder — schema langsung di-apply |

## Deviations from Plan

| Type | Detail |
|------|--------|
| Checkpoint auto-resolved | User meminta Claude membuat .env (bukan user sendiri) — hasil sama, .env terbuat dan gitignored |

## Next Phase Readiness

**Ready:**
- `db/index.ts` siap diimport oleh API routes: `import { db } from '../db/index'`
- `db/schema.ts` siap diimport: `import { employees, components, ... } from '../db/schema'`
- NeonDB memiliki 5 tabel kosong, siap menerima data
- `@vercel/node` tersedia untuk TypeScript types di API routes

**Concerns:**
- Seed data admin user belum ada — perlu di-insert manual sebelum login bisa ditest (akan ada di Plan 02-03 checkpoint)

**Blockers:** None

---
*Phase: 02-migrate-neondb, Plan: 01*
*Completed: 2026-06-12*
