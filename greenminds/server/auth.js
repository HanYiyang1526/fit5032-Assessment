import { createRemoteJWKSet, jwtVerify } from 'jose'

// Google's public keys for Firebase ID tokens. jose caches them between
// requests handled by the same Worker instance.
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

// BR (E.1, C.4) Server-side check that the caller is a signed-in user:
// verifies the Firebase ID token sent as "Authorization: Bearer <token>"
// and returns its claims (uid in `sub`, plus `email`), or null.
export function getBearerToken(request) {
  const header = request.headers.get('Authorization') || ''
  const match = header.match(/^Bearer (.+)$/)
  return match ? match[1] : null
}

export async function verifyFirebaseUser(request, env) {
  const token = getBearerToken(request)
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID
    })
    return payload
  } catch (err) {
    return null
  }
}
