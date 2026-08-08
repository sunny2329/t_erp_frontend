import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useData } from '../context/DataContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { DataTable } from '../components/ui/DataTable'
import { LoadDrawer } from '../components/loads/LoadDrawer'
import { TRIP_STATUSES } from '../mocks/constants'
import { getCustomer, getPickupStop, getStopCity, getCarrierDriverLabel } from '../utils/loadHelpers'

export default function Loads() {
  const { loads, customers, carriers, drivers, locations } = useData()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedLoadId, setSelectedLoadId] = useState(null)

  useEffect(() => {
    const openId = searchParams.get('open')
    if (openId) {
      setSelectedLoadId(openId)
      setDrawerOpen(true)
      searchParams.delete('open')
      setSearchParams(searchParams, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    return loads.filter((l) => {
      const customer = getCustomer(l, customers)
      const matchesSearch =
        !search ||
        l.loadNumber.toLowerCase().includes(search.toLowerCase()) ||
        (customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.poNumber || '').toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === 'All' || l.tripStatus === status
      const pickupDate = getPickupStop(l)?.stopDate
      const matchesFrom = !dateFrom || (pickupDate && pickupDate >= dateFrom)
      const matchesTo = !dateTo || (pickupDate && pickupDate <= dateTo)
      return matchesSearch && matchesStatus && matchesFrom && matchesTo
    })
  }, [loads, customers, search, status, dateFrom, dateTo])

  const openCreate = () => {
    setSelectedLoadId(null)
    setDrawerOpen(true)
  }
  const openEdit = (load) => {
    setSelectedLoadId(load.id)
    setDrawerOpen(true)
  }

  const columns = [
    { key: 'loadNumber', header: 'Load #', render: (l) => <span className="font-medium text-slate-800 dark:text-slate-100">{l.loadNumber}</span> },
    { key: 'customer', header: 'Customer', render: (l) => getCustomer(l, customers)?.name || '—', filterValue: (l) => getCustomer(l, customers)?.name || '' },
    { key: 'pickup', header: 'Pickup', render: (l) => getStopCity(l, 'Pickup', locations), filterValue: (l) => getStopCity(l, 'Pickup', locations) },
    { key: 'delivery', header: 'Delivery', render: (l) => getStopCity(l, 'Delivery', locations), filterValue: (l) => getStopCity(l, 'Delivery', locations) },
    { key: 'trip', header: 'Trip status', render: (l) => <Badge status={l.tripStatus} />, filterValue: (l) => l.tripStatus },
    { key: 'tracking', header: 'Tracking status', render: (l) => <Badge status={l.trackingStatus} />, filterValue: (l) => l.trackingStatus },
    { key: 'carrier', header: 'Carrier / Driver', render: (l) => getCarrierDriverLabel(l, carriers, drivers), filterValue: (l) => getCarrierDriverLabel(l, carriers, drivers) },
    {
      key: 'actions',
      header: 'Actions',
      filterable: false,
      render: (l) => (
        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(l) }}>
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Loads"
        description={`${filtered.length} of ${loads.length} loads`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Load
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/50">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">From</span>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">To</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Status</span>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="All">All statuses</option>
            {TRIP_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </label>
        {(dateFrom || dateTo || status !== 'All' || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setDateFrom(''); setDateTo(''); setStatus('All'); setSearch('') }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        onRowClick={openEdit}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search load # / customer / PO..."
        emptyLabel="No loads match your filters."
      />

      <LoadDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} loadId={selectedLoadId} />
    </div>
  )
}
