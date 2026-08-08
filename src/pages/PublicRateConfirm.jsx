import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CheckCircle2, XCircle, FileText, ShieldAlert } from 'lucide-react'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { publicErateApi } from '../services/erateApi'

// Public, unauthenticated page — the token+assignmentId in the URL are the
// only credential (see t_erp_backend/src/routes/erate.routes.js). Mirrors
// the reference Loadx-Youngs-Frontend's LoadRateConfirmPublic.jsx: view the
// rate-con PDF, fill in driver/equipment details, accept or reject. Once a
// decision is recorded (erateStatusId 2/-1) this always re-renders the
// Approved/Rejected screen instead of the form — matches the reference's
// permanent, non-revocable link behavior.
export default function PublicRateConfirm() {
  const { token, assignmentId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [form, setForm] = useState({ driverName: '', driverPhone: '', vehicleNo: '', trailerNo: '', accept: false })
  const [submitting, setSubmitting] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await publicErateApi.get(token)
      setData(res)
    } catch (err) {
      setError(err.message || 'This link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const assignment = data?.assignments?.find((a) => String(a.id) === String(assignmentId))

  useEffect(() => {
    if (!assignment) return
    setForm((f) => ({
      ...f,
      driverName: assignment.driverName || '',
      driverPhone: assignment.driverPhone || '',
      vehicleNo: assignment.vehicleNo || '',
      trailerNo: assignment.trailerNo || '',
    }))
  }, [assignment])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const submit = async (status) => {
    if (status === 'accept' && (!form.driverName.trim() || !form.accept)) {
      toast.error('Enter the driver name and check "I accept" before confirming')
      return
    }
    setSubmitting(status)
    try {
      await publicErateApi.update(token, {
        assignmentId,
        status,
        driverName: form.driverName.trim(),
        driverPhone: form.driverPhone.trim(),
        vehicleNo: form.vehicleNo.trim(),
        trailerNo: form.trailerNo.trim(),
      })
      await fetchData()
    } catch (err) {
      toast.error(err.message || 'Failed to submit')
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Rate Confirmation</h1>
          {data && <p className="text-sm text-slate-500 dark:text-slate-400">Load #{data.loadNumber}</p>}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {loading && <p className="py-8 text-center text-sm text-slate-400">Loading…</p>}

          {!loading && (error || !assignment) && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <ShieldAlert className="h-10 w-10 text-red-400" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Access Denied</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {error || 'This link does not match a valid dispatch leg.'}
              </p>
            </div>
          )}

          {!loading && assignment && assignment.erateStatusId === 2 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Rate Confirmation Accepted</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Thank you — the dispatcher has been notified.</p>
            </div>
          )}

          {!loading && assignment && assignment.erateStatusId === -1 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <XCircle className="h-10 w-10 text-red-500" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Rate Confirmation Rejected</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">You've marked this rate confirmation as rejected.</p>
            </div>
          )}

          {!loading && assignment && assignment.erateStatusId == null && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-800/40">
                <p className="font-medium text-slate-700 dark:text-slate-200">{assignment.carrierName || 'Carrier'}</p>
                {assignment.pdfUrl ? (
                  <a
                    href={assignment.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    <FileText className="h-4 w-4" /> View Rate Confirmation PDF
                  </a>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">PDF not yet available — ask the dispatcher to resend.</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Driver Name" required>
                  <Input value={form.driverName} onChange={(e) => set({ driverName: e.target.value })} />
                </Field>
                <Field label="Driver Phone">
                  <Input value={form.driverPhone} onChange={(e) => set({ driverPhone: e.target.value })} />
                </Field>
                <Field label="Vehicle #">
                  <Input value={form.vehicleNo} onChange={(e) => set({ vehicleNo: e.target.value })} />
                </Field>
                <Field label="Trailer #">
                  <Input value={form.trailerNo} onChange={(e) => set({ trailerNo: e.target.value })} />
                </Field>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.accept}
                  onChange={(e) => set({ accept: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                I accept the terms of this rate confirmation
              </label>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => submit('reject')}
                  disabled={!!submitting}
                >
                  {submitting === 'reject' ? 'Submitting…' : 'Reject'}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => submit('accept')}
                  disabled={!!submitting}
                >
                  {submitting === 'accept' ? 'Submitting…' : 'Accept'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
