import { useState } from 'react'

const TOOL_ICON = { getTransactions: '⬡', getSummary: '◈', getBudgets: '◎' }

export default function ReasoningPanel({ steps }) {
  const [open, setOpen] = useState(false)
  if (!steps || steps.length === 0) return null

  return (
    <div style={{ marginTop: 6, marginBottom: 2 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', padding: '2px 0', cursor: 'pointer',
          fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5,
          fontFamily: 'Syne, sans-serif', letterSpacing: '0.02em',
        }}
      >
        <span style={{ fontSize: 9, transition: 'transform 0.15s', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
        {steps.length} tool call{steps.length > 1 ? 's' : ''}
      </button>

      {open && (
        <div style={{
          marginTop: 4,
          borderLeft: '2px solid var(--border)',
          paddingLeft: 10,
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          {steps.map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--accent)', marginRight: 4 }}>{TOOL_ICON[s.name] || '◦'}</span>
              <span style={{ color: 'var(--text)' }}>{s.name}</span>
              <span style={{ color: 'var(--muted)' }}>({formatArgs(s.input)})</span>
              {s.result && (
                <span style={{ color: 'var(--muted)', opacity: 0.7 }}> → {resultSummary(s.name, s.result)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatArgs(input) {
  if (!input || Object.keys(input).length === 0) return ''
  return Object.entries(input)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(', ')
}

function resultSummary(name, result) {
  if (name === 'getTransactions') return `${result.total} txns`
  if (name === 'getSummary') return `${result.groups?.length || 0} groups`
  if (name === 'getBudgets') return `${result.budgets?.length || 0} budgets`
  return 'ok'
}
