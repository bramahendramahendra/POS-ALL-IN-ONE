export interface MyCashTransaction {
  id: number
  type: 'receive' | 'return'
  amount: number
  notes?: string
  created_by_name: string
  created_at: string
}

export interface MyCashData {
  balance: number
  transactions: MyCashTransaction[]
}
