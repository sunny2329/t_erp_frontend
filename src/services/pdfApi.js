import { api } from './apiClient'

// Always requested with view_only=true — viewing/downloading a PDF shouldn't
// create a new row in the load's Documents list every time someone clicks
// "View BOL". The "Send Rate Con" flow (erateApi.sendRateCon) is the one
// path that regenerates AND saves, matching the reference project's
// view_only distinction.
const assignmentSuffix = (assignmentId) => (assignmentId ? `/${assignmentId}` : '')

export const pdfApi = {
  customerConfirmation: (loadId) => api.getBlob(`/loads/${loadId}/pdf/customer-confirmation`, { view_only: 'true' }),
  loadConfirmation: (loadId, assignmentId) =>
    api.getBlob(`/loads/${loadId}/pdf/load-confirmation${assignmentSuffix(assignmentId)}`, { view_only: 'true' }),
  bol: (loadId, assignmentId) =>
    api.getBlob(`/loads/${loadId}/pdf/bol${assignmentSuffix(assignmentId)}`, { view_only: 'true' }),
}

// Opens a blob in a new tab the same way the reference frontend does:
// object URL, window.open, revoke shortly after (the new tab has already
// loaded it into memory by then).
export function openPdfBlob(blob) {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
