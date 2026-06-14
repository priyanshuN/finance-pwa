import React, { useMemo, useState, useEffect } from 'react'
import Markdown from 'react-markdown'
import {
  filterByMonth, getDebits, getCredits, sumAmount,
  groupByCategory, monthlyTotals, formatINR, formatINRFull,
  CATEGORY_EMOJI, getRecurringDue, dueLabel,
} from '../lib/utils'
import { useBudget } from '../hooks/useBudget'
import { exportTransactions } from '../lib/export'

function buildDigestSummary(debits, credits, cats, month) {
  const period = month
    ? new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })
    : 'all time'
  return `Period: ${period}
Total spend: ${formatINRFull(sumAmount(debits))} (${debits.length} transactions)
Total credited: ${formatINRFull(sumAmount(credits))}
Top categories: ${cats.slice(0, 6).map(c => `${c.name} ${formatINRFull(c.value)}`).join(', ')}`
}

function groupByDate(transactions) {
  const groups = {}
  for (const t of transactions) {
    if (!groups[t.date]) groups[t.date] = []
    groups[t.date].push(t)
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
}

function formatDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
}

function monthEyebrow(month) {
  if (!month) return 'All time'
  return new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })
}

function DateChip({ day, month }) {
  return (
    <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: 'var(--surface2)', border: '1px solid var(--accent)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
      <span style={{ fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent)', fontWeight: 600 }}>{month}</span>
      <span className="mono" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1, color: 'var(--text)' }}>{day}</span>
    </div>
  )
}

export default function Overview({ transactions, month, months, onMonthChange, onNavigate, onOpenSettings, onSync }) {
  const filtered     = useMemo(() => filterByMonth(transactions, month), [transactions, month])
  const debits       = useMemo(() => getDebits(filtered), [filtered])
  const credits      = useMemo(() => getCredits(filtered), [filtered])
  const cats         = useMemo(() => groupByCategory(debits), [debits])
  const totalSpend   = sumAmount(debits)
  const totalCredit  = sumAmount(credits)
  const net          = totalCredit - totalSpend
  const { budgets }  = useBudget()

  const totalBudget = useMemo(() =>
    Object.values(budgets).reduce((s, v) => s + (parseFloat(v) || 0), 0),
  [budgets])

  const elapsedFrac = useMemo(() => {
    const now = new Date()
    const day = now.getDate()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    return day / daysInMonth
  }, [])

  const momDelta = useMemo(() => {
    if (!month) return null
    const [yr, mo] = month.split('-')
    const prevDate = new Date(parseInt(yr), parseInt(mo) - 2, 1)
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    const prevSpend = sumAmount(getDebits(filterByMonth(transactions, prevMonth)))
    if (!prevSpend) return null
    return ((totalSpend - prevSpend) / prevSpend) * 100
  }, [month, transactions, totalSpend])

  const dueSoon = useMemo(() => getRecurringDue(transactions).filter(r => !r.paidThisMonth && r.daysUntil <= 7), [transactions])
  const dueTotal = useMemo(() => dueSoon.reduce((s, r) => s + r.amount, 0), [dueSoon])

  const recentGroups = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)
    return groupByDate(sorted)
  }, [filtered])

  const topCats = cats.slice(0, 4)
  const topCatTotal = sumAmount(topCats)

  const [digest, setDigest] = useState(null)
  const [digestLoading, setDigestLoading] = useState(false)
  useEffect(() => { setDigest(null) }, [month])

  async function fetchDigest() {
    setDigestLoading(true)
    try {
      const summary = buildDigestSummary(debits, credits, cats, month)
      const res = await fetch('/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      })
      const json = await res.json()
      if (json.digest) setDigest(json.digest)
    } catch { /* silently fail */ }
    finally { setDigestLoading(false) }
  }

  const periodOptions = useMemo(() => {
    return [{ id: '', label: 'All' }, ...months.map(m => ({
      id: m,
      label: new Date(m + '-01').toLocaleString('default', { month: 'short' }),
    }))]
  }, [months])

  const down = (momDelta ?? 0) <= 0
  const pctOfBudget = totalBudget > 0 ? Math.round((totalSpend / totalBudget) * 100) : 0

  return (
    <div style={{ paddingBottom: 8 }}>

      {/* Header */}
      <div style={{ padding: '52px 20px 8px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{monthEyebrow(month)}</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginTop: 1 }}>Overview</div>
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          <IconBtn onClick={onSync}>↻</IconBtn>
          <IconBtn onClick={onOpenSettings}>⚙</IconBtn>
          <Monogram />
        </div>
      </div>

      {/* Period segmented control */}
      <div style={{ padding: '0 20px 8px' }}>
        <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 11, padding: 3 }}>
          {periodOptions.map(p => {
            const active = p.id === month
            return (
              <button key={p.id} onClick={() => onMonthChange(p.id)} style={{
                flex: 1, textAlign: 'center', padding: '6px 0', fontSize: 12.5,
                fontWeight: active ? 600 : 500, borderRadius: 8,
                color: active ? 'var(--text)' : 'var(--muted)',
                background: active ? 'var(--surface)' : 'transparent',
                boxShadow: active ? 'var(--shadow)' : 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif',
                transition: 'all 0.15s',
              }}>{p.label}</button>
            )
          })}
        </div>
      </div>

      {/* Hero card */}
      <div style={{ margin: '8px 20px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '20px', boxShadow: 'var(--shadow-md)' }} className="fade-up">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {month ? new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }) : 'All time'} · spend
          </div>
          {momDelta !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: down ? 'rgba(104,211,145,.15)' : 'rgba(252,129,129,.15)',
              color: down ? 'var(--green)' : 'var(--red)',
              borderRadius: 7, padding: '2px 8px', fontSize: 11, fontWeight: 600,
            }}>
              <span>{down ? '▼' : '▲'}</span>
              <span>{Math.abs(momDelta).toFixed(0)}% vs prev</span>
            </div>
          )}
        </div>

        <div className="mono" style={{ fontSize: 34, fontWeight: 500, margin: '6px 0 2px', letterSpacing: '-1px' }}>
          {formatINRFull(totalSpend)}
        </div>

        {totalCredit > 0 && (
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
            Income <span style={{ color: 'var(--green)' }}>+{formatINR(totalCredit)}</span> · Net <span style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>{net >= 0 ? '+' : '−'}{formatINR(Math.abs(net))}</span>
          </div>
        )}

        {/* Budget bar with pace marker */}
        {totalBudget > 0 && month && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 6 }}>
              <span style={{ color: 'var(--muted)' }}>Monthly budget</span>
              <span className="mono" style={{ fontSize: 11.5 }}>{formatINR(totalSpend)} <span style={{ color: 'var(--muted)' }}>/ {formatINR(totalBudget)} · {pctOfBudget}%</span></span>
            </div>
            <div style={{ position: 'relative', width: '100%', height: 6, background: 'var(--surface2)', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${Math.min((totalSpend / totalBudget) * 100, 100)}%`, borderRadius: 3, background: totalSpend > totalBudget ? 'var(--red)' : 'var(--accent)', transition: 'width 0.4s ease' }} />
              {/* Pace marker — vertical tick at % of month elapsed */}
              <div style={{ position: 'absolute', left: `${Math.min(elapsedFrac * 100, 100)}%`, top: -4, bottom: -4, width: 2, transform: 'translateX(-1px)', background: 'var(--text)', opacity: 0.85, borderRadius: 1 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10.5, color: 'var(--muted)' }}>
              <span><span className="mono">{pctOfBudget}%</span> used</span>
              <span className="mono">today · {Math.round(elapsedFrac * 100)}% elapsed</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ margin: '14px 20px 0', display: 'flex', gap: 8 }} className="fade-up">
        {[
          { icon: '＋', label: 'Add',      action: null },
          { icon: '⇄',  label: 'Transfer', action: null },
          { icon: '◎',  label: 'Budget',   action: () => onNavigate?.('budget') },
          { icon: '↓',  label: 'Export',   action: () => exportTransactions(transactions, month) },
        ].map(a => (
          <button key={a.label} onClick={a.action || undefined} disabled={!a.action} style={{
            flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '12px 4px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            cursor: a.action ? 'pointer' : 'default', opacity: a.action ? 1 : 0.4,
            fontFamily: 'Syne, sans-serif',
          }}>
            <span style={{ fontSize: 18, color: 'var(--text)' }}>{a.icon}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Due in next 7 days */}
      {dueSoon.length > 0 && (
        <div style={{ margin: '14px 20px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px' }} className="fade-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Due in next 7 days</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--orange)' }}>{formatINRFull(dueTotal)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dueSoon.slice(0, 3).map(r => (
              <div key={r.vendor} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <DateChip day={r.day} month={r.nextMonth} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.vendor}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 1 }}>{dueLabel(r.daysUntil)}</div>
                </div>
                <div className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{formatINR(r.amount)}</div>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate?.('budget', 'recurring')} style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11.5, color: 'var(--accent)', fontWeight: 500, padding: 0, fontFamily: 'Syne, sans-serif' }}>
            All recurring ›
          </button>
        </div>
      )}

      {/* AI Digest */}
      <div style={{ margin: '14px 20px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '14px 16px' }} className="fade-up">
        {digest ? (
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>AI Digest</div>
            <div className="chat-md" style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
              <Markdown components={{
                h1:     ({ children }) => <p style={{ margin: '0 0 8px', fontWeight: 600, lineHeight: 1.5 }}>{children}</p>,
                h2:     ({ children }) => <p style={{ margin: '0 0 8px', fontWeight: 600, lineHeight: 1.5 }}>{children}</p>,
                h3:     ({ children }) => <p style={{ margin: '0 0 6px', fontWeight: 600, lineHeight: 1.5 }}>{children}</p>,
                p:      ({ children }) => <p style={{ margin: '0 0 8px', lineHeight: 1.6 }}>{children}</p>,
                strong: ({ children }) => <strong style={{ fontWeight: 700, color: 'var(--text)' }}>{children}</strong>,
                em:     ({ children }) => <em style={{ fontStyle: 'normal', color: 'var(--muted)' }}>{children}</em>,
                ul:     ({ children }) => <ul style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ul>,
                li:     ({ children }) => <li style={{ margin: '3px 0', lineHeight: 1.5 }}>{children}</li>,
                code:   ({ children }) => <code style={{ background: 'var(--surface2)', borderRadius: 4, padding: '1px 5px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)' }}>{children}</code>,
              }}>{digest}</Markdown>
            </div>
            <button onClick={() => { setDigest(null); fetchDigest() }} style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 11, fontFamily: 'Syne, sans-serif', padding: 0 }}>↺ Regenerate</button>
          </div>
        ) : (
          <button onClick={fetchDigest} disabled={digestLoading || debits.length === 0} style={{ width: '100%', background: 'none', border: 'none', cursor: debits.length > 0 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 10, padding: 0, opacity: debits.length === 0 ? 0.4 : 1 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
              {digestLoading ? '···' : '◌'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>{digestLoading ? 'Summarising…' : 'Summarise this month'}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>AI-generated spending digest</div>
            </div>
          </button>
        )}
      </div>

      {/* Where it went */}
      {topCats.length > 0 && (
        <div style={{ margin: '14px 20px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px' }} className="fade-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Where it went</div>
            <button onClick={() => onNavigate?.('transactions')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', fontFamily: 'Syne, sans-serif', padding: 0 }}>Details ›</button>
          </div>
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2, marginBottom: 14 }}>
            {topCats.map(c => <div key={c.name} style={{ flex: c.value, background: c.color, minWidth: 4 }} />)}
            {totalSpend - topCatTotal > 0 && <div style={{ flex: totalSpend - topCatTotal, background: 'var(--surface2)', minWidth: 4 }} />}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            {topCats.map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: 'var(--muted)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div className="mono" style={{ fontSize: 12, flexShrink: 0 }}>{Math.round((c.value / totalSpend) * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recentGroups.length > 0 && (
        <div style={{ margin: '14px 20px 0' }} className="fade-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Recent activity</div>
            <button onClick={() => onNavigate?.('transactions')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', fontFamily: 'Syne, sans-serif', padding: 0 }}>See all ›</button>
          </div>
          {recentGroups.map(([date, txns]) => (
            <div key={date} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, paddingLeft: 4 }}>{formatDayLabel(date)}</div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                {txns.map((t, i) => (
                  <div key={t.message_id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', minHeight: 44, borderBottom: i < txns.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                      {CATEGORY_EMOJI[t.category] || '💳'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.vendor}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{t.category} · {t.account_type}</div>
                    </div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 500, flexShrink: 0, color: t.direction === 'credit' ? 'var(--green)' : 'inherit' }}>
                      {t.direction === 'credit' ? '+' : '−'}₹{t.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function IconBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>{children}</button>
  )
}

function Monogram() {
  return (
    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', color: 'var(--accent-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>P</div>
  )
}
