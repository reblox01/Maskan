import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import axios from 'axios'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  updateUser: (data: Partial<User>) => void
  refreshUser: () => Promise<void>
}

interface RegisterData {
  email: string
  username: string
  password: string
  password_confirm: string
  phone?: string
  role?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const clearAuth = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }, [])

  const fetchProfile = useCallback(async () => {
    const access = localStorage.getItem('access_token')
    const refresh = localStorage.getItem('refresh_token')
    
    if (!access && !refresh) {
      setLoading(false)
      return
    }

    try {
      const res = await axios.get('/api/auth/profile/', {
        headers: { Authorization: `Bearer ${access}` }
      })
      setUser(res.data)
      setLoading(false)
      return
    } catch (err) {
      if (refresh && err.response?.status === 401) {
        try {
          const res = await axios.post('/api/auth/token/refresh/', { refresh })
          const newAccess = res.data.access
          localStorage.setItem('access_token', newAccess)
          if (res.data.refresh) {
            localStorage.setItem('refresh_token', res.data.refresh)
          }
          const profileRes = await axios.get('/api/auth/profile/', {
            headers: { Authorization: `Bearer ${newAccess}` }
          })
          setUser(profileRes.data)
          setLoading(false)
          return
        } catch {
          // Refresh failed
        }
      }
    }

    clearAuth()
    setLoading(false)
  }, [clearAuth])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const login = async (email: string, password: string) => {
    const res = await axios.post('/api/auth/login/', { email, password })
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    setUser(res.data.user)
  }

  const register = async (data: RegisterData) => {
    const res = await axios.post('/api/auth/register/', data)
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    setUser(res.data.user)
  }

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        await axios.post('/api/auth/logout/', { refresh })
      }
    } catch {
      // ignore
    }
    clearAuth()
  }

  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null)
  }, [])

  const refreshUser = useCallback(async () => {
    await fetchProfile()
  }, [fetchProfile])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}