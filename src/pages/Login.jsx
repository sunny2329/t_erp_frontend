import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Lock, User, Sun, Moon, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

const STATS = [
  { value: '39', label: 'Load fields tracked end to end' },
  { value: '24/7', label: 'Dispatch visibility, no gaps' },
  { value: '1', label: 'Workspace for loads, fleet, and docs' },
]

export default function Login() {
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [loginId, setLoginId] = useState('admin')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = {}
    if (!loginId) nextErrors.loginId = 'Username or email is required'
    if (!password) nextErrors.password = 'Password is required'
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      await login(loginId, password)
      navigate('/dashboard')
    } catch (err) {
      setFormError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      {/* Left — sign-in form */}
      <div className="relative flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[46%] lg:px-16 xl:w-[40%]">
        <button
          onClick={toggleTheme}
          className="absolute right-6 top-6 rounded-md border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-600 text-white">
              <Truck className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">DispatchTMS</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Sign in to manage loads, dispatch, and tracking.</p>

          <form onSubmit={handleSubmit} className="mt-8">
            {formError && (
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Username or Email</span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="admin"
                    className="h-11 pl-9"
                    error={errors.loginId}
                  />
                </div>
                {errors.loginId && <span className="mt-1 block text-[11px] text-red-500">{errors.loginId}</span>}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Password</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 pl-9 pr-9"
                    error={errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <span className="mt-1 block text-[11px] text-red-500">{errors.password}</span>}
              </label>
            </div>

            <Button type="submit" className="mt-7 h-11 w-full text-sm font-medium" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>

      {/* Right — brand panel */}
      <div className="relative hidden bg-slate-950 lg:flex lg:w-[54%] lg:flex-col lg:justify-between xl:w-[60%]">
        <div className="flex items-center justify-between px-12 pt-10 font-mono text-[11px] uppercase tracking-wider text-slate-500">
          <span>Freight operations</span>
          <span>v1.0</span>
        </div>

        <div className="max-w-lg px-12">
          <span className="block h-px w-10 bg-brand-500" />
          <h2 className="mt-6 text-4xl font-semibold leading-[1.15] tracking-tight text-white">
            Every load, one system of record.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Book loads, assign drivers, and track delivery status without switching tools or losing the paper trail.
          </p>
        </div>

        <div className="grid grid-cols-3 border-t border-slate-800 px-12 py-8">
          {STATS.map(({ value, label }, i) => (
            <div key={label} className={i > 0 ? 'border-l border-slate-800 pl-6' : ''}>
              <p className="font-mono text-2xl font-semibold text-white">{value}</p>
              <p className="mt-1 text-xs leading-snug text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
