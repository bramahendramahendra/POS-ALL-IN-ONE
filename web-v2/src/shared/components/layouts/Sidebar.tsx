import { NavLink } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { NAV_ITEMS, type NavItem } from '@/shared/constants/navigation'

export function Sidebar() {
  const { user } = useAuth()

  const visibleItems = NAV_ITEMS.filter((item) =>
    user ? item.allowedRoles.includes(user.role) : false
  )

  const groupedItems = visibleItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

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
        {Object.entries(groupedItems).map(([group, items]) => (
          <div key={group}>
            <p
              style={{
                padding: '16px 16px 4px',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'rgba(255,255,255,0.4)',
                margin: 0,
              }}
            >
              {group}
            </p>
            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  margin: '2px 8px',
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
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
