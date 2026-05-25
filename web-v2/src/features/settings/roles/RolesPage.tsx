import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Settings, Shield, Trash2 } from 'lucide-react'

import { ConfirmDialog, PageHeader } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { useDebounce } from '@/shared/hooks'

import { useDeleteRoleMutation, useRoleListQuery, useToggleRoleStatusMutation } from './roles.api'
import { useRolesStore } from './roles.store'
import { RoleFormModal } from './components/RoleFormModal'

export function RolesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const {
    roleModalOpen, editingRoleId, openRoleModal, closeRoleModal,
    deleteConfirmOpen, deleteTarget, openDeleteConfirm, closeDeleteConfirm,
  } = useRolesStore()

  const { data: roles = [], isLoading } = useRoleListQuery(
    debouncedSearch ? { search: debouncedSearch } : undefined
  )
  const { mutate: deleteRole, isPending: isDeleting } = useDeleteRoleMutation()
  const { mutate: toggleStatus } = useToggleRoleStatusMutation()

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteRole(deleteTarget.id, { onSuccess: () => closeDeleteConfirm() })
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Manajemen Role"
        breadcrumbs={[{ label: 'Sistem' }, { label: 'Manajemen Role' }]}
        actions={
          <Button onClick={() => openRoleModal()}>
            <Shield size={14} className="mr-2" />
            Tambah Role
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <Input
          placeholder="Cari role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nama Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Label</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Deskripsi</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Tipe</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Memuat...</td></tr>
            )}
            {!isLoading && roles.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Belum ada role</td></tr>
            )}
            {roles.map((role) => (
              <tr key={role.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs font-medium">{role.name}</td>
                <td className="px-4 py-3 font-medium">{role.display_name}</td>
                <td className="px-4 py-3 text-gray-500">{role.description ?? '-'}</td>
                <td className="px-4 py-3 text-center">
                  {role.is_system
                    ? <Badge variant="secondary">Sistem</Badge>
                    : <Badge variant="outline">Custom</Badge>
                  }
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => !role.is_system && toggleStatus(role.id)}
                    disabled={role.is_system}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${role.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} disabled:cursor-not-allowed`}
                  >
                    {role.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Atur Akses Menu"
                      onClick={() => navigate(`/settings/roles/${role.id}/access`)}
                    >
                      <Settings size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openRoleModal(role.id)}
                    >
                      <Pencil size={14} />
                    </Button>
                    {!role.is_system && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => openDeleteConfirm({ id: role.id, name: role.display_name })}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RoleFormModal
        open={roleModalOpen}
        onOpenChange={closeRoleModal}
        roleId={editingRoleId ?? undefined}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(o) => { if (!o) closeDeleteConfirm() }}
        title="Hapus Role"
        description={`Yakin ingin menghapus role "${deleteTarget?.name}"? Semua user dengan role ini harus dipindahkan terlebih dahulu.`}
        confirmLabel="Ya, Hapus"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
