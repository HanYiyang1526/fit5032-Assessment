import events from '../src/data/events.json'
import { matches } from './rest.js'

const DATE = /^\d{4}-\d{2}-\d{2}$/

// Public shape of an event in the API.
export function toApiEvent(e) {
  return {
    id: e.id,
    name: e.name,
    type: e.type,
    suburb: e.suburb,
    state: e.state,
    date: e.date,
    capacity: e.capacity,
    registered: e.registered,
    spotsLeft: Math.max(e.capacity - e.registered, 0),
    location: { lat: e.lat, lng: e.lng }
  }
}

// Filters events by the query string. Returns { items } or { error }.
export function filterEvents(params) {
  const suburb = params.get('suburb')
  const type = params.get('type')
  const from = params.get('from')
  const to = params.get('to')
  const available = params.get('available')

  for (const [name, value] of [['from', from], ['to', to]]) {
    if (value && !DATE.test(value)) return { error: `"${name}" must be a date like 2026-11-01.` }
  }
  if (available && !['true', 'false'].includes(available)) {
    return { error: '"available" must be true or false.' }
  }

  const items = events
    .filter((e) => !suburb || matches(e.suburb, suburb))
    .filter((e) => !type || matches(e.type, type))
    .filter((e) => !from || e.date >= from)
    .filter((e) => !to || e.date <= to)
    .filter((e) => available !== 'true' || e.registered < e.capacity)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
    .map(toApiEvent)

  return { items }
}

export function findEvent(id) {
  const event = events.find((e) => String(e.id) === String(id))
  return event ? toApiEvent(event) : null
}
