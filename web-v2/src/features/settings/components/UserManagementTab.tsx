import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { ConfirmDialog, FormModal } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useAuth } from '@/features/auth'
import { useRoleListQuery } from '@/features/settings/roles/roles.api'

import {
  useChangePasswordMutation,
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useUserListQuery,
} from '../settings.api'
import type { AppUser } from '../settings.types'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  full_name: z.string().min(1, 'Nama wajib diisi'),
  role_id: z.number({ error: 'Role wajib dipilih' }).int().positive('Role wajib dipilih'),
})

const editSchema = z.object({
  full_name: z.string().min(1, 'Nama wajib diisi'),
  role_id: z.number({ error: 'Role wajib dipilih' }).int().positive('Role wajib dipilih'),
  is_active: z.boolean(),
})

const changePasswordSchema = z
  .object({
    new_password: z.string().min(6, 'Password minimal 6 karakter'),
    confirm_password: z.string().min(6),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirm_password'],
  })

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>
type ChangePassForm = z.infer<typeof changePasswordSchema>

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_BADGE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  kasir: 'bg-green-100 text-green-700',
}

function RoleBadge({ roleName }: { roleName: string }) {
  const cls = ROLE_BADGE_COLORS[roleName] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {roleName}
    </span>
  )
}

// ─── Role Select ──────────────────────────────────────────────────────────────

function RoleSelect({
  value,
  onChange,
}: {
  value: number | undefined
  onChange: (v: number) => void
}) {
  const { data: roles } = useRoleListQuery({ is_active: true })
  const list = roles ?? []

  return (
    <Select
      value={value ? String(value) : ''}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger>
        <SelectValue placeholder="Pilih role..." />
      </SelectTrigger>
      <SelectContent>
        {list.map((r) => (
          <SelectItem key={r.id} value={String(r.id)}>
            {r.display_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateUserModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { mutate: createUser, isPending } = useCreateUserMutation()
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { username: '', password: '', full_name: '', role_id: undefined },
  })

  const onSubmit = (values: CreateForm) => {
    createUser(values, {
      onSuccess: () => {
        reset()
        onOpenChange(false)
      },
    })
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Tambah User"
      size="sm"
      isLoading={isPending}
      onSubmit={handleSubmit(onSubmit)}
      submitLabel="Tambah"
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>
            Username <span className="text-red-500">*</span>
          </Label>
          <Input {...register('username')} className={errors.username ? 'border-red-500' : ''} />
          {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>
            Password <span className="text-red-500">*</span>
          </Label>
          <Input
            type="password"
            {...register('password')}
            className={errors.password ? 'border-red-500' : ''}
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>
            Nama Lengkap <span className="text-red-500">*</span>
          </Label>
          <Input {...register('full_name')} className={errors.full_name ? 'border-red-500' : ''} />
          {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>
            Role <span className="text-red-500">*</span>
          </Label>
          <RoleSelect value={watch('role_id')} onChange={(v) => setValue('role_id', v)} />
          {errors.role_id && <p className="text-xs text-red-500">{errors.role_id.message}</p>}
        </div>
      </div>
    </FormModal>
  )
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditUserModal({
  open,
  onOpenChange,
  user,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  user: AppUser | null
}) {
  const { mutate: updateUser, isPending } = useUpdateUserMutation()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    values: user
      ? { full_name: user.full_name, role_id: user.role_id, is_active: user.is_active }
      : undefined,
  })

  const onSubmit = (values: EditForm) => {
    if (!user) return
    updateUser({ id: user.id, payload: values }, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit User"
      size="sm"
      isLoading={isPending}
      onSubmit={handleSubmit(onSubmit)}
      submitLabel="Simpan"
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>
            Nama Lengkap <span className="text-red-500">*</span>
          </Label>
          <Input {...register('full_name')} className={errors.full_name ? 'border-red-500' : ''} />
          {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <RoleSelect value={watch('role_id')} onChange={(v) => setValue('role_id', v)} />
          {errors.role_id && <p className="text-xs text-red-500">{errors.role_id.message}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is-active" {...register('is_active')} className="rounded" />
          <Label htmlFor="is-active">Akun Aktif</Label>
        </div>
      </div>
    </FormModal>
  )
}

// ─── Change Password Modal ────────────────────────────────────────────────────

function ChangePasswordModal({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  userId: number
}) {
  const { mutate: changePassword, isPending } = useChangePasswordMutation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePassForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { new_password: '', confirm_password: '' },
  })

  const onSubmit = (values: ChangePassForm) => {
    changePassword(
      { id: userId, payload: { new_password: values.new_password } },
      {
        onSuccess: () => {
          reset()
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Ganti Password"
      size="sm"
      isLoading={isPending}
      onSubmit={handleSubmit(onSubmit)}
      submitLabel="Simpan"
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>
            Password Baru <span className="text-red-500">*</span>
          </Label>
          <Input
            type="password"
            {...register('new_password')}
            className={errors.new_password ? 'border-red-500' : ''}
          />
          {errors.new_password && (
            <p className="text-xs text-red-500">{errors.new_password.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>
            Konfirmasi Password <span className="text-red-500">*</span>
          </Label>
          <Input
            type="password"
            {...register('confirm_password')}
            className={errors.confirm_password ? 'border-red-500' : ''}
          />
          {errors.confirm_password && (
            <p className="text-xs text-red-500">{errors.confirm_password.message}</p>
          )}
        </div>
      </div>
    </FormModal>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function UserManagementTab() {
  const { user: currentUser } = useAuth()
  const { data: users, isLoading } = useUserListQuery()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AppUser | null>(null)
  const [changePassTarget, setChangePassTarget] = useState<AppUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null)

  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUserMutation()

  const userList = users ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          + Tambah User
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left">Username</th>
                <th className="px-4 py-2.5 text-left">Nama</th>
                <th className="px-4 py-2.5 text-left">Role</th>
                <th className="px-4 py-2.5 text-center">Status</th>
                <th className="px-4 py-2.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {userList.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-700">{u.username}</td>
                  <td className="px-4 py-3 font-medium">{u.full_name}</td>
                  <td className="px-4 py-3">
                    <RoleBadge roleName={u.role_name} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs font-medium ${u.is_active ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => setEditTarget(u)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => setChangePassTarget(u)}
                      >
                        Password
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                        disabled={u.id === currentUser?.id}
                        onClick={() => setDeleteTarget(u)}
                      >
                        Nonaktifkan
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateUserModal open={createOpen} onOpenChange={setCreateOpen} />
      <EditUserModal
        open={!!editTarget}
        onOpenChange={(v) => {
          if (!v) setEditTarget(null)
        }}
        user={editTarget}
      />
      <ChangePasswordModal
        open={!!changePassTarget}
        onOpenChange={(v) => {
          if (!v) setChangePassTarget(null)
        }}
        userId={changePassTarget?.id ?? 0}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null)
        }}
        title="Nonaktifkan User"
        description={`User "${deleteTarget?.full_name}" akan dinonaktifkan. Lanjutkan?`}
        confirmLabel="Nonaktifkan"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={() => {
          if (deleteTarget) deleteUser(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
        }}
      />
    </div>
  )
}
