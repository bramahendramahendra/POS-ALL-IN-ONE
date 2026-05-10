# FASE 7 — Layout: Sidebar Dinamis + Navigation Config

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 0-6 sudah selesai: AppLayout dan Navbar sudah ada tapi sidebar masih placeholder.
Fase ini mengganti placeholder sidebar dengan sidebar dinamis yang filternya berdasarkan role.

## Standar Wajib
- Menu sidebar dikonfigurasi sebagai DATA (array), bukan hardcode di JSX
- Filter menu berdasarkan role user — tidak perlu ubah komponen saat tambah menu baru
- Gunakan `NavLink` dari react-router-dom untuk active state otomatis
- Active menu item: background lebih terang, text putih bold
- Sidebar fixed, scroll independent dari konten
- Icon dari lucide-react

## Konfigurasi Menu

### File 1: `src/shared/constants/navigation.ts`
```ts
export interface NavItem {
  label:        string
  path:         string
  icon:         LucideIcon
  allowedRoles: Role[]
  group:        string
}

export const NAV_ITEMS: NavItem[] = [
  // Penjualan
  { label: 'Kasir',       path: ROUTES.KASIR,        icon: ShoppingCart,    allowedRoles: [ROLES.OWNER, ROLES.ADMIN, ROLES.KASIR], group: 'Penjualan'   },
  { label: 'Transaksi',   path: ROUTES.TRANSACTIONS,  icon: Receipt,         allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Penjualan'   },

  // Inventori
  { label: 'Produk',      path: ROUTES.PRODUCTS,      icon: Package,         allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Inventori'   },
  { label: 'Supplier',    path: ROUTES.SUPPLIERS,     icon: Truck,           allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Inventori'   },

  // Pelanggan
  { label: 'Pelanggan',   path: ROUTES.CUSTOMERS,     icon: Users,           allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Pelanggan'   },
  { label: 'Piutang',     path: ROUTES.RECEIVABLES,   icon: CreditCard,      allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Pelanggan'   },

  // Keuangan
  { label: 'Keuangan',    path: ROUTES.FINANCE,       icon: Wallet,          allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Keuangan'    },
  { label: 'Dashboard',   path: ROUTES.DASHBOARD,     icon: LayoutDashboard, allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Keuangan'    },
  { label: 'Laporan',     path: ROUTES.REPORTS,       icon: BarChart2,       allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Keuangan'    },

  // Operasional
  { label: 'Shift',       path: ROUTES.SHIFTS,        icon: Clock,           allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Operasional' },
  { label: 'Sync Center', path: ROUTES.SYNC,          icon: RefreshCw,       allowedRoles: [ROLES.OWNER, ROLES.ADMIN],              group: 'Operasional' },

  // Sistem
  { label: 'Pengaturan',  path: ROUTES.SETTINGS,      icon: Settings,        allowedRoles: [ROLES.OWNER],                           group: 'Sistem'      },
]
```

### File 2: `src/shared/components/layouts/Sidebar.tsx`
Komponen sidebar dengan menu dinamis:

**Logic utama:**
```tsx
const { user } = useAuth()
const visibleItems = NAV_ITEMS.filter(item =>
  user ? item.allowedRoles.includes(user.role) : false
)

// Group items berdasarkan 'group'
const groupedItems = visibleItems.reduce((acc, item) => {
  if (!acc[item.group]) acc[item.group] = []
  acc[item.group].push(item)
  return acc
}, {} as Record<string, NavItem[]>)
```

**Tampilan per group:**
- Label group: teks kecil, uppercase, muted color, padding atas
- Item menu: icon + label, padding, hover effect
- Active item (via NavLink `isActive`): background lebih terang (#34495e), text putih, font semibold, border kiri 3px accent color

**Detail styling:**
```
Sidebar: position fixed, top: 60px, left: 0, bottom: 0, width: 220px
Background: #2c3e50
Text: white / rgba(white, 0.7) untuk muted
Overflow: auto (scroll jika menu banyak)
Z-index: 100

Item menu:
  padding: 10px 16px
  display: flex, align-items: center, gap: 10px
  border-radius: 6px
  margin: 2px 8px
  cursor: pointer
  transition: background 0.2s

Active state:
  background: #34495e
  border-left: 3px solid var(--color-accent)
  color: white

Group label:
  padding: 16px 16px 4px
  font-size: 10px
  text-transform: uppercase
  letter-spacing: 0.05em
  color: rgba(255,255,255,0.4)
```

### Update File 3: `src/shared/components/layouts/AppLayout.tsx`
Ganti placeholder sidebar dengan `<Sidebar />`:
```tsx
import { Sidebar } from './Sidebar'

// Ganti div placeholder dengan:
<Sidebar />
```

### Update File 4: `src/shared/constants/navigation.ts`
Tambahkan ke re-export di `src/shared/constants/index.ts`:
```ts
export { NAV_ITEMS } from './navigation'
export type { NavItem } from './navigation'
```

## Hasil yang Diharapkan
- Sidebar tampil dengan menu sesuai role user yang login
- Login sebagai `kasir` → hanya menu "Kasir" yang tampil
- Login sebagai `admin` → semua menu kecuali "Pengaturan"
- Login sebagai `owner` → semua menu tampil
- Klik menu → navigasi ke halaman yang benar
- Menu aktif sudah ter-highlight
- Sidebar dan navbar tidak ikut scroll saat konten di-scroll
- TypeScript tidak ada error
