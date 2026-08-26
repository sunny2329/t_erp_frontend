import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Modal } from '../ui/Modal'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { PhoneInput } from '../ui/PhoneInput'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { AddressAutocomplete } from '../ui/AddressAutocomplete'

const defaultFields = (entityLabel) => [
  { key: 'name', label: `${entityLabel} name`, required: true },
  { key: 'city', label: 'City' },
]

// Generic quick-add modal driven by a `fields` config (see openAddCustomer/
// openAddLocation in CreateLoadModal.jsx and LoadEditDrawer.jsx) — matches
// the reference Loadx-Youngs-Frontend's inline "+ Add Customer"/"+ Add
// Location" modals launched from the Load form: a lighter subset of the
// full Masters record, with only the fields the reference itself treats as
// required (e.g. customer type + sales agent for a customer) blocking
// submit. Full details can always be filled in later from Masters.
export function QuickAddModal({ open, onClose, title, entityLabel, fields, onCreate }) {
  const activeFields = fields || defaultFields(entityLabel || 'Item')
  const [data, setData] = useState({})
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setData({})
      setErrors({})
    }
  }, [open])

  const set = (key, value) => {
    setData((d) => ({ ...d, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  // Autofills city/state/zip/country from an AddressAutocomplete pick —
  // harmless no-op for any key the current field config doesn't declare,
  // since handleCreate only reads keys listed in activeFields.
  const applyPlace = (addressKey, place) => {
    setData((d) => ({
      ...d,
      [addressKey]: place.address || d[addressKey],
      city: place.city,
      state: place.state,
      zipCode: place.zipCode,
      country: place.country,
    }))
    setErrors((e) => ({ ...e, [addressKey]: undefined, city: undefined, state: undefined, zipCode: undefined }))
  }

  const handleCreate = async () => {
    const nextErrors = {}
    activeFields.forEach((f) => {
      if (f.required && !String(data[f.key] || '').trim()) nextErrors[f.key] = 'Required'
    })
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    setSubmitting(true)
    try {
      const trimmed = {}
      activeFields.forEach((f) => {
        const v = data[f.key]
        trimmed[f.key] = typeof v === 'string' ? v.trim() : v || ''
      })
      await onCreate(trimmed)
      toast.success(`${entityLabel} added`)
      onClose()
    } catch (err) {
      toast.error(err.message || `Failed to add ${entityLabel.toLowerCase()}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle="Quick add — full details can be edited later from Masters"
      size={activeFields.length > 3 ? 'lg' : 'md'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleCreate} disabled={submitting}>{submitting ? 'Adding…' : `Add ${entityLabel}`}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {activeFields.map((f, i) => (
          <Field
            key={f.key}
            label={f.label}
            required={f.required}
            error={errors[f.key]}
            className={f.fullWidth ? 'sm:col-span-2' : undefined}
          >
            {f.type === 'select' ? (
              <Select value={data[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} autoFocus={i === 0}>
                <option value="">{f.placeholder || 'Select…'}</option>
                {(f.options || []).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            ) : f.type === 'address' ? (
              <AddressAutocomplete
                value={data[f.key] || ''}
                onChange={(v) => set(f.key, v)}
                onSelect={(place) => applyPlace(f.key, place)}
                placeholder={f.placeholder}
              />
            ) : f.type === 'phone' ? (
              <PhoneInput value={data[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} autoFocus={i === 0} />
            ) : (
              <Input
                value={data[f.key] || ''}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                autoFocus={i === 0}
              />
            )}
          </Field>
        ))}
      </div>
    </Modal>
  )
}
