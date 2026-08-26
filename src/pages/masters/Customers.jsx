import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { CustomerDrawer } from '../../components/customers/CustomerDrawer'
import { formatPhone } from '../../utils/phone'

export default function Customers() {
  const { customers, users, refetchMasters, mastersLoading, mastersError } = useData()
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const filtered = useMemo(() => {
    if (!search) return customers
    const q = search.toLowerCase()
    return customers.filter((row) => `${row.name} ${row.city} ${row.email}`.toLowerCase().includes(q))
  }, [customers, search])

  const openCreate = () => {
    setEditingId(null)
    setDrawerOpen(true)
  }
  const openEdit = (row) => {
    setEditingId(row.id)
    setDrawerOpen(true)
  }

  const columns = [
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium text-slate-800 dark:text-slate-100">{r.name}</span> },
    { key: 'salesAgent', header: 'Sales Agent', render: (r) => users.find((u) => u.id === r.salesAgentId)?.fullName || '—', filterValue: (r) => users.find((u) => u.id === r.salesAgentId)?.fullName || '' },
    { key: 'city', header: 'City', render: (r) => `${r.city || '—'}${r.state ? ', ' + r.state : ''}`, filterValue: (r) => `${r.city || ''} ${r.state || ''}` },
    { key: 'phone', header: 'Phone', render: (r) => formatPhone(r.phone) || '—' },
    { key: 'email', header: 'Email' },
  ]

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${customers.length} customers`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Customer
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
        searchPlaceholder="Search customers..."
        emptyLabel={mastersLoading ? 'Loading…' : 'No customers found.'}
      />

      <CustomerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        customerId={editingId}
        onSaved={refetchMasters}
      />
    </div>
  )
}
