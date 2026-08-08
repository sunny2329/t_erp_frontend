import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ShieldCheck } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useData } from '../../context/DataContext'
import { usersApi } from '../../services/masterApi'

// user_roles has no allow_view column — a row's mere existence *is* the view
// grant for that page. `view` here is a frontend-only concept: true whenever
// the user has any row (even one with every flag false) for that page_id.
function emptyPerm() {
  return { view: false, allow_add: false, allow_edit: false, allow_delete: false }
}

export function UserPermissionsModal({ open, onClose, userId, userName }) {
  const { pages } = useData()
  const [permMap, setPermMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !userId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const user = await usersApi.getById(userId)
        const map = {}
        for (const perm of user.permissions || []) {
          map[perm.page_id] = {
            view: true,
            allow_add: !!perm.allow_add,
            allow_edit: !!perm.allow_edit,
            allow_delete: !!perm.allow_delete,
          }
        }
        if (!cancelled) setPermMap(map)
      } catch (err) {
        if (!cancelled) toast.error(err.message || 'Failed to load permissions')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [open, userId])

  const grouped = useMemo(() => {
    const groups = {}
    for (const page of pages) {
      if (!groups[page.groupName]) groups[page.groupName] = []
      groups[page.groupName].push(page)
    }
    return groups
  }, [pages])

  const setPagePerm = (pageId, patch) => {
    setPermMap((prev) => {
      if (patch.view === false) {
        return { ...prev, [pageId]: emptyPerm() }
      }
      const next = { ...emptyPerm(), ...prev[pageId], ...patch }
      // Granting any action implies at least view access.
      if (next.allow_add || next.allow_edit || next.allow_delete) next.view = true
      return { ...prev, [pageId]: next }
    })
  }

  const toggleFullAccess = (page, checked) => {
    setPagePerm(page.id, {
      view: checked,
      allow_add: checked && page.hasAdd,
      allow_edit: checked && page.hasEdit,
      allow_delete: checked && page.hasDelete,
    })
  }

  const isFullAccess = (page) => {
    const p = permMap[page.id] || emptyPerm()
    const applicable = [page.hasAdd, page.hasEdit, page.hasDelete]
    if (!applicable.some(Boolean)) return p.view
    return (!page.hasAdd || p.allow_add) && (!page.hasEdit || p.allow_edit) && (!page.hasDelete || p.allow_delete)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const permissions = pages
        .filter((page) => (permMap[page.id] || emptyPerm()).view)
        .map((page) => {
          const p = permMap[page.id]
          return { page_id: Number(page.id), allow_add: p.allow_add, allow_edit: p.allow_edit, allow_delete: p.allow_delete }
        })
      await usersApi.update(userId, { permissions })
      toast.success('Page access updated')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to save permissions')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Page Access"
      subtitle={userName ? `Choose which pages ${userName} can see, and what they can do on each` : ''}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading}>{saving ? 'Saving…' : 'Save access'}</Button>
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-10 text-sm text-slate-400">Loading current access…</div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([groupName, groupPages]) => (
            <div key={groupName}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{groupName}</h3>
              <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                      <th className="px-3 py-2 font-medium">Page</th>
                      <th className="px-3 py-2 text-center font-medium">View</th>
                      <th className="px-3 py-2 text-center font-medium">Add</th>
                      <th className="px-3 py-2 text-center font-medium">Edit</th>
                      <th className="px-3 py-2 text-center font-medium">Delete</th>
                      <th className="px-3 py-2 text-center font-medium">Full access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupPages.map((page) => {
                      const p = permMap[page.id] || emptyPerm()
                      return (
                        <tr key={page.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{page.title}</td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={p.view}
                              onChange={(e) => setPagePerm(page.id, { view: e.target.checked })}
                              className="h-4 w-4 rounded border-slate-300 text-brand-600 dark:border-slate-600"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              disabled={!page.hasAdd}
                              checked={p.allow_add}
                              onChange={(e) => setPagePerm(page.id, { allow_add: e.target.checked })}
                              className="h-4 w-4 rounded border-slate-300 text-brand-600 disabled:opacity-30 dark:border-slate-600"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              disabled={!page.hasEdit}
                              checked={p.allow_edit}
                              onChange={(e) => setPagePerm(page.id, { allow_edit: e.target.checked })}
                              className="h-4 w-4 rounded border-slate-300 text-brand-600 disabled:opacity-30 dark:border-slate-600"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              disabled={!page.hasDelete}
                              checked={p.allow_delete}
                              onChange={(e) => setPagePerm(page.id, { allow_delete: e.target.checked })}
                              className="h-4 w-4 rounded border-slate-300 text-brand-600 disabled:opacity-30 dark:border-slate-600"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => toggleFullAccess(page, !isFullAccess(page))}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                                isFullAccess(page)
                                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              {isFullAccess(page) ? 'Full' : 'Grant'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
