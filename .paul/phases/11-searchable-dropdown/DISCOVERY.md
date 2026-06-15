---
phase: 11-searchable-dropdown
topic: Implementasi searchable dropdown untuk form input di Production dan Payments
depth: standard
confidence: HIGH
created: 2026-06-15
---

# Discovery: Searchable Dropdown untuk Form Input

**Recommendation:** Buat komponen `SearchableSelect` custom (tanpa dependency baru) menggunakan React `useState` + Tailwind CSS.

**Confidence:** HIGH — Pilihan ini terverifikasi dari analisis langsung codebase. Stack sudah cukup, pattern sudah ada, data set kecil (27/61 item).

## Objective

Yang perlu diketahui sebelum planning:
- Dropdown mana saja yang perlu diubah?
- Opsi implementasi apa yang tersedia (library vs custom)?
- Apakah perlu tambah dependency baru?
- Bagaimana cara menjaga konsistensi dengan desain yang ada?

## Scope

**Include:**
- Dropdown "Nama Karyawan" di form "Input Hasil Baru" (`Production.tsx` baris 911–916)
- Dropdown "Komponen / Item" di form "Input Hasil Baru" (`Production.tsx` baris 931–936)
- Dropdown "Karyawan" di form "Transaksi Baru" (`Payments.tsx` baris 751–756)
- Komponen reusable `SearchableSelect` yang bisa dipakai di ketiga tempat

**Exclude:**
- Dropdown filter tabel (filter karyawan & komponen di section filter — bukan form input)
- Dropdown "Pilih Karyawan" di Export Modal Production (bukan form utama)
- Halaman lain (Employees, Components, Finance, dll.)

## Findings

### Option A: Custom Combobox (Zero Dependencies)

**Source:** React docs (useState, useRef, useEffect) + pola yang sudah ada di `Production.tsx`

**Summary:** Input teks untuk search query → daftar option difilter secara realtime → rendered sebagai positioned dropdown di bawah input. Klik luar untuk tutup.

**Pros:**
- Zero dependency baru — bundle tidak bertambah
- Styling 100% Tailwind → konsisten sempurna dengan desain existing
- Pola `click-outside` + `activeMenu` sudah ada di `Production.tsx` (baris 85–92) — tinggal adaptasi
- Cukup untuk 27 karyawan dan 61 komponen (data set kecil)
- Mudah di-maintain oleh siapapun yang familiar dengan React + Tailwind

**Cons:**
- Perlu implementasi manual keyboard navigation (↑↓ Enter Escape) jika diinginkan
- Tidak ada aksesibilitas ARIA bawaan (tapi bisa ditambah manual)

**For our use case:** Sangat cocok. Data set kecil, tidak butuh fitur kompleks seperti multi-select atau async loading.

---

### Option B: react-select

**Source:** npmjs.com/package/react-select — 12M+ downloads/week

**Summary:** Library lengkap untuk semua jenis select: single, multi, async, creatable.

**Pros:**
- Feature-rich out of the box
- Keyboard navigation + ARIA built-in
- Populer dan well-maintained

**Cons:**
- Bundle tambahan ~25KB gzipped
- Styling via `styles` prop atau `classNames` prop — tidak natural dengan Tailwind v3
- API lebih complex dari yang dibutuhkan
- Style mismatch dengan design system existing (perlu override banyak)
- Overkill untuk use case ini

**For our use case:** Tidak direkomendasikan. Terlalu berat dan style conflict dengan Tailwind.

---

### Option C: @headlessui/react Combobox

**Source:** headlessui.com — dibuat oleh tim Tailwind CSS

**Summary:** Headless (unstyled) combobox component dengan ARIA + keyboard navigation bawaan.

**Pros:**
- Dibuat khusus untuk Tailwind CSS
- Accessibility (ARIA) built-in
- Keyboard navigation built-in
- ~30KB gzipped (lebih ringan dari react-select)

**Cons:**
- Dependency baru (headlessui belum ada di project)
- React 19 support: headlessui v2 support React 18+, perlu verifikasi kompatibilitas penuh dengan React 19.2
- Untuk 27/61 item, fitur aksesibilitas built-in tidak terlalu critical
- Punya learning curve API-nya sendiri

**For our use case:** Layak tapi overkill. Custom combobox lebih sederhana untuk skala ini.

---

### Option D: HTML `<datalist>`

**Summary:** Native HTML feature — `<input list="datalist-id">` + `<datalist>` dengan `<option>` items.

**Pros:**
- Zero dependency, zero JS
- Native browser implementation

**Cons:**
- Styling sangat terbatas — tidak bisa disamakan dengan desain existing
- UX inkonsisten antar browser (mobile Chrome vs Safari vs Firefox berbeda)
- Tidak bisa render value yang berbeda dari label (butuh id sebagai value, nama sebagai label)
- Tidak ada kontrol atas dropdown positioning

**For our use case:** Tidak cocok. UX inconsistency di mobile adalah deal-breaker.

## Comparison

| Criteria | Custom Combobox | react-select | @headlessui/react | datalist |
|----------|----------------|--------------|-------------------|----------|
| Dependencies baru | Tidak ada | +25KB | +30KB | Tidak ada |
| Tailwind compatibility | Sempurna | Sulit | Sempurna | Tidak ada |
| Styling control | Penuh | Terbatas | Penuh | Tidak ada |
| Keyboard nav | Manual | Built-in | Built-in | Native |
| ARIA / Accessibility | Manual | Built-in | Built-in | Native |
| Implementasi effort | Sedang | Rendah | Sedang | Rendah |
| Cocok untuk 27/61 item | Ya | Ya | Ya | Tidak |
| Mobile UX | Baik | Baik | Baik | Buruk |
| Konsistensi desain | Tinggi | Rendah | Tinggi | Tidak ada |

## Recommendation

**Choose: Option A — Custom Combobox**

**Rationale:**
Project ini adalah SPA ringan dengan data set kecil (27 karyawan, 61 komponen). Kebutuhan fiturnya sederhana: filter by substring, pilih satu item, tampilkan nama yang dipilih. Custom combobox sudah lebih dari cukup.

Keuntungan utama: tidak ada dependency baru, styling sepenuhnya dalam kendali Tailwind, dan pola click-outside + activeMenu sudah ada di codebase (Production.tsx baris 85–92) sehingga implementasinya natural dan konsisten.

**Implementation pattern:**
```
components/SearchableSelect.tsx   ← komponen reusable baru
```

State yang dibutuhkan per instance:
- `query: string` — teks pencarian
- `isOpen: boolean` — kontrol dropdown visibility
- `ref` — untuk click-outside detection

Props interface:
```tsx
interface SearchableSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}
```

**Caveats:**
- Keyboard navigation (↑↓ Enter Escape) tidak diimplementasikan di phase ini — bisa ditambah di fase berikutnya jika diinginkan
- ARIA attributes (role="combobox", aria-expanded, dll.) bisa ditambah belakangan untuk aksesibilitas

## Open Questions

- Apakah saat edit (mode edit form), nama yang sudah dipilih perlu tampil sebagai pre-filled search text? — Impact: medium (perlu resolve `value` → `label` saat inisialisasi)

## Quality Report

**Sources consulted:**
- `components/Production.tsx` — dibaca langsung, 2026-06-15
- `components/Payments.tsx` — dibaca langsung, 2026-06-15
- `package.json` — dependencies list, 2026-06-15
- `.paul/CODEBASE.md` — architecture overview, 2026-06-15

**Verification:**
- `<select>` untuk karyawan di Production.tsx: Verified baris 912–915
- `<select>` untuk komponen di Production.tsx: Verified baris 932–935
- `<select>` untuk karyawan di Payments.tsx: Verified baris 752–756
- click-outside handler sudah ada: Verified baris 85–92 di Production.tsx
- Tidak ada UI library (headlessui, radix, shadcn): Verified dari package.json
- Total karyawan: 27 (dari CODEBASE.md, db/seed.ts)
- Total komponen: 61 (dari CODEBASE.md, db/seed.ts)

**Assumptions (not verified):**
- React 19.2.3 tidak ada breaking change pada `useState`/`useRef` pattern yang akan digunakan

---
*Discovery completed: 2026-06-15*
*Confidence: HIGH*
*Ready for: /paul:plan 11-searchable-dropdown*
