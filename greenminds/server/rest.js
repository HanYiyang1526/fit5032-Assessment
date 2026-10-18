// Shared helpers for the public REST API (BR F.1 — Provide API access).

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

export function apiJson(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-store',
      ...CORS_HEADERS
    }
  })
}

export function apiError(status, message) {
  return apiJson({ error: { status, message } }, status)
}

// Reads an optional whole-number query parameter within [min, max].
// Returns { value } or { error }.
export function intParam(params, name, { min, max, fallback }) {
  const raw = params.get(name)
  if (raw === null || raw === '') return { value: fallback }
  if (!/^\d+$/.test(raw)) return { error: `"${name}" must be a whole number.` }
  const value = Number(raw)
  if (value < min || value > max) return { error: `"${name}" must be between ${min} and ${max}.` }
  return { value }
}

// Case-insensitive "contains" match used by the text filters.
export function matches(value, query) {
  return String(value).toLowerCase().includes(query.toLowerCase())
}

// Applies limit/offset and wraps the page with paging metadata.
export function paginate(items, params) {
  const limit = intParam(params, 'limit', { min: 1, max: 100, fallback: 20 })
  if (limit.error) return { error: limit.error }
  const offset = intParam(params, 'offset', { min: 0, max: 100000, fallback: 0 })
  if (offset.error) return { error: offset.error }

  return {
    body: {
      data: items.slice(offset.value, offset.value + limit.value),
      meta: { total: items.length, limit: limit.value, offset: offset.value }
    }
  }
}
