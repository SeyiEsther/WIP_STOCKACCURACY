import { useState, useEffect, useMemo, useCallback } from 'react'
import Header               from './components/Header.jsx'
import StatCards            from './components/StatCards.jsx'
import TrendChart           from './components/TrendChart.jsx'
import DailyComparisonChart from './components/DailyComparisonChart.jsx'
import FilterBar            from './components/FilterBar.jsx'
import StockTable           from './components/StockTable.jsx'
import NotificationPanel    from './components/NotificationPanel.jsx'

const API_BASE = '/api/stock'

// ─── normalise API field names (PascalCase or camelCase) ────────────────────
function norm(r) {
  return {
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
    unitValue:      r.unitValue      ?? r.UnitValue ?? null,
  }
}

function normTrend(t) {
  return {
    materialNumber: t.materialNumber ?? t.MaterialNumber,
    sLoc:           t.sLoc           ?? t.SLoc,
    trendDirection: t.trendDirection ?? t.TrendDirection ?? 'FLAT',
    dataPoints:     t.dataPoints     ?? t.DataPoints     ?? 0,
  }
}

// ─── data hook ──────────────────────────────────────────────────────────────
function useStockData(trendDays) {
  const [rows,           setRows]           = useState([])
  const [summary,        setSummary]        = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [lastUpdated,    setLastUpdated]    = useState(null)
  const [trend,          setTrend]          = useState([])
  const [materialTrends, setMaterialTrends] = useState([])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [compRes, sumRes, trendRes, mtRes] = await Promise.all([
        fetch(`${API_BASE}/comparison`),
        fetch(`${API_BASE}/summary`),
        fetch(`${API_BASE}/trend`),
        fetch(`${API_BASE}/material-trends?days=${trendDays}`),
      ])
      if (!compRes.ok || !sumRes.ok) {
        const bad  = !compRes.ok ? compRes : sumRes
        const body = await bad.text().catch(() => '')
        let detail = ''
        try { detail = JSON.parse(body)?.error ?? body } catch { detail = body }
        throw new Error(`HTTP ${bad.status} — ${detail || bad.statusText}`)
      }
      const [comp, sum] = await Promise.all([compRes.json(), sumRes.json()])
      if (trendRes.ok) setTrend(await trendRes.json())
      if (mtRes.ok)    setMaterialTrends((await mtRes.json()).map(normTrend))
      setRows(comp)
      setSummary(sum)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [trendDays])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { rows, summary, trend, materialTrends, loading, error, lastUpdated, refresh: fetchAll }
}

// ─── investigation store (localStorage) ─────────────────────────────────────
const IID_KEY = 'sa_investigated'
const iid     = (mat, sloc) => `${mat}__${sloc}`

function loadInvestigated() {
  try { return JSON.parse(localStorage.getItem(IID_KEY) || '{}') } catch { return {} }
}
function saveInvestigated(obj) {
  try { localStorage.setItem(IID_KEY, JSON.stringify(obj)) } catch {}
}

// ─── ABC classification (client-side) ───────────────────────────────────────
// Sort by total stock value (unitValue × |qtyToday|) desc.
// Top 10% of items by count = A, next 20% = B, remaining = C.
function computeABC(rows) {
  const hasValue = rows.some(r => r.unitValue != null)
  if (!hasValue) return null

  const sorted = [...rows].sort((a, b) => {
    const va = (a.unitValue ?? 0) * Math.abs(a.qtyToday ?? 0)
    const vb = (b.unitValue ?? 0) * Math.abs(b.qtyToday ?? 0)
    return vb - va
  })

  const n    = sorted.length
  const aEnd = Math.max(1, Math.ceil(n * 0.10))
  const bEnd = Math.max(2, Math.ceil(n * 0.30))

  const map = new Map()
  sorted.forEach((r, i) => {
    map.set(iid(r.materialNumber, r.sLoc), i < aEnd ? 'A' : i < bEnd ? 'B' : 'C')
  })
  return map
}

// ────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [trendDays, setTrendDays] = useState(5)

  const {
    rows, summary, trend, materialTrends,
    loading, error, lastUpdated, refresh,
  } = useStockData(trendDays)

  // ── filter / sort state ──────────────────────────────────────────────────
  const [activeCard,  setActiveCard]  = useState('ALL')
  const [filterChip,  setFilterChip]  = useState('ALL')
  const [search,      setSearch]      = useState('')
  const [sloc,        setSloc]        = useState('ALL')
  const [threshold,   setThreshold]   = useState(10)
  const [sortKey,     setSortKey]     = useState('absPct')
  const [sortDir,     setSortDir]     = useState('desc')
  const [abcFilter,   setAbcFilter]   = useState('ALL')
  const [trendOnly,   setTrendOnly]   = useState(false)
  const [hideAcked,   setHideAcked]   = useState(false)

  // ── investigation state ───────────────────────────────────────────────────
  const [investigated, setInvestigated] = useState(loadInvestigated)

  const handleInvestigate = useCallback((mat, sloc) => {
    setInvestigated(prev => {
      const k    = iid(mat, sloc)
      const next = { ...prev }
      if (next[k]) { delete next[k] } else { next[k] = { ts: new Date().toISOString() } }
      saveInvestigated(next)
      return next
    })
  }, [])

  // ── notification panel ────────────────────────────────────────────────────
  const [notifOpen, setNotifOpen] = useState(false)

  // ── sync card → chip ──────────────────────────────────────────────────────
  const handleCardClick = (cat) => {
    setActiveCard(cat)
    setFilterChip(cat)
  }

  // ── derived sloc list ─────────────────────────────────────────────────────
  const slocs = useMemo(() => {
    const s = new Set(rows.map(r => r.sLoc ?? r.SLoc ?? r.sloc))
    return ['ALL', ...Array.from(s).sort()]
  }, [rows])

  // ── normalise rows ────────────────────────────────────────────────────────
  const normalised = useMemo(() => rows.map(norm), [rows])

  // ── merge material trends ─────────────────────────────────────────────────
  const withTrends = useMemo(() => {
    const tmap = new Map(materialTrends.map(t => [iid(t.materialNumber, t.sLoc), t]))
    return normalised.map(r => {
      const t = tmap.get(iid(r.materialNumber, r.sLoc))
      return { ...r, trendDirection: t?.trendDirection ?? null, trendDays: t?.dataPoints ?? 0 }
    })
  }, [normalised, materialTrends])

  // ── ABC classification ────────────────────────────────────────────────────
  const abcMap = useMemo(() => computeABC(withTrends), [withTrends])

  const withABC = useMemo(() =>
    withTrends.map(r => ({
      ...r,
      abcClass:    abcMap ? (abcMap.get(iid(r.materialNumber, r.sLoc)) ?? null) : null,
      valueImpact: r.unitValue != null ? Math.abs(r.delta ?? 0) * r.unitValue : null,
    }))
  , [withTrends, abcMap])

  // ── unread bell count (flagged & not yet investigated) ────────────────────
  const unreadCount = useMemo(() =>
    withABC.filter(r =>
      Math.abs(r.pctChange) > threshold &&
      r.status !== 'MISSING' &&
      r.status !== 'NEW' &&
      !investigated[iid(r.materialNumber, r.sLoc)]
    ).length
  , [withABC, threshold, investigated])

  // ── filtered rows ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let d = withABC

    if (sloc !== 'ALL') d = d.filter(r => r.sLoc === sloc)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      d = d.filter(r =>
        r.materialNumber.toLowerCase().includes(q) ||
        r.materialDesc.toLowerCase().includes(q))
    }

    const cat = activeCard !== 'ALL' ? activeCard : filterChip
    switch (cat) {
      case 'FLAGGED':  d = d.filter(r => Math.abs(r.pctChange) > threshold); break
      case 'UP':       d = d.filter(r => r.delta > 0);                        break
      case 'DOWN':     d = d.filter(r => r.delta < 0);                        break
      case 'NEW':      d = d.filter(r => r.status === 'NEW');                 break
      case 'MISSING':  d = d.filter(r => r.status === 'MISSING');             break
      default: break
    }

    if (abcFilter !== 'ALL') d = d.filter(r => r.abcClass === abcFilter)
    if (trendOnly)           d = d.filter(r => r.trendDirection === 'UP' || r.trendDirection === 'DOWN')
    if (hideAcked)           d = d.filter(r => !investigated[iid(r.materialNumber, r.sLoc)])

    return d
  }, [withABC, sloc, search, activeCard, filterChip, threshold, abcFilter, trendOnly, hideAcked, investigated])

  // ── sorted rows ───────────────────────────────────────────────────────────
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
        case 'valueImpact':    return dir * ((a.valueImpact ?? 0) - (b.valueImpact ?? 0))
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
    if (sloc !== 'ALL')       params.set('sloc', sloc)
    if (search.trim())        params.set('search', search.trim())
    params.set('threshold', threshold)
    window.location.href = `${API_BASE}/export?${params}`
  }

  // ── live summary (threshold-adjusted flagged count) ───────────────────────
  const liveSummary = useMemo(() => {
    if (!summary) return null
    return {
      ...summary,
      totalFlagged: withABC.filter(r => Math.abs(r.pctChange) > threshold).length,
    }
  }, [summary, withABC, threshold])

  const investigatedCount = Object.keys(investigated).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <Header
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        onExport={handleExport}
        loading={loading}
        error={error}
        unreadCount={unreadCount}
        onBellClick={() => setNotifOpen(o => !o)}
      />

      <main style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && (
          <div style={{
            background: 'var(--red-bg)',
            border: '1px solid var(--red-border)',
            borderLeft: '3px solid var(--red)',
            color: 'var(--red)',
            padding: '10px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}>
            ✕ {error}
          </div>
        )}

        <StatCards summary={liveSummary} activeCard={activeCard} onCardClick={handleCardClick} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <TrendChart data={trend} />
          <DailyComparisonChart data={withABC} threshold={threshold} />
        </div>

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
          abcFilter={abcFilter}
          onAbcFilterChange={setAbcFilter}
          trendOnly={trendOnly}
          onTrendOnlyChange={setTrendOnly}
          trendDays={trendDays}
          onTrendDaysChange={setTrendDays}
          hideAcked={hideAcked}
          onHideAckedChange={setHideAcked}
          ackedCount={investigatedCount}
          hasAbc={!!abcMap}
        />

        <StockTable
          rows={sorted}
          loading={loading}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          threshold={threshold}
          investigated={investigated}
          onAck={handleInvestigate}
          hasAbc={!!abcMap}
        />
      </main>

      {/* Notification panel */}
      {notifOpen && (
        <NotificationPanel
          items={withABC}
          threshold={threshold}
          investigated={investigated}
          onInvestigate={handleInvestigate}
          onClose={() => setNotifOpen(false)}
        />
      )}
    </div>
  )
}
