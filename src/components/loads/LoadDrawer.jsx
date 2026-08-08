import { CreateLoadModal } from './CreateLoadModal'
import { LoadEditDrawer } from './LoadEditDrawer'

// Thin switcher so existing call sites (Loads.jsx, Dispatch.jsx) don't need
// to know which component they want — matches the reference
// Loadx-Youngs-Frontend's split between LoadCreateModal (simple, no splits/
// dispatch — a load can't be split or dispatched before it exists) and
// LoadDetailDrawer (full editor: splits, Dispatch Load, Broker Dispatch).
export function LoadDrawer({ open, onClose, loadId }) {
  if (!open) return null
  return loadId
    ? <LoadEditDrawer open={open} onClose={onClose} loadId={loadId} />
    : <CreateLoadModal open={open} onClose={onClose} />
}
