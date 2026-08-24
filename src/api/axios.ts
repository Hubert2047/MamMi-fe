import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getSession } from 'next-auth/react'
const publicApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
const API_BASE_URL = typeof window === 'undefined' ? process.env.INTERNAL_API_BASE_URL || publicApiBaseUrl : publicApiBaseUrl
type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }
const api = axios.create({
    baseURL: `${API_BASE_URL}/api/`,
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    timeout: 5000,
})
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = typeof window !== 'undefined' ? (await getSession())?.accessToken : undefined
        // config.withCredentials = true
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        const activeStoreId = typeof window !== 'undefined' ? window.localStorage.getItem('activeStoreId') : null
        if (activeStoreId) config.headers['X-Store-Id'] = activeStoreId
        return config
    },
    (error: unknown) => {
        return Promise.reject(error)
    }
)

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<{ message?: string }>) => {
        const originalRequest = error.config as RetryConfig | undefined
        // If the error status is 401 and there is no originalRequest._retry flag,
        // it means the token has expired and we need to refresh it

        if (error?.response?.data.message === 'Invalid refresh token') {
            window.location.href = '/login'
            return
        }
        if (
            error?.response?.status === 401 &&
            error?.response?.data.message === 'Invalid token' &&
            originalRequest && !('_retry' in originalRequest && originalRequest._retry)
        ) {
            originalRequest._retry = true

            try {
                const response = await api.post('refresh-token')
                const { accessToken } = response.data

                // Retry the original request with the new token
                originalRequest.headers.Authorization = `Bearer ${accessToken}`
                return api(originalRequest)
            } catch (error) {
                return Promise.reject(error)
            }
        }
        return Promise.reject(error)
    }
)

export default api;
