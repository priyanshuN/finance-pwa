export function transactionsToCSV(transactions) {
  const headers = ['date', 'vendor', 'category', 'amount', 'direction', 'account_type']
  const rows = transactions.map(t =>
    headers.map(h => {
      const v = String(t[h] ?? '')
      return v.includes(',') ? `"${v}"` : v
    }).join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

export function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportTransactions(transactions, month) {
  const filtered = month
    ? transactions.filter(t => t.date.startsWith(month))
    : transactions
  const csv = transactionsToCSV(filtered)
  const label = month || 'all'
  downloadCSV(csv, `finance-${label}.csv`)
  return filtered.length
}
