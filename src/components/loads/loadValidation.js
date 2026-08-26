import { isReeferVanType } from './stopHelpers'

// Required-field rules matching the reference Loadx-Youngs-Frontend's
// LoadCreateModal.handleSave / validateStopTimings exactly (see
// LoadCreateModal.jsx lines 691-787, 1484-1546) — shared between
// CreateLoadModal and LoadEditDrawer so both forms enforce the same fields.
// Deliberately NOT required (confirmed against the reference, which leaves
// these optional too): commodity, weight/qty, equipment/van type itself
// (only conditionally required via reefer temp below), rate/target rate,
// length, declared value, hazmat fields, tarp.
export function validateLoadForm(form) {
  const errors = { stopErrors: {} }
  if (!form.customerId) errors.customerId = 'Customer is required'
  if (!form.customerRef?.trim()) errors.customerRef = 'Customer Ref # is required'
  if (form.rate.primaryFee === '' || form.rate.primaryFee == null) errors.primaryFee = 'Primary Fee is required'
  if (!form.rate.feeTypeId) errors.feeType = 'Fee Type is required'
  if (!form.parties.bookingAuthorityId) errors.bookingAuthority = 'Booking Authority is required'
  if (!form.parties.salesAgentId) errors.salesAgent = 'Sales Agent is required'

  const isReefer = isReeferVanType(form.equipment.vanTypeId)

  let hasPickup = false
  let hasDelivery = false
  form.stops.forEach((s) => {
    if (s.stopType === 'Pickup') hasPickup = true
    if (s.stopType === 'Delivery') hasDelivery = true
    const se = {}
    if (!s.locationId) se.locationId = 'Required'
    if (!s.startDate) se.startDate = 'Required'
    if (s.endDate && s.startDate && s.endDate < s.startDate) se.endDate = 'End Date must be on/after Start Date'
    // Start/End Time only required when both Appointment + Scheduled toggles
    // are on — matches the reference's validateStopTimings.
    if (s.appointmentRequired && s.scheduled) {
      if (!s.startTime) se.startTime = 'Required'
      if (!s.endTime) se.endTime = 'Required'
    }
    // Reefer temp is only required once this stop actually has a Reefer Mode
    // picked (a dispatcher can set one even on a non-reefer-flagged van) and
    // that mode isn't explicitly Off — a reefer-flagged van with no mode
    // chosen yet shouldn't force a temperature.
    if (s.reeferModeId && s.reeferModeId !== '4' && (s.tempValue === '' || s.tempValue == null)) {
      se.tempValue = 'Required'
    }
    if (Object.keys(se).length) errors.stopErrors[s.id] = se
  })
  if (!hasPickup || !hasDelivery) errors.stops = 'At least 1 pickup and 1 delivery stop are required'

  const valid =
    !errors.customerId &&
    !errors.customerRef &&
    !errors.primaryFee &&
    !errors.feeType &&
    !errors.bookingAuthority &&
    !errors.salesAgent &&
    !errors.stops &&
    Object.keys(errors.stopErrors).length === 0

  return { errors, valid, isReefer }
}
