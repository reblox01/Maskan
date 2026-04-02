import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'

export function useDeveloperMode() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/developer-mode/')
      .then(res => setEnabled(res.data.developer_mode))
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false))
  }, [])

  const toggle = useCallback(async () => {
    try {
      const res = await api.patch('/auth/developer-mode/')
      setEnabled(res.data.developer_mode)
    } catch {
      // silently fail
    }
  }, [])

  return { enabled, loading, toggle }
}
