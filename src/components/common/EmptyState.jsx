import React from 'react'

export default function EmptyState({ icon = '📭', message, sub }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 32px', gap: 8, textAlign: 'center',
    }}>
      <div style={{ fontSize: 36 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{message}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{sub}</div>}
    </div>
  )
}
