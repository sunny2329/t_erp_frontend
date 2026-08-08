import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Lock, User, Sun, Moon, AlertCircle, MapPin, Radar, PackageCheck, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

const HIGHLIGHTS = [
  { icon: Radar, text: 'Real-time tracking across every leg of the trip' },
  { icon: MapPin, text: 'Split loads and dispatch multiple drivers in seconds' },
  { icon: PackageCheck, text: 'One dashboard for loads, carriers, and documents' },
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
          className="absolute right-6 top-6 rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-sm hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Truck className="h-5 w-5" />
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
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900 lg:flex lg:w-[54%] lg:items-center lg:justify-center xl:w-[60%]">
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            color: '#ffffff',
          }}
        />
        <div className="absolute -right-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-brand-400/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-[28rem] w-[28rem] rounded-full bg-slate-900/40 blur-3xl" />

        <div className="relative z-10 max-w-lg px-12 text-white">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <Truck className="h-7 w-7" />
          </div>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Dispatch smarter.<br />Deliver faster.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-brand-100/90">
            The single workspace your team needs to book loads, dispatch drivers, and keep every shipment moving.
          </p>

          <div className="mt-10 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-brand-100/90">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
