import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  Package,
  Radio,
  Building2,
  Truck,
  UserRound,
  CarFront,
  Container,
  MapPin,
  Warehouse,
  UsersRound,
  Truck as TruckLogo,
  ChevronDown,
  Shield,
} from 'lucide-react'

const topItem = { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }

const navGroups = [
  {
    id: 'dispatch',
    label: 'Dispatch Ops',
    icon: Radio,
    items: [
      { to: '/loads', label: 'Loads', icon: Package },
      { to: '/dispatch', label: 'Dispatch', icon: Radio },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: Building2,
    items: [{ to: '/customers', label: 'Customers', icon: Building2 }],
  },
  {
    id: 'fleet',
    label: 'Fleet',
    icon: Truck,
    items: [
      { to: '/carriers', label: 'Carriers', icon: Truck },
      { to: '/drivers', label: 'Drivers', icon: UserRound },
      { to: '/vehicles', label: 'Vehicles', icon: CarFront },
      { to: '/trailers', label: 'Trailers', icon: Container },
    ],
  },
  {
    id: 'network',
    label: 'Network',
    icon: MapPin,
    items: [
      { to: '/locations', label: 'Locations', icon: MapPin },
      { to: '/terminals', label: 'Terminals', icon: Warehouse },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: Shield,
    items: [{ to: '/users', label: 'Users', icon: UsersRound }],
  },
]

function NavItem({ to, label, icon: Icon, onNavigate, nested }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition',
          nested ? 'pl-9 pr-3' : 'px-3',
          isActive
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  )
}

function NavGroup({ group, onNavigate, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const GroupIcon = group.icon

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
      >
        <GroupIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown className={clsx('h-3.5 w-3.5 shrink-0 transition-transform', open ? 'rotate-0' : '-rotate-90')} />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {group.items.map((item) => (
            <NavItem key={item.to} {...item} onNavigate={onNavigate} nested />
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ open, onNavigate }) {
  const { hasAccess } = useAuth()

  const showTopItem = hasAccess(topItem.to)
  const visibleGroups = navGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => hasAccess(item.to)) }))
    .filter((group) => group.items.length > 0)

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <TruckLogo className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">DispatchTMS</span>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {showTopItem && <NavItem {...topItem} onNavigate={onNavigate} />}

        {visibleGroups.length > 0 && (
          <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800/60">
            {visibleGroups.map((group) => (
              <NavGroup key={group.id} group={group} onNavigate={onNavigate} defaultOpen />
            ))}
          </div>
        )}

        {!showTopItem && visibleGroups.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-slate-400">No pages assigned</p>
        )}
      </nav>

      <div className="border-t border-slate-200 p-3 text-[11px] text-slate-400 dark:border-slate-800">
        Live data · Postgres-backed
      </div>
    </aside>
  )
}
