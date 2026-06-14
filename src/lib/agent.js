import { TOOL_DEFINITIONS, runTool } from './agentTools'

const MAX_ITERATIONS = 5

export async function runAgent({ messages, transactions, onStep }) {
  const steps = []
  // OpenAI message format throughout
  const history = messages.map(m => ({ role: m.role, content: m.content }))

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const isLastChance = i === MAX_ITERATIONS - 1

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: history,
        tools: isLastChance ? [] : TOOL_DEFINITIONS,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(err.error || `HTTP ${res.status}`)
    }

    const data = await res.json()

    if (!data.tool_calls || data.tool_calls.length === 0) {
      return { text: data.text, steps }
    }

    // Append assistant message with tool_calls (OpenAI format)
    history.push({
      role: 'assistant',
      content: data.text || null,
      tool_calls: data.tool_calls,
    })

    // Execute each tool and append results
    for (const tc of data.tool_calls) {
      const input = JSON.parse(tc.function.arguments || '{}')
      const label = toolStatusLabel(tc.function.name, input)
      onStep?.({ name: tc.function.name, input, label, result: null })

      const result = runTool(tc.function.name, input, transactions)
      const step = { name: tc.function.name, input, label, result }
      steps.push(step)
      onStep?.(step)

      history.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      })
    }
  }

  throw new Error('Agent loop exceeded max iterations')
}

function toolStatusLabel(name, input) {
  if (name === 'getTransactions') {
    const parts = []
    if (input.month) parts.push(monthLabel(input.month))
    if (input.category) parts.push(input.category)
    if (input.direction) parts.push(input.direction + 's')
    return `Fetching ${parts.length ? parts.join(' · ') : 'all'} transactions…`
  }
  if (name === 'getSummary') {
    const period = input.month ? monthLabel(input.month) : 'all-time'
    return `Summarising ${period} by ${input.groupBy}…`
  }
  if (name === 'getBudgets') return 'Reading budget limits…'
  return `Calling ${name}…`
}

function monthLabel(ym) {
  return new Date(ym + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })
}
