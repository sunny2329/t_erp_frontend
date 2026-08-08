import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Send } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import { rateConApi } from '../../services/erateApi'

function blankForm(loadNumber, carrierName) {
  return {
    to: '',
    cc: '',
    subject: `Rate Confirmation – Load #${loadNumber}${carrierName ? ` – ${carrierName}` : ''}`,
    message: 'Please review and confirm the rate confirmation using the link below.',
  }
}

// Mirrors the reference Loadx-Youngs-Frontend's SendErateModal: the email is
// link-only (no PDF attached) — the backend regenerates+saves a fresh Load
// Confirmation PDF for this leg and builds a public accept/reject link from
// it (see t_erp_backend/src/services/rateConSend.service.js). The carrier
// only ever sees the PDF via that public link.
export function SendRateConModal({ open, onClose, loadId, loadNumber, assignmentId, dispatchCarrierName }) {
  const [form, setForm] = useState(blankForm(loadNumber, dispatchCarrierName))
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(blankForm(loadNumber, dispatchCarrierName))
  }, [open, loadNumber, dispatchCarrierName])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const handleSend = async () => {
    if (!form.to.trim()) {
      toast.error('Recipient email is required')
      return
    }
    setSending(true)
    try {
      await rateConApi.send(loadId, {
        assignmentId,
        to: form.to.trim(),
        cc: form.cc.trim() || undefined,
        subject: form.subject,
        message: form.message,
      })
      toast.success('Rate confirmation sent')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to send rate confirmation')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send Rate Confirmation"
      subtitle={loadNumber ? `Load ${loadNumber}` : undefined}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending}>
            <Send className="h-3.5 w-3.5" /> {sending ? 'Sending…' : 'Send'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="To" required>
          <Input type="email" value={form.to} onChange={(e) => set({ to: e.target.value })} placeholder="carrier@example.com" />
        </Field>
        <Field label="CC" hint="Optional, comma-separated">
          <Input value={form.cc} onChange={(e) => set({ cc: e.target.value })} placeholder="dispatcher@example.com" />
        </Field>
        <Field label="Subject">
          <Input value={form.subject} onChange={(e) => set({ subject: e.target.value })} />
        </Field>
        <Field label="Message" hint="A link to the public rate-confirmation page is appended automatically">
          <Textarea rows={4} value={form.message} onChange={(e) => set({ message: e.target.value })} />
        </Field>
      </div>
    </Modal>
  )
}
