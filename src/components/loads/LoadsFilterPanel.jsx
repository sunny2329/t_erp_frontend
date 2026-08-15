import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Drawer } from '../ui/Drawer'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { SearchSelect } from '../ui/SearchSelect'
import { Button } from '../ui/Button'

export function defaultLoadsFilters() {
  return {
    createdFromDate: '',
    createdToDate: '',
    pickupFromDate: '',
    pickupToDate: '',
    deliveryFromDate: '',
    deliveryToDate: '',
    pickupNo: '',
    poNo: '',
    bolNo: '',
    driverId: '',
    vehicleId: '',
    trailerId: '',
    carrierId: '',
    pickupState: '',
    deliveryState: '',
  }
}

export function hasActiveLoadsFilters(filters) {
  const base = defaultLoadsFilters()
  return Object.keys(base).some((key) => String(filters[key] ?? '') !== String(base[key] ?? ''))
}

// Mirrors the reference Loadx-Youngs-Frontend Dashboard's "Load filters"
// slide-over: date range filters (created/pickup/delivery, each independent
// so they can be combined) + pickup/PO/BOL number text filters +
// driver/vehicle/trailer/carrier/pickup-state/delivery-state searchable
// selects, with a draft-then-apply pattern (editing fields here doesn't
// affect the table until "Apply filters"). Unlike the reference, this
// filters the already in-memory `loads` array client-side rather than
// refetching — t_erp's DataContext already loads every load up front
// (pageSize=-1), so there's no server round trip to make. Driver/vehicle/
// trailer/carrier options are the full master lists from DataContext,
// matching the reference's behavior; state options are derived from the
// distinct values actually present on `locations` since location.state is
// free text (no fixed enum), not a hardcoded US-states list that could
// mismatch stored values.
export function LoadsFilterPanel({ open, onClose, appliedFilters, onApply, onClear, drivers, vehicles, trailers, carriers, locations }) {
  const [draft, setDraft] = useState(appliedFilters)

  useEffect(() => {
    if (open) setDraft(appliedFilters)
  }, [open, appliedFilters])

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))

  const driverOptions = drivers.map((d) => ({ value: d.id, label: `${d.firstName} ${d.lastName}`.trim() }))
  const vehicleOptions = vehicles.map((v) => ({ value: v.id, label: v.regNumber }))
  const trailerOptions = trailers.map((t) => ({ value: t.id, label: t.name }))
  const carrierOptions = carriers.map((c) => ({ value: c.id, label: c.name }))
  const stateOptions = useMemo(() => {
    const states = [...new Set(locations.map((l) => l.state).filter(Boolean))].sort()
    return states.map((s) => ({ value: s, label: s }))
  }, [locations])

  const handleApply = () => {
    if (draft.createdFromDate && draft.createdToDate && draft.createdFromDate > draft.createdToDate) {
      toast.error('Created "from date" must be on or before "to date"')
      return
    }
    if (draft.pickupFromDate && draft.pickupToDate && draft.pickupFromDate > draft.pickupToDate) {
      toast.error('Pickup "from date" must be on or before "to date"')
      return
    }
    if (draft.deliveryFromDate && draft.deliveryToDate && draft.deliveryFromDate > draft.deliveryToDate) {
      toast.error('Delivery "from date" must be on or before "to date"')
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
        <Field label="Created On" hint="Date range">
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={draft.createdFromDate} onChange={(e) => set({ createdFromDate: e.target.value })} placeholder="From" />
            <Input type="date" value={draft.createdToDate} onChange={(e) => set({ createdToDate: e.target.value })} placeholder="To" />
          </div>
        </Field>
        <Field label="Pickup Date" hint="Date range">
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={draft.pickupFromDate} onChange={(e) => set({ pickupFromDate: e.target.value })} placeholder="From" />
            <Input type="date" value={draft.pickupToDate} onChange={(e) => set({ pickupToDate: e.target.value })} placeholder="To" />
          </div>
        </Field>
        <Field label="Delivery Date" hint="Date range">
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={draft.deliveryFromDate} onChange={(e) => set({ deliveryFromDate: e.target.value })} placeholder="From" />
            <Input type="date" value={draft.deliveryToDate} onChange={(e) => set({ deliveryToDate: e.target.value })} placeholder="To" />
          </div>
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

        <Field label="Pickup State">
          <SearchSelect value={draft.pickupState} onChange={(v) => set({ pickupState: v })} options={stateOptions} placeholder="All States" />
        </Field>
        <Field label="Delivery State">
          <SearchSelect value={draft.deliveryState} onChange={(v) => set({ deliveryState: v })} options={stateOptions} placeholder="All States" />
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
