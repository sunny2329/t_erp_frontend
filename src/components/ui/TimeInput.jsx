import { useEffect, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import clsx from 'clsx'
import { Input } from './Input'
import { formatTime } from '../../utils/time'

// Half-hour quick-picks, 00:00–23:30 — a fast path for the common case.
// Manual typing (any exact HH:MM, including odd minutes) always still works
// in the text field itself; this dropdown is just a shortcut on top of it.
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

// 24h time field with both an editable text input (type any HH:MM directly)
// and a click-to-pick dropdown of half-hour slots — see utils/time.js for
// why this replaces native <input type="time"> (its 12h/24h display isn't
// controllable from the page).
export function TimeInput({ value, onChange, disabled, error, className, ...props }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    if (open) listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [open])

  const emit = (v) => onChange({ target: { value: v } })

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          placeholder="HH:MM"
          maxLength={5}
          value={formatTime(value)}
          onChange={(e) => emit(formatTime(e.target.value))}
          onFocus={() => !disabled && setOpen(true)}
          disabled={disabled}
          error={error}
          className={clsx('pr-8', className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed dark:hover:text-slate-300"
        >
          <Clock className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && !disabled && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div ref={listRef} className="scrollbar-thin max-h-56 overflow-y-auto py-1">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                data-selected={t === value}
                onClick={() => {
                  emit(t)
                  setOpen(false)
                }}
                className={clsx(
                  'block w-full px-3 py-1.5 text-left text-sm',
                  t === value
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
