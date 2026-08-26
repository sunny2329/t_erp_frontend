// type_master(type_id=7) ids whose description contains "Reefer" — the
// reference Loadx-Youngs-Frontend hard-requires a per-stop temp once the
// load's equipment type is a reefer variant (its own single id 40, which is
// also the id our replacement "Reefer" row uses — see DataContext.jsx).
// 1/2 ("VanReefer"/"Van or Reefer") are the two old reefer variants that are
// no longer offered in the dropdown but can still exist on old loads.
const REEFER_VAN_TYPE_IDS = ['1', '2', '40']
export function isReeferVanType(vanTypeId) {
  return REEFER_VAN_TYPE_IDS.includes(vanTypeId)
}

// Shared between CreateLoadModal and LoadEditDrawer.
export function blankStop(stopType, sequence, splitNo = 1, isSplitLoad = false) {
  return {
    id: `new-${crypto.randomUUID()}`,
    stopType,
    sequence,
    splitNo,
    isSplitLoad,
    locationId: '',
    customerRef: '',
    appointmentRequired: false,
    scheduled: false,
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    qty: '',
    qtyTypeId: '',
    weight: '',
    commodity: '',
    pickupNumber: '',
    bolNumber: '',
    poNumber: '',
    instructions: '',
    stopActionId: '',
    reeferModeId: '',
    tempValue: '',
    seal: '',
    container: '',
    chassis: '',
    customerTrailer: '',
    pro: '',
  }
}
