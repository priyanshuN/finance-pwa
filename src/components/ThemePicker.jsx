import { useTheme } from '../hooks/useTheme'

export default function ThemePicker() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div style={{ margin: '16px 16px 0' }} className="fade-up">
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        Appearance
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {themes.map(t => {
            const active = t.id === theme
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={t.label}
                style={{
                  flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Syne, sans-serif',
                }}
              >
                <span style={{
                  width: 50, height: 50, borderRadius: 15, background: t.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: active ? '2px solid var(--accent)' : '1px solid var(--border)',
                  boxShadow: active ? '0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent)' : 'none',
                  transition: 'all 0.15s',
                }}>
                  {active
                    ? <span style={{ color: t.accent, fontSize: 18, fontWeight: 700, lineHeight: 1 }}>✓</span>
                    : <span style={{ width: 18, height: 18, borderRadius: '50%', background: t.accent }} />}
                </span>
                <span style={{
                  fontSize: 10, whiteSpace: 'nowrap',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--text)' : 'var(--muted)',
                }}>
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
