import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

// Optional colored/collapsible variant used by LoadDrawer to match the
// reference (Loadx-Youngs-Frontend) LoadDetailDrawer's accordion styling —
// every other consumer only ever passes title/description/actions/children,
// so those defaults are untouched.
const COLOR_STYLES = {
  blue: {
    border: 'border-blue-300 dark:border-blue-700',
    bg: 'bg-blue-50/60 dark:bg-blue-900/10',
    header: 'bg-blue-100 hover:bg-blue-200 border-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:border-blue-700',
    title: 'text-blue-900 dark:text-blue-200',
    icon: 'text-blue-700 dark:text-blue-400',
  },
  orange: {
    border: 'border-orange-300 dark:border-orange-700',
    bg: 'bg-orange-50/60 dark:bg-orange-900/10',
    header: 'bg-orange-100 hover:bg-orange-200 border-orange-300 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:border-orange-700',
    title: 'text-orange-900 dark:text-orange-200',
    icon: 'text-orange-700 dark:text-orange-400',
  },
  emerald: {
    border: 'border-emerald-300 dark:border-emerald-700',
    bg: 'bg-emerald-50/60 dark:bg-emerald-900/10',
    header: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:border-emerald-700',
    title: 'text-emerald-900 dark:text-emerald-200',
    icon: 'text-emerald-700 dark:text-emerald-400',
  },
  indigo: {
    border: 'border-indigo-300 dark:border-indigo-700',
    bg: 'bg-indigo-50/60 dark:bg-indigo-900/10',
    header: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:border-indigo-700',
    title: 'text-indigo-900 dark:text-indigo-200',
    icon: 'text-indigo-700 dark:text-indigo-400',
  },
  purple: {
    border: 'border-purple-300 dark:border-purple-700',
    bg: 'bg-purple-50/60 dark:bg-purple-900/10',
    header: 'bg-purple-100 hover:bg-purple-200 border-purple-300 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:border-purple-700',
    title: 'text-purple-900 dark:text-purple-200',
    icon: 'text-purple-700 dark:text-purple-400',
  },
}

export function Section({ title, description, actions, children, className = '', collapsible = false, defaultOpen = true, color }) {
  const [open, setOpen] = useState(defaultOpen)
  const palette = color && COLOR_STYLES[color]

  if (!collapsible) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50 ${className}`}>
        {(title || actions) && (
          <div className="mb-4 flex items-center justify-between">
            <div>
              {title && <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>}
              {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
            {actions}
          </div>
        )}
        {children}
      </div>
    )
  }

  // `actions` may contain interactive elements (buttons) — those cannot be
  // nested inside the toggle <button> (invalid HTML / hydration error), so
  // the header is a non-button row with the toggle as a flex-1 button and
  // actions rendered as a separate sibling.
  return (
    <div className={`rounded-xl border p-3 ${palette ? `${palette.border} ${palette.bg}` : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50'} ${className}`}>
      <div className={`flex items-center gap-2 rounded-lg border p-2 transition-colors ${palette ? palette.header : 'border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center justify-between rounded text-left transition-opacity hover:opacity-80"
        >
          <div>
            {title && <h3 className={`text-sm font-bold uppercase tracking-wide ${palette ? palette.title : 'text-slate-700 dark:text-slate-200'}`}>{title}</h3>}
            {description && <p className="mt-0.5 text-xs font-normal normal-case text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          {open ? <ChevronUp className={`h-4 w-4 shrink-0 ${palette ? palette.icon : 'text-slate-500'}`} /> : <ChevronDown className={`h-4 w-4 shrink-0 ${palette ? palette.icon : 'text-slate-500'}`} />}
        </button>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  )
}
