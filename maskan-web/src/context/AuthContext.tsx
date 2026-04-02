import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import api from '@/lib/api'
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

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/profile/')
      setUser(res.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login/', { email, password })
    setUser(res.data.user)
  }

  const register = async (data: RegisterData) => {
    const res = await api.post('/auth/register/', data)
    setUser(res.data.user)
  }

  const logout = async () => {
    await api.post('/auth/logout/')
    setUser(null)
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
