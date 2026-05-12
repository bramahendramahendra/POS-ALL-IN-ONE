export interface Category {
  id: number
  name: string
  created_at: string
}

export interface Unit {
  id: number
  name: string
  created_at: string
}

export interface ProductUnit {
  id: number
  product_id: number
  unit_id: number
  unit_name: string
  barcode?: string
  cost_price: number
  is_default: boolean
}

export interface PriceTier {
  id: number
  product_id: number
  unit_id: number
  unit_name: string
  tier_name: string
  min_qty: number
  price: number
}

export interface Product {
  id: number
  name: string
  sku?: string
  category_id?: number
  category_name?: string
  description?: string
  is_active: boolean
  created_at: string
  units: ProductUnit[]
  prices: PriceTier[]
}

export interface ProductFilter {
  search?: string
  category_id?: number
  is_active?: boolean
  page?: number
  page_size?: number
}

export interface CreateProductPayload {
  name: string
  sku?: string
  category_id?: number
  description?: string
  is_active: boolean
}

export type UpdateProductPayload = Partial<CreateProductPayload>

export interface CreateCategoryPayload { name: string }
export type UpdateCategoryPayload = Partial<CreateCategoryPayload>

export interface CreateUnitPayload { name: string }
export type UpdateUnitPayload = Partial<CreateUnitPayload>

export interface CreateProductUnitPayload {
  unit_id: number
  barcode?: string
  cost_price: number
  is_default: boolean
}

export interface UpdateProductUnitPayload extends Partial<CreateProductUnitPayload> {
  unitId: number
}

export interface CreatePriceTierPayload {
  unit_id: number
  tier_name: string
  min_qty: number
  price: number
}

export interface UpdatePriceTierPayload extends Partial<CreatePriceTierPayload> {
  priceId: number
}
