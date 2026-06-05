import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      padding: '10px 14px',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      <div style={{ color: 'var(--tx-lo)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value} materials</strong>
        </div>
      ))}
    </div>
  )
}

export default function TrendChart({ data }) {
  const chartData = useMemo(() =>
    (data || []).map(d => ({
      ...d,
      date:         fmtDate(d.snapshotDate ?? d.SnapshotDate),
      totalTracked: d.totalTracked ?? d.TotalTracked ?? 0,
      flagged:      d.flagged      ?? d.Flagged      ?? 0,
    }))
  , [data])

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      padding: '16px 20px',
    }}>
      <ChartLabel>7-Day Trend — Tracked vs Flagged</ChartLabel>

      {chartData.length === 0 ? (
        <Empty>No historical data yet — trend builds as daily snapshots accumulate</Empty>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 10, bottom: 4 }}>
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
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              tick={{ fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={40}
              allowDecimals={false}
              label={{ value: 'Materials', angle: -90, position: 'insideLeft', offset: 6, style: AXIS_LBL_STYLE }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontFamily: 'IBM Plex Mono', fontSize: 10, paddingTop: 8 }} />
            <Area
              type="monotone"
              dataKey="totalTracked"
              name="Total Tracked"
              stroke="#0969da"
              strokeWidth={2}
              fill="url(#gradTracked)"
              dot={{ r: 3, fill: '#0969da', strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="flagged"
              name="Flagged"
              stroke="#cf222e"
              strokeWidth={2}
              fill="url(#gradFlagged)"
              dot={{ r: 3, fill: '#cf222e', strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function ChartLabel({ children }) {
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

function Empty({ children }) {
  return (
    <div style={{
      height: 220,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-lo)',
    }}>
      {children}
    </div>
  )
}
