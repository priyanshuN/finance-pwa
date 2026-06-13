import React, { useState } from 'react'
import { useBudget } from '../hooks/useBudget'
import { exportTransactions } from '../lib/export'
import { CATEGORY_COLORS } from '../lib/utils'

const CATEGORIES = Object.keys(CATEGORY_COLORS)

export default function Settings({ transactions, month, onRefetch, toast, rules, onAddRule, onRemoveRule }) {
  const { budgets, clearAll } = useBudget()
  const budgetCount = Object.keys(budgets).length
  const [vendor, setVendor] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])

  function handleExport() {
    const count = exportTransactions(transactions, month)
    toast(`Exported ${count} transactions`, 'success')
  }

  function handleExportAll() {
    const count = exportTransactions(transactions, '')
    toast(`Exported all ${count} transactions`, 'success')
  }

  function handleAddRule() {
    if (!vendor.trim()) return
    onAddRule(vendor, category)
    setVendor('')
    toast(`Rule added: "${vendor.trim()}" → ${category}`, 'success')
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
      {/* Rules section */}
      <div style={{ margin: '16px 16px 0' }} className="fade-up">
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Alias Rules
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
          {/* Add rule form */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
              Map a vendor substring to a category
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={vendor}
                onChange={e => setVendor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddRule()}
                placeholder="Vendor (e.g. NoBroker)"
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--surface2)',
                  color: 'var(--text)', fontSize: 13, fontFamily: 'Syne, sans-serif',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--surface2)',
                  color: 'var(--text)', fontSize: 13, fontFamily: 'Syne, sans-serif',
                  outline: 'none',
                }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                onClick={handleAddRule}
                disabled={!vendor.trim()}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: 'none',
                  background: vendor.trim() ? 'var(--accent)' : 'var(--surface2)',
                  color: vendor.trim() ? 'var(--accent-fg)' : 'var(--muted)',
                  fontSize: 13, fontFamily: 'Syne, sans-serif', cursor: vendor.trim() ? 'pointer' : 'default',
                  fontWeight: 500,
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Existing rules */}
          {rules.length === 0 ? (
            <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--muted)' }}>
              No rules yet
            </div>
          ) : (
            rules.map((rule, i) => (
              <div key={rule.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderBottom: i < rules.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: CATEGORY_COLORS[rule.category] || '#a0aec0',
                }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{rule.vendor}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)', margin: '0 6px' }}>→</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{rule.category}</span>
                </div>
                <button
                  onClick={() => { onRemoveRule(rule.id); toast(`Rule removed`, 'info') }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: '2px 4px',
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
