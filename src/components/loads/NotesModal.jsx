import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Pencil, Trash2, X } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import { notesApi } from '../../services/notesApi'

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString()
}

function initials(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

// Chat/timeline-style notes log, matching the reference Loadx-Youngs-Frontend
// NotesCommentsModal — but with delete actually wired to the backend (the
// reference left handleDeleteNote as a local-state-only no-op).
export function NotesModal({ open, onClose, loadId, loadNumber }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState(null)

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const rows = await notesApi.list(loadId)
      setNotes(rows)
    } catch (err) {
      toast.error(err.message || 'Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open || !loadId) return
    setText('')
    setEditingId(null)
    fetchNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loadId])

  const handleSave = async () => {
    if (!text.trim()) {
      toast.error('Note text is required')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await notesApi.update(loadId, editingId, { notes: text.trim() })
        toast.success('Note updated')
      } else {
        await notesApi.create(loadId, { notes: text.trim() })
        toast.success('Note added')
      }
      setText('')
      setEditingId(null)
      await fetchNotes()
    } catch (err) {
      toast.error(err.message || 'Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (note) => {
    setEditingId(note.id)
    setText(note.notes || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setText('')
  }

  const handleDelete = async (noteId) => {
    try {
      await notesApi.remove(loadId, noteId)
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
      if (editingId === noteId) cancelEdit()
      toast.success('Note deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete note')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Notes"
      subtitle={loadNumber ? `Load ${loadNumber}` : undefined}
      size="lg"
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-4">
        <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
          {loading && <p className="py-6 text-center text-sm text-slate-400">Loading notes…</p>}
          {!loading && notes.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">No notes yet.</p>
          )}
          {notes.map((note) => (
            <div key={note.id} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                {initials(note.added_by)}
              </div>
              <div className="min-w-0 flex-1 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{note.added_by || 'Unknown user'}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(note.addtime)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(note)} title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(note.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{note.notes}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
          {editingId && (
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Editing note</span>
              <button onClick={cancelEdit} className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-3 w-3" /> Cancel
              </button>
            </div>
          )}
          <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a note…" />
          <div className="mt-2 flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update Note' : 'Save Note'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
