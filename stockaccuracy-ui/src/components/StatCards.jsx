const CARDS = [
  { key: 'ALL',     label: 'Total Tracked', field: 'totalTracked', color: '#0090ff' },
  { key: 'FLAGGED', label: 'Flagged',        field: 'totalFlagged', color: '#ff9f43' },
  { key: 'NEW',     label: 'New',            field: 'totalNew',     color: '#00e5a0' },
  { key: 'MISSING', label: 'Missing',        field: 'totalMissing', color: '#4b5563' },
]

export default function StatCards({ summary, activeCard, onCardClick }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      {CARDS.map(c => {
        const active = activeCard === c.key
        const value = summary ? (summary[c.field] ?? summary[cap(c.field)] ?? '—') : '—'
        return (
          <button
            key={c.key}
            onClick={() => onCardClick(active ? 'ALL' : c.key)}
            style={{
              background: active ? c.color + '14' : 'var(--bg-surface)',
              border: `1px solid ${active ? c.color : 'var(--border)'}`,
              color: 'inherit',
              padding: '14px 16px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 600, color: c.color, lineHeight: 1 }}>
              {summary ? value : <Skeleton />}
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: active ? 'var(--text-dim)' : 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {c.label}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function Skeleton() {
  return <span style={{ display: 'inline-block', width: 40, height: 26, background: 'var(--border)', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' }} />
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
