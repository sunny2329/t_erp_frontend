import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { ActiveBadge } from '../../components/ui/ActiveBadge'
import { CarrierDrawer } from '../../components/carriers/CarrierDrawer'

export default function Carriers() {
  const { carriers, refetchMasters, mastersLoading, mastersError } = useData()
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const filtered = useMemo(() => {
    if (!search) return carriers
    const q = search.toLowerCase()
    return carriers.filter((row) => `${row.name} ${row.mcNumber} ${row.dotNumber}`.toLowerCase().includes(q))
  }, [carriers, search])

  const openCreate = () => {
    setEditingId(null)
    setDrawerOpen(true)
  }
  const openEdit = (row) => {
    setEditingId(row.id)
    setDrawerOpen(true)
  }

  const columns = [
    { key: 'name', header: 'Carrier Name', render: (r) => <span className="font-medium text-slate-800 dark:text-slate-100">{r.name}</span> },
    {
      key: 'authorityType',
      header: 'Authority Type',
      render: (r) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.authorityType === 1 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'}`}>
          {r.authorityType === 1 ? 'Managed' : 'External'}
        </span>
      ),
      filterValue: (r) => (r.authorityType === 1 ? 'Managed' : 'External'),
    },
    { key: 'mcNumber', header: 'MC #' },
    { key: 'dotNumber', header: 'DOT #' },
    { key: 'active', header: 'Status', render: (r) => <ActiveBadge active={r.active} />, filterValue: (r) => (r.active ? 'Active' : 'Inactive') },
  ]

  return (
    <div>
      <PageHeader
        title="Carriers"
        description={`${carriers.length} carriers`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Carrier
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
        searchPlaceholder="Search carriers..."
        emptyLabel={mastersLoading ? 'Loading…' : 'No carriers found.'}
      />

      <CarrierDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        carrierId={editingId}
        onSaved={refetchMasters}
      />
    </div>
  )
}
