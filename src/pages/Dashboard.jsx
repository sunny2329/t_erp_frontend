import { useMemo, useState } from 'react'
import { Plus, Package, Truck, CheckCircle2, XCircle, Filter, Link2, Copy, Columns3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useData } from '../context/DataContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { DataTable } from '../components/ui/DataTable'
import { ColumnManager } from '../components/ui/ColumnManager'
import { LoadDrawer } from '../components/loads/LoadDrawer'
import { LoadsFilterPanel, defaultLoadsFilters, hasActiveLoadsFilters } from '../components/loads/LoadsFilterPanel'
import { useColumnPrefs } from '../hooks/useColumnPrefs'
import {
  getCustomer,
  getPickupStop,
  getDeliveryStop,
  getCarrierLabel,
  getDriverLabel,
  getDispatcherLabel,
  getVehicleLabel,
  getTrailerLabel,
  getSplitCount,
  getRouteLabel,
  getShipperLocation,
  getConsigneeLocation,
  getDropCount,
  getPickupType,
  getDeliveryType,
  getPickupQty,
  getPickupQtyType,
  getDeliveryQty,
  getDeliveryQtyType,
  getRateConNumber,
  getTemperature,
  getCreatedByLabel,
  getShareLink,
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../utils/loadHelpers'

// The primary loads table — mirrors the reference Loadx-Youngs-Frontend
// Dashboard's full 39-column set (its `DASHBOARD_COLUMNS`), mapped onto
// this schema's real data wherever a real equivalent exists. Two columns
// have no backing data source at all in this system (AI Validation — no
// ML/validation service; live GPS Tracking — no telematics feed) and are
// kept as honest "Not available" placeholders rather than fabricated, same
// as the reference itself gates them behind external integrations. "Share"
// reuses the real public rate-con link feature (see erate.routes.js) —
// scoped to the load's first externally-dispatched leg, since this system
// has no generic per-load public view unlike the reference's `/load/view`.
// Column search boxes (DataTable's `columnSearch`) replace the reference's
// per-column header filters; Kanban/card views and CSV export are left out,
// matching every other master page in this app (table view only).
export default function Dashboard() {
  const { loads, customers, carriers, drivers, vehicles, trailers, users, locations, typeOptions, mastersLoading, mastersError } = useData()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedLoadId, setSelectedLoadId] = useState(null)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState(() => defaultLoadsFilters())
  const [columnManagerOpen, setColumnManagerOpen] = useState(false)

  const counts = {
    Open: loads.filter((l) => l.tripStatus === 'Open').length,
    Scheduled: loads.filter((l) => l.tripStatus === 'Scheduled').length,
    'In Transit': loads.filter((l) => l.tripStatus === 'In Transit').length,
    Completed: loads.filter((l) => l.tripStatus === 'Completed').length,
    Cancelled: loads.filter((l) => l.tripStatus === 'Cancelled').length,
  }

  // Mirrors the reference Loadx-Youngs-Frontend Dashboard's "Load filters"
  // panel — independent created/pickup/delivery date ranges, pickup-PO-BOL
  // numbers, pickup/delivery state, and driver-vehicle-trailer-carrier —
  // evaluated client-side against the already fully-loaded `loads` array
  // (see LoadsFilterPanel.jsx for why: this app's DataContext fetches every
  // load up front, unlike the reference's paginated server-side fetch, so
  // there's nothing to refetch).
  const panelFiltered = useMemo(() => {
    const f = appliedFilters
    return loads.filter((l) => {
      if (f.createdFromDate || f.createdToDate) {
        const d = (l.createdAt || '').slice(0, 10)
        if (!d) return false
        if (f.createdFromDate && d < f.createdFromDate) return false
        if (f.createdToDate && d > f.createdToDate) return false
      }
      if (f.pickupFromDate || f.pickupToDate) {
        const d = getPickupStop(l)?.stopDate || ''
        if (!d) return false
        if (f.pickupFromDate && d < f.pickupFromDate) return false
        if (f.pickupToDate && d > f.pickupToDate) return false
      }
      if (f.deliveryFromDate || f.deliveryToDate) {
        const d = getDeliveryStop(l)?.stopDate || ''
        if (!d) return false
        if (f.deliveryFromDate && d < f.deliveryFromDate) return false
        if (f.deliveryToDate && d > f.deliveryToDate) return false
      }
      if (f.pickupNo && !l.stops.some((s) => s.pickupNumber?.toLowerCase().includes(f.pickupNo.toLowerCase()))) return false
      if (f.poNo && !l.stops.some((s) => s.poNumber?.toLowerCase().includes(f.poNo.toLowerCase()))) return false
      if (f.bolNo && !l.stops.some((s) => s.bolNumber?.toLowerCase().includes(f.bolNo.toLowerCase()))) return false
      if (f.pickupState && getShipperLocation(l, locations)?.state !== f.pickupState) return false
      if (f.deliveryState && getConsigneeLocation(l, locations)?.state !== f.deliveryState) return false
      if (f.driverId && !l.assignments.some((a) => a.driverId1 === f.driverId)) return false
      if (f.vehicleId && !l.assignments.some((a) => a.vehicleId === f.vehicleId)) return false
      if (f.trailerId && !l.assignments.some((a) => a.trailerId === f.trailerId)) return false
      if (f.carrierId && !l.assignments.some((a) => a.carrierId === f.carrierId)) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loads, appliedFilters, locations])

  const filtered = useMemo(() => {
    return panelFiltered.filter((l) => {
      const customer = getCustomer(l, customers)
      const rateConNumber = getRateConNumber(l)
      const q = search.toLowerCase()
      const matchesSearch =
        !search ||
        l.loadNumber.toLowerCase().includes(q) ||
        (customer?.name || '').toLowerCase().includes(q) ||
        (rateConNumber !== '—' && rateConNumber.toLowerCase().includes(q))
      const matchesStatus = statusFilter === 'All' || l.tripStatus === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [panelFiltered, customers, search, statusFilter])

  const openCreate = () => {
    setSelectedLoadId(null)
    setDrawerOpen(true)
  }
  const openEdit = (load) => {
    setSelectedLoadId(load.id)
    setDrawerOpen(true)
  }
  const toggleStatusFilter = (status) => setStatusFilter((prev) => (prev === status ? 'All' : status))

  const copyShareLink = (load) => {
    const url = getShareLink(load)
    if (!url) {
      toast.error('No shareable link yet — broker-dispatch a leg first')
      return
    }
    navigator.clipboard?.writeText(url)
    toast.success('Public rate-con link copied')
  }

  // "Actions" is fixed — always shown, always last, not part of the
  // manageable/reorderable set — matching the reference Loadx-Youngs-
  // Frontend's ColumnManager, which excludes its own Actions column too.
  const manageableColumns = [
    { key: 'loadNumber', header: 'Load #', render: (l) => <span className="font-medium text-slate-800 dark:text-slate-100">{l.loadNumber}</span> },
    { key: 'route', header: 'Route', render: (l) => getRouteLabel(l, locations), filterValue: (l) => getRouteLabel(l, locations) },
    { key: 'tripStatus', header: 'Status', render: (l) => <Badge status={l.tripStatus} />, filterValue: (l) => l.tripStatus },
    { key: 'trackingStatus', header: 'Tracking Status', render: (l) => <Badge status={l.trackingStatus} />, filterValue: (l) => l.trackingStatus },
    { key: 'rateConNumber', header: 'Rate Con Number', render: (l) => getRateConNumber(l), filterValue: (l) => getRateConNumber(l) },
    { key: 'customer', header: 'Customer', render: (l) => getCustomer(l, customers)?.name || '—', filterValue: (l) => getCustomer(l, customers)?.name || '' },
    { key: 'carrier', header: 'Dispatch Carrier', render: (l) => getCarrierLabel(l, carriers) },
    { key: 'driver', header: 'Driver', render: (l) => getDriverLabel(l, drivers) },
    { key: 'dispatcher', header: 'Dispatcher', render: (l) => getDispatcherLabel(l, users) },
    { key: 'vehicle', header: 'Vehicle', render: (l) => getVehicleLabel(l, vehicles) },
    { key: 'trailer', header: 'Trailer', render: (l) => getTrailerLabel(l, trailers) },
    {
      key: 'gpsTracking',
      header: 'Tracking',
      filterable: false,
      render: () => <span className="text-slate-400 dark:text-slate-500">Not tracked</span>,
    },
    { key: 'dropCount', header: 'Drop Count', render: (l) => getDropCount(l), filterValue: (l) => String(getDropCount(l)) },
    { key: 'revenue', header: 'Revenue', render: (l) => formatCurrency(l.primaryFee), filterValue: (l) => formatCurrency(l.primaryFee) },
    { key: 'pickupQty', header: 'Qty', render: (l) => getPickupQty(l) },
    { key: 'pickupQtyType', header: 'Qty Type', render: (l) => getPickupQtyType(l, typeOptions) },
    { key: 'deliveryQty', header: 'Delivery Qty', render: (l) => getDeliveryQty(l) },
    { key: 'deliveryQtyType', header: 'Delivery Qty Type', render: (l) => getDeliveryQtyType(l, typeOptions) },
    { key: 'pickupType', header: 'Pickup Type', render: (l) => getPickupType(l, typeOptions) },
    { key: 'deliveryType', header: 'Delivery Type', render: (l) => getDeliveryType(l, typeOptions) },
    { key: 'shipper', header: 'Shipper', render: (l) => getShipperLocation(l, locations)?.name || '—' },
    { key: 'consignee', header: 'Consignee', render: (l) => getConsigneeLocation(l, locations)?.name || '—' },
    { key: 'tenderedMiles', header: 'Tendered Miles', render: (l) => (l.tenderedMiles ? `${l.tenderedMiles} mi` : '—') },
    { key: 'bookingAuthority', header: 'Booking Authority', render: (l) => carriers.find((c) => c.id === l.bookingAuthorityId)?.name || '—' },
    { key: 'salesAgent', header: 'Sales Agent', render: (l) => users.find((u) => u.id === l.salesAgentId)?.fullName || '—' },
    { key: 'createdBy', header: 'Created By', render: (l) => getCreatedByLabel(l, users) },
    { key: 'createdOn', header: 'Created On', render: (l) => formatDate(l.createdAt), filterValue: (l) => formatDate(l.createdAt) },
    { key: 'temperature', header: 'Temperature', render: (l) => getTemperature(l) },
    {
      key: 'hazmat',
      header: 'Hazmat',
      render: (l) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            l.isHazmat
              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {l.isHazmat ? 'Yes' : 'No'}
        </span>
      ),
      filterValue: (l) => (l.isHazmat ? 'Yes' : 'No'),
    },
    { key: 'shipperCity', header: 'Shipper City', render: (l) => getShipperLocation(l, locations)?.city || '—' },
    { key: 'shipperState', header: 'Shipper State', render: (l) => getShipperLocation(l, locations)?.state || '—' },
    { key: 'consigneeCity', header: 'Consignee City', render: (l) => getConsigneeLocation(l, locations)?.city || '—' },
    { key: 'consigneeState', header: 'Consignee State', render: (l) => getConsigneeLocation(l, locations)?.state || '—' },
    { key: 'pickupStartTime', header: 'Pickup Start Time', render: (l) => formatDateTime(getPickupStop(l)?.startDt), filterValue: (l) => formatDateTime(getPickupStop(l)?.startDt) },
    { key: 'pickupEndTime', header: 'Pickup End Time', render: (l) => formatDateTime(getPickupStop(l)?.endDt), filterValue: (l) => formatDateTime(getPickupStop(l)?.endDt) },
    { key: 'deliveryStartTime', header: 'Delivery Start Time', render: (l) => formatDateTime(getDeliveryStop(l)?.startDt), filterValue: (l) => formatDateTime(getDeliveryStop(l)?.startDt) },
    { key: 'deliveryEndTime', header: 'Delivery End Time', render: (l) => formatDateTime(getDeliveryStop(l)?.endDt), filterValue: (l) => formatDateTime(getDeliveryStop(l)?.endDt) },
    {
      key: 'aiValidation',
      header: 'AI Validation',
      filterable: false,
      render: () => <span className="text-slate-400 dark:text-slate-500">Not available</span>,
    },
    {
      key: 'share',
      header: 'Share',
      filterable: false,
      render: (l) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); copyShareLink(l) }}
          title={getShareLink(l) ? 'Copy public rate-con link' : 'No shareable link yet'}
          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition ${
            getShareLink(l)
              ? 'border-brand-300 text-brand-600 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-400 dark:hover:bg-brand-900/20'
              : 'border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-600'
          }`}
        >
          {getShareLink(l) ? <Copy className="h-3 w-3" /> : <Link2 className="h-3 w-3" />} Share
        </button>
      ),
    },
    {
      key: 'splits',
      header: 'Splits',
      render: (l) => {
        const n = getSplitCount(l)
        return n > 1 ? <span className="font-medium text-indigo-600 dark:text-indigo-400">{n}</span> : n
      },
      filterValue: (l) => String(getSplitCount(l)),
    },
  ]

  const actionsColumn = {
    key: 'actions',
    header: 'Actions',
    filterable: false,
    render: (l) => (
      <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(l) }}>
        Edit
      </Button>
    ),
  }

  const { orderedColumns, activeColumns, hidden, toggleColumn, moveColumn, reorderColumn, reset, showAll } = useColumnPrefs(
    manageableColumns,
    'dashboardColumns_v1',
  )
  const tableColumns = [...activeColumns, actionsColumn]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`${filtered.length} of ${loads.length} loads`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Load
          </Button>
        }
      />

      {mastersError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          {mastersError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Total Loads" value={loads.length} icon={Package} accent="brand" onClick={() => setStatusFilter('All')} active={statusFilter === 'All'} />
        <StatCard label="Open" value={counts.Open} icon={Package} accent="amber" onClick={() => toggleStatusFilter('Open')} active={statusFilter === 'Open'} />
        <StatCard label="Scheduled" value={counts.Scheduled} icon={Package} accent="amber" onClick={() => toggleStatusFilter('Scheduled')} active={statusFilter === 'Scheduled'} />
        <StatCard label="In Transit" value={counts['In Transit']} icon={Truck} accent="purple" onClick={() => toggleStatusFilter('In Transit')} active={statusFilter === 'In Transit'} />
        <StatCard label="Completed" value={counts.Completed} icon={CheckCircle2} accent="emerald" onClick={() => toggleStatusFilter('Completed')} active={statusFilter === 'Completed'} />
        <StatCard label="Cancelled" value={counts.Cancelled} icon={XCircle} accent="red" onClick={() => toggleStatusFilter('Cancelled')} active={statusFilter === 'Cancelled'} />
      </div>

      <div className="mt-6">
        <DataTable
          columns={tableColumns}
          rows={filtered}
          onRowClick={openEdit}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search load # / customer / rate con number..."
          emptyLabel={mastersLoading ? 'Loading…' : 'No loads found.'}
          columnSearch
          toolbar={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterPanelOpen(true)}
                title="Load filters"
                aria-label="Open load filters"
                className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-brand-600 dark:hover:text-brand-400"
              >
                <Filter className="h-4 w-4" />
                {hasActiveLoadsFilters(appliedFilters) && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={() => setColumnManagerOpen(true)}
                title="Manage columns"
                aria-label="Manage columns"
                className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-brand-600 dark:hover:text-brand-400"
              >
                <Columns3 className="h-4 w-4" />
                {hidden.size > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500" aria-hidden />
                )}
              </button>
            </div>
          }
        />
      </div>

      <LoadDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} loadId={selectedLoadId} onCreated={setSelectedLoadId} />
      <LoadsFilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        appliedFilters={appliedFilters}
        onApply={(next) => {
          setAppliedFilters(next)
          setFilterPanelOpen(false)
        }}
        onClear={(base) => {
          setAppliedFilters(base)
          setFilterPanelOpen(false)
        }}
        drivers={drivers}
        vehicles={vehicles}
        trailers={trailers}
        carriers={carriers}
        locations={locations}
      />
      <ColumnManager
        open={columnManagerOpen}
        onClose={() => setColumnManagerOpen(false)}
        orderedColumns={orderedColumns}
        hidden={hidden}
        onToggle={toggleColumn}
        onMove={moveColumn}
        onReorder={reorderColumn}
        onReset={reset}
        onShowAll={showAll}
      />
    </div>
  )
}
