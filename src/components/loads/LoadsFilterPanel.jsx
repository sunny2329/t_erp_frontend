import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Drawer } from '../ui/Drawer'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { SearchSelect } from '../ui/SearchSelect'
import { Button } from '../ui/Button'

export function defaultLoadsFilters() {
  return {
    fromDate: '',
    toDate: '',
    dateType: 'add', // 'add' | 'pickup' | 'delivery' — which date the range filters against
    pickupNo: '',
    poNo: '',
    bolNo: '',
    driverId: '',
    vehicleId: '',
    trailerId: '',
    carrierId: '',
  }
}

export function hasActiveLoadsFilters(filters) {
  const base = defaultLoadsFilters()
  return Object.keys(base).some((key) => String(filters[key] ?? '') !== String(base[key] ?? ''))
}

// Mirrors the reference Loadx-Youngs-Frontend Dashboard's "Load filters"
// slide-over: date range + date-type selector + pickup/PO/BOL number text
// filters + driver/vehicle/trailer/carrier searchable selects, with a
// draft-then-apply pattern (editing fields here doesn't affect the table
// until "Apply filters"). Unlike the reference, this filters the already
// in-memory `loads` array client-side rather than refetching — t_erp's
// DataContext already loads every load up front (pageSize=-1), so there's
// no server round trip to make. Dropdown options are the full master lists
// from DataContext, not derived from currently-visible loads, matching the
// reference's behavior.
export function LoadsFilterPanel({ open, onClose, appliedFilters, onApply, onClear, drivers, vehicles, trailers, carriers }) {
  const [draft, setDraft] = useState(appliedFilters)

  useEffect(() => {
    if (open) setDraft(appliedFilters)
  }, [open, appliedFilters])

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))

  const driverOptions = drivers.map((d) => ({ value: d.id, label: `${d.firstName} ${d.lastName}`.trim() }))
  const vehicleOptions = vehicles.map((v) => ({ value: v.id, label: v.regNumber }))
  const trailerOptions = trailers.map((t) => ({ value: t.id, label: t.name }))
  const carrierOptions = carriers.map((c) => ({ value: c.id, label: c.name }))

  const handleApply = () => {
    if (draft.fromDate && draft.toDate && draft.fromDate > draft.toDate) {
      toast.error('From date must be on or before to date')
      return
    }
    onApply(draft)
  }

  const handleClear = () => {
    const base = defaultLoadsFilters()
    setDraft(base)
    onClear(base)
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Load Filters"
      width="max-w-sm"
      footer={
        <>
          <Button variant="ghost" onClick={handleClear}>Clear</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleApply}>Apply filters</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="From date">
            <Input type="date" value={draft.fromDate} onChange={(e) => set({ fromDate: e.target.value })} />
          </Field>
          <Field label="To date">
            <Input type="date" value={draft.toDate} onChange={(e) => set({ toDate: e.target.value })} />
          </Field>
        </div>
        <Field label="Date type" hint="Which date the range above filters against">
          <Select value={draft.dateType} onChange={(e) => set({ dateType: e.target.value })}>
            <option value="add">Created On</option>
            <option value="pickup">Pickup Date</option>
            <option value="delivery">Delivery Date</option>
          </Select>
        </Field>

        <Field label="Pickup #">
          <Input value={draft.pickupNo} onChange={(e) => set({ pickupNo: e.target.value })} />
        </Field>
        <Field label="PO #">
          <Input value={draft.poNo} onChange={(e) => set({ poNo: e.target.value })} />
        </Field>
        <Field label="BOL #">
          <Input value={draft.bolNo} onChange={(e) => set({ bolNo: e.target.value })} />
        </Field>

        <Field label="Driver">
          <SearchSelect value={draft.driverId} onChange={(v) => set({ driverId: v })} options={driverOptions} placeholder="All Drivers" />
        </Field>
        <Field label="Vehicle">
          <SearchSelect value={draft.vehicleId} onChange={(v) => set({ vehicleId: v })} options={vehicleOptions} placeholder="All Vehicles" />
        </Field>
        <Field label="Trailer">
          <SearchSelect value={draft.trailerId} onChange={(v) => set({ trailerId: v })} options={trailerOptions} placeholder="All Trailers" />
        </Field>
        <Field label="Carrier">
          <SearchSelect value={draft.carrierId} onChange={(v) => set({ carrierId: v })} options={carrierOptions} placeholder="All Carriers" />
        </Field>
      </div>
    </Drawer>
  )
}
