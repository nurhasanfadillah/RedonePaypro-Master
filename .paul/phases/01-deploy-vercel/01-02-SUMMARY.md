---
phase: 01-deploy-vercel
plan: 02
subsystem: infra
tags: [pwa, service-worker, manifest, vite]
provides:
  - "Single canonical sw.js (v5) dan manifest.json di public/"
affects: deploy-vercel
tech-stack:
  added: []
  patterns: ["PWA files canonical source ada di public/, bukan root"]
key-files:
  modified: ["sw.js (deleted)", "manifest.json (deleted)"]
key-decisions:
  - "Root-level sw.js & manifest.json adalah dead code — Vite tidak serve/build dari root"
duration: 5min
completed: 2026-06-12T00:00:00Z
---

# Phase 1 Plan 02: Remove Dead PWA Files Summary

**Hapus dua file duplikat di root (`sw.js` v4, `manifest.json`) yang tidak pernah di-serve Vite maupun masuk build output — canonical source ada di `public/`.**

## AC Result

| Criterion | Status |
|-----------|--------|
| AC-1: Tidak ada file PWA duplikat di root | Pass |

## Files Changed

| File | Change |
|------|--------|
| `sw.js` (root) | Deleted — dead code, digantikan `public/sw.js` (v5) |
| `manifest.json` (root) | Deleted — dead code, digantikan `public/manifest.json` |

---
*Completed: 2026-06-12*
