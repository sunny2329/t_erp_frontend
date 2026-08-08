import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../services/authApi'
import { getToken, setToken } from '../services/apiClient'

const AuthContext = createContext(null)

function mapPermissions(permissions) {
  return (permissions || []).map((p) => ({
    pageId: String(p.page_id),
    route: p.route,
    title: p.title,
    groupName: p.group_name,
    allowAdd: !!p.allow_add,
    allowEdit: !!p.allow_edit,
    allowDelete: !!p.allow_delete,
  }))
}

function mapUser(u) {
  if (!u) return null
  return {
    id: u.id,
    carrierId: u.carrier_id,
    name: u.full_name,
    email: u.user_email || u.user_name,
    role: u.user_name === 'admin' ? 'Admin' : 'Team Member',
    permissions: mapPermissions(u.permissions),
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const me = await authApi.me()
        if (!cancelled) setUser(mapUser(me))
      } catch {
        setToken(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = async (loginId, password) => {
    const { token, user: loggedInUser } = await authApi.login(loginId, password)
    setToken(token)
    setUser(mapUser(loggedInUser))
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // best-effort — clear local session regardless
    }
    setToken(null)
    setUser(null)
  }

  const hasAccess = (route) => !!user?.permissions?.some((p) => p.route === route)
  const firstAccessibleRoute = user?.permissions?.[0]?.route || null

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user, loading, hasAccess, firstAccessibleRoute }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
