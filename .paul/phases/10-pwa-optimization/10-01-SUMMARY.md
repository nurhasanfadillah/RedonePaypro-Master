# Summary: Phase 10 — PWA Optimization

## What Was Done

### Task 1: manifest.json hardening
- Added `"lang": "id"`, `"categories": ["productivity", "business", "utilities"]`
- Added `"purpose": "any"` + `"purpose": "maskable"` to icons (re-using existing PNG files)
- Added `"screenshots": []` placeholder
- 4 icon entries total (192 any, 512 any, 192 maskable, 512 maskable)

### Task 2: sw.js enhancement
- CACHE_NAME: v7 → v8
- Removed `self.skipWaiting()` from install — now user-controlled via message
- Added `self.addEventListener('message', ...)` — handles `SKIP_WAITING` from index.tsx
- Added `.catch()` on `cache.addAll()` — CDN failure no longer blocks SW install

### Task 3: index.tsx SW update + offline banner
- Added `updatefound` event listener → shows `confirm()` on new SW installed
- On confirm: sends `SKIP_WAITING` message + `window.location.reload()`
- Added `offline`/`online` event listeners → yellow banner "Anda sedang offline"
- Uses vanilla DOM (no React dependency) for early banner rendering

### Task 4: index.html
- Added `<meta name="description">`
- Added `viewport-fit=cover` to viewport meta for iOS notch support

## Build Verification
```
vite v6.4.3 building for production...
✓ 1518 modules transformed.
✓ built in 3.15s
  dist/index.html    1.94 kB
  dist/assets/*.css  43.21 kB
  dist/assets/*.js   399.08 kB
```

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| `confirm()` instead of React toast for SW update | Works before React mounts; no dependency |
| Vanilla DOM banner for offline | Reliable even before React renders |
| Re-use existing PNG icons with purpose | No reason to generate new icon files — same pixels |
| `skipWaiting()` removed from install | User-controlled update = no surprise reload |

## Files Changed
- `public/manifest.json` — rewritten with full PWA metadata
- `public/sw.js` — v8 + message handler + CDN resilience
- `index.html` — description meta + viewport-fit=cover
- `index.tsx` — SW update prompt + offline banner (23 new lines)
