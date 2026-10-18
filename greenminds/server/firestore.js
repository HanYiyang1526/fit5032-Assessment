// Reads Firestore documents through the REST API *as the calling user*
// (their Firebase ID token), so the same security rules that protect the
// web app also apply here: an Admin can read any user, everyone else only
// themselves.

function docPath(env, collection, id) {
  return `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}/${id}`
}

// Converts Firestore REST "fields" into a plain object (string fields only,
// which is all the user profiles contain besides the timestamp).
function plainFields(fields = {}) {
  const out = {}
  for (const [key, value] of Object.entries(fields)) {
    if ('stringValue' in value) out[key] = value.stringValue
    else if ('timestampValue' in value) out[key] = value.timestampValue
  }
  return out
}

// Returns [{ id, ...fields }] for the documents that exist and the caller
// is allowed to read; missing documents are skipped.
export async function getDocs(env, idToken, collection, ids) {
  if (!ids.length) return []
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:batchGet`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents: ids.map((id) => docPath(env, collection, id)) })
    }
  )
  if (response.status === 403) {
    const err = new Error('permission-denied')
    err.status = 403
    throw err
  }
  if (!response.ok) throw new Error(`Firestore responded ${response.status}`)

  const results = await response.json()
  return results
    .filter((r) => r.found)
    .map((r) => ({ id: r.found.name.split('/').pop(), ...plainFields(r.found.fields) }))
}
