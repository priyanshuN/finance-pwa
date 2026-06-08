import React, { useMemo, useState } from 'react'
import { filterByMonth, getDebits, groupByCategory, formatINRFull, formatINR, CATEGORY_COLORS } from '../lib/utils'
import { useBudget } from '../hooks/useBudget'
import Modal from './common/Modal'
import EmptyState from './common/EmptyState'

export default function Budget({ transactions, month }) {
  const { budgets, setBudget, removeBudget } = useBudget()
  const [editCat, setEditCat] = useState(null)
  const [inputVal, setInputVal] = useState('')

  const filtered = useMemo(() => filterByMonth(transactions, month), [transactions, month])
  const debits   = useMemo(() => getDebits(filtered), [filtered])
  const byCategory = useMemo(() => groupByCategory(debits), [debits])

  const categories = useMemo(() =>
    [...new Set(transactions.map(t => t.category))].sort(),
    [transactions]
  )

  const budgetedCats = categories.filter(c => budgets[c])
  const unbudgetedCats = categories.filter(c => !budgets[c])

  function openEdit(cat) {
    setEditCat(cat)
    setInputVal(budgets[cat] ? String(budgets[cat]) : '')
  }

  function saveEdit() {
    const val = parseFloat(inputVal)
    if (val > 0) setBudget(editCat, val)
    else removeBudget(editCat)
    setEditCat(null)
  }

  const totalBudget  = budgetedCats.reduce((s, c) => s + (budgets[c] || 0), 0)
  const totalSpent   = budgetedCats.reduce((s, c) => {
    const cat = byCategory.find(x => x.name === c)
    return s + (cat?.value || 0)
  }, 0)
  const overBudget = budgetedCats.filter(c => {
    const spent = byCategory.find(x => x.name === c)?.value || 0
    return spent > (budgets[c] || 0)
  }).length

  return (
    <div style={{ paddingBottom: 32 }}>

      {/* Summary */}
      {budgetedCats.length > 0 && (
        <div style={{
          margin: '16px 16px 0',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: '20px',
        }} className="fade-up">
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {month ? new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }) : 'All time'} · budget
          </div>
          <div className="mono" style={{ fontSize: 32, fontWeight: 500, margin: '6px 0 2px' }}>
            {formatINRFull(totalSpent)}
            <span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 400 }}> / {formatINRFull(totalBudget)}</span>
          </div>
          <div style={{ marginTop: 10, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%`,
              background: totalSpent > totalBudget ? 'var(--red)' : 'var(--accent)',
              borderRadius: 3, transition: 'width 0.4s ease',
            }} />
          </div>
          {overBudget > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--red)' }}>
              {overBudget} categor{overBudget === 1 ? 'y' : 'ies'} over budget
            </div>
          )}
        </div>
      )}

      {/* Budgeted categories */}
      {budgetedCats.length > 0 && (
        <div style={{ margin: '12px 16px 0' }} className="fade-up">
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Categories</div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
            {budgetedCats.map((cat, i) => {
              const spent  = byCategory.find(x => x.name === cat)?.value || 0
              const limit  = budgets[cat]
              const pct    = Math.min((spent / limit) * 100, 100)
              const over   = spent > limit
              const color  = over ? 'var(--red)' : (CATEGORY_COLORS[cat] || 'var(--accent)')

              return (
                <div
                  key={cat}
                  onClick={() => openEdit(cat)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: i < budgetedCats.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                      {cat}
                    </div>
                    <div className="mono" style={{ fontSize: 12 }}>
                      <span style={{ color: over ? 'var(--red)' : 'inherit' }}>{formatINR(spent)}</span>
                      <span style={{ color: 'var(--muted)' }}> / {formatINR(limit)}</span>
                    </div>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
                  </div>
                  {over && (
                    <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>
                      Over by {formatINR(spent - limit)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Unbudgeted categories */}
      <div style={{ margin: '16px 16px 0' }} className="fade-up">
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: 'var(--muted)' }}>
          {budgetedCats.length === 0 ? 'All categories · tap to set a budget' : 'No budget set'}
        </div>
        {unbudgetedCats.length === 0
          ? <EmptyState icon="🎯" message="All categories have budgets" sub="Tap any category above to edit" />
          : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
              {unbudgetedCats.map((cat, i) => {
                const spent = byCategory.find(x => x.name === cat)?.value || 0
                return (
                  <div
                    key={cat}
                    onClick={() => openEdit(cat)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: i < unbudgetedCats.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[cat] || '#a0aec0' }} />
                      {cat}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {spent > 0 && <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{formatINR(spent)}</span>}
                      <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>+ Set</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>

      {/* Edit modal */}
      <Modal open={!!editCat} onClose={() => setEditCat(null)} title={`Budget · ${editCat}`}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
          Monthly limit for {editCat}. Leave empty to remove.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            autoFocus
            type="number"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveEdit()}
            placeholder="Amount (₹)"
            style={{
              flex: 1, padding: '10px 14px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 12, fontSize: 14, color: 'var(--text)',
              outline: 'none', fontFamily: 'Syne, sans-serif',
            }}
          />
          <button
            onClick={saveEdit}
            style={{
              padding: '10px 20px', background: 'var(--accent)', color: 'var(--accent-fg)',
              border: 'none', borderRadius: 12, fontFamily: 'Syne, sans-serif',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >Save</button>
        </div>
        {budgets[editCat] && (
          <button
            onClick={() => { removeBudget(editCat); setEditCat(null) }}
            style={{
              marginTop: 12, width: '100%', padding: '10px',
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 12, fontSize: 13, color: 'var(--red)',
              cursor: 'pointer', fontFamily: 'Syne, sans-serif',
            }}
          >Remove budget</button>
        )}
      </Modal>
    </div>
  )
}
