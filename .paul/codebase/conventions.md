# Conventions & Patterns

## Naming
| Element | Convention | Contoh |
|---------|-----------|--------|
| Components | PascalCase | `Dashboard`, `ConfirmModal`, `NavItem` |
| Functions | camelCase | `handleSubmit`, `loadData`, `formatCurrency` |
| Event handlers | `handle` prefix | `handleSave`, `handleNavClick`, `handleLogoutClick` |
| Toggle functions | `toggle` prefix | `toggleSidebar`, `toggleTheme` |
| State booleans | `is/has/show` prefix | `isSidebarOpen`, `isLoading`, `isEditing` |
| State pairs | `[value, setValue]` | `[isOpen, setIsOpen]`, `[employees, setEmployees]` |
| Enums | ALL_CAPS values | `ViewState.DASHBOARD`, `'KASBON'`, `'SALARY'` |
| Files: components | PascalCase | `Dashboard.tsx`, `ConfirmModal.tsx` |
| Files: services | camelCase | `dataService.ts`, `supabaseClient.ts` |

## TypeScript
- **100% functional components** — tidak ada class component
- `React.FC<Props>` pattern untuk semua komponen: `const Dashboard: React.FC<DashboardProps> = ...`
- **Interfaces** untuk props dan data models; **type** untuk unions: `type UserRole = 'ADMIN' | 'USER'`
- Props didefinisikan dengan interface per-komponen langsung di atas component
- Optional props ditandai `?`: `note?: string`, `employeeId?: string`
- Return types di-annotate pada DataService: `async (): Promise<Employee[]>`
- Beberapa `any` dipakai: `icon: any` (App.tsx:40), `item: any` dalam mapping Supabase response

## Component Pattern
```typescript
// Struktur standar semua page component:
const [data, setData] = useState<DataType[]>([]);      // data utama
const [formData, setFormData] = useState<DataType>({});// form state
const [isLoading, setIsLoading] = useState(false);     // loading flag
const [isEditing, setIsEditing] = useState(false);     // modal mode
const [filters, setFilters] = useState({...});         // filter state
const [currentPage, setCurrentPage] = useState(1);    // pagination

useEffect(() => { loadData(); }, [user]);               // fetch on mount

const loadData = async () => {
  setIsLoading(true);
  try {
    const result = await DataService.getXxx();
    // filter RBAC if user.role === 'USER'
    setData(result);
  } catch (e) {
    toast.error('...');
  } finally {
    setIsLoading(false);
  }
};
```

## State Patterns
- **useState per concern** — banyak state terpisah per komponen (bukan satu objek besar)
- **Spread update**: `setFormData({...formData, name: e.target.value})`
- **Controlled inputs**: semua form menggunakan value + onChange
- **Loading state**: `setIsLoading(true/false)` dengan try/finally

## Async Pattern
```typescript
// Standard async form handler
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    await DataService.saveXxx(formData);
    toast.success('Berhasil disimpan.');
    loadData();
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan data.');
  } finally {
    setLoading(false);
  }
};
```

## Error Handling
- **Toast notifications** (react-hot-toast): semua success/error UX
- **Local error state**: untuk error di dalam modal (`passwordError`, `alertMessage`)
- **Validasi sebelum submit**: `if (!formData.name.trim()) { toast.error(...); return; }`
- **Supabase errors**: `const { data, error } = await supabase...; if (error) throw error;`
- **Duplicate key**: di-handle manual di dataService.ts dengan message bahasa Indonesia

## Form Handling
- Semua form controlled inputs
- State form: `useState<ModelType>({id: '', name: '', ...})`
- Submit via `onSubmit={handleSubmit}` di `<form>` — `e.preventDefault()` selalu ada
- Client-side validation saja (belum ada schema validation library)

## Styling (Tailwind)
- Utility-first, tidak ada CSS custom file
- Dark mode: `dark:` prefix, toggle via `document.documentElement.classList`
- Responsive: `md:` prefix untuk breakpoint 768px
- Loading spinner: `<Loader2 className="animate-spin" />`
- Animasi masuk: `className="animate-fade-in"`
- Scrollbar custom: `custom-scrollbar` class (didefinisikan di `index.html`)

## Import Order (App.tsx sebagai referensi)
1. React core (`import React, { useState, ... }`)
2. Services (`import { DataService } ...`)
3. Types (`import { ViewState } ...`)
4. Contexts (`import { AuthProvider, useAuth } ...`)
5. Components (`import Login from ...`)
6. Third-party libraries (`import { Toaster } from 'react-hot-toast'`)
7. Icons (`import { LayoutDashboard, ... } from 'lucide-react'`)

## Export Patterns
- **Default export** untuk semua komponen: `export default Dashboard;`
- **Named export** untuk hooks/utils: `export const useAuth = () => ...`
- **Object export** untuk services: `export const DataService = { ... }`

## Comments
- Minimal — hanya untuk section headers: `// --- EMPLOYEES ---`
- Tidak ada JSDoc
- Beberapa komentar inline untuk logic non-obvious: `// In production, hash check happens here`
