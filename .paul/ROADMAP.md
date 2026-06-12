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
- ✓ .env.example terdokumentasi
- ✓ Environment variables terkonfigurasi di Vercel

---

## Milestone v1.1: NeonDB Migration

**Status:** ✅ COMPLETE — 2026-06-12
**Goal:** Migrasi database dari Supabase ke NeonDB dengan Drizzle ORM + Vercel Serverless Functions sebagai backend layer.

---

### Phase 2: Migrate to NeonDB

**Status:** ✅ Complete — 2026-06-12
**Goal:** App berjalan penuh dengan NeonDB sebagai database, tanpa dependensi Supabase apapun.
**Dependencies:** Phase 1 complete ✓
**Plans:** 3/3 complete

**Deliverables:**
- ✓ Schema 5 tabel live di NeonDB (via drizzle-kit push)
- ✓ 6 Vercel Serverless Function files di /api/
- ✓ dataService.ts menggunakan fetch ke /api/ (bukan Supabase)
- ✓ @supabase/supabase-js dihapus dari project
- ✓ App berjalan di https://paypro.redone.my.id dengan NeonDB

---

## Milestone v1.2: Frontend Hardening

**Status:** ✅ COMPLETE — 2026-06-12
**Goal:** Hapus CDN Tailwind (CORS errors di production), fix PWA Service Worker, cleanup dead code di index.html.

---

### Phase 3: Frontend Hardening

**Status:** ✅ Complete — 2026-06-12
**Goal:** Tailwind CSS di-bundle via PostCSS saat build, Service Worker tidak lagi mencache CDN URLs yang CORS-blocked, index.html bersih dari deprecated tags dan dead importmap entries.
**Dependencies:** Phase 2 complete ✓
**Plans:** 2/2 complete

**Deliverables:**
- ✓ Tailwind CSS di-install sebagai PostCSS plugin (bukan CDN)
- ✓ Custom theme (colors, animations) dipindahkan ke tailwind.config.js
- ✓ Service Worker tidak mencache cdn.tailwindcss.com
- ✓ Meta tag `apple-mobile-web-app-capable` diperbaiki
- ✓ Importmap dibersihkan dari @supabase/supabase-js + recharts

---

---

## Milestone v1.3: UI Polish

**Status:** ✅ COMPLETE — 2026-06-12
**Goal:** Rapikan tampilan UI — label button lebih ringkas dan konsisten.

---

### Phase 4: UI Label Polish

**Status:** ✅ Complete — 2026-06-12
**Goal:** Persingkat label button di header halaman Produksi, Pembayaran, dan Rekap agar tampil lebih rapi.
**Dependencies:** Phase 3 complete ✓
**Plans:** 1/1 complete

**Deliverables:**
- ✓ Production: Ekspor / Cleanup / Input
- ✓ Payments: Ekspor / Cleanup / Input
- ✓ RekapHasil: Periode / Detail / Global

---

---

## Milestone v1.4: Data Seeding

**Status:** ✅ COMPLETE — 2026-06-12
**Goal:** Isi NeonDB dengan data master karyawan (27 orang) dan komponen (61 item) dari dokumen perusahaan yang ada.

---

### Phase 5: Seed Data Master

**Status:** ✅ Complete — 2026-06-12
**Goal:** Jalankan seed script sekali untuk mengisi tabel `employees` dan `components` di NeonDB dengan data real dari PDF perusahaan.
**Dependencies:** Phase 2 complete ✓
**Plans:** 1/1 complete

**Deliverables:**
- ✓ 27 karyawan aktif ter-insert ke tabel `employees`
- ✓ 61 komponen ter-insert ke tabel `components`

---

## Progress

Phases complete: 5 of 5 (100%)
Milestone v1.0: ✅ shipped
Milestone v1.1: ✅ shipped
Milestone v1.2: ✅ shipped
Milestone v1.3: ✅ shipped
Milestone v1.4: ✅ shipped
