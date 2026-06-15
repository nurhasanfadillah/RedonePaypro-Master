---
phase: 11-searchable-dropdown
plan: 01
subsystem: ui
tags: [react, typescript, combobox, searchable-select, lucide-react]

requires:
  - phase: 05-data-seeding
    provides: 27 karyawan + 61 komponen di NeonDB yang membutuhkan searchable UX

provides:
  - "components/SearchableSelect.tsx — reusable combobox dengan filter realtime, click-outside, pre-fill"
  - "Production.tsx: dropdown Nama Karyawan + Komponen / Item diganti SearchableSelect"
  - "Payments.tsx: dropdown Karyawan diganti SearchableSelect"

affects: []

tech-stack:
  added: []
  patterns: ["Combobox via controlled text input + filtered list overlay (zero new dependency)"]

key-files:
  created: [components/SearchableSelect.tsx]
  modified: [components/Production.tsx, components/Payments.tsx]

key-decisions:
  - "onMouseDown (bukan onClick) untuk item list — mencegah blur event menghapus query sebelum selection terjadi"
  - "required prop di-declare tapi tidak di-forward ke native input — validasi tetap via toast di handleSave"

patterns-established:
  - "SearchableSelect: options[]/{value,label} + value/onChange pattern — konsisten dengan controlled component standard"

duration: ~45min
started: 2026-06-15T00:00:00Z
completed: 2026-06-15T00:00:00Z
---

# Phase 11 Plan 01: Searchable Dropdown Summary

**Tiga `<select>` di form input Production & Payments diganti komponen SearchableSelect dengan filter realtime, pre-fill mode edit, dan click-outside — zero dependency baru.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~45 menit |
| Started | 2026-06-15 |
| Completed | 2026-06-15 |
| Tasks | 2 auto + 1 checkpoint |
| Files modified | 3 (1 created, 2 modified) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Filter realtime saat mengetik | Pass | `options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))` |
| AC-2: Nilai tersimpan ke formData dengan benar | Pass | `onChange(val)` → `setFormData({...formData, employeeId: val})` |
| AC-3: Click outside menutup dropdown | Pass | `mousedown` event listener via `useRef` container |
| AC-4: Required validation tetap berfungsi | Pass | `formData.employeeId/componentId === ''` check di handleSave tetap ada |
| AC-5: Pre-fill saat edit | Pass | `useEffect([value, options])` sync query ke label dari value terpilih |

## Accomplishments

- `SearchableSelect.tsx` 106 baris: combobox reusable dengan Search icon + ChevronDown rotasi, dark mode support penuh
- 2 dropdown di Production.tsx diganti (Nama Karyawan baris 913, Komponen/Item baris 937)
- 1 dropdown di Payments.tsx diganti (Karyawan baris 754)
- Checkpoint human-verify: APPROVED

## Task Commits

Belum di-commit (untracked/modified, akan di-commit saat phase transition).

| Task | Status | Description |
|------|--------|-------------|
| Task 1: Buat SearchableSelect | ✓ | components/SearchableSelect.tsx dibuat |
| Task 2: Ganti select di Production + Payments | ✓ | 3 SearchableSelect diterapkan |
| Checkpoint: Human verify | ✓ APPROVED | Semua AC diverifikasi di browser |

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `components/SearchableSelect.tsx` | Created (106 lines) | Reusable combobox: filter, pre-fill, click-outside, dark mode |
| `components/Production.tsx` | Modified | Import + 2x SearchableSelect (karyawan + komponen) |
| `components/Payments.tsx` | Modified | Import + 1x SearchableSelect (karyawan) |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| `onMouseDown` untuk item selection | `onClick` terjadi setelah `blur` — query ter-reset sebelum selection tercatat | Pre-fill dan value assignment berjalan benar |
| `required` prop di-declare, tidak di-forward ke `<input>` | Validasi via toast `handleSave` (bukan native browser), sesuai pola existing | AC-4 tetap pass tanpa ubah handleSave |
| Zero dependency baru | Hanya React hooks + lucide-react yang sudah ada | Bundle size tidak bertambah |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 0 | — |
| Scope additions | 0 | — |
| Deferred | 0 | — |

**Total impact:** Plan dieksekusi persis seperti tertulis.

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| None | — |

## Next Phase Readiness

**Ready:**
- SearchableSelect bisa langsung dipakai ulang untuk form input lain yang akan datang
- Pattern `options[]/{value,label}` konsisten, mudah di-extend

**Concerns:**
- Keyboard navigation (↑↓ Enter) belum ada — defer ke milestone berikutnya
- ARIA attributes minimal (tidak ada `role="combobox"` dll) — aksesibilitas penuh defer

**Blockers:**
- None

---
*Phase: 11-searchable-dropdown, Plan: 01*
*Completed: 2026-06-15*
