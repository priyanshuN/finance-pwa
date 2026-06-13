import React, { useMemo, useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'
import {
  filterByMonth, getDebits, getCredits, sumAmount,
  groupByCategory, monthlyTotals, formatINR, formatINRFull, formatDate
} from '../lib/utils'

function buildDigestSummary(debits, credits, cats, month) {
  const period = month
    ? new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })
    : 'all time'
  return `Period: ${period}
Total spend: ${formatINRFull(sumAmount(debits))} (${debits.length} transactions)
Total credited: ${formatINRFull(sumAmount(credits))}
Top categories: ${cats.slice(0, 6).map(c => `${c.name} ${formatINRFull(c.value)}`).join(', ')}`
}

export default function Overview({ transactions, month }) {
  const filtered  = useMemo(() => filterByMonth(transactions, month), [transactions, month])
  const debits    = useMemo(() => getDebits(filtered), [filtered])
  const credits   = useMemo(() => getCredits(filtered), [filtered])
  const cats      = useMemo(() => groupByCategory(debits), [debits])
  const monthly   = useMemo(() => monthlyTotals(transactions), [transactions])
  const totalSpend = sumAmount(debits)
  const totalCredit = sumAmount(credits)
  const recent    = [...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)

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

  const topCat = cats[0]
  const upiSpend = sumAmount(debits.filter(t => t.account_type === 'UPI'))
  const cardSpend = sumAmount(debits.filter(t => t.account_type.includes('Card')))

  return (
    <div style={{ paddingBottom: 32 }}>

      {/* Total card */}
      <div style={{
        margin: '16px 16px 0',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '22px 20px',
        boxShadow: 'var(--shadow-md)',
      }} className="fade-up">
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {month ? new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }) : 'All time'} · spend
        </div>
        <div className="mono" style={{ fontSize: 36, fontWeight: 500, margin: '6px 0 2px', letterSpacing: '-1px' }}>
          {formatINRFull(totalSpend)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          {debits.length} transactions
          {totalCredit > 0 && <span style={{ color: 'var(--green)', marginLeft: 8 }}>+{formatINR(totalCredit)} credited</span>}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
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

      {/* Monthly bar chart */}
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

      {/* Category donut */}
      <div style={{
        margin: '12px 16px 0',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '16px',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }} className="fade-up">
        <ResponsiveContainer width={110} height={110}>
          <PieChart>
            <Pie data={cats.slice(0, 6)} cx="50%" cy="50%" innerRadius={32} outerRadius={50}
              dataKey="value" strokeWidth={0}>
              {cats.slice(0, 6).map((c, i) => <Cell key={i} fill={c.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {cats.slice(0, 5).map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
              <div style={{ fontSize: 12, flex: 1, color: 'var(--muted)' }}>{c.name}</div>
              <div className="mono" style={{ fontSize: 12 }}>{formatINR(c.value)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div style={{ margin: '16px 16px 0' }} className="fade-up">
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Recent</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
          {recent.map((t, i) => (
            <div key={t.message_id || i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
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
                  {formatDate(t.date)} · {t.account_type}
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
