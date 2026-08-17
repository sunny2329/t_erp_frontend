import clsx from 'clsx'

export function Textarea({ error, className = '', ...props }) {
  return (
    <textarea
      className={clsx(
        'w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:ring-1 focus:ring-brand-500',
        error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-brand-500',
        'dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:border-brand-500 dark:placeholder:text-slate-500',
        className,
      )}
      {...props}
    />
  )
}
