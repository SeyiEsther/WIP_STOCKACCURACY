const CHIPS = [
  { key: 'ALL',     label: 'All'     },
  { key: 'FLAGGED', label: 'Flagged' },
  { key: 'UP',      label: 'Up'      },
  { key: 'DOWN',    label: 'Down'    },
  { key: 'NEW',     label: 'New'     },
  { key: 'MISSING', label: 'Missing' },
]

const CHIP_ACTIVE = {
  ALL:     { color: 'var(--blue)',  bg: 'var(--blue-bg)',  border: 'var(--blue-border)'  },
  FLAGGED: { color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)' },
  UP:      { color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)' },
  DOWN:    { color: 'var(--red)',   bg: 'var(--red-bg)',   border: 'var(--red-border)'   },
  NEW:     { color: 'var(--blue)',  bg: 'var(--blue-bg)',  border: 'var(--blue-border)'  },
  MISSING: { color: 'var(--grey)',  bg: 'var(--grey-bg)',  border: 'var(--grey-border)'  },
}

export default function FilterBar({
  filterChip, onChipChange,
  search, onSearchChange,
  sloc, slocs, onSlocChange,
  threshold, onThresholdChange,
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    }}>
      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 4 }}>
        {CHIPS.map(c => {
          const active = filterChip === c.key
          const theme  = CHIP_ACTIVE[c.key]
          return (
            <button
              key={c.key}
              onClick={() => onChipChange(c.key)}
              style={{
                padding: '3px 10px',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: active ? 600 : 400,
                background: active ? theme.bg    : 'transparent',
                border:     active
                  ? `1px solid ${theme.border}`
                  : '1px solid var(--border)',
                color: active ? theme.color : 'var(--tx-lo)',
                borderRadius: 20,
                letterSpacing: '0.02em',
                transition: 'all 0.1s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-inset)'; e.currentTarget.style.color = 'var(--tx-body)' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent';     e.currentTarget.style.color = 'var(--tx-lo)'   } }}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, minWidth: 0 }} />

      {/* Search */}
      <input
        type="text"
        placeholder="Search material / description…"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        style={{
          padding: '4px 10px',
          width: 230,
          borderRadius: 4,
        }}
      />

      {/* SLoc */}
      <select
        value={sloc}
        onChange={e => onSlocChange(e.target.value)}
        style={{ padding: '4px 8px', borderRadius: 4 }}
      >
        {slocs.map(s => (
          <option key={s} value={s}>{s === 'ALL' ? 'All SLocs' : `SLoc ${s}`}</option>
        ))}
      </select>

      {/* Threshold */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-lo)',
      }}>
        <span>Flag &gt;</span>
        <input
          type="number"
          min={0}
          max={1000}
          value={threshold}
          onChange={e => onThresholdChange(Number(e.target.value) || 0)}
          style={{ width: 46, padding: '4px 6px', textAlign: 'right', borderRadius: 4 }}
        />
        <span>%</span>
      </div>
    </div>
  )
}
