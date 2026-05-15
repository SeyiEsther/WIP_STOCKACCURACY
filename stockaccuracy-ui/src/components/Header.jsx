const fmt = (d) => d
  ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  : '—'

export default function Header({ lastUpdated, onRefresh, onExport, loading }) {
  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 20px',
      height: 52,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexShrink: 0,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
          Stock Accuracy Monitor
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
          ZMM_LI009 / WIP Stock Rep JF — Rittal CSM Plymouth
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
          <span style={{ color: 'var(--text-dim)' }}>Updated </span>
          {fmt(lastUpdated)}
        </div>

        <Btn onClick={onExport} color="var(--accent-green)" disabled={loading}>
          Export CSV
        </Btn>

        <Btn onClick={onRefresh} color="var(--accent-blue)" disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </Btn>
      </div>
    </header>
  )
}

function Btn({ children, onClick, color, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'transparent',
        border: `1px solid ${disabled ? 'var(--border)' : color}`,
        color: disabled ? 'var(--text-muted)' : color,
        padding: '4px 12px',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.04em',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = color + '18' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}
