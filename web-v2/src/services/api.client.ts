import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'

import { ApiError } from '@/shared/types'

// Lazy import pattern — auth store dibuat di FASE 2
// Gunakan dynamic require agar tidak circular dependency saat store belum ada
type AuthStore = {
  accessToken: string | null
  refreshToken: string | null
  setSession: (accessToken: string, refreshToken: string) => void
  clearSession: () => void
}

const getAuthStore = (): AuthStore | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = (globalThis as any).__authStore as AuthStore | undefined
    return mod ?? null
  } catch {
    return null
  }
}

// Queue untuk concurrent 401 requests
type QueueItem = {
  resolve: (token: string) => void
  reject: (err: unknown) => void
}
let isRefreshing = false
const failedQueue: QueueItem[] = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((item) => {
    if (error) {
      item.reject(error)
    } else {
      item.resolve(token as string)
    }
  })
  failedQueue.length = 0
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// Request interceptor — attach token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const store = getAuthStore()
  const token = store?.accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data as { status: boolean; message: string; data: unknown }
    if (body.status === false) {
      throw new ApiError(body.message, response.status)
    }
    // Unwrap: kembalikan data langsung
    response.data = body.data
    return response
  },
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Antri request yang sedang menunggu refresh
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`
            }
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const store = getAuthStore()
      const refreshToken = store?.refreshToken

      try {
        const { data } = await axios.post<{ data: { access_token: string; refresh_token: string } }>(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refresh_token: refreshToken },
        )
        const { access_token, refresh_token } = data.data
        store?.setSession(access_token, refresh_token)
        processQueue(null, access_token)

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        store?.clearSession()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    const message: string =
      error.response?.data?.message ?? error.message ?? 'Terjadi kesalahan'
    const statusCode: number = error.response?.status ?? 0
    return Promise.reject(new ApiError(message, statusCode))
  },
)

export { apiClient }

export const api = {
  get: <T>(url: string, params?: object) =>
    apiClient.get<T>(url, { params }).then((r) => r.data),
  post: <T>(url: string, data?: unknown) =>
    apiClient.post<T>(url, data).then((r) => r.data),
  put: <T>(url: string, data?: unknown) =>
    apiClient.put<T>(url, data).then((r) => r.data),
  patch: <T>(url: string, data?: unknown) =>
    apiClient.patch<T>(url, data).then((r) => r.data),
  delete: <T>(url: string) =>
    apiClient.delete<T>(url).then((r) => r.data),
}
