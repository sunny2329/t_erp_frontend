import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Download } from 'lucide-react'

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']

function getExtension(url) {
  const clean = (url || '').split('?')[0]
  const match = clean.match(/\.([a-zA-Z0-9]+)$/)
  return match ? match[1].toLowerCase() : ''
}

// In-app preview for saved load documents (Supabase Storage URLs) — images
// render inline, PDFs render via iframe (browsers show their native PDF
// viewer for a same-origin-CORS'd public URL), anything else falls back to
// an "open in new tab" link since there's no reliable inline preview for it.
export function DocumentViewerModal({ open, onClose, doc }) {
  if (!doc) return null
  const ext = getExtension(doc.doc_url)
  const isImage = IMAGE_EXTENSIONS.includes(ext)
  const isPdf = ext === 'pdf'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={doc.doc_name || 'Document'}
      subtitle={doc.doc_type_label}
      size="2xl"
      footer={
        <a href={doc.doc_url} target="_blank" rel="noreferrer">
          <Button variant="secondary"><Download className="h-4 w-4" /> Download</Button>
        </a>
      }
    >
      {isImage && (
        <img
          src={doc.doc_url}
          alt={doc.doc_name || 'Document'}
          className="mx-auto max-h-[75vh] w-auto rounded-lg object-contain"
        />
      )}
      {isPdf && (
        <iframe
          src={doc.doc_url}
          title={doc.doc_name || 'Document'}
          className="h-[75vh] w-full rounded-lg border border-slate-200 dark:border-slate-800"
        />
      )}
      {!isImage && !isPdf && (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Preview isn&apos;t available for this file type.</p>
          <a href={doc.doc_url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline dark:text-brand-400">
            Open in a new tab
          </a>
        </div>
      )}
    </Modal>
  )
}
