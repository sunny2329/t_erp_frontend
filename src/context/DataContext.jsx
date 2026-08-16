import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  carriersApi,
  customersApi,
  driversApi,
  vehiclesApi,
  trailersApi,
  locationsApi,
  terminalsApi,
  usersApi,
  pagesApi,
  loadsApi,
} from '../services/masterApi'
import {
  carrierAdapter,
  customerAdapter,
  driverAdapter,
  vehicleAdapter,
  trailerAdapter,
  locationAdapter,
  terminalAdapter,
  userAdapter,
  pageAdapter,
  loadAdapter,
  loadDetailAdapter,
} from '../services/adapters'
import { dropdownApi } from '../services/dropdownApi'

// type_master categories used to drive real dropdowns (see CarrierDrawer).
// type_id=1 (carriers-service_type) has a stray unrelated row (id=39,
// "Driver Safety Master") mixed into it in the live data — filtered out here
// rather than guessed away in every consumer.
// 18/19/20/21/24/25/28/30/46 back Loads/LoadDrawer's stop-type, stop-action,
// qty-type, reefer-mode, fee-type, fuel-surcharge-type, hazmat-type, trip-
// status and tracking-status dropdowns (see ss_save_loads_v1 field mapping).
// 23 is the Load document-type vocabulary (BOL, POD, Invoice, ...) — backs
// DocumentsModal's "Document Type" dropdown (see t_erp_backend/src/services/
// documents.service.js DOC_TYPE_TYPE_ID).
// 34 is loads.trip_status_type_id's vocabulary — shared with event-log
// labels (Load Created, BOL Updated, ...) in the same type_id, so it's
// filtered below to just the 8 ids that are actually valid trip statuses
// (matches the reference Loadx-Youngs-Backend's manual status-change FSM
// allow-list exactly — see LoadEditDrawer.jsx's Load Status field).
// 7 (equipment/trailer van type) had two near-duplicate reefer rows in the
// live data — id 1 "VanReefer" and id 2 "Van or Reefer" — confusing to pick
// between in the dropdown, so both are filtered out here in favor of the
// plain "Dry Van" (id 39) / "Reefer" (id 40) rows added specifically to
// replace them. Old loads whose van_type_id still points at 1 or 2 keep
// working (the id itself isn't touched, just hidden from new picks) —
// stopHelpers.js's isReeferVanType still recognizes ids 1/2/40 as reefer,
// so a stale record's Reefer Mode/Temp fields don't disappear.
const TYPE_CATEGORIES = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 14, 17, 18, 19, 20, 21, 23, 24, 25, 28, 30, 34, 46]
const TRIP_STATUS_IDS = [5, 6, 7, 8, 9, 10, 11, 13]
const TYPE_CATEGORY_FILTERS = { 1: (row) => row.id <= 3, 7: (row) => row.id !== 1 && row.id !== 2, 34: (row) => TRIP_STATUS_IDS.includes(row.id) }

// A handful of type_master descriptions were seeded with literal HTML
// entities (e.g. "Empty &amp; Ready with Driver") instead of the character
// itself — decode the common ones so labels render correctly everywhere.
const HTML_ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&#39;': "'", '&quot;': '"' }
const decodeEntities = (s) => String(s ?? '').replace(/&amp;|&lt;|&gt;|&#39;|&quot;/g, (m) => HTML_ENTITIES[m])

const DataContext = createContext(null)

// Every master, including Loads and dispatch/split (load_assignments — see
// loadAssignmentsApi in services/dispatchApi.js, used directly by
// CompanyDispatchModal/BrokerDispatchModal), is real, live data from the
// Postgres-backed API. Nothing here is a local-only overlay anymore.
function makeMasterResource(api, adapter, setState) {
  return {
    add: async (form) => {
      const created = await api.create(adapter.toApi(form, { isCreate: true }))
      const normalized = adapter.fromApi(created)
      setState((prev) => [normalized, ...prev])
      return normalized
    },
    update: async (id, form) => {
      const updated = await api.update(id, adapter.toApi(form, { isCreate: false }))
      const normalized = adapter.fromApi(updated)
      setState((prev) => prev.map((r) => (r.id === id ? normalized : r)))
      return normalized
    },
    remove: async (id) => {
      await api.remove(id)
      setState((prev) => prev.filter((r) => r.id !== id))
    },
  }
}

export function DataProvider({ children }) {
  const { isAuthenticated } = useAuth()

  const [customers, setCustomers] = useState([])
  const [carriers, setCarriers] = useState([])
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [trailers, setTrailers] = useState([])
  const [locations, setLocations] = useState([])
  const [terminals, setTerminals] = useState([])
  const [users, setUsers] = useState([])
  const [pages, setPages] = useState([])
  const [typeOptions, setTypeOptions] = useState({})
  const [loads, setLoads] = useState([])

  const [mastersLoading, setMastersLoading] = useState(false)
  const [mastersError, setMastersError] = useState(null)

  const fetchAll = useCallback(async () => {
    setMastersLoading(true)
    setMastersError(null)
    try {
      const [c, car, d, v, t, loc, term, u, pg, ld, ...typeResults] = await Promise.all([
        customersApi.list(),
        carriersApi.list(),
        driversApi.list(),
        vehiclesApi.list(),
        trailersApi.list(),
        locationsApi.list(),
        terminalsApi.list(),
        usersApi.list(),
        pagesApi.list(),
        loadsApi.list(),
        ...TYPE_CATEGORIES.map((typeId) => dropdownApi.getTypes(typeId)),
      ])
      setCustomers(c.rows.map(customerAdapter.fromApi))
      setCarriers(car.rows.map(carrierAdapter.fromApi))
      setDrivers(d.rows.map(driverAdapter.fromApi))
      setVehicles(v.rows.map(vehicleAdapter.fromApi))
      setTrailers(t.rows.map(trailerAdapter.fromApi))
      setLocations(loc.rows.map(locationAdapter.fromApi))
      setTerminals(term.rows.map(terminalAdapter.fromApi))
      setUsers(u.rows.map(userAdapter.fromApi))
      setPages(pg.rows.map(pageAdapter.fromApi))
      setLoads(ld.rows.map(loadAdapter.fromApi))
      setTypeOptions(
        Object.fromEntries(
          TYPE_CATEGORIES.map((typeId, i) => {
            const filter = TYPE_CATEGORY_FILTERS[typeId]
            const rows = filter ? typeResults[i].filter(filter) : typeResults[i]
            return [typeId, rows.map((r) => ({ id: r.id, label: decodeEntities(r.description) }))]
          }),
        ),
      )
    } catch (err) {
      setMastersError(err.message || 'Failed to load master data')
    } finally {
      setMastersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) fetchAll()
  }, [isAuthenticated, fetchAll])

  const loadsCrud = {
    add: async (form) => {
      const created = await loadsApi.create(loadDetailAdapter.toApi(form))
      setLoads((prev) => [loadAdapter.fromApi(created), ...prev])
      return loadDetailAdapter.fromApi(created)
    },
    update: async (id, form) => {
      const updated = await loadsApi.update(id, loadDetailAdapter.toApi(form))
      setLoads((prev) => prev.map((r) => (r.id === id ? loadAdapter.fromApi(updated) : r)))
      return loadDetailAdapter.fromApi(updated)
    },
  }

  const value = {
    mastersLoading,
    mastersError,
    refetchMasters: fetchAll,

    customers,
    customersCrud: makeMasterResource(customersApi, customerAdapter, setCustomers),
    carriers,
    carriersCrud: makeMasterResource(carriersApi, carrierAdapter, setCarriers),
    drivers,
    driversCrud: makeMasterResource(driversApi, driverAdapter, setDrivers),
    vehicles,
    vehiclesCrud: makeMasterResource(vehiclesApi, vehicleAdapter, setVehicles),
    trailers,
    trailersCrud: makeMasterResource(trailersApi, trailerAdapter, setTrailers),
    locations,
    locationsCrud: makeMasterResource(locationsApi, locationAdapter, setLocations),
    terminals,
    terminalsCrud: makeMasterResource(terminalsApi, terminalAdapter, setTerminals),
    users,
    usersCrud: makeMasterResource(usersApi, userAdapter, setUsers),
    pages,
    typeOptions,

    loads,
    loadsCrud,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
