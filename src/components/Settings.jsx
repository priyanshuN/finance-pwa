import React from 'react'
import { useBudget } from '../hooks/useBudget'
import { exportTransactions } from '../lib/export'

export default function Settings({ transactions, month, onRefetch, toast }) {
  const { budgets, clearAll } = useBudget()
  const budgetCount = Object.keys(budgets).length

  function handleExport() {
    const count = exportTransactions(transactions, month)
    toast(`Exported ${count} transactions`, 'success')
  }

  function handleExportAll() {
    const count = exportTransactions(transactions, '')
    toast(`Exported all ${count} transactions`, 'success')
  }

  function handleClearBudgets() {
    if (!budgetCount) return
    clearAll()
    toast('All budgets cleared', 'info')
  }

  const rows = [
    {
      section: 'Data',
      items: [
        {
          label: 'Sync transactions',
          sub: 'Re-fetch from Google Sheets',
          icon: '↻',
          action: () => { onRefetch(); toast('Syncing…', 'info') },
        },
        {
          label: month ? `Export ${new Date(month + '-01').toLocaleString('default', { month: 'long' })}` : 'Export current view',
          sub: 'Download as CSV',
          icon: '↓',
          action: handleExport,
        },
        {
          label: 'Export all time',
          sub: `${transactions?.length || 0} transactions`,
          icon: '↓',
          action: handleExportAll,
        },
      ],
    },
    {
      section: 'Budgets',
      items: [
        {
          label: 'Clear all budgets',
          sub: budgetCount ? `${budgetCount} budgets set` : 'No budgets set',
          icon: '🗑',
          danger: true,
          disabled: !budgetCount,
          action: handleClearBudgets,
        },
      ],
    },
    {
      section: 'About',
      items: [
        { label: 'Finance Tracker', sub: 'Personal PWA · v1.0', icon: '💰', action: null },
        { label: 'Data source', sub: 'Google Sheets via Vercel', icon: '📊', action: null },
      ],
    },
  ]

  return (
    <div style={{ paddingBottom: 32 }}>
      {rows.map(({ section, items }) => (
        <div key={section} style={{ margin: '16px 16px 0' }} className="fade-up">
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            {section}
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
            {items.map((item, i) => (
              <div
                key={item.label}
                onClick={item.action && !item.disabled ? item.action : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px',
                  borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: item.action && !item.disabled ? 'pointer' : 'default',
                  opacity: item.disabled ? 0.4 : 1,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--surface2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: item.danger ? 'var(--red)' : 'var(--text)' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{item.sub}</div>
                </div>
                {item.action && !item.disabled && (
                  <div style={{ fontSize: 16, color: 'var(--muted)' }}>›</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
