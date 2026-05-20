import { useState, useEffect, useMemo, useCallback } from 'react'
import Header from './components/Header.jsx'
import StatCards from './components/StatCards.jsx'
import TopMoversChart from './components/TopMoversChart.jsx'
import FilterBar from './components/FilterBar.jsx'
import StockTable from './components/StockTable.jsx'

const API_BASE = '/api/stock'

function useStockData() {
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [compRes, sumRes] = await Promise.all([
        fetch(`${API_BASE}/comparison`),
        fetch(`${API_BASE}/summary`),
      ])
      if (!compRes.ok || !sumRes.ok) throw new Error('API error')
      const [comp, sum] = await Promise.all([compRes.json(), sumRes.json()])
      setRows(comp)
      setSummary(sum)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { rows, summary, loading, error, lastUpdated, refresh: fetchAll }
}

export default function App() {
  const { rows, summary, loading, error, lastUpdated, refresh } = useStockData()

  const [activeCard, setActiveCard] = useState('ALL')
  const [filterChip, setFilterChip] = useState('ALL')
  const [search, setSearch]         = useState('')
  const [sloc, setSloc]             = useState('ALL')
  const [threshold, setThreshold]   = useState(10)
  const [sortKey, setSortKey]       = useState('absPct')
  const [sortDir, setSortDir]       = useState('desc')

  // sync card filter → chip filter
  const handleCardClick = (cat) => {
    setActiveCard(cat)
    setFilterChip(cat)
  }

  const slocs = useMemo(() => {
    const s = new Set(rows.map(r => r.sLoc ?? r.SLoc ?? r.sloc))
    return ['ALL', ...Array.from(s).sort()]
  }, [rows])

  // normalise keys (API may return camelCase or PascalCase)
  const norm = (r) => ({
    materialNumber: r.materialNumber ?? r.MaterialNumber,
    materialDesc:   r.materialDesc   ?? r.MaterialDesc,
    sLoc:           r.sLoc           ?? r.SLoc,
    qtyYesterday:   r.qtyYesterday   ?? r.QtyYesterday,
    qtyToday:       r.qtyToday       ?? r.QtyToday,
    delta:          r.delta          ?? r.Delta,
    pctChange:      r.pctChange      ?? r.PctChange,
    status:         r.status         ?? r.Status,
    baseUnit:       r.baseUnit       ?? r.BaseUnit,
    mrpController:  r.mrpController  ?? r.MRPController,
    todayDate:      r.todayDate      ?? r.TodayDate,
    yesterdayDate:  r.yesterdayDate  ?? r.YesterdayDate,
  })

  const normalised = useMemo(() => rows.map(norm), [rows])

  const filtered = useMemo(() => {
    let d = normalised

    if (sloc !== 'ALL') d = d.filter(r => r.sLoc === sloc)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      d = d.filter(r =>
        r.materialNumber.toLowerCase().includes(q) ||
        r.materialDesc.toLowerCase().includes(q))
    }

    // card / chip filter (card takes precedence when both set)
    const cat = activeCard !== 'ALL' ? activeCard : filterChip
    switch (cat) {
      case 'FLAGGED':  d = d.filter(r => Math.abs(r.pctChange) > threshold); break
      case 'UP':       d = d.filter(r => r.delta > 0); break
      case 'DOWN':     d = d.filter(r => r.delta < 0); break
      case 'NEW':      d = d.filter(r => r.status === 'NEW'); break
      case 'MISSING':  d = d.filter(r => r.status === 'MISSING'); break
      default: break
    }

    return d
  }, [normalised, sloc, search, activeCard, filterChip, threshold])

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'materialNumber': return dir * a.materialNumber.localeCompare(b.materialNumber)
        case 'materialDesc':   return dir * a.materialDesc.localeCompare(b.materialDesc)
        case 'sLoc':           return dir * a.sLoc.localeCompare(b.sLoc)
        case 'qtyYesterday':   return dir * (a.qtyYesterday - b.qtyYesterday)
        case 'qtyToday':       return dir * (a.qtyToday - b.qtyToday)
        case 'delta':          return dir * (a.delta - b.delta)
        case 'pctChange':      return dir * (a.pctChange - b.pctChange)
        case 'absPct':
        default:               return dir * (Math.abs(a.pctChange) - Math.abs(b.pctChange))
      }
    })
  }, [filtered, sortKey, sortDir])

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (filterChip !== 'ALL') params.set('status', filterChip)
    if (sloc !== 'ALL') params.set('sloc', sloc)
    if (search.trim()) params.set('search', search.trim())
    params.set('threshold', threshold)
    window.location.href = `${API_BASE}/export?${params}`
  }

  // derive live summary numbers honouring threshold for flagged count
  const liveSummary = useMemo(() => {
    if (!summary) return null
    return {
      ...summary,
      totalFlagged: normalised.filter(r => Math.abs(r.pctChange) > threshold).length,
    }
  }, [summary, normalised, threshold])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <Header lastUpdated={lastUpdated} onRefresh={refresh} onExport={handleExport} loading={loading} />

      <main style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ background: '#1a0a0d', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            Error: {error}
          </div>
        )}

        <StatCards summary={liveSummary} activeCard={activeCard} onCardClick={handleCardClick} />

        {!loading && normalised.length > 0 && (
          <TopMoversChart data={normalised} threshold={threshold} />
        )}

        <FilterBar
          filterChip={filterChip}
          onChipChange={(c) => { setFilterChip(c); setActiveCard('ALL') }}
          search={search}
          onSearchChange={setSearch}
          sloc={sloc}
          slocs={slocs}
          onSlocChange={setSloc}
          threshold={threshold}
          onThresholdChange={setThreshold}
        />

        <StockTable
          rows={sorted}
          loading={loading}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          threshold={threshold}
        />
      </main>
    </div>
  )
}
