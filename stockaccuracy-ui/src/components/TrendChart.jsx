// ─── TrendChart.jsx — the 7-day trend area chart ─────────────────────────────
// Two modes:
//   • Aggregate (default): tracked vs flagged materials per day, from the `data`
//     prop (fetched up in App.jsx, no fetching here).
//   • Single material: pick a material number and it fetches that material's
//     total quantity per day from /api/stock/material-history and plots it.
// Switch between them with the material picker in the header.

import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const API_HISTORY = '/api/stock/material-history'
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

// Single-material tooltip ("qty")
const QtyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={TIP_STYLE}>
      <div style={{ color: 'var(--tx-lo)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ color: '#1a7f37' }}>Quantity: <strong>{fmtQty(payload[0].value)}</strong></div>
    </div>
  )
}

export default function TrendChart({ data, materials = [] }) {
  const [input,    setInput]    = useState('')
  const [selected, setSelected] = useState('')     // '' = aggregate mode
  const [series,   setSeries]   = useState([])
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

  // ── fetch a single material's history ─────────────────────────────────────
  const loadMaterial = useCallback(async (mat) => {
    if (!mat) { setSeries([]); setErrM(null); return }
    setLoadingM(true)
    setErrM(null)
    try {
      const res = await fetch(`${API_HISTORY}?material=${encodeURIComponent(mat)}&days=7`)
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        let detail = ''
        try { detail = JSON.parse(body)?.error ?? body } catch { detail = body }
        throw new Error(`HTTP ${res.status} — ${detail || res.statusText}`)
      }
      const rows = await res.json()
      setSeries(rows.map(d => ({
        date:     fmtDate(d.snapshotDate ?? d.SnapshotDate),
        quantity: Number(d.quantity ?? d.Quantity ?? 0),
      })))
    } catch (e) {
      setErrM(e.message)
      setSeries([])
    } finally {
      setLoadingM(false)
    }
  }, [])

  useEffect(() => { loadMaterial(selected) }, [selected, loadMaterial])

  const applyInput = () => setSelected(input.trim())
  const clear = () => { setInput(''); setSelected('') }

  const inMaterialMode = !!selected

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '16px 20px' }}>
      {/* Header + material picker */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
        <ChartLabel style={{ marginBottom: 0 }}>
          {inMaterialMode ? `7-Day Trend — ${selected} Quantity` : '7-Day Trend — Tracked vs Flagged'}
        </ChartLabel>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            list="trend-material-list"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyInput() }}
            placeholder="Material #…"
            style={{
              width: 130, padding: '3px 8px', borderRadius: 4,
              border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11,
            }}
          />
          <datalist id="trend-material-list">
            {matOptions.map(o => <option key={o.mn} value={o.mn}>{o.desc}</option>)}
          </datalist>
          <button onClick={applyInput} disabled={!input.trim()} style={btnStyle(!input.trim())}>Show</button>
          {inMaterialMode && <button onClick={clear} style={btnStyle(false, true)}>Clear</button>}
        </div>
      </div>

      {inMaterialMode ? (
        errM ? (
          <Empty>Couldn’t load {selected} — {errM}</Empty>
        ) : loadingM ? (
          <Empty>Loading {selected}…</Empty>
        ) : series.length === 0 ? (
          <Empty>No snapshot history for {selected}</Empty>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={series} margin={{ top: 4, right: 16, left: 10, bottom: 4 }}>
              <defs>
                <linearGradient id="gradQty" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1a7f37" stopOpacity={0.14} />
                  <stop offset="95%" stopColor="#1a7f37" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
                tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tick={{ fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
                tickLine={false} axisLine={false} width={48}
                label={{ value: 'Quantity', angle: -90, position: 'insideLeft', offset: 6, style: AXIS_LBL_STYLE }} />
              <Tooltip content={<QtyTooltip />} />
              <Area type="monotone" dataKey="quantity" name="Quantity" stroke="#1a7f37" strokeWidth={2}
                fill="url(#gradQty)" dot={{ r: 3, fill: '#1a7f37', strokeWidth: 0 }} activeDot={{ r: 4 }} />
            </AreaChart>
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
