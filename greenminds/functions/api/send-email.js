import { verifyFirebaseUser } from '../../server/auth.js'
import { sendEmail } from '../../server/email.js'
import { escapeHtml, json } from '../../server/http.js'

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024
const ALLOWED_FILENAME = /^[\w\- ]{1,80}\.(csv|pdf)$/i
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/

// BR (E.1) Serverless function, BR (D.2) email with an attachment.
// POST /api/send-email  { subject, message, attachment: { filename, content } }
// The email always goes to the signed-in caller's own address, so the
// endpoint cannot be used to send mail to arbitrary people.
export async function onRequestPost({ request, env }) {
  const user = await verifyFirebaseUser(request, env)
  if (!user || !user.email) {
    return json({ error: 'Please log in to send emails.' }, 401)
  }

  let body
  try {
    body = await request.json()
  } catch (err) {
    return json({ error: 'Request body must be JSON.' }, 400)
  }

  const subject = String(body.subject || '').trim()
  const message = String(body.message || '').trim()
  const attachment = body.attachment

  if (!subject || subject.length > 150) {
    return json({ error: 'Subject is required (max 150 characters).' }, 400)
  }
  if (message.length > 5000) {
    return json({ error: 'Message is too long (max 5000 characters).' }, 400)
  }
  if (
    !attachment ||
    !ALLOWED_FILENAME.test(String(attachment.filename || '')) ||
    !BASE64.test(String(attachment.content || ''))
  ) {
    return json({ error: 'A CSV or PDF attachment is required.' }, 400)
  }
  if ((attachment.content.length * 3) / 4 > MAX_ATTACHMENT_BYTES) {
    return json({ error: 'Attachment must be under 2 MB.' }, 413)
  }

  const html = `
    <p>Hi ${escapeHtml(user.name || user.email)},</p>
    <p>${escapeHtml(message || 'Please find your requested file attached.').replace(/\n/g, '<br>')}</p>
    <p>— GreenMinds Australia</p>`

  try {
    await sendEmail(env, {
      to: [{ email: user.email }],
      subject,
      html,
      attachments: [{ name: attachment.filename, content: attachment.content }]
    })
  } catch (err) {
    console.error(err)
    return json({ error: 'The email service is unavailable. Please try again later.' }, 502)
  }

  return json({ ok: true, sentTo: user.email })
}
