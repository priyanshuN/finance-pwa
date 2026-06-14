import { useMemo } from 'react'
import { getRecurringSummary, formatINRFull, formatINR, CATEGORY_COLORS } from '../lib/utils'

export default function Recurring({ transactions }) {
  const summary = useMemo(() => getRecurringSummary(transactions), [transactions])
  const totalMonthly = summary.reduce((s, r) => s + r.typicalAmount, 0)
  const paidCount = summary.filter(r => r.paidThisMonth).length

  return (
    <div style={{ paddingBottom: 32 }}>

      {/* Header card */}
      <div style={{
        margin: '16px 16px 0',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, padding: '20px',
      }} className="fade-up">
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Fixed monthly commitments
        </div>
        <div className="mono" style={{ fontSize: 32, fontWeight: 500, margin: '6px 0 2px', letterSpacing: '-1px' }}>
          {formatINRFull(totalMonthly)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          {summary.length} recurring · <span style={{ color: 'var(--green)' }}>{paidCount} paid this month</span>
          {summary.length - paidCount > 0 && (
            <span style={{ color: 'var(--red)', marginLeft: 4 }}>· {summary.length - paidCount} pending</span>
          )}
        </div>
      </div>

      {/* This month status */}
      <div style={{ margin: '16px 16px 0' }} className="fade-up">
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          This month
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
          {summary.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              No recurring transactions detected yet
            </div>
          )}
          {summary.map((r, i) => (
            <div key={r.vendor} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px',
              borderBottom: i < summary.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: CATEGORY_COLORS[r.category] || '#a0aec0',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.vendor}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                  {r.category} · {r.months.length} months
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                <div className="mono" style={{ fontSize: 13, fontWeight: 500 }}>
                  {formatINR(r.typicalAmount)}
                </div>
                <div style={{
                  fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                  background: r.paidThisMonth ? 'rgba(39,103,73,0.15)' : 'rgba(197,48,48,0.12)',
                  color: r.paidThisMonth ? 'var(--green)' : 'var(--red)',
                  letterSpacing: '0.04em',
                }}>
                  {r.paidThisMonth ? 'PAID' : 'PENDING'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
