import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell
} from 'recharts'

const LABEL_MAX = 22

function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

export default function TopMoversChart({ data, threshold }) {
  const chartData = useMemo(() => {
    const sorted = [...data]
      .filter(r => r.status !== 'MISSING')
      .sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange))
      .slice(0, 15)
    return sorted.map(r => ({
      label: truncate(`${r.materialNumber} ${r.materialDesc}`, LABEL_MAX),
      pct: parseFloat(r.pctChange.toFixed(2)),
      flagged: Math.abs(r.pctChange) > threshold,
    }))
  }, [data, threshold])

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const { label, pct } = payload[0].payload
    const color = pct >= 0 ? '#00e5a0' : '#ff4d6a'
    return (
      <div style={{ background: '#0c0f1a', border: '1px solid #1a2035', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
        <div style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</div>
        <div style={{ color }}>{pct > 0 ? '+' : ''}{pct}%</div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '14px 16px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        Top Movers — % Change
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 60 }}>
          <CartesianGrid vertical={false} stroke="#1a2035" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontFamily: 'IBM Plex Mono', fontSize: 9 }}
            angle={-40}
            textAnchor="end"
            interval={0}
            tickLine={false}
            axisLine={{ stroke: '#1a2035' }}
          />
          <YAxis
            tick={{ fill: '#64748b', fontFamily: 'IBM Plex Mono', fontSize: 9 }}
            tickFormatter={v => `${v}%`}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <ReferenceLine y={0} stroke="#1a2035" />
          <ReferenceLine y={threshold}  stroke="#ff9f43" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={-threshold} stroke="#ff9f43" strokeDasharray="3 3" strokeOpacity={0.5} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff08' }} />
          <Bar dataKey="pct" radius={0} maxBarSize={28}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.pct >= 0 ? '#00e5a0' : '#ff4d6a'} fillOpacity={d.flagged ? 1 : 0.55} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
