import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { LocationDrawer } from '../../components/locations/LocationDrawer'
import { formatPhone } from '../../utils/phone'

export default function Locations() {
  const { locations, refetchMasters, mastersLoading, mastersError } = useData()
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const filtered = useMemo(() => {
    if (!search) return locations
    const q = search.toLowerCase()
    return locations.filter((row) => `${row.name} ${row.city}`.toLowerCase().includes(q))
  }, [locations, search])

  const openCreate = () => {
    setEditingId(null)
    setDrawerOpen(true)
  }
  const openEdit = (row) => {
    setEditingId(row.id)
    setDrawerOpen(true)
  }

  const columns = [
    { key: 'name', header: 'Location Name', render: (r) => <span className="font-medium text-slate-800 dark:text-slate-100">{r.name}</span> },
    { key: 'address', header: 'Address' },
    { key: 'city', header: 'City', render: (r) => `${r.city || '—'}${r.state ? ', ' + r.state : ''}`, filterValue: (r) => `${r.city || ''} ${r.state || ''}` },
    { key: 'phone', header: 'Phone', render: (r) => formatPhone(r.phone) || '—' },
  ]

  return (
    <div>
      <PageHeader
        title="Locations"
        description={`${locations.length} locations`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Location
          </Button>
        }
      />

      {mastersError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          {mastersError}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={filtered}
        onRowClick={openEdit}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search locations..."
        emptyLabel={mastersLoading ? 'Loading…' : 'No locations found.'}
      />

      <LocationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        locationId={editingId}
        onSaved={refetchMasters}
      />
    </div>
  )
}
