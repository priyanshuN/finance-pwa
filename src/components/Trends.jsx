import { useMemo, useState } from 'react'
import { getDebits, groupByCategory, formatINR, formatINRFull, CATEGORY_COLORS, getMonths, monthlyByCategory } from '../lib/utils'

const RANGES = ['3M', '6M', '12M', 'All']

function IconBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>{children}</button>
  )
}

function rangeEyebrow(months, range) {
  if (!months.length) return ''
  if (range === 'All' || months.length <= 1) {
    const first = new Date(months[0] + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })
    const last = new Date(months[months.length - 1] + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })
    return months.length === 1 ? last.toUpperCase() : `${first} – ${last}`.toUpperCase()
  }
  const first = new Date(months[0] + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })
  const last = new Date(months[months.length - 1] + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })
  return `${first} – ${last}`.toUpperCase()
}

export default function Trends({ transactions, onOpenSettings }) {
  const [range, setRange] = useState('3M')

  const allMonths = useMemo(() => getMonths(transactions), [transactions])

  const visibleMonths = useMemo(() => {
    if (range === 'All') return allMonths
    const n = range === '3M' ? 3 : range === '6M' ? 6 : 12
    return allMonths.slice(-n)
  }, [allMonths, range])

  const debits = useMemo(() => {
    const t = transactions.filter(t => t.direction === 'debit' && visibleMonths.some(m => t.date.startsWith(m)))
    return t
  }, [transactions, visibleMonths])

  const overall = useMemo(() => groupByCategory(debits), [debits])
  const { perMonth, stackKeys } = useMemo(() => monthlyByCategory(debits, visibleMonths), [debits, visibleMonths])

  const totalAll = debits.reduce((s, t) => s + t.amount, 0)
  const avg = visibleMonths.length ? Math.round(totalAll / visibleMonths.length) : 0

  const lastMonth = perMonth[perMonth.length - 1]
  const prevMonth = perMonth[perMonth.length - 2]
  const deltaPct = prevMonth?.total ? Math.round(((lastMonth?.total - prevMonth.total) / prevMonth.total) * 100) : 0
  const deltaDown = deltaPct <= 0

  const maxTotal = Math.max(...perMonth.map(x => x.total), 1)
  const chartH = 150

  const topCats = useMemo(() => overall.slice(0, 5).map(c => {
    const series = visibleMonths.map(m => debits.filter(t => t.date.startsWith(m) && t.category === c.name).reduce((s, t) => s + t.amount, 0))
    return { ...c, series, share: Math.round((c.value / totalAll) * 100) }
  }), [overall, visibleMonths, debits, totalAll])

  const methodColors = { UPI: 'var(--purple)', 'Credit Card': 'var(--blue)', 'Debit Card': 'var(--teal)' }

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '52px 20px 8px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{rangeEyebrow(visibleMonths, range)}</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginTop: 1 }}>Trends</div>
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          <IconBtn onClick={onOpenSettings}>⚙</IconBtn>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', color: 'var(--accent-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>P</div>
        </div>
      </div>

      {/* Date range selector */}
      <div style={{ padding: '2px 20px 8px' }}>
        <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 11, padding: 3 }}>
          {RANGES.map(r => {
            const on = r === range
            return (
              <button key={r} onClick={() => setRange(r)} style={{ flex: 1, textAlign: 'center', padding: '7px 0', fontSize: 12.5, fontWeight: on ? 600 : 500, borderRadius: 8, color: on ? 'var(--text)' : 'var(--muted)', background: on ? 'var(--surface)' : 'transparent', boxShadow: on ? 'var(--shadow)' : 'none', border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', transition: 'all 0.15s' }}>{r}</button>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '4px 16px 16px' }}>
        {/* Summary trio */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '14px 16px', display: 'flex', gap: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total · {range}</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 500, marginTop: 3 }}>{formatINRFull(totalAll)}</div>
          </div>
          <div style={{ flex: 1, borderLeft: '1px solid var(--border)', paddingLeft: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monthly avg</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 500, marginTop: 3 }}>{formatINRFull(avg)}</div>
          </div>
          {perMonth.length >= 2 && (
            <div style={{ flex: 1, borderLeft: '1px solid var(--border)', paddingLeft: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lastMonth?.label} vs {prevMonth?.label}</div>
              <div className="mono" style={{ fontSize: 17, fontWeight: 700, marginTop: 3, color: deltaDown ? 'var(--green)' : 'var(--red)' }}>
                {deltaDown ? '▼' : '▲'}{Math.abs(deltaPct)}%
              </div>
            </div>
          )}
        </div>

        {/* Monthly stacked bars */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px 16px 14px', marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Monthly spend by category</div>
            <div style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 500 }}>Stacked</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: chartH, padding: '0 4px' }}>
            {perMonth.map(col => (
              <div key={col.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{formatINR(col.total)}</span>
                <div style={{ width: '100%', maxWidth: 62, height: col.total > 0 ? Math.max((col.total / maxTotal) * (chartH - 26), 4) : 4, display: 'flex', flexDirection: 'column', borderRadius: 7, overflow: 'hidden', alignSelf: 'flex-end' }}>
                  {col.segs.filter(s => s.value > 0).map(s => (
                    <div key={s.name} title={s.name} style={{ height: `${(s.value / Math.max(col.total, 1)) * 100}%`, background: s.color, minHeight: 1 }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '8px 4px 0' }}>
            {perMonth.map(col => <div key={col.m} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--text)', fontWeight: 500 }}>{col.label}</div>)}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px 14px', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            {[...stackKeys.map(k => ({ name: k, color: CATEGORY_COLORS[k] || '#a0aec0' })), { name: 'Other', color: '#5b6478' }].filter((s, i) => i < stackKeys.length || perMonth.some(col => col.segs.find(x => x.name === 'Other' && x.value > 0))).map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />{s.name}
              </div>
            ))}
          </div>
        </div>

        {/* Top categories with sparkbars */}
        {topCats.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Top categories · trend</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {topCats.map(c => {
                const smax = Math.max(...c.series, 1)
                return (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{c.share}% of spend</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 26 }}>
                      {c.series.map((v, i) => (
                        <div key={i} style={{ width: 7, height: Math.max((v / smax) * 26, 2), background: i === c.series.length - 1 ? c.color : `color-mix(in srgb, ${c.color} 45%, var(--surface2))`, borderRadius: 2 }} />
                      ))}
                    </div>
                    <div className="mono" style={{ fontSize: 12.5, width: 52, textAlign: 'right', flexShrink: 0 }}>{formatINR(c.value)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Payment method */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Payment method</div>
          {['UPI', 'Credit Card', 'Debit Card'].map((m, i) => {
            const amt = debits.filter(t => t.account_type === m).reduce((s, t) => s + t.amount, 0)
            const pct = totalAll ? Math.round((amt / totalAll) * 100) : 0
            return (
              <div key={m} style={{ marginBottom: i < 2 ? 12 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span>{m}</span>
                  <span className="mono" style={{ fontSize: 11.5 }}>{formatINR(amt)} <span style={{ color: 'var(--muted)' }}>({pct}%)</span></span>
                </div>
                <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: methodColors[m], borderRadius: 3 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
