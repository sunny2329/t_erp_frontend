import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Toggle } from '../ui/Toggle'
import { SearchSelect } from '../ui/SearchSelect'
import { Button } from '../ui/Button'
import { useData } from '../../context/DataContext'
import { blankStop } from './stopHelpers'

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

// Opens from a stop card's "Split" button — collects the shared details of a
// relay/handoff point (location, date/time, cargo, refs — same fields as
// StopCard) once. LoadEditDrawer.insertSplitAt then writes it as TWO real
// load_stops rows at that same location: a Delivery closing out the leg
// before it, and a Pickup opening the leg after it (each driver gets their
// own stop/POD record, matching how relay handoffs work in the reference
// Youngs project) — not a single row shared between two split_no groups.
export function SplitStopModal({ open, onClose, locationOptions, onAddLocation, onSubmit }) {
  const { typeOptions } = useData()
  const [form, setForm] = useState(() => blankStop('Delivery', 0, 0, true))
  const [errors, setErrors] = useState({})
  const [advancedOpen, setAdvancedOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(blankStop('Delivery', 0, 0, true))
      setErrors({})
      setAdvancedOpen(false)
    }
  }, [open])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const handleSave = () => {
    const next = {}
    if (!form.locationId) next.locationId = 'Required'
    if (!form.stopDate) next.stopDate = 'Required'
    if (Object.keys(next).length) {
      setErrors(next)
      toast.error('Please fill the required fields')
      return
    }
    onSubmit(form)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Split Load — Relay Point"
      subtitle="Creates two load_stops rows at this location: a Delivery closing the current leg and a Pickup opening the next"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Add Split</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Location / Shipper" required className="sm:col-span-3" error={errors.locationId}>
          <SearchSelect
            value={form.locationId}
            onChange={(v) => set({ locationId: v })}
            options={locationOptions}
            placeholder="Select location"
            onAddNew={() => onAddLocation((id) => set({ locationId: id }))}
            addNewLabel="Add location"
            error={errors.locationId}
          />
        </Field>

        <Field label="Stop Date" required error={errors.stopDate}>
          <Input type="date" value={form.stopDate} onChange={(e) => set({ stopDate: e.target.value })} error={errors.stopDate} />
        </Field>
        <Field label="Start Time">
          <Input type="time" value={form.startTime} onChange={(e) => set({ startTime: e.target.value })} />
        </Field>
        <Field label="End Time">
          <Input type="time" value={form.endTime} onChange={(e) => set({ endTime: e.target.value })} />
        </Field>

        <div className="flex items-center gap-6 sm:col-span-3">
          <Toggle checked={form.appointmentRequired} onChange={(v) => set({ appointmentRequired: v })} label="Appointment required" />
          <Toggle checked={form.scheduled} onChange={(v) => set({ scheduled: v })} label="Scheduled" />
        </div>

        <Field label="Qty">
          <Input type="number" value={form.qty} onChange={(e) => set({ qty: e.target.value })} />
        </Field>
        <Field label="Qty Type">
          <TypeSelect options={typeOptions[20] || []} value={form.qtyTypeId} onChange={(v) => set({ qtyTypeId: v })} />
        </Field>
        <Field label="Weight (lbs)">
          <Input type="number" value={form.weight} onChange={(e) => set({ weight: e.target.value })} />
        </Field>
        <Field label="Stop Action">
          <TypeSelect options={typeOptions[19] || []} value={form.stopActionId} onChange={(v) => set({ stopActionId: v })} />
        </Field>
        <Field label="Reefer Mode">
          <TypeSelect options={typeOptions[21] || []} value={form.reeferModeId} onChange={(v) => set({ reeferModeId: v })} />
        </Field>
        <Field label="Customer Ref">
          <Input value={form.customerRef} onChange={(e) => set({ customerRef: e.target.value })} />
        </Field>

        <Field label="Commodity" className="sm:col-span-3">
          <Input value={form.commodity} onChange={(e) => set({ commodity: e.target.value })} placeholder="Commodity description" />
        </Field>

        <Field label="Pickup #">
          <Input value={form.pickupNumber} onChange={(e) => set({ pickupNumber: e.target.value })} />
        </Field>
        <Field label="BOL #">
          <Input value={form.bolNumber} onChange={(e) => set({ bolNumber: e.target.value })} />
        </Field>
        <Field label="PO #">
          <Input value={form.poNumber} onChange={(e) => set({ poNumber: e.target.value })} />
        </Field>

        <Field label="Instructions / Location notes" className="sm:col-span-3">
          <Input value={form.instructions} onChange={(e) => set({ instructions: e.target.value })} placeholder="Dock notes, gate codes, contact..." />
        </Field>
      </div>

      <div className="mt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="flex w-full items-center justify-between py-2.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Advanced (Seal / Container / Chassis / Customer Trailer / PRO)
          {advancedOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {advancedOpen && (
          <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-3">
            <Field label="Seal #">
              <Input value={form.seal} onChange={(e) => set({ seal: e.target.value })} />
            </Field>
            <Field label="Container #">
              <Input value={form.container} onChange={(e) => set({ container: e.target.value })} />
            </Field>
            <Field label="Chassis #">
              <Input value={form.chassis} onChange={(e) => set({ chassis: e.target.value })} />
            </Field>
            <Field label="Customer Trailer #">
              <Input value={form.customerTrailer} onChange={(e) => set({ customerTrailer: e.target.value })} />
            </Field>
            <Field label="PRO #">
              <Input value={form.pro} onChange={(e) => set({ pro: e.target.value })} />
            </Field>
          </div>
        )}
      </div>
    </Modal>
  )
}
