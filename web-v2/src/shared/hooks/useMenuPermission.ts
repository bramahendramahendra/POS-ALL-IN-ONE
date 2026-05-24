import { useMenuStore } from '@/features/menu/menu.store'

/**
 * Hook untuk mengambil permission user pada menu tertentu.
 * Gunakan key_name menu sebagai argument, contoh: 'inventory.products'
 */
export function useMenuPermission(menuKey: string) {
  const getPermission = useMenuStore((s) => s.getPermission)
  const perm = getPermission(menuKey)

  return {
    canView:   perm?.can_view   ?? false,
    canCreate: perm?.can_create ?? false,
    canEdit:   perm?.can_edit   ?? false,
    canDelete: perm?.can_delete ?? false,
  }
}
