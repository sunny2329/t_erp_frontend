import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Drawer } from '../ui/Drawer'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { PhoneInput } from '../ui/PhoneInput'
import { AddressAutocomplete } from '../ui/AddressAutocomplete'
import { Textarea } from '../ui/Textarea'
import { Toggle } from '../ui/Toggle'
import { Button } from '../ui/Button'
import { Section } from '../ui/Section'
import { locationsApi } from '../../services/masterApi'
import { locationDetailAdapter, blankLocationDetail } from '../../services/adapters'

// Full location master, mirroring the legacy ss_save_locations save shape —
// see locationDetailAdapter in services/adapters.js for field notes.
function Grid({ children }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
}

export function LocationDrawer({ open, onClose, locationId, onSaved }) {
  const [form, setForm] = useState(blankLocationDetail())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (locationId) {
      setLoading(true)
      locationsApi
        .getById(locationId)
        .then((row) => setForm(locationDetailAdapter.fromApi(row)))
        .catch((err) => toast.error(err.message || 'Failed to load location'))
        .finally(() => setLoading(false))
    } else {
      setForm(blankLocationDetail())
    }
  }, [open, locationId])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      toast.error('Location name and address are required')
      return
    }
    setSaving(true)
    try {
      const payload = locationDetailAdapter.toApi(form)
      if (locationId) {
        await locationsApi.update(locationId, payload)
        toast.success('Location updated')
      } else {
        await locationsApi.create(payload)
        toast.success('Location created')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to save location')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={locationId ? `Edit Location${form.name ? ' — ' + form.name : ''}` : 'Add Location'}
      subtitle="Full location master"
      width="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading}>{saving ? 'Saving…' : 'Save Location'}</Button>
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-slate-400">Loading location…</div>
      ) : (
        <div className="space-y-5">
          <Section title="Basic Info">
            <Grid>
              <Field label="Location Name" required className="sm:col-span-2">
                <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label="Address" required className="sm:col-span-2">
                <AddressAutocomplete
                  value={form.address}
                  onChange={(v) => set({ address: v })}
                  onSelect={(place) => set({ address: place.address, city: place.city, state: place.state, zipCode: place.zipCode, country: place.country || form.country })}
                />
              </Field>
              <Field label="Address Line 2" className="sm:col-span-2">
                <Input value={form.address2} onChange={(e) => set({ address2: e.target.value })} />
              </Field>
              <Field label="City">
                <Input value={form.city} onChange={(e) => set({ city: e.target.value })} />
              </Field>
              <Field label="State">
                <Input value={form.state} onChange={(e) => set({ state: e.target.value })} />
              </Field>
              <Field label="Zip Code">
                <Input value={form.zipCode} onChange={(e) => set({ zipCode: e.target.value })} />
              </Field>
              <Field label="Country">
                <Input value={form.country} onChange={(e) => set({ country: e.target.value })} />
              </Field>
            </Grid>
            <div className="mt-3 flex flex-wrap gap-6">
              <Toggle checked={form.isLocalTerminal} onChange={(v) => set({ isLocalTerminal: v })} label="Local terminal" />
              <Toggle checked={form.status} onChange={(v) => set({ status: v })} label="Active" />
            </div>
          </Section>

          <Section title="Contact">
            <Grid>
              <Field label="Contact Person" className="sm:col-span-2">
                <Input value={form.contactPerson} onChange={(e) => set({ contactPerson: e.target.value })} />
              </Field>
              <Field label="Phone">
                <PhoneInput value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
              </Field>
              <Field label="Phone Ext">
                <Input value={form.phoneExt} onChange={(e) => set({ phoneExt: e.target.value })} />
              </Field>
              <Field label="Fax">
                <Input value={form.fax} onChange={(e) => set({ fax: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
              </Field>
              <Field label="Website" className="sm:col-span-2">
                <Input value={form.website} onChange={(e) => set({ website: e.target.value })} />
              </Field>
            </Grid>
          </Section>

          <Section title="Notes">
            <Textarea rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
          </Section>
        </div>
      )}
    </Drawer>
  )
}
