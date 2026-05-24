import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import { ConfirmDialog, PageHeader } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { useDebounce } from '@/shared/hooks'
import { create } from 'zustand'

import { useDeleteMenuMutation, useMenuListQuery } from '@/features/menu/menu.api'
import type { MenuResponse } from '@/features/menu/menu.types'

import { MenuFormModal } from './components/MenuFormModal'

interface MenusPageState {
  editingMenuId: number | null
  menuModalOpen: boolean
  deleteConfirmOpen: boolean
  deleteTarget: { id: number; label: string } | null
  openMenuModal: (id?: number) => void
  closeMenuModal: () => void
  openDeleteConfirm: (target: { id: number; label: string }) => void
  closeDeleteConfirm: () => void
}

const useMenusPageStore = create<MenusPageState>((set) => ({
  editingMenuId: null,
  menuModalOpen: false,
  deleteConfirmOpen: false,
  deleteTarget: null,
  openMenuModal: (id) => set({ menuModalOpen: true, editingMenuId: id ?? null }),
  closeMenuModal: () => set({ menuModalOpen: false, editingMenuId: null }),
  openDeleteConfirm: (target) => set({ deleteConfirmOpen: true, deleteTarget: target }),
  closeDeleteConfirm: () => set({ deleteConfirmOpen: false, deleteTarget: null }),
}))

export function MenusPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const {
    menuModalOpen, editingMenuId, openMenuModal, closeMenuModal,
    deleteConfirmOpen, deleteTarget, openDeleteConfirm, closeDeleteConfirm,
  } = useMenusPageStore()

  const { data: menus = [], isLoading } = useMenuListQuery(
    debouncedSearch ? { search: debouncedSearch } : undefined
  )
  const { mutate: deleteMenu, isPending: isDeleting } = useDeleteMenuMutation()

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMenu(deleteTarget.id, { onSuccess: () => closeDeleteConfirm() })
  }

  // Buat lookup parent label
  const parentMap = menus.reduce<Record<number, string>>((acc, m) => {
    acc[m.id] = m.label
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <PageHeader
        title="Manajemen Menu"
        breadcrumbs={[{ label: 'Sistem' }, { label: 'Manajemen Menu' }]}
        actions={
          <Button onClick={() => openMenuModal()}>
            <Plus size={14} className="mr-2" />
            Tambah Menu
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <Input
          placeholder="Cari menu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Key</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Label</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Parent</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Path</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Urutan</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Memuat...</td></tr>
            )}
            {!isLoading && menus.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Belum ada menu</td></tr>
            )}
            {menus.map((menu: MenuResponse) => (
              <tr key={menu.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{menu.key_name}</td>
                <td className="px-4 py-3 font-medium">{menu.label}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {menu.parent_id ? parentMap[menu.parent_id] ?? '-' : <span className="text-blue-500">Root</span>}
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{menu.path ?? '-'}</td>
                <td className="px-4 py-3 text-center text-gray-500">{menu.order_index}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={menu.is_active ? 'default' : 'secondary'}>
                    {menu.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openMenuModal(menu.id)}>
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => openDeleteConfirm({ id: menu.id, label: menu.label })}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <MenuFormModal
        open={menuModalOpen}
        onOpenChange={closeMenuModal}
        menuId={editingMenuId ?? undefined}
        allMenus={menus}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(o) => { if (!o) closeDeleteConfirm() }}
        title="Hapus Menu"
        description={`Yakin ingin menghapus menu "${deleteTarget?.label}"? Sub-menu di bawahnya akan kehilangan parent.`}
        confirmLabel="Ya, Hapus"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
