import { useState } from 'react'
import { Bell, LogOut, Menu } from 'lucide-react'

import { useLogoutMutation } from '@/features/auth/auth.api'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useSyncStatus } from '@/features/sync'
import { config, ROLES } from '@/shared/constants'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'

function getRoleBadgeClass(role: string) {
  if (role === ROLES.OWNER) return 'bg-yellow-500 text-white border-transparent hover:bg-yellow-500'
  if (role === ROLES.ADMIN) return 'bg-blue-500 text-white border-transparent hover:bg-blue-500'
  return 'bg-green-500 text-white border-transparent hover:bg-green-500'
}

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function Navbar() {
  const { user } = useAuth()
  const { mutate: logout, isPending } = useLogoutMutation()
  const { conflictCount } = useSyncStatus()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between px-4"
        style={{
          height: 'var(--navbar-height)',
          backgroundColor: 'var(--color-primary)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        {/* Kiri */}
        <div className="flex items-center gap-3">
          <button className="text-white/70 hover:text-white transition-colors p-1">
            <Menu size={20} />
          </button>
          <span className="text-white font-bold text-lg tracking-wide">{config.appName}</span>
        </div>

        {/* Kanan */}
        <div className="flex items-center gap-3">
          <button className="text-white/70 hover:text-white transition-colors p-1 relative">
            <Bell size={18} />
            {conflictCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {conflictCount > 9 ? '9+' : conflictCount}
              </span>
            )}
          </button>

          {user && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[#3498db] text-white text-xs font-semibold">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-white text-sm font-medium">{user.fullName}</span>
                <Badge className={`mt-0.5 text-[10px] px-1.5 py-0 ${getRoleBadgeClass(user.roleName)}`}>
                  {user.roleName}
                </Badge>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLogoutDialogOpen(true)}
            disabled={isPending}
            className="text-white/80 hover:text-white hover:bg-red-500/20 h-8 w-8"
            title="Logout"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </header>

      <ConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        title="Keluar dari Aplikasi"
        description="Anda akan keluar dari sesi ini. Lanjutkan?"
        confirmLabel="Ya, Keluar"
        variant="default"
        isLoading={isPending}
        onConfirm={() => logout()}
      />
    </>
  )
}
