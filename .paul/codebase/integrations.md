# External Integrations

## Supabase (Backend-as-a-Service)
- **SDK**: `@supabase/supabase-js` v2.39.0
- **File**: `services/supabaseClient.ts`
- **Project URL**: `https://sartektzisafnmbiuhwd.supabase.co`
- **Auth method**: Anon key (public) — bukan Supabase Auth service
- **Usage**: PostgreSQL queries langsung via supabase-js client

**Pola koneksi** (`services/supabaseClient.ts`):
```typescript
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://...';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJ...';
export const supabase = createClient(supabaseUrl, supabaseKey);
```
⚠️ Fallback hardcoded — kredensial exposed di source code jika repo publik.

**Tables yang diquery**: `employees`, `components`, `production_logs`, `payments`, `app_users`

**Query patterns** di `services/dataService.ts`:
- `supabase.from('table').select('*').limit(999999)`
- `supabase.from('table').insert([...])` / `.update({...}).eq('id', id)`
- `supabase.from('table').delete().eq('id', id)`
- Error handling: `const { data, error } = await ...; if (error) throw error;`

---

## Tailwind CSS (CDN)
- **Source**: `https://cdn.tailwindcss.com`
- **File**: `index.html` via `<script src="...">` tag
- **Tidak diinstall via npm** — loaded runtime dari CDN
- Custom config inline di `index.html` dalam `<script>` block (warna, dark mode, animasi)
- Dicache oleh Service Worker (`sw.js`: stale-while-revalidate)

---

## jsPDF + AutoTable (CDN)
- **jsPDF**: `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`
- **AutoTable**: `https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js`
- **File**: `index.html`
- **Usage**: Diakses via `window.jspdf` (global) dengan cast `as any`
- **Pre-cached** di Service Worker
- Digunakan di: `components/Production.tsx`, `components/Payments.tsx`, `components/RekapHasil.tsx`, `components/Employees.tsx`, `components/Components.tsx`

---

## Google Fonts (CDN)
- **Fonts**: Inter (300–700 weight), JetBrains Mono
- **Source**: Google Fonts CDN via `<link>` di `index.html`
- **Tidak pre-cached** di Service Worker — loaded dari network

---

## Flaticon (CDN)
- **Usage**: PWA icons (192×192, 512×512 PNG)
- **File**: `manifest.json` — icon src ke Flaticon CDN URL
- Risk: dependency pada external CDN untuk PWA icons

---

## localStorage (Browser API)
- **Key**: `borongan_current_user`
- **Content**: Serialized `UserAccount` object (termasuk password plaintext ⚠️)
- **File**: `contexts/AuthContext.tsx:26`
- **Usage**: Session persistence antar page refresh

---

## Service Worker (PWA)
- **File**: `sw.js`
- **Cache name**: `redonepaypro-v3`
- **Registration**: `index.tsx` — `navigator.serviceWorker.register('/sw.js')`
- **Cache strategies**:
  | URL Pattern | Strategy |
  |------------|---------|
  | `*.supabase.co/*` | Network-only (tidak di-cache) |
  | Navigation (HTML) | Network-first → fallback cache |
  | Assets (JS, CSS, img, font) | Stale-while-revalidate |
- **Pre-cached URLs**: `./`, `./index.html`, Tailwind CDN, jsPDF CDN, AutoTable CDN

---

## Summary Dependency Map
```
RedonePaypro
├── NPM (package.json)
│   ├── @supabase/supabase-js@2.39.0  ← DB access
│   ├── react@19.2.3                   ← UI framework
│   ├── react-dom@19.2.3
│   ├── lucide-react@0.395.0           ← icons
│   ├── recharts@2.12.7                ← charts
│   └── react-hot-toast@2.6.0         ← toasts
└── CDN (index.html)
    ├── tailwindcss (latest)           ← CSS
    ├── jspdf@2.5.1                    ← PDF
    ├── jspdf-autotable@3.8.2          ← PDF tables
    └── Google Fonts                   ← typography
```
