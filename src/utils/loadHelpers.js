export function getCustomer(load, customers) {
  return customers.find((c) => c.id === load.customerId)
}

export function getPickupStop(load) {
  return load.stops.find((s) => s.stopType === 'Pickup') || load.stops[0]
}

export function getDeliveryStop(load) {
  return [...load.stops].reverse().find((s) => s.stopType === 'Delivery') || load.stops[load.stops.length - 1]
}

export function getLocationLabel(locationId, locations) {
  const loc = locations.find((l) => l.id === locationId)
  if (!loc) return '—'
  return `${loc.city}, ${loc.state}`
}

export function getStopCity(load, stopType, locations) {
  const stop = stopType === 'Pickup' ? getPickupStop(load) : getDeliveryStop(load)
  if (!stop?.locationId) return '—'
  return getLocationLabel(stop.locationId, locations)
}

// "Active" leg — same rule as the reference Loadx-Youngs-Frontend's
// LoadDetailDrawer summaryResources: the first leg (in split_no order) that
// hasn't reached Completed(13) yet, or the last leg if every leg is already
// Completed. Mirrors t_erp_backend's loadAssignments.service.js
// syncLoadStatus, which rolls loads.tracking_status_type_id up from this
// same leg — so the Dashboard/Loads-list tracking badge, this leg's
// driver/vehicle/trailer/carrier, and the drawer's top bar always agree on
// which leg is "current".
export function getActiveLeg(load) {
  const legs = [...(load.assignments || [])].sort((a, b) => (a.splitNo || 1) - (b.splitNo || 1))
  if (!legs.length) return null
  return legs.find((l) => l.trackingStatusId !== '13') || legs[legs.length - 1]
}

// Vehicle/Driver/Trailer/Carrier only ever show real values once the load
// has actually left the yard — matches the reference's statusAllowsDisplay
// gate (trip_status_type_id in [Scheduled, Completed, In Transit]). Every
// other trip status (Open, In Pickup Yard, Complete To NU, Cancelled,
// Dropped) shows "—"/"Unassigned" for these fields even if a leg exists,
// e.g. a Dropped leg's driver isn't "the load's driver" once it's handed off
// — the next leg hasn't been assigned one yet.
const LEG_DISPLAY_TRIP_STATUSES = ['6', '7', '10']
function legDisplayAllowed(load) {
  return LEG_DISPLAY_TRIP_STATUSES.includes(load.tripStatusId)
}

export function getCarrierDriverLabel(load, carriers, drivers) {
  if (!legDisplayAllowed(load)) return 'Unassigned'
  const leg = getActiveLeg(load)
  if (!leg) return 'Unassigned'
  const carrier = carriers.find((c) => c.id === leg.carrierId)
  const driver = drivers.find((d) => d.id === leg.driverId1)
  const driverLabel = driver ? `${driver.firstName} ${driver.lastName}` : leg.driverName
  return `${carrier?.name || '—'}${driverLabel ? ' · ' + driverLabel : ''}`
}

export function getCarrierLabel(load, carriers) {
  if (!legDisplayAllowed(load)) return '—'
  const leg = getActiveLeg(load)
  if (!leg) return '—'
  return carriers.find((c) => c.id === leg.carrierId)?.name || '—'
}

export function getDriverLabel(load, drivers) {
  if (!legDisplayAllowed(load)) return '—'
  const leg = getActiveLeg(load)
  if (!leg) return '—'
  const driver = drivers.find((d) => d.id === leg.driverId1)
  return (driver ? `${driver.firstName} ${driver.lastName}` : leg.driverName) || '—'
}

export function getVehicleLabel(load, vehicles) {
  if (!legDisplayAllowed(load)) return '—'
  const leg = getActiveLeg(load)
  if (!leg) return '—'
  const vehicle = vehicles.find((v) => v.id === leg.vehicleId)
  return vehicle?.regNumber || leg.vehicleNo || '—'
}

export function getTrailerLabel(load, trailers) {
  if (!legDisplayAllowed(load)) return '—'
  const leg = getActiveLeg(load)
  if (!leg) return '—'
  const trailer = trailers.find((t) => t.id === leg.trailerId)
  return trailer?.name || leg.trailerNo || '—'
}

// Dispatcher is NOT gated by trip status (matches the reference — a
// dispatcher name is a record of who dispatched the leg, not a live
// operational field, so it stays visible even after the load drops/cancels).
export function getDispatcherLabel(load, users) {
  const leg = getActiveLeg(load)
  if (!leg?.dispatcherId) return '—'
  return users.find((u) => u.id === leg.dispatcherId)?.fullName || '—'
}

// Number of legs (split_no groups) a load has been dispatched into — 0 means
// not yet dispatched, 1 means a normal (non-split) dispatch, 2+ means split.
export function getSplitCount(load) {
  return load.assignments?.length || 0
}

// --- Dashboard column helpers — mirror the reference Loadx-Youngs-Frontend
// Dashboard's 39-column set (see t_erp_frontend/src/pages/Dashboard.jsx).
// t_erp has no load-level "shipper"/"consignee" concept — those are derived
// from the first Pickup stop and last Delivery stop's location, same as the
// existing getStopCity/getPickupStop/getDeliveryStop pattern above.

export function getShipperLocation(load, locations) {
  const stop = getPickupStop(load)
  return stop?.locationId ? locations.find((l) => l.id === stop.locationId) : null
}
export function getConsigneeLocation(load, locations) {
  const stop = getDeliveryStop(load)
  return stop?.locationId ? locations.find((l) => l.id === stop.locationId) : null
}

export function getRouteLabel(load, locations) {
  const origin = getShipperLocation(load, locations)
  const dest = getConsigneeLocation(load, locations)
  const originLabel = origin ? `${origin.city}, ${origin.state}` : '—'
  const destLabel = dest ? `${dest.city}, ${dest.state}` : '—'
  if (!origin && !dest) return '—'
  return `${originLabel} → ${destLabel}`
}

// Number of Delivery-type stops — t_erp has no literal "drop_count" column,
// this is the direct equivalent (one row per drop).
export function getDropCount(load) {
  return load.stops.filter((s) => s.stopType === 'Delivery').length
}

function typeLabel(typeOptions, typeId, value) {
  if (!value) return ''
  return (typeOptions[typeId] || []).find((o) => o.id === value)?.label || ''
}

// "Pickup Type"/"Delivery Type" in the reference map to a live/drop action
// on the stop — t_erp's closest real column is load_stops.stop_action_id
// (type_master type_id=19, e.g. "Live Load" / "Hook Trailer").
export function getPickupType(load, typeOptions) {
  return typeLabel(typeOptions, 19, getPickupStop(load)?.stopActionId) || '—'
}
export function getDeliveryType(load, typeOptions) {
  return typeLabel(typeOptions, 19, getDeliveryStop(load)?.stopActionId) || '—'
}
export function getPickupQty(load) {
  return getPickupStop(load)?.qty ?? '—'
}
export function getPickupQtyType(load, typeOptions) {
  return typeLabel(typeOptions, 20, getPickupStop(load)?.qtyTypeId) || '—'
}
export function getDeliveryQty(load) {
  return getDeliveryStop(load)?.qty ?? '—'
}
export function getDeliveryQtyType(load, typeOptions) {
  return typeLabel(typeOptions, 20, getDeliveryStop(load)?.qtyTypeId) || '—'
}

// "Rate Con Number" in the reference is a load-level customer reference —
// t_erp's customer_ref column lives per-stop, not per-load, so this uses
// whichever stop set it first.
export function getRateConNumber(load) {
  return load.stops.find((s) => s.customerRef)?.customerRef || '—'
}

// Reefer temperature — per-stop in this schema (load_stops.temp_value), no
// single load-level value; shows the first stop that has one set.
export function getTemperature(load) {
  const stop = load.stops.find((s) => s.tempValue !== '' && s.tempValue != null)
  return stop ? stop.tempValue : '—'
}

export function getCreatedByLabel(load, users) {
  return users.find((u) => u.id === load.createdByUserId)?.fullName || '—'
}

// "Share" in the reference generates a public link for the load itself. The
// closest real equivalent here is the public rate-confirm link (see
// t_erp_backend's erate.routes.js) — it's scoped to one dispatched EXTERNAL
// leg, not the load as a whole, so this pairs the load's token with its
// first external assignment. Returns null (no shareable link yet) until the
// load has been broker-dispatched at least once.
export function getShareLink(load) {
  const externalLeg = load.assignments?.find((a) => a.isExternal)
  if (!externalLeg || !load.token) return null
  return `${window.location.origin}/rate-confirm/${load.token}/${externalLeg.id}`
}

export function formatCurrency(value) {
  if (value === '' || value === null || value === undefined) return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function formatTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
