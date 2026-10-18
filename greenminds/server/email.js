// BR (D.2) Email delivery through the Brevo transactional email API.
// attachments: [{ name, content }] where content is base64.
export async function sendEmail(env, { to, subject, html, attachments = [] }) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      sender: { email: env.MAIL_FROM_EMAIL, name: env.MAIL_FROM_NAME || 'GreenMinds Australia' },
      to,
      subject,
      htmlContent: html,
      ...(attachments.length ? { attachment: attachments } : {})
    })
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Brevo responded ${response.status}: ${detail}`)
  }
}
