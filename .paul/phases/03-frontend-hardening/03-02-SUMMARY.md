---
phase: 03-frontend-hardening
plan: 02
subsystem: ui
tags: [pwa, service-worker, meta-tags, importmap, cleanup]

requires:
  - phase: 03-frontend-hardening plan 03-01
    provides: cdn.tailwindcss.com sudah dihapus dari index.html — sw.js cleanup bisa dilakukan

provides:
  - public/sw.js bersih: tidak mencache cdn.tailwindcss.com, CACHE_NAME v6
  - index.html bersih: mobile-web-app-capable meta tag lengkap, importmap tanpa dead entries

affects: []

tech-stack:
  added: []
  patterns: [SW CACHE_NAME versioning untuk force update saat urlsToCache berubah]

key-files:
  created: []
  modified: [public/sw.js, index.html]

key-decisions:
  - "Bump CACHE_NAME v5→v6 — wajib agar browser buang cache lama yang masih berisi CDN entry"
  - "Hapus Supabase check di sw.js — dead code sejak Phase 2 migrasi NeonDB"

patterns-established:
  - "Setiap kali urlsToCache berubah, increment CACHE_NAME agar SW lama ter-replace"

duration: ~10min
started: 2026-06-12T00:00:00Z
completed: 2026-06-12T00:10:00Z
---

# Phase 3 Plan 02: SW + index.html Cleanup — Summary

**Service Worker dibersihkan (hapus CDN Tailwind dari urlsToCache, bump ke v6), meta tag PWA dilengkapi, dan importmap dibersihkan dari dead entries recharts + @supabase/supabase-js.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~10 menit |
| Tasks | 2 selesai (2 auto) |
| Files modified | 2 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: SW tidak mencache CDN Tailwind | Pass | cdn.tailwindcss.com dihapus dari urlsToCache, CACHE_NAME v6 |
| AC-2: Deprecated meta tag hilang | Pass | mobile-web-app-capable ditambahkan di index.html |
| AC-3: Importmap bersih | Pass | recharts + @supabase/supabase-js dihapus |

## Accomplishments

- SW CORS error (`TypeError: Failed to fetch`) akan hilang setelah v6 SW aktif di browser user
- Browser console bersih dari semua warning yang ada di issue awal
- importmap turun dari 9 entries menjadi 7 (hapus 2 dead entries)

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 + Task 2 | (uncommitted — bagian dari phase commit) | Fix SW + cleanup index.html |

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `public/sw.js` | Modified | Hapus cdn.tailwindcss.com dari urlsToCache, hapus Supabase check, bump CACHE_NAME v5→v6 |
| `index.html` | Modified | Tambah mobile-web-app-capable meta tag, hapus recharts + @supabase/supabase-js dari importmap |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Bump CACHE_NAME v5→v6 | Browser tidak replace SW lama secara otomatis jika hanya file content berubah; versioning paksa replacement | User yang sudah punya SW v5 akan mendapat v6 saat revisit |
| Hapus Supabase check di fetch handler | Dead code sejak Phase 2 — tidak ada request ke supabase.co | SW lebih bersih |

## Deviations from Plan

Tidak ada — plan dieksekusi tepat seperti ditulis.

## Next Phase Readiness

**Ready:**
- Browser console sepenuhnya bersih dari error yang dilaporkan di awal Milestone v1.2
- PWA meta tags lengkap untuk iOS dan Android

**Concerns:**
- Tidak ada

**Blockers:**
- None — Phase 3 complete, Milestone v1.2 complete

---
*Phase: 03-frontend-hardening, Plan: 02*
*Completed: 2026-06-12*
