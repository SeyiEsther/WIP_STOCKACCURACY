import { useMemo } from 'react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'

const OUTLIER_THRESHOLD = 500   // % — excluded from chart, shown in list below

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

export default function DailyComparisonChart({ data, threshold = 10 }) {
  const { chartData, outliers } = useMemo(() => {
    const all = [...(data || [])]
      .filter(r => r.status !== 'MISSING')
      .sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange))
      .slice(0, 25)
      .map(r => ({
        label:          truncate(r.materialNumber, 10),
        materialNumber: r.materialNumber,
        desc:           r.materialDesc,
        pctChange:      parseFloat((r.pctChange ?? 0).toFixed(2)),
        yesterday:      r.qtyYesterday,
        today:          r.qtyToday,
        flagged:        Math.abs(r.pctChange ?? 0) > threshold,
      }))

    return {
      chartData: all.filter(r => Math.abs(r.pctChange) <= OUTLIER_THRESHOLD),
      outliers:  all.filter(r => Math.abs(r.pctChange)  > OUTLIER_THRESHOLD),
    }
  }, [data, threshold])

  // dynamic height: ~18px per bar, min 200
  const chartHeight = Math.max(200, chartData.length * 18 + 40)

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      padding: '16px 20px',
      display: 'flex', flexDirection: 'column',
    }}>
      <ChartLabel>Today vs Yesterday — % Change (top movers, outliers &gt;{OUTLIER_THRESHOLD}% excluded)</ChartLabel>

      {chartData.length === 0 ? (
        <Empty>No comparison data available</Empty>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 4, right: 64, left: 8, bottom: 4 }}
          >
            <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              tick={{ fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
              tickFormatter={v => `${v}%`}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={72}
              tick={{ fill: 'var(--tx-body)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <ReferenceLine x={0} stroke="var(--border-sub)" strokeWidth={1.5} />
            <ReferenceLine x={ threshold} stroke="var(--amber)" strokeDasharray="4 3" strokeOpacity={0.6} strokeWidth={1}
              label={{ value: `+${threshold}%`, position: 'right', style: { fill: 'var(--amber)', fontFamily: 'IBM Plex Mono', fontSize: 9 } }}
            />
            <ReferenceLine x={-threshold} stroke="var(--amber)" strokeDasharray="4 3" strokeOpacity={0.6} strokeWidth={1}
              label={{ value: `-${threshold}%`, position: 'right', style: { fill: 'var(--amber)', fontFamily: 'IBM Plex Mono', fontSize: 9 } }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-inset)' }} />
            <Bar dataKey="pctChange" name="% Change" radius={[0, 3, 3, 0]} maxBarSize={16}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.pctChange >= 0 ? '#1a7f37' : '#cf222e'}
                  fillOpacity={entry.flagged ? 0.85 : 0.35}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Outlier list */}
      {outliers.length > 0 && (
        <div style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
            color: 'var(--tx-faint)', letterSpacing: '0.09em', textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            Extreme outliers — excluded from chart (&gt;{OUTLIER_THRESHOLD}%)
          </div>
          {outliers.map(r => (
            <div key={r.materialNumber} style={{
              display: 'flex', alignItems: 'baseline', gap: 8,
              fontFamily: 'var(--font-mono)', fontSize: 11,
              padding: '2px 0',
              borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontWeight: 700, color: 'var(--tx-hi)', flexShrink: 0 }}>{r.materialNumber}</span>
              <span style={{ color: 'var(--tx-lo)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {r.desc}
              </span>
              <span style={{
                fontWeight: 700, flexShrink: 0,
                color: r.pctChange >= 0 ? 'var(--green)' : 'var(--red)',
              }}>
                {r.pctChange > 0 ? '+' : ''}{r.pctChange.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ChartLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
      color: 'var(--tx-lo)', letterSpacing: '0.08em', textTransform: 'uppercase',
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
