import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { ActiveBadge } from '../../components/ui/ActiveBadge'
import { TrailerDrawer } from '../../components/trailers/TrailerDrawer'

export default function Trailers() {
  const { trailers, carriers, refetchMasters, mastersLoading, mastersError } = useData()
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const filtered = useMemo(() => {
    if (!search) return trailers
    const q = search.toLowerCase()
    return trailers.filter((row) => `${row.name} ${row.make} ${row.model}`.toLowerCase().includes(q))
  }, [trailers, search])

  const openCreate = () => {
    setEditingId(null)
    setDrawerOpen(true)
  }
  const openEdit = (row) => {
    setEditingId(row.id)
    setDrawerOpen(true)
  }

  const columns = [
    { key: 'name', header: 'Name / Number', render: (r) => <span className="font-medium text-slate-800 dark:text-slate-100">{r.name}</span> },
    { key: 'makeModel', header: 'Make / Model', render: (r) => `${r.make || '—'} ${r.model || ''}`.trim(), filterValue: (r) => `${r.make || ''} ${r.model || ''}` },
    { key: 'carrier', header: 'Carrier', render: (r) => carriers.find((c) => c.id === r.carrierId)?.name || '—', filterValue: (r) => carriers.find((c) => c.id === r.carrierId)?.name || '' },
    { key: 'active', header: 'Status', render: (r) => <ActiveBadge active={r.active} />, filterValue: (r) => (r.active ? 'Active' : 'Inactive') },
  ]

  return (
    <div>
      <PageHeader
        title="Trailers"
        description={`${trailers.length} trailers`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Trailer
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
        searchPlaceholder="Search trailers..."
        emptyLabel={mastersLoading ? 'Loading…' : 'No trailers found.'}
      />

      <TrailerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        trailerId={editingId}
        onSaved={refetchMasters}
      />
    </div>
  )
}
