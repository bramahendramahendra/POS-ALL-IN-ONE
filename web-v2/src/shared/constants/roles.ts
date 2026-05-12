export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  KASIR: 'kasir',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]
