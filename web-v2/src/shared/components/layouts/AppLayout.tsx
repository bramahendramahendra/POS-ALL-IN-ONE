import type { ReactNode } from 'react'

import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
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
