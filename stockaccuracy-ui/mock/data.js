// Realistic sample data for local dev / UI preview (no backend needed)

const today     = new Date().toISOString().slice(0, 10)
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

function row(mat, desc, sloc, qty0, qty1, unitValue, mrp = 'A06', unit = 'EA') {
  const delta = qty1 - qty0
  const pct = qty0 === 0
    ? (qty1 === 0 ? 0 : 100)
    : parseFloat(((delta / qty0) * 100).toFixed(2))
  const absPct = Math.abs(pct)
  const status = qty0 === 0 && qty1 > 0 ? 'NEW'
    : qty1 === 0 && qty0 > 0 ? 'MISSING'
    : absPct > 10 ? 'FLAGGED'
    : 'OK'
  return {
    materialNumber: mat,
    materialDesc:   desc,
    sLoc:           sloc,
    qtyYesterday:   qty0,
    qtyToday:       qty1,
    delta,
    pctChange:      pct,
    status,
    baseUnit:       unit,
    mrpController:  mrp,
    unitValue,           // £ per unit (MAP / standard price)
    todayDate:      today,
    yesterdayDate:  yesterday,
  }
}

//                 mat       description                         sloc  qty0   qty1   £/unit   mrp   unit
export const comparison = [
  row('200004', 'WASHER/N125/A6,4',               '4002',  1200,  1200,   0.02,  'A06'),
  row('200012', 'BOLT M8x20 ST',                  '4002',   850,   975,   0.05,  'A06'),
  row('200019', 'NUT M6 A2 SS',                   '4003',  3400,  3100,   0.03,  'A06'),
  row('200031', 'CABLE GLAND M20 IP68',            '4002',   220,   310,   1.20,  'B02'),
  row('200047', 'DIN RAIL 35MM 1M',               '1001',   180,   180,   4.50,  'B02'),
  row('200053', 'TERMINAL BLOCK 6MM GRY',          '1001',  2100,  1840,   0.85,  'A06'),
  row('200061', 'EARTH TERMINAL 6MM',              '1001',   960,  1050,   0.75,  'A06'),
  row('200078', 'CABLE TIE 200MM BLK',             '4003',  5000,  4200,   0.04,  'C01'),
  row('200085', 'RIVET M4 ALU',                    '4002',  4800,  5520,   0.02,  'A06'),
  row('200092', 'LABEL HOLDER 35MM',               '1001',   340,   390,   0.35,  'B02'),
  row('200103', 'GLAND PLATE 6HLE',                '4002',    40,    40,  12.50,  'B02'),
  row('200118', 'CABLE SLEEVE 10MM GRY',           '4003',  1100,   900,   0.15,  'C01'),
  row('200126', 'FAN GUARD 120MM',                 '2005',    60,   105,   8.50,  'B02'),
  row('200134', 'BACKPANEL 600x600',               '2005',    15,    15,  45.00,  'B02'),
  row('200141', 'DOOR GASKET 1000MM',              '4002',   200,   165,   6.20,  'A06'),
  row('200158', 'HANDLE QUARTER-TURN',             '4002',   480,   560,   3.80,  'A06'),
  row('200165', 'HINGE CONCEALED L',               '4002',   720,   720,   4.20,  'A06'),
  row('200173', 'SCREW M5x10 TORX',               '4002',  6200,  6200,   0.03,  'C01'),
  row('200181', 'PCB SPACER 5MM NYL',              '1001',  1800,  1530,   0.08,  'A06'),
  row('200199', 'LED INDICATOR GRN 24V',           '2005',   120,   180,   5.50,  'B02'),
  row('200206', 'PUSH BUTTON RED 40MM',            '2005',    75,    40,  12.00,  'B02'),
  row('200214', 'CONTACTOR 9A 24VDC',              '1001',    30,    30,  35.00,  'B02'),
  row('200221', 'MCB 6A B-CURVE',                  '1001',    45,    45,  18.50,  'A06'),
  row('200238', 'RELAY 24VDC 8PIN',                '1001',    90,   126,   8.20,  'A06'),
  row('200245', 'SOCKET 8PIN SCREW',               '1001',    90,    72,   3.10,  'A06'),
  row('200253', 'FERRULE 1.5MM RED',               '4003',  4200,  4200,   0.06,  'C01'),
  row('200261', 'FERRULE 2.5MM BLU',               '4003',  3800,  3040,   0.08,  'C01'),
  row('200278', 'CABLE H05V-K 1.0MM BLK',          '4003',   320,   320,   0.55,  'C01', 'M'),
  row('200285', 'CABLE H07V-K 2.5MM BRN',          '4003',   200,   240,   1.20,  'C01', 'M'),
  row('200293', 'HEAT SHRINK 6MM BLK',             '4003',   150,     0,   0.25,  'C01', 'M'),  // MISSING
  row('200301', 'EMC CONDUIT 20MM',                '4002',     0,    80,   2.80,  'B02', 'M'),  // NEW
  row('200318', 'ADAPTOR M20-M25',                 '4002',    55,    55,   1.80,  'B02'),
  row('200325', 'CRIMP LUG 16MM RING',             '4003',   280,   420,   0.45,  'C01'),
  row('200333', 'CABLE MARKER SLEEVE 4MM',         '4003',   900,   900,   0.12,  'C01'),
  row('200341', 'FUSE 2A 5x20MM',                  '1001',   180,   126,   0.65,  'A06'),
  row('200358', 'FUSE HOLDER PANEL',               '1001',    40,    40,   4.50,  'A06'),
  row('200366', 'BLANKING PLUG M20',               '4002',   420,   504,   0.90,  'B02'),
  row('200374', 'TRUNKING LID 40MM',               '4002',    80,    80,   2.20,  'B02', 'M'),
  row('200381', 'STEEL PANEL 2MM 500x400',         '2005',    10,     4,  28.00,  'B02'),
]

export const summary = {
  totalTracked:     comparison.length,
  totalFlagged:     comparison.filter(r => r.status === 'FLAGGED').length,
  totalNew:         comparison.filter(r => r.status === 'NEW').length,
  totalMissing:     comparison.filter(r => r.status === 'MISSING').length,
  lastSnapshotDate: today,
}

// 7-day area chart trend
const baseDate = new Date()
export const trend = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(baseDate)
  d.setDate(d.getDate() - (6 - i))
  const tracked = 36 + Math.floor(Math.random() * 8)
  const flagged  = 2  + Math.floor(Math.random() * 6)
  return { snapshotDate: d.toISOString().slice(0, 10), totalTracked: tracked, flagged }
})

// Per-material trend directions (simulates 5-day window)
// UP = every day qty went up, DOWN = every day qty fell, FLAT = mixed
export const materialTrends = [
  { materialNumber: '200085', sLoc: '4002', trendDirection: 'UP',   dataPoints: 5 },  // RIVET - steadily growing
  { materialNumber: '200238', sLoc: '1001', trendDirection: 'UP',   dataPoints: 4 },  // RELAY - replenishment pattern
  { materialNumber: '200366', sLoc: '4002', trendDirection: 'UP',   dataPoints: 3 },  // BLANKING PLUG
  { materialNumber: '200381', sLoc: '2005', trendDirection: 'DOWN', dataPoints: 5 },  // STEEL PANEL - slow burn
  { materialNumber: '200206', sLoc: '2005', trendDirection: 'DOWN', dataPoints: 4 },  // PUSH BUTTON - dropping
  { materialNumber: '200261', sLoc: '4003', trendDirection: 'DOWN', dataPoints: 3 },  // FERRULE 2.5MM
  { materialNumber: '200053', sLoc: '1001', trendDirection: 'DOWN', dataPoints: 3 },  // TERMINAL BLOCK
  { materialNumber: '200325', sLoc: '4003', trendDirection: 'UP',   dataPoints: 4 },  // CRIMP LUG
]
