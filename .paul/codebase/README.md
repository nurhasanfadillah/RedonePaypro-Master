# Codebase Map

Generated: 2026-06-12 (updated from 2026-06-10)

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
- **Lines**: ~7,200 LOC total (naik dari ~5,800 — commit `428a029` toast + `c6c4f83` core modules)
- **Testing**: Tidak ada
- **Critical issues**: 4 (security — credentials, passwords)
- **Top concern**: Hardcoded Supabase credentials + plaintext passwords

## Recent Changes (since last map)

| Commit | Perubahan |
|--------|-----------|
| `786087b` | Fix PWA service worker & SPA routing di Vercel |
| `28fbc91` | Fix PWA navigation fallback & start_url |
| `428a029` | Implement global toast notifications — file besar bertambah |
| `c6c4f83` | Implement core application modules — file besar bertambah |
| SW cache | Versi bumped dari `redonepaypro-v3` → `redonepaypro-v4` |
