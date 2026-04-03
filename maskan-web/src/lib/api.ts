import axios from "axios"

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Public endpoints that should NOT trigger login redirect
const publicEndpoints = [
  '/properties/',
  '/properties/featured/',
  '/properties/cities/',
  '/properties/regions/',
  '/properties/map-pins/',
]

// Add auth token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(null)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const url = originalRequest?.url || ''

    // Skip redirect for public endpoints
    const isPublic = publicEndpoints.some(ep => url.startsWith(ep))

    if (error.response?.status === 401 && !originalRequest._retry && !isPublic) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem("refresh_token")
        if (!refreshToken) throw new Error("No refresh token")

        const res = await axios.post("/api/auth/token/refresh/", { refresh: refreshToken })
        const newToken = res.data.access
        localStorage.setItem("access_token", newToken)
        if (res.data.refresh) {
          localStorage.setItem("refresh_token", res.data.refresh)
        }

        // Update the original request's Authorization header
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        
        processQueue()
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        window.location.href = "/login"
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
