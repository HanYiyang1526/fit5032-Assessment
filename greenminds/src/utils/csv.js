// Builds CSV text from table rows. Used for downloads (BR E.4) and as the
// email attachment (BR D.2).
// columns: [{ field, header }]
export function toCsv(rows, columns) {
  const lines = [columns.map((c) => escapeCell(c.header)).join(',')]
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCell(row[c.field])).join(','))
  }
  return lines.join('\r\n')
}

function escapeCell(value) {
  let text = value == null ? '' : String(value)
  // BR (C.4) Guard against CSV formula injection when opened in Excel.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`
  return text
}

// Base64 of the UTF-8 bytes, for sending a file inside a JSON body.
export function toBase64(text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}
