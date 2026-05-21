import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'

const OUTLIER_THRESHOLD = 500   // % — excluded from chart, shown in list below

function truncate(s, n) {
  return s && s.length > n ? s.slice(0, n - 1) + '…' : (s || '')
}

function CustomDot({ cx, cy, payload }) {
  if (cx == null || cy == null) return null
  const up      = payload.pctChange >= 0
  const flagged = payload.flagged
  return (
    <circle
      cx={cx} cy={cy}
      r={flagged ? 5 : 3}
      fill={up ? '#1a7f37' : '#cf222e'}
      stroke="var(--bg-surface)"
      strokeWidth={1.5}
      opacity={flagged ? 1 : 0.45}
    />
  )
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
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 6, right: 16, left: 0, bottom: 52 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono', fontSize: 9 }}
              angle={-40}
              textAnchor="end"
              interval={0}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              tick={{ fill: 'var(--tx-lo)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
              tickFormatter={v => `${v}%`}
              tickLine={false}
              axisLine={false}
              width={46}
            />
            <ReferenceLine y={0}          stroke="var(--border-sub)" strokeWidth={1.5} />
            <ReferenceLine y={ threshold} stroke="#7d4e00" strokeDasharray="4 3" strokeOpacity={0.6} strokeWidth={1} />
            <ReferenceLine y={-threshold} stroke="#7d4e00" strokeDasharray="4 3" strokeOpacity={0.6} strokeWidth={1} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-sub)', strokeWidth: 1 }} />
            <Line
              type="linear"
              dataKey="pctChange"
              stroke="var(--border-sub)"
              strokeWidth={1.5}
              dot={<CustomDot />}
              activeDot={false}
            />
          </LineChart>
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
            <div key={`${r.materialNumber}`} style={{
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
