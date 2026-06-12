---
phase: 02-migrate-neondb
topic: Migrasi database dari Supabase ke NeonDB
depth: standard
confidence: HIGH
created: 2026-06-12
---

# Discovery: Migrasi Database ke NeonDB

**Recommendation:** Drizzle ORM + `@neondatabase/serverless` di Vercel Serverless Functions (`/api/`), frontend fetch ke `/api/` endpoints, `DATABASE_URL` disimpan sebagai Vercel env var.

**Confidence:** HIGH — pola ini terdokumentasi di official NeonDB + Drizzle docs, bukan asumsi.

## Objective

Yang perlu diketahui sebelum planning:

- Bisakah NeonDB diakses langsung dari browser seperti Supabase? → **TIDAK, perlu API layer**
- Client library apa yang terbaik untuk NeonDB di Vercel Functions? → **`@neondatabase/serverless` HTTP mode**
- Apakah butuh ORM (Drizzle/Prisma) atau raw SQL cukup? → **Drizzle ORM — dipilih user untuk type safety dan migration management**
- Bagaimana cara migrasi schema (supabase_schema.sql corrupt)? → **Rekonstruksi dari `types.ts` + `dataService.ts`**
- Berapa banyak perubahan kode yang dibutuhkan? → **Signifikan tapi terpola: 1 file baru per resource**

## Scope

**Include:**
- Arsitektur koneksi frontend → NeonDB
- Pilihan client library
- Kebutuhan API layer di Vercel
- Rekonstruksi schema dari kode existing
- Perubahan yang dibutuhkan di `dataService.ts`

**Exclude:**
- Migrasi data existing dari Supabase (assume fresh start di NeonDB)
- Optimasi query atau indexing
- Penambahan fitur baru

## Temuan Kritis: Perubahan Arsitektur Wajib

### Masalah Fundamental

Supabase menyediakan **PostgREST** — REST API layer di atas PostgreSQL yang aman untuk browser:
- Anon key bersifat public tapi dibatasi oleh Row Level Security (RLS)
- Browser memanggil REST API, bukan PostgreSQL langsung

NeonDB adalah **raw PostgreSQL** — credentials harus dijaga server-side:
- Jika connection string (`DATABASE_URL`) exposed di browser → siapa pun bisa akses/hapus semua data
- `@neondatabase/serverless` secara teknis bisa dipakai di browser, tapi ini **security hole fatal**

**Kesimpulan: Migrasi ini bukan sekedar ganti client, tapi perubahan arsitektur.**

```
SEBELUM: Browser → Supabase PostgREST API (aman)
SESUDAH: Browser → Vercel Functions /api/* → NeonDB (aman)
```

---

## Option A: Vercel Serverless Functions + @neondatabase/serverless

**Source:** https://neon.com/docs/guides/vercel-connection-methods (2024)

**Summary:** Tambah folder `/api/` di root project. Vercel otomatis mendeploy setiap file di sini sebagai serverless function. Frontend fetch ke `/api/employees`, dll.

**Pros:**
- Tidak butuh framework baru (bukan Next.js) — Vite tetap dipakai untuk frontend
- Official pattern dari NeonDB + Vercel docs
- `@neondatabase/serverless` HTTP mode sempurna untuk serverless (no persistent connection)
- `DATABASE_URL` disimpan sebagai Vercel env var, tidak pernah exposed ke browser
- Pooler connection string sudah disediakan user (ap-southeast-1 region)

**Cons:**
- Perlu tulis ~8-10 API route files (ganti PostgREST yang "gratis" dari Supabase)
- `dataService.ts` perlu diubah total (dari Supabase queries → fetch calls)
- Local dev perlu `vercel dev` atau proxy setup

**Untuk use case ini:** Sangat cocok. App kecil (5 tabel), pola CRUD sederhana, sudah deploy di Vercel.

---

## Option B: Drizzle ORM + @neondatabase/serverless di Vercel Functions

**Source:** https://orm.drizzle.team/docs/connect-neon (2024)

**Summary:** Sama seperti Option A tapi menggunakan Drizzle ORM untuk type-safe queries dan migration management.

**Pros:**
- Schema-as-code (TypeScript types otomatis ter-generate)
- Migration management yang proper (`drizzle-kit push`)
- Query builder yang type-safe

**Cons:**
- Setup lebih kompleks (drizzle config, schema file, migration commands)
- Overkill untuk 5 tabel — `types.ts` sudah define tipe data
- Tambah 2 dependency baru (`drizzle-orm`, `drizzle-kit`)
- Learning curve untuk team jika belum familiar

**Untuk use case ini:** Overkill. App sudah punya type definitions di `types.ts`.

---

## Comparison

| Kriteria | Option A: Raw + Vercel Functions | Option B: Drizzle + Vercel Functions |
|----------|----------------------------------|--------------------------------------|
| Kompleksitas setup | Rendah | Tinggi |
| Jumlah dependency baru | 1 (`@neondatabase/serverless`) | 3 (`@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`) |
| Type safety | Manual (sudah ada di `types.ts`) | Auto-generated |
| Migration management | Manual SQL | `drizzle-kit push` |
| Cocok untuk 5 tabel | ✅ | Overkill |
| Waktu implementasi | ~4-6 jam | ~8-12 jam |
| Pattern dari official docs | ✅ | ✅ |

---

## Recommendation

**Pilih: Option B — Drizzle ORM + @neondatabase/serverless di Vercel Functions**

**Rationale:**
Dipilih oleh user. Drizzle memberikan schema-as-code yang align dengan TypeScript types yang sudah ada di `types.ts`, query builder yang type-safe, dan `drizzle-kit push` untuk mengelola schema NeonDB tanpa tulis SQL manual. Ini juga solusi yang lebih maintainable untuk jangka panjang.

**Caveats:**
- Connection string user menggunakan `channel_binding=require` — perlu verifikasi kompatibilitas dengan `@neondatabase/serverless`. Jika error koneksi, hapus parameter ini.
- `supabase_schema.sql` corrupt — schema Drizzle direkonstruksi dari `types.ts` + pola query di `dataService.ts`
- Local development: butuh `vercel dev` agar `/api/` routes berjalan
- Data existing: ditambahkan manual setelah migrasi berhasil (bukan scope fase ini)

---

## Scope Implementasi yang Dibutuhkan

### 1. Drizzle Schema (db/schema.ts)

5 tabel berdasarkan analisis `types.ts` + `dataService.ts`:

```typescript
// db/schema.ts
import { pgTable, text, numeric, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['ADMIN', 'USER']);
export const paymentTypeEnum = pgEnum('payment_type', ['KASBON', 'SALARY']);

export const employees = pgTable('employees', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
});

export const components = pgTable('components', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: numeric('price').notNull(),
});

export const productionLogs = pgTable('production_logs', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  employeeId: text('employee_id').references(() => employees.id),
  componentId: text('component_id').references(() => components.id),
  qty: integer('qty').notNull(),
  priceSnapshot: numeric('price_snapshot').notNull(),
  total: numeric('total').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  employeeId: text('employee_id').references(() => employees.id),
  amount: numeric('amount').notNull(),
  type: paymentTypeEnum('type'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const appUsers = pgTable('app_users', {
  username: text('username').primaryKey(),
  password: text('password').notNull(),
  role: roleEnum('role'),
  employeeId: text('employee_id').references(() => employees.id),
  fullName: text('full_name'),
});
```

Deploy schema ke NeonDB via: `npx drizzle-kit push`

### 2. API Routes yang Dibutuhkan

| File | Method | Endpoint | Menggantikan |
|------|--------|----------|-------------|
| `api/employees/index.ts` | GET | `/api/employees` | `supabase.from('employees').select('*')` |
| `api/employees/index.ts` | POST | `/api/employees` | `supabase.from('employees').insert/update` |
| `api/employees/[id].ts` | DELETE | `/api/employees/:id` | `supabase.from('employees').delete()` |
| `api/employees/[id]/dependencies.ts` | GET | `/api/employees/:id/dependencies` | count query |
| `api/components/index.ts` | GET/POST | `/api/components` | komponen CRUD |
| `api/components/[id].ts` | DELETE | `/api/components/:id` | |
| `api/production-logs/index.ts` | GET/POST | `/api/production-logs` | production CRUD |
| `api/production-logs/[id].ts` | DELETE | `/api/production-logs/:id` | |
| `api/payments/index.ts` | GET/POST | `/api/payments` | payment CRUD |
| `api/payments/[id].ts` | DELETE | `/api/payments/:id` | |
| `api/auth/login.ts` | POST | `/api/auth/login` | login query |
| `api/users/index.ts` | GET/POST | `/api/users` | user management |
| `api/users/[username].ts` | PUT | `/api/users/:username/password` | update password |
| `api/users/by-employee/[id].ts` | GET/DELETE | `/api/users/by-employee/:id` | |

### 3. Perubahan File Existing

| File | Perubahan |
|------|-----------|
| `services/supabaseClient.ts` | Hapus, ganti dengan `db/index.ts` (Drizzle client) |
| `services/dataService.ts` | Ganti semua `supabase.from()` calls dengan `fetch('/api/...')` |
| `package.json` | Hapus `@supabase/supabase-js`, tambah `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit` (dev) |
| `.env` / `.env.example` | Ganti `VITE_SUPABASE_*` dengan `DATABASE_URL` (server-side only, tanpa prefix `VITE_`) |
| `vercel.json` | Pastikan routing SPA tidak konflik dengan `/api/` routes |
| `drizzle.config.ts` | Baru — konfigurasi drizzle-kit untuk push/pull schema |
| `db/schema.ts` | Baru — Drizzle table definitions (menggantikan supabase_schema.sql) |
| `db/index.ts` | Baru — Drizzle client instance, dipakai di API routes |

---

## Open Questions

- `channel_binding=require` di connection string — apakah didukung `@neondatabase/serverless`? — Impact: **medium** (cukup hapus param ini jika error)
- Apakah NeonDB instance sudah kosong (fresh)? → **Ya, fresh start — schema dibuat via `drizzle-kit push`**
- Data existing: **ditambahkan manual setelah migrasi berhasil** — bukan scope fase ini

## Quality Report

**Sources consulted:**
- NeonDB Serverless Driver docs (neon.com/docs/serverless/serverless-driver) — 2024
- NeonDB + Vercel connection guide (neon.com/docs/guides/vercel-connection-methods) — 2024
- Vercel Vite deployment docs (vercel.com/docs/frameworks/vite) — 2024
- npm @neondatabase/serverless v1.0.1 release notes — 2024

**Verification:**
- NeonDB tidak bisa diakses dari browser secara aman: Verified — official docs menyatakan ini
- `/api/` folder di Vite project di Vercel → serverless functions: Verified — Vercel docs
- `@neondatabase/serverless` HTTP mode cocok untuk serverless: Verified — official package docs
- Connection string user menggunakan pooler hostname (correct untuk serverless): Verified — `-pooler.` dalam hostname

**Assumptions (not verified):**
- `channel_binding=require` kompatibel dengan `@neondatabase/serverless` v1.x + Drizzle

**Confirmed by user:**
- NeonDB instance fresh (schema akan dibuat via `drizzle-kit push`)
- Tidak ada migrasi data dari Supabase — data akan diinput manual setelah migrasi selesai

---
*Discovery completed: 2026-06-12*
*Confidence: HIGH*
*Ready for: /paul:plan 02-migrate-neondb*
