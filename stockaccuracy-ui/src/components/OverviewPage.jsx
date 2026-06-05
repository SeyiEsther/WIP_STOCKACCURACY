import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

// ─── colour palette ─────────────────────────────────────────────────────────
const C = {
  green:  '#1a7f37',
  orange: '#d97706',
  red:    '#cf222e',
  blue:   '#0969da',
}

const SLOC_PALETTE = [
  '#6366f1', '#0ea5e9', '#f59e0b', '#10b981',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]

// ─── helpers ─────────────────────────────────────────────────────────────────
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
function fmtShort(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${DAYS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
}
function fmtPct(v) {
  if (v == null || !isFinite(v)) return '—'
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
}

// ─── sub-components ───────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--tx-lo)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      marginBottom: 14,
    }}>
      {children}
    </div>
  )
}

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: '16px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Row 1: Stat Cards ────────────────────────────────────────────────────────
function StatCard({ label, value, color, bg, border }) {
  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderTop: `3px solid ${color}`,
      borderRadius: 6,
      padding: '16px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 32,
        fontWeight: 700,
        color,
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}>
        {value ?? <Skel />}
      </div>
      <div style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fontWeight: 600,
        color,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginTop: 6,
        opacity: 0.8,
      }}>
        {label}
      </div>
    </div>
  )
}

function Skel() {
  return (
    <span style={{
      display: 'inline-block', width: 48, height: 32,
      background: 'var(--bg-inset)', borderRadius: 3,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  )
}

// ─── Donut chart with centred label ──────────────────────────────────────────
function DonutChart({ title, data, centerLines, noDataMsg }) {
  const hasData = data.some(d => d.value > 0)
  return (
    <Card style={{ flex: 1 }}>
      <SectionLabel>{title}</SectionLabel>
      {!hasData ? (
        <div style={{
          height: 180,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-faint)',
        }}>
          {noDataMsg ?? 'No data'}
        </div>
      ) : (
        <>
          <div style={{ position: 'relative', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={76}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                >
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [val, name]}
                  contentStyle={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    fontFamily: 'IBM Plex Mono',
                    fontSize: 11,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Centred overlay text */}
            {centerLines && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                textAlign: 'center', pointerEvents: 'none',
              }}>
                {centerLines.map((line, i) => (
                  <div key={i} style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: i === 0 ? 18 : 10,
                    fontWeight: i === 0 ? 700 : 500,
                    color: i === 0 ? 'var(--tx-hi)' : 'var(--tx-lo)',
                    lineHeight: i === 0 ? 1.1 : 1.4,
                  }}>
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 10 }}>
            {data.map((d, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tx-body)',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                {d.name} <strong style={{ color: d.color }}>{d.value}</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

// ─── 14-day flagged bar chart ─────────────────────────────────────────────────
function TrendBarChart({ trendData }) {
  const hasAny = trendData.some(d => d.flagged != null)
  return (
    <Card style={{ flex: 1 }}>
      <SectionLabel>Flagged Materials Per Day — 14-Day Trend</SectionLabel>
      {!hasAny ? (
        <div style={{
          height: 220,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-faint)',
        }}>
          Building history…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={trendData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={44}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip
              formatter={(v) => [v, 'Flagged']}
              contentStyle={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                fontFamily: 'IBM Plex Mono',
                fontSize: 11,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            />
            <Bar dataKey="flagged" radius={[3, 3, 0, 0]} maxBarSize={36}>
              {trendData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

// ─── Top 10 volatile horizontal bar chart ─────────────────────────────────────
function VolatileChart({ data }) {
  return (
    <Card style={{ flex: 1 }}>
      <SectionLabel>Top 10 Most Volatile Materials — Avg % Change</SectionLabel>
      {data.length === 0 ? (
        <div style={{
          height: 220,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-faint)',
        }}>
          No data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              tick={{ fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              tickFormatter={v => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={90}
              tick={{ fill: 'var(--tx-body)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(v, name, { payload }) => [`${v.toFixed(1)}%`, payload.desc || 'Change']}
              contentStyle={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                fontFamily: 'IBM Plex Mono',
                fontSize: 11,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            />
            <Bar dataKey="pct" radius={[0, 3, 3, 0]} maxBarSize={18}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.pct > 200 ? C.red : entry.pct > 50 ? C.orange : C.green} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

// ─── Extreme Movers table ─────────────────────────────────────────────────────
function ExtremeMoversTable({ rows }) {
  if (rows.length === 0) return null
  return (
    <Card>
      <SectionLabel>Extreme Movers — % Change Exceeded 500%</SectionLabel>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Material', 'Description', 'SLoc', '% Change', ''].map(h => (
                <th key={h} style={{
                  padding: '6px 10px',
                  textAlign: 'left',
                  fontWeight: 700,
                  fontSize: 10,
                  color: 'var(--tx-lo)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const pct = r.pctChange
              const dir = pct > 0 ? '▲' : '▼'
              const badge = Math.abs(pct) > 1000 ? 'EXTREME' : 'HIGH'
              const badgeColor = badge === 'EXTREME' ? C.red : C.orange
              return (
                <tr key={i} style={{
                  borderBottom: '1px solid var(--border-sub)',
                  background: i % 2 === 0 ? 'transparent' : 'var(--bg-inset)',
                }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--tx-hi)' }}>
                    {r.materialNumber}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--tx-body)', maxWidth: 260 }}>
                    {r.materialDesc}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--tx-lo)' }}>
                    {r.sLoc}
                  </td>
                  <td style={{
                    padding: '8px 10px',
                    fontWeight: 700,
                    color: pct > 0 ? C.green : C.red,
                    whiteSpace: 'nowrap',
                  }}>
                    {dir} {fmtPct(pct)}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{
                      background: badgeColor + '22',
                      color: badgeColor,
                      border: `1px solid ${badgeColor}44`,
                      borderRadius: 4,
                      padding: '2px 7px',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                    }}>
                      {badge}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ─── Main OverviewPage ────────────────────────────────────────────────────────
export default function OverviewPage({ rows, summary, trend, loading, threshold = 10 }) {
  // ── Row 1: counts ────────────────────────────────────────────────────────
  const totalTracked = summary?.totalTracked ?? summary?.TotalTracked ?? rows.length
  const flaggedToday = useMemo(
    () => rows.filter(r => Math.abs(r.pctChange) > threshold).length,
    [rows, threshold]
  )
  const newToday = summary?.totalNew ?? summary?.TotalNew ?? rows.filter(r => r.status === 'NEW').length
  const missingToday = summary?.totalMissing ?? summary?.TotalMissing ?? rows.filter(r => r.status === 'MISSING').length

  // ── Stock Health donut ───────────────────────────────────────────────────
  const { healthData, healthPct } = useMemo(() => {
    const ok      = rows.filter(r => r.status !== 'MISSING' && r.status !== 'NEW' && Math.abs(r.pctChange) <= threshold).length
    const flagged = rows.filter(r => Math.abs(r.pctChange) > threshold).length
    const missing = rows.filter(r => r.status === 'MISSING').length
    const total   = ok + flagged + missing
    return {
      healthData: [
        { name: 'OK',      value: ok,      color: C.green  },
        { name: 'Flagged', value: flagged, color: C.orange },
        { name: 'Missing', value: missing, color: C.red    },
      ],
      healthPct: total > 0 ? Math.round((ok / total) * 100) : 0,
    }
  }, [rows, threshold])

  // ── Flagged by Direction donut ───────────────────────────────────────────
  const directionData = useMemo(() => {
    const flagged = rows.filter(r => Math.abs(r.pctChange) > threshold)
    const up   = flagged.filter(r => (r.delta ?? 0) > 0).length
    const down = flagged.filter(r => (r.delta ?? 0) < 0).length
    return [
      { name: 'Up ▲',   value: up,   color: C.green },
      { name: 'Down ▼', value: down, color: C.red   },
    ]
  }, [rows, threshold])

  // ── Flagged by SLoc donut ────────────────────────────────────────────────
  const slocData = useMemo(() => {
    const flagged = rows.filter(r => Math.abs(r.pctChange) > threshold)
    const map = {}
    flagged.forEach(r => { map[r.sLoc] = (map[r.sLoc] || 0) + 1 })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: SLOC_PALETTE[i % SLOC_PALETTE.length] }))
  }, [rows, threshold])

  // ── 14-day trend bars ────────────────────────────────────────────────────
  const trendData = useMemo(() => {
    const sorted = [...(trend || [])].sort((a, b) => {
      return new Date(a.snapshotDate ?? a.SnapshotDate) - new Date(b.snapshotDate ?? b.SnapshotDate)
    })
    return sorted.slice(-14).map(d => {
      const flagged = d.flagged ?? d.Flagged ?? 0
      const total   = d.totalTracked ?? d.TotalTracked ?? 1
      const ratio   = flagged / total
      return {
        date:    fmtShort(d.snapshotDate ?? d.SnapshotDate),
        flagged,
        color:   ratio < 0.05 ? C.green : ratio < 0.15 ? C.orange : C.red,
      }
    })
  }, [trend])

  // ── Top 10 volatile ──────────────────────────────────────────────────────
  const top10 = useMemo(() =>
    [...rows]
      .filter(r => r.status !== 'MISSING' && r.status !== 'NEW' && isFinite(r.pctChange))
      .sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange))
      .slice(0, 10)
      .map(r => ({
        label: r.materialNumber,
        desc:  r.materialDesc,
        pct:   Math.abs(r.pctChange),
      }))
  , [rows])

  // ── Extreme movers (>500%) ───────────────────────────────────────────────
  const extremeMovers = useMemo(() =>
    [...rows]
      .filter(r => Math.abs(r.pctChange) > 500)
      .sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange))
  , [rows])

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <main style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {loading && rows.length === 0 && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-lo)',
          padding: '12px 0',
        }}>
          Loading…
        </div>
      )}

      {/* Row 1 — 4 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard
          label="Total Materials Tracked"
          value={totalTracked}
          color={C.blue}
          bg="#ddf4ff"
          border="#80ccff"
        />
        <StatCard
          label="Flagged Today"
          value={flaggedToday}
          color={C.orange}
          bg="#fff7ed"
          border="#fed7aa"
        />
        <StatCard
          label="New Materials"
          value={newToday}
          color={C.green}
          bg="#dafbe1"
          border="#82cfad"
        />
        <StatCard
          label="Missing Materials"
          value={missingToday}
          color={C.red}
          bg="#ffebe9"
          border="#f5a9a7"
        />
      </div>

      {/* Row 2 — 3 donut charts */}
      <div style={{ display: 'flex', gap: 14 }}>
        <DonutChart
          title="Stock Health"
          data={healthData}
          centerLines={[`${healthPct}%`, 'healthy']}
          noDataMsg="No snapshot data"
        />
        <DonutChart
          title="Flagged by Direction"
          data={directionData}
          centerLines={[`${flaggedToday}`, 'flagged']}
          noDataMsg="No flagged items"
        />
        <DonutChart
          title="Flagged by Storage Location"
          data={slocData}
          centerLines={[`${slocData.length}`, 'SLocs affected']}
          noDataMsg="No flagged items"
        />
      </div>

      {/* Row 3 — trend bar + top 10 volatile */}
      <div style={{ display: 'flex', gap: 14 }}>
        <TrendBarChart trendData={trendData} />
        <VolatileChart data={top10} />
      </div>

      {/* Row 4 — extreme movers */}
      {extremeMovers.length > 0 && (
        <ExtremeMoversTable rows={extremeMovers} />
      )}
    </main>
  )
}
