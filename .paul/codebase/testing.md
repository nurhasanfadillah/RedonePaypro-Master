# Testing

## Status: TIDAK ADA INFRASTRUKTUR TESTING

Proyek ini **tidak memiliki testing apapun**.

## Bukti
- Tidak ada test files (`*.test.tsx`, `*.spec.ts`) di seluruh codebase
- Tidak ada test script di `package.json`:
  ```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
  ```
- Tidak ada testing library di dependencies:
  - Tidak ada `vitest`, `jest`, `@testing-library/react`
  - Tidak ada `cypress`, `playwright`

## Strategi Testing Saat Ini
- **Manual testing** — tidak terdokumentasi
- `console.error()` digunakan untuk debug (`Dashboard.tsx:48`, `dataService.ts`)
- TypeScript type-checking sebagai satu-satunya safety net otomatis

## Risiko
Tanpa testing otomatis:
- Refactor berisiko tinggi — tidak ada safety net
- Bug regresi mudah lolos
- Password/auth logic critical tidak pernah divalidasi otomatis
- RBAC filtering di komponen React tidak diverifikasi

## Rekomendasi Jika Testing Akan Ditambahkan
**Unit tests** (prioritas tertinggi):
- `services/dataService.ts` — test CRUD operations dengan mock Supabase
- `contexts/AuthContext.tsx` — test login/logout/session restoration
- `types.ts` — validasi data model transformations

**Integration tests**:
- Login flow: username + password → session tersimpan
- RBAC: USER role hanya melihat data sendiri
- Production log: qty × price = total kalkulasi benar

**Tools yang disarankan** (konsisten dengan stack Vite):
- `vitest` — test runner (native Vite integration)
- `@testing-library/react` — component testing
- `msw` (Mock Service Worker) — mock Supabase API calls
