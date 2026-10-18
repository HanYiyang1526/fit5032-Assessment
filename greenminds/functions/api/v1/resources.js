import resources from '../../../src/data/resources.json'
import { apiJson, apiError, matches, paginate } from '../../../server/rest.js'

// GET /api/v1/resources?audience=&topic=&format=&q=&limit=&offset=
// Educational resources, newest first. `q` searches the title.
export function onRequestGet({ request }) {
  const params = new URL(request.url).searchParams
  const filters = ['audience', 'topic', 'format']
    .map((field) => [field, params.get(field)])
    .filter(([, value]) => value)
  const q = params.get('q')

  const items = resources
    .filter((r) => filters.every(([field, value]) => matches(r[field], value)))
    .filter((r) => !q || matches(r.title, q))
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))

  const page = paginate(items, params)
  if (page.error) return apiError(400, page.error)
  return apiJson(page.body)
}
