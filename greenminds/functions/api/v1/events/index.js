import { filterEvents } from '../../../../server/events.js'
import { apiError, apiJson, paginate } from '../../../../server/rest.js'

// GET /api/v1/events?suburb=&type=&from=&to=&available=&limit=&offset=
// Upcoming volunteer events, sorted by date.
export function onRequestGet({ request }) {
  const params = new URL(request.url).searchParams
  const filtered = filterEvents(params)
  if (filtered.error) return apiError(400, filtered.error)

  const page = paginate(filtered.items, params)
  if (page.error) return apiError(400, page.error)
  return apiJson(page.body)
}
