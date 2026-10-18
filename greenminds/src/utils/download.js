import { toCsv } from './csv.js'

// BR (E.4) Export: file downloads for table data.

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function downloadCsv(rows, columns, filename) {
  // The BOM makes Excel open the file as UTF-8 (keeps characters like "–").
  const blob = new Blob(['﻿' + toCsv(rows, columns)], { type: 'text/csv;charset=utf-8' })
  saveBlob(blob, filename)
}

// jsPDF is loaded only when a PDF is requested, keeping it out of the
// main bundle.
export async function downloadPdf(rows, columns, { title, filename }) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])

  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text(title, 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(
    `GreenMinds Australia · ${rows.length} records · exported ${new Date().toLocaleString('en-AU')}`,
    14,
    22
  )

  autoTable(doc, {
    startY: 27,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => (row[c.field] == null ? '' : String(row[c.field])))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 109, 17] },
    alternateRowStyles: { fillColor: [247, 246, 240] }
  })

  doc.save(filename)
}
