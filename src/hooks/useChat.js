import { useState, useTransition } from 'react'
import { filterByMonth, getDebits, getCredits, sumAmount, groupByCategory, formatINRFull } from '../lib/utils'

function buildContext(transactions, month) {
  const filtered = month ? transactions.filter(t => t.date.startsWith(month)) : transactions
  const debits = getDebits(filtered)
  const credits = getCredits(filtered)
  const cats = groupByCategory(debits)
  const period = month
    ? new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })
    : 'all time'

  const recentLines = [...filtered]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 40)
    .map(t => `${t.date} | ${t.vendor} | ${t.category} | ${t.direction === 'credit' ? '+' : '-'}₹${t.amount}`)
    .join('\n')

  return `Period: ${period}
Total spend: ${formatINRFull(sumAmount(debits))} across ${debits.length} debit transactions
Total credited: ${formatINRFull(sumAmount(credits))} across ${credits.length} credit transactions

Top categories:
${cats.slice(0, 8).map(c => `- ${c.name}: ${formatINRFull(c.value)}`).join('\n')}

Recent transactions (newest first):
${recentLines}`
}

export function useChat(transactions, month) {
  const [messages, setMessages] = useState([])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState(null)

  function send(text) {
    const userMsg = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setError(null)

    startTransition(async () => {
      try {
        const context = buildContext(transactions, month)
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: next, context }),
        })
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setMessages(prev => [...prev, { role: 'assistant', content: json.reply }])
      } catch (err) {
        setError(err.message)
        setMessages(prev => prev.slice(0, -1))
      }
    })
  }

  function clear() {
    setMessages([])
    setError(null)
  }

  return { messages, loading: isPending, error, send, clear }
}
