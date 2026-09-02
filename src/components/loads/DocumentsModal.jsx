import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { FileText, Trash2, UploadCloud, Download, Eye } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { useData } from '../../context/DataContext'
import { documentsApi } from '../../services/documentsApi'
import { DocumentViewerModal } from './DocumentViewerModal'

function blankForm() {
  return { docName: '', docTypeId: '', expDate: '' }
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// Mirrors the reference Loadx-Youngs-Frontend's UploadDocumentModal two-step
// flow (raw file -> URL, then persist the doc row with that URL) but against
// this app's local-disk /uploads endpoint instead of S3.
export function DocumentsModal({ open, onClose, loadId, loadNumber }) {
  const { typeOptions } = useData()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState(blankForm())
  const [file, setFile] = useState(null)
  const [viewerDoc, setViewerDoc] = useState(null)
  const fileInputRef = useRef(null)

  const docTypeOptions = typeOptions[23] || []

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const rows = await documentsApi.list(loadId)
      setDocuments(rows)
    } catch (err) {
      toast.error(err.message || 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open || !loadId) return
    setForm(blankForm())
    setFile(null)
    fetchDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loadId])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const handleFileChange = (e) => {
    const picked = e.target.files?.[0]
    if (!picked) return
    setFile(picked)
    if (!form.docName) set({ docName: picked.name })
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Choose a file first')
      return
    }
    setUploading(true)
    try {
      const { url } = await documentsApi.upload(loadId, file)
      await documentsApi.create(loadId, {
        doc_name: form.docName || file.name,
        doc_type_id: form.docTypeId || null,
        doc_url: url,
        exp_date: form.expDate || null,
      })
      toast.success('Document uploaded')
      setForm(blankForm())
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await fetchDocuments()
    } catch (err) {
      toast.error(err.message || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId) => {
    try {
      await documentsApi.remove(loadId, docId)
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      toast.success('Document deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete document')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Documents"
      subtitle={loadNumber ? `Load ${loadNumber}` : undefined}
      size="xl"
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-dashed border-slate-300 p-3 dark:border-slate-700">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="File" className="sm:col-span-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700 dark:text-slate-300"
              />
            </Field>
            <Field label="Document Name">
              <Input value={form.docName} onChange={(e) => set({ docName: e.target.value })} placeholder="e.g. Signed BOL" />
            </Field>
            <Field label="Document Type">
              <Select value={form.docTypeId} onChange={(e) => set({ docTypeId: e.target.value })}>
                <option value="">Select type</option>
                {docTypeOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Expiration Date" className="sm:col-span-2">
              <Input type="date" value={form.expDate} onChange={(e) => set({ expDate: e.target.value })} />
            </Field>
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={handleUpload} disabled={uploading || !file}>
              <UploadCloud className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload Document'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {loading && <p className="py-6 text-center text-sm text-slate-400">Loading documents…</p>}
          {!loading && documents.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">No documents uploaded yet.</p>
          )}
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-800 dark:text-slate-100">{doc.doc_type_label || 'Untitled type'}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {doc.doc_name || 'Untitled document'} · {formatDate(doc.addtime)}
                    {doc.exp_date ? ` · Expires ${doc.exp_date}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => setViewerDoc(doc)} title="View">
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <a href={doc.doc_url} target="_blank" rel="noreferrer" title="Download">
                  <Button size="sm" variant="ghost"><Download className="h-3.5 w-3.5" /></Button>
                </a>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(doc.id)} title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DocumentViewerModal open={!!viewerDoc} onClose={() => setViewerDoc(null)} doc={viewerDoc} />
    </Modal>
  )
}
