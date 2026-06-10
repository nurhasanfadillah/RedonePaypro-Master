# Codebase Map

Generated: 2026-06-10

## Documents

| File | Isi |
|------|-----|
| [overview.md](./overview.md) | Tujuan aplikasi, domain, fitur utama, user roles |
| [stack.md](./stack.md) | Tech stack lengkap, semua dependencies, env vars |
| [architecture.md](./architecture.md) | Layer, routing, auth flow, component hierarchy, data flow |
| [conventions.md](./conventions.md) | Naming, TypeScript patterns, component structure, coding style |
| [testing.md](./testing.md) | Status testing (tidak ada), risiko, rekomendasi |
| [integrations.md](./integrations.md) | Supabase, CDN libs, localStorage, Service Worker |
| [database.md](./database.md) | Schema tabel, query patterns, data integrity |
| [concerns.md](./concerns.md) | Security issues, performance, tech debt — rated CRITICAL/HIGH/MEDIUM/LOW |

## Quick Facts

- **App**: Sistem Manajemen Produksi & Penggajian (PT. REDONE BERKAH MANDIRI UTAMA)
- **Stack**: React 19 + TypeScript 5.8 + Vite 6 + Supabase + Tailwind (CDN)
- **Lines**: ~5,800 LOC total
- **Testing**: Tidak ada
- **Critical issues**: 4 (security — credentials, passwords)
- **Top concern**: Hardcoded Supabase credentials + plaintext passwords
