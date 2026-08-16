import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { NotesPanel } from './NotesPanel'

// Thin modal wrapper around NotesPanel — LoadEditDrawer now renders
// NotesPanel inline as its own section instead of behind this popup, but
// kept here in case anywhere else still wants the click-to-open form.
export function NotesModal({ open, onClose, loadId, loadNumber }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Notes"
      subtitle={loadNumber ? `Load ${loadNumber}` : undefined}
      size="lg"
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <NotesPanel loadId={loadId} />
    </Modal>
  )
}
