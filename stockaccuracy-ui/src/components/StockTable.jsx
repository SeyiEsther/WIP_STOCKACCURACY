// ─── formatters ─────────────────────────────────────────────────────────────
const fmtQty = (n) => {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
}

const fmtPct = (n) => {
  if (n == null) return '—'
  return (n > 0 ? '+' : '') + Number(n).toFixed(2) + '%'
}

const fmtValue = (n) => {
  if (n == null || n === 0) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: 'GBP',
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(n)
}

// ─── status derivation ───────────────────────────────────────────────────────
function deriveStatus(row, threshold) {
  if (row.status === 'NEW')     return 'NEW'
  if (row.status === 'MISSING') return 'MISSING'
  if (Math.abs(row.pctChange) > threshold) return row.delta >= 0 ? 'UP' : 'DOWN'
  return 'OK'
}

const STATUS_DEF = {
  OK:      { label: 'OK',   color: 'var(--tx-faint)', bg: 'transparent',     border: 'var(--border)'       },
  UP:      { label: '▲ UP', color: 'var(--green)',    bg: 'var(--green-bg)', border: 'var(--green-border)' },
  DOWN:    { label: '▼ DN', color: 'var(--red)',      bg: 'var(--red-bg)',   border: 'var(--red-border)'   },
  NEW:     { label: 'NEW',  color: 'var(--blue)',     bg: 'var(--blue-bg)',  border: 'var(--blue-border)'  },
  MISSING: { label: 'MISS', color: 'var(--grey)',     bg: 'var(--grey-bg)',  border: 'var(--grey-border)'  },
}

const ABC_DEF = {
  A: { color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)' },
  B: { color: 'var(--blue)',  bg: 'var(--blue-bg)',  border: 'var(--blue-border)'  },
  C: { color: 'var(--grey)',  bg: 'var(--grey-bg)',  border: 'var(--grey-border)'  },
}

// ─── column definitions ───────────────────────────────────────────────────────
function buildCols(hasAbc) {
  const cols = [
    { key: 'materialNumber', label: 'Material',   align: 'left',   width: 108 },
    { key: 'materialDesc',   label: 'Description',align: 'left',   width: 'auto' },
  ]
  if (hasAbc)
    cols.push({ key: 'abcClass', label: 'ABC', align: 'center', width: 42, sortKey: null })
  cols.push(
    { key: 'sLoc',         label: 'SLoc',     align: 'center', width: 56  },
    { key: 'qtyYesterday', label: 'Yesterday',align: 'right',  width: 84  },
    { key: 'qtyToday',     label: 'Today',    align: 'right',  width: 84  },
    { key: 'delta',        label: 'Delta',    align: 'right',  width: 84  },
    { key: 'pctChange',    label: '% Chg',    align: 'right',  width: 82  },
    { key: 'valueImpact',  label: '£ Impact', align: 'right',  width: 90  },
    { key: 'trend',        label: 'Trend',    align: 'center', width: 72, sortKey: null },
    { key: 'status',       label: 'Status',   align: 'center', width: 68, sortKey: 'absPct' },
    { key: 'ack',          label: '✓',        align: 'center', width: 38, sortKey: null },
  )
  return cols
}

// ─── sub-components ───────────────────────────────────────────────────────────
function SortIcon({ active, dir }) {
  if (!active) return <span style={{ color: 'var(--border-sub)', marginLeft: 3 }}>↕</span>
  return <span style={{ color: 'var(--blue)', marginLeft: 3 }}>{dir === 'asc' ? '↑' : '↓'}</span>
}

function AbcBadge({ cls }) {
  if (!cls) return null
  const d = ABC_DEF[cls]
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
      color: d.color, background: d.bg, border: `1px solid ${d.border}`,
      padding: '1px 5px', borderRadius: 3,
    }}>
      {cls}
    </span>
  )
}

function PctBadge({ pct, statusKey }) {
  const flagged = statusKey === 'UP' || statusKey === 'DOWN'
  if (!flagged) {
    return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-lo)' }}>{fmtPct(pct)}</span>
  }
  const up = pct >= 0
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
      color:      up ? 'var(--green)'        : 'var(--red)',
      background: up ? 'var(--green-bg)'     : 'var(--red-bg)',
      border:    `1px solid ${up ? 'var(--green-border)' : 'var(--red-border)'}`,
      padding: '1px 5px', borderRadius: 3,
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
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      padding: '1px 6px', borderRadius: 3, letterSpacing: '0.03em',
    }}>
      {s.label}
    </span>
  )
}

function TrendCell({ direction, days }) {
  if (!direction || direction === 'FLAT') {
    return <span style={{ color: 'var(--tx-faint)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>—</span>
  }
  const up    = direction === 'UP'
  const arrow = up ? '▲' : '▼'
  const color = up ? 'var(--green)' : 'var(--red)'
  const bg    = up ? 'var(--green-bg)' : 'var(--red-bg)'
  const border = up ? 'var(--green-border)' : 'var(--red-border)'
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
      color, background: bg, border: `1px solid ${border}`,
      padding: '1px 5px', borderRadius: 3,
    }}>
      {arrow} {days}d
    </span>
  )
}

function AckBtn({ isAcked, onClick }) {
  return (
    <button
      onClick={onClick}
      title={isAcked ? 'Remove acknowledgement' : 'Acknowledge — mark as reviewed'}
      style={{
        width: 22, height: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isAcked ? 'var(--green-bg)' : 'transparent',
        border: `1px solid ${isAcked ? 'var(--green-border)' : 'var(--border)'}`,
        color: isAcked ? 'var(--green)' : 'var(--tx-faint)',
        borderRadius: 4,
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 700,
        transition: 'all 0.1s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (!isAcked) {
          e.currentTarget.style.background = 'var(--green-bg)'
          e.currentTarget.style.color = 'var(--green)'
          e.currentTarget.style.borderColor = 'var(--green-border)'
        }
      }}
      onMouseLeave={e => {
        if (!isAcked) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--tx-faint)'
          e.currentTarget.style.borderColor = 'var(--border)'
        }
      }}
    >
      ✓
    </button>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export default function StockTable({
  rows, loading, sortKey, sortDir, onSort, threshold,
  acknowledgements, onAck, hasAbc,
}) {
  const cols = buildCols(hasAbc)

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
          {cols.map(c => (
            <col key={c.key} style={{ width: c.width === 'auto' ? undefined : c.width }} />
          ))}
        </colgroup>
        <thead>
          <tr style={{
            borderBottom: '2px solid var(--border)',
            position: 'sticky', top: 0, zIndex: 1,
            background: 'var(--bg-inset)',
          }}>
            {cols.map(c => {
              const sk = c.sortKey !== undefined ? c.sortKey : c.key
              return (
                <th
                  key={c.key}
                  onClick={() => sk && onSort(sk)}
                  style={{
                    padding: '7px 8px',
                    textAlign: c.align,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10, fontWeight: 700,
                    color: 'var(--tx-lo)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: sk ? 'pointer' : 'default',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.label}
                  {sk && <SortIcon active={sortKey === sk} dir={sortDir} />}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const st       = deriveStatus(r, threshold)
            const isFlagged = st === 'UP' || st === 'DOWN'
            const leftColor = st === 'UP' ? 'var(--green)' : st === 'DOWN' ? 'var(--red)' : 'transparent'
            const rowKey    = `${r.materialNumber}-${r.sLoc}-${i}`
            const isAcked   = !!acknowledgements?.[`${r.materialNumber}__${r.sLoc}`]

            return (
              <tr
                key={rowKey}
                style={{
                  borderBottom: '1px solid var(--border)',
                  borderLeft: `3px solid ${leftColor}`,
                  background: isAcked
                    ? 'var(--bg-inset)'
                    : isFlagged
                      ? (st === 'UP' ? '#dafbe120' : '#ffebe920')
                      : 'transparent',
                  opacity: isAcked ? 0.5 : 1,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-inset)'}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isAcked
                    ? 'var(--bg-inset)'
                    : isFlagged
                      ? (st === 'UP' ? '#dafbe120' : '#ffebe920')
                      : 'transparent'
                }}
              >
                {/* Material */}
                <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--tx-hi)', whiteSpace: 'nowrap' }}>
                  {r.materialNumber}
                </td>
                {/* Description */}
                <td style={{ padding: '6px 8px', color: 'var(--tx-body)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.materialDesc}
                </td>
                {/* ABC (conditional) */}
                {hasAbc && (
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                    <AbcBadge cls={r.abcClass} />
                  </td>
                )}
                {/* SLoc */}
                <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-lo)', textAlign: 'center' }}>
                  {r.sLoc}
                </td>
                {/* Yesterday */}
                <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right', color: 'var(--tx-lo)' }}>
                  {fmtQty(r.qtyYesterday)}
                </td>
                {/* Today */}
                <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right', color: 'var(--tx-hi)' }}>
                  {fmtQty(r.qtyToday)}
                </td>
                {/* Delta */}
                <td style={{
                  padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right',
                  color: r.delta > 0 ? 'var(--green)' : r.delta < 0 ? 'var(--red)' : 'var(--tx-lo)',
                }}>
                  {r.delta > 0 ? '+' : ''}{fmtQty(r.delta)}
                </td>
                {/* % Change */}
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                  <PctBadge pct={r.pctChange} statusKey={st} />
                </td>
                {/* £ Impact */}
                <td style={{
                  padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right',
                  color: r.valueImpact && r.valueImpact > 50 ? 'var(--amber)' : 'var(--tx-lo)',
                  fontWeight: r.valueImpact && r.valueImpact > 50 ? 600 : 400,
                }}>
                  {fmtValue(r.valueImpact)}
                </td>
                {/* Trend */}
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                  <TrendCell direction={r.trendDirection} days={r.trendDays} />
                </td>
                {/* Status */}
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                  <StatusBadge statusKey={st} />
                </td>
                {/* Ack */}
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                  <AckBtn isAcked={isAcked} onClick={() => onAck(r.materialNumber, r.sLoc)} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div style={{
        padding: '6px 10px',
        borderTop: '1px solid var(--border)',
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tx-faint)',
        background: 'var(--bg-inset)',
        display: 'flex', gap: 12,
      }}>
        <span>{rows.length} row{rows.length !== 1 ? 's' : ''}</span>
        {rows.some(r => r.valueImpact != null) && (
          <span>
            Total £ impact:{' '}
            <strong>
              {fmtValue(rows.reduce((s, r) => s + (r.valueImpact ?? 0), 0))}
            </strong>
          </span>
        )}
      </div>
    </div>
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
