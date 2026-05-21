import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'

const DAY = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${DAY[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`
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
      <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function TrendChart({ data }) {
  const chartData = useMemo(() =>
    (data || []).map(d => ({
      ...d,
      date: fmtDate(d.snapshotDate ?? d.SnapshotDate),
      totalTracked: d.totalTracked ?? d.TotalTracked ?? 0,
      flagged:      d.flagged      ?? d.Flagged      ?? 0,
    }))
  , [data])

  const isEmpty = chartData.length === 0

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      padding: '16px 20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-muted)',
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        marginBottom: 16,
      }}>
        7-Day Trend — Tracked vs Flagged
      </div>

      {isEmpty ? (
        <div style={{
          height: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}>
          No historical data yet — trend builds as daily snapshots accumulate
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradTracked" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0080ef" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0080ef" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="gradFlagged" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f03e5c" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f03e5c" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontFamily: 'IBM Plex Mono', fontSize: 10, paddingTop: 8 }}
            />
            <Area
              type="monotone"
              dataKey="totalTracked"
              name="Total Tracked"
              stroke="#0080ef"
              strokeWidth={2}
              fill="url(#gradTracked)"
              dot={{ r: 4, fill: '#0080ef', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Area
              type="monotone"
              dataKey="flagged"
              name="Flagged"
              stroke="#f03e5c"
              strokeWidth={2}
              fill="url(#gradFlagged)"
              dot={{ r: 4, fill: '#f03e5c', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
