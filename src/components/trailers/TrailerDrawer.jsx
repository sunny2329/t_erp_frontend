import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Drawer } from '../ui/Drawer'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { Toggle } from '../ui/Toggle'
import { Button } from '../ui/Button'
import { Section } from '../ui/Section'
import { trailersApi } from '../../services/masterApi'
import { trailerDetailAdapter, blankTrailerDetail } from '../../services/adapters'
import { useData } from '../../context/DataContext'

function Grid({ children }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
}

function TypeSelect({ options, value, onChange, placeholder = 'Select…' }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.label}</option>
      ))}
    </Select>
  )
}

// Full trailer master, mirroring the legacy ss_save_trailer save shape — see
// trailerDetailAdapter in services/adapters.js for exactly which fields were
// left out (license_state_id, fleet_group_id) and why.
export function TrailerDrawer({ open, onClose, trailerId, onSaved }) {
  const { carriers, terminals, typeOptions } = useData()
  const [form, setForm] = useState(blankTrailerDetail())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (trailerId) {
      setLoading(true)
      trailersApi
        .getById(trailerId)
        .then((row) => setForm(trailerDetailAdapter.fromApi(row)))
        .catch((err) => toast.error(err.message || 'Failed to load trailer'))
        .finally(() => setLoading(false))
    } else {
      setForm(blankTrailerDetail())
    }
  }, [open, trailerId])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Trailer name is required')
      return
    }
    setSaving(true)
    try {
      const payload = trailerDetailAdapter.toApi(form)
      if (trailerId) {
        await trailersApi.update(trailerId, payload)
        toast.success('Trailer updated')
      } else {
        await trailersApi.create(payload)
        toast.success('Trailer created')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to save trailer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={trailerId ? `Edit Trailer${form.name ? ' — ' + form.name : ''}` : 'Add Trailer'}
      subtitle="Full trailer master"
      width="max-w-3xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading}>{saving ? 'Saving…' : 'Save Trailer'}</Button>
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-slate-400">Loading trailer…</div>
      ) : (
        <div className="space-y-5">
          <Section title="Basic Info">
            <Grid>
              <Field label="Trailer Name" required>
                <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g., TRAIL-0001" />
              </Field>
              <Field label="Trailer Type">
                <TypeSelect options={typeOptions[7] || []} value={form.trailerTypeId} onChange={(v) => set({ trailerTypeId: v })} placeholder="Select type" />
              </Field>
              <Field label="Contract Type">
                <TypeSelect options={typeOptions[6] || []} value={form.contractTypeId} onChange={(v) => set({ contractTypeId: v })} placeholder="Select contract type" />
              </Field>
              <Field label="Carrier">
                <Select value={form.carrierId} onChange={(e) => set({ carrierId: e.target.value })}>
                  <option value="">Select carrier</option>
                  {carriers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Length (ft)">
                <Input type="number" step="0.1" value={form.length} onChange={(e) => set({ length: e.target.value })} />
              </Field>
              <Field label="Height (ft)">
                <Input type="number" step="0.1" value={form.height} onChange={(e) => set({ height: e.target.value })} />
              </Field>
              <Field label="Terminal">
                <Select value={form.terminalId} onChange={(e) => set({ terminalId: e.target.value })}>
                  <option value="">Select terminal</option>
                  {terminals.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Trailer Status">
                <TypeSelect options={typeOptions[14] || []} value={form.trailerStatusId} onChange={(v) => set({ trailerStatusId: v })} placeholder="Select status" />
              </Field>
              <Field label="In Service From">
                <Input type="date" value={form.inServiceFrom} onChange={(e) => set({ inServiceFrom: e.target.value })} />
              </Field>
              <Field label="Monthly Cost">
                <Input type="number" step="0.01" value={form.monthlyCost} onChange={(e) => set({ monthlyCost: e.target.value })} />
              </Field>
            </Grid>
            <div className="mt-3">
              <Toggle checked={form.active} onChange={(v) => set({ active: v })} label="Active" />
            </div>
          </Section>

          <Section title="Vehicle Info">
            <Grid>
              <Field label="Make">
                <Input value={form.make} onChange={(e) => set({ make: e.target.value })} placeholder="e.g., Wabash" />
              </Field>
              <Field label="Model">
                <Input value={form.model} onChange={(e) => set({ model: e.target.value })} placeholder="e.g., Quad Axle" />
              </Field>
              <Field label="Make Year">
                <Input type="number" value={form.makeYear} onChange={(e) => set({ makeYear: e.target.value })} placeholder="2020" />
              </Field>
              <Field label="VIN">
                <Input value={form.vin} onChange={(e) => set({ vin: e.target.value })} />
              </Field>
            </Grid>
          </Section>

          <Section title="License & Registration">
            <Grid>
              <Field label="License Number">
                <Input value={form.licenseNumber} onChange={(e) => set({ licenseNumber: e.target.value })} placeholder="CA 123456" />
              </Field>
              <Field label="Registration Number">
                <Input value={form.registrationNumber} onChange={(e) => set({ registrationNumber: e.target.value })} placeholder="REG-00001" />
              </Field>
              <Field label="License Expiration">
                <Input type="date" value={form.licenseExp} onChange={(e) => set({ licenseExp: e.target.value })} />
              </Field>
              <Field label="Inspection Expiration">
                <Input type="date" value={form.inspectionExp} onChange={(e) => set({ inspectionExp: e.target.value })} />
              </Field>
            </Grid>
          </Section>

          <Section title="Lease Info">
            <Grid>
              <Field label="Lease Start Date">
                <Input type="date" value={form.leaseStartDate} onChange={(e) => set({ leaseStartDate: e.target.value })} />
              </Field>
              <Field label="Lease End Date">
                <Input type="date" value={form.leaseEndDate} onChange={(e) => set({ leaseEndDate: e.target.value })} />
              </Field>
            </Grid>
          </Section>

          <Section title="Reference Info">
            <Grid>
              <Field label="Source Reference">
                <Input value={form.sourceReference} onChange={(e) => set({ sourceReference: e.target.value })} placeholder="External reference" />
              </Field>
              <Field label="Integration ID">
                <Input value={form.integrationId} onChange={(e) => set({ integrationId: e.target.value })} placeholder="System integration ID" />
              </Field>
            </Grid>
            <Field label="Notes" className="mt-3">
              <Textarea rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
            </Field>
          </Section>
        </div>
      )}
    </Drawer>
  )
}
