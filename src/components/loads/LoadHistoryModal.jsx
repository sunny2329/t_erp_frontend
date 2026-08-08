import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Plus, Pencil, Send, RefreshCw, XCircle, FileText, FileCheck2, Trash2,
  MessageSquare, Mail, CheckCircle2, ChevronDown, ChevronUp, History,
} from 'lucide-react'
import { Modal } from '../ui/Modal'
import { useData } from '../../context/DataContext'
import { historyApi } from '../../services/historyApi'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/loadHelpers'

// Must stay in sync with t_erp_backend/src/services/events.service.js
// EVENT_TYPES — this is a from-scratch vocabulary for this app (not a port
// of the reference Loadx-Youngs-Frontend's type_master(34) ids), so icon/
// color/label live together here rather than being looked up from a shared
// master-data table neither side actually needs.
const EVENT_CONFIG = {
  1: { icon: Plus, color: 'emerald' },
  2: { icon: Pencil, color: 'amber' },
  16: { icon: Send, color: 'indigo' },
  17: { icon: RefreshCw, color: 'indigo' },
  18: { icon: XCircle, color: 'red' },
  19: { icon: FileText, color: 'blue' },
  20: { icon: Trash2, color: 'red' },
  21: { icon: MessageSquare, color: 'purple' },
  22: { icon: Pencil, color: 'purple' },
  23: { icon: Trash2, color: 'red' },
  24: { icon: FileCheck2, color: 'blue' },
  25: { icon: Mail, color: 'teal' },
  26: { icon: CheckCircle2, color: 'emerald' },
  27: { icon: XCircle, color: 'red' },
}
const DEFAULT_CONFIG = { icon: History, color: 'slate' }

// Snapshot field-label/ref maps — a "snapshot" (create/delete events) is
// just the raw picked columns with no labels attached, unlike `changes`
// (edit events via diffObjects), which already carries label+ref per
// entry. These MUST mirror the backend field-meta objects that produced
// each snapshot exactly: loads.service.js LOAD_FIELD_META/STOP_FIELD_META,
// loadAssignments.service.js ASSIGNMENT_FIELD_META, and the ad-hoc inline
// snapshots in documents.controller.js/notes.controller.js/pdf.service.js/
// rateConSend.controller.js/erate.service.js.
const LOAD_SNAPSHOT_META = {
  customer_id: { label: 'Customer', ref: 'customer' },
  trip_status_type_id: { label: 'Load Status', ref: 'type:34' },
  load_dt: { label: 'Load Date', ref: 'date' },
  primary_fee: { label: 'Primary Fee', ref: 'currency' },
  fee_type_id: { label: 'Fee Type', ref: 'type:24' },
  tendered_miles: { label: 'Tendered Miles' },
  fuel_surcharge_type_id: { label: 'Fuel Surcharge Type', ref: 'type:25' },
  fuel_surcharge: { label: 'Fuel Surcharge', ref: 'currency' },
  target_rate: { label: 'Target Rate', ref: 'currency' },
  declared_value: { label: 'Declared Value', ref: 'currency' },
  van_type_id: { label: 'Van / Equipment Type', ref: 'type:7' },
  length: { label: 'Length (ft)' },
  weight: { label: 'Weight (lbs)' },
  commodity: { label: 'Commodity' },
  is_hazmat: { label: 'Hazmat', ref: 'boolean' },
  hazmat_type_id: { label: 'Hazmat Type', ref: 'type:28' },
  is_tarp_required: { label: 'Tarp Required', ref: 'boolean' },
  booking_authority_id: { label: 'Booking Authority', ref: 'carrier' },
  brokerage_agent_id: { label: 'Brokerage Agent', ref: 'user' },
  sales_agent_id: { label: 'Sales Agent', ref: 'user' },
  booking_terminal_id: { label: 'Booking Terminal', ref: 'terminal' },
  customer_load_notes: { label: 'Customer Load Notes' },
  dispatch_notes: { label: 'Dispatch Notes' },
}

const STOP_SNAPSHOT_META = {
  stop_type_id: { label: 'Stop Type', ref: 'stopType' },
  shipper_id: { label: 'Location', ref: 'location' },
  start_dt: { label: 'Start', ref: 'datetime' },
  end_dt: { label: 'End', ref: 'datetime' },
  pickup_number: { label: 'Pickup #' },
  po_number: { label: 'PO #' },
  shipment_bol_number: { label: 'BOL #' },
  total_qty: { label: 'Qty' },
  qty_type_id: { label: 'Qty Type', ref: 'type:20' },
  total_weight: { label: 'Weight' },
  commodity: { label: 'Commodity' },
  instructions: { label: 'Instructions' },
}

const ASSIGNMENT_SNAPSHOT_META = {
  dispatch_carrier_id: { label: 'Carrier', ref: 'carrier' },
  tracking_status_type_id: { label: 'Tracking Status', ref: 'type:46' },
  driver_id1: { label: 'Primary Driver', ref: 'driver' },
  driver_id2: { label: 'Secondary Driver', ref: 'driver' },
  vehicle_id: { label: 'Vehicle', ref: 'vehicle' },
  trailer_id: { label: 'Trailer', ref: 'trailer' },
  dispatcher_id: { label: 'Dispatcher', ref: 'user' },
  dispatch_start_dt: { label: 'Dispatch Start', ref: 'datetime' },
  dispatch_end_dt: { label: 'Dispatch End', ref: 'datetime' },
  complete_dt: { label: 'Complete In Time', ref: 'datetime' },
  complete_out_dt: { label: 'Complete Out Time', ref: 'datetime' },
  driver_name: { label: 'Driver Name' },
  driver_phone: { label: 'Driver Phone' },
  vehicle_no: { label: 'Vehicle #' },
  trailer_no: { label: 'Trailer #' },
  is_external: { label: 'Dispatch Type', ref: 'dispatchType' },
}

const DOCUMENT_SNAPSHOT_META = {
  doc_name: { label: 'Document Name' },
  doc_type_id: { label: 'Document Type', ref: 'type:23' },
  doc_url: { label: 'File' },
}

const NOTE_SNAPSHOT_META = {
  notes: { label: 'Note Text' },
}

const RATE_CON_SENT_SNAPSHOT_META = {
  to: { label: 'Sent To' },
  cc: { label: 'CC' },
  assignmentId: { label: 'Assignment' },
}

const RATE_CON_RESPONSE_SNAPSHOT_META = {
  splitNo: { label: 'Split #' },
  driverName: { label: 'Driver Name' },
  driverPhone: { label: 'Driver Phone' },
  vehicleNo: { label: 'Vehicle #' },
  trailerNo: { label: 'Trailer #' },
}

// eventTypeId -> which snapshot meta produced that event's create/delete
// snapshot (see t_erp_backend events.service.js EVENT_TYPES).
const SNAPSHOT_META_BY_EVENT = {
  1: LOAD_SNAPSHOT_META,
  16: ASSIGNMENT_SNAPSHOT_META,
  18: ASSIGNMENT_SNAPSHOT_META,
  19: DOCUMENT_SNAPSHOT_META,
  20: DOCUMENT_SNAPSHOT_META,
  21: NOTE_SNAPSHOT_META,
  23: NOTE_SNAPSHOT_META,
  25: RATE_CON_SENT_SNAPSHOT_META,
  26: RATE_CON_RESPONSE_SNAPSHOT_META,
  27: RATE_CON_RESPONSE_SNAPSHOT_META,
}

const COLOR_CLASSES = {
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300',
  teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300',
  slate: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

// Turns a raw stored value (id, code, ISO string, ...) into what the user
// should actually see, using the `ref` hint the backend attaches to each
// diff/snapshot field — resolved here against master data this app already
// has loaded for every other page (DataContext), rather than the backend
// doing extra joins per event (see events.service.js's comment on this).
function resolveValue(ref, value, ctx) {
  if (value === null || value === undefined || value === '') return '—'
  if (!ref) return String(value)
  if (ref.startsWith('type:')) {
    const typeId = Number(ref.slice(5))
    return (ctx.typeOptions[typeId] || []).find((o) => o.id === String(value))?.label || String(value)
  }
  const byId = (list) => list.find((r) => r.id === String(value))
  switch (ref) {
    case 'customer': return byId(ctx.customers)?.name || `#${value}`
    case 'carrier': return byId(ctx.carriers)?.name || `#${value}`
    case 'driver': { const d = byId(ctx.drivers); return d ? `${d.firstName} ${d.lastName}`.trim() : `#${value}` }
    case 'vehicle': return byId(ctx.vehicles)?.regNumber || `#${value}`
    case 'trailer': return byId(ctx.trailers)?.name || `#${value}`
    case 'user': return byId(ctx.users)?.fullName || `#${value}`
    case 'terminal': return byId(ctx.terminals)?.name || `#${value}`
    case 'location': return byId(ctx.locations)?.name || `#${value}`
    case 'currency': return formatCurrency(value)
    case 'date': return formatDate(value)
    case 'datetime': return formatDateTime(value)
    case 'boolean': return value === true || value === 'true' || value === '1' ? 'Yes' : 'No'
    case 'stopType': return Number(value) === 2 ? 'Delivery' : 'Pickup'
    case 'dispatchType': return value === true || value === 'true' ? 'Broker' : 'Company'
    default: return String(value)
  }
}

function DiffRow({ label, oldValue, newValue }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b border-slate-100 py-1.5 text-xs last:border-0 dark:border-slate-800/60">
      <div className="font-medium text-slate-500 dark:text-slate-400">{label}</div>
      <div className="truncate text-red-500 line-through decoration-red-300">{oldValue}</div>
      <div className="truncate font-medium text-emerald-600 dark:text-emerald-400">{newValue}</div>
    </div>
  )
}

function SnapshotGrid({ snapshot, ctx, fieldMeta }) {
  const entries = Object.entries(snapshot).filter(([, v]) => v !== null && v !== '')
  if (!entries.length) return <p className="text-xs text-slate-400">No details recorded.</p>
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-3">
      {entries.map(([key, value]) => (
        <div key={key} className="min-w-0">
          <p className="text-[10px] font-semibold uppercase text-slate-400">{fieldMeta?.[key]?.label || key}</p>
          <p className="truncate text-slate-700 dark:text-slate-200">{resolveValue(fieldMeta?.[key]?.ref, value, ctx)}</p>
        </div>
      ))}
    </div>
  )
}

const STOP_CHANGE_LABEL = { added: 'Stop Added', removed: 'Stop Removed', modified: 'Stop Modified' };
const STOP_CHANGE_COLOR = {
  added: 'text-emerald-600 dark:text-emerald-400',
  removed: 'text-red-500',
  modified: 'text-amber-600 dark:text-amber-400',
};

function StopChangeBlock({ change, ctx }) {
  const [open, setOpen] = useState(false)
  const stopLabel = `${change.stopType === 2 ? 'Delivery' : 'Pickup'} · Seq ${change.seqNo ?? '—'}`
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-2.5 py-1.5 text-xs"
      >
        <span>
          <span className={`font-semibold ${STOP_CHANGE_COLOR[change.type]}`}>{STOP_CHANGE_LABEL[change.type]}</span>
          <span className="ml-2 text-slate-500 dark:text-slate-400">{stopLabel}</span>
        </span>
        {open ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
      </button>
      {open && (
        <div className="border-t border-slate-100 px-2.5 py-2 dark:border-slate-800/60">
          {change.changes
            ? change.changes.map((c) => <DiffRow key={c.field} label={c.label} oldValue={resolveValue(c.ref, c.oldValue, ctx)} newValue={resolveValue(c.ref, c.newValue, ctx)} />)
            : <SnapshotGrid snapshot={change.snapshot} ctx={ctx} fieldMeta={STOP_SNAPSHOT_META} />}
        </div>
      )}
    </div>
  )
}

function EventCard({ event, ctx }) {
  const [expanded, setExpanded] = useState(false)
  const config = EVENT_CONFIG[event.eventTypeId] || DEFAULT_CONFIG
  const Icon = config.icon
  const changes = event.newValue?.changes
  const stopChanges = event.newValue?.stopChanges
  const createSnapshot = event.newValue?.snapshot
  const deleteSnapshot = event.oldValue?.snapshot
  const hasDetails = (changes && changes.length) || (stopChanges && stopChanges.length) || createSnapshot || deleteSnapshot

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${COLOR_CLASSES[config.color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="mt-1 w-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="min-w-0 flex-1 pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{event.label}</p>
          <p className="text-[11px] text-slate-400">{formatDateTime(event.addtime)} · {event.addedBy}</p>
        </div>
        {event.remark && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{event.remark}</p>}

        {hasDetails && (
          <>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? 'Hide details' : 'View details'}
            </button>
            {expanded && (
              <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/30">
                {changes && changes.length > 0 && (
                  <div>
                    {changes.map((c) => (
                      <DiffRow key={c.field} label={c.label} oldValue={resolveValue(c.ref, c.oldValue, ctx)} newValue={resolveValue(c.ref, c.newValue, ctx)} />
                    ))}
                  </div>
                )}
                {stopChanges && stopChanges.length > 0 && (
                  <div className="space-y-1.5">
                    {stopChanges.map((sc, i) => <StopChangeBlock key={i} change={sc} ctx={ctx} />)}
                  </div>
                )}
                {createSnapshot && <SnapshotGrid snapshot={createSnapshot} ctx={ctx} fieldMeta={SNAPSHOT_META_BY_EVENT[event.eventTypeId]} />}
                {deleteSnapshot && <SnapshotGrid snapshot={deleteSnapshot} ctx={ctx} fieldMeta={SNAPSHOT_META_BY_EVENT[event.eventTypeId]} />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Read-only load audit trail — every mutation (create/edit, dispatch create/
// update/remove, document upload/delete, PDF generation, note add/update/
// delete, rate-con send/accept/reject) is logged server-side with a
// field-level diff; this just renders it as a timeline. No edit/undo
// affordance anywhere, by design (see t_erp_backend README's Load History
// section for why this is a from-scratch design rather than a port of the
// reference project's history feature).
export function LoadHistoryModal({ open, onClose, loadId, loadNumber }) {
  const ctx = useData()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !loadId) return
    setLoading(true)
    historyApi
      .get(loadId)
      .then(setHistory)
      .catch((err) => toast.error(err.message || 'Failed to load history'))
      .finally(() => setLoading(false))
  }, [open, loadId])

  return (
    <Modal open={open} onClose={onClose} title="Load History" subtitle={loadNumber ? `Load ${loadNumber}` : undefined} size="xl">
      <div>
        {loading && <p className="py-8 text-center text-sm text-slate-400">Loading history…</p>}
        {!loading && history.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No history yet.</p>}
        {!loading && history.map((event) => <EventCard key={event.id} event={event} ctx={ctx} />)}
      </div>
    </Modal>
  )
}
