import { badgeColor } from '../../mocks/constants'

export function Badge({ status, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap ${badgeColor(status)} ${className}`}
    >
      {status}
    </span>
  )
}
