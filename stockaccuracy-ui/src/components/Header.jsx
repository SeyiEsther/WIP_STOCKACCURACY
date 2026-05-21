import { useState, useEffect } from 'react'

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

const fmt = (d) =>
  d ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null

export default function Header({ lastUpdated, onRefresh, onExport, loading, error }) {
  const now = useClock()

  const statusType = error ? 'error' : loading ? 'loading' : lastUpdated ? 'live' : 'idle'
  const STATUS = {
    live:    { color: 'var(--green)',  label: 'Live'    },
    loading: { color: 'var(--amber)',  label: 'Loading' },
    error:   { color: 'var(--red)',    label: 'Error'   },
    idle:    { color: 'var(--grey)',   label: 'Idle'    },
  }
  const { color: dotColor, label: dotLabel } = STATUS[statusType]

  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 20px',
      height: 48,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flex: 1 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: 13,
          color: 'var(--tx-hi)',
          letterSpacing: '-0.01em',
        }}>
          Stock Accuracy
        </span>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          color: 'var(--tx-lo)',
        }}>
          Rittal CSM Plymouth
        </span>
      </div>

      {/* Status dot */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tx-lo)',
      }}>
        <span style={{
          display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
          background: dotColor,
          animation: statusType === 'loading' ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }} />
        {dotLabel}
      </div>

      <Divider />

      {/* Last updated */}
      {lastUpdated && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tx-lo)', whiteSpace: 'nowrap' }}>
          refreshed {fmt(lastUpdated)}
        </div>
      )}

      {/* Live clock */}
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 12,
        color: 'var(--tx-hi)', fontWeight: 500,
        letterSpacing: '0.03em', minWidth: 64,
      }}>
        {fmt(now)}
      </div>

      <Divider />

      <GhostBtn onClick={onExport} disabled={loading}>↓ CSV</GhostBtn>
      <PrimaryBtn onClick={onRefresh} disabled={loading}>
        {loading ? '…' : '↺ Refresh'}
      </PrimaryBtn>
    </header>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />
}

const BASE_BTN = {
  padding: '4px 10px',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.02em',
  borderRadius: 4,
  transition: 'opacity 0.12s',
  cursor: 'pointer',
}

function GhostBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...BASE_BTN,
        background: 'transparent',
        border: '1px solid var(--border)',
        color: disabled ? 'var(--tx-faint)' : 'var(--tx-body)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...BASE_BTN,
        background: disabled ? 'var(--bg-inset)' : 'var(--blue)',
        border: 'none',
        color: disabled ? 'var(--tx-lo)' : '#fff',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  )
}
