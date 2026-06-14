import { useState, useTransition } from 'react'
import { runAgent } from '../lib/agent'

export function useAgent(transactions) {
  const [messages, setMessages] = useState([])
  const [statusLabel, setStatusLabel] = useState(null)
  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()

  function send(text) {
    const userMsg = { role: 'user', content: text }
    // Build the window from current messages (captured in closure) + new user msg
    const window = [...messages.slice(-8), userMsg]

    // Add user message synchronously so it renders immediately — no flash
    setMessages(prev => [...prev, userMsg])
    setStatusLabel('Thinking…')
    setError(null)

    startTransition(async () => {
      try {
        const result = await runAgent({
          messages: window,
          transactions,
          onStep: step => setStatusLabel(step.label),
        })
        setStatusLabel(null)
        setMessages(prev => [...prev, { role: 'assistant', content: result.text, steps: result.steps }])
      } catch (err) {
        setStatusLabel(null)
        setError(err.message)
        setMessages(prev => prev.slice(0, -1))
      }
    })
  }

  function clear() {
    setMessages([])
    setStatusLabel(null)
    setError(null)
  }

  return { messages, statusLabel, loading: isPending, error, send, clear }
}
