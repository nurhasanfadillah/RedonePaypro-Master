---
phase: 03-frontend-hardening
plan: 01
subsystem: ui
tags: [tailwind, postcss, vite, css, pwa]

requires:
  - phase: 02-migrate-neondb plan 02-03
    provides: app live di Vercel dengan build pipeline Vite yang stabil

provides:
  - tailwind.config.js dengan custom theme (primary colors, dark mode, animasi)
  - postcss.config.js untuk Tailwind v3 + autoprefixer
  - index.css sebagai CSS entry point (menggantikan CDN + inline styles)
  - index.html bersih dari CDN script dan inline tailwind.config

affects: [03-02 (sw.js fix perlu tahu CDN script sudah dihapus dari HTML)]

tech-stack:
  added: [tailwindcss@3.4.19, autoprefixer, postcss]
  patterns: [PostCSS build-time CSS processing, CSS entry point via index.css]

key-files:
  created: [tailwind.config.js, postcss.config.js, index.css]
  modified: [index.tsx, index.html, package.json]

key-decisions:
  - "Tailwind v3, bukan v4 — config format v4 (CSS-first) berbeda, v3 match config existing"
  - "CJS format untuk tailwind.config.js + postcss.config.js — package.json tidak punya type:module"
  - "Google Fonts @import tetap di index.css, bukan <link> tag — konsisten dengan sumber styles"

patterns-established:
  - "index.css = CSS entry point, di-import di index.tsx baris pertama"
  - "tailwind.config.js content paths eksplisit per direktori (bukan ** glob) untuk performa scan"

duration: ~30min
started: 2026-06-12T00:00:00Z
completed: 2026-06-12T00:30:00Z
---

# Phase 3 Plan 01: Tailwind CDN → PostCSS — Summary

**Tailwind CSS dimigrasikan dari CDN ke PostCSS build plugin; index.html bersih dari CDN script; custom theme dipindah ke tailwind.config.js; CDN production warning hilang dari browser console.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~30 menit |
| Tasks | 3 selesai (2 auto + 1 checkpoint) |
| Files modified | 6 (3 dibuat, 3 dimodifikasi) |
| CSS bundle size | 42.93 kB (gzip: 7.33 kB) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Build tanpa CDN Reference | Pass | HTML + JS + CSS output bersih; dist/sw.js masih ada ref (deferred ke 03-02, sesuai boundaries) |
| AC-2: Custom Theme Terintegrasi | Pass | primary colors, dark mode, fade-in animation ada di tailwind.config.js |
| AC-3: Visual Tidak Berubah | Pass | Diverifikasi di production paypro.redone.my.id — semua styles normal |

## Accomplishments

- `cdn.tailwindcss.com should not be used in production` warning **hilang** dari browser console
- Tailwind CSS 42.93 kB di-bundle saat build (hanya utilities yang dipakai, bukan full CDN)
- Custom theme (6 primary colors, 3 dark colors, fade-in animation) terintegrasi di tailwind.config.js
- index.html berkurang ~30 baris (hapus CDN script + inline config + style block)

## Task Commits

| Task | Commit | Type | Description |
|------|--------|------|-------------|
| Task 1 + Task 2 | `d7e4a20` | feat | Migrate Tailwind CSS from CDN to PostCSS plugin |

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `tailwind.config.js` | Created | Custom theme: primary colors, dark, fade-in animation — CJS format |
| `postcss.config.js` | Created | PostCSS plugins: tailwindcss + autoprefixer — CJS format |
| `index.css` | Created | @tailwind directives + Google Fonts + scrollbar styles |
| `index.tsx` | Modified | + `import './index.css'` sebagai baris pertama |
| `index.html` | Modified | Hapus CDN script, inline tailwind.config, dan `<style>` block |
| `package.json` | Modified | + tailwindcss@3.4.19, autoprefixer, postcss di devDependencies |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Tailwind v3, bukan v4 | v4 pakai CSS-first config (berbeda total), v3 match format existing | Perlu tetap v3 jika ada milestone berikutnya |
| CJS format config files | package.json tidak punya `"type":"module"` (dihapus di Phase 2) | Konsisten dengan api/tsconfig.json pattern |
| Content paths eksplisit | Lebih cepat dari `**` glob, menghindari scan file api/db/paul | Perlu update jika ada direktori baru dengan TSX files |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 0 | — |
| Expected (boundaries) | 1 | Tidak ada impact fungsional |
| Deferred | 0 | — |

**Total impact:** Tidak ada — deviasi sesuai boundaries plan.

### Expected Deviation

**`dist/sw.js` masih mengandung `cdn.tailwindcss.com`**
- **Kenapa:** `public/sw.js` di-copy verbatim oleh Vite ke `dist/sw.js`; fix sw.js ada di boundaries sebagai scope Plan 03-02
- **Impact:** SW masih throw CORS error saat install (error pre-existing, bukan regresi)
- **Resolution:** Plan 03-02

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Tidak ada | — |

## Next Phase Readiness

**Ready:**
- Tailwind PostCSS pipeline berjalan stabil
- tailwind.config.js bisa di-extend untuk custom utilities di masa depan
- index.css sebagai CSS entry point siap untuk tambahan global styles

**Concerns:**
- Content paths di tailwind.config.js perlu diupdate jika ada direktori baru dengan TSX files
- Tailwind v3 — v4 migration akan perlu refactoring config jika upgrade di masa depan

**Blockers:**
- None — Plan 03-02 siap di-plan

---
*Phase: 03-frontend-hardening, Plan: 01*
*Completed: 2026-06-12*
