import { badgeColor } from '../../mocks/constants'

export function Badge({ status, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${badgeColor(status)} ${className}`}
    >
      {status}
    </span>
  )
}
