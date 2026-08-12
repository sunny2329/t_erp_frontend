import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowRight } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Section } from '../ui/Section'
import { useData } from '../../context/DataContext'
import { loadAssignmentsApi } from '../../services/dispatchApi'
import { assignmentDetailAdapter } from '../../services/adapters'
import { getLocationLabel } from '../../utils/loadHelpers'

// type_master(type_id=46) — confirmed live: 5 = "In Transit", 13 = "Completed".
const TRACKING_STATUS = { IN_TRANSIT: '5', COMPLETED: '13' }

function blankForm() {
  return {
    carrierId: '', driverId1: '', vehicleId: '', trailerId: '',
    driverName: '', driverPhone: '', secondaryDriverName: '', secondaryDriverPhone: '',
    vehicleNo: '', trailerNo: '', dispatcherId: '',
    dispatchStartDt: '', dispatchEndDt: '', trackingStatusId: '1',
    completeDt: '', completeOutDt: '',
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

  // forcedStatusId is set only by the "Dispatch Load" button (jumps to In
  // Transit regardless of whatever the Tracking Status dropdown currently
  // shows); "Save Load" passes null and just uses the dropdown's value.
  const handleSubmit = async (forcedStatusId) => {
    if (!validate()) {
      toast.error('Please select a carrier before dispatching')
      return
    }
    const statusId = forcedStatusId || form.trackingStatusId
    if (statusId === TRACKING_STATUS.COMPLETED && (!form.completeDt || !form.completeOutDt)) {
      toast.error('Enter the completion In Time and Out Time')
      return
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
    <Modal
      open={open}
      onClose={onClose}
      title={leg ? 'Edit Dispatch' : `Broker Dispatch — Split ${splitNo}`}
      subtitle="External carrier authority"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          {/* Matches the reference Loadx-Youngs-Frontend's DispatchLoadModal:
              "Dispatch Load" (forces tracking status straight to In Transit)
              only exists for a brand-new dispatch — gated on `!editMode`
              there, `!leg` here — never on the current tracking status. Once
              a leg already exists, only a plain save is offered; advancing
              an existing leg's status from here on is the split card's
              inline Tracking Status dropdown's job, not this modal's. */}
          {!leg && (
            <Button variant="secondary" onClick={() => handleSubmit(TRACKING_STATUS.IN_TRANSIT)} disabled={saving}>
              {saving ? 'Saving…' : 'Dispatch Load'}
            </Button>
          )}
          <Button onClick={() => handleSubmit(null)} disabled={saving}>{saving ? 'Saving…' : 'Save Load'}</Button>
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
                <Select value={form.driverId1} onChange={(e) => set({ driverId1: e.target.value })}>
                  <option value="">None on file</option>
                  {carrierDrivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Vehicle">
                <Select value={form.vehicleId} onChange={(e) => set({ vehicleId: e.target.value })}>
                  <option value="">None on file</option>
                  {carrierVehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.regNumber}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Trailer">
                <Select value={form.trailerId} onChange={(e) => set({ trailerId: e.target.value })}>
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
              <Input value={form.driverPhone} onChange={(e) => set({ driverPhone: e.target.value })} disabled={!form.carrierId} />
            </Field>
            <Field label="Secondary Driver Name">
              <Input value={form.secondaryDriverName} onChange={(e) => set({ secondaryDriverName: e.target.value })} disabled={!form.carrierId} />
            </Field>
            <Field label="Secondary Cell Phone">
              <Input value={form.secondaryDriverPhone} onChange={(e) => set({ secondaryDriverPhone: e.target.value })} disabled={!form.carrierId} />
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
            <Field label="Tracking Status">
              <Select value={form.trackingStatusId} onChange={(e) => set({ trackingStatusId: e.target.value })}>
                <option value="">Select…</option>
                {(typeOptions[46] || []).map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </Select>
            </Field>
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
  )
}
