import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Truck, Building2, FileText, MessageSquare, FileCheck2, FileSignature, ScrollText, Send, History } from 'lucide-react'
import { Drawer } from '../ui/Drawer'
import { Modal } from '../ui/Modal'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { DateTimeField } from '../ui/DateTimeField'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { Toggle } from '../ui/Toggle'
import { SearchSelect } from '../ui/SearchSelect'
import { Button } from '../ui/Button'
import { Section } from '../ui/Section'
import { Badge } from '../ui/Badge'
import { useData } from '../../context/DataContext'
import { QuickAddModal } from './QuickAddModal'
import { StopCard } from './StopCard'
import { SplitStopModal } from './SplitStopModal'
import { CompanyDispatchModal } from './CompanyDispatchModal'
import { BrokerDispatchModal } from './BrokerDispatchModal'
import { DocumentsModal } from './DocumentsModal'
import { NotesModal } from './NotesModal'
import { LoadHistoryModal } from './LoadHistoryModal'
import { SendRateConModal } from './SendRateConModal'
import { loadsApi } from '../../services/masterApi'
import { loadAssignmentsApi } from '../../services/dispatchApi'
import { loadDetailAdapter } from '../../services/adapters'
import { getLocationLabel, formatDateTime, getActiveLeg } from '../../utils/loadHelpers'
import { blankStop, isReeferVanType } from './stopHelpers'
import { validateLoadForm } from './loadValidation'
import { pdfApi, openPdfBlob } from '../../services/pdfApi'

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

function StatItem({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{value || '—'}</p>
    </div>
  )
}

function LegDetailItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">{value || '—'}</p>
    </div>
  )
}

// Full load editor — the only place splits/dispatch happen (a load can't be
// split or dispatched before it exists, so CreateLoadModal stays simple).
//
// load_stops.split_no is the source of truth for which leg a stop belongs
// to (see t_erp_backend/src/services/loadAssignments.service.js) — every
// stop carries its own split_no, defaulting to 1. The Stops section below
// is grouped by split_no: each group is its own mini stop-list with its own
// Add Pickup/Add Delivery buttons and its own Dispatch Load / Broker
// Dispatch actions (one load_assignments row per split_no). "+ Add Split"
// creates a new stop tagged with the next split_no, which is what actually
// starts a new leg — matching the reference Loadx-Youngs-Frontend's
// per-split dispatch panels, but driven by a real column instead of the
// reference's events-table "drops" hack.
export function LoadEditDrawer({ open, onClose, loadId }) {
  const { customers, customersCrud, carriers, drivers, vehicles, trailers, users, terminals, locations, locationsCrud, loadsCrud, typeOptions } = useData()

  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({ stopErrors: {} })
  const [quickAdd, setQuickAdd] = useState(null)
  const [dispatchModal, setDispatchModal] = useState(null)
  const [splitModal, setSplitModal] = useState(null)
  const [documentsOpen, setDocumentsOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(null)
  const [rateConTarget, setRateConTarget] = useState(null)
  const [completePrompt, setCompletePrompt] = useState(null)

  useEffect(() => {
    if (!open || !loadId) return
    setLoading(true)
    loadsApi
      .getById(loadId)
      .then((row) => setForm(loadDetailAdapter.fromApi(row)))
      .catch((err) => toast.error(err.message || 'Failed to load load'))
      .finally(() => setLoading(false))
    setErrors({ stopErrors: {} })
  }, [open, loadId])

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    if (patch.customerId) setErrors((prev) => ({ ...prev, customerId: undefined }))
  }
  const setRate = (patch) => setForm((f) => ({ ...f, rate: { ...f.rate, ...patch } }))
  const setEquipment = (patch) => setForm((f) => ({ ...f, equipment: { ...f.equipment, ...patch } }))
  const setParties = (patch) => setForm((f) => ({ ...f, parties: { ...f.parties, ...patch } }))
  const setNotes = (patch) => setForm((f) => ({ ...f, notes: { ...f.notes, ...patch } }))

  if (!open || !loadId) return null

  if (loading || !form) {
    return (
      <Drawer open={open} onClose={onClose} title="Loading…" width="max-w-[1600px]">
        <div className="flex items-center justify-center py-16 text-sm text-slate-400">Loading load…</div>
      </Drawer>
    )
  }

  const customerOptions = customers.filter((c) => c.active).map((c) => ({ value: c.id, label: c.name, sublabel: `${c.city}, ${c.state}` }))
  // Address included in sublabel so it's both shown under each option and
  // matched by SearchSelect's search (which filters on label + sublabel
  // together) — matches the reference Loadx-Youngs-Frontend's location
  // dropdown, which displays/searches "{name} - {street address}".
  const locationOptions = locations.map((l) => ({ value: l.id, label: l.name, sublabel: [l.address, l.city && l.state ? `${l.city}, ${l.state}` : l.city || l.state].filter(Boolean).join(' · ') }))
  const carrierOptions = carriers.filter((c) => c.active)
  const agentUsers = users
  const isReefer = isReeferVanType(form.equipment.vanTypeId)

  // Shared by the manual "Save Load" button and by actions that must persist
  // immediately on their own (e.g. adding a split) — takes the form to save
  // explicitly rather than reading `form` from closure, so a caller that just
  // computed a new stops array can save that exact value without waiting on
  // setState to land first.
  const persistForm = async (nextForm, successMessage) => {
    const { errors: next, valid } = validateLoadForm(nextForm)
    setErrors(next)
    if (!valid) {
      toast.error('Please fix the highlighted fields')
      return false
    }
    setSaving(true)
    try {
      const updated = await loadsCrud.update(loadId, nextForm)
      setForm(updated)
      toast.success(successMessage)
      return true
    } catch (err) {
      toast.error(err.message || 'Failed to save load')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => persistForm(form, 'Load saved')

  const refetchLoad = async () => {
    try {
      const row = await loadsApi.getById(loadId)
      setForm(loadDetailAdapter.fromApi(row))
    } catch (err) {
      toast.error(err.message || 'Failed to refresh load')
    }
  }

  // busyKey lets each button show its own "generating…" state without a
  // global spinner — PDF generation takes a moment (logo fetch + drawing).
  const viewPdf = async (kind, assignmentId, busyKey) => {
    setPdfBusy(busyKey)
    try {
      const blob =
        kind === 'customer'
          ? await pdfApi.customerConfirmation(loadId)
          : kind === 'load'
            ? await pdfApi.loadConfirmation(loadId, assignmentId)
            : await pdfApi.bol(loadId, assignmentId)
      openPdfBlob(blob)
    } catch (err) {
      toast.error(err.message || 'Failed to generate PDF')
    } finally {
      setPdfBusy(null)
    }
  }

  // --- Stops (grouped by split_no) ---
  const sortedStops = [...form.stops].sort((a, b) => a.sequence - b.sequence)
  const splitNos = [...new Set(sortedStops.map((s) => s.splitNo || 1))].sort((a, b) => a - b)

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
  const removeStop = (id) =>
    set({ stops: form.stops.filter((s) => s.id !== id).map((s, i) => ({ ...s, sequence: i + 1 })) })
  const moveStop = (globalIndex, dir) => {
    const next = [...sortedStops]
    const target = globalIndex + dir
    if (target < 0 || target >= next.length) return
    if ((next[target].splitNo || 1) !== (next[globalIndex].splitNo || 1)) return
    ;[next[globalIndex], next[target]] = [next[target], next[globalIndex]]
    set({ stops: next.map((s, i) => ({ ...s, sequence: i + 1 })) })
  }
  // Inserts within the group's own range (before the next group's first
  // stop) so seq_no stays consistent with split_no ordering.
  const addStopToSplit = (splitNo, stopType) => {
    const groupIndices = sortedStops.map((s, i) => ({ s, i })).filter((e) => (e.s.splitNo || 1) === splitNo)
    const insertAt = groupIndices.length ? groupIndices[groupIndices.length - 1].i + 1 : sortedStops.length
    const newStop = blankStop(stopType, 0, splitNo)
    const next = [...sortedStops.slice(0, insertAt), newStop, ...sortedStops.slice(insertAt)]
    const nextForm = { ...form, stops: next.map((s, i) => ({ ...s, sequence: i + 1 })) }
    setForm(nextForm)
    // Same auto-save-on-add as insertSplitAt below. Note the new stop starts
    // blank (no location/date yet), so this first persistForm call will
    // usually fail validation and just leave the row added locally — it
    // saves for real once the dispatcher fills in its required fields and
    // either edits another field (which routes through updateStop, not this
    // function) or hits "Save Load".
    persistForm(nextForm, 'Stop added')
  }
  // Inserts TWO real load_stops rows at `afterGlobalIndex` (a position in
  // sortedStops) — the relay/handoff point, same location, entered once in
  // SplitStopModal: a Delivery row closing out the leg before it (stays in
  // the anchor's split_no) and a Pickup row opening the leg after it (starts
  // split_no + 1). Matches how relay handoffs work in the reference Youngs
  // project — each driver gets their own stop/POD record, not one row
  // shared between two groups. Everything already downstream of this point
  // that was in the anchor's group moves into the new group with the pickup
  // half, and any group that already existed further down shifts up by one
  // to make room.
  const insertSplitAt = (afterGlobalIndex, relayStopData) => {
    const anchorSplitNo = sortedStops[afterGlobalIndex]?.splitNo || 1
    const newSplitNo = anchorSplitNo + 1
    const reassigned = sortedStops.map((s, i) => {
      if (i <= afterGlobalIndex) return s
      const sn = s.splitNo || 1
      if (sn === anchorSplitNo) return { ...s, splitNo: newSplitNo }
      if (sn >= newSplitNo) return { ...s, splitNo: sn + 1 }
      return s
    })
    const dropStop = { ...relayStopData, id: `new-${crypto.randomUUID()}`, stopType: 'Delivery', splitNo: anchorSplitNo }
    const pickupStop = { ...relayStopData, id: `new-${crypto.randomUUID()}`, stopType: 'Pickup', splitNo: newSplitNo }
    const next = [
      ...reassigned.slice(0, afterGlobalIndex + 1),
      dropStop,
      pickupStop,
      ...reassigned.slice(afterGlobalIndex + 1)
    ]
    const nextForm = { ...form, stops: next.map((s, i) => ({ ...s, sequence: i + 1 })) }
    // Persist right away — a split is a real action a dispatcher expects to
    // stick immediately, not something that should be lost if they close the
    // drawer without remembering to hit "Save Load" afterward.
    setForm(nextForm)
    persistForm(nextForm, 'Split added')
  }
  // Split button on a stop card (see StopCard) opens SplitStopModal to
  // collect the relay point's shared details first — a Pickup's button
  // places the new pair right after it (this leg ends there); a Delivery's
  // places it right before (the next leg begins there, then continues to
  // this delivery). Either way the gap is the same, just approached from
  // whichever side the dispatcher clicked.
  const openSplitModal = (globalIndex) => {
    const stop = sortedStops[globalIndex]
    const afterGlobalIndex = stop.stopType === 'Pickup' ? globalIndex : globalIndex - 1
    setSplitModal({ afterGlobalIndex })
  }
  const handleSplitSubmit = (stopData) => {
    insertSplitAt(splitModal.afterGlobalIndex, stopData)
    setSplitModal(null)
  }

  // --- Quick add ---
  // Field set matches the reference Loadx-Youngs-Frontend's inline "Add New
  // Customer" modal (LoadDetailDrawer.jsx lines 1429-1467/~8003+): name +
  // customer type + sales agent are hard-required there, everything else
  // optional.
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

  // --- Dispatch ---
  const stopLabel = (stop) => (stop ? (stop.locationId ? getLocationLabel(stop.locationId, locations) : stop.stopType) : '—')
  const openCreateDispatch = (kind, splitNo) => setDispatchModal({ kind, leg: null, splitNo })
  const openEditDispatch = (leg) => setDispatchModal({ kind: leg.isExternal ? 'broker' : 'company', leg, splitNo: leg.splitNo })
  const closeDispatchModal = () => setDispatchModal(null)
  const handleDispatchSaved = () => {
    setDispatchModal(null)
    refetchLoad()
  }
  const handleDeleteLeg = async (legId) => {
    try {
      await loadAssignmentsApi.remove(loadId, legId)
      toast.success('Assignment removed')
      refetchLoad()
    } catch (err) {
      toast.error(err.message || 'Failed to remove assignment')
    }
  }

  // Inline tracking-status update straight from a leg's card — no need to
  // open the full Edit Dispatch modal just to move a leg along, matching
  // the reference Loadx-Youngs-Frontend's per-split "Tracking Status"
  // dropdown. Moving to Completed(13) still needs Complete In/Out time
  // (same requirement as CompanyDispatchModal/BrokerDispatchModal) — if the
  // leg doesn't already have both, a small prompt collects them first
  // instead of saving right away.
  const handleTrackingStatusChange = async (leg, statusId) => {
    if (statusId === '13' && (!leg.completeDt || !leg.completeOutDt)) {
      setCompletePrompt({ leg, completeDt: leg.completeDt || '', completeOutDt: leg.completeOutDt || '' })
      return
    }
    try {
      await loadAssignmentsApi.update(loadId, leg.id, { tracking_status_type_id: statusId ? Number(statusId) : null })
      toast.success('Tracking status updated')
      refetchLoad()
    } catch (err) {
      toast.error(err.message || 'Failed to update tracking status')
    }
  }

  // The explicit "Dispatch" action for an already-saved-but-not-yet-moving
  // leg (trackingStatusId still blank, i.e. just Scheduled) — one click to
  // In Transit(5), same transition the Tracking Status dropdown offers, just
  // surfaced as its own button so "dispatch this" doesn't require knowing to
  // dig into the dropdown first.
  const handleDispatchLeg = (leg) => handleTrackingStatusChange(leg, '5')

  const submitCompletePrompt = async () => {
    if (!completePrompt.completeDt || !completePrompt.completeOutDt) {
      toast.error('Enter the completion In Time and Out Time')
      return
    }
    try {
      await loadAssignmentsApi.update(loadId, completePrompt.leg.id, {
        tracking_status_type_id: 13,
        complete_dt: completePrompt.completeDt,
        complete_out_dt: completePrompt.completeOutDt,
      })
      toast.success('Tracking status updated')
      setCompletePrompt(null)
      refetchLoad()
    } catch (err) {
      toast.error(err.message || 'Failed to update tracking status')
    }
  }

  // --- Header stats strip ---
  const customerEntity = customers.find((c) => c.id === form.customerId)
  const pickupStop = sortedStops.find((s) => s.stopType === 'Pickup') || sortedStops[0]
  const deliveryStop = [...sortedStops].reverse().find((s) => s.stopType === 'Delivery') || sortedStops[sortedStops.length - 1]
  // Carrier/Driver/Vehicle/Trailer only show real values once the load has
  // actually left the yard (trip status Scheduled/Completed/In Transit) —
  // matches the reference Loadx-Youngs-Frontend's statusAllowsDisplay gate.
  // Which leg's data populates them (getActiveLeg): the first leg, in split
  // order, that hasn't reached Completed yet, else the last leg.
  const legDisplayAllowed = ['6', '7', '10'].includes(form.tripStatusId)
  const activeLeg = legDisplayAllowed ? getActiveLeg(form) : null
  const activeLegCarrier = activeLeg ? carriers.find((c) => c.id === activeLeg.carrierId) : null
  const activeLegDriverEntity = activeLeg ? drivers.find((d) => d.id === activeLeg.driverId1) : null
  const activeLegDriverLabel = activeLegDriverEntity ? `${activeLegDriverEntity.firstName} ${activeLegDriverEntity.lastName}` : activeLeg?.driverName
  const activeLegVehicleLabel = activeLeg ? (vehicles.find((v) => v.id === activeLeg.vehicleId)?.regNumber || activeLeg.vehicleNo) : null
  const activeLegTrailerLabel = activeLeg ? (trailers.find((t) => t.id === activeLeg.trailerId)?.name || activeLeg.trailerNo) : null
  // Dispatcher / Dispatch Time / Complete Time in the top bar are shown only
  // for single-leg loads — matching the reference, which moves this info
  // into the per-split card for multi-leg loads (already shown there below,
  // per split, for every leg regardless of trip status).
  const singleLegLoad = splitNos.length === 1
  const topBarLeg = singleLegLoad ? form.assignments[0] : null
  const topBarDispatcherLabel = topBarLeg?.dispatcherId ? users.find((u) => u.id === topBarLeg.dispatcherId)?.fullName : null

  const activeDispatchGroupStops = dispatchModal ? sortedStops.filter((s) => (s.splitNo || 1) === dispatchModal.splitNo) : []

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={`Edit Load ${form.loadNumber}`}
        subtitle={`Load ID ${loadId}`}
        width="max-w-[1600px]"
        headerExtra={
          <div className="flex items-center gap-2">
            <Badge status={form.tripStatus} />
            <Badge status={form.trackingStatus} />
          </div>
        }
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Load'}</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              <StatItem label="Load #" value={form.loadNumber} />
              <StatItem label="Customer" value={customerEntity?.name} />
              <StatItem label="Pickup" value={stopLabel(pickupStop)} />
              <StatItem label="Delivery" value={stopLabel(deliveryStop)} />
              <StatItem label="Carrier" value={activeLegCarrier?.name || 'Unassigned'} />
              <StatItem label="Driver" value={activeLegDriverLabel} />
              <StatItem label="Vehicle" value={activeLegVehicleLabel} />
              <StatItem label="Trailer" value={activeLegTrailerLabel} />
            </div>
            {singleLegLoad && topBarLeg && (topBarDispatcherLabel || topBarLeg.dispatchStartDt || topBarLeg.dispatchEndDt || topBarLeg.completeDt || topBarLeg.completeOutDt) && (
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-200 pt-2 dark:border-slate-800 sm:grid-cols-4">
                {topBarDispatcherLabel && <StatItem label="Dispatcher" value={topBarDispatcherLabel} />}
                {(topBarLeg.dispatchStartDt || topBarLeg.dispatchEndDt) && (
                  <>
                    <StatItem label="Dispatch Start" value={formatDateTime(topBarLeg.dispatchStartDt)} />
                    <StatItem label="Dispatch End" value={formatDateTime(topBarLeg.dispatchEndDt)} />
                  </>
                )}
                {(topBarLeg.completeDt || topBarLeg.completeOutDt) && (
                  <>
                    <StatItem label="Completed In" value={formatDateTime(topBarLeg.completeDt)} />
                    <StatItem label="Completed Out" value={formatDateTime(topBarLeg.completeOutDt)} />
                  </>
                )}
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-end gap-2 border-t border-slate-200 pt-2 dark:border-slate-800">
              <Field
                label="Load Status"
                className="w-44"
                hint="In Transit is set by dispatching a split below, not from here"
              >
                <Select value={form.tripStatusId} onChange={(e) => set({ tripStatusId: e.target.value })}>
                  <option value="">Select…</option>
                  {(typeOptions[34] || []).map((o) => (
                    <option
                      key={o.id}
                      value={o.id}
                      disabled={String(o.id) === '10' && form.tripStatusId !== '10'}
                    >
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setDocumentsOpen(true)}>
                  <FileText className="h-3.5 w-3.5" /> Documents
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setNotesOpen(true)}>
                  <MessageSquare className="h-3.5 w-3.5" /> Notes
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => viewPdf('customer', null, 'customer')}
                  disabled={pdfBusy === 'customer'}
                >
                  <FileCheck2 className="h-3.5 w-3.5" /> {pdfBusy === 'customer' ? 'Generating…' : 'Customer Confirmation'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setHistoryOpen(true)}>
                  <History className="h-3.5 w-3.5" /> History
                </Button>
              </div>
            </div>
          </div>

          {/* Left column: load/booking form. Right column: stops + dispatch —
              side by side (not stacked below) so stops are visible without
              scrolling past the whole form first, matching the reference
              Loadx-Youngs-Frontend's LoadDetailDrawer split-panel layout. */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3">
              <Section title="Customer / Rate" collapsible color="blue">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Field label="Customer" required className="sm:col-span-2" error={errors.customerId}>
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
                  <Field label="Customer Ref #" required className="sm:col-span-2" error={errors.customerRef} hint={!errors.customerRef ? 'Same reference applied to every stop' : undefined}>
                    <Input value={form.customerRef} onChange={(e) => { set({ customerRef: e.target.value }); setErrors((prev) => ({ ...prev, customerRef: undefined })) }} error={errors.customerRef} />
                  </Field>
                  <Field label="Primary Fee" required error={errors.primaryFee}>
                    <Input type="number" value={form.rate.primaryFee} onChange={(e) => { setRate({ primaryFee: e.target.value }); setErrors((prev) => ({ ...prev, primaryFee: undefined })) }} placeholder="$" error={errors.primaryFee} />
                  </Field>
                  <Field label="Fee Type" required error={errors.feeType}>
                    <TypeSelect options={typeOptions[24] || []} value={form.rate.feeTypeId} onChange={(v) => { setRate({ feeTypeId: v }); setErrors((prev) => ({ ...prev, feeType: undefined })) }} />
                  </Field>
                  <Field label="Tendered Miles">
                    <Input type="number" value={form.rate.tenderedMiles} onChange={(e) => setRate({ tenderedMiles: e.target.value })} />
                  </Field>
                  <Field label="Fuel Surcharge Type">
                    <TypeSelect options={typeOptions[25] || []} value={form.rate.fuelSurchargeTypeId} onChange={(v) => setRate({ fuelSurchargeTypeId: v })} />
                  </Field>
                  <Field label="Fuel Surcharge Amount">
                    <Input type="number" value={form.rate.fuelSurchargeAmount} onChange={(e) => setRate({ fuelSurchargeAmount: e.target.value })} />
                  </Field>
                  <Field label="Target Rate">
                    <Input type="number" value={form.rate.targetRate} onChange={(e) => setRate({ targetRate: e.target.value })} placeholder="$" />
                  </Field>
                  <Field label="Declared Value">
                    <Input type="number" value={form.rate.declaredValue} onChange={(e) => setRate({ declaredValue: e.target.value })} placeholder="$" />
                  </Field>
                </div>
              </Section>

              <Section title="Equipment / Commodity" collapsible color="emerald">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Field label="Van / Equipment Type">
                    <TypeSelect options={typeOptions[7] || []} value={form.equipment.vanTypeId} onChange={(v) => setEquipment({ vanTypeId: v })} placeholder="Select equipment" />
                  </Field>
                  <Field label="Commodity">
                    <Input value={form.equipment.commodity} onChange={(e) => setEquipment({ commodity: e.target.value })} />
                  </Field>
                  <Field label="Length (ft)">
                    <Input type="number" value={form.equipment.length} onChange={(e) => setEquipment({ length: e.target.value })} />
                  </Field>
                  <Field label="Weight (lbs)">
                    <Input type="number" value={form.equipment.weight} onChange={(e) => setEquipment({ weight: e.target.value })} />
                  </Field>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <Toggle checked={form.equipment.hazmat} onChange={(v) => setEquipment({ hazmat: v })} label="Hazmat" />
                  {form.equipment.hazmat && (
                    <Field label="Hazmat Type" className="w-56">
                      <TypeSelect options={typeOptions[28] || []} value={form.equipment.hazmatTypeId} onChange={(v) => setEquipment({ hazmatTypeId: v })} />
                    </Field>
                  )}
                  <Toggle checked={form.equipment.tarpRequired} onChange={(v) => setEquipment({ tarpRequired: v })} label="Tarp required" />
                </div>
              </Section>

              <Section title="Parties" collapsible color="orange">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Field label="Booking Authority (Carrier)" required error={errors.bookingAuthority}>
                    <Select value={form.parties.bookingAuthorityId} onChange={(e) => { setParties({ bookingAuthorityId: e.target.value }); setErrors((prev) => ({ ...prev, bookingAuthority: undefined })) }} error={errors.bookingAuthority}>
                      <option value="">Unassigned</option>
                      {carrierOptions.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Brokerage Agent">
                    <Select value={form.parties.brokerageAgentId} onChange={(e) => setParties({ brokerageAgentId: e.target.value })}>
                      <option value="">None</option>
                      {agentUsers.map((u) => (
                        <option key={u.id} value={u.id}>{u.fullName}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Sales Agent" required error={errors.salesAgent}>
                    <Select value={form.parties.salesAgentId} onChange={(e) => { setParties({ salesAgentId: e.target.value }); setErrors((prev) => ({ ...prev, salesAgent: undefined })) }} error={errors.salesAgent}>
                      <option value="">Select sales agent</option>
                      {agentUsers.map((u) => (
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
              </Section>
            </div>

            {/* Stops + Dispatch, grouped by split_no — one group = one leg */}
            <div className="space-y-3">
              {splitNos.map((splitNo) => {
            const groupEntries = sortedStops
              .map((s, i) => ({ stop: s, globalIndex: i }))
              .filter((e) => (e.stop.splitNo || 1) === splitNo)
            const leg = form.assignments.find((a) => a.splitNo === splitNo)

            return (
              <Section
                key={splitNo}
                title={`Split ${splitNo}`}
                collapsible
                color="indigo"
                description={`${groupEntries.length} stop(s)${leg ? ` · dispatched (${leg.isExternal ? 'Broker' : 'Company'})` : ' · not yet dispatched'}`}
              >
                <div className="pb-2">
                  {leg ? (
                    <div className="space-y-2 rounded-lg border border-slate-200 p-2.5 dark:border-slate-800">
                      {(() => {
                        const trackingLabel = (typeOptions[46] || []).find((o) => o.id === leg.trackingStatusId)?.label
                        const isCompleted = leg.trackingStatusId === '13'
                        const primaryDriver = drivers.find((x) => x.id === leg.driverId1)
                        const primaryDriverLabel = primaryDriver ? `${primaryDriver.firstName} ${primaryDriver.lastName}` : leg.driverName
                        const secondaryDriver = drivers.find((x) => x.id === leg.driverId2)
                        const secondaryDriverLabel = secondaryDriver ? `${secondaryDriver.firstName} ${secondaryDriver.lastName}` : leg.secondaryDriverName
                        const vehicleLabel = vehicles.find((v) => v.id === leg.vehicleId)?.regNumber || leg.vehicleNo
                        const trailerLabel = trailers.find((t) => t.id === leg.trailerId)?.name || leg.trailerNo
                        const dispatcherLabel = users.find((u) => u.id === leg.dispatcherId)?.fullName

                        return (
                          <>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                  {carriers.find((c) => c.id === leg.carrierId)?.name || '—'}
                                </span>
                                <span className="text-xs font-normal text-slate-400">({leg.isExternal ? 'Broker' : 'Company'})</span>
                                {trackingLabel && (
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                                      isCompleted
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                        : leg.trackingStatusId === '5'
                                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                  >
                                    {trackingLabel}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Once a leg exists, "Dispatch Load" (force straight to In
                                    Transit) is gone for good — matching the reference
                                    Loadx-Youngs-Frontend, where that action only exists for a
                                    brand-new dispatch. "Edit" reopens the same modal, but it
                                    only offers Save Load from here on (see CompanyDispatchModal/
                                    BrokerDispatchModal); advancing an existing leg's status,
                                    including to In Transit, is the Tracking Status dropdown
                                    below, not this button. */}
                                <Button size="sm" variant="ghost" onClick={() => openEditDispatch(leg)}>Edit</Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-500"
                                  disabled={!!leg.trackingStatusId}
                                  title={leg.trackingStatusId ? 'Tracking has already started — cannot clear this assignment' : undefined}
                                  onClick={() => handleDeleteLeg(leg.id)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>

                            {isCompleted && (leg.completeDt || leg.completeOutDt) && (
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-md bg-emerald-50 p-2 dark:bg-emerald-900/10">
                                <LegDetailItem label="Completed In" value={formatDateTime(leg.completeDt)} />
                                <LegDetailItem label="Completed Out" value={formatDateTime(leg.completeOutDt)} />
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4">
                              <LegDetailItem label="Primary Driver" value={primaryDriverLabel} />
                              <LegDetailItem label="Secondary Driver" value={secondaryDriverLabel} />
                              <LegDetailItem label="Vehicle" value={vehicleLabel} />
                              <LegDetailItem label="Trailer" value={trailerLabel} />
                              <LegDetailItem label="Dispatcher" value={dispatcherLabel} />
                              <LegDetailItem label="Dispatch Start" value={formatDateTime(leg.dispatchStartDt)} />
                              <LegDetailItem label="Dispatch End" value={formatDateTime(leg.dispatchEndDt)} />
                            </div>

                            <div className="flex items-center gap-2 border-t border-slate-100 pt-2 dark:border-slate-800/60">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Tracking Status</span>
                              <Select
                                value={leg.trackingStatusId}
                                onChange={(e) => handleTrackingStatusChange(leg, e.target.value)}
                                className="w-48"
                              >
                                <option value="">Select…</option>
                                {(typeOptions[46] || []).map((o) => (
                                  <option key={o.id} value={o.id}>{o.label}</option>
                                ))}
                              </Select>
                              {!leg.trackingStatusId && (
                                <Button size="sm" onClick={() => handleDispatchLeg(leg)}>
                                  Dispatch
                                </Button>
                              )}
                            </div>
                          </>
                        )
                      })()}
                      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-2 dark:border-slate-800/60">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => viewPdf('load', leg.id, `load-${leg.id}`)}
                          disabled={pdfBusy === `load-${leg.id}`}
                        >
                          <ScrollText className="h-3.5 w-3.5" /> {pdfBusy === `load-${leg.id}` ? 'Generating…' : 'Load Confirmation'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => viewPdf('bol', leg.id, `bol-${leg.id}`)}
                          disabled={pdfBusy === `bol-${leg.id}`}
                        >
                          <FileSignature className="h-3.5 w-3.5" /> {pdfBusy === `bol-${leg.id}` ? 'Generating…' : 'BOL'}
                        </Button>
                        {leg.isExternal && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-teal-600 dark:text-teal-400"
                            onClick={() => setRateConTarget({ assignmentId: leg.id, carrierName: carriers.find((c) => c.id === leg.carrierId)?.name })}
                          >
                            <Send className="h-3.5 w-3.5" /> Send Rate Con
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openCreateDispatch('company', splitNo)}>
                        <Building2 className="h-3.5 w-3.5" /> Dispatch Load
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openCreateDispatch('broker', splitNo)}>
                        <Truck className="h-3.5 w-3.5" /> Broker Dispatch
                      </Button>
                    </div>
                  )}
                </div>

                {(() => {
                  const pickupEntries = groupEntries.filter((e) => e.stop.stopType === 'Pickup')
                  const deliveryEntries = groupEntries.filter((e) => e.stop.stopType === 'Delivery')
                  const renderStop = ({ stop, globalIndex }, localIndex, total) => (
                    <StopCard
                      key={stop.id}
                      stop={stop}
                      index={localIndex}
                      total={total}
                      onChange={(updated) => updateStop(stop.id, updated)}
                      onRemove={() => removeStop(stop.id)}
                      onMoveUp={() => moveStop(globalIndex, -1)}
                      onMoveDown={() => moveStop(globalIndex, 1)}
                      locationOptions={locationOptions}
                      onAddLocation={openAddLocation}
                      headerCommodity={form.equipment.commodity}
                      isReefer={isReefer}
                      errors={errors.stopErrors?.[stop.id] || {}}
                      onSplit={() => openSplitModal(globalIndex)}
                    />
                  )
                  return (
                    <div className="space-y-3 border-t border-slate-200 pt-2 dark:border-slate-800">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Pickup</h4>
                          <Button size="sm" variant="secondary" onClick={() => addStopToSplit(splitNo, 'Pickup')}>
                            <Plus className="h-3.5 w-3.5" /> Add Pickup
                          </Button>
                        </div>
                        {pickupEntries.map((e, localIndex) => renderStop(e, localIndex, pickupEntries.length))}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Delivery</h4>
                          <Button size="sm" variant="secondary" onClick={() => addStopToSplit(splitNo, 'Delivery')}>
                            <Plus className="h-3.5 w-3.5" /> Add Delivery
                          </Button>
                        </div>
                        {deliveryEntries.map((e, localIndex) => renderStop(e, localIndex, deliveryEntries.length))}
                      </div>
                      {errors.stops && splitNo === 1 && <p className="text-xs text-red-500">{errors.stops}</p>}
                    </div>
                  )
                })()}
              </Section>
            )
          })}
            </div>
          </div>

          <Section title="Notes" collapsible>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Field label="Customer Load Notes">
                <Textarea rows={2} value={form.notes.customerLoadNotes} onChange={(e) => setNotes({ customerLoadNotes: e.target.value })} />
              </Field>
              <Field label="Dispatch Notes">
                <Textarea rows={2} value={form.notes.dispatchNotes} onChange={(e) => setNotes({ dispatchNotes: e.target.value })} />
              </Field>
            </div>
          </Section>
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

      <SplitStopModal
        open={!!splitModal}
        onClose={() => setSplitModal(null)}
        locationOptions={locationOptions}
        onAddLocation={openAddLocation}
        onSubmit={handleSplitSubmit}
      />

      <CompanyDispatchModal
        open={dispatchModal?.kind === 'company'}
        onClose={closeDispatchModal}
        loadId={loadId}
        leg={dispatchModal?.leg}
        splitNo={dispatchModal?.splitNo}
        onSaved={handleDispatchSaved}
      />
      <BrokerDispatchModal
        open={dispatchModal?.kind === 'broker'}
        onClose={closeDispatchModal}
        loadId={loadId}
        leg={dispatchModal?.leg}
        splitNo={dispatchModal?.splitNo}
        loadStops={activeDispatchGroupStops}
        locations={locations}
        onSaved={handleDispatchSaved}
      />

      <DocumentsModal
        open={documentsOpen}
        onClose={() => setDocumentsOpen(false)}
        loadId={loadId}
        loadNumber={form.loadNumber}
      />
      <NotesModal
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        loadId={loadId}
        loadNumber={form.loadNumber}
      />
      <SendRateConModal
        open={!!rateConTarget}
        onClose={() => setRateConTarget(null)}
        loadId={loadId}
        loadNumber={form.loadNumber}
        assignmentId={rateConTarget?.assignmentId}
        dispatchCarrierName={rateConTarget?.carrierName}
      />
      <LoadHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        loadId={loadId}
        loadNumber={form.loadNumber}
      />

      {completePrompt && (
        <Modal
          open
          onClose={() => setCompletePrompt(null)}
          title="Complete Tracking Status"
          subtitle={`Split ${completePrompt.leg.splitNo}`}
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCompletePrompt(null)}>Cancel</Button>
              <Button onClick={submitCompletePrompt}>Save</Button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DateTimeField
              label="Complete In Time"
              required
              hint="When the driver checked in for completion"
              value={completePrompt.completeDt}
              onChange={(v) => setCompletePrompt((p) => ({ ...p, completeDt: v }))}
            />
            <DateTimeField
              label="Complete Out Time"
              required
              hint="When the driver checked out"
              value={completePrompt.completeOutDt}
              onChange={(v) => setCompletePrompt((p) => ({ ...p, completeOutDt: v }))}
            />
          </div>
        </Modal>
      )}
    </>
  )
}
