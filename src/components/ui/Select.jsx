import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'

export function Select({ error, className = '', children, ...props }) {
  return (
    <div className="relative">
      <select
        className={clsx(
          'w-full appearance-none rounded-md border bg-white px-3 py-2 pr-8 text-sm text-slate-900 outline-none transition-colors focus:ring-1 focus:ring-brand-500',
          error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-brand-500',
          'dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:border-brand-500',
          props.disabled && 'opacity-60 cursor-not-allowed',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  )
}
