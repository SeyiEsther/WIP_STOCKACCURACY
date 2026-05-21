const STATUS_CHIPS = [
  { key: 'ALL',     label: 'All'     },
  { key: 'FLAGGED', label: 'Flagged' },
  { key: 'UP',      label: 'Up'      },
  { key: 'DOWN',    label: 'Down'    },
  { key: 'NEW',     label: 'New'     },
  { key: 'MISSING', label: 'Missing' },
]

const STATUS_ACTIVE = {
  ALL:     { color: 'var(--blue)',  bg: 'var(--blue-bg)',  border: 'var(--blue-border)'  },
  FLAGGED: { color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)' },
  UP:      { color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)' },
  DOWN:    { color: 'var(--red)',   bg: 'var(--red-bg)',   border: 'var(--red-border)'   },
  NEW:     { color: 'var(--blue)',  bg: 'var(--blue-bg)',  border: 'var(--blue-border)'  },
  MISSING: { color: 'var(--grey)',  bg: 'var(--grey-bg)',  border: 'var(--grey-border)'  },
}

const ABC_CHIPS = [
  { key: 'ALL', label: 'All' },
  { key: 'A',   label: 'A',  color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)' },
  { key: 'B',   label: 'B',  color: 'var(--blue)',  bg: 'var(--blue-bg)',  border: 'var(--blue-border)'  },
  { key: 'C',   label: 'C',  color: 'var(--grey)',  bg: 'var(--grey-bg)',  border: 'var(--grey-border)'  },
]

export default function FilterBar({
  // status chips
  filterChip, onChipChange,
  // search / sloc / threshold
  search, onSearchChange,
  sloc, slocs, onSlocChange,
  threshold, onThresholdChange,
  // ABC
  abcFilter, onAbcFilterChange, hasAbc,
  // trend
  trendOnly, onTrendOnlyChange, trendDays, onTrendDaysChange,
  // ack
  hideAcked, onHideAckedChange, ackedCount,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* ── Row 1: status chips + search / sloc / threshold ─────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {STATUS_CHIPS.map(c => (
            <Chip
              key={c.key}
              label={c.label}
              active={filterChip === c.key}
              theme={STATUS_ACTIVE[c.key]}
              onClick={() => onChipChange(c.key)}
            />
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 0 }} />

        <input
          type="text"
          placeholder="Search material / description…"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          style={{ padding: '4px 10px', width: 220, borderRadius: 4 }}
        />

        <select
          value={sloc}
          onChange={e => onSlocChange(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 4 }}
        >
          {slocs.map(s => (
            <option key={s} value={s}>{s === 'ALL' ? 'All SLocs' : `SLoc ${s}`}</option>
          ))}
        </select>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-lo)',
        }}>
          <span>Flag &gt;</span>
          <input
            type="number" min={0} max={1000} value={threshold}
            onChange={e => onThresholdChange(Number(e.target.value) || 0)}
            style={{ width: 46, padding: '4px 6px', textAlign: 'right', borderRadius: 4 }}
          />
          <span>%</span>
        </div>
      </div>

      {/* ── Row 2: ABC / trend / ack ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>

        {/* ABC class filter */}
        {hasAbc && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tx-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              ABC
            </span>
            {ABC_CHIPS.map(c => (
              <Chip
                key={c.key}
                label={c.label}
                active={abcFilter === c.key}
                theme={c.key === 'ALL'
                  ? { color: 'var(--tx-body)', bg: 'var(--bg-inset)', border: 'var(--border-sub)' }
                  : { color: c.color, bg: c.bg, border: c.border }}
                onClick={() => onAbcFilterChange(c.key)}
              />
            ))}
          </div>
        )}

        {hasAbc && <Sep />}

        {/* Trend filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ToggleBtn
            active={trendOnly}
            onClick={() => onTrendOnlyChange(!trendOnly)}
            activeColor="var(--blue)"
            activeBg="var(--blue-bg)"
            activeBorder="var(--blue-border)"
          >
            ↑↓ Trending
          </ToggleBtn>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-lo)',
          }}>
            <span>over</span>
            <input
              type="number" min={2} max={30} value={trendDays}
              onChange={e => onTrendDaysChange(Math.max(2, Number(e.target.value) || 2))}
              style={{ width: 40, padding: '3px 5px', textAlign: 'right', borderRadius: 4 }}
            />
            <span>days</span>
          </div>
        </div>

        <Sep />

        {/* Hide acknowledged */}
        <ToggleBtn
          active={hideAcked}
          onClick={() => onHideAckedChange(!hideAcked)}
          activeColor="var(--green)"
          activeBg="var(--green-bg)"
          activeBorder="var(--green-border)"
        >
          Hide acked{ackedCount > 0 ? ` (${ackedCount})` : ''}
        </ToggleBtn>
      </div>
    </div>
  )
}

// ── shared sub-components ────────────────────────────────────────────────────

function Chip({ label, active, theme, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 10px',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: active ? 600 : 400,
        background: active ? theme.bg    : 'transparent',
        border:     active ? `1px solid ${theme.border}` : '1px solid var(--border)',
        color:      active ? theme.color : 'var(--tx-lo)',
        borderRadius: 20,
        cursor: 'pointer',
        transition: 'all 0.1s',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-inset)'; e.currentTarget.style.color = 'var(--tx-body)' }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent';     e.currentTarget.style.color = 'var(--tx-lo)'   }}}
    >
      {label}
    </button>
  )
}

function ToggleBtn({ children, active, onClick, activeColor, activeBg, activeBorder }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 10px',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: active ? 600 : 400,
        background: active ? activeBg    : 'transparent',
        border:     active ? `1px solid ${activeBorder}` : '1px solid var(--border)',
        color:      active ? activeColor : 'var(--tx-lo)',
        borderRadius: 4,
        cursor: 'pointer',
        transition: 'all 0.1s',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-inset)' }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'     }}}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} />
}
