import { getBearerToken, verifyFirebaseUser } from '../../server/auth.js'
import { sendEmail } from '../../server/email.js'
import { getDocs } from '../../server/firestore.js'
import { escapeHtml, json } from '../../server/http.js'

// Cloudflare limits outgoing requests per invocation, so cap each batch.
const MAX_RECIPIENTS = 40
const UID = /^[A-Za-z0-9]{1,128}$/

// BR (F.1) Innovation — Bulk Email: an Admin sends one message to the
// users selected on the dashboard.
// POST /api/bulk-email  { recipientIds: [uid, ...], subject, message }
// Recipient addresses are looked up on the server from Firestore, never
// taken from the request, and each person receives their own copy (no
// one can see the other recipients).
export async function onRequestPost({ request, env }) {
  const caller = await verifyFirebaseUser(request, env)
  if (!caller) {
    return json({ error: 'Please log in.' }, 401)
  }
  const idToken = getBearerToken(request)

  let body
  try {
    body = await request.json()
  } catch (err) {
    return json({ error: 'Request body must be JSON.' }, 400)
  }

  const subject = String(body.subject || '').trim()
  const message = String(body.message || '').trim()
  const recipientIds = Array.isArray(body.recipientIds) ? [...new Set(body.recipientIds)] : []

  if (!subject || subject.length > 150) {
    return json({ error: 'Subject is required (max 150 characters).' }, 400)
  }
  if (message.length < 10 || message.length > 5000) {
    return json({ error: 'Message must be between 10 and 5000 characters.' }, 400)
  }
  if (!recipientIds.length || !recipientIds.every((id) => UID.test(String(id)))) {
    return json({ error: 'Select at least one recipient.' }, 400)
  }
  if (recipientIds.length > MAX_RECIPIENTS) {
    return json({ error: `You can email at most ${MAX_RECIPIENTS} users at a time.` }, 400)
  }

  // Only Admins may send bulk email: check the caller's own profile.
  let recipients
  try {
    const [profile] = await getDocs(env, idToken, 'users', [caller.sub])
    if (!profile || profile.role !== 'Admin') {
      return json({ error: 'Only administrators can send bulk email.' }, 403)
    }
    recipients = await getDocs(env, idToken, 'users', recipientIds)
  } catch (err) {
    if (err.status === 403) {
      return json({ error: 'Only administrators can send bulk email.' }, 403)
    }
    console.error(err)
    return json({ error: 'Could not look up recipients. Please try again later.' }, 502)
  }

  const bodyHtml = escapeHtml(message).replace(/\n/g, '<br>')
  const results = await Promise.allSettled(
    recipients
      .filter((r) => r.email)
      .map((r) =>
        sendEmail(env, {
          to: [{ email: r.email, name: r.displayName || r.email }],
          subject,
          html: `<p>Hi ${escapeHtml(r.displayName || 'there')},</p>
            <p>${bodyHtml}</p>
            <p>— GreenMinds Australia</p>`
        })
      )
  )

  const failed = results.filter((r) => r.status === 'rejected')
  failed.forEach((r) => console.error(r.reason))
  const sent = results.length - failed.length

  if (!sent) {
    return json({ error: 'The email service is unavailable. Please try again later.' }, 502)
  }
  return json({
    ok: true,
    sent,
    failed: failed.length,
    skipped: recipientIds.length - results.length
  })
}
