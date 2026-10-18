import { auth } from '../firebase.js'

// Calls our Cloudflare Pages Functions (BR E.1). The Firebase ID token is
// attached so the function can verify who is calling.
export async function apiPost(path, body) {
  const user = auth.currentUser
  if (!user) throw new Error('Please log in first.')
  const token = await user.getIdToken()

  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  })

  let data = {}
  try {
    data = await response.json()
  } catch (err) {
    // Non-JSON response (e.g. functions not running locally).
  }
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status}).`)
  }
  return data
}
