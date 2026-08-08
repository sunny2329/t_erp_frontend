import { Navigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'

function NoAccess() {
  const { logout } = useAuth()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <ShieldAlert className="h-10 w-10 text-slate-300 dark:text-slate-700" />
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No pages assigned yet</p>
        <p className="mt-1 text-xs text-slate-400">Ask an admin to grant you access from Users → Page Access.</p>
      </div>
      <Button variant="secondary" size="sm" onClick={logout}>Sign out</Button>
    </div>
  )
}

// Gates a single route against the logged-in user's user_roles permissions
// (carried on the JWT / returned by /auth/me). A page is visible if the user
// has any user_roles row for it — see AuthContext.hasAccess.
export function PageGuard({ route, children }) {
  const { hasAccess, firstAccessibleRoute } = useAuth()

  if (hasAccess(route)) return children
  if (firstAccessibleRoute) return <Navigate to={firstAccessibleRoute} replace />
  return <NoAccess />
}
