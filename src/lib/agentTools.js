import { sumAmount, groupByCategory, formatINRFull } from './utils'
import { storageGet } from './storage'

// OpenAI function-calling format (used by OpenRouter)
export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'getTransactions',
      description: 'Fetch transactions with optional filters. Returns matching transactions.',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'string', description: 'YYYY-MM format, e.g. "2025-04". Omit for all-time.' },
          category: { type: 'string', description: 'Exact category name to filter to, e.g. "Food Delivery".' },
          account_type: { type: 'string', description: 'One of: UPI, Credit Card, Debit Card.' },
          direction: { type: 'string', description: 'One of: debit, credit.' },
          limit: { type: 'number', description: 'Max rows to return. Default 50.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getSummary',
      description: 'Get totals grouped by category, month, or account_type for a given period.',
      parameters: {
        type: 'object',
        properties: {
          groupBy: {
            type: 'string',
            enum: ['category', 'month', 'account_type'],
            description: 'Dimension to group by.',
          },
          month: { type: 'string', description: 'YYYY-MM. Omit for all-time.' },
          direction: { type: 'string', description: 'debit or credit. Default: debit.' },
        },
        required: ['groupBy'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getBudgets',
      description: 'Return current budget limits per category from localStorage.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
]

export function runTool(name, input, transactions) {
  if (name === 'getTransactions') {
    let rows = [...transactions]
    if (input.month)        rows = rows.filter(t => t.date.startsWith(input.month))
    if (input.category)     rows = rows.filter(t => t.category === input.category)
    if (input.account_type) rows = rows.filter(t => t.account_type === input.account_type)
    if (input.direction)    rows = rows.filter(t => t.direction === input.direction)
    rows.sort((a, b) => b.date.localeCompare(a.date))
    const limit = input.limit || 50
    const total = rows.length
    rows = rows.slice(0, limit)
    return {
      total,
      shown: rows.length,
      transactions: rows.map(t => ({
        date: t.date,
        vendor: t.vendor,
        category: t.category,
        amount: t.amount,
        direction: t.direction,
        account_type: t.account_type,
      })),
    }
  }

  if (name === 'getSummary') {
    const dir = input.direction || 'debit'
    let rows = transactions.filter(t => t.direction === dir)
    if (input.month) rows = rows.filter(t => t.date.startsWith(input.month))

    if (input.groupBy === 'category') {
      const cats = groupByCategory(rows)
      return {
        period: input.month || 'all-time',
        direction: dir,
        total: sumAmount(rows),
        groups: cats.map(c => ({ name: c.name, total: c.value, formatted: formatINRFull(c.value) })),
      }
    }

    if (input.groupBy === 'month') {
      const map = {}
      for (const t of rows) {
        const m = t.date.slice(0, 7)
        map[m] = (map[m] || 0) + t.amount
      }
      const groups = Object.entries(map).sort().map(([m, total]) => ({
        name: m,
        label: new Date(m + '-01').toLocaleString('default', { month: 'short', year: 'numeric' }),
        total,
        formatted: formatINRFull(total),
      }))
      return { groups }
    }

    if (input.groupBy === 'account_type') {
      const map = {}
      for (const t of rows) map[t.account_type] = (map[t.account_type] || 0) + t.amount
      return {
        groups: Object.entries(map)
          .sort((a, b) => b[1] - a[1])
          .map(([name, total]) => ({ name, total, formatted: formatINRFull(total) })),
      }
    }
  }

  if (name === 'getBudgets') {
    const raw = storageGet('budgets', {})
    return {
      budgets: Object.entries(raw).map(([category, limit]) => ({
        category,
        limit,
        formatted: formatINRFull(limit),
      })),
    }
  }

  return { error: `Unknown tool: ${name}` }
}
