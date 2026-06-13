import React, { useState, useRef, useEffect } from 'react'
import Markdown from 'react-markdown'
import { useChat } from '../hooks/useChat'

const SUGGESTIONS = [
  'What did I spend most on this month?',
  'How much did I spend on food and groceries?',
  'Are there any unusual transactions?',
  'Which category went over budget?',
]

export default function Chat({ transactions, month }) {
  const { messages, loading, error, send, clear } = useChat(transactions, month)
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    send(text)
  }

  const period = month
    ? new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })
    : 'All time'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 130px)' }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 0' }}>
        {messages.length === 0 && (
          <div>
            <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {period} · Claude Sonnet
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 14, padding: '12px 16px', fontSize: 13,
                    color: 'var(--text)', cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'Syne, sans-serif', lineHeight: 1.4,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 10,
          }}>
            <div style={{
              maxWidth: '82%',
              background: m.role === 'user' ? 'var(--accent)' : 'var(--surface)',
              color: m.role === 'user' ? 'var(--accent-fg)' : 'var(--text)',
              border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: '10px 14px',
              fontSize: 13,
              lineHeight: 1.6,
            }}>
              {m.role === 'user' ? m.content : (
                <Markdown components={{
                  p:      ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
                  strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                  ul:     ({ children }) => <ul style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ul>,
                  ol:     ({ children }) => <ol style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ol>,
                  li:     ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
                  code:   ({ children }) => <code style={{ background: 'var(--surface2)', borderRadius: 4, padding: '1px 5px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{children}</code>,
                }}>
                  {m.content}
                </Markdown>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '18px 18px 18px 4px', padding: '10px 18px',
              fontSize: 18, color: 'var(--muted)', letterSpacing: 2,
            }}>
              ···
            </div>
          </div>
        )}

        {error && (
          <div style={{ fontSize: 12, color: 'var(--red)', textAlign: 'center', padding: '6px 0' }}>
            {error}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input row */}
      <div style={{ padding: '10px 16px', paddingBottom: 'calc(76px + env(safe-area-inset-bottom, 0px))', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        {messages.length > 0 && (
          <button
            onClick={clear}
            title="New chat"
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 10,
              padding: '9px 11px', cursor: 'pointer', color: 'var(--muted)',
              fontSize: 14, fontFamily: 'Syne, sans-serif', flexShrink: 0,
            }}
          >
            ↺
          </button>
        )}
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
          }}
          placeholder="Ask about your spending…"
          rows={1}
          style={{
            flex: 1, padding: '10px 14px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, fontSize: 13, color: 'var(--text)',
            outline: 'none', fontFamily: 'Syne, sans-serif',
            resize: 'none', lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{
            background: input.trim() && !loading ? 'var(--accent)' : 'var(--surface2)',
            color: input.trim() && !loading ? 'var(--accent-fg)' : 'var(--muted)',
            border: 'none', borderRadius: 10, padding: '10px 14px',
            cursor: input.trim() && !loading ? 'pointer' : 'default',
            fontSize: 16, flexShrink: 0,
          }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}
