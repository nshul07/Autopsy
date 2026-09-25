// All calls to the AppAutopsy FastAPI backend live here.
// If the backend is unreachable, callers fall back to demo data (see src/data/demoReport.js).

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  })

  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch {
      // response wasn't JSON — keep statusText
    }
    throw new ApiError(detail, res.status)
  }

  return res.json()
}

/**
 * Upload an APK for analysis.
 * @param {File} file
 * @param {string} [category] - optional category override, e.g. "flashlight"
 * @param {string} [language] - "en" | "hi" | "pa"
 */
export async function analyzeApk(file, category, language = 'en') {
  const formData = new FormData()
  formData.append('file', file)
  if (category) formData.append('category', category)
  formData.append('language', language)

  return request('/api/v1/apk/analyze', {
    method: 'POST',
    body: formData,
  })
}

/**
 * Check a download link.
 * @param {string} url
 * @param {string} [language]
 */
export async function checkLink(url, language = 'en') {
  return request('/api/v1/link/check', {
    method: 'POST',
    body: JSON.stringify({ url, language }),
  })
}

/**
 * Fetch a previously generated report by id.
 * @param {string} reportId
 */
export async function getReport(reportId) {
  return request(`/api/v1/report/${reportId}`, { method: 'GET' })
}

export { ApiError }
