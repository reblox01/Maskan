import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Home, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/hooks/useToast'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
    phone: '',
    role: 'acquereur',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.email) {
      errors.email = 'Email requis.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Format d\'email invalide.'
    }

    if (!formData.username) {
      errors.username = 'Nom d\'utilisateur requis.'
    } else if (formData.username.length < 3) {
      errors.username = 'Minimum 3 caractères.'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Lettres, chiffres et _ uniquement.'
    }

    if (!formData.password) {
      errors.password = 'Mot de passe requis.'
    } else if (formData.password.length < 8) {
      errors.password = 'Minimum 8 caractères.'
    } else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Le mot de passe doit contenir une majuscule, une minuscule et un chiffre.'
    }

    if (formData.password !== formData.password_confirm) {
      errors.password_confirm = 'Les mots de passe ne correspondent pas.'
    }

    if (formData.phone && !/^\+?[\d\s\-()]{6,20}$/.test(formData.phone)) {
      errors.phone = 'Numéro de téléphone invalide.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    try {
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        password_confirm: formData.password_confirm,
        phone: formData.phone,
        role: formData.role,
      })

      if (formData.role === 'vendeur') {
        navigate('/vendeur-signup')
      } else {
        navigate('/')
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: Record<string, string | string[]> } }
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
          if (data.error) toast({ title: String(data.error), variant: 'destructive' })
        }
      }
      toast({ title: "Une erreur est survenue lors de l'inscription.", variant: 'destructive' })
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email <span className="text-red-500">*</span>
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
                Nom d'utilisateur <span className="text-red-500">*</span>
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
                aria-invalid={!!fieldErrors.phone}
              />
              {fieldErrors.phone && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Mot de passe <span className="text-red-500">*</span>
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
              <p className="text-xs text-slate-400 mt-1">Min. 8 caractères, majuscule, minuscule et chiffre</p>
            </div>

            <div>
              <label htmlFor="password_confirm" className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirmer le mot de passe <span className="text-red-500">*</span>
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Vous êtes
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'acquereur', label: 'Acquereur', desc: 'Je cherche un bien' },
                  { value: 'vendeur', label: 'Vendeur', desc: 'Je veux vendre/louer' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField('role', opt.value)}
                    className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      formData.role === opt.value
                        ? 'border-teal-700 bg-teal-50 text-teal-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-semibold">{opt.label}</span>
                    <span className="text-xs opacity-70">{opt.desc}</span>
                  </button>
                ))}
              </div>
              {formData.role === 'vendeur' && (
                <p className="text-xs text-teal-600 mt-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Vous devrez remplir un formulaire de candidature
                </p>
              )}
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