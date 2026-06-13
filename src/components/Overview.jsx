import React, { useMemo, useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  filterByMonth, getDebits, getCredits, sumAmount,
  groupByCategory, monthlyTotals, formatINR, formatINRFull, formatDate
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

const QUICK_ACTIONS = [
  { icon: '+', label: 'Add', tab: null },
  { icon: '⇄', label: 'Transfer', tab: null },
  { icon: '◎', label: 'Budget', tab: 'budget' },
  { icon: '↓', label: 'Export', tab: 'export' },
]

export default function Overview({ transactions, month, onNavigate }) {
  const filtered     = useMemo(() => filterByMonth(transactions, month), [transactions, month])
  const debits       = useMemo(() => getDebits(filtered), [filtered])
  const credits      = useMemo(() => getCredits(filtered), [filtered])
  const cats         = useMemo(() => groupByCategory(debits), [debits])
  const monthly      = useMemo(() => monthlyTotals(transactions), [transactions])
  const totalSpend   = sumAmount(debits)
  const totalCredit  = sumAmount(credits)
  const net          = totalCredit - totalSpend
  const { budgets }  = useBudget()

  const totalBudget = useMemo(() =>
    Object.values(budgets).reduce((s, v) => s + (parseFloat(v) || 0), 0),
  [budgets])

  const momDelta = useMemo(() => {
    if (!month) return null
    const [yr, mo] = month.split('-')
    const prevDate = new Date(parseInt(yr), parseInt(mo) - 2, 1)
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    const prevSpend = sumAmount(getDebits(filterByMonth(transactions, prevMonth)))
    if (!prevSpend) return null
    return ((totalSpend - prevSpend) / prevSpend) * 100
  }, [month, transactions, totalSpend])

  const recentGroups = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)
    return groupByDate(sorted)
  }, [filtered])

  const topCats = cats.slice(0, 4)

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
    } catch {
      // silently fail
    } finally {
      setDigestLoading(false)
    }
  }

  function handleQuickAction(action) {
    if (action.tab === 'export') {
      exportTransactions(transactions, month)
    } else if (action.tab && onNavigate) {
      onNavigate(action.tab)
    }
  }

  const upiSpend  = sumAmount(debits.filter(t => t.account_type === 'UPI'))
  const cardSpend = sumAmount(debits.filter(t => t.account_type.includes('Card')))
  const topCat    = cats[0]

  return (
    <div style={{ paddingBottom: 32 }}>

      {/* Hero card */}
      <div style={{
        margin: '16px 16px 0',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '22px 20px',
        boxShadow: 'var(--shadow-md)',
      }} className="fade-up">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {month ? new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }) : 'All time'} · spend
          </div>
          {momDelta !== null && (
            <div style={{
              fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
              background: momDelta > 0 ? 'rgba(229,62,62,0.12)' : 'rgba(47,133,90,0.12)',
              color: momDelta > 0 ? 'var(--red)' : 'var(--green)',
            }}>
              {momDelta > 0 ? '▲' : '▼'} {Math.abs(momDelta).toFixed(0)}% vs prev
            </div>
          )}
        </div>

        <div className="mono" style={{ fontSize: 36, fontWeight: 500, margin: '6px 0 2px', letterSpacing: '-1px' }}>
          {formatINRFull(totalSpend)}
        </div>

        {totalCredit > 0 && (
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, display: 'flex', gap: 12 }}>
            <span style={{ color: 'var(--green)' }}>Income +{formatINR(totalCredit)}</span>
            <span style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>
              Net {net >= 0 ? '+' : '−'}{formatINR(Math.abs(net))}
            </span>
          </div>
        )}

        {/* Budget progress */}
        {totalBudget > 0 && month && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>
              <span>Monthly budget</span>
              <span>{formatINR(totalSpend)} / {formatINR(totalBudget)} · {Math.round((totalSpend / totalBudget) * 100)}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'var(--surface2)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min((totalSpend / totalBudget) * 100, 100)}%`,
                borderRadius: 3,
                background: totalSpend > totalBudget ? 'var(--red)' : 'var(--accent)',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'UPI', val: upiSpend, color: 'var(--purple)' },
            { label: 'Card', val: cardSpend, color: 'var(--blue)' },
            { label: 'Top cat', val: topCat?.value || 0, sub: topCat?.name, color: topCat?.color },
          ].map(item => (
            <div key={item.label} style={{
              flex: 1, background: 'var(--surface2)',
              borderRadius: 12, padding: '10px 12px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{item.label}</div>
              <div className="mono" style={{ fontSize: 14, fontWeight: 500, marginTop: 3, color: item.color }}>
                {formatINR(item.val)}
              </div>
              {item.sub && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{item.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ margin: '12px 16px 0', display: 'flex', gap: 8 }} className="fade-up">
        {QUICK_ACTIONS.map(action => {
          const enabled = action.tab !== null
          return (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action)}
              disabled={!enabled}
              style={{
                flex: 1,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '12px 4px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                cursor: enabled ? 'pointer' : 'default',
                opacity: enabled ? 1 : 0.4,
                fontFamily: 'Syne, sans-serif',
              }}
            >
              <span style={{ fontSize: 18, color: 'var(--text)' }}>{action.icon}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{action.label}</span>
            </button>
          )
        })}
      </div>

      {/* AI Digest */}
      <div style={{
        margin: '12px 16px 0',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, padding: '14px 16px',
      }} className="fade-up">
        {digest ? (
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              AI Digest
            </div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{digest}</div>
            <button
              onClick={() => { setDigest(null); fetchDigest() }}
              style={{
                marginTop: 10, background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--muted)', fontSize: 11, fontFamily: 'Syne, sans-serif', padding: 0,
              }}
            >
              ↺ Regenerate
            </button>
          </div>
        ) : (
          <button
            onClick={fetchDigest}
            disabled={digestLoading || debits.length === 0}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: debits.length > 0 ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: 10, padding: 0,
              opacity: debits.length === 0 ? 0.4 : 1,
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: 'var(--surface2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
            }}>
              {digestLoading ? '···' : '◌'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
                {digestLoading ? 'Summarising…' : 'Summarise this month'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>AI-generated spending digest</div>
            </div>
          </button>
        )}
      </div>

      {/* Monthly bar chart (all-time only) */}
      {!month && (
        <div style={{
          margin: '12px 16px 0',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '16px 12px 8px',
        }} className="fade-up">
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, paddingLeft: 8 }}>Monthly spend</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={monthly} barSize={24}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={v => [formatINRFull(v), 'Spend']}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Where it went — stacked bar */}
      {topCats.length > 0 && (
        <div style={{
          margin: '12px 16px 0',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '16px',
        }} className="fade-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Where it went</div>
            <button
              onClick={() => onNavigate?.('transactions')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', fontFamily: 'Syne, sans-serif', padding: 0 }}
            >
              Details ›
            </button>
          </div>

          {/* Stacked bar */}
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2, marginBottom: 14 }}>
            {topCats.map(c => (
              <div key={c.name} style={{
                flex: c.value,
                background: c.color,
                minWidth: 4,
              }} />
            ))}
            {/* Remainder (other) */}
            {totalSpend - sumAmount(topCats) > 0 && (
              <div style={{ flex: totalSpend - sumAmount(topCats), background: 'var(--surface2)', minWidth: 4 }} />
            )}
          </div>

          {/* Legend: 2-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            {topCats.map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: 'var(--muted)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text)', flexShrink: 0 }}>
                  {Math.round((c.value / totalSpend) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity — date-grouped */}
      {recentGroups.length > 0 && (
        <div style={{ margin: '12px 16px 0' }} className="fade-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Recent activity</div>
            <button
              onClick={() => onNavigate?.('transactions')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', fontFamily: 'Syne, sans-serif', padding: 0 }}
            >
              See all ›
            </button>
          </div>
          {recentGroups.map(([date, txns]) => (
            <div key={date} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, paddingLeft: 4 }}>
                {formatDayLabel(date)}
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                {txns.map((t, i) => (
                  <div key={t.message_id || i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 16px', minHeight: 44,
                    borderBottom: i < txns.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: 'var(--surface2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>
                      {categoryEmoji(t.category)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.vendor}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                        {t.category} · {t.account_type}
                      </div>
                    </div>
                    <div className="mono" style={{
                      fontSize: 13, fontWeight: 500, flexShrink: 0,
                      color: t.direction === 'credit' ? 'var(--green)' : 'var(--red)',
                    }}>
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

function categoryEmoji(cat) {
  const map = {
    'Food Delivery': '🍕', 'Groceries': '🛒', 'Travel': '🚗',
    'Travel / Stay': '🏨', 'Shopping': '🛍️', 'Utilities': '⚡',
    'Housing': '🏠', 'Health': '💊', 'Subscriptions': '📱',
    'Investment': '📈', 'EMI / Loan': '🏦', 'UPI / Personal': '👤',
    'Home Services': '🔧', 'Personal Care': '💇', 'Govt / Tax': '📋',
    'Income / Credit': '💰', 'Transfer': '↔️', 'Cash': '💵',
  }
  return map[cat] || '💳'
}
