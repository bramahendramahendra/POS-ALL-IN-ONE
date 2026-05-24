import { useEffect } from 'react'
import type { ReactNode } from 'react'

import { useMyMenusQuery } from '@/features/menu/menu.api'
import { useMenuStore } from '@/features/menu/menu.store'

import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

// Fetch menu dari server dan sync ke store jika belum dimuat (e.g. setelah refresh)
function MenuLoader() {
  const isLoaded = useMenuStore((s) => s.isLoaded)
  const setMenus = useMenuStore((s) => s.setMenus)
  const { data } = useMyMenusQuery()

  useEffect(() => {
    if (!isLoaded && data) {
      setMenus(data)
    }
  }, [isLoaded, data, setMenus])

  return null
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <MenuLoader />
      <Navbar />
      <div style={{ marginTop: 'var(--navbar-height)', display: 'flex' }}>
        <Sidebar />
        <main
          style={{
            marginLeft: 'var(--sidebar-width)',
            flex: 1,
            padding: '24px',
            minHeight: 'calc(100vh - var(--navbar-height))',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
