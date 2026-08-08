import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, AlertCircle } from 'lucide-react'
import { PageHeader } from '../ui/PageHeader'
import { Button } from '../ui/Button'
import { DataTable } from '../ui/DataTable'
import { Drawer } from '../ui/Drawer'

export function MasterCrudPage({
  title,
  description,
  entityLabel,
  data,
  crud,
  columns,
  searchFn,
  searchPlaceholder = 'Search...',
  blankRecord,
  renderForm,
  drawerWidth = 'max-w-xl',
  loading = false,
  loadError = null,
}) {
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(blankRecord())
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    if (!search) return data
    return data.filter((row) => searchFn(row, search))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, search])

  const openCreate = () => {
    setEditingId(null)
    setForm(blankRecord())
    setDrawerOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({ ...row })
    setDrawerOpen(true)
  }

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingId) {
        await crud.update(editingId, form)
        toast.success(`${entityLabel} updated`)
      } else {
        await crud.add(form)
        toast.success(`${entityLabel} added`)
      }
      setDrawerOpen(false)
    } catch (err) {
      toast.error(err.message || `Failed to save ${entityLabel.toLowerCase()}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add {entityLabel}
          </Button>
        }
      />

      {loadError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {loadError}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={filtered}
        onRowClick={openEdit}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder}
        emptyLabel={loading ? 'Loading…' : `No ${entityLabel.toLowerCase()}s found.`}
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? `Edit ${entityLabel}` : `Add ${entityLabel}`}
        width={drawerWidth}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </>
        }
      >
        {renderForm({ form, set })}
      </Drawer>
    </div>
  )
}
