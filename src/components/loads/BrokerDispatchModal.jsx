import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowRight } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { PhoneInput } from '../ui/PhoneInput'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import { Section } from '../ui/Section'
import { DateTimeField } from '../ui/DateTimeField'
import { useData } from '../../context/DataContext'
import { loadAssignmentsApi } from '../../services/dispatchApi'
import { assignmentDetailAdapter } from '../../services/adapters'
import { getLocationLabel } from '../../utils/loadHelpers'

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
    carrierId: '', driverId1: '', vehicleId: '', trailerId: '',
    driverName: '', driverPhone: '', secondaryDriverName: '', secondaryDriverPhone: '',
    vehicleNo: '', trailerNo: '', dispatcherId: '',
    // Left blank on purpose for a brand-new assignment — saving with no
    // tracking status set leaves the load Scheduled(6), not In Transit.
    // Once the leg exists, its Tracking Status becomes editable right here
    // (see the "Tracking Status" field below) rather than from the split
    // card, so advancing it — e.g. to In Transit(5) or Completed(13) — is a
    // later Edit-and-Save on this same modal.
    dispatchStartDt: '', dispatchEndDt: '', trackingStatusId: '',
    completeDt: '', completeOutDt: '', dispatchRemark: '',
  }
}

// Dispatches an external/broker-authority carrier for one split group — same
// mechanics as CompanyDispatchModal (see splitNo there), plus is_external:true
// and free-text driver/equipment fields for carriers with no assets on file.
export function BrokerDispatchModal({ open, onClose, loadId, leg, splitNo, loadStops, locations, onSaved }) {
  const { carriers, drivers, vehicles, trailers, users, typeOptions } = useData()
  const [form, setForm] = useState(blankForm())
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [conflictConfirm, setConflictConfirm] = useState(null)

  useEffect(() => {
    if (!open) return
    // `leg` is already camelCase-adapted (assignmentFromApi, via
    // loadDetailAdapter.fromApi's assignments mapping) — merge it directly
    // rather than running it through assignmentDetailAdapter.fromApi again,
    // which expects raw snake_case DB columns and would silently blank out
    // every field on edit (see CompanyDispatchModal for the same fix).
    setForm(leg ? { ...blankForm(), ...leg } : blankForm())
    setErrors({})
  }, [open, leg])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  // Same conflict check as CompanyDispatchModal — broker dispatch was
  // missing this entirely (only company dispatch had it), meaning a
  // driver/vehicle/trailer on file for an external carrier could be
  // double-booked across two loads with no warning. checkConflicts only
  // looks at real FK ids (driverId1/vehicleId/trailerId), so the free-text
  // driverName/vehicleNo/trailerNo fields below (used when a carrier has no
  // assets on file) aren't and can't be checked this way.
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

  const externalCarriers = carriers.filter((c) => c.authorityType === 2 && c.active)
  const carrierDrivers = drivers.filter((d) => d.carrierId === form.carrierId && d.active)
  const carrierVehicles = vehicles.filter((v) => v.carrierId === form.carrierId && v.active)
  const carrierTrailers = trailers.filter((t) => t.carrierId === form.carrierId && t.active)
  const hasAssets = carrierDrivers.length > 0 || carrierVehicles.length > 0 || carrierTrailers.length > 0

  const handleCarrierChange = (carrierId) => {
    set({
      carrierId, driverId1: '', vehicleId: '', trailerId: '',
      driverName: '', driverPhone: '', secondaryDriverName: '', secondaryDriverPhone: '',
      vehicleNo: '', trailerNo: '',
    })
  }

  const validate = () => {
    const next = {}
    if (!form.carrierId) next.carrierId = 'Carrier is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please select a carrier before dispatching')
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
      const payload = { ...assignmentDetailAdapter.toApi({ ...form, trackingStatusId: statusId }), is_external: true }
      if (leg) {
        await loadAssignmentsApi.update(loadId, leg.id, payload)
        toast.success('Assignment updated')
      } else {
        await loadAssignmentsApi.create(loadId, { ...payload, split_no: splitNo })
        toast.success('Load dispatched (broker)')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to save dispatch')
    } finally {
      setSaving(false)
    }
  }

  const routeChips = (loadStops || [])
    .slice()
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
    .map((s) => (s.locationId ? getLocationLabel(s.locationId, locations || []) : s.stopType || '—'))

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      title={leg ? 'Edit Dispatch' : `Broker Dispatch — Split ${splitNo}`}
      subtitle="External carrier authority"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Save Load'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Section title="Carrier">
          <Field label="Carrier" required error={errors.carrierId}>
            <Select value={form.carrierId} onChange={(e) => handleCarrierChange(e.target.value)} error={errors.carrierId}>
              <option value="">Select external carrier</option>
              {externalCarriers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        </Section>

        {form.carrierId && hasAssets && (
          <Section title="Assigned assets (optional)" description="Existing assets on file for this carrier">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Driver">
                <Select value={form.driverId1} onChange={(e) => { set({ driverId1: e.target.value }); checkForField({ driverId1: e.target.value }) }}>
                  <option value="">None on file</option>
                  {carrierDrivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Vehicle">
                <Select value={form.vehicleId} onChange={(e) => { set({ vehicleId: e.target.value }); checkForField({ vehicleId: e.target.value }) }}>
                  <option value="">None on file</option>
                  {carrierVehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.regNumber}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Trailer">
                <Select value={form.trailerId} onChange={(e) => { set({ trailerId: e.target.value }); checkForField({ trailerId: e.target.value }) }}>
                  <option value="">None on file</option>
                  {carrierTrailers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </Section>
        )}

        <Section title="External driver / equipment" description="Manual entry — used when the carrier has no assets on file">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Driver Name">
              <Input value={form.driverName} onChange={(e) => set({ driverName: e.target.value })} disabled={!form.carrierId} />
            </Field>
            <Field label="Cell Phone">
              <PhoneInput value={form.driverPhone} onChange={(e) => set({ driverPhone: e.target.value })} disabled={!form.carrierId} />
            </Field>
            <Field label="Secondary Driver Name">
              <Input value={form.secondaryDriverName} onChange={(e) => set({ secondaryDriverName: e.target.value })} disabled={!form.carrierId} />
            </Field>
            <Field label="Secondary Cell Phone">
              <PhoneInput value={form.secondaryDriverPhone} onChange={(e) => set({ secondaryDriverPhone: e.target.value })} disabled={!form.carrierId} />
            </Field>
            <Field label="Vehicle #">
              <Input value={form.vehicleNo} onChange={(e) => set({ vehicleNo: e.target.value })} disabled={!form.carrierId} />
            </Field>
            <Field label="Trailer #">
              <Input value={form.trailerNo} onChange={(e) => set({ trailerNo: e.target.value })} disabled={!form.carrierId} />
            </Field>
          </div>
        </Section>

        <Section title="Dispatch">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Dispatcher">
              <Select value={form.dispatcherId} onChange={(e) => set({ dispatcherId: e.target.value })}>
                <option value="">Select dispatcher</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName}</option>
                ))}
              </Select>
            </Field>
            {/* Only shown once the leg exists — a brand-new assignment stays
                Scheduled until it's saved and reopened for edit. */}
            {leg ? (
              <Field label="Tracking Status" hint="Advance this leg — e.g. In Transit or Completed">
                <Select value={form.trackingStatusId} onChange={(e) => set({ trackingStatusId: e.target.value })}>
                  <option value="">Scheduled (not dispatched yet)</option>
                  {(typeOptions[46] || []).map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </Select>
              </Field>
            ) : (
              <div className="hidden sm:block" />
            )}
            <DateTimeField label="Dispatch Start Date/Time" value={form.dispatchStartDt} onChange={(v) => set({ dispatchStartDt: v })} />
            <DateTimeField label="Dispatch End Date/Time" value={form.dispatchEndDt} onChange={(v) => set({ dispatchEndDt: v })} />
            {form.trackingStatusId === TRACKING_STATUS.COMPLETED && (
              <>
                <DateTimeField label="Complete In Time" required hint="When the driver checked in for completion" value={form.completeDt} onChange={(v) => set({ completeDt: v })} />
                <DateTimeField label="Complete Out Time" required hint="When the driver checked out" value={form.completeOutDt} onChange={(v) => set({ completeOutDt: v })} />
              </>
            )}
          </div>
          <Field label="Dispatch Notes" className="mt-3">
            <Textarea rows={2} value={form.dispatchRemark} onChange={(e) => set({ dispatchRemark: e.target.value })} />
          </Field>
        </Section>

        {routeChips.length > 0 && (
          <Section title="Route">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {routeChips.map((city, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {city}
                  </span>
                  {i < routeChips.length - 1 && <ArrowRight className="h-3 w-3 text-slate-400" />}
                </span>
              ))}
            </div>
          </Section>
        )}
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
