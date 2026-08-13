import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Modal } from '../ui/Modal'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Section } from '../ui/Section'
import { useData } from '../../context/DataContext'
import { loadAssignmentsApi, driverVehicleMappingApi } from '../../services/dispatchApi'
import { assignmentDetailAdapter } from '../../services/adapters'

const CONFLICT_ASSET_LABEL = { vehicle: 'Vehicle', trailer: 'Trailer', driver: 'Driver' }
function formatConflictMessage(conflicts) {
  return conflicts
    .map((c) => `${CONFLICT_ASSET_LABEL[c.type]} ${c.label} is currently ${c.status} on Load ${c.loadNumber}.`)
    .join('\n')
}

// type_master(type_id=46) — confirmed live: 5 = "In Transit", 13 = "Completed".
const TRACKING_STATUS = { IN_TRANSIT: '5', COMPLETED: '13' }

function blankForm() {
  return {
    carrierId: '', vehicleId: '', driverId1: '', driverId2: '', trailerId: '', dispatcherId: '',
    dispatchStartDt: '', dispatchEndDt: '', trackingStatusId: '1',
    completeDt: '', completeOutDt: '',
  }
}

// Dispatches a company/managed-authority carrier for one split group.
// splitNo identifies which group of load_stops (load_stops.split_no) this
// leg covers — the backend derives load_stop_id/stop_points from whichever
// stops currently carry that split_no, so this modal never needs to know
// about individual stop ids.
export function CompanyDispatchModal({ open, onClose, loadId, leg, splitNo, onSaved }) {
  const { carriers, vehicles, drivers, trailers, users, typeOptions } = useData()
  const [form, setForm] = useState(blankForm())
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [conflictConfirm, setConflictConfirm] = useState(null)

  useEffect(() => {
    if (!open) return
    // `leg` (when editing) is already the camelCase shape produced by
    // loadDetailAdapter.fromApi's assignments mapping (assignmentFromApi) —
    // it must NOT be re-passed through assignmentDetailAdapter.fromApi
    // (=== assignmentFromApi), which expects raw snake_case DB columns.
    // Doing that a second time silently read every field as undefined
    // (row.dispatch_carrier_id on an object that only has .carrierId), so
    // the edit form loaded completely blank — merging leg directly onto
    // blankForm() is the fix.
    setForm(leg ? { ...blankForm(), ...leg } : blankForm())
    setErrors({})
  }, [open, leg])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  // Dispatch/scheduling conflict check — matches the reference
  // Loadx-Youngs-Frontend's DispatchLoadModal: is this driver/vehicle/
  // trailer already Scheduled or In Transit on a DIFFERENT load right now?
  // A live, non-blocking info toast fires as soon as Vehicle/Driver 1/
  // Driver 2/Trailer changes (see checkForField below, wired into each of
  // those fields' onChange), and a blocking Yes/No confirm gate runs once
  // more right before Save (see handleSubmit).
  const checkConflictsFor = async (fields) => {
    try {
      return await loadAssignmentsApi.checkConflicts(loadId, fields)
    } catch {
      return { hasConflicts: false, conflicts: [] }
    }
  }
  const checkForField = async (patch) => {
    const next = { ...form, ...patch }
    const result = await checkConflictsFor(next)
    if (result.hasConflicts) {
      toast(formatConflictMessage(result.conflicts), { icon: '⚠️', duration: 6000 })
    }
  }
  const confirmConflict = (message) => new Promise((resolve) => setConflictConfirm({ message, resolve }))

  const managedCarriers = carriers.filter((c) => c.authorityType === 1 && c.active)
  const carrierVehicles = vehicles.filter((v) => v.carrierId === form.carrierId && v.active)
  const carrierDrivers = drivers.filter((d) => d.carrierId === form.carrierId && d.active)
  const carrierTrailers = trailers.filter((t) => t.carrierId === form.carrierId && t.active)

  const handleCarrierChange = (carrierId) => {
    set({ carrierId, vehicleId: '', driverId1: '', driverId2: '', trailerId: '' })
  }

  // Auto-fill Driver 1/2 (and Trailer, matching the reference's vehicle-
  // select autofill) from whichever driver(s) are currently mapped to the
  // selected vehicle (see t_erp_backend driverVehicleMapping.service.js —
  // "who currently drives this truck" is a standing fact kept in sync on
  // every company dispatch, independent of any one load). A vehicle with no
  // mapping yet just leaves these fields blank for manual entry.
  const handleVehicleChange = async (vehicleId) => {
    let next = { vehicleId, driverId1: '', driverId2: '', trailerId: '' }
    set(next)
    if (!vehicleId) return
    try {
      const rows = await driverVehicleMappingApi.activeDriversForVehicle(vehicleId)
      if (rows.length) {
        next = {
          ...next,
          driverId1: String(rows[0].driver_id),
          driverId2: rows[1] ? String(rows[1].driver_id) : '',
          trailerId: rows[0].trailer_id ? String(rows[0].trailer_id) : '',
        }
        set(next)
      }
    } catch {
      // Lookup failed — leave fields blank, user picks manually.
    }
    checkForField(next)
  }

  const validate = () => {
    const next = {}
    if (!form.carrierId) next.carrierId = 'Carrier is required'
    if (!form.vehicleId) next.vehicleId = 'Vehicle is required'
    if (!form.driverId1) next.driverId1 = 'Primary driver is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please fill required fields before dispatching')
      return
    }
    const statusId = form.trackingStatusId
    if (statusId === TRACKING_STATUS.COMPLETED && (!form.completeDt || !form.completeOutDt)) {
      toast.error('Enter the completion In Time and Out Time')
      return
    }

    const conflictResult = await checkConflictsFor(form)
    if (conflictResult.hasConflicts) {
      const proceed = await confirmConflict(formatConflictMessage(conflictResult.conflicts))
      if (!proceed) return
    }

    setSaving(true)
    try {
      const payload = { ...assignmentDetailAdapter.toApi({ ...form, trackingStatusId: statusId }), is_external: false }
      if (leg) {
        await loadAssignmentsApi.update(loadId, leg.id, payload)
        toast.success('Assignment updated')
      } else {
        await loadAssignmentsApi.create(loadId, { ...payload, split_no: splitNo })
        toast.success('Load dispatched')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to save dispatch')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      title={leg ? 'Edit Dispatch' : `Dispatch Load — Split ${splitNo}`}
      subtitle="Managed / company authority"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          {/* Only "Save Load" is offered — advancing a leg's tracking status
              (including straight to In Transit) is the split card's inline
              Tracking Status dropdown's job, not this modal's. */}
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Save Load'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Section title="Assignment">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Carrier" required error={errors.carrierId}>
              <Select value={form.carrierId} onChange={(e) => handleCarrierChange(e.target.value)} error={errors.carrierId}>
                <option value="">Select managed carrier</option>
                {managedCarriers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Vehicle" required error={errors.vehicleId} hint="Selecting a vehicle auto-fills its currently mapped driver(s)">
              <Select value={form.vehicleId} onChange={(e) => handleVehicleChange(e.target.value)} disabled={!form.carrierId} error={errors.vehicleId}>
                <option value="">{form.carrierId ? 'Select vehicle' : 'Select a carrier first'}</option>
                {carrierVehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.regNumber} · {v.model}</option>
                ))}
              </Select>
            </Field>
            <Field label="Primary Driver" required error={errors.driverId1}>
              <Select value={form.driverId1} onChange={(e) => { set({ driverId1: e.target.value }); checkForField({ driverId1: e.target.value }) }} disabled={!form.carrierId} error={errors.driverId1}>
                <option value="">{form.carrierId ? 'Select driver' : 'Select a carrier first'}</option>
                {carrierDrivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                ))}
              </Select>
            </Field>
            <Field label="Secondary Driver">
              <Select value={form.driverId2} onChange={(e) => { set({ driverId2: e.target.value }); checkForField({ driverId2: e.target.value }) }} disabled={!form.carrierId}>
                <option value="">None</option>
                {carrierDrivers.filter((d) => d.id !== form.driverId1).map((d) => (
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                ))}
              </Select>
            </Field>
            <Field label="Trailer">
              <Select value={form.trailerId} onChange={(e) => { set({ trailerId: e.target.value }); checkForField({ trailerId: e.target.value }) }} disabled={!form.carrierId}>
                <option value="">{form.carrierId ? 'Select trailer' : 'Select a carrier first'}</option>
                {carrierTrailers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} · {t.trailerType}</option>
                ))}
              </Select>
            </Field>
            <Field label="Dispatcher">
              <Select value={form.dispatcherId} onChange={(e) => set({ dispatcherId: e.target.value })}>
                <option value="">Select dispatcher</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName}</option>
                ))}
              </Select>
            </Field>
            <Field label="Tracking Status">
              <Select value={form.trackingStatusId} onChange={(e) => set({ trackingStatusId: e.target.value })}>
                <option value="">Select…</option>
                {(typeOptions[46] || []).map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </Select>
            </Field>
          </div>
        </Section>

        <Section title="Schedule">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Dispatch Start Date/Time">
              <Input type="datetime-local" value={form.dispatchStartDt} onChange={(e) => set({ dispatchStartDt: e.target.value })} />
            </Field>
            <Field label="Dispatch End Date/Time">
              <Input type="datetime-local" value={form.dispatchEndDt} onChange={(e) => set({ dispatchEndDt: e.target.value })} />
            </Field>
            {form.trackingStatusId === TRACKING_STATUS.COMPLETED && (
              <>
                <Field label="Complete In Time" required hint="When the driver checked in for completion">
                  <Input type="datetime-local" value={form.completeDt} onChange={(e) => set({ completeDt: e.target.value })} />
                </Field>
                <Field label="Complete Out Time" required hint="When the driver checked out">
                  <Input type="datetime-local" value={form.completeOutDt} onChange={(e) => set({ completeOutDt: e.target.value })} />
                </Field>
              </>
            )}
          </div>
        </Section>
      </div>
    </Modal>

    {conflictConfirm && (
      <Modal
        open
        onClose={() => { conflictConfirm.resolve(false); setConflictConfirm(null) }}
        title="Dispatch Conflict"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { conflictConfirm.resolve(false); setConflictConfirm(null) }}>No</Button>
            <Button onClick={() => { conflictConfirm.resolve(true); setConflictConfirm(null) }}>Yes, continue</Button>
          </>
        }
      >
        <p className="whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{conflictConfirm.message}</p>
      </Modal>
    )}
    </>
  )
}
