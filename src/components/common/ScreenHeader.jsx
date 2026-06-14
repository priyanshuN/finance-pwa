function IconBtn({ onClick, children, style }) {
  return (
    <button onClick={onClick} style={{
      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
      background: 'var(--surface)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 15, color: 'var(--muted)', cursor: 'pointer',
      fontFamily: 'Syne, sans-serif', ...style,
    }}>{children}</button>
  )
}

export default function ScreenHeader({ eyebrow, title, onOpenSettings, onSync, extra }) {
  return (
    <div style={{ padding: '52px 20px 8px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0 }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{eyebrow}</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginTop: 1 }}>{title}</div>
      </div>
      <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
        {extra}
        {onSync && <IconBtn onClick={onSync}>↻</IconBtn>}
        <IconBtn onClick={onOpenSettings}>⚙</IconBtn>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', color: 'var(--accent-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>P</div>
      </div>
    </div>
  )
}
