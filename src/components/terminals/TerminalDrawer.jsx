import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Drawer } from '../ui/Drawer'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { PhoneInput } from '../ui/PhoneInput'
import { AddressAutocomplete } from '../ui/AddressAutocomplete'
import { Toggle } from '../ui/Toggle'
import { Button } from '../ui/Button'
import { Section } from '../ui/Section'
import { terminalsApi } from '../../services/masterApi'
import { terminalDetailAdapter, blankTerminalDetail } from '../../services/adapters'

// Full terminal master, mirroring the legacy ss_save_terminal save shape —
// see terminalDetailAdapter in services/adapters.js for field notes.
function Grid({ children }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
}

export function TerminalDrawer({ open, onClose, terminalId, onSaved }) {
  const [form, setForm] = useState(blankTerminalDetail())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (terminalId) {
      setLoading(true)
      terminalsApi
        .getById(terminalId)
        .then((row) => setForm(terminalDetailAdapter.fromApi(row)))
        .catch((err) => toast.error(err.message || 'Failed to load terminal'))
        .finally(() => setLoading(false))
    } else {
      setForm(blankTerminalDetail())
    }
  }, [open, terminalId])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Terminal code and name are required')
      return
    }
    setSaving(true)
    try {
      const payload = terminalDetailAdapter.toApi(form)
      if (terminalId) {
        await terminalsApi.update(terminalId, payload)
        toast.success('Terminal updated')
      } else {
        await terminalsApi.create(payload)
        toast.success('Terminal created')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to save terminal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={terminalId ? `Edit Terminal${form.name ? ' — ' + form.name : ''}` : 'Add Terminal'}
      subtitle="Full terminal master"
      width="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading}>{saving ? 'Saving…' : 'Save Terminal'}</Button>
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-slate-400">Loading terminal…</div>
      ) : (
        <div className="space-y-5">
          <Section title="Basic Info">
            <Grid>
              <Field label="Code" required>
                <Input value={form.code} onChange={(e) => set({ code: e.target.value })} placeholder="e.g., CHI" />
              </Field>
              <Field label="Name" required>
                <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label="External Code">
                <Input value={form.extCode} onChange={(e) => set({ extCode: e.target.value })} />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <AddressAutocomplete
                  value={form.address}
                  onChange={(v) => set({ address: v })}
                  onSelect={(place) => set({ address: place.address, city: place.city, state: place.state })}
                />
              </Field>
              <Field label="City">
                <Input value={form.city} onChange={(e) => set({ city: e.target.value })} />
              </Field>
              <Field label="State">
                <Input value={form.state} onChange={(e) => set({ state: e.target.value })} />
              </Field>
              <Field label="Country">
                <Input value={form.country} onChange={(e) => set({ country: e.target.value })} />
              </Field>
            </Grid>
            <div className="mt-3">
              <Toggle checked={form.active} onChange={(v) => set({ active: v })} label="Active" />
            </div>
          </Section>

          <Section title="Contact">
            <Grid>
              <Field label="Contact Person" className="sm:col-span-2">
                <Input value={form.contactPerson} onChange={(e) => set({ contactPerson: e.target.value })} />
              </Field>
              <Field label="Phone" hint="Digits only, stored as a number">
                <PhoneInput value={form.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} />
              </Field>
            </Grid>
          </Section>
        </div>
      )}
    </Drawer>
  )
}
