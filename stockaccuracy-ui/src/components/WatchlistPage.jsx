import { useState, useEffect, useCallback, useRef } from 'react'

const API_URL = '/api/watchlist/production'
const REFRESH_MS = 60 * 60 * 1000   // auto-refresh every 60 minutes

const fmtNum = (n) => {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
}

const fmtTime = (d) =>
  d ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null

function normRow(r) {
  return {
    material:      r.material      ?? r.Material,
    description:   r.description   ?? r.Description,
    inStockNow:    r.inStockNow    ?? r.InStockNow    ?? null,
    madeIn24Hours: r.madeIn24Hours ?? r.MadeIn24Hours ?? 0,
  }
}

const COLS = [
  { key: 'material',      label: 'Material Number',        align: 'left',  width: 130 },
  { key: 'description',   label: 'Description',            align: 'left',  width: 'auto' },
  { key: 'inStockNow',    label: 'In Stock Now',           align: 'right', width: 150 },
  { key: 'madeIn24Hours', label: 'Made in Last 24 Hours',  align: 'right', width: 190 },
]

export default function WatchlistPage() {
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
            Watchlist
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
        <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
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
              <tr><td colSpan={COLS.length} style={EMPTY_CELL}>No materials on the watchlist.</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.material ?? i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--tx-hi)', whiteSpace: 'nowrap' }}>
                    {r.material}
                  </td>
                  <td title={r.description} style={{ padding: '7px 10px', fontSize: 12, color: 'var(--tx-body)', maxWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.description}
                  </td>
                  <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'right', color: 'var(--tx-hi)' }}>
                    {fmtNum(r.inStockNow)}
                  </td>
                  <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'right', color: r.madeIn24Hours > 0 ? 'var(--green)' : 'var(--tx-lo)' }}>
                    {fmtNum(r.madeIn24Hours)}
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
            {rows.length} material{rows.length !== 1 ? 's' : ''}
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
