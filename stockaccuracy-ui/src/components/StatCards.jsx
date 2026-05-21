// KPI Strip — horizontal row of key numbers, each is a filter shortcut

const KPIS = [
  { key: 'ALL',     label: 'Tracked', field: 'totalTracked', color: 'var(--tx-hi)',  activeColor: 'var(--blue)'  },
  { key: 'FLAGGED', label: 'Flagged', field: 'totalFlagged', color: 'var(--amber)', activeColor: 'var(--amber)' },
  { key: 'NEW',     label: 'New',     field: 'totalNew',     color: 'var(--blue)',   activeColor: 'var(--blue)'  },
  { key: 'MISSING', label: 'Missing', field: 'totalMissing', color: 'var(--grey)',   activeColor: 'var(--grey)'  },
]

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1) }

export default function StatCards({ summary, activeCard, onCardClick }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'stretch',
    }}>
      {KPIS.map((k, i) => {
        const active = activeCard === k.key
        const value  = summary ? (summary[k.field] ?? summary[cap(k.field)] ?? '—') : null
        return (
          <KpiCell
            key={k.key}
            kpi={k}
            value={value}
            active={active}
            showDivider={i > 0}
            onClick={() => onCardClick(active ? 'ALL' : k.key)}
          />
        )
      })}
    </div>
  )
}

function KpiCell({ kpi, value, active, showDivider, onClick }) {
  return (
    <>
      {showDivider && (
        <div style={{ width: 1, background: 'var(--border)', flexShrink: 0, margin: '8px 0' }} />
      )}
      <button
        onClick={onClick}
        title={`Filter by ${kpi.label.toLowerCase()}`}
        style={{
          flex: 1,
          padding: '10px 20px',
          background: active ? 'var(--bg-inset)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 2,
          transition: 'background 0.12s',
          borderTop: active ? `2px solid ${kpi.activeColor}` : '2px solid transparent',
          marginTop: 0,
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-inset)' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1,
          color: active ? kpi.activeColor : kpi.color,
          letterSpacing: '-0.02em',
        }}>
          {value == null ? <Skel /> : value}
        </span>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          fontWeight: 600,
          color: active ? kpi.activeColor : 'var(--tx-lo)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {kpi.label}
        </span>
      </button>
    </>
  )
}

function Skel() {
  return (
    <span style={{
      display: 'inline-block', width: 36, height: 22,
      background: 'var(--bg-inset)', borderRadius: 3,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  )
}
