// ─── App.jsx — the top-level component that ties the whole dashboard together ──
//
// What this file does, in plain English:
//   1. Fetches the stock data from our backend API (see useStockData below).
//   2. Holds all the "what is the user currently looking at" state — which tab,
//      which filters, the search box, the sort order, etc.
//   3. Runs that raw data through filtering/sorting and hands the result to the
//      presentational components (the table, the charts, the header…).
//
// A quick glossary of the domain terms you'll see throughout the code:
//   • Material  – a part/product, identified by a number like "433901".
//   • SLoc      – "Storage Location": a bin/area in the warehouse where stock sits.
//   • Snapshot  – a once-a-day recording of how much of each material is in stock.
//   • Delta     – today's quantity minus yesterday's (how much it moved).
//   • % Change  – that movement as a percentage of yesterday's quantity.
//   • Flagged   – a material whose % change is bigger than the alert threshold,
//                 i.e. it moved more than we'd expect and may be worth checking.
//   • Investigated – a human has looked at a flagged material and ticked it off.
//   • ABC class – a rough importance grade (A = most important … C = least).
//
// React note for newcomers: a "component" is just a function that returns the
// HTML-like markup (JSX) to display. "Hooks" are the useX(...) functions — they
// let a component remember values (useState) and re-run logic when inputs change
// (useMemo / useEffect). When a value a component depends on changes, React
// automatically re-draws that part of the screen.

import { useState, useEffect, useMemo, useCallback } from 'react'
import Header               from './components/Header.jsx'
import StatCards            from './components/StatCards.jsx'
import TrendChart           from './components/TrendChart.jsx'
import DailyComparisonChart from './components/DailyComparisonChart.jsx'
import FilterBar            from './components/FilterBar.jsx'
import StockTable           from './components/StockTable.jsx'
import NotificationPanel    from './components/NotificationPanel.jsx'
import OverviewPage         from './components/OverviewPage.jsx'
import WatchlistPage        from './components/WatchlistPage.jsx'
import { norm, iid }        from './lib/normalize.js'
import { isFlagged }        from './lib/stock.js'

const API_BASE = '/api/stock'

function normTrend(t) {
  return {
    materialNumber: t.materialNumber ?? t.MaterialNumber,
    sLoc:           t.sLoc           ?? t.SLoc,
    trendDirection: t.trendDirection ?? t.TrendDirection ?? 'FLAT',
    dataPoints:     t.dataPoints     ?? t.DataPoints     ?? 0,
  }
}

// Provisional ABC classification: prefer a real class from the API when present,
// otherwise derive a deterministic (stable per material) placeholder so the
// column is populated. Replace with a real value/consumption-based class when a
// source (e.g. unit price × volume) is wired into vw_StockComparison.
function abcClassFor(row) {
  const real = row.abcClass ?? row.AbcClass ?? row.ABCClass
  if (real) return real
  const s = String(row.materialNumber ?? '')
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  const r = (h % 100) / 100
  return r < 0.10 ? 'A' : r < 0.30 ? 'B' : 'C'
}

// ─── data hook ──────────────────────────────────────────────────────────────
// A custom hook (any function whose name starts with "use") that owns everything
// about loading the dashboard data: the rows, loading/error flags, and a refresh
// function. It calls the four API endpoints at once, then stores the results so
// the rest of the app can read them. Keeping this here means App() stays focused
// on layout rather than network plumbing.
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

// ─── investigation store (server-side, shared across users) ──────────────────
function useInvestigations() {
  const [investigated, setInvestigated] = useState({})

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/investigations`)
      if (!res.ok) return
      const data = await res.json()
      const map = {}
      for (const r of data) {
        const mat  = r.materialNumber ?? r.MaterialNumber
        const sloc = r.sLoc           ?? r.SLoc
        const ts   = r.investigatedAt ?? r.InvestigatedAt
        map[iid(mat, sloc)] = { ts }
      }
      setInvestigated(map)
    } catch { /* leave empty on failure */ }
  }, [])

  useEffect(() => { load() }, [load])

  // Optimistic toggle with fire-and-forget server sync.
  const toggle = useCallback((mat, sloc) => {
    const k      = iid(mat, sloc)
    const wasSet = !!investigated[k]

    setInvestigated(prev => {
      const next = { ...prev }
      if (wasSet) delete next[k]
      else        next[k] = { ts: new Date().toISOString() }
      return next
    })

    const url = `${API_BASE}/investigations`
    const sync = wasSet
      ? fetch(`${url}?materialNumber=${encodeURIComponent(mat)}&sloc=${encodeURIComponent(sloc)}`, { method: 'DELETE' })
      : fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ materialNumber: mat, sLoc: sloc }),
        })
    sync.catch(() => { /* revert on failure by reloading server truth */ load() })
  }, [investigated, load])

  return { investigated, toggle }
}

// ─── Nav bar ─────────────────────────────────────────────────────────────────
function NavBar({ page, onPageChange }) {
  const tabs = [
    { key: 'overview',  label: 'Overview' },
    { key: 'monitor',   label: 'Stock Monitor' },
    { key: 'watchlist', label: 'Watchlist' },
  ]
  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 20px',
      display: 'flex',
      gap: 0,
      flexShrink: 0,
    }}>
      {tabs.map(t => {
        const active = page === t.key
        return (
          <button
            key={t.key}
            onClick={() => onPageChange(t.key)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: active ? '2px solid var(--blue)' : '2px solid transparent',
              padding: '8px 18px',
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--blue)' : 'var(--tx-lo)',
              cursor: 'pointer',
              transition: 'color 0.12s, border-color 0.12s',
              marginBottom: -1,
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--tx-body)' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--tx-lo)' }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [trendDays, setTrendDays] = useState(5)
  const [page, setPage] = useState('overview')

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

  // ── investigation state (server-side) ─────────────────────────────────────
  const { investigated, toggle: handleInvestigate } = useInvestigations()

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

  // ── merge material trends + value impact ──────────────────────────────────
  const enriched = useMemo(() => {
    const tmap = new Map(materialTrends.map(t => [iid(t.materialNumber, t.sLoc), t]))
    return normalised.map(r => {
      const t = tmap.get(iid(r.materialNumber, r.sLoc))
      return {
        ...r,
        abcClass:       abcClassFor(r),
        trendDirection: t?.trendDirection ?? null,
        trendDays:      t?.dataPoints ?? 0,
        valueImpact:    r.unitValue != null ? Math.abs(r.delta ?? 0) * r.unitValue : null,
      }
    })
  }, [normalised, materialTrends])

  // ── unread bell count (flagged & not yet investigated) ────────────────────
  const unreadCount = useMemo(() =>
    enriched.filter(r =>
      isFlagged(r, threshold) &&
      r.status !== 'MISSING' &&
      r.status !== 'NEW' &&
      !investigated[iid(r.materialNumber, r.sLoc)]
    ).length
  , [enriched, threshold, investigated])

  // ── filtered rows ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let d = enriched

    if (sloc !== 'ALL') d = d.filter(r => r.sLoc === sloc)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      d = d.filter(r =>
        r.materialNumber.toLowerCase().includes(q) ||
        r.materialDesc.toLowerCase().includes(q))
    }

    const cat = activeCard !== 'ALL' ? activeCard : filterChip
    switch (cat) {
      case 'FLAGGED':  d = d.filter(r => isFlagged(r, threshold)); break
      case 'UP':       d = d.filter(r => r.delta > 0);             break
      case 'DOWN':     d = d.filter(r => r.delta < 0);             break
      case 'NEW':      d = d.filter(r => r.status === 'NEW');      break
      case 'MISSING':  d = d.filter(r => r.status === 'MISSING');  break
      default: break
    }

    if (abcFilter !== 'ALL') d = d.filter(r => r.abcClass === abcFilter)
    if (trendOnly)           d = d.filter(r => r.trendDirection === 'UP' || r.trendDirection === 'DOWN')
    if (hideAcked)           d = d.filter(r => !investigated[iid(r.materialNumber, r.sLoc)])

    return d
  }, [enriched, sloc, search, activeCard, filterChip, threshold, abcFilter, trendOnly, hideAcked, investigated])

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
      totalFlagged: enriched.filter(r => isFlagged(r, threshold)).length,
    }
  }, [summary, enriched, threshold])

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

      <NavBar page={page} onPageChange={setPage} />

      {error && (
        <div style={{
          background: 'var(--red-bg)',
          border: '1px solid var(--red-border)',
          borderLeft: '3px solid var(--red)',
          color: 'var(--red)',
          padding: '10px 20px',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          flexShrink: 0,
        }}>
          ✕ {error}
        </div>
      )}

      {page === 'overview' ? (
        <OverviewPage
          rows={enriched}
          summary={liveSummary}
          trend={trend}
          loading={loading}
          threshold={threshold}
        />
      ) : page === 'watchlist' ? (
        <WatchlistPage />
      ) : (
        <main style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <StatCards summary={liveSummary} activeCard={activeCard} onCardClick={handleCardClick} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <TrendChart data={trend} />
            <DailyComparisonChart data={enriched} threshold={threshold} />
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
            hasAbc={true}
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
            hasAbc={true}
          />
        </main>
      )}

      {/* Notification panel */}
      {notifOpen && (
        <NotificationPanel
          items={enriched}
          threshold={threshold}
          investigated={investigated}
          onInvestigate={handleInvestigate}
          onClose={() => setNotifOpen(false)}
        />
      )}
    </div>
  )
}
