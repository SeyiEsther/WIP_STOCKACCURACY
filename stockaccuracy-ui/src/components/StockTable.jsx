const fmtQty = (n) => {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
}

const fmtPct = (n) => {
  if (n == null) return '—'
  const s = Number(n).toFixed(2)
  return (n > 0 ? '+' : '') + s + '%'
}

const STATUS_STYLE = {
  OK:      { color: '#4b5563', label: 'OK' },
  FLAGGED: { color: '#ff9f43', label: 'FLAG' },
  NEW:     { color: '#0090ff', label: 'NEW' },
  MISSING: { color: '#64748b', label: 'MISS' },
  UP:      { color: '#00e5a0', label: 'UP' },
  DOWN:    { color: '#ff4d6a', label: 'DOWN' },
}

function deriveStatus(row, threshold) {
  if (row.status === 'NEW')     return 'NEW'
  if (row.status === 'MISSING') return 'MISSING'
  if (Math.abs(row.pctChange) > threshold) return row.delta >= 0 ? 'UP' : 'DOWN'
  return 'OK'
}

const COLS = [
  { key: 'materialNumber', label: 'Material',    align: 'left'  },
  { key: 'materialDesc',   label: 'Description', align: 'left'  },
  { key: 'sLoc',           label: 'SLoc',        align: 'left'  },
  { key: 'qtyYesterday',   label: 'Yesterday',   align: 'right' },
  { key: 'qtyToday',       label: 'Today',       align: 'right' },
  { key: 'delta',          label: 'Delta',       align: 'right' },
  { key: 'pctChange',      label: '% Change',    align: 'right' },
  { key: 'status',         label: 'Status',      align: 'center' },
]

function SortIcon({ active, dir }) {
  if (!active) return <span style={{ color: '#2d3a52', marginLeft: 4 }}>↕</span>
  return <span style={{ color: 'var(--accent-blue)', marginLeft: 4 }}>{dir === 'asc' ? '↑' : '↓'}</span>
}

export default function StockTable({ rows, loading, sortKey, sortDir, onSort, threshold }) {
  if (loading) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: 32, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
        Loading stock data…
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: 32, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
        No rows match the current filters.
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', overflow: 'auto', flex: 1 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: 100 }} />
          <col style={{ width: 'auto' }} />
          <col style={{ width: 60 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 88 }} />
          <col style={{ width: 72 }} />
        </colgroup>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-bright)', position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 1 }}>
            {COLS.map(c => (
              <th
                key={c.key}
                onClick={() => onSort(c.key === 'status' ? 'absPct' : c.key)}
                style={{
                  padding: '8px 10px',
                  textAlign: c.align,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.label}
                <SortIcon active={sortKey === (c.key === 'status' ? 'absPct' : c.key)} dir={sortDir} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const statusKey = deriveStatus(r, threshold)
            const isFlagged = statusKey === 'UP' || statusKey === 'DOWN'
            return (
              <tr
                key={`${r.materialNumber}-${r.sLoc}-${i}`}
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: isFlagged ? '#ff4d6a08' : 'transparent',
                }}
                onMouseEnter={e => e.currentTarget.style.background = isFlagged ? '#ff4d6a12' : 'var(--bg-surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = isFlagged ? '#ff4d6a08' : 'transparent'}
              >
                <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {r.materialNumber}
                </td>
                <td style={{ padding: '7px 10px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.materialDesc}
                </td>
                <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                  {r.sLoc}
                </td>
                <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right', color: 'var(--text-dim)' }}>
                  {fmtQty(r.qtyYesterday)}
                </td>
                <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right', color: 'var(--text-primary)' }}>
                  {fmtQty(r.qtyToday)}
                </td>
                <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right', color: r.delta > 0 ? 'var(--accent-green)' : r.delta < 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                  {r.delta > 0 ? '+' : ''}{fmtQty(r.delta)}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                  <PctBadge pct={r.pctChange} flagged={isFlagged} />
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                  <StatusBadge statusKey={statusKey} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
        {rows.length} row{rows.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

function PctBadge({ pct, flagged }) {
  const color = pct > 0 ? 'var(--accent-green)' : pct < 0 ? 'var(--accent-red)' : 'var(--text-muted)'
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: flagged ? (pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)') : color,
      background: flagged ? (pct >= 0 ? '#00e5a015' : '#ff4d6a15') : 'transparent',
      padding: flagged ? '2px 5px' : '2px 0',
      border: flagged ? `1px solid ${pct >= 0 ? '#00e5a030' : '#ff4d6a30'}` : 'none',
    }}>
      {fmtPct(pct)}
    </span>
  )
}

function StatusBadge({ statusKey }) {
  const s = STATUS_STYLE[statusKey] ?? STATUS_STYLE.OK
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      color: s.color,
      border: `1px solid ${s.color}40`,
      background: s.color + '15',
      padding: '2px 6px',
      letterSpacing: '0.05em',
    }}>
      {s.label}
    </span>
  )
}
