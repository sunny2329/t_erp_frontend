// Trip status (loads.trip_status_type_id, type_master type_id=34) and
// tracking status (load_assignments.tracking_status_type_id, type_id=46)
// label lists — kept here in display order for dropdowns/filters/kanban
// columns, matching the label text in services/adapters.js's
// TRIP_STATUS_LABELS/TRACKING_STATUS_LABELS exactly (source of truth for
// the numeric ids is there; these are presentation-order lists).

// The 8 real, manually-selectable trip statuses, in the same order as the
// reference Loadx-Youngs-Frontend's own Load Status dropdown.
export const TRIP_STATUSES = ['Open', 'Scheduled', 'Completed', 'Complete To NU', 'In Pickup Yard', 'In Transit', 'Cancelled', 'Dropped']

// Dispatch board (Dispatch.jsx) columns — mirrors the reference's Kanban
// board exactly: 7 of the 8 trip statuses, "Dropped" excluded (a dropped
// leg is expected to be immediately re-dispatched into a new one rather
// than sit on a board column).
export const KANBAN_TRIP_STATUSES = ['Open', 'Scheduled', 'In Pickup Yard', 'In Transit', 'Completed', 'Complete To NU', 'Cancelled']

export const TRACKING_STATUSES = [
  'En Route', 'At Pickup', 'Loading Started', 'Loading Completed', 'In Transit', 'At Delivery',
  'Unloading Started', 'Unloading Completed', 'Detention Begin', 'Detention Ended',
  'PickUp Completed', 'Delivered', 'Completed',
]

export const FEE_TYPES = ['Flat', 'Per Mile', 'Percentage']

export const FUEL_SURCHARGE_TYPES = ['Flat', 'Per Mile', 'Percentage']

export const EQUIPMENT_TYPES = ['Dry Van 53ft', 'Reefer 48ft', 'Flatbed 48ft', 'Flatbed 53ft', 'Step Deck', 'Power Only']

export const QTY_TYPES = ['Pallets', 'Pieces', 'Boxes', 'Units', 'Tons']

export const PAY_TYPES = ['Flat Fees', 'Per Mile', 'Percentage']

export const NET_TERMS = ['Net 7', 'Net 15', 'Net 30', 'Quick Pay']

export const CUSTOMER_TYPES = ['Shipper', 'Broker', 'Consignee']

export const badgeColor = (status) => {
  const map = {
    // Trip status
    Open: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    Scheduled: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'In Pickup Yard': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'In Transit': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'Complete To NU': 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    Dropped: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    // Tracking status
    'Not Tracking': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    'En Route': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'At Pickup': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    'Loading Started': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'Loading Completed': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'At Delivery': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    'Unloading Started': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'Unloading Completed': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'Detention Begin': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    'Detention Ended': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    'PickUp Completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    Delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    // Generic yes/no + active/inactive badges reused elsewhere
    Yes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    No: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  }
  return map[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}
