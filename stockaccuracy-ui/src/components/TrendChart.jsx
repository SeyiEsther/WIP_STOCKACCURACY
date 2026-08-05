// ─── TrendChart.jsx — the 7-day trend chart ──────────────────────────────────
// Two modes:
//   • Aggregate (default, no materials picked): tracked vs flagged materials per
//     day, from the `data` prop (fetched up in App.jsx, no fetching here).
//   • Material compare: pick one or more material numbers and each one's total
//     quantity per day is fetched from /api/stock/material-history and drawn as
//     its own line, so you can compare them. Clear all to return to aggregate.

import { useMemo, useState, useEffect } from 'react'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const API_HISTORY = '/api/stock/material-history'
const MAX_MATERIALS = 8
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SERIES_COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

const AXIS_LBL_STYLE = {
  fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono',
  fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
}

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${DAYS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
}

const fmtQty = (n) => Number(n ?? 0).toLocaleString('en-GB', { maximumFractionDigits: 3 })

// Aggregate tooltip ("N materials")
const AggTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={TIP_STYLE}>
      <div style={{ color: 'var(--tx-lo)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value} materials</strong>
        </div>
      ))}
    </div>
  )
}

// Multi-material tooltip (quantity per selected material)
const QtyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={TIP_STYLE}>
      <div style={{ color: 'var(--tx-lo)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{fmtQty(p.value)}</strong>
        </div>
      ))}
    </div>
  )
}

export default function TrendChart({ data, materials = [] }) {
  const [input,    setInput]    = useState('')
  const [selected, setSelected] = useState([])   // [] = aggregate mode
  const [chartData, setChartData] = useState([]) // merged per-day rows in material mode
  const [loadingM, setLoadingM] = useState(false)
  const [errM,     setErrM]     = useState(null)

  // ── aggregate series (from prop) ──────────────────────────────────────────
  const aggData = useMemo(() =>
    (data || []).map(d => ({
      date:         fmtDate(d.snapshotDate ?? d.SnapshotDate),
      totalTracked: d.totalTracked ?? d.TotalTracked ?? 0,
      flagged:      d.flagged      ?? d.Flagged      ?? 0,
    }))
  , [data])

  // ── unique material list for the picker ───────────────────────────────────
  const matOptions = useMemo(() => {
    const seen = new Set()
    const out = []
    for (const m of materials) {
      const mn = m.materialNumber ?? m.MaterialNumber
      if (!mn || seen.has(mn)) continue
      seen.add(mn)
      out.push({ mn, desc: m.materialDesc ?? m.MaterialDesc ?? '' })
    }
    return out
  }, [materials])

  // ── fetch each selected material's history and merge by date ──────────────
  useEffect(() => {
    if (selected.length === 0) { setChartData([]); setErrM(null); setLoadingM(false); return }
    let cancelled = false
    setLoadingM(true)
    setErrM(null)

    Promise.all(selected.map(async (mat) => {
      const res = await fetch(`${API_HISTORY}?material=${encodeURIComponent(mat)}&days=7`)
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        let detail = ''
        try { detail = JSON.parse(body)?.error ?? body } catch { detail = body }
        throw new Error(`${mat}: HTTP ${res.status} — ${detail || res.statusText}`)
      }
      const rows = await res.json()
      return { mat, rows: rows.map(d => ({ iso: d.snapshotDate ?? d.SnapshotDate, quantity: Number(d.quantity ?? d.Quantity ?? 0) })) }
    }))
      .then(results => {
        if (cancelled) return
        const byIso = new Map()
        for (const { mat, rows } of results) {
          for (const r of rows) {
            const key = String(r.iso)
            if (!byIso.has(key)) byIso.set(key, { iso: r.iso, date: fmtDate(r.iso) })
            byIso.get(key)[mat] = r.quantity
          }
        }
        setChartData([...byIso.values()].sort((a, b) => new Date(a.iso) - new Date(b.iso)))
      })
      .catch(e => { if (!cancelled) { setErrM(e.message); setChartData([]) } })
      .finally(() => { if (!cancelled) setLoadingM(false) })

    return () => { cancelled = true }
  }, [selected])

  const addMaterial = () => {
    const v = input.trim()
    if (!v) return
    setSelected(prev =>
      prev.includes(v) || prev.length >= MAX_MATERIALS ? prev : [...prev, v]
    )
    setInput('')
  }
  const removeMaterial = (mat) => setSelected(prev => prev.filter(m => m !== mat))
  const clearAll = () => { setInput(''); setSelected([]) }

  const inMaterialMode = selected.length > 0
  const atMax = selected.length >= MAX_MATERIALS

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '16px 20px' }}>
      {/* Header + material picker */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
        <ChartLabel style={{ marginBottom: 0, paddingTop: 4 }}>
          {inMaterialMode ? '7-Day Trend — Material Quantity' : '7-Day Trend — Tracked vs Flagged'}
        </ChartLabel>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              list="trend-material-list"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addMaterial() }}
              placeholder={atMax ? `Max ${MAX_MATERIALS}` : 'Add material #…'}
              disabled={atMax}
              style={{
                width: 130, padding: '3px 8px', borderRadius: 4,
                border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11,
                opacity: atMax ? 0.6 : 1,
              }}
            />
            <datalist id="trend-material-list">
              {matOptions.map(o => <option key={o.mn} value={o.mn}>{o.desc}</option>)}
            </datalist>
            <button onClick={addMaterial} disabled={!input.trim() || atMax} style={btnStyle(!input.trim() || atMax)}>Add</button>
            {inMaterialMode && <button onClick={clearAll} style={btnStyle(false, true)}>Clear</button>}
          </div>
          {inMaterialMode && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 360 }}>
              {selected.map((mat, i) => (
                <span key={mat} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                  color: SERIES_COLORS[i % SERIES_COLORS.length],
                  background: 'var(--bg-inset)', border: `1px solid ${SERIES_COLORS[i % SERIES_COLORS.length]}`,
                  borderRadius: 12, padding: '1px 6px',
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
                  {mat}
                  <button
                    onClick={() => removeMaterial(mat)}
                    title="Remove"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 12, lineHeight: 1, padding: 0 }}
                  >×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {inMaterialMode ? (
        errM ? (
          <Empty>Couldn’t load material history — {errM}</Empty>
        ) : loadingM && chartData.length === 0 ? (
          <Empty>Loading…</Empty>
        ) : chartData.length === 0 ? (
          <Empty>No snapshot history for the selected material(s)</Empty>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 10, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
                tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tick={{ fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
                tickLine={false} axisLine={false} width={48}
                label={{ value: 'Quantity', angle: -90, position: 'insideLeft', offset: 6, style: AXIS_LBL_STYLE }} />
              <Tooltip content={<QtyTooltip />} />
              <Legend wrapperStyle={{ fontFamily: 'IBM Plex Mono', fontSize: 10, paddingTop: 8 }} />
              {selected.map((mat, i) => (
                <Line key={mat} type="monotone" dataKey={mat} name={mat}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]} strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 4 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )
      ) : aggData.length === 0 ? (
        <Empty>No historical data yet — trend builds as daily snapshots accumulate</Empty>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={aggData} margin={{ top: 4, right: 16, left: 10, bottom: 4 }}>
            <defs>
              <linearGradient id="gradTracked" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0969da" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#0969da" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="gradFlagged" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#cf222e" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#cf222e" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
              tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
            <YAxis tick={{ fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
              tickLine={false} axisLine={false} width={40} allowDecimals={false}
              label={{ value: 'Materials', angle: -90, position: 'insideLeft', offset: 6, style: AXIS_LBL_STYLE }} />
            <Tooltip content={<AggTooltip />} />
            <Legend wrapperStyle={{ fontFamily: 'IBM Plex Mono', fontSize: 10, paddingTop: 8 }} />
            <Area type="monotone" dataKey="totalTracked" name="Total Tracked" stroke="#0969da" strokeWidth={2}
              fill="url(#gradTracked)" dot={{ r: 3, fill: '#0969da', strokeWidth: 0 }} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="flagged" name="Flagged" stroke="#cf222e" strokeWidth={2}
              fill="url(#gradFlagged)" dot={{ r: 3, fill: '#cf222e', strokeWidth: 0 }} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

const TIP_STYLE = {
  background: 'var(--bg-surface)', border: '1px solid var(--border)',
  padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
}

function btnStyle(disabled, ghost = false) {
  return {
    padding: '3px 10px', borderRadius: 4,
    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
    background: ghost ? 'transparent' : (disabled ? 'var(--bg-inset)' : 'var(--blue)'),
    border: ghost ? '1px solid var(--border)' : 'none',
    color: ghost ? 'var(--tx-lo)' : (disabled ? 'var(--tx-lo)' : '#fff'),
    opacity: disabled ? 0.7 : 1,
    cursor: disabled ? 'default' : 'pointer',
  }
}

function ChartLabel({ children, style }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
      color: 'var(--tx-lo)', letterSpacing: '0.08em', textTransform: 'uppercase',
      marginBottom: 14, ...style,
    }}>
      {children}
    </div>
  )
}

function Empty({ children }) {
  return (
    <div style={{
      height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-lo)', textAlign: 'center', padding: '0 20px',
    }}>
      {children}
    </div>
  )
}
