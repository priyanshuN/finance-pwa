import React, { useState, useMemo } from 'react'
import { filterByMonth, formatDate, formatINRFull, CATEGORY_COLORS } from '../lib/utils'

export default function Transactions({ transactions, month }) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')

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
        {filtered.map((t, i) => (
          <div key={t.message_id || i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: CATEGORY_COLORS[t.category] || '#a0aec0',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.vendor}
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
        ))}
      </div>
    </div>
  )
}
