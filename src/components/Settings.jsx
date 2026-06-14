import { useState } from 'react'
import { version } from '../../package.json'
import { useBudget } from '../hooks/useBudget'
import { useTheme } from '../hooks/useTheme'
import { exportTransactions } from '../lib/export'
import { CATEGORY_COLORS } from '../lib/utils'

const CATEGORIES = Object.keys(CATEGORY_COLORS)

function Row({ icon, label, sub, value, danger, chevron, accent, divider, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 16px', minHeight: 52, borderBottom: divider ? '1px solid var(--border)' : 'none', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: danger ? 'var(--red)' : 'var(--text)' }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: danger ? 'var(--red)' : 'var(--text)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{sub}</div>}
      </div>
      {value && <span className="mono" style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>{value}</span>}
      {accent && <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>{accent}</span>}
      {chevron && <span style={{ fontSize: 16, color: 'var(--muted)', flexShrink: 0 }}>›</span>}
    </div>
  )
}

function Section({ title, hint, children }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 4px 8px' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{title}</div>
        {hint && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{hint}</span>}
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function ThemePickerInline() {
  const { theme, setTheme, themes, mode, setMode } = useTheme()

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
        {themes.map(t => {
          const on = t.id === theme
          return (
            <button key={t.id} onClick={() => setTheme(t.id)} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: t.bg, border: on ? '2px solid var(--accent)' : '1px solid var(--border)', boxShadow: on ? '0 0 0 3px color-mix(in srgb, var(--accent) 28%, transparent)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: t.accent }} />
              </div>
              <span style={{ fontSize: 10.5, color: on ? 'var(--text)' : 'var(--muted)', fontWeight: on ? 600 : 400 }}>{t.label.split(' / ').pop()}</span>
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 11, padding: 3, marginTop: 14 }}>
        {['Light', 'Dark', 'Auto'].map(m => {
          const on = m.toLowerCase() === mode
          return (
            <button key={m} onClick={() => setMode(m.toLowerCase())} style={{ flex: 1, textAlign: 'center', padding: '8px 0', fontSize: 12.5, fontWeight: on ? 600 : 500, borderRadius: 8, color: on ? 'var(--text)' : 'var(--muted)', background: on ? 'var(--surface)' : 'transparent', boxShadow: on ? 'var(--shadow)' : 'none', border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', transition: 'all 0.15s' }}>{m}</button>
          )
        })}
      </div>
    </div>
  )
}

export default function Settings({ transactions, month, onRefetch, toast, rules, onAddRule, onRemoveRule, llmRules, onAcceptLlmRule, onRemoveLlmRule, onAcceptAllLlmRules, onClose }) {
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

  return (
    <div className="no-scrollbar" style={{ position: 'absolute', inset: 0, background: 'var(--bg)', overflowY: 'auto', zIndex: 50 }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 8px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>Settings</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 14, fontWeight: 600, fontFamily: 'Syne, sans-serif', cursor: 'pointer', padding: '4px 0' }}>Done</button>
      </div>

      <div style={{ padding: '2px 16px 100px' }}>
        {/* Profile card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: 'var(--accent)', color: 'var(--accent-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 700 }}>P</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Priyanshu</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>HDFC · Google Sheets · v{version}</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--green)', flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />Synced
          </span>
        </div>

        {/* Appearance — inline theme picker */}
        <Section title="Appearance">
          <ThemePickerInline />
        </Section>

        {/* Data & Sync */}
        <Section title="Data & Sync">
          <Row icon="↻" label="Sync transactions" sub="Re-fetch from Google Sheets" value="just now" divider onClick={() => { onRefetch(); toast('Syncing…', 'info') }} />
          <Row icon="↓" label="Export current view" sub="Download as CSV" chevron divider onClick={handleExport} />
          <Row icon="↓" label="Export all time" sub={`${transactions?.length || 0} transactions`} chevron onClick={handleExportAll} />
        </Section>

        {/* Budgets */}
        <Section title="Budgets" hint={budgetCount ? `${budgetCount} set` : undefined}>
          <Row icon="◎" label="Manage budgets" sub="Limits, alerts, pace" chevron divider onClick={null} />
          <Row icon="🗑" label="Clear all budgets" sub={budgetCount ? `Remove all ${budgetCount} limits` : 'No budgets set'} danger onClick={budgetCount ? handleClearBudgets : undefined} />
        </Section>

        {/* Alias rules */}
        <Section title="Alias rules" hint={rules.length ? `${rules.length} rule${rules.length !== 1 ? 's' : ''}` : undefined}>
          {/* Add rule */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Map a vendor substring to a category</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={vendor} onChange={e => setVendor(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddRule()} placeholder="Vendor (e.g. NoBroker)"
                style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, fontFamily: 'Syne, sans-serif', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={category} onChange={e => setCategory(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, fontFamily: 'Syne, sans-serif', outline: 'none' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={handleAddRule} disabled={!vendor.trim()} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: vendor.trim() ? 'var(--accent)' : 'var(--surface2)', color: vendor.trim() ? 'var(--accent-fg)' : 'var(--muted)', fontSize: 13, fontFamily: 'Syne, sans-serif', cursor: vendor.trim() ? 'pointer' : 'default', fontWeight: 500 }}>Add</button>
            </div>
          </div>
          {rules.length === 0 ? (
            <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--muted)' }}>No rules yet</div>
          ) : (
            rules.map((rule, i) => (
              <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < rules.length - 1 ? '1px solid var(--border)' : 'none', minHeight: 44 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: CATEGORY_COLORS[rule.category] || '#a0aec0' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{rule.vendor}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)', margin: '0 6px' }}>→</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{rule.category}</span>
                </div>
                <button onClick={() => { onRemoveRule(rule.id); toast('Rule removed', 'info') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: '2px 4px' }}>×</button>
              </div>
            ))
          )}
        </Section>

        {/* AI Suggested Rules */}
        {llmRules && llmRules.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 4px 8px' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>AI Suggested</div>
              <button onClick={() => { onAcceptAllLlmRules(); toast(`Accepted ${llmRules.length} suggestion${llmRules.length === 1 ? '' : 's'}`, 'success') }} style={{ background: 'none', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--green)', fontSize: 11, padding: '3px 10px', borderRadius: 6, fontFamily: 'Syne, sans-serif', fontWeight: 500 }}>Accept all</button>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
              {llmRules.map((rule, i) => (
                <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < llmRules.length - 1 ? '1px solid var(--border)' : 'none', minHeight: 44 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: CATEGORY_COLORS[rule.category] || '#a0aec0' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{rule.vendor}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)', margin: '0 6px' }}>→</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{rule.category}</span>
                  </div>
                  <button onClick={() => { onAcceptLlmRule(rule); toast(`"${rule.vendor}" → ${rule.category}`, 'success') }} style={{ background: 'none', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--green)', fontSize: 11, padding: '3px 8px', borderRadius: 6, fontFamily: 'Syne, sans-serif', fontWeight: 500, flexShrink: 0 }}>Accept</button>
                  <button onClick={() => { onRemoveLlmRule(rule.id); toast('Dismissed', 'info') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: '2px 4px' }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* About */}
        <Section title="About">
          <Row icon="💰" label="Finance Tracker" value={`v${version}`} divider />
          <Row icon="📊" label="Data source" sub="Google Sheets via Vercel" chevron divider />
          <Row icon="🔒" label="Privacy" sub="Data stays on your device" chevron />
        </Section>
      </div>
    </div>
  )
}
