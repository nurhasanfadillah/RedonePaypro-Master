# Roadmap: RedonePaypro

## Milestone v1.0: Production Launch

**Status:** ✅ COMPLETE — 2026-06-12
**Goal:** App live dan dapat diakses publik di paypro.redone.my.id

---

### Phase 1: Deploy to Vercel (paypro.redone.my.id)

**Status:** ✅ Complete — 2026-06-12
**Goal:** App ter-deploy di Vercel dengan custom domain paypro.redone.my.id, HTTPS aktif, dan semua fitur berjalan normal.
**Dependencies:** None
**Plans:** 3/3 complete

**Deliverables:**
- ✓ App dapat diakses di https://paypro.redone.my.id
- ✓ SSL certificate aktif (Let's Encrypt via Vercel)
- ✓ .env.example terdokumentasi (3 vars + komentar)
- ✓ Environment variables terkonfigurasi di Vercel

---

---

## Milestone v1.1: NeonDB Migration

**Status:** ✅ COMPLETE — 2026-06-12
**Goal:** Migrasi database dari Supabase ke NeonDB dengan Drizzle ORM + Vercel Serverless Functions sebagai backend layer.

---

### Phase 2: Migrate to NeonDB

**Status:** ✅ Complete — 2026-06-12
**Goal:** App berjalan penuh dengan NeonDB sebagai database, tanpa dependensi Supabase apapun. Semua CRUD melalui Vercel Serverless Functions (`/api/`).
**Dependencies:** Phase 1 complete ✓
**Plans:** 3/3 complete

**Deliverables:**
- ✓ Schema 5 tabel live di NeonDB (via drizzle-kit push)
- ✓ 6 Vercel Serverless Function files di /api/
- ✓ dataService.ts menggunakan fetch ke /api/ (bukan Supabase)
- ✓ @supabase/supabase-js dihapus dari project
- ✓ App berjalan di https://paypro.redone.my.id dengan NeonDB

---

## Progress

Phases complete: 2 of 2 (100%)
Milestone v1.0: ✅ shipped
Milestone v1.1: ✅ shipped
