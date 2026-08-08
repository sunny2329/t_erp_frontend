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
import { customersApi } from '../../services/masterApi'
import { customerDetailAdapter, blankCustomerDetail } from '../../services/adapters'
import { useData } from '../../context/DataContext'

// Full customer master, mirroring the legacy ss_save_customer save shape —
// see customerDetailAdapter in services/adapters.js for exactly which fields
// were deliberately left out (carrier_id, customer_contacts/billing) and why.
function Grid({ children }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
}

export function CustomerDrawer({ open, onClose, customerId, onSaved }) {
  const { carriers, users, typeOptions } = useData()
  const [form, setForm] = useState(blankCustomerDetail())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (customerId) {
      setLoading(true)
      customersApi
        .getById(customerId)
        .then((row) => setForm(customerDetailAdapter.fromApi(row)))
        .catch((err) => toast.error(err.message || 'Failed to load customer'))
        .finally(() => setLoading(false))
    } else {
      setForm(blankCustomerDetail())
    }
  }, [open, customerId])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Customer name is required')
      return
    }
    setSaving(true)
    try {
      const payload = customerDetailAdapter.toApi(form)
      if (customerId) {
        await customersApi.update(customerId, payload)
        toast.success('Customer updated')
      } else {
        await customersApi.create(payload)
        toast.success('Customer created')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to save customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={customerId ? `Edit Customer${form.name ? ' — ' + form.name : ''}` : 'Add Customer'}
      subtitle="Full customer master"
      width="max-w-3xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading}>{saving ? 'Saving…' : 'Save Customer'}</Button>
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-slate-400">Loading customer…</div>
      ) : (
        <div className="space-y-5">
          <Section title="Basic Info">
            <Grid>
              <Field label="Customer Name" required className="sm:col-span-2">
                <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label="Customer Code">
                <Input value={form.customerCode} onChange={(e) => set({ customerCode: e.target.value })} />
              </Field>
              <Field label="DBA Name">
                <Input value={form.dbaName} onChange={(e) => set({ dbaName: e.target.value })} />
              </Field>
              <Field label="Carrier">
                <Select value={form.transCarrierId} onChange={(e) => set({ transCarrierId: e.target.value })}>
                  <option value="">Select carrier</option>
                  {carriers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Sales Agent">
                <Select value={form.salesAgentId} onChange={(e) => set({ salesAgentId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Customer Type">
                <Select value={form.customerTypeId} onChange={(e) => set({ customerTypeId: e.target.value })}>
                  <option value="">Select type</option>
                  {(typeOptions[17] || []).map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="MC Number">
                <Input value={form.mc} onChange={(e) => set({ mc: e.target.value })} />
              </Field>
              <Field label="DOT Number">
                <Input value={form.dot} onChange={(e) => set({ dot: e.target.value })} />
              </Field>
              <Field label="Federal Tax ID">
                <Input value={form.fedTaxId} onChange={(e) => set({ fedTaxId: e.target.value })} />
              </Field>
            </Grid>
          </Section>

          <Section title="Contact">
            <Grid>
              <Field label="Contact Person" className="sm:col-span-2">
                <Input value={form.contactPerson} onChange={(e) => set({ contactPerson: e.target.value })} />
              </Field>
              <Field label="Phone" hint="Digits only, stored as a number">
                <Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
              </Field>
              <Field label="Fax" hint="Digits only, stored as a number">
                <Input value={form.fax} onChange={(e) => set({ fax: e.target.value })} />
              </Field>
              <Field label="Website">
                <Input value={form.website} onChange={(e) => set({ website: e.target.value })} />
              </Field>
              <Field label="Dispatch Contact" className="sm:col-span-2">
                <Input value={form.dispatchContact} onChange={(e) => set({ dispatchContact: e.target.value })} />
              </Field>
            </Grid>
          </Section>

          <Section title="Location">
            <Grid>
              <Field label="Address" className="sm:col-span-2">
                <Input value={form.address} onChange={(e) => set({ address: e.target.value })} />
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
          </Section>

          <Section title="Factoring / Accounts">
            <Grid>
              <Field label="Factoring ID">
                <Input value={form.factoringId} onChange={(e) => set({ factoringId: e.target.value })} />
              </Field>
              <Field label="TAFS Debtor Name">
                <Input value={form.tafsDebtorName} onChange={(e) => set({ tafsDebtorName: e.target.value })} />
              </Field>
              <Field label="Apex Company Name">
                <Input value={form.apexCompanyName} onChange={(e) => set({ apexCompanyName: e.target.value })} />
              </Field>
            </Grid>
          </Section>

          <Section title="Notes & Flags">
            <Grid>
              <Field label="Customer Since">
                <Input type="date" value={form.customerSince} onChange={(e) => set({ customerSince: e.target.value })} />
              </Field>
            </Grid>
            <div className="mt-3 flex flex-wrap gap-6">
              <Toggle checked={form.isAppointmentReq} onChange={(v) => set({ isAppointmentReq: v })} label="Appointment required" />
              <Toggle checked={form.isTrailerPool} onChange={(v) => set({ isTrailerPool: v })} label="Trailer pool" />
            </div>
            <Field label="Load Notes" className="mt-3">
              <Textarea rows={2} value={form.customerLoadNotes} onChange={(e) => set({ customerLoadNotes: e.target.value })} />
            </Field>
            <Field label="Customer Notes" className="mt-3">
              <Textarea rows={2} value={form.customerNotes} onChange={(e) => set({ customerNotes: e.target.value })} />
            </Field>
          </Section>
        </div>
      )}
    </Drawer>
  )
}
