import React, { useState, useMemo } from 'react'
import { filterByMonth, formatDate, formatINRFull, CATEGORY_COLORS } from '../lib/utils'

export default function Transactions({ transactions, month, recurringIds = new Set(), anomalyIds = new Set() }) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [expanded, setExpanded] = useState(null)

  const filtered = useMemo(() => {
    let t = filterByMonth(transactions, month)
    if (catFilter) t = t.filter(x => x.category === catFilter)
    if (search) t = t.filter(x =>
      x.vendor.toLowerCase().includes(search.toLowerCase()) ||
      x.category.toLowerCase().includes(search.toLowerCase())
    )
    return [...t].sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, month, search, catFilter])

  const categories = useMemo(() =>
    [...new Set(transactions.map(t => t.category))].sort(),
    [transactions]
  )

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Search */}
      <div style={{ padding: '12px 16px 0' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search vendor or category..."
          style={{
            width: '100%', padding: '10px 14px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, fontSize: 14, color: 'var(--text)',
            outline: 'none', fontFamily: 'Syne, sans-serif',
          }}
        />
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['', ...categories].map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{
            flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 11,
            fontWeight: 500, cursor: 'pointer', fontFamily: 'Syne, sans-serif',
            background: catFilter === c ? 'var(--accent)' : 'var(--surface)',
            color: catFilter === c ? 'var(--accent-fg)' : 'var(--muted)',
            border: '1px solid var(--border)',
          }}>
            {c || 'All'}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px', fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
        {filtered.length} transactions
      </div>

      {/* List */}
      <div style={{ margin: '0 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>No transactions found</div>
        )}
        {filtered.map((t, i) => {
          const key = t.message_id || i
          const isOpen = expanded === key
          return (
            <div
              key={key}
              onClick={() => setExpanded(isOpen ? null : key)}
              style={{
                padding: '12px 16px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: CATEGORY_COLORS[t.category] || '#a0aec0',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.vendor}
                    </div>
                    {recurringIds.has(t.message_id) && (
                      <span style={{
                        fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                        background: 'var(--surface2)', color: 'var(--muted)',
                        flexShrink: 0, letterSpacing: '0.04em',
                      }}>↻</span>
                    )}
                    {anomalyIds.has(t.message_id) && (
                      <span title="Unusually high for this vendor" style={{
                        fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                        background: 'rgba(197,48,48,0.10)', color: 'var(--red)',
                        flexShrink: 0, letterSpacing: '0.04em',
                      }}>⚠</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                    {formatDate(t.date)} · {t.category} · {t.account_type}
                  </div>
                </div>
                <div className="mono" style={{
                  fontSize: 13, fontWeight: 500, flexShrink: 0,
                  color: t.direction === 'credit' ? 'var(--green)' : 'inherit',
                }}>
                  {t.direction === 'credit' ? '+' : '−'}₹{t.amount.toLocaleString('en-IN')}
                </div>
              </div>
              {isOpen && (
                <div style={{
                  marginTop: 10, marginLeft: 20,
                  background: 'var(--surface2)', borderRadius: 10, padding: '10px 14px',
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px',
                }}>
                  {[
                    ['Full amount', `₹${t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                    ['Date', formatDate(t.date)],
                    ['Category', t.category],
                    ['Payment', t.account_type],
                    ['Type', t.direction],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{label}</div>
                      <div className="mono" style={{ fontSize: 12, marginTop: 1 }}>{val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
