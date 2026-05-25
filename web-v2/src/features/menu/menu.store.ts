import { create } from 'zustand'

import type { MenuItem, MenuPermission } from './menu.types'

interface MenuState {
  menus: MenuItem[]
  // Map key_name → permission untuk lookup O(1) di komponen
  permissionMap: Record<string, MenuPermission>
  isLoaded: boolean

  setMenus: (menus: MenuItem[]) => void
  clearMenus: () => void
  getPermission: (keyName: string) => MenuPermission | null
  hasAccess: (keyName: string) => boolean
}

function buildPermissionMap(menus: MenuItem[]): Record<string, MenuPermission> {
  const map: Record<string, MenuPermission> = {}

  function traverse(items: MenuItem[]) {
    for (const item of items) {
      map[item.key_name] = item.permission
      if (item.children.length > 0) {
        traverse(item.children)
      }
    }
  }

  traverse(menus)
  return map
}

export const useMenuStore = create<MenuState>((set, get) => ({
  menus: [],
  permissionMap: {},
  isLoaded: false,

  setMenus: (menus) =>
    set({
      menus,
      permissionMap: buildPermissionMap(menus),
      isLoaded: true,
    }),

  clearMenus: () =>
    set({
      menus: [],
      permissionMap: {},
      isLoaded: false,
    }),

  getPermission: (keyName) => {
    return get().permissionMap[keyName] ?? null
  },

  hasAccess: (keyName) => {
    const perm = get().permissionMap[keyName]
    return perm?.can_view === true
  },
}))
