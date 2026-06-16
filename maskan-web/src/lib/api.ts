import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "/api",
  headers: {
    "Content-Type": "application/json",
  },
})

const publicEndpoints = [
  '/properties/',
  '/properties/featured/',
  '/properties/cities/',
  '/properties/regions/',
  '/properties/map-pins/',
  '/favorites/',
]

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

        const refreshBase = import.meta.env.VITE_API_URL || ""
        const res = await axios.post(`${refreshBase}/api/auth/token/refresh/`, { refresh: refreshToken })
        const newToken = res.data.access
        localStorage.setItem("access_token", newToken)
        if (res.data.refresh) {
          localStorage.setItem("refresh_token", res.data.refresh)
        }

        originalRequest.headers.Authorization = `Bearer ${newToken}`
        
        processQueue()
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export const toggleFavorite = async (propertyId: string) => {
  const res = await api.post(`/favorites/toggle/${propertyId}/`)
  return res.data
}

export const getFavorites = async () => {
  const res = await api.get('/favorites/list/')
  return res.data
}

export const createVisitRequest = async (propertyId: string, data: { scheduled_date: string; notes?: string }) => {
  const res = await api.post(`/properties/request-visit/${propertyId}/`, data)
  return res.data
}

export const getMyVisitRequests = async () => {
  const res = await api.get('/properties/my-visit-requests/')
  return res.data
}

export const updateVisitStatus = async (id: string, status: string) => {
  const res = await api.patch('/properties/my-visit-requests/', { id, status })
  return res.data
}

export const getBookedDates = async (propertyId: string) => {
  const res = await api.get(`/properties/${propertyId}/booked-dates/`)
  return res.data
}

export const getContracts = async () => {
  const res = await api.get('/contracts/')
  return res.data
}

export const createContract = async (data: {
  property: string; acquereur: string; contract_type: string; notes?: string; agreed_price: number
}) => {
  const res = await api.post('/contracts/', data)
  return res.data
}

export const signContract = async (id: string) => {
  const res = await api.patch(`/contracts/${id}/sign/`)
  return res.data
}

export const getContractPdf = async (id: string) => {
  const res = await api.get(`/contracts/${id}/pdf/`, { responseType: 'blob' })
  return res.data
}

export const getImageUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined
  if (url.startsWith("http")) return url
  const base = import.meta.env.VITE_API_URL || ""
  return `${base}${url}`
}

export default api