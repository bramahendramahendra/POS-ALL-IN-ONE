import { NavLink } from 'react-router-dom'
import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'

import { useMenuStore } from '@/features/menu/menu.store'
import type { MenuItem } from '@/features/menu/menu.types'

// Render icon Lucide berdasarkan nama string dari backend
function DynamicIcon({ name, size = 16 }: { name: string | null; size?: number }) {
  if (!name) return null
  const Icon = (LucideIcons as unknown as Record<string, React.FC<LucideProps>>)[name]
  if (!Icon) return null
  return <Icon size={size} />
}

// Render satu nav item (bisa memiliki children)
function NavItem({ item, depth = 0 }: { item: MenuItem; depth?: number }) {
  const hasChildren = item.children.length > 0

  // Grup tanpa path — tampilkan sebagai label grup
  if (hasChildren && !item.path) {
    return (
      <div>
        <p
          style={{
            padding: depth === 0 ? '16px 16px 4px' : '12px 16px 4px 28px',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'rgba(255,255,255,0.4)',
            margin: 0,
          }}
        >
          {item.label}
        </p>
        {item.children.map((child) => (
          <NavItem key={child.key_name} item={child} depth={depth + 1} />
        ))}
      </div>
    )
  }

  // Item dengan path — render NavLink
  if (item.path) {
    return (
      <NavLink
        to={item.path}
        end
        style={({ isActive }) => ({
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 16px',
          margin: '2px 8px',
          marginLeft: depth > 0 ? '20px' : '8px',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background 0.2s',
          textDecoration: 'none',
          color: isActive ? '#ffffff' : 'rgba(255,255,255,0.7)',
          fontWeight: isActive ? 600 : 400,
          backgroundColor: isActive ? '#34495e' : 'transparent',
          borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
          fontSize: '14px',
        })}
      >
        <DynamicIcon name={item.icon} size={16} />
        <span>{item.label}</span>
      </NavLink>
    )
  }

  return null
}

export function Sidebar() {
  const menus = useMenuStore((s) => s.menus)

  return (
    <aside
      style={{
        position: 'fixed',
        top: 'var(--navbar-height)',
        left: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--color-primary)',
        overflowY: 'auto',
        zIndex: 100,
      }}
    >
      <nav className="py-2">
        {menus.map((item) => (
          <NavItem key={item.key_name} item={item} />
        ))}
      </nav>
    </aside>
  )
}
