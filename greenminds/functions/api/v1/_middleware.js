import { CORS_HEADERS, apiError } from '../../../server/rest.js'

// Runs before every /api/v1/* route: answers CORS preflight requests and
// rejects anything other than GET, since the public API is read-only.
export async function onRequest({ request, next }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  if (request.method !== 'GET') {
    return apiError(405, 'This API is read-only. Use GET.')
  }
  return next()
}
