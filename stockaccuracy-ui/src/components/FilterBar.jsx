const CHIPS = [
  { key: 'ALL',     label: 'All' },
  { key: 'FLAGGED', label: 'Flagged' },
  { key: 'UP',      label: 'Up Only' },
  { key: 'DOWN',    label: 'Down Only' },
  { key: 'NEW',     label: 'New' },
  { key: 'MISSING', label: 'Missing' },
]

const CHIP_COLORS = {
  ALL:     '#64748b',
  FLAGGED: '#ff9f43',
  UP:      '#00e5a0',
  DOWN:    '#ff4d6a',
  NEW:     '#0090ff',
  MISSING: '#4b5563',
}

export default function FilterBar({
  filterChip, onChipChange,
  search, onSearchChange,
  sloc, slocs, onSlocChange,
  threshold, onThresholdChange,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {/* chips */}
      <div style={{ display: 'flex', gap: 4 }}>
        {CHIPS.map(c => {
          const active = filterChip === c.key
          const color  = CHIP_COLORS[c.key]
          return (
            <button
              key={c.key}
              onClick={() => onChipChange(c.key)}
              style={{
                padding: '4px 10px',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                background: active ? color + '20' : 'transparent',
                border: `1px solid ${active ? color : 'var(--border)'}`,
                color: active ? color : 'var(--text-muted)',
                letterSpacing: '0.03em',
                transition: 'all 0.12s',
              }}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, minWidth: 0 }} />

      {/* search */}
      <input
        type="text"
        placeholder="Search material / description…"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        style={{
          padding: '4px 10px',
          width: 240,
          border: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
        }}
      />

      {/* sloc */}
      <select
        value={sloc}
        onChange={e => onSlocChange(e.target.value)}
        style={{
          padding: '4px 8px',
          border: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
        }}
      >
        {slocs.map(s => (
          <option key={s} value={s}>{s === 'ALL' ? 'All SLocs' : `SLoc ${s}`}</option>
        ))}
      </select>

      {/* threshold */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
        <span>Flag &gt;</span>
        <input
          type="number"
          min={0}
          max={1000}
          value={threshold}
          onChange={e => onThresholdChange(Number(e.target.value) || 0)}
          style={{ width: 48, padding: '4px 6px', textAlign: 'right' }}
        />
        <span>%</span>
      </div>
    </div>
  )
}
