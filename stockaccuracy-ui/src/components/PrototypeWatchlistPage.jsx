import { useState, useEffect, useCallback, useRef } from 'react'

const API_URL = '/api/watchlist/prototype'
const REFRESH_MS = 60 * 60 * 1000   // auto-refresh every 60 minutes

const fmtNum = (n) => {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
}

const fmtTime = (d) =>
  d ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null

// The API serialises with camelCase (ABCClass -> aBCClass, SDDocument -> sDDocument),
// so accept those variants as well as the PascalCase originals.
function normRow(r) {
  return {
    sLoc:           r.sLoc           ?? r.SLoc           ?? '',
    materialNumber: r.materialNumber ?? r.MaterialNumber ?? '',
    materialDesc:   r.materialDesc   ?? r.MaterialDesc   ?? '',
    quantity:       r.quantity       ?? r.Quantity       ?? null,
    sdDocument:     r.sdDocument      ?? r.sDDocument     ?? r.SDDocument ?? '',
    abcClass:       r.abcClass        ?? r.aBCClass       ?? r.ABCClass  ?? r.AbcClass ?? null,
  }
}

const COLS = [
  { key: 'sLoc',           label: 'SLoc',        align: 'left',   width: 70  },
  { key: 'materialNumber', label: 'Material',    align: 'left',   width: 120 },
  { key: 'materialDesc',   label: 'Description', align: 'left',   width: 'auto' },
  { key: 'quantity',       label: 'Qty',         align: 'right',  width: 100 },
  { key: 'sdDocument',     label: 'SD Document', align: 'left',   width: 130 },
  { key: 'abcClass',       label: 'ABC Class',   align: 'center', width: 90  },
]

export default function PrototypeWatchlistPage() {
  const [rows,        setRows]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(API_URL)
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        let detail = ''
        try { detail = JSON.parse(body)?.error ?? body } catch { detail = body }
        throw new Error(`HTTP ${res.status} — ${detail || res.statusText}`)
      }
      const data = await res.json()
      setRows(data.map(normRow))
      setLastUpdated(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load + auto-refresh every 60 minutes
  useEffect(() => {
    fetchData()
    timerRef.current = setInterval(fetchData, REFRESH_MS)
    return () => clearInterval(timerRef.current)
  }, [fetchData])

  return (
    <main style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--tx-hi)' }}>
            Prototype Parts Watchlist
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tx-lo)', marginTop: 2 }}>
            {lastUpdated
              ? `Last updated ${fmtTime(lastUpdated)} · auto-refreshes hourly`
              : 'Loading…'}
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            padding: '4px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.02em',
            borderRadius: 4,
            background: loading ? 'var(--bg-inset)' : 'var(--blue)',
            border: 'none',
            color: loading ? 'var(--tx-lo)' : '#fff',
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? '…' : '↺ Refresh'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'var(--red-bg)',
          border: '1px solid var(--red-border)',
          borderLeft: '3px solid var(--red)',
          color: 'var(--red)',
          padding: '10px 20px',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
        }}>
          ✕ {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', overflow: 'auto' }}>
        <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            {COLS.map(c => (
              <col key={c.key} style={{ width: c.width === 'auto' ? undefined : c.width }} />
            ))}
          </colgroup>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-inset)' }}>
              {COLS.map(c => (
                <th key={c.key} style={{
                  padding: '8px 10px', textAlign: c.align,
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                  color: 'var(--tx-lo)', letterSpacing: '0.08em', textTransform: 'uppercase',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr><td colSpan={COLS.length} style={EMPTY_CELL}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={COLS.length} style={EMPTY_CELL}>No prototype parts for the latest snapshot.</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-lo)', whiteSpace: 'nowrap' }}>
                    {r.sLoc}
                  </td>
                  <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--tx-hi)', whiteSpace: 'nowrap' }}>
                    {r.materialNumber}
                  </td>
                  <td title={r.materialDesc} style={{ padding: '7px 10px', fontSize: 12, color: 'var(--tx-body)', maxWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.materialDesc}
                  </td>
                  <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'right', color: 'var(--tx-hi)' }}>
                    {fmtNum(r.quantity)}
                  </td>
                  <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--tx-body)', whiteSpace: 'nowrap' }}>
                    {r.sdDocument}
                  </td>
                  <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'center', color: r.abcClass ? 'var(--tx-hi)' : 'var(--tx-faint)' }}>
                    {r.abcClass ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {rows.length > 0 && (
          <div style={{
            padding: '6px 10px', borderTop: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tx-faint)',
            background: 'var(--bg-inset)',
          }}>
            {rows.length} line{rows.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </main>
  )
}

const EMPTY_CELL = {
  padding: 28, textAlign: 'center',
  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-lo)',
}
