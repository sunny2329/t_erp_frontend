import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { ActiveBadge } from '../../components/ui/ActiveBadge'
import { TerminalDrawer } from '../../components/terminals/TerminalDrawer'

export default function Terminals() {
  const { terminals, refetchMasters, mastersLoading, mastersError } = useData()
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const filtered = useMemo(() => {
    if (!search) return terminals
    const q = search.toLowerCase()
    return terminals.filter((row) => `${row.code} ${row.name} ${row.city}`.toLowerCase().includes(q))
  }, [terminals, search])

  const openCreate = () => {
    setEditingId(null)
    setDrawerOpen(true)
  }
  const openEdit = (row) => {
    setEditingId(row.id)
    setDrawerOpen(true)
  }

  const columns = [
    { key: 'code', header: 'Code', render: (r) => <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{r.code}</span> },
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium text-slate-800 dark:text-slate-100">{r.name}</span> },
    { key: 'address', header: 'Address' },
    { key: 'city', header: 'City', render: (r) => `${r.city || '—'}${r.state ? ', ' + r.state : ''}`, filterValue: (r) => `${r.city || ''} ${r.state || ''}` },
    { key: 'active', header: 'Status', render: (r) => <ActiveBadge active={r.active} />, filterValue: (r) => (r.active ? 'Active' : 'Inactive') },
  ]

  return (
    <div>
      <PageHeader
        title="Terminals"
        description={`${terminals.length} terminals`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Terminal
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
        searchPlaceholder="Search terminals..."
        emptyLabel={mastersLoading ? 'Loading…' : 'No terminals found.'}
      />

      <TerminalDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        terminalId={editingId}
        onSaved={refetchMasters}
      />
    </div>
  )
}
