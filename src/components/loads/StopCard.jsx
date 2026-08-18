import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Trash2, GripVertical, Copy, Scissors, Pencil, Check } from 'lucide-react'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Toggle } from '../ui/Toggle'
import { SearchSelect } from '../ui/SearchSelect'
import { useData } from '../../context/DataContext'

// type_master(type_id=19) ids — "Live Load"/"Hook Trailer" only make sense
// at a Pickup, "Live Unload"/"Drop Trailer" only at a Delivery.
const PICKUP_STOP_ACTION_IDS = [1, 2]
const DELIVERY_STOP_ACTION_IDS = [3, 4]

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

function SummaryItem({ label, value, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200" title={value || undefined}>{value || '—'}</p>
    </div>
  )
}

function formatStopWindow(stop) {
  if (!stop.stopDate) return '—'
  const time = [stop.startTime, stop.endTime].filter(Boolean).join('–')
  return time ? `${stop.stopDate} · ${time}` : stop.stopDate
}

// Renders as a compact, read-only summary card by default (matching the
// reference Loadx-Youngs-Frontend's PICKUP/DROP stop cards) — the full
// field-by-field editing form (unchanged from before) only shows once
// "Edit" is clicked, or automatically for a brand-new stop (no location
// picked yet) or a stop currently failing validation. This is purely a
// display-mode toggle: onChange/onRemove/onMoveUp/onMoveDown/onSplit and
// every prop below behave exactly as before regardless of which mode is
// showing.
export function StopCard({ stop, index, total, onChange, onRemove, onMoveUp, onMoveDown, locationOptions, onAddLocation, headerCommodity, isReefer, errors = {}, onSplit, showLocationCityState = false }) {
  const { typeOptions } = useData()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [editing, setEditing] = useState(() => !stop.locationId || Object.keys(errors).length > 0)

  // A stop that starts out summarized must still surface validation errors
  // from a later Save attempt — force it back into edit mode when that
  // happens rather than hiding the error behind the collapsed summary.
  useEffect(() => {
    if (Object.keys(errors).length > 0) setEditing(true)
  }, [errors])

  const set = (patch) => onChange({ ...stop, ...patch })
  const selectedLocation = locationOptions.find((o) => o.value === stop.locationId)
  const stopActionOptions = (typeOptions[19] || []).filter((o) =>
    (stop.stopType === 'Pickup' ? PICKUP_STOP_ACTION_IDS : DELIVERY_STOP_ACTION_IDS).includes(Number(o.id)),
  )
  // Start/End Time are only required when both toggles are on — matches the
  // reference Loadx-Youngs-Frontend's validateStopTimings exactly. The temp
  // field shows once the load's equipment is a reefer type OR this stop has
  // its own Reefer Mode picked — a dispatcher can set a stop to a reefer
  // mode even on a non-reefer van — but is only *required* once a mode is
  // actually picked (and isn't explicitly Off, id 4); a reefer-flagged van
  // with no mode chosen yet shouldn't force a temperature.
  const timeRequired = stop.appointmentRequired && stop.scheduled
  const reeferModeActive = isReefer || !!stop.reeferModeId
  const tempRequired = !!stop.reeferModeId && stop.reeferModeId !== '4'

  const headerActions = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setEditing((v) => !v)}
        title={editing ? 'Done editing' : 'Edit stop'}
        className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        {editing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
      </button>
      <button type="button" onClick={onMoveUp} disabled={index === 0} title="Move up" className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800">
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onMoveDown} disabled={index === total - 1} title="Move down" className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800">
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {onSplit && (
        <button
          type="button"
          onClick={onSplit}
          title={stop.stopType === 'Pickup' ? 'Split here — new leg starts after this pickup' : 'Split here — new leg starts before this delivery'}
          className="rounded p-1 text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
        >
          <Scissors className="h-3.5 w-3.5" />
        </button>
      )}
      <button type="button" onClick={onRemove} disabled={total <= 2} title={total <= 2 ? 'At least 1 pickup + 1 delivery required' : 'Remove stop'} className="rounded p-1 text-red-400 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-900/20">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-1.5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <GripVertical className="h-3.5 w-3.5 text-slate-300" />
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              stop.stopType === 'Pickup'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
            }`}
          >
            Stop {index + 1} · {stop.stopType}
          </span>
        </div>
        {headerActions}
      </div>

      {!editing ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 p-3 sm:grid-cols-4">
          <SummaryItem label="Date / Time" value={formatStopWindow(stop)} className="col-span-2" />
          <SummaryItem label="Location" value={selectedLocation ? `${selectedLocation.label}${selectedLocation.sublabel ? ' · ' + selectedLocation.sublabel : ''}` : '—'} className="col-span-2" />
          <SummaryItem label="Pickup #" value={stop.pickupNumber} />
          <SummaryItem label="BOL #" value={stop.bolNumber} />
          <SummaryItem label="PO #" value={stop.poNumber} />
          <SummaryItem label="Qty" value={stop.qty} />
          <SummaryItem label="Weight (lbs)" value={stop.weight} />
          <SummaryItem label="Commodity" value={stop.commodity} className="col-span-2" />
          {stop.instructions && <SummaryItem label="Instructions" value={stop.instructions} className="col-span-2 sm:col-span-4" />}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4">
            <Field label="Stop Type" required>
              <Select value={stop.stopType} onChange={(e) => set({ stopType: e.target.value, stopActionId: '' })}>
                <option value="Pickup">Pickup</option>
                <option value="Delivery">Delivery</option>
              </Select>
            </Field>
            <Field label="Location / Shipper" required error={errors.locationId} className="col-span-2">
              <SearchSelect
                value={stop.locationId}
                onChange={(v) => set({ locationId: v })}
                options={locationOptions}
                placeholder="Select location"
                onAddNew={() => onAddLocation((id) => set({ locationId: id }))}
                addNewLabel="Add location"
                error={errors.locationId}
              />
            </Field>
            {showLocationCityState && (
              <>
                <Field label="City">
                  <Input value={selectedLocation?.city || ''} disabled />
                </Field>
                <Field label="State">
                  <Input value={selectedLocation?.state || ''} disabled />
                </Field>
                <Field label="Zip">
                  <Input value={selectedLocation?.zipCode || ''} disabled />
                </Field>
              </>
            )}

            <Field label="Stop Date" required error={errors.stopDate}>
              <Input type="date" value={stop.stopDate} onChange={(e) => set({ stopDate: e.target.value })} error={errors.stopDate} />
            </Field>
            <Field label="Start Time" required={timeRequired} error={errors.startTime} hint={!timeRequired ? 'Required when Appointment + Scheduled are both on' : undefined}>
              <Input type="time" value={stop.startTime} onChange={(e) => set({ startTime: e.target.value })} error={errors.startTime} />
            </Field>
            <Field label="End Time" required={timeRequired} error={errors.endTime}>
              <Input type="time" value={stop.endTime} onChange={(e) => set({ endTime: e.target.value })} error={errors.endTime} />
            </Field>

            <div className="flex items-center gap-4 sm:col-span-3 lg:col-span-4">
              <Toggle checked={stop.appointmentRequired} onChange={(v) => set({ appointmentRequired: v })} label="Appointment required" />
              <Toggle checked={stop.scheduled} onChange={(v) => set({ scheduled: v })} label="Scheduled" />
            </div>

            <Field label="Qty">
              <Input type="number" value={stop.qty} onChange={(e) => set({ qty: e.target.value })} />
            </Field>
            <Field label="Qty Type">
              <TypeSelect options={typeOptions[20] || []} value={stop.qtyTypeId} onChange={(v) => set({ qtyTypeId: v })} />
            </Field>
            <Field label="Weight (lbs)">
              <Input type="number" value={stop.weight} onChange={(e) => set({ weight: e.target.value })} />
            </Field>
            <Field label="Stop Action">
              <TypeSelect options={stopActionOptions} value={stop.stopActionId} onChange={(v) => set({ stopActionId: v })} />
            </Field>
            <Field label="Reefer Mode">
              <TypeSelect options={typeOptions[21] || []} value={stop.reeferModeId} onChange={(v) => set({ reeferModeId: v })} />
            </Field>
            {reeferModeActive && (
              <Field label="Reefer Temp (°F)" required={tempRequired} error={errors.tempValue}>
                <Input type="number" value={stop.tempValue} onChange={(e) => set({ tempValue: e.target.value })} error={errors.tempValue} />
              </Field>
            )}

            <Field
              label="Commodity"
              className="sm:col-span-3 lg:col-span-4"
              hint={headerCommodity ? undefined : null}
            >
              <div className="flex gap-2">
                <Input value={stop.commodity} onChange={(e) => set({ commodity: e.target.value })} placeholder="Commodity description" />
                {headerCommodity && (
                  <button
                    type="button"
                    title="Copy from header commodity"
                    onClick={() => set({ commodity: headerCommodity })}
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 px-2.5 text-xs text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <Copy className="h-3 w-3" /> Mirror
                  </button>
                )}
              </div>
            </Field>

            <Field label="Pickup #">
              <Input value={stop.pickupNumber} onChange={(e) => set({ pickupNumber: e.target.value })} />
            </Field>
            <Field label="BOL #">
              <Input value={stop.bolNumber} onChange={(e) => set({ bolNumber: e.target.value })} />
            </Field>
            <Field label="PO #">
              <Input value={stop.poNumber} onChange={(e) => set({ poNumber: e.target.value })} />
            </Field>

            <Field label="Instructions / Location notes" className="sm:col-span-3 lg:col-span-4">
              <Input value={stop.instructions} onChange={(e) => set({ instructions: e.target.value })} placeholder="Dock notes, gate codes, contact..." />
            </Field>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Advanced (Seal / Container / Chassis / Customer Trailer / PRO)
              {advancedOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {advancedOpen && (
              <div className="grid grid-cols-2 gap-2 px-3 pb-3 sm:grid-cols-3 lg:grid-cols-5">
                <Field label="Seal #">
                  <Input value={stop.seal} onChange={(e) => set({ seal: e.target.value })} />
                </Field>
                <Field label="Container #">
                  <Input value={stop.container} onChange={(e) => set({ container: e.target.value })} />
                </Field>
                <Field label="Chassis #">
                  <Input value={stop.chassis} onChange={(e) => set({ chassis: e.target.value })} />
                </Field>
                <Field label="Customer Trailer #">
                  <Input value={stop.customerTrailer} onChange={(e) => set({ customerTrailer: e.target.value })} />
                </Field>
                <Field label="PRO #">
                  <Input value={stop.pro} onChange={(e) => set({ pro: e.target.value })} />
                </Field>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
