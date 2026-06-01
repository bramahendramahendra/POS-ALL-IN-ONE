import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'

import { useAuthStore } from '@/features/auth/auth.store'
import { ApiError } from '@/shared/types'

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
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Biarkan browser set Content-Type otomatis untuk FormData (multipart/form-data + boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob') return response
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

      const { refreshToken, setSession, clearSession } = useAuthStore.getState()

      try {
        const { data } = await axios.post<{
          data: { access_token: string; refresh_token: string; expires_at: string }
        }>(`${import.meta.env.VITE_API_URL}/auth/refresh`, { refresh_token: refreshToken })
        const { access_token, refresh_token, expires_at } = data.data
        const currentUser = useAuthStore.getState().user
        if (currentUser) {
          setSession({
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: expires_at,
            user: currentUser,
          })
        }
        processQueue(null, access_token)

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearSession()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    const message: string = error.response?.data?.message ?? error.message ?? 'Terjadi kesalahan'
    const statusCode: number = error.response?.status ?? 0
    return Promise.reject(new ApiError(message, statusCode))
  }
)

export { apiClient }

export const api = {
  get: <T>(url: string, params?: object) => apiClient.get<T>(url, { params }).then((r) => r.data),
  post: <T>(url: string, data?: unknown) => apiClient.post<T>(url, data).then((r) => r.data),
  put: <T>(url: string, data?: unknown) => apiClient.put<T>(url, data).then((r) => r.data),
  patch: <T>(url: string, data?: unknown) => apiClient.patch<T>(url, data).then((r) => r.data),
  delete: <T>(url: string) => apiClient.delete<T>(url).then((r) => r.data),
}
