import React from 'react'

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8, width: '100%',
      maxWidth: 440, padding: '0 20px', pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div
          key={t.key}
          onClick={() => onDismiss(t.key)}
          style={{
            background: t.type === 'error' ? 'var(--red)' : t.type === 'success' ? 'var(--green)' : 'var(--accent)',
            color: t.type === 'info' ? 'var(--accent-fg)' : '#fff',
            padding: '10px 16px', borderRadius: 12,
            fontSize: 13, fontWeight: 500,
            animation: 'fadeUp 0.2s ease',
            pointerEvents: 'auto', cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
