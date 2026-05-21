import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts'

function truncate(s, n) {
  return s && s.length > n ? s.slice(0, n - 1) + '…' : (s || '')
}

function CustomDot({ cx, cy, payload }) {
  if (cx == null || cy == null) return null
  const color = payload.pctChange >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const color = d.pctChange >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
  const sign  = d.pctChange > 0 ? '+' : ''
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      padding: '10px 14px',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 6 }}>
        {d.materialNumber}
      </div>
      <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{d.desc}</div>
      <div style={{ color: 'var(--text-dim)', marginBottom: 2 }}>
        Yesterday: <strong>{d.yesterday}</strong>
      </div>
      <div style={{ color: 'var(--text-dim)', marginBottom: 6 }}>
        Today: <strong>{d.today}</strong>
      </div>
      <div style={{ color, fontWeight: 700 }}>{sign}{d.pctChange.toFixed(2)}%</div>
    </div>
  )
}

export default function DailyComparisonChart({ data, threshold = 10 }) {
  const chartData = useMemo(() => {
    return [...(data || [])]
      .filter(r => r.status !== 'MISSING')
      .sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange))
      .slice(0, 15)
      .map(r => ({
        label:          truncate(r.materialNumber, 10),
        materialNumber: r.materialNumber,
        desc:           r.materialDesc,
        pctChange:      parseFloat((r.pctChange ?? 0).toFixed(2)),
        yesterday:      r.qtyYesterday,
        today:          r.qtyToday,
      }))
  }, [data])

  if (!chartData.length) {
    return (
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <SectionLabel>Today vs Yesterday — % Change</SectionLabel>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
          No comparison data available
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      padding: '16px 20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <SectionLabel>Today vs Yesterday — % Change</SectionLabel>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 58 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', fontSize: 9 }}
            angle={-40}
            textAnchor="end"
            interval={0}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
            tickFormatter={v => `${v}%`}
            tickLine={false}
            axisLine={false}
            width={46}
          />
          <ReferenceLine y={0}           stroke="var(--border-bright)"  strokeWidth={1.5} />
          <ReferenceLine y={ threshold}  stroke="var(--accent-orange)"  strokeDasharray="4 3" strokeOpacity={0.7} />
          <ReferenceLine y={-threshold}  stroke="var(--accent-orange)"  strokeDasharray="4 3" strokeOpacity={0.7} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-bright)', strokeWidth: 1 }} />
          <Line
            type="linear"
            dataKey="pctChange"
            stroke="var(--border-bright)"
            strokeWidth={1.5}
            dot={<CustomDot />}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--text-muted)',
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      marginBottom: 16,
    }}>
      {children}
    </div>
  )
}
