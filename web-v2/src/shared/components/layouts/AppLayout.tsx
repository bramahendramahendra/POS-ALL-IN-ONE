import type { ReactNode } from 'react'

import { Navbar } from './Navbar'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <div style={{ marginTop: 'var(--navbar-height)', display: 'flex' }}>
        {/* Sidebar placeholder — akan dikembangkan di FASE 7 */}
        <aside
          style={{
            width: 'var(--sidebar-width)',
            backgroundColor: 'var(--color-primary)',
            position: 'fixed',
            top: 'var(--navbar-height)',
            bottom: 0,
            overflowY: 'auto',
          }}
        />
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
