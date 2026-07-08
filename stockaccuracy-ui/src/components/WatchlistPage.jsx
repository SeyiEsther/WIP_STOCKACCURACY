import { useState, useEffect, useCallback, useMemo } from 'react'
import StockTable from './StockTable.jsx'
import { norm } from '../lib/normalize.js'

const API_BASE = '/api/stock'

export default function WatchlistPage({ threshold, investigated, onInvestigate }) {
  const [rows,        setRows]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [sortKey,     setSortKey]     = useState('materialNumber')
  const [sortDir,     setSortDir]     = useState('asc')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/watchlist`)
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        let detail = ''
        try { detail = JSON.parse(body)?.error ?? body } catch { detail = body }
        throw new Error(`HTTP ${res.status} — ${detail || res.statusText}`)
      }
      const data = await res.json()
      setRows(data.map(norm))
      setLastUpdated(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const hasAbc = useMemo(() => rows.some(r => r.abcClass != null), [rows])

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      switch (sortKey) {
        case 'materialNumber': return dir * a.materialNumber.localeCompare(b.materialNumber)
        case 'materialDesc':   return dir * a.materialDesc.localeCompare(b.materialDesc)
        case 'sLoc':           return dir * a.sLoc.localeCompare(b.sLoc)
        case 'qtyYesterday':   return dir * (a.qtyYesterday - b.qtyYesterday)
        case 'qtyToday':       return dir * (a.qtyToday - b.qtyToday)
        case 'delta':          return dir * (a.delta - b.delta)
        case 'pctChange':
        case 'absPct':
        default:                return dir * (a.pctChange - b.pctChange)
      }
    })
  }, [rows, sortKey, sortDir])

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  return (
    <main style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--tx-hi)' }}>
            Watchlist
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tx-lo)', marginTop: 2 }}>
            {lastUpdated
              ? `refreshed ${lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : 'Materials flagged for closer monitoring — add rows to dbo.Watchlist in SQL'}
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
            cursor: 'pointer',
          }}
        >
          {loading ? '…' : '↺ Refresh'}
        </button>
      </div>

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

      {!loading && !error && rows.length === 0 && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          padding: '24px 20px',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--tx-lo)',
          lineHeight: 1.6,
        }}>
          No materials on the watchlist yet. Add material/SLoc pairs to{' '}
          <code style={{ color: 'var(--tx-body)' }}>dbo.Watchlist</code> in the database.
        </div>
      )}

      <StockTable
        rows={sorted}
        loading={loading}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        threshold={threshold}
        investigated={investigated}
        onAck={onInvestigate}
        hasAbc={hasAbc}
        showImpact={false}
        showTrend={false}
        showAck={true}
      />
    </main>
  )
}
