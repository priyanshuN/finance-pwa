import { useState, useMemo, useCallback } from 'react'
import { filterByMonth, formatDate, formatINRFull, formatINR, CATEGORY_COLORS, CATEGORY_EMOJI, amountBounds } from '../lib/utils'

function monthEyebrow(month) {
  if (!month) return 'All time'
  return new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })
}

function IconBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>{children}</button>
  )
}

function ControlChip({ glyph, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
      padding: '7px 11px', borderRadius: 10, fontFamily: 'Syne, sans-serif',
      fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
      background: active ? 'var(--accent)' : 'var(--surface)',
      color: active ? 'var(--accent-fg)' : 'var(--text)',
      border: active ? 'none' : '1px solid var(--border)',
      transition: 'all 0.15s',
    }}>
      {glyph && <span style={{ fontSize: 13, opacity: active ? 1 : 0.7 }}>{glyph}</span>}
      <span>{label}</span>
      {!active && <span style={{ color: 'var(--muted)', fontSize: 10 }}>▾</span>}
    </button>
  )
}

const SORT_OPTIONS = ['Newest first', 'Oldest first', 'Amount: high → low', 'Amount: low → high']

function FilterSheet({ onClose, categories, filters, onApply, totalCount }) {
  const [sort, setSort] = useState(filters.sort)
  const [selectedCats, setSelectedCats] = useState([...filters.categories])
  const [amtMin, setAmtMin] = useState(filters.amtMin)
  const [amtMax, setAmtMax] = useState(filters.amtMax)
  const [type, setType] = useState(filters.type)
  const { min: boundsMin, max: boundsMax } = filters.bounds

  function toggleCat(c) {
    setSelectedCats(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  function handleReset() {
    setSort('Newest first')
    setSelectedCats([])
    setAmtMin(boundsMin)
    setAmtMax(boundsMax)
    setType('All')
  }

  function handleApply() {
    onApply({ sort, categories: selectedCats, amtMin, amtMax, type })
    onClose()
  }

  const rangeSpan = boundsMax - boundsMin || 1
  const leftPct = Math.round(((amtMin - boundsMin) / rangeSpan) * 100)
  const rightPct = Math.round(((amtMax - boundsMin) / rangeSpan) * 100)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', maxWidth: 480, left: '50%', transform: 'translateX(-50%)' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', background: 'var(--surface)', borderRadius: '22px 22px 0 0', padding: '10px 20px 32px', maxHeight: '88vh', overflowY: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--surface2)', margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Filter & sort</div>
          <button onClick={handleReset} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>Reset</button>
        </div>

        {/* Sort */}
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 10 }}>Sort by</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 22 }}>
          {SORT_OPTIONS.map(s => {
            const on = s === sort
            return (
              <div key={s} onClick={() => setSort(s)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 12, minHeight: 44, background: on ? 'var(--surface2)' : 'transparent', border: on ? '1px solid var(--border)' : '1px solid transparent', cursor: 'pointer' }}>
                <span style={{ fontSize: 13.5, fontWeight: on ? 600 : 400 }}>{s}</span>
                <span style={{ width: 19, height: 19, borderRadius: '50%', border: on ? '6px solid var(--accent)' : '1.5px solid var(--muted)', boxSizing: 'border-box', flexShrink: 0 }} />
              </div>
            )
          })}
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>Categories</span>
          {selectedCats.length > 0 && <span style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 600 }}>{selectedCats.length} selected</span>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {categories.map(c => {
            const on = selectedCats.includes(c)
            return (
              <button key={c} onClick={() => toggleCat(c)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: 'none', background: on ? 'var(--accent)' : 'var(--surface2)', color: on ? 'var(--accent-fg)' : 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: on ? 'var(--accent-fg)' : (CATEGORY_COLORS[c] || '#a0aec0'), flexShrink: 0 }} />{c}
              </button>
            )
          })}
        </div>

        {/* Amount range */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>Amount range</span>
          <span className="mono" style={{ fontSize: 12.5 }}>{formatINR(amtMin)} – {formatINR(amtMax)}</span>
        </div>
        <div style={{ position: 'relative', padding: '8px 8px', marginBottom: 4 }}>
          <div style={{ position: 'relative', height: 4, background: 'var(--surface2)', borderRadius: 2 }}>
            <div style={{ position: 'absolute', left: `${leftPct}%`, right: `${100 - rightPct}%`, top: 0, bottom: 0, background: 'var(--accent)', borderRadius: 2 }} />
          </div>
          <input type="range" min={boundsMin} max={boundsMax} value={amtMin}
            onChange={e => setAmtMin(Math.min(+e.target.value, amtMax - 1))}
            style={{ position: 'absolute', inset: '0 8px', opacity: 0, cursor: 'pointer', height: '100%' }} />
          <input type="range" min={boundsMin} max={boundsMax} value={amtMax}
            onChange={e => setAmtMax(Math.max(+e.target.value, amtMin + 1))}
            style={{ position: 'absolute', inset: '0 8px', opacity: 0, cursor: 'pointer', height: '100%' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--muted)', margin: '0 4px 22px' }}>
          <span className="mono">{formatINR(boundsMin)}</span>
          <span className="mono">{formatINR(boundsMax)}</span>
        </div>

        {/* Type */}
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 10 }}>Type</div>
        <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 11, padding: 3, marginBottom: 24 }}>
          {['All', 'Debits', 'Credits'].map(p => {
            const on = p === type
            return (
              <div key={p} onClick={() => setType(p)} style={{ flex: 1, textAlign: 'center', padding: '9px 0', fontSize: 13, fontWeight: on ? 600 : 500, borderRadius: 8, color: on ? 'var(--text)' : 'var(--muted)', background: on ? 'var(--surface)' : 'transparent', boxShadow: on ? 'var(--shadow)' : 'none', cursor: 'pointer' }}>{p}</div>
            )
          })}
        </div>

        <button onClick={handleApply} style={{ width: '100%', padding: '14px 0', borderRadius: 13, border: 'none', background: 'var(--accent)', color: 'var(--accent-fg)', fontSize: 14.5, fontWeight: 600, fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
          Show {totalCount} transaction{totalCount !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  )
}

export default function Transactions({ transactions, month, recurringIds = new Set(), anomalyIds = new Set(), onOpenSettings, onSync }) {
  const [search, setSearch] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const monthFiltered = useMemo(() => filterByMonth(transactions, month), [transactions, month])
  const bounds = useMemo(() => amountBounds(monthFiltered), [monthFiltered])
  const categories = useMemo(() => [...new Set(monthFiltered.map(t => t.category))].sort(), [monthFiltered])

  const [filters, setFilters] = useState({
    sort: 'Newest first',
    categories: [],
    amtMin: 0,
    amtMax: Infinity,
    type: 'All',
  })

  // Sync bounds when month/data changes
  const filtersWithBounds = useMemo(() => ({ ...filters, bounds, amtMin: filters.amtMin === 0 ? bounds.min : filters.amtMin, amtMax: filters.amtMax === Infinity ? bounds.max : filters.amtMax }), [filters, bounds])

  const filtered = useMemo(() => {
    let t = monthFiltered
    if (search) t = t.filter(x => x.vendor.toLowerCase().includes(search.toLowerCase()) || x.category.toLowerCase().includes(search.toLowerCase()))
    if (filters.categories.length) t = t.filter(x => filters.categories.includes(x.category))
    if (filters.type === 'Debits') t = t.filter(x => x.direction === 'debit')
    if (filters.type === 'Credits') t = t.filter(x => x.direction === 'credit')
    const minAmt = filters.amtMin || bounds.min
    const maxAmt = filters.amtMax === Infinity ? bounds.max : filters.amtMax
    t = t.filter(x => x.amount >= minAmt && x.amount <= maxAmt)

    return [...t].sort((a, b) => {
      if (filters.sort === 'Oldest first') return a.date.localeCompare(b.date)
      if (filters.sort === 'Amount: high → low') return b.amount - a.amount
      if (filters.sort === 'Amount: low → high') return a.amount - b.amount
      return b.date.localeCompare(a.date)
    })
  }, [monthFiltered, search, filters, bounds])

  const totalShown = sumAmount(filtered.filter(t => t.direction === 'debit'))

  const hasActiveFilters = filters.categories.length > 0 || filters.type !== 'All' || filters.sort !== 'Newest first' || filters.amtMin > 0 || filters.amtMax < Infinity

  function clearAll() {
    setFilters({ sort: 'Newest first', categories: [], amtMin: 0, amtMax: Infinity, type: 'All' })
    setSearch('')
  }

  const sortLabel = filters.sort === 'Newest first' ? 'Newest' : filters.sort === 'Oldest first' ? 'Oldest' : filters.sort === 'Amount: high → low' ? 'High→Low' : 'Low→High'
  const catLabel = filters.categories.length ? `${filters.categories.length} categor${filters.categories.length === 1 ? 'y' : 'ies'}` : 'Categories'
  const amtLabel = (filters.amtMin > 0 || (filters.amtMax < Infinity && filters.amtMax < bounds.max))
    ? `${formatINR(filters.amtMin || bounds.min)}–${formatINR(filters.amtMax === Infinity ? bounds.max : filters.amtMax)}`
    : 'Amount'

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '52px 20px 8px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{monthEyebrow(month)}</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginTop: 1 }}>Transactions</div>
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          <IconBtn onClick={onOpenSettings}>⚙</IconBtn>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', color: 'var(--accent-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>P</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '6px 16px 0' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--muted)' }}>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendor or category…"
            style={{ width: '100%', padding: '11px 14px 11px 34px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13.5, color: 'var(--text)', outline: 'none', fontFamily: 'Syne, sans-serif', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Control chips */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px 6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <ControlChip glyph="↕" label={sortLabel} active={filters.sort !== 'Newest first'} onClick={() => setSheetOpen(true)} />
        <ControlChip glyph="◎" label={catLabel} active={filters.categories.length > 0} onClick={() => setSheetOpen(true)} />
        <ControlChip glyph="₹" label={amtLabel} active={filters.amtMin > 0 || (filters.amtMax < Infinity && filters.amtMax < bounds.max)} onClick={() => setSheetOpen(true)} />
        <ControlChip glyph="⚲" label={filters.type === 'All' ? 'Type' : filters.type} active={filters.type !== 'All'} onClick={() => setSheetOpen(true)} />
      </div>

      {/* Summary line */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 16px 8px' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          <span className="mono" style={{ color: 'var(--text)' }}>{filtered.length}</span> shown · <span className="mono">{formatINRFull(totalShown)}</span>
        </div>
        {hasActiveFilters && (
          <button onClick={clearAll} style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', padding: 0 }}>Clear all</button>
        )}
      </div>

      {/* List */}
      <div style={{ margin: '0 16px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>No transactions found</div>
        )}
        {filtered.map((t, i) => {
          const key = t.message_id || i
          const isOpen = expanded === key
          return (
            <div key={key} onClick={() => setExpanded(isOpen ? null : key)} style={{ padding: '12px 16px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', minHeight: 44 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {CATEGORY_EMOJI[t.category] || '💳'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.vendor}</span>
                    {recurringIds.has(t.message_id) && <Badge>↻</Badge>}
                    {anomalyIds.has(t.message_id) && <Badge tone="down">⚠</Badge>}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formatDate(t.date)} · {t.category} · {t.account_type}
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 14.5, fontWeight: 500, flexShrink: 0, color: t.direction === 'credit' ? 'var(--green)' : 'var(--text)' }}>
                  {t.direction === 'credit' ? '+' : '−'}₹{t.amount.toLocaleString('en-IN')}
                </div>
              </div>
              {isOpen && (
                <div style={{ marginTop: 10, marginLeft: 52, background: 'var(--surface2)', borderRadius: 10, padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                  {[
                    ['Full amount', `₹${t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                    ['Date', formatDate(t.date)],
                    ['Category', t.category],
                    ['Payment', t.account_type],
                    ['Type', t.direction],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{label}</div>
                      <div className="mono" style={{ fontSize: 12, marginTop: 1 }}>{val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {sheetOpen && (
        <FilterSheet
          onClose={() => setSheetOpen(false)}
          categories={categories}
          filters={filtersWithBounds}
          onApply={f => setFilters({ ...f, amtMin: f.amtMin <= bounds.min ? 0 : f.amtMin, amtMax: f.amtMax >= bounds.max ? Infinity : f.amtMax })}
          totalCount={filtered.length}
        />
      )}
    </div>
  )
}

function Badge({ children, tone }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4, flexShrink: 0, letterSpacing: '0.04em', background: tone === 'down' ? 'rgba(197,48,48,0.10)' : 'var(--surface2)', color: tone === 'down' ? 'var(--red)' : 'var(--muted)' }}>{children}</span>
  )
}

function sumAmount(txns) {
  return txns.reduce((s, t) => s + t.amount, 0)
}
