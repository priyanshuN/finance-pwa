import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { getDebits, groupByCategory, monthlyTotals, formatINR, formatINRFull, CATEGORY_COLORS } from '../lib/utils'

export default function Trends({ transactions }) {
  const debits  = useMemo(() => getDebits(transactions), [transactions])
  const monthly = useMemo(() => monthlyTotals(transactions), [transactions])

  // per-month category breakdown
  const categoryByMonth = useMemo(() => {
    const map = {}
    for (const t of debits) {
      const m = t.date.slice(0, 7)
      if (!map[m]) map[m] = {}
      if (!map[m][t.category]) map[m][t.category] = 0
      map[m][t.category] += t.amount
    }
    return Object.entries(map).sort().map(([month, cats]) => ({
      label: new Date(month + '-01').toLocaleString('default', { month: 'short' }),
      ...cats,
    }))
  }, [debits])

  const topCategories = useMemo(() => {
    const cats = groupByCategory(debits)
    return cats.slice(0, 6)
  }, [debits])

  const tooltipStyle = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, fontSize: 11,
  }

  const totalAllTime = debits.reduce((s, t) => s + t.amount, 0)
  const avgMonthly   = monthly.length ? Math.round(totalAllTime / monthly.length) : 0

  return (
    <div style={{ paddingBottom: 32 }}>

      {/* All-time summary */}
      <div style={{
        margin: '16px 16px 0',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, padding: '20px',
        display: 'flex', gap: 12,
      }} className="fade-up">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>All-time spend</div>
          <div className="mono" style={{ fontSize: 28, fontWeight: 500, marginTop: 4 }}>{formatINRFull(totalAllTime)}</div>
        </div>
        <div style={{ flex: 1, borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monthly avg</div>
          <div className="mono" style={{ fontSize: 28, fontWeight: 500, marginTop: 4 }}>{formatINRFull(avgMonthly)}</div>
        </div>
      </div>

      {/* Month over month line */}
      <div style={{ margin: '16px 16px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px 12px 8px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, paddingLeft: 8 }}>Month over month</div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} tickFormatter={formatINR} axisLine={false} tickLine={false} width={45} />
            <Tooltip formatter={v => [formatINRFull(v), 'Spend']} contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category totals all time */}
      <div style={{ margin: '12px 16px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Top categories · all time</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topCategories.map(c => {
            const pct = Math.round((c.value / topCategories[0].value) * 100)
            return (
              <div key={c.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>{c.name}</span>
                  <span className="mono">{formatINRFull(c.value)}</span>
                </div>
                <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: c.color, borderRadius: 3 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stacked monthly by category */}
      <div style={{ margin: '12px 16px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px 12px 8px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, paddingLeft: 8 }}>Category mix by month</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={categoryByMonth} barSize={20}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(v, name) => [formatINRFull(v), name]} contentStyle={tooltipStyle} />
            {topCategories.map(c => (
              <Bar key={c.name} dataKey={c.name} stackId="a" fill={c.color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* UPI vs Card split */}
      <div style={{ margin: '12px 16px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Payment method split</div>
        {['UPI', 'Credit Card', 'Debit Card'].map(method => {
          const amt = debits.filter(t => t.account_type === method).reduce((s, t) => s + t.amount, 0)
          const total = debits.reduce((s, t) => s + t.amount, 0)
          const pct = total ? Math.round((amt / total) * 100) : 0
          const colors = { UPI: 'var(--purple)', 'Credit Card': 'var(--blue)', 'Debit Card': 'var(--teal)' }
          return (
            <div key={method} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>{method}</span>
                <span className="mono">{formatINRFull(amt)} <span style={{ color: 'var(--muted)' }}>({pct}%)</span></span>
              </div>
              <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: colors[method], borderRadius: 3 }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
