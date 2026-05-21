// Notification centre — slide-in panel showing all flagged items,
// each dismissible with an "Investigated ✓" timestamp record.

const iid = (mat, sloc) => `${mat}__${sloc}`

const fmtTime = (isoStr) => {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const fmtPct = (n) => `${Math.abs(n).toFixed(1)}%`

export default function NotificationPanel({ items, threshold, investigated, onInvestigate, onClose }) {
  // Only show items with a meaningful % change (not NEW / MISSING — those are separate workflows)
  const flagged = (items || []).filter(r =>
    Math.abs(r.pctChange) > threshold &&
    r.status !== 'MISSING' &&
    r.status !== 'NEW'
  )

  const unaddressed  = flagged.filter(r => !investigated[iid(r.materialNumber, r.sLoc)])
  const doneItems    = flagged.filter(r =>  investigated[iid(r.materialNumber, r.sLoc)])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 99,
          background: 'rgba(0,0,0,0.18)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 48, right: 0, bottom: 0,
        width: 370,
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border)',
        zIndex: 100,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-6px 0 20px rgba(0,0,0,0.10)',
      }}>

        {/* Panel header */}
        <div style={{
          padding: '11px 16px',
          borderBottom: '2px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-inset)',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, color: 'var(--tx-hi)', flex: 1 }}>
            Flagged Items
          </span>
          {unaddressed.length > 0 && (
            <span style={{
              background: 'var(--red)', color: '#fff',
              borderRadius: 10,
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              padding: '1px 7px',
            }}>
              {unaddressed.length} unaddressed
            </span>
          )}
          {unaddressed.length === 0 && flagged.length > 0 && (
            <span style={{
              background: 'var(--green-bg)', color: 'var(--green)',
              border: '1px solid var(--green-border)',
              borderRadius: 10,
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              padding: '1px 7px',
            }}>
              all investigated ✓
            </span>
          )}
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: 'none', border: 'none',
              color: 'var(--tx-lo)', fontSize: 20, lineHeight: 1,
              cursor: 'pointer', padding: '0 2px',
              fontFamily: 'var(--font-sans)',
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {flagged.length === 0 && (
            <div style={{
              padding: '40px 24px', textAlign: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-lo)',
              lineHeight: 1.6,
            }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>✓</div>
              No flagged items
              <div style={{ marginTop: 4, color: 'var(--tx-faint)', fontSize: 10 }}>
                All stock changes are within the {threshold}% threshold
              </div>
            </div>
          )}

          {/* ── Unaddressed ────────────────────────────────────────── */}
          {unaddressed.length > 0 && (
            <>
              <SectionHead count={unaddressed.length} type="unaddressed" />
              {unaddressed.map(r => (
                <NCard
                  key={iid(r.materialNumber, r.sLoc)}
                  row={r}
                  investigatedAt={null}
                  onInvestigate={onInvestigate}
                />
              ))}
            </>
          )}

          {/* ── Investigated ──────────────────────────────────────── */}
          {doneItems.length > 0 && (
            <>
              <SectionHead count={doneItems.length} type="investigated" />
              {doneItems.map(r => {
                const rec = investigated[iid(r.materialNumber, r.sLoc)]
                return (
                  <NCard
                    key={iid(r.materialNumber, r.sLoc)}
                    row={r}
                    investigatedAt={rec?.ts ?? null}
                    onInvestigate={onInvestigate}
                  />
                )
              })}
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ─── section heading ──────────────────────────────────────────────────────────
function SectionHead({ count, type }) {
  const isInvestigated = type === 'investigated'
  return (
    <div style={{
      padding: '6px 16px',
      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
      letterSpacing: '0.09em', textTransform: 'uppercase',
      color: isInvestigated ? 'var(--green)' : 'var(--tx-faint)',
      background: 'var(--bg-inset)',
      borderBottom: '1px solid var(--border)',
    }}>
      {isInvestigated ? `✓ Investigated (${count})` : `Unaddressed (${count})`}
    </div>
  )
}

// ─── notification card ────────────────────────────────────────────────────────
function NCard({ row, investigatedAt, onInvestigate }) {
  const up        = row.delta >= 0
  const isDone    = !!investigatedAt
  const arrow     = up ? '▲' : '▼'
  const direction = up ? 'Up' : 'Down'
  const pct       = fmtPct(row.pctChange)

  return (
    <div style={{
      padding: '12px 14px 10px',
      borderBottom: '1px solid var(--border)',
      borderLeft: `3px solid ${isDone ? 'var(--green)' : (up ? 'var(--green)' : 'var(--red)')}`,
      background: isDone ? '#dafbe112' : 'transparent',
      opacity: isDone ? 0.75 : 1,
    }}>

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, color: 'var(--tx-hi)' }}>
          {row.materialNumber}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tx-lo)' }}>
          · SLoc {row.sLoc}
        </span>
        {row.abcClass && <AbcPip cls={row.abcClass} />}
        {isDone && (
          <span style={{
            marginLeft: 'auto', flexShrink: 0,
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
            color: 'var(--green)',
          }}>
            Investigated ✓ {fmtTime(investigatedAt)}
          </span>
        )}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 11, color: 'var(--tx-body)', marginBottom: 6,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {row.materialDesc}
      </div>

      {/* Change summary */}
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
        color: up ? 'var(--green)' : 'var(--red)',
        marginBottom: row.valueImpact || row.trendDirection ? 4 : 8,
      }}>
        {arrow} {direction} {pct} since yesterday
      </div>

      {/* Value impact */}
      {row.valueImpact != null && row.valueImpact > 0 && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tx-lo)',
          marginBottom: row.trendDirection && row.trendDirection !== 'FLAT' ? 2 : 8,
        }}>
          Value impact: £{row.valueImpact.toFixed(2)}
        </div>
      )}

      {/* Multi-day trend */}
      {row.trendDirection && row.trendDirection !== 'FLAT' && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: row.trendDirection === 'UP' ? 'var(--green)' : 'var(--red)',
          marginBottom: 8,
        }}>
          {row.trendDirection === 'UP' ? '▲' : '▼'} Trending {row.trendDirection.toLowerCase()} for {row.trendDays} days
        </div>
      )}

      {/* Action button */}
      {isDone ? (
        <button
          onClick={() => onInvestigate(row.materialNumber, row.sLoc)}
          style={GHOST_BTN}
        >
          Undo investigation
        </button>
      ) : (
        <button
          onClick={() => onInvestigate(row.materialNumber, row.sLoc)}
          style={DISMISS_BTN}
        >
          Dismiss — Investigated ✓
        </button>
      )}
    </div>
  )
}

// ─── ABC pip ─────────────────────────────────────────────────────────────────
function AbcPip({ cls }) {
  const T = {
    A: { color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)' },
    B: { color: 'var(--blue)',  bg: 'var(--blue-bg)',  border: 'var(--blue-border)'  },
    C: { color: 'var(--grey)',  bg: 'var(--grey-bg)',  border: 'var(--grey-border)'  },
  }
  const d = T[cls]
  if (!d) return null
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
      color: d.color, background: d.bg, border: `1px solid ${d.border}`,
      padding: '1px 4px', borderRadius: 3, flexShrink: 0,
    }}>
      {cls}
    </span>
  )
}

// ─── button styles ────────────────────────────────────────────────────────────
const DISMISS_BTN = {
  background: 'var(--green-bg)',
  border: '1px solid var(--green-border)',
  color: 'var(--green)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10, fontWeight: 600,
  padding: '4px 12px', borderRadius: 4,
  cursor: 'pointer',
}

const GHOST_BTN = {
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--tx-lo)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  padding: '4px 12px', borderRadius: 4,
  cursor: 'pointer',
}
