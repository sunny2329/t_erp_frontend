const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/dispatch_api/v1'
const TOKEN_KEY = 'tms-token'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(method, path, { body, params } = {}) {
  const url = new URL(BASE_URL + path)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
    })
  }

  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let json = null
  try {
    json = await res.json()
  } catch {
    // no body
  }

  if (!res.ok || json?.success === false) {
    const message = json?.message || `Request failed (${res.status})`
    throw new ApiError(message, res.status)
  }

  return json?.data
}

// Separate from request() because a file upload body is FormData, not JSON —
// the browser must set its own multipart Content-Type (with boundary), so we
// deliberately don't set one here.
async function uploadRequest(path, formData) {
  const url = new URL(BASE_URL + path)
  const token = getToken()
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { method: 'POST', headers, body: formData })

  let json = null
  try {
    json = await res.json()
  } catch {
    // no body
  }

  if (!res.ok || json?.success === false) {
    const message = json?.message || `Request failed (${res.status})`
    throw new ApiError(message, res.status)
  }

  return json?.data
}

// PDF view/download endpoints return raw application/pdf bytes, not the
// { success, data } JSON envelope — fetched as a blob so the caller can
// build an object URL and open it in a new tab.
async function blobRequest(path, params) {
  const url = new URL(BASE_URL + path)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
    })
  }

  const token = getToken()
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { headers })

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const json = await res.clone().json()
      message = json?.message || message
    } catch {
      // body wasn't JSON (or already consumed) — keep the generic message
    }
    throw new ApiError(message, res.status)
  }

  return res.blob()
}

export const api = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  upload: (path, formData) => uploadRequest(path, formData),
  getBlob: (path, params) => blobRequest(path, params),
}
