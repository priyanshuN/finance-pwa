import React, { useState, useMemo, lazy, Suspense } from 'react'
import { useTransactions } from './hooks/useTransactions'
import { useToast } from './hooks/useToast'
import { useAliasRules } from './hooks/useAliasRules'
import { getMonths, applyAliasRules, detectRecurring } from './lib/utils'
import ToastContainer from './components/common/Toast'

const Overview     = lazy(() => import('./components/Overview'))
const Transactions = lazy(() => import('./components/Transactions'))
const Recurring    = lazy(() => import('./components/Recurring'))
const Trends       = lazy(() => import('./components/Trends'))
const Budget       = lazy(() => import('./components/Budget'))
const Settings     = lazy(() => import('./components/Settings'))

const NAV = [
  { id: 'overview',     label: 'Overview',      icon: '◈' },
  { id: 'transactions', label: 'Transactions',   icon: '≡' },
  { id: 'recurring',    label: 'Recurring',      icon: '↻' },
  { id: 'trends',       label: 'Trends',         icon: '↗' },
  { id: 'budget',       label: 'Budget',         icon: '◎' },
  { id: 'settings',     label: 'Settings',       icon: '⚙' },
]

export default function App() {
  const { data, loading, error, lastSync, refetch } = useTransactions()
  const { toasts, toast, dismiss } = useToast()
  const { rules, llmRules, addRule, removeRule, removeLlmRule, acceptLlmRule, acceptAllLlmRules, runRecategorize } = useAliasRules(toast)
  const [tab, setTab]     = useState('overview')
  const [month, setMonth] = useState('')

  const months = useMemo(() => data ? getMonths(data) : [], [data])
  // User rules take priority (first match wins in applyAliasRules)
  const transactions = useMemo(() => data ? applyAliasRules(data, [...rules, ...llmRules]) : data, [data, rules, llmRules])
  const recurringIds = useMemo(() => transactions ? detectRecurring(transactions) : new Set(), [transactions])

  const hasRecategorized = React.useRef(false)
  React.useEffect(() => {
    if (!data || hasRecategorized.current) return
    hasRecategorized.current = true
    runRecategorize(data).then(count => {
      if (count > 0) toast(`AI suggested ${count} new categor${count === 1 ? 'y' : 'ies'}`, 'success')
    })
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (months.length && !month) setMonth(months[months.length - 1])
  }, [months])

  const title = { overview: 'Overview', transactions: 'Transactions', recurring: 'Recurring', trends: 'Trends', budget: 'Budget', settings: 'Settings' }

  if (loading) return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontSize: 28 }}>💰</div>
      <div style={{ fontSize: 14, color: 'var(--muted)' }}>Loading your finances...</div>
    </div>
  )

  if (error) return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }}>
      <div style={{ fontSize: 28 }}>⚠️</div>
      <div style={{ fontSize: 14, color: 'var(--red)', textAlign: 'center' }}>{error}</div>
      <button onClick={refetch} style={{ padding: '8px 20px', background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>Retry</button>
    </div>
  )

  const showMonthPicker = tab === 'overview' || tab === 'transactions' || tab === 'budget'

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', position: 'relative' }}>

      {/* Header */}
      <div style={{ padding: '52px 16px 12px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Finance Tracker</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{title[tab]}</div>
        </div>
        <button onClick={refetch} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '6px 12px', fontSize: 11, cursor: 'pointer',
          color: 'var(--muted)', fontFamily: 'Syne, sans-serif',
        }}>
          ↻ Sync
        </button>
      </div>

      {/* Month tabs */}
      {showMonthPicker && (
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          <button onClick={() => setMonth('')} style={pillStyle(month === '')}>All</button>
          {months.map(m => (
            <button key={m} onClick={() => setMonth(m)} style={pillStyle(month === m)}>
              {new Date(m + '-01').toLocaleString('default', { month: 'short' })}
              {isCurrentMonth(m) ? ' •' : ''}
            </button>
          ))}
        </div>
      )}

      {/* Last sync */}
      {lastSync && (
        <div style={{ fontSize: 10, color: 'var(--muted)', padding: '4px 16px 0', textAlign: 'right' }}>
          Synced {timeSince(lastSync)}
        </div>
      )}

      {/* Content */}
      <div style={{ overflowY: 'auto', paddingBottom: 80 }}>
        <Suspense fallback={<div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>}>
          {tab === 'overview'     && <Overview transactions={transactions} month={month} />}
          {tab === 'transactions' && <Transactions transactions={transactions} month={month} recurringIds={recurringIds} />}
          {tab === 'recurring'    && <Recurring transactions={transactions} />}
          {tab === 'trends'       && <Trends transactions={transactions} />}
          {tab === 'budget'       && <Budget transactions={transactions} month={month} />}
          {tab === 'settings'     && <Settings transactions={transactions} month={month} onRefetch={refetch} toast={toast} rules={rules} onAddRule={addRule} onRemoveRule={removeRule} llmRules={llmRules} onAcceptLlmRule={acceptLlmRule} onRemoveLlmRule={removeLlmRule} onAcceptAllLlmRules={acceptAllLlmRules} />}
        </Suspense>
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backdropFilter: 'blur(20px)',
      }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{
            flex: 1, padding: '12px 0 10px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: tab === n.id ? 'var(--accent)' : 'var(--muted)',
            transition: 'color 0.15s',
          }}>
            <span style={{ fontSize: 16 }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontFamily: 'Syne, sans-serif', fontWeight: tab === n.id ? 600 : 400 }}>{n.label}</span>
          </button>
        ))}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

function isCurrentMonth(m) {
  const now = new Date()
  return m === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function timeSince(date) {
  const s = Math.floor((Date.now() - date) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function pillStyle(active) {
  return {
    flexShrink: 0, padding: '5px 14px', borderRadius: 20,
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'Syne, sans-serif',
    background: active ? 'var(--accent)' : 'var(--surface)',
    color: active ? 'var(--accent-fg)' : 'var(--muted)',
    border: '1px solid var(--border)',
    transition: 'all 0.15s',
  }
}
