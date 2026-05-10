# FASE 32 — Polish: Error Boundaries + Offline Detection

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 31 sudah selesai: semua fitur sudah diimplementasikan.
Fase ini menambahkan lapisan ketahanan aplikasi.

## Standar Wajib
- Setiap route dibungkus ErrorBoundary
- Error yang tidak tertangkap TIDAK crash seluruh aplikasi
- Offline detection aktif di semua halaman
- User selalu mendapat feedback yang jelas saat terjadi masalah

## Tugas Fase Ini

### File 1: `src/shared/components/ErrorBoundary/ErrorBoundary.tsx`
Class component React (Error Boundary harus class component):

```tsx
interface ErrorBoundaryState {
  hasError:   boolean
  error?:     Error
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  state = { hasError: false }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log error — untuk sekarang ke console.error
    // Di masa depan bisa ke Sentry atau logging service
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <PageError error={this.state.error} onReset={() => this.setState({ hasError: false })} />
    }
    return this.props.children
  }
}
```

### File 2: `src/shared/components/PageError/PageError.tsx`
Fallback UI saat ada error:

**Tampilan:**
```
        ╔══════════════════════════════╗
        ║   ⚠️  Terjadi Kesalahan      ║
        ║                              ║
        ║  Halaman ini mengalami error  ║
        ║  yang tidak terduga.          ║
        ║                              ║
        ║  [🔄 Muat Ulang Halaman]     ║
        ║  [← Kembali ke Dashboard]    ║
        ╚══════════════════════════════╝
```

**Props:**
```ts
interface PageErrorProps {
  error?:    Error
  onReset?:  () => void
}
```

**Tombol:**
- "Muat Ulang Halaman": panggil `onReset()` jika ada, else `window.location.reload()`
- "Kembali ke Dashboard": navigate ke `/dashboard`
- Jika `config.isDev`: tampilkan error message dan stack trace

### File 3: `src/services/notification.service.ts`
Offline detection service:
```ts
export const initOfflineDetection = () => {
  const TOAST_ID = 'offline-notification'

  const handleOffline = () => {
    toast.warning('Koneksi internet terputus. Beberapa fitur tidak tersedia.', {
      id:       TOAST_ID,
      duration: Infinity,
    })
  }

  const handleOnline = () => {
    toast.dismiss(TOAST_ID)
    toast.success('Koneksi internet kembali normal.')
  }

  window.addEventListener('offline', handleOffline)
  window.addEventListener('online',  handleOnline)

  // Cek kondisi awal
  if (!navigator.onLine) handleOffline()

  // Cleanup function
  return () => {
    window.removeEventListener('offline', handleOffline)
    window.removeEventListener('online',  handleOnline)
  }
}
```

### Update `src/app/providers.tsx`
Inisialisasi offline detection saat app mount:
```tsx
useEffect(() => {
  const cleanup = initOfflineDetection()
  return cleanup
}, [])
```

### Update `src/app/router.tsx`
Bungkus setiap route dengan ErrorBoundary:
```tsx
{
  path: '/products',
  element: (
    <ErrorBoundary>
      <ProductsPage />
    </ErrorBoundary>
  ),
}
// Lakukan untuk semua route
```

Atau lebih efisien — bungkus di level ProtectedRoute:
```tsx
// Di ProtectedRoute.tsx, setelah guard lolos:
return (
  <AppLayout>
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  </AppLayout>
)
```

### Update `src/shared/components/index.ts`
```ts
export { ErrorBoundary } from './ErrorBoundary'
export { PageError }     from './PageError'
```

## Hasil yang Diharapkan
- Matikan internet → banner/toast "Koneksi terputus" muncul
- Nyalakan internet kembali → toast "Koneksi kembali normal"
- Simulasikan error di komponen → ErrorBoundary menangkap, tampil PageError
- Klik "Muat Ulang" di PageError → halaman coba render ulang
- Aplikasi tidak crash total saat ada error di satu halaman
- TypeScript tidak ada error
