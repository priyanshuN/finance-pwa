import React, { useMemo, useState, useEffect } from 'react'
import {
  filterByMonth, getDebits, groupByCategory, formatINRFull, formatINR,
  CATEGORY_COLORS, getRecurringDue, dueLabel,
} from '../lib/utils'
import { useBudget } from '../hooks/useBudget'
import Modal from './common/Modal'

function monthEyebrow(month) {
  if (!month) return 'All time'
  return new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })
}

function IconBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>{children}</button>
  )
}

const VELOCITY_CONFIG = {
  over:    { tint: 'rgba(252,129,129,.15)', fg: 'var(--red)',    label: 'Over' },
  ahead:   { tint: 'rgba(246,173,85,.16)',  fg: 'var(--orange)', label: 'Ahead of pace' },
  ontrack: { tint: 'rgba(104,211,145,.15)', fg: 'var(--green)',  label: 'On track' },
  under:   { tint: 'rgba(99,179,237,.14)',  fg: 'var(--blue)',   label: 'Under pace' },
}

function calcVelocity(spent, limit, elapsedFrac) {
  const usedPct = limit > 0 ? spent / limit : 0
  const projected = elapsedFrac > 0 ? spent / elapsedFrac : spent
  let status
  if (spent > limit) status = 'over'
  else if (projected > limit * 1.05) status = 'ahead'
  else if (projected < limit * 0.8) status = 'under'
  else status = 'ontrack'
  return { usedPct, projected, status }
}

function VelocityChip({ status }) {
  const s = VELOCITY_CONFIG[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 7, fontSize: 10.5, fontWeight: 600, background: s.tint, color: s.fg, whiteSpace: 'nowrap', flexShrink: 0 }}>
      {(status === 'ahead' || status === 'over') && <span style={{ fontSize: 9 }}>⚠</span>}{s.label}
    </span>
  )
}

function PaceBar({ usedPct, elapsedPct, color, height = 7 }) {
  const fillW = Math.min(usedPct * 100, 100)
  return (
    <div style={{ position: 'relative', height: height + 8, display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: '100%', height, background: 'var(--surface2)', borderRadius: height / 2 }}>
        <div style={{ height: '100%', width: `${fillW}%`, background: color, borderRadius: height / 2, transition: 'width 0.4s ease' }} />
        <div style={{ position: 'absolute', left: `${Math.min(elapsedPct * 100, 100)}%`, top: -4, bottom: -4, width: 2, transform: 'translateX(-1px)', background: 'var(--text)', opacity: 0.85, borderRadius: 1 }} />
      </div>
    </div>
  )
}

function DateChip({ day, month, soon }) {
  return (
    <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: 'var(--surface2)', border: soon ? '1px solid var(--accent)' : '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
      <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.04em', color: soon ? 'var(--accent)' : 'var(--muted)', fontWeight: 600 }}>{month}</span>
      <span className="mono" style={{ fontSize: 17, fontWeight: 600, lineHeight: 1, color: 'var(--text)' }}>{day}</span>
    </div>
  )
}

function BudgetSegment({ transactions, month, budgets, setBudget, removeBudget }) {
  const [editCat, setEditCat] = useState(null)
  const [inputVal, setInputVal] = useState('')

  const filtered = useMemo(() => filterByMonth(transactions, month), [transactions, month])
  const byCategory = useMemo(() => groupByCategory(getDebits(filtered)), [filtered])

  const elapsedFrac = useMemo(() => {
    const now = new Date()
    return now.getDate() / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  }, [])

  const categories = useMemo(() => [...new Set(transactions.map(t => t.category))].sort(), [transactions])
  const budgetedCats = categories.filter(c => budgets[c])
  const unbudgetedCats = categories.filter(c => !budgets[c])

  const spent = (cat) => byCategory.find(x => x.name === cat)?.value || 0
  const totalBudget = budgetedCats.reduce((s, c) => s + (budgets[c] || 0), 0)
  const totalSpent = budgetedCats.reduce((s, c) => s + spent(c), 0)

  const rows = budgetedCats.map(c => {
    const s = spent(c)
    const lim = budgets[c]
    const v = calcVelocity(s, lim, elapsedFrac)
    return { c, spent: s, limit: lim, ...v }
  }).sort((a, b) => {
    const order = { over: 0, ahead: 1, ontrack: 2, under: 3 }
    return order[a.status] - order[b.status]
  })

  const aheadOrOver = rows.filter(r => r.status === 'ahead' || r.status === 'over')
  const totalV = totalBudget > 0 ? calcVelocity(totalSpent, totalBudget, elapsedFrac) : null

  function openEdit(cat) { setEditCat(cat); setInputVal(budgets[cat] ? String(budgets[cat]) : '') }
  function saveEdit() {
    const val = parseFloat(inputVal)
    if (val > 0) setBudget(editCat, val)
    else removeBudget(editCat)
    setEditCat(null)
  }

  return (
    <div style={{ padding: '2px 16px 16px' }}>
      {/* Hero summary */}
      {budgetedCats.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, boxShadow: 'var(--shadow-md)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {month ? new Date(month + '-01').toLocaleString('default', { month: 'long' }) : 'All'} · all budgets
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 8, background: 'var(--surface2)', fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text)', display: 'inline-block' }} />
              Day {new Date().getDate()} / {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} · {Math.round(elapsedFrac * 100)}% elapsed
            </span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span className="mono" style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-1px' }}>{formatINRFull(totalSpent)}</span>
            <span className="mono" style={{ fontSize: 15, color: 'var(--muted)' }}> / {formatINRFull(totalBudget)}</span>
          </div>
          {totalV && (
            <PaceBar usedPct={totalV.usedPct} elapsedPct={elapsedFrac} color={totalV.status === 'over' ? 'var(--red)' : totalV.status === 'ahead' ? 'var(--orange)' : 'var(--accent)'} height={8} />
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>
            <span><span className="mono" style={{ color: 'var(--text)' }}>{totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%</span> used</span>
            <span className="mono">marker = today</span>
          </div>
          {aheadOrOver.length > 0 && (
            <div style={{ marginTop: 13, padding: '11px 13px', background: 'var(--surface2)', borderRadius: 12, fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
              <span style={{ color: 'var(--orange)', fontWeight: 600 }}>⚠ Heads up.</span> {aheadOrOver.length} categor{aheadOrOver.length === 1 ? 'y is' : 'ies are'} ahead of pace or over budget.
            </div>
          )}
        </div>
      )}

      {/* By category */}
      {rows.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '4px 2px 10px' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>By category</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>sorted by pace</div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
            {rows.map((r, i) => {
              const barColor = r.status === 'over' ? 'var(--red)' : r.status === 'ahead' ? 'var(--orange)' : (CATEGORY_COLORS[r.c] || 'var(--accent)')
              return (
                <div key={r.c} onClick={() => openEdit(r.c)} style={{ padding: '14px 16px', borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: CATEGORY_COLORS[r.c] || '#a0aec0', flexShrink: 0 }} />
                      <span style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.c}</span>
                      <VelocityChip status={r.status} />
                    </div>
                    <span className="mono" style={{ fontSize: 12.5, flexShrink: 0 }}>
                      <span style={{ color: r.status === 'over' ? 'var(--red)' : 'var(--text)' }}>{formatINR(r.spent)}</span>
                      <span style={{ color: 'var(--muted)' }}> / {formatINR(r.limit)}</span>
                    </span>
                  </div>
                  <PaceBar usedPct={r.usedPct} elapsedPct={elapsedFrac} color={barColor} />
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>
                    <span className="mono" style={{ color: 'var(--text)' }}>{Math.round(r.usedPct * 100)}%</span> used · <span className="mono">{Math.round(elapsedFrac * 100)}%</span> elapsed ·{' '}
                    {r.status === 'over'
                      ? <span style={{ color: 'var(--red)' }}>over by {formatINR(r.spent - r.limit)}</span>
                      : <span style={{ color: r.status === 'ahead' ? 'var(--orange)' : 'var(--muted)' }}>on pace for {formatINR(Math.round(r.projected))}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Unbudgeted categories */}
      {unbudgetedCats.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>No budget set · tap to add</div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
            {unbudgetedCats.map((cat, i) => {
              const s = byCategory.find(x => x.name === cat)?.value || 0
              return (
                <div key={cat} onClick={() => openEdit(cat)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < unbudgetedCats.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', minHeight: 44 }}>
                  <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[cat] || '#a0aec0' }} />{cat}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {s > 0 && <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{formatINR(s)}</span>}
                    <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>+ Set</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Modal open={!!editCat} onClose={() => setEditCat(null)} title={`Budget · ${editCat}`}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Monthly limit for {editCat}. Leave empty to remove.</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input autoFocus type="number" value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEdit()} placeholder="Amount (₹)"
            style={{ flex: 1, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 14, color: 'var(--text)', outline: 'none', fontFamily: 'Syne, sans-serif' }} />
          <button onClick={saveEdit} style={{ padding: '10px 20px', background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 12, fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Save</button>
        </div>
        {budgets[editCat] && (
          <button onClick={() => { removeBudget(editCat); setEditCat(null) }} style={{ marginTop: 12, width: '100%', padding: '10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, color: 'var(--red)', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>Remove budget</button>
        )}
      </Modal>
    </div>
  )
}

function RecurringSegment({ transactions }) {
  const all = useMemo(() => getRecurringDue(transactions), [transactions])
  const dueSoon = useMemo(() => all.filter(r => !r.paidThisMonth && r.daysUntil <= 7), [all])
  const dueTotal = dueSoon.reduce((s, r) => s + r.amount, 0)
  const monthlyTotal = all.reduce((s, r) => s + r.amount, 0)

  return (
    <div style={{ padding: '2px 16px 16px' }}>
      {/* Due in next 7 days */}
      {dueSoon.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '4px 2px 10px' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Due in next 7 days</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--orange)' }}>{formatINRFull(dueTotal)}</div>
          </div>
          <div style={{ background: 'var(--surface)', border: `1px solid color-mix(in srgb, var(--orange) 35%, var(--border))`, borderRadius: 20, overflow: 'hidden', marginBottom: 8 }}>
            {dueSoon.map((r, i) => (
              <div key={r.vendor} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', minHeight: 44, borderBottom: i < dueSoon.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <DateChip day={r.day} month={r.nextMonth} soon />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.vendor}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{r.cadence} · {r.account_type}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                  <span className="mono" style={{ fontSize: 13.5, fontWeight: 500 }}>{formatINR(r.amount)}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: r.daysUntil <= 2 ? 'var(--orange)' : 'var(--muted)' }}>{dueLabel(r.daysUntil)}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', margin: '0 4px 20px', lineHeight: 1.5 }}>
            {dueSoon.length} charge{dueSoon.length !== 1 ? 's' : ''} · {formatINRFull(dueTotal)} leaving your accounts this week.
          </div>
        </>
      )}

      {/* All recurring */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '4px 2px 10px' }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>All recurring</div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{all.length} · {formatINR(monthlyTotal)}/mo</div>
      </div>
      {all.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No recurring charges detected</div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
          {all.map((r, i) => (
            <div key={r.vendor} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', minHeight: 44, borderBottom: i < all.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: CATEGORY_COLORS[r.category] || '#a0aec0', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.vendor}</div>
                <div style={{ fontSize: 11, color: r.paidThisMonth ? 'var(--muted)' : 'var(--orange)', marginTop: 1 }}>
                  {r.paidThisMonth
                    ? <span>Paid · next <span className="mono">{r.nextLabel}</span></span>
                    : <span>Due <span className="mono">{r.nextLabel}</span> · {dueLabel(r.daysUntil).toLowerCase()}</span>}
                </div>
              </div>
              <span className="mono" style={{ fontSize: 13, color: 'var(--muted)', flexShrink: 0 }}>{formatINR(r.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Budget({ transactions, month, onOpenSettings, initialSeg }) {
  const { budgets, setBudget, removeBudget } = useBudget()
  const [seg, setSeg] = useState(initialSeg || 'budgets')

  useEffect(() => {
    if (initialSeg) setSeg(initialSeg)
  }, [initialSeg])

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '52px 20px 8px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{monthEyebrow(month)}</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginTop: 1 }}>Budget</div>
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          <IconBtn onClick={onOpenSettings}>⚙</IconBtn>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', color: 'var(--accent-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>P</div>
        </div>
      </div>

      {/* Segmented control */}
      <div style={{ padding: '2px 20px 8px' }}>
        <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 11, padding: 3 }}>
          {[{ id: 'budgets', label: 'Budgets' }, { id: 'recurring', label: 'Recurring' }].map(o => {
            const on = o.id === seg
            return (
              <button key={o.id} onClick={() => setSeg(o.id)} style={{ flex: 1, textAlign: 'center', padding: '8px 0', fontSize: 13, fontWeight: on ? 600 : 500, borderRadius: 8, color: on ? 'var(--text)' : 'var(--muted)', background: on ? 'var(--surface)' : 'transparent', boxShadow: on ? 'var(--shadow)' : 'none', border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', transition: 'all 0.15s' }}>{o.label}</button>
            )
          })}
        </div>
      </div>

      {seg === 'budgets'
        ? <BudgetSegment transactions={transactions} month={month} budgets={budgets} setBudget={setBudget} removeBudget={removeBudget} />
        : <RecurringSegment transactions={transactions} />}
    </div>
  )
}
