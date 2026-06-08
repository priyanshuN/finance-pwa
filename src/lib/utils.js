export const CATEGORY_COLORS = {
  'Food Delivery':   '#e53e3e',
  'Groceries':       '#2b6cb0',
  'Travel':          '#6b46c1',
  'Travel / Stay':   '#805ad5',
  'Shopping':        '#c05621',
  'Utilities':       '#2c7a7b',
  'Housing':         '#b7791f',
  'Health':          '#2f855a',
  'Subscriptions':   '#d69e2e',
  'Investment':      '#1a365d',
  'EMI / Loan':      '#742a2a',
  'UPI / Personal':  '#718096',
  'Home Services':   '#4a5568',
  'Personal Care':   '#d53f8c',
  'Govt / Tax':      '#2d3748',
  'Income / Credit': '#276749',
  'Transfer':        '#553c9a',
  'Cash':            '#744210',
  'Other':           '#a0aec0',
}

export function getMonths(transactions) {
  const months = [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort()
  return months
}

export function filterByMonth(transactions, month) {
  if (!month) return transactions
  return transactions.filter(t => t.date.startsWith(month))
}

export function getDebits(transactions) {
  return transactions.filter(t => t.direction === 'debit')
}

export function getCredits(transactions) {
  return transactions.filter(t => t.direction === 'credit')
}

export function sumAmount(transactions) {
  return transactions.reduce((s, t) => s + t.amount, 0)
}

export function groupByCategory(transactions) {
  const map = {}
  for (const t of transactions) {
    if (!map[t.category]) map[t.category] = 0
    map[t.category] += t.amount
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] || '#a0aec0' }))
}

export function monthlyTotals(transactions) {
  const map = {}
  for (const t of transactions) {
    if (t.direction !== 'debit') continue
    const m = t.date.slice(0, 7)
    if (!map[m]) map[m] = 0
    map[m] += t.amount
  }
  return Object.entries(map).sort().map(([month, total]) => ({
    month: month.slice(5), // "01" "02" etc
    label: new Date(month + '-01').toLocaleString('default', { month: 'short' }),
    total,
  }))
}

export function formatINR(amount) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000)   return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount.toFixed(0)}`
}

export function formatINRFull(amount) {
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
