import { apiError, apiJson } from '../../../server/rest.js'

// GET /api/v1 lists the available routes; any other /api/v1/* path
// without its own route is a 404.
export function onRequestGet({ params }) {
  if (params.path && params.path.length) {
    return apiError(404, 'Unknown endpoint. See /api/v1 for the available routes.')
  }
  return apiJson({
    name: 'GreenMinds Australia public API',
    version: 'v1',
    routes: [
      { method: 'GET', path: '/api/v1/events', query: ['suburb', 'type', 'from', 'to', 'available', 'limit', 'offset'] },
      { method: 'GET', path: '/api/v1/events/{id}' },
      { method: 'GET', path: '/api/v1/resources', query: ['audience', 'topic', 'format', 'q', 'limit', 'offset'] }
    ]
  })
}
