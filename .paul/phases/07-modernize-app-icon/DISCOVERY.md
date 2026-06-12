# DISCOVERY: Modernize App Icon & PWA Assets

**Phase:** 07-modernize-app-icon
**Date:** 2026-06-12
**Decision:** Option 1 — SVG Custom + PNG Static Set

## Current State

| Asset | Location | Issue |
|-------|----------|-------|
| PWA icon (192/512) | `manifest.json` → Flaticon CDN URL | Generic factory icon, CDN-dependent |
| Apple touch icon | `index.html:15` → Flaticon CDN URL | Same — not branded |
| Sidebar logo | `App.tsx:270` — letter "R" in gradient box | Inconsistent with PWA icon |
| Local icon files | None in `public/` | No offline fallback |

## Options Evaluated

| # | Option | Verdict |
|---|--------|---------|
| 1 | SVG Custom + PNG Static Set | **SELECTED** — modern, self-hosted, consistent |
| 2 | Favicon/PWA Generator Online | Rejected — external dependency |
| 3 | Extract existing "R" gradient | Rejected — not distinctive enough |

## Implementation Plan (Selected)

### Files to create
- `public/icon.svg` — master SVG icon (used for favicon + source for PNG generation)
- `public/icon-192.png` — 192x192 PWA icon
- `public/icon-512.png` — 512x512 PWA icon
- `public/apple-icon-180.png` — 180x180 Apple touch icon

### Files to modify
- `public/manifest.json` — update `icons` array to local paths
- `index.html` — update `<link rel="apple-touch-icon">`, add `<link rel="icon" type="image/svg+xml">`, update theme-color if needed
- `App.tsx` — update sidebar logo to use the new SVG icon

### Design brief
- Monogram-style: "RP" or stylized "R" with green (`#22c55e`) accent
- Dark background variant for splash screen
- Clean, geometric, modern — suitable for a payroll/production app
- SVG format for infinite scalability

### Resolution
| Type | Size | Format | Purpose |
|------|------|--------|---------|
| Favicon | any | SVG | Browser tab |
| PWA | 192x192 | PNG | Android home screen |
| PWA | 512x512 | PNG | Android splash, PWA install |
| Apple | 180x180 | PNG | iOS home screen |

## Risk Assessment
- **Low risk** — cosmetic change, no logic affected
- **Reversible** — keep old CDN URLs as fallback during transition
- Bump `manifest.json` `id` to force PWA update detection

## Next Step
Proceed to `/paul:plan` to create executable PLAN.md.
