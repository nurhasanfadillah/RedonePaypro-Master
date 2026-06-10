---
phase: 01-deploy-vercel
topic: Deploy RedonePaypro ke Vercel dengan custom domain paypro.redone.my.id
depth: standard
confidence: HIGH
created: 2026-06-11
---

# Discovery: Deploy ke Vercel + Custom Domain

**Recommendation:** Deploy langsung via Vercel GitHub integration, set env vars `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`, tambah custom domain `paypro.redone.my.id`, lalu set DNS CNAME di registrar domain.

**Confidence:** HIGH — Vite + Vercel adalah kombinasi sangat well-documented, state-based routing app ini tidak butuh konfigurasi tambahan.

## Objective

Yang perlu diketahui sebelum planning:
- Apakah perlu `vercel.json` untuk app ini?
- Environment variables apa yang harus di-set di Vercel?
- DNS records apa yang harus ditambahkan untuk `paypro.redone.my.id`?
- Apakah ada gotcha khusus untuk Vite + Vercel?

## Scope

**Include:**
- Konfigurasi Vercel project (build settings)
- Environment variables setup
- Custom domain + DNS configuration
- PWA compatibility di Vercel

**Exclude:**
- CI/CD pipeline atau preview deployments
- Optimasi performa (Tailwind CDN, jsPDF CDN)
- Supabase security hardening (anon key hardcoded)

## Findings

### Option A: Vercel GitHub Integration (Recommended)

**Source:** Dokumentasi Vercel — vercel.com/docs/deployments/git

**Summary:** Import repo GitHub ke Vercel, auto-detect Vite framework, auto-deploy setiap push ke `main`.

**Pros:**
- Zero-config untuk Vite React: Vercel auto-detect framework + output dir `dist`
- Preview deployments otomatis per PR/branch
- HTTPS otomatis via Let's Encrypt
- Custom domain dengan SSL gratis
- Edge network CDN global

**Cons:**
- Butuh akses ke GitHub repo (atau push ke GitHub jika belum ada remote)
- Free tier: 100GB bandwidth/bulan, 6000 build minutes/bulan

**Untuk use case kita:** Sempurna. Vite SPA dengan state-based routing tidak perlu konfigurasi tambahan apapun.

### Option B: Vercel CLI Deploy

**Source:** vercel.com/docs/cli

**Summary:** Deploy langsung dari terminal via `vercel --prod` tanpa perlu GitHub.

**Pros:**
- Tidak butuh GitHub remote
- Bisa deploy dari lokal langsung

**Cons:**
- Manual — tidak ada auto-deploy
- Kurang praktis untuk ongoing maintenance

**Untuk use case kita:** Viable tapi kurang ideal jika ada perubahan ongoing.

## Comparison

| Kriteria | GitHub Integration | CLI Deploy |
|----------|-------------------|------------|
| Kemudahan setup | Tinggi (3-4 klik) | Sedang (perlu install CLI) |
| Auto-deploy | Ya (push = deploy) | Tidak |
| Custom domain | Sama | Sama |
| Ongoing maintenance | Minimal | Manual setiap kali |
| Preview per branch | Ya | Tidak |

## Vercel Build Configuration

Karena ini Vite React, Vercel akan auto-detect. Namun perlu diverifikasi:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

**Tidak perlu `vercel.json`** — app ini menggunakan state-based routing (bukan React Router / URL-based routing). Tidak ada deep links yang perlu di-rewrite ke `index.html`.

## Environment Variables di Vercel

Dari analisis `vite.config.ts` dan `services/supabaseClient.ts`:

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_SUPABASE_URL` | Direkomendasikan | Ada hardcoded fallback di supabaseClient.ts tapi best practice set via env |
| `VITE_SUPABASE_ANON_KEY` | Direkomendasikan | Sama — ada hardcoded fallback |
| `GEMINI_API_KEY` | Opsional | Belum digunakan aktif di app, skip untuk sekarang |

> **Catatan:** Vite hanya expose env vars dengan prefix `VITE_` ke browser bundle. Var tanpa prefix tidak akan tersedia di client-side kecuali di-define eksplisit via `define` di `vite.config.ts` (seperti `GEMINI_API_KEY` yang sudah di-handle).

> **Catatan 2:** Supabase anon key bersifat public by design — boleh ter-expose di bundle. Bukan security issue.

## Custom Domain: paypro.redone.my.id

**DNS Records yang diperlukan** (di registrar/DNS provider untuk `redone.my.id`):

**Opsi A — CNAME (recommended untuk subdomain):**
```
Type: CNAME
Name: paypro
Value: cname.vercel-dns.com
TTL: Auto / 3600
```

**Opsi B — A Record (jika CNAME tidak bisa):**
```
Type: A
Name: paypro
Value: 76.76.21.21
TTL: Auto / 3600
```

> Vercel akan otomatis provision SSL certificate via Let's Encrypt setelah DNS propagation (~5-60 menit).

## PWA Compatibility

Dari analisis `sw.js` dan `manifest.json`:
- Vercel static hosting serve file di root path — `sw.js` dan `manifest.json` akan tersedia di `paypro.redone.my.id/sw.js` ✓
- Service Worker scope akan otomatis sesuai domain baru
- Cache name `redonepaypro-v3` tidak perlu diubah

## Recommendation

**Pilih: GitHub Integration**

**Rationale:**
App ini adalah Vite React SPA dengan state-based routing — kombinasi paling mudah untuk di-deploy ke Vercel. Tidak butuh `vercel.json`, tidak butuh konfigurasi routing khusus. Setup 10-15 menit.

Urutan langkah:
1. Import repo ke Vercel (atau pastikan kode sudah di GitHub)
2. Set env vars `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` di Vercel dashboard
3. Deploy (first deploy otomatis setelah import)
4. Add domain `paypro.redone.my.id` di Vercel → Settings → Domains
5. Set DNS CNAME di DNS provider `redone.my.id`
6. Tunggu propagasi + SSL (~15 menit)

**Caveats:**
- Perlu tahu DNS provider untuk `redone.my.id` (Cloudflare? Namecheap? IDCloudHost?) untuk set CNAME
- Jika repo belum di GitHub, perlu push terlebih dahulu

## Open Questions

- Di mana domain `redone.my.id` di-manage DNS-nya? — Impact: **medium** (menentukan di mana set CNAME, tapi prosesnya sama)
- Apakah repo sudah ada di GitHub remote? — Impact: **low** (jika belum, perlu push dulu atau gunakan CLI)

## Quality Report

**Sources consulted:**
- Vercel docs: framework support Vite (verified via common knowledge, 2024-2025)
- Vite config analisis: `vite.config.ts` di repo ini
- Supabase client analisis: `services/supabaseClient.ts` di repo ini
- Stack analysis: `.paul/codebase/stack.md`

**Verification:**
- Build command `npm run build` + output `dist`: Verified via `vite.config.ts` dan `package.json`
- State-based routing (no URL routing): Verified via `.paul/codebase/overview.md` dan `App.tsx` mention
- VITE_ prefix env vars: Verified via `vite.config.ts` dan Vite dokumentasi (env vars harus prefix VITE_)
- PWA files di root: Verified via `Glob` — `sw.js` dan `manifest.json` ada di project root

**Assumptions (not verified):**
- CNAME value `cname.vercel-dns.com` — ini adalah standard Vercel CNAME, tapi user harus konfirmasi di Vercel dashboard saat add domain
- DNS provider untuk `redone.my.id` belum diketahui

---
*Discovery completed: 2026-06-11*
*Confidence: HIGH*
*Ready for: /paul:plan 01-deploy-vercel*
