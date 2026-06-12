# Technology Stack

## Core Framework
| Technology | Version | File |
|------------|---------|------|
| React | 19.2.3 | `package.json` |
| TypeScript | ~5.8.2 | `tsconfig.json` |
| Vite | ^6.2.0 | `vite.config.ts` |

**TypeScript Config** (`tsconfig.json`):
- `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`
- `jsx: "react-jsx"` (React 17+ transform)
- `experimentalDecorators: true`, `isolatedModules: true`
- Path alias: `@/*` → root directory (dikonfigurasi tapi jarang dipakai — import relatif lebih umum)
- `skipLibCheck: true`, `allowJs: true` — strictness moderat, bukan fully strict
- **Tidak ada** `strict: true` — memperbolehkan `any` dan pola tidak aman

**Vite Config** (`vite.config.ts`):
- Dev server: port 3000, host 0.0.0.0
- Plugin: `@vitejs/plugin-react` v5.0.0
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`
- Defines: `process.env.API_KEY` & `process.env.GEMINI_API_KEY` — belum digunakan aktif

## UI & Styling
| Library | Version | Usage |
|---------|---------|-------|
| Tailwind CSS | CDN (latest) | Utility-first styling, dark mode class |
| lucide-react | 0.395.0 | SVG icons di seluruh app |
| recharts | 2.12.7 | Chart/visualisasi data — ⚠️ ada di package.json tapi tidak terpakai aktif |
| react-hot-toast | ^2.6.0 | Toast notifications (posisi top-center) |

**Tailwind** diload via CDN di `index.html` bukan NPM. Custom theme:
- Primary green: `#22c55e` (500), `#16a34a` (600)
- Dark bg: `dark-bg: #0f172a`, `dark-card: #1e293b`, `dark-border: #334155`
- Dark mode: class-based (`document.documentElement.classList`)
- Custom animation: `fade-in` (0.2s scale)

**Fonts** via Google Fonts CDN: Inter (body), JetBrains Mono (monospace)

## Backend / Database
| Service | Version | File |
|---------|---------|------|
| @supabase/supabase-js | 2.39.0 | `services/supabaseClient.ts` |

**Supabase Config** (`services/supabaseClient.ts`):
- URL: `https://sartektzisafnmbiuhwd.supabase.co` (hardcoded fallback ⚠️)
- Anon Key: JWT hardcoded (exp 2081311891) — ⚠️ HARUS DIPINDAH KE ENV
- Env vars dibaca pertama: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

**Database Tables**:
- `employees` — id (PK), name, address
- `components` — id (PK), name, price
- `production_logs` — id, date, employee_id, component_id, qty, price_snapshot, total
- `payments` — id, date, employee_id, amount, type (KASBON|SALARY), note
- `app_users` — username (PK), password (⚠️ plaintext), role, employee_id (FK), full_name

## CDN External Libraries (loaded in `index.html`)
| Library | Version | Purpose |
|---------|---------|---------|
| Tailwind CSS | latest | CSS framework |
| jsPDF | 2.5.1 | PDF generation |
| jsPDF AutoTable | 3.8.2 | PDF table plugin |

Diakses via `window.jspdf` (global) — tipe-nya di-cast dengan `as any`.

## PWA
- **Service Worker**: `sw.js` — cache strategy: network-only (Supabase), network-first (HTML), stale-while-revalidate (assets)
- **Cache name**: `redonepaypro-v4` (bumped dari v3 di commit `786087b`)
- **Manifest**: `manifest.json` — display: standalone, orientation: portrait, theme: #22c55e
- **Registration**: `index.tsx` pada window load event
- **Dua salinan sw.js**: satu di root `/sw.js` dan satu di `/public/sw.js` — konfirmasi mana yang aktif via `index.tsx:15`

## Dev Dependencies
| Package | Version |
|---------|---------|
| @types/node | ^22.14.0 |
| @vitejs/plugin-react | ^5.0.0 |
| typescript | ~5.8.2 |
| vite | ^6.2.0 |

## Environment Variables
| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `GEMINI_API_KEY` | Google Gemini (belum digunakan aktif, didefinisikan di vite.config.ts) |

`.env.example` ada tapi isinya minimal/kosong.

## Build Scripts (`package.json`)
```json
"dev": "vite"
"build": "vite build"
"preview": "vite preview"
```
**Tidak ada test script.**
