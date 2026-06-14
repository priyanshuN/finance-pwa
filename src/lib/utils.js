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

export function getRecurringSummary(transactions) {
  const byVendor = {}
  for (const t of transactions) {
    if (t.direction !== 'debit') continue
    if (!byVendor[t.vendor]) byVendor[t.vendor] = []
    byVendor[t.vendor].push(t)
  }

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const summary = []
  for (const [vendor, txns] of Object.entries(byVendor)) {
    const months = new Set(txns.map(t => t.date.slice(0, 7)))
    if (months.size < 2) continue
    const amounts = txns.map(t => t.amount)
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length
    const variance = (Math.max(...amounts) - Math.min(...amounts)) / avg
    if (variance > 0.2) continue

    const paidThisMonth = txns.some(t => t.date.startsWith(currentMonth))
    const lastTxn = [...txns].sort((a, b) => b.date.localeCompare(a.date))[0]
    summary.push({
      vendor,
      category: lastTxn.category,
      typicalAmount: Math.round(avg),
      months: [...months].sort(),
      paidThisMonth,
      lastPaid: lastTxn.date,
    })
  }
  return summary.sort((a, b) => b.typicalAmount - a.typicalAmount)
}

export function detectRecurring(transactions) {
  const summary = getRecurringSummary(transactions)
  const recurringVendors = new Set(summary.map(s => s.vendor))
  const ids = new Set()
  for (const t of transactions) {
    if (recurringVendors.has(t.vendor)) ids.add(t.message_id)
  }
  return ids
}

export function detectAnomalies(transactions) {
  const byVendor = {}
  for (const t of transactions) {
    if (t.direction !== 'debit') continue
    if (!byVendor[t.vendor]) byVendor[t.vendor] = []
    byVendor[t.vendor].push(t)
  }
  const anomalies = new Set()
  for (const txns of Object.values(byVendor)) {
    if (txns.length < 3) continue
    const amounts = txns.map(t => t.amount)
    const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length
    const std = Math.sqrt(amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length)
    if (std === 0) continue
    for (const t of txns) {
      if (t.amount > mean + 2.5 * std) anomalies.add(t.message_id)
    }
  }
  return anomalies
}

export const CATEGORY_EMOJI = {
  'Food Delivery': '🍕', 'Groceries': '🛒', 'Travel': '🚗',
  'Travel / Stay': '🏨', 'Shopping': '🛍️', 'Utilities': '⚡',
  'Housing': '🏠', 'Health': '💊', 'Subscriptions': '📱',
  'Investment': '📈', 'EMI / Loan': '🏦', 'UPI / Personal': '👤',
  'Home Services': '🔧', 'Personal Care': '💇', 'Govt / Tax': '📋',
  'Income / Credit': '💰', 'Transfer': '↔️', 'Cash': '💵',
}

export function getRecurringDue(transactions) {
  const now = new Date()
  const anchorDay = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const byVendor = {}
  for (const t of transactions) {
    if (t.direction !== 'debit') continue
    ;(byVendor[t.vendor] ||= []).push(t)
  }

  const out = []
  for (const [vendor, txns] of Object.entries(byVendor)) {
    if (new Set(txns.map(t => t.date.slice(0, 7))).size < 2) continue
    const amts = txns.map(t => t.amount)
    const avg = amts.reduce((s, a) => s + a, 0) / amts.length
    if ((Math.max(...amts) - Math.min(...amts)) / avg > 0.2) continue

    const counts = {}
    for (const t of txns) { const d = +t.date.slice(8, 10); counts[d] = (counts[d] || 0) + 1 }
    const day = +Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]

    const daysUntil = day >= anchorDay ? day - anchorDay : day + (daysInMonth - anchorDay)
    const nextDate = new Date(now.getFullYear(), now.getMonth(), day)
    if (nextDate <= now) nextDate.setMonth(nextDate.getMonth() + 1)
    const nextMonth = nextDate.toLocaleString('default', { month: 'short' })

    const last = [...txns].sort((a, b) => b.date.localeCompare(a.date))[0]
    const paidThisMonth = txns.some(t => t.date.startsWith(currentMonthKey))

    out.push({
      vendor, category: last.category, account_type: last.account_type,
      amount: Math.round(avg), day, daysUntil, nextMonth,
      nextLabel: `${day} ${nextMonth}`, paidThisMonth, cadence: 'Monthly',
    })
  }
  return out.sort((a, b) => a.daysUntil - b.daysUntil)
}

export function dueLabel(daysUntil) {
  if (daysUntil <= 0) return 'Today'
  if (daysUntil === 1) return 'Tomorrow'
  return `In ${daysUntil} days`
}

export function velocity(spent, limit, elapsedFrac) {
  const usedPct = limit > 0 ? spent / limit : 0
  const projected = elapsedFrac > 0 ? spent / elapsedFrac : spent
  let status
  if (spent > limit) status = 'over'
  else if (projected > limit * 1.05) status = 'ahead'
  else if (projected < limit * 0.8) status = 'under'
  else status = 'ontrack'
  return { usedPct, projected, status, elapsedPct: elapsedFrac }
}

export function monthlyByCategory(transactions, monthKeys) {
  const debits = transactions.filter(t => t.direction === 'debit')
  const overall = groupByCategory(debits)
  const stackKeys = overall.slice(0, 5).map(c => c.name)

  const perMonth = monthKeys.map(m => {
    const md = debits.filter(t => t.date.startsWith(m))
    const byCat = {}
    for (const t of md) byCat[t.category] = (byCat[t.category] || 0) + t.amount
    const segs = stackKeys.map(k => ({ name: k, value: byCat[k] || 0, color: CATEGORY_COLORS[k] || '#a0aec0' }))
    const otherVal = Object.entries(byCat).filter(([k]) => !stackKeys.includes(k)).reduce((s, [, v]) => s + v, 0)
    if (otherVal > 0) segs.push({ name: 'Other', value: otherVal, color: '#5b6478' })
    const total = segs.reduce((s, x) => s + x.value, 0)
    return { m, label: new Date(m + '-01').toLocaleString('default', { month: 'short' }), total, segs }
  })
  return { perMonth, stackKeys }
}

export function amountBounds(transactions) {
  const amounts = transactions.map(t => t.amount)
  if (!amounts.length) return { min: 0, max: 0 }
  return { min: Math.min(...amounts), max: Math.max(...amounts) }
}

export function applyAliasRules(transactions, rules) {
  if (!rules.length) return transactions
  return transactions.map(t => {
    const match = rules.find(r => t.vendor.toLowerCase().includes(r.vendor.toLowerCase()))
    return match ? { ...t, category: match.category } : t
  })
}
