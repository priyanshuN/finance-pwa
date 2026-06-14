import React, { useState, useRef, useEffect } from 'react'
import Markdown from 'react-markdown'
import { useChat } from '../hooks/useChat'
import { filterByMonth } from '../lib/utils'

const FOLLOWUPS = [
  'Summarise this month',
  'What did I spend most on?',
  'How much on food & groceries?',
  'Any unusual transactions?',
  'Which category went over budget?',
  'Compare to last month',
]

export default function Chat({ transactions, month, onOpenSettings }) {
  const { messages, loading, error, send, clear } = useChat(transactions, month)
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  const monthFiltered = filterByMonth(transactions, month)
  const txnCount = monthFiltered.length
  const monthLabel = month
    ? new Date(month + '-01').toLocaleString('default', { month: 'long' })
    : 'All time'

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleSend(text) {
    const t = (text || input).trim()
    if (!t || loading) return
    setInput('')
    send(t)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>

      {/* Header */}
      <div style={{ padding: '52px 20px 8px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ask your spending</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginTop: 1 }}>Chat</div>
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          {messages.length > 0 && (
            <button onClick={clear} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>↺</button>
          )}
          <button onClick={onOpenSettings} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>⚙</button>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', color: 'var(--accent-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>P</div>
        </div>
      </div>

      {/* Context indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 16px 8px', flexShrink: 0 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 11px', borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
          Claude Sonnet · sees <span className="mono" style={{ color: 'var(--text)', marginLeft: 3 }}>{monthLabel} · {txnCount} txns</span>
        </span>
      </div>

      {/* Messages */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '6px 16px 8px' }}>
        {messages.length === 0 && (
          <div style={{ paddingTop: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FOLLOWUPS.map(s => (
                <button key={s} onClick={() => handleSend(s)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 16px', fontSize: 13, color: 'var(--text)', cursor: 'pointer', textAlign: 'left', fontFamily: 'Syne, sans-serif', lineHeight: 1.4 }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: m.role === 'assistant' ? 9 : 0, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
            {m.role === 'assistant' && (
              <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--accent)', marginTop: 1 }}>◌</div>
            )}
            <div style={{
              maxWidth: '84%',
              background: m.role === 'user' ? 'var(--accent)' : 'var(--surface)',
              color: m.role === 'user' ? 'var(--accent-fg)' : 'var(--text)',
              border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
              borderRadius: m.role === 'user' ? '16px 16px 5px 16px' : '16px 16px 16px 5px',
              padding: '10px 14px', fontSize: 13.5, lineHeight: 1.6,
            }}>
              {m.role === 'user' ? m.content : (
                <div className="chat-md"><Markdown components={{
                  p:      ({ children }) => <p style={{ margin: '0 0 8px', lineHeight: 1.6 }}>{children}</p>,
                  strong: ({ children }) => <strong style={{ fontWeight: 700, color: 'var(--text)' }}>{children}</strong>,
                  em:     ({ children }) => <em style={{ fontStyle: 'normal', color: 'var(--muted)' }}>{children}</em>,
                  ul:     ({ children }) => <ul style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ul>,
                  ol:     ({ children }) => <ol style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ol>,
                  li:     ({ children }) => <li style={{ margin: '3px 0', lineHeight: 1.5 }}>{children}</li>,
                  code:   ({ children }) => <code style={{ background: 'var(--surface2)', borderRadius: 4, padding: '1px 5px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)' }}>{children}</code>,
                }}>
                  {m.content}
                </Markdown></div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 16 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--accent)' }}>◌</div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px 16px 16px 5px', padding: '10px 18px', fontSize: 18, color: 'var(--muted)', letterSpacing: 2 }}>···</div>
          </div>
        )}

        {error && <div style={{ fontSize: 12, color: 'var(--red)', textAlign: 'center', padding: '6px 0' }}>{error}</div>}
        <div ref={endRef} />
      </div>

      {/* Follow-up suggestions */}
      {messages.length > 0 && !loading && (
        <div style={{ display: 'flex', gap: 8, padding: '4px 16px 8px', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
          {FOLLOWUPS.map(s => (
            <button key={s} onClick={() => handleSend(s)} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 18, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text)', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Syne, sans-serif' }}>{s}</button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))', flexShrink: 0 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--muted)' }}>＋</div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Ask about your spending…"
          rows={1}
          style={{ flex: 1, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 13.5, color: 'var(--text)', outline: 'none', fontFamily: 'Syne, sans-serif', resize: 'none', lineHeight: 1.5 }}
        />
        <button onClick={() => handleSend()} disabled={!input.trim() || loading} style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: input.trim() && !loading ? 'var(--accent)' : 'var(--surface2)', color: input.trim() && !loading ? 'var(--accent-fg)' : 'var(--muted)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, cursor: input.trim() && !loading ? 'pointer' : 'default' }}>↑</button>
      </div>
    </div>
  )
}
