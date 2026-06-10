# Database Schema

## Platform
- **Backend**: Supabase (PostgreSQL hosted)
- **Project**: `sartektzisafnmbiuhwd.supabase.co`
- **Schema file**: `supabase_schema.sql` (root project)
- **Access**: Anon key via `@supabase/supabase-js` client

## Tables

### `employees`
| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | Format: `KY-001` — generated client-side |
| name | text | Nama karyawan |
| address | text | Alamat karyawan |

Tidak ada `created_at`/`updated_at` yang terverifikasi.

---

### `components`
| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | Format: `KP-001` — generated client-side |
| name | text | Nama komponen/item |
| price | numeric | Harga satuan (IDR) |

---

### `production_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | Generated client-side |
| date | text | Format: `YYYY-MM-DD` |
| employee_id | text (FK) | → `employees.id` |
| component_id | text (FK) | → `components.id` |
| qty | integer | Jumlah unit diproduksi |
| price_snapshot | numeric | Harga saat entry (snapshot) |
| total | numeric | `qty × price_snapshot` |
| created_at | timestamp | Digunakan untuk ordering (`.order('created_at', DESC)`) |

---

### `payments`
| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | Generated client-side |
| date | text | Format: `YYYY-MM-DD` |
| employee_id | text (FK) | → `employees.id` |
| amount | numeric | Nominal pembayaran (IDR) |
| type | text | `'KASBON'` atau `'SALARY'` |
| note | text | Nullable |
| created_at | timestamp | Untuk ordering |

---

### `app_users`
| Column | Type | Notes |
|--------|------|-------|
| username | text (PK) | Login identifier |
| password | text | ⚠️ Plaintext — TIDAK AMAN untuk produksi |
| role | text | `'ADMIN'` atau `'USER'` |
| employee_id | text (FK) | → `employees.id` (nullable, untuk USER role) |
| full_name | text | Nama tampilan |

---

## ID Generation Pattern
Client-side ID generation berdasarkan max existing ID:
```typescript
// Employees.tsx:76-80
const max = employees.reduce((m, e) => {
  const n = parseInt(e.id.replace('KY-', ''));
  return n > m ? n : m;
}, 0);
const newId = `KY-${(max + 1).toString().padStart(3, '0')}`;
```

**Risk**: Race condition jika dua user menambah record bersamaan → duplicate ID error.

---

## Data Integrity
- **Dependency check sebelum delete**: `checkEmployeeDependencies()` cek apakah employee punya production_logs atau payments
- **Price snapshot**: `production_logs.price_snapshot` menyimpan harga saat entry — perubahan harga komponen tidak mempengaruhi log lama
- **Manual upsert**: DataService cek existence dulu, baru UPDATE atau INSERT (bukan native UPSERT)

---

## Known Issues
- **No RLS policies** yang terverifikasi — USER role bisa akses data karyawan lain via direct API
- **No indexes** yang dikonfirmasi pada foreign keys (`employee_id`, `component_id`)
- **`.limit(999999)`** di semua query — tidak scalable
- **Password plaintext** di `app_users`
- **ID dari client** — potensi race condition; lebih baik gunakan UUID/auto-increment dari DB

---

## Queries Utama (dari `services/dataService.ts`)

```typescript
// Fetch all employees
supabase.from('employees').select('*').order('id').limit(999999)

// Save employee (upsert manual)
supabase.from('employees').update({name, address}).eq('id', id)
supabase.from('employees').insert([{id, name, address}])

// Login
supabase.from('app_users').select('*').eq('username', u).eq('password', p).single()

// Production logs with ordering
supabase.from('production_logs').select('*').order('created_at', {ascending: false}).limit(999999)

// Dependency check before delete
supabase.from('production_logs').select('id').eq('employee_id', id).limit(1)
```
