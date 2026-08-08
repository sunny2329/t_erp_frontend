import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus, Search, X } from 'lucide-react'
import clsx from 'clsx'

export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  error,
  disabled,
  onAddNew,
  addNewLabel = 'Add new',
  clearable = true,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const selected = options.find((o) => o.value === value)
  const filtered = options.filter((o) =>
    `${o.label} ${o.sublabel || ''}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-left text-sm outline-none transition',
          error ? 'border-red-400' : 'border-slate-300 dark:border-slate-700',
          disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-brand-400',
          'dark:bg-slate-900 dark:text-slate-100',
        )}
      >
        <span className={clsx('truncate', !selected && 'text-slate-400')}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && clearable && (
            <X
              className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
              }}
            />
          )}
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </span>
      </button>

      {open && !disabled && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-200 px-2.5 py-2 dark:border-slate-800">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </div>
          <div className="scrollbar-thin max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-slate-400">No results</div>
            )}
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                  setQuery('')
                }}
                className={clsx(
                  'flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800',
                  o.value === value && 'bg-brand-50 dark:bg-brand-900/20',
                )}
              >
                <span className="text-slate-800 dark:text-slate-100">{o.label}</span>
                {o.sublabel && <span className="text-[11px] text-slate-400">{o.sublabel}</span>}
              </button>
            ))}
          </div>
          {onAddNew && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setQuery('')
                onAddNew()
              }}
              className="flex w-full items-center gap-1.5 border-t border-slate-200 px-3 py-2 text-left text-sm font-medium text-brand-600 hover:bg-brand-50 dark:border-slate-800 dark:text-brand-400 dark:hover:bg-brand-900/20"
            >
              <Plus className="h-3.5 w-3.5" />
              {addNewLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
