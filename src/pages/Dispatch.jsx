import { useState } from 'react'
import { useData } from '../context/DataContext'
import { PageHeader } from '../components/ui/PageHeader'
import { LoadDrawer } from '../components/loads/LoadDrawer'
import { KANBAN_TRIP_STATUSES, badgeColor } from '../mocks/constants'
import { getCustomer, getStopCity, getCarrierDriverLabel } from '../utils/loadHelpers'

export default function Dispatch() {
  const { loads, customers, carriers, drivers, locations } = useData()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedLoadId, setSelectedLoadId] = useState(null)

  const openLoad = (id) => {
    setSelectedLoadId(id)
    setDrawerOpen(true)
  }

  return (
    <div>
      <PageHeader title="Dispatch Board" description="Loads grouped by trip status — click a card to open the load" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KANBAN_TRIP_STATUSES.map((status) => {
          const columnLoads = loads.filter((l) => l.tripStatus === status)
          return (
            <div key={status} className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{status}</span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {columnLoads.length}
                </span>
              </div>
              <div className="scrollbar-thin flex-1 space-y-2.5 overflow-y-auto p-3" style={{ maxHeight: '70vh' }}>
                {columnLoads.length === 0 && (
                  <p className="px-1 py-4 text-center text-xs text-slate-400">No loads</p>
                )}
                {columnLoads.map((load) => {
                  const customer = getCustomer(load, customers)
                  return (
                    <button
                      key={load.id}
                      onClick={() => openLoad(load.id)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-brand-400 hover:shadow dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{load.loadNumber}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeColor(load.trackingStatus)}`}>
                          {load.trackingStatus}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{customer?.name || 'No customer'}</p>
                      <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                        {getStopCity(load, 'Pickup', locations)} <span className="text-slate-300 dark:text-slate-600">→</span> {getStopCity(load, 'Delivery', locations)}
                      </p>
                      <p className="mt-1.5 truncate text-[11px] text-slate-400">{getCarrierDriverLabel(load, carriers, drivers)}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <LoadDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} loadId={selectedLoadId} />
    </div>
  )
}
