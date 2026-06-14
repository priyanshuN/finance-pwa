import { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react'
import { useTransactions } from './hooks/useTransactions'
import { useToast } from './hooks/useToast'
import { useAliasRules } from './hooks/useAliasRules'
import { getMonths, applyAliasRules, detectRecurring, detectAnomalies } from './lib/utils'
import ToastContainer from './components/common/Toast'

const Overview     = lazy(() => import('./components/Overview'))
const Transactions = lazy(() => import('./components/Transactions'))
const Budget       = lazy(() => import('./components/Budget'))
const Trends       = lazy(() => import('./components/Trends'))
const Chat         = lazy(() => import('./components/Chat'))
const Settings     = lazy(() => import('./components/Settings'))

const NAV = [
  { id: 'overview',     label: 'Overview', icon: '◈' },
  { id: 'transactions', label: 'Txns',     icon: '≡' },
  { id: 'budget',       label: 'Budget',   icon: '◎' },
  { id: 'trends',       label: 'Trends',   icon: '↗' },
  { id: 'chat',         label: 'Chat',     icon: '◌' },
]

export default function App() {
  const { data, loading, error, lastSync, refetch } = useTransactions()
  const { toasts, toast, dismiss } = useToast()
  const { rules, llmRules, addRule, removeRule, removeLlmRule, acceptLlmRule, acceptAllLlmRules, runRecategorize } = useAliasRules(toast)
  const [tab, setTab]             = useState('overview')
  const [month, setMonth]         = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [budgetSeg, setBudgetSeg] = useState('budgets')

  function navigate(nextTab, seg) {
    setTab(nextTab)
    if (nextTab === 'budget' && seg) setBudgetSeg(seg)
  }

  const months = useMemo(() => data ? getMonths(data) : [], [data])
  const transactions = useMemo(() => data ? applyAliasRules(data, [...rules, ...llmRules]) : data, [data, rules, llmRules])
  const recurringIds = useMemo(() => transactions ? detectRecurring(transactions) : new Set(), [transactions])
  const anomalyIds   = useMemo(() => transactions ? detectAnomalies(transactions) : new Set(), [transactions])

  const hasRecategorized = useRef(false)
  useEffect(() => {
    if (!data || hasRecategorized.current) return
    hasRecategorized.current = true
    runRecategorize(data).then(count => {
      if (count > 0) toast(`AI suggested ${count} new categor${count === 1 ? 'y' : 'ies'}`, 'success')
    })
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (months.length && !month) setMonth(months[months.length - 1])
  }, [months])

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

  const sharedProps = { onOpenSettings: () => setSettingsOpen(true), onSync: refetch }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', position: 'relative' }}>

      <Suspense fallback={<div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>}>
        {tab === 'chat' ? (
          <Chat transactions={transactions} month={month} {...sharedProps} />
        ) : (
          <div style={{ overflowY: 'auto', paddingBottom: 88, scrollbarWidth: 'none' }}>
            {tab === 'overview'     && <Overview transactions={transactions} month={month} months={months} onMonthChange={setMonth} onNavigate={navigate} {...sharedProps} />}
            {tab === 'transactions' && <Transactions transactions={transactions} month={month} recurringIds={recurringIds} anomalyIds={anomalyIds} {...sharedProps} />}
            {tab === 'budget'       && <Budget transactions={transactions} month={month} initialSeg={budgetSeg} {...sharedProps} />}
            {tab === 'trends'       && <Trends transactions={transactions} {...sharedProps} />}
          </div>
        )}
      </Suspense>

      {/* Bottom nav — 5 tabs */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 10,
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

      {/* Settings overlay */}
      {settingsOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, maxWidth: 480, left: '50%', transform: 'translateX(-50%)' }}>
          <Suspense fallback={null}>
            <Settings
              transactions={transactions} month={month} onRefetch={refetch} toast={toast}
              rules={rules} onAddRule={addRule} onRemoveRule={removeRule}
              llmRules={llmRules} onAcceptLlmRule={acceptLlmRule}
              onRemoveLlmRule={removeLlmRule} onAcceptAllLlmRules={acceptAllLlmRules}
              onClose={() => setSettingsOpen(false)}
            />
          </Suspense>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
