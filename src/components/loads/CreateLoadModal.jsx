import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { Drawer } from '../ui/Drawer'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { Toggle } from '../ui/Toggle'
import { SearchSelect } from '../ui/SearchSelect'
import { Button } from '../ui/Button'
import { useData } from '../../context/DataContext'
import { QuickAddModal } from './QuickAddModal'
import { StopCard } from './StopCard'
import { blankLoadDetail } from '../../services/adapters'
import { blankStop, isReeferVanType } from './stopHelpers'
import { validateLoadForm } from './loadValidation'

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

function blankNewLoad() {
  return { ...blankLoadDetail(), stops: [blankStop('Pickup', 1, 1), blankStop('Delivery', 2, 1)] }
}

// Deliberately simple, single-column, plain-boxed layout — matches the
// reference Loadx-Youngs-Frontend's LoadCreateModal, which is a lighter-weight
// form than LoadDetailDrawer: no splits, no dispatch (a load can't be split
// or dispatched before it exists). Once saved, reopen it from the Loads list
// to get the full LoadEditDrawer with splits/dispatch.
export function CreateLoadModal({ open, onClose, onCreated }) {
  const { customers, customersCrud, carriers, users, terminals, locations, locationsCrud, loadsCrud, typeOptions } = useData()

  const [form, setForm] = useState(blankNewLoad())
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({ stopErrors: {} })
  const [quickAdd, setQuickAdd] = useState(null)

  useEffect(() => {
    if (!open) return
    setForm(blankNewLoad())
    setErrors({ stopErrors: {} })
  }, [open])

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    if (patch.customerId) setErrors((prev) => ({ ...prev, customerId: undefined }))
  }
  const setRate = (patch) => setForm((f) => ({ ...f, rate: { ...f.rate, ...patch } }))
  const setEquipment = (patch) => setForm((f) => ({ ...f, equipment: { ...f.equipment, ...patch } }))
  const setParties = (patch) => setForm((f) => ({ ...f, parties: { ...f.parties, ...patch } }))
  const setNotes = (patch) => setForm((f) => ({ ...f, notes: { ...f.notes, ...patch } }))

  const customerOptions = customers.filter((c) => c.active).map((c) => ({ value: c.id, label: c.name, sublabel: `${c.city}, ${c.state}` }))
  // Address included in sublabel so it's both shown under each option and
  // matched by SearchSelect's search (which filters on label + sublabel
  // together) — matches the reference Loadx-Youngs-Frontend's location
  // dropdown, which displays/searches "{name} - {street address}".
  const locationOptions = locations.map((l) => ({ value: l.id, label: l.name, sublabel: [l.address, l.city && l.state ? `${l.city}, ${l.state}` : l.city || l.state].filter(Boolean).join(' · ') }))
  const isReefer = isReeferVanType(form.equipment.vanTypeId)

  const validate = () => {
    const { errors: next, valid } = validateLoadForm(form)
    setErrors(next)
    return valid
  }

  const handleCreate = async () => {
    if (!validate()) {
      toast.error('Please fix the highlighted fields')
      return
    }
    setSaving(true)
    try {
      const created = await loadsCrud.add(form)
      toast.success('Load created')
      // Switch straight into the full editor for the load that was just
      // created — splits/dispatch/documents/etc. only make sense once a
      // load actually exists, so this is where a dispatcher would want to
      // land next anyway. onCreated hands the new id back to the parent
      // (Loads.jsx/Dashboard.jsx), which keeps the drawer open and swaps it
      // from CreateLoadModal to LoadEditDrawer (see LoadDrawer.jsx) —
      // deliberately NOT calling onClose() here, since that would close the
      // drawer instead of handing off to the edit view.
      onCreated?.(created.id)
    } catch (err) {
      toast.error(err.message || 'Failed to create load')
    } finally {
      setSaving(false)
    }
  }

  const updateStop = (id, updated) => {
    set({ stops: form.stops.map((s) => (s.id === id ? updated : s)) })
    setErrors((prev) => {
      const stopErr = prev.stopErrors?.[id]
      if (!stopErr) return prev
      const nextStopErr = { ...stopErr }
      if (updated.locationId) delete nextStopErr.locationId
      if (updated.stopDate) delete nextStopErr.stopDate
      if (updated.startTime) delete nextStopErr.startTime
      if (updated.endTime) delete nextStopErr.endTime
      if (updated.tempValue !== '' && updated.tempValue != null) delete nextStopErr.tempValue
      const nextStopErrors = { ...prev.stopErrors }
      if (Object.keys(nextStopErr).length) nextStopErrors[id] = nextStopErr
      else delete nextStopErrors[id]
      return { ...prev, stopErrors: nextStopErrors }
    })
  }
  const addStop = (type) => set({ stops: [...form.stops, blankStop(type, form.stops.length + 1, 1)] })
  const removeStop = (id) =>
    set({ stops: form.stops.filter((s) => s.id !== id).map((s, i) => ({ ...s, sequence: i + 1 })) })
  const moveStop = (index, dir) => {
    const next = [...form.stops]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    set({ stops: next.map((s, i) => ({ ...s, sequence: i + 1 })) })
  }

  // Field set matches the reference Loadx-Youngs-Frontend's inline "Add New
  // Customer" modal (LoadCreateModal.jsx lines 2982-3200): name + customer
  // type + sales agent are hard-required there, everything else optional.
  const openAddCustomer = () =>
    setQuickAdd({
      title: 'Add Customer',
      entityLabel: 'Customer',
      fields: [
        { key: 'name', label: 'Customer Name', required: true },
        { key: 'customerTypeId', label: 'Customer Type', type: 'select', required: true, options: (typeOptions[17] || []).map((o) => ({ value: o.id, label: o.label })) },
        { key: 'salesAgentId', label: 'Sales Agent', type: 'select', required: true, options: users.map((u) => ({ value: u.id, label: u.fullName })) },
        { key: 'address', label: 'Address' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
      ],
      onCreate: async (data) => {
        const created = await customersCrud.add({
          name: data.name, salesAgentId: data.salesAgentId, customerTypeId: data.customerTypeId,
          address: data.address, city: data.city, state: data.state, phone: data.phone, email: data.email,
        })
        set({ customerId: created.id })
      },
    })

  const openAddLocation = (onCreated) =>
    setQuickAdd({
      title: 'Add Location',
      entityLabel: 'Location',
      fields: [
        { key: 'name', label: 'Location Name', required: true },
        { key: 'address', label: 'Address' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'phone', label: 'Phone' },
      ],
      onCreate: async (data) => {
        const created = await locationsCrud.add({ name: data.name, address: data.address || data.city || data.name, city: data.city, state: data.state, phone: data.phone, carrierId: '' })
        onCreated(created.id)
      },
    })

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title="Create New Load"
        subtitle="Dispatch and splits become available after the load is saved"
        width="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create Load'}</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-800 dark:bg-blue-900/10">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">Load Info</h3>
            <Field label="Customer" required error={errors.customerId}>
              <SearchSelect
                value={form.customerId}
                onChange={(v) => set({ customerId: v })}
                options={customerOptions}
                placeholder="Search customer..."
                onAddNew={openAddCustomer}
                addNewLabel="Add customer"
                error={errors.customerId}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Customer Ref #" required error={errors.customerRef} hint={!errors.customerRef ? 'Same reference applied to every stop' : undefined}>
                <Input value={form.customerRef} onChange={(e) => { set({ customerRef: e.target.value }); setErrors((prev) => ({ ...prev, customerRef: undefined })) }} error={errors.customerRef} />
              </Field>
              <Field label="Commodity" className="col-span-2">
                <Input value={form.equipment.commodity} onChange={(e) => setEquipment({ commodity: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Primary Fee" required error={errors.primaryFee}>
                <Input type="number" value={form.rate.primaryFee} onChange={(e) => { setRate({ primaryFee: e.target.value }); setErrors((prev) => ({ ...prev, primaryFee: undefined })) }} placeholder="$" error={errors.primaryFee} />
              </Field>
              <Field label="Fee Type" required error={errors.feeType}>
                <TypeSelect options={typeOptions[24] || []} value={form.rate.feeTypeId} onChange={(v) => { setRate({ feeTypeId: v }); setErrors((prev) => ({ ...prev, feeType: undefined })) }} />
              </Field>
              <Field label="Tendered Miles">
                <Input type="number" value={form.rate.tenderedMiles} onChange={(e) => setRate({ tenderedMiles: e.target.value })} />
              </Field>
              <Field label="Target Rate">
                <Input type="number" value={form.rate.targetRate} onChange={(e) => setRate({ targetRate: e.target.value })} placeholder="$" />
              </Field>
              <Field label="Fuel Surcharge Type">
                <TypeSelect options={typeOptions[25] || []} value={form.rate.fuelSurchargeTypeId} onChange={(v) => setRate({ fuelSurchargeTypeId: v })} />
              </Field>
              <Field label="Fuel Surcharge Amount">
                <Input type="number" value={form.rate.fuelSurchargeAmount} onChange={(e) => setRate({ fuelSurchargeAmount: e.target.value })} />
              </Field>
              <Field label="Declared Value">
                <Input type="number" value={form.rate.declaredValue} onChange={(e) => setRate({ declaredValue: e.target.value })} placeholder="$" />
              </Field>
              <Field label="Van / Equipment Type">
                <TypeSelect options={typeOptions[7] || []} value={form.equipment.vanTypeId} onChange={(v) => setEquipment({ vanTypeId: v })} placeholder="Select equipment" />
              </Field>
              <Field label="Length (ft)">
                <Input type="number" value={form.equipment.length} onChange={(e) => setEquipment({ length: e.target.value })} />
              </Field>
              <Field label="Weight (lbs)">
                <Input type="number" value={form.equipment.weight} onChange={(e) => setEquipment({ weight: e.target.value })} />
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <Toggle checked={form.equipment.hazmat} onChange={(v) => setEquipment({ hazmat: v })} label="Hazmat" />
              {form.equipment.hazmat && (
                <Field label="Hazmat Type" className="w-56">
                  <TypeSelect options={typeOptions[28] || []} value={form.equipment.hazmatTypeId} onChange={(v) => setEquipment({ hazmatTypeId: v })} />
                </Field>
              )}
              <Toggle checked={form.equipment.tarpRequired} onChange={(v) => setEquipment({ tarpRequired: v })} label="Tarp required" />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Parties</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Booking Authority (Carrier)" required error={errors.bookingAuthority}>
                <Select value={form.parties.bookingAuthorityId} onChange={(e) => { setParties({ bookingAuthorityId: e.target.value }); setErrors((prev) => ({ ...prev, bookingAuthority: undefined })) }} error={errors.bookingAuthority}>
                  <option value="">Unassigned</option>
                  {carriers.filter((c) => c.active).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Brokerage Agent">
                <Select value={form.parties.brokerageAgentId} onChange={(e) => setParties({ brokerageAgentId: e.target.value })}>
                  <option value="">None</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Sales Agent" required error={errors.salesAgent}>
                <Select value={form.parties.salesAgentId} onChange={(e) => { setParties({ salesAgentId: e.target.value }); setErrors((prev) => ({ ...prev, salesAgent: undefined })) }} error={errors.salesAgent}>
                  <option value="">Select sales agent</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Booking Terminal">
                <Select value={form.parties.bookingTerminalId} onChange={(e) => setParties({ bookingTerminalId: e.target.value })}>
                  <option value="">Select terminal</option>
                  {terminals.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notes</h3>
            <Field label="Customer Load Notes">
              <Textarea rows={2} value={form.notes.customerLoadNotes} onChange={(e) => setNotes({ customerLoadNotes: e.target.value })} />
            </Field>
            <Field label="Dispatch Notes">
              <Textarea rows={2} value={form.notes.dispatchNotes} onChange={(e) => setNotes({ dispatchNotes: e.target.value })} />
            </Field>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Stops</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{errors.stops ? errors.stops : `${form.stops.length} stop(s)`}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => addStop('Pickup')}>
                  <Plus className="h-3.5 w-3.5" /> Add Pickup
                </Button>
                <Button size="sm" variant="secondary" onClick={() => addStop('Delivery')}>
                  <Plus className="h-3.5 w-3.5" /> Add Delivery
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {form.stops.map((stop, i) => (
                <StopCard
                  key={stop.id}
                  stop={stop}
                  index={i}
                  total={form.stops.length}
                  onChange={(updated) => updateStop(stop.id, updated)}
                  onRemove={() => removeStop(stop.id)}
                  onMoveUp={() => moveStop(i, -1)}
                  onMoveDown={() => moveStop(i, 1)}
                  locationOptions={locationOptions}
                  onAddLocation={openAddLocation}
                  headerCommodity={form.equipment.commodity}
                  isReefer={isReefer}
                  errors={errors.stopErrors?.[stop.id] || {}}
                />
              ))}
            </div>
          </div>
        </div>
      </Drawer>

      <QuickAddModal
        open={!!quickAdd}
        onClose={() => setQuickAdd(null)}
        title={quickAdd?.title}
        entityLabel={quickAdd?.entityLabel}
        fields={quickAdd?.fields}
        onCreate={(data) => quickAdd?.onCreate(data)}
      />
    </>
  )
}
