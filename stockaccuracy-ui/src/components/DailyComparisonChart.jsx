// ─── DailyComparisonChart.jsx — today's biggest movers, plotted point by point ─
// Takes the top ~25 materials by size of % change and draws each as a coloured
// dot (green = up, red = down). Dashed amber lines mark the +/- alert threshold.
// A handful of materials can swing by thousands of percent (e.g. stock went from
// 1 to 500); those would flatten the chart, so anything beyond OUTLIER_THRESHOLD
// is pulled out and listed underneath instead of squashing the rest.

import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'

const OUTLIER_THRESHOLD = 500   // % — extreme movers kept out of the plot so they don't flatten it

// Filter options shown above the chart.
const ABC_OPTS = [
  { key: 'ALL',  label: 'All' },
  { key: 'A',    label: 'A' },
  { key: 'B',    label: 'B' },
  { key: 'C',    label: 'C' },
  { key: 'NONE', label: '—' },   // unclassified
]
const DIR_OPTS = [
  { key: 'ALL',  label: 'All' },
  { key: 'UP',   label: '▲ Up' },
  { key: 'DOWN', label: '▼ Down' },
]

function ChipRow({ label, opts, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--tx-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      {opts.map(o => {
        const active = value === o.key
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            style={{
              padding: '2px 8px',
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: active ? 700 : 400,
              background: active ? 'var(--blue-bg)' : 'transparent',
              border: active ? '1px solid var(--blue-border)' : '1px solid var(--border)',
              color: active ? 'var(--blue)' : 'var(--tx-lo)',
              borderRadius: 20, cursor: 'pointer', transition: 'all 0.1s',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

const AXIS_LBL_STYLE = {
  fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono',
  fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
}

function truncate(s, n) {
  return s && s.length > n ? s.slice(0, n - 1) + '…' : (s || '')
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d   = payload[0].payload
  const up  = d.pctChange >= 0
  const sign = d.pctChange > 0 ? '+' : ''
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      padding: '10px 14px',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      maxWidth: 220,
    }}>
      <div style={{ color: 'var(--tx-hi)', fontWeight: 700, marginBottom: 4 }}>{d.materialNumber}</div>
      <div style={{ color: 'var(--tx-lo)', marginBottom: 6, fontSize: 10, lineHeight: 1.4 }}>{d.desc}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
        <span style={{ color: 'var(--tx-lo)' }}>Yesterday</span>
        <strong style={{ color: 'var(--tx-body)' }}>{d.yesterday}</strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
        <span style={{ color: 'var(--tx-lo)' }}>Today</span>
        <strong style={{ color: 'var(--tx-hi)' }}>{d.today}</strong>
      </div>
      <div style={{ color: up ? 'var(--green)' : 'var(--red)', fontWeight: 700, fontSize: 13 }}>
        {sign}{d.pctChange.toFixed(2)}%
      </div>
    </div>
  )
}

function ColoredDot(props) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null) return null
  const color = payload.pctChange >= 0 ? '#1a7f37' : '#cf222e'
  return (
    <circle
      key={`dot-${payload.label}`}
      cx={cx}
      cy={cy}
      r={5}
      fill={color}
      stroke="#fff"
      strokeWidth={1.5}
    />
  )
}

export default function DailyComparisonChart({ data, threshold = 10 }) {
  const [abcFilter, setAbcFilter] = useState('ALL')
  const [dirFilter, setDirFilter] = useState('ALL')

  const chartData = useMemo(() => {
    const passAbc = (r) =>
      abcFilter === 'ALL'    ? true
      : abcFilter === 'NONE' ? (r.abcClass == null)
      :                        (r.abcClass === abcFilter)
    const passDir = (r) =>
      dirFilter === 'ALL'   ? true
      : dirFilter === 'UP'  ? ((r.delta ?? 0) > 0)
      :                       ((r.delta ?? 0) < 0)

    // Extreme movers (>500%) are still kept out of the plot so a single huge
    // spike doesn't flatten everything — they're just no longer listed.
    return [...(data || [])]
      .filter(r => r.status !== 'MISSING')
      .filter(passAbc)
      .filter(passDir)
      .filter(r => Math.abs(r.pctChange ?? 0) <= OUTLIER_THRESHOLD)
      .sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange))
      .slice(0, 25)
      .map(r => ({
        label:          truncate(r.materialNumber, 10),
        materialNumber: r.materialNumber,
        desc:           r.materialDesc,
        pctChange:      parseFloat((r.pctChange ?? 0).toFixed(2)),
        yesterday:      r.qtyYesterday,
        today:          r.qtyToday,
      }))
  }, [data, abcFilter, dirFilter])

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      padding: '16px 20px',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
        <ChartLabel style={{ marginBottom: 0 }}>Today vs Yesterday — % Change (top movers, &gt;{OUTLIER_THRESHOLD}% excluded)</ChartLabel>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <ChipRow label="Class" opts={ABC_OPTS} value={abcFilter} onChange={setAbcFilter} />
          <ChipRow label="Dir"   opts={DIR_OPTS} value={dirFilter} onChange={setDirFilter} />
        </div>
      </div>

      {chartData.length === 0 ? (
        <Empty>No materials match the current filters</Empty>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 80 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono', fontSize: 9, angle: -45, textAnchor: 'end', dy: 6 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              interval={0}
              height={72}
              label={{ value: 'Material No.', position: 'insideBottom', offset: -64, style: AXIS_LBL_STYLE }}
            />
            <YAxis
              tick={{ fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={v => `${v}%`}
              label={{ value: '% Change', angle: -90, position: 'insideLeft', offset: 8, style: AXIS_LBL_STYLE }}
            />
            <ReferenceLine y={0} stroke="var(--border-sub)" strokeWidth={1.5} />
            <ReferenceLine y={ threshold} stroke="var(--amber)" strokeDasharray="4 3" strokeOpacity={0.6} strokeWidth={1}
              label={{ value: `+${threshold}%`, position: 'right', style: { fill: 'var(--amber)', fontFamily: 'IBM Plex Mono', fontSize: 9 } }}
            />
            <ReferenceLine y={-threshold} stroke="var(--amber)" strokeDasharray="4 3" strokeOpacity={0.6} strokeWidth={1}
              label={{ value: `-${threshold}%`, position: 'right', style: { fill: 'var(--amber)', fontFamily: 'IBM Plex Mono', fontSize: 9 } }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-sub)', strokeWidth: 1 }} />
            <Line
              type="linear"
              dataKey="pctChange"
              name="% Change"
              stroke="rgba(150,150,150,0.25)"
              strokeWidth={1}
              dot={<ColoredDot />}
              activeDot={{ r: 7, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function ChartLabel({ children, style }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
      color: 'var(--tx-lo)', letterSpacing: '0.08em', textTransform: 'uppercase',
      marginBottom: 14,
      ...style,
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
