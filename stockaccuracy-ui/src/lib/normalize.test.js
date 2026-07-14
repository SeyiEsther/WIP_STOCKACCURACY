import { describe, it, expect } from 'vitest'
import { norm, iid } from './normalize.js'

describe('norm', () => {
  it('reads PascalCase (raw API) field names', () => {
    const r = norm({
      MaterialNumber: '433901', MaterialDesc: 'FRAME', SLoc: '0001',
      QtyYesterday: 10, QtyToday: 12, Delta: 2, PctChange: 20,
      Status: 'FLAGGED', BaseUnit: 'EA', MRPController: 'ABC',
    })
    expect(r.materialNumber).toBe('433901')
    expect(r.materialDesc).toBe('FRAME')
    expect(r.sLoc).toBe('0001')
    expect(r.delta).toBe(2)
    expect(r.pctChange).toBe(20)
    expect(r.status).toBe('FLAGGED')
  })

  it('reads camelCase field names', () => {
    const r = norm({ materialNumber: 'X', materialDesc: 'Y', sLoc: '2', qtyToday: 5 })
    expect(r.materialNumber).toBe('X')
    expect(r.qtyToday).toBe(5)
  })

  it('defaults unitValue to null when absent', () => {
    expect(norm({ MaterialNumber: 'X' }).unitValue).toBeNull()
  })
})

describe('iid', () => {
  it('joins material and sloc with a stable separator', () => {
    expect(iid('433901', '0001')).toBe('433901__0001')
  })
})
