import { findEvent } from '../../../../server/events.js'
import { apiError, apiJson } from '../../../../server/rest.js'

// GET /api/v1/events/{id}
export function onRequestGet({ params }) {
  if (!/^\d+$/.test(params.id)) return apiError(400, 'Event id must be a number.')
  const event = findEvent(params.id)
  if (!event) return apiError(404, `No event with id ${params.id}.`)
  return apiJson({ data: event })
}
