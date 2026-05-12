export interface ApiResponse<T> {
  status: boolean
  message: string
  data: T
}

export interface PaginatedData<T> {
  data: T[]
  total: number
  page: number
  page_size: number
  total_page: number
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>

export class ApiError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

export interface RequestParams {
  page?: number
  page_size?: number
  search?: string
}
