import clsx from 'clsx'

const LOCALE_LOCKED_TYPES = ['date', 'datetime-local', 'month', 'week']

export function Input({ error, className = '', ...props }) {
  return (
    <input
      // Chrome/Edge render the native date/time picker's text using the
      // input's effective language, not the OS locale — pin it to en-US so
      // every date field in the app reads mm/dd/yyyy regardless of the
      // machine's locale settings.
      lang={LOCALE_LOCKED_TYPES.includes(props.type) ? 'en-US' : undefined}
      className={clsx(
        'w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:ring-1 focus:ring-brand-500',
        error
          ? 'border-red-400 focus:border-red-500'
          : 'border-slate-300 focus:border-brand-500',
        'dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:border-brand-500 dark:placeholder:text-slate-500',
        props.disabled && 'opacity-60 cursor-not-allowed',
        className,
      )}
      {...props}
    />
  )
}
