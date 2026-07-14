import { describe, it, expect } from 'vitest'
import { isFlagged, deriveStatus } from './stock.js'

describe('isFlagged', () => {
  it('flags absolute change strictly above the threshold', () => {
    expect(isFlagged({ pctChange: 11 }, 10)).toBe(true)
    expect(isFlagged({ pctChange: -11 }, 10)).toBe(true)
  })
  it('does not flag change at or below the threshold', () => {
    expect(isFlagged({ pctChange: 10 }, 10)).toBe(false)
    expect(isFlagged({ pctChange: -5 }, 10)).toBe(false)
  })
  it('treats missing pctChange as zero', () => {
    expect(isFlagged({}, 10)).toBe(false)
  })
})

describe('deriveStatus', () => {
  const inv = {}
  it('passes through NEW and MISSING regardless of change', () => {
    expect(deriveStatus({ status: 'NEW', pctChange: 999 }, 10, inv)).toBe('NEW')
    expect(deriveStatus({ status: 'MISSING', pctChange: 999 }, 10, inv)).toBe('MISSING')
  })
  it('returns OK when within threshold', () => {
    expect(deriveStatus({ status: 'OK', pctChange: 3, delta: 1 }, 10, inv)).toBe('OK')
  })
  it('returns UP / DOWN by delta direction when flagged', () => {
    expect(deriveStatus({ status: 'OK', pctChange: 40, delta: 5 }, 10, inv)).toBe('UP')
    expect(deriveStatus({ status: 'OK', pctChange: 40, delta: -5 }, 10, inv)).toBe('DOWN')
  })
  it('returns INVESTIGATED once acknowledged', () => {
    const row = { status: 'OK', pctChange: 40, delta: 5, materialNumber: '1', sLoc: '2' }
    const acked = { '1__2': { ts: 'now' } }
    expect(deriveStatus(row, 10, acked)).toBe('INVESTIGATED')
  })
})
