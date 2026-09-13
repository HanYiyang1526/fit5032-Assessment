/**
 * BR (C.4) Security utilities.
 *
 * Two concrete security measures are implemented here:
 *
 * 1. hashPassword() - passwords are never stored or compared in plain
 *    text. We use the browser's built-in Web Crypto API (SHA-256) to
 *    hash passwords before they are saved to localStorage or compared
 *    during login. This protects against the password itself being
 *    read directly out of localStorage/devtools by anyone inspecting
 *    the browser storage.
 *
 * 2. sanitizeText() - any free-text user input that gets rendered back
 *    on the page (e.g. a rating comment) is stripped of HTML/script
 *    tags before being stored. This is a defence against stored XSS,
 *    where a malicious user could otherwise submit input like
 *    "<script>...</script>" that gets executed when other users view
 *    the page.
 */

export async function hashPassword(plainText) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plainText)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function sanitizeText(input) {
  if (!input) return ''
  // Strip any HTML tags entirely (covers <script>, <img onerror=...>, etc.)
  const withoutTags = input.replace(/<[^>]*>/g, '')
  // Escape any remaining special characters as a second layer of defence
  return withoutTags
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
