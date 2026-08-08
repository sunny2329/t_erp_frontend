import clsx from 'clsx'

export function Input({ error, className = '', ...props }) {
  return (
    <input
      className={clsx(
        'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-brand-500/30',
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
