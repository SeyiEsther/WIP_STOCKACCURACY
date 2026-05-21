const fmtQty = (n) => {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
}

const fmtPct = (n) => {
  if (n == null) return '—'
  const s = Number(n).toFixed(2)
  return (n > 0 ? '+' : '') + s + '%'
}

// Derive display status from row fields + threshold
function deriveStatus(row, threshold) {
  if (row.status === 'NEW')     return 'NEW'
  if (row.status === 'MISSING') return 'MISSING'
  if (Math.abs(row.pctChange) > threshold) return row.delta >= 0 ? 'UP' : 'DOWN'
  return 'OK'
}

const STATUS_DEF = {
  OK:      { label: 'OK',   color: 'var(--tx-faint)',  bg: 'transparent',       border: 'var(--border)'      },
  UP:      { label: '▲ UP', color: 'var(--green)',     bg: 'var(--green-bg)',   border: 'var(--green-border)' },
  DOWN:    { label: '▼ DN', color: 'var(--red)',       bg: 'var(--red-bg)',     border: 'var(--red-border)'   },
  NEW:     { label: 'NEW',  color: 'var(--blue)',      bg: 'var(--blue-bg)',    border: 'var(--blue-border)'  },
  MISSING: { label: 'MISS', color: 'var(--grey)',      bg: 'var(--grey-bg)',    border: 'var(--grey-border)'  },
}

const COLS = [
  { key: 'materialNumber', label: 'Material',    align: 'left'   },
  { key: 'materialDesc',   label: 'Description', align: 'left'   },
  { key: 'sLoc',           label: 'SLoc',        align: 'center' },
  { key: 'qtyYesterday',   label: 'Yesterday',   align: 'right'  },
  { key: 'qtyToday',       label: 'Today',       align: 'right'  },
  { key: 'delta',          label: 'Delta',       align: 'right'  },
  { key: 'pctChange',      label: '% Change',    align: 'right'  },
  { key: 'status',         label: 'Status',      align: 'center' },
]

function SortIcon({ active, dir }) {
  if (!active) return <span style={{ color: 'var(--border-sub)', marginLeft: 3 }}>↕</span>
  return <span style={{ color: 'var(--blue)', marginLeft: 3 }}>{dir === 'asc' ? '↑' : '↓'}</span>
}

export default function StockTable({ rows, loading, sortKey, sortDir, onSort, threshold }) {
  if (loading) {
    return (
      <div style={EMPTY_STYLE}>
        <span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block', marginRight: 8 }}>◌</span>
        Loading stock data…
      </div>
    )
  }

  if (!rows.length) {
    return <div style={EMPTY_STYLE}>No rows match the current filters.</div>
  }

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      overflow: 'auto',
      flex: 1,
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: 110 }} />
          <col style={{ width: 'auto' }} />
          <col style={{ width: 58 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 88 }} />
          <col style={{ width: 72 }} />
        </colgroup>
        <thead>
          <tr style={{
            borderBottom: '2px solid var(--border)',
            position: 'sticky', top: 0,
            background: 'var(--bg-surface)', zIndex: 1,
          }}>
            {COLS.map(c => {
              const sortField = c.key === 'status' ? 'absPct' : c.key
              return (
                <th
                  key={c.key}
                  onClick={() => onSort(sortField)}
                  style={{
                    padding: '7px 10px',
                    textAlign: c.align,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--tx-lo)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    background: 'var(--bg-inset)',
                  }}
                >
                  {c.label}
                  <SortIcon active={sortKey === sortField} dir={sortDir} />
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const st = deriveStatus(r, threshold)
            const isFlagged = st === 'UP' || st === 'DOWN'
            const leftBorderColor = st === 'UP' ? 'var(--green)' : st === 'DOWN' ? 'var(--red)' : 'transparent'
            return (
              <tr
                key={`${r.materialNumber}-${r.sLoc}-${i}`}
                style={{
                  borderBottom: '1px solid var(--border)',
                  borderLeft: `3px solid ${leftBorderColor}`,
                  background: isFlagged
                    ? (st === 'UP' ? '#dafbe130' : '#ffebe930')
                    : 'transparent',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-inset)'}
                onMouseLeave={e => e.currentTarget.style.background = isFlagged
                  ? (st === 'UP' ? '#dafbe130' : '#ffebe930')
                  : 'transparent'}
              >
                <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--tx-hi)', whiteSpace: 'nowrap' }}>
                  {r.materialNumber}
                </td>
                <td style={{ padding: '6px 10px', color: 'var(--tx-body)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.materialDesc}
                </td>
                <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-lo)', textAlign: 'center' }}>
                  {r.sLoc}
                </td>
                <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right', color: 'var(--tx-lo)' }}>
                  {fmtQty(r.qtyYesterday)}
                </td>
                <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right', color: 'var(--tx-hi)' }}>
                  {fmtQty(r.qtyToday)}
                </td>
                <td style={{
                  padding: '6px 10px',
                  fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right',
                  color: r.delta > 0 ? 'var(--green)' : r.delta < 0 ? 'var(--red)' : 'var(--tx-lo)',
                }}>
                  {r.delta > 0 ? '+' : ''}{fmtQty(r.delta)}
                </td>
                <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                  <PctBadge pct={r.pctChange} statusKey={st} />
                </td>
                <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                  <StatusBadge statusKey={st} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div style={{
        padding: '6px 12px',
        borderTop: '1px solid var(--border)',
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tx-faint)',
        background: 'var(--bg-inset)',
      }}>
        {rows.length} row{rows.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

function PctBadge({ pct, statusKey }) {
  const flagged = statusKey === 'UP' || statusKey === 'DOWN'
  if (!flagged) {
    return (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-lo)' }}>
        {fmtPct(pct)}
      </span>
    )
  }
  const up = pct >= 0
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
      color:      up ? 'var(--green)'        : 'var(--red)',
      background: up ? 'var(--green-bg)'     : 'var(--red-bg)',
      border:    `1px solid ${up ? 'var(--green-border)' : 'var(--red-border)'}`,
      padding: '1px 5px',
      borderRadius: 3,
    }}>
      {fmtPct(pct)}
    </span>
  )
}

function StatusBadge({ statusKey }) {
  const s = STATUS_DEF[statusKey] ?? STATUS_DEF.OK
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
      color: s.color,
      background: s.bg,
      border: `1px solid ${s.border}`,
      padding: '1px 6px',
      borderRadius: 3,
      letterSpacing: '0.03em',
    }}>
      {s.label}
    </span>
  )
}

const EMPTY_STYLE = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  padding: 32,
  textAlign: 'center',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--tx-lo)',
}
