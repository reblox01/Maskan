import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
    phone: '',
    role: 'client',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.email) errors.email = 'Email requis.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Email invalide.'

    if (!formData.username) errors.username = 'Nom d\'utilisateur requis.'
    else if (formData.username.length < 3) errors.username = 'Minimum 3 caractères.'
    else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) errors.username = 'Lettres, chiffres et _ uniquement.'

    if (!formData.password) errors.password = 'Mot de passe requis.'
    else if (formData.password.length < 8) errors.password = 'Minimum 8 caractères.'

    if (formData.password !== formData.password_confirm) errors.password_confirm = 'Les mots de passe ne correspondent pas.'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validate()) return

    setLoading(true)
    try {
      await register(formData)
      navigate('/')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: Record<string, string[]> } }
        const data = axiosErr.response?.data
        if (data) {
          const serverErrors: Record<string, string> = {}
          Object.entries(data).forEach(([key, value]) => {
            if (Array.isArray(value)) serverErrors[key] = value.join(' ')
            else if (typeof value === 'string') serverErrors[key] = value
          })
          if (Object.keys(serverErrors).length > 0) {
            setFieldErrors(serverErrors)
            return
          }
          if (data.error) setError(data.error)
        }
      }
      setError('Une erreur est survenue lors de l\'inscription.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-teal-50 to-white px-4 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-teal-900">Maskan</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
          <h1 className="text-xl font-bold text-teal-900 text-center mb-1">Créer un compte</h1>
          <p className="text-sm text-slate-500 text-center mb-6">
            Rejoignez Maskan pour trouver votre bien idéal
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="votre@email.com"
                autoComplete="email"
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email && (
                <p id="email-error" className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                Nom d'utilisateur
              </label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => updateField('username', e.target.value)}
                placeholder="ahmed_b"
                autoComplete="username"
                aria-invalid={!!fieldErrors.username}
              />
              {fieldErrors.username && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                Téléphone <span className="text-slate-400">(optionnel)</span>
              </label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+212 6XX XXX XXX"
                autoComplete="tel"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-invalid={!!fieldErrors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="password_confirm" className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirmer le mot de passe
              </label>
              <Input
                id="password_confirm"
                type="password"
                value={formData.password_confirm}
                onChange={(e) => updateField('password_confirm', e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={!!fieldErrors.password_confirm}
              />
              {fieldErrors.password_confirm && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.password_confirm}</p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Vous êtes
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'client', label: 'Client' },
                  { value: 'agent', label: 'Agent immobilier' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField('role', opt.value)}
                    className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border-2 transition-all cursor-pointer ${
                      formData.role === opt.value
                        ? 'border-teal-700 bg-teal-50 text-teal-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-teal-700 hover:bg-teal-800 cursor-pointer"
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </Button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-teal-700 font-medium hover:text-teal-800 cursor-pointer">
              Se connecter
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
