// Realistic sample data for local dev / UI preview (no backend needed)

const today = new Date().toISOString().slice(0, 10)
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

function row(mat, desc, sloc, qty0, qty1, mrp = 'A06', unit = 'EA') {
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
    materialDesc: desc,
    sLoc: sloc,
    qtyYesterday: qty0,
    qtyToday: qty1,
    delta,
    pctChange: pct,
    status,
    baseUnit: unit,
    mrpController: mrp,
    todayDate: today,
    yesterdayDate: yesterday,
  }
}

export const comparison = [
  row('200004',  'WASHER/N125/A6,4',                 '4002',  1200,   1200),
  row('200012',  'BOLT M8x20 ST',                    '4002',   850,    975,  'A06'),
  row('200019',  'NUT M6 A2 SS',                     '4003',  3400,   3100,  'A06'),
  row('200031',  'CABLE GLAND M20 IP68',             '4002',   220,    310,  'B02'),
  row('200047',  'DIN RAIL 35MM 1M',                 '1001',   180,    180,  'B02'),
  row('200053',  'TERMINAL BLOCK 6MM GRY',           '1001',  2100,   1840,  'A06'),
  row('200061',  'EARTH TERMINAL 6MM',               '1001',   960,   1050,  'A06'),
  row('200078',  'CABLE TIE 200MM BLK',              '4003',  5000,   4200,  'C01'),
  row('200085',  'RIVET M4 ALU',                     '4002',  4800,   5520,  'A06'),
  row('200092',  'LABEL HOLDER 35MM',                '1001',   340,    390,  'B02'),
  row('200103',  'GLAND PLATE 6HLE',                 '4002',    40,     40,  'B02'),
  row('200118',  'CABLE SLEEVE 10MM GRY',            '4003',  1100,    900,  'C01'),
  row('200126',  'FAN GUARD 120MM',                  '2005',    60,    105,  'B02'),
  row('200134',  'BACKPANEL 600x600',                '2005',    15,     15,  'B02'),
  row('200141',  'DOOR GASKET 1000MM',               '4002',   200,    165,  'A06'),
  row('200158',  'HANDLE QUARTER-TURN',              '4002',   480,    560,  'A06'),
  row('200165',  'HINGE CONCEALED L',                '4002',   720,    720,  'A06'),
  row('200173',  'SCREW M5x10 TORX',                 '4002',  6200,   6200,  'C01'),
  row('200181',  'PCB SPACER 5MM NYL',               '1001',  1800,   1530,  'A06'),
  row('200199',  'LED INDICATOR GRN 24V',            '2005',   120,    180,  'B02'),
  row('200206',  'PUSH BUTTON RED 40MM',             '2005',    75,     40,  'B02'),
  row('200214',  'CONTACTOR 9A 24VDC',               '1001',    30,     30,  'B02'),
  row('200221',  'MCB 6A B-CURVE',                   '1001',    45,     45,  'A06'),
  row('200238',  'RELAY 24VDC 8PIN',                 '1001',    90,    126,  'A06'),
  row('200245',  'SOCKET 8PIN SCREW',                '1001',    90,     72,  'A06'),
  row('200253',  'FERRULE 1.5MM RED',                '4003',  4200,   4200,  'C01'),
  row('200261',  'FERRULE 2.5MM BLU',                '4003',  3800,   3040,  'C01'),
  row('200278',  'CABLE H05V-K 1.0MM BLK',           '4003',   320,    320,  'C01', 'M'),
  row('200285',  'CABLE H07V-K 2.5MM BRN',           '4003',   200,    240,  'C01', 'M'),
  row('200293',  'HEAT SHRINK 6MM BLK',              '4003',   150,      0,  'C01', 'M'),  // MISSING
  row('200301',  'EMC CONDUIT 20MM',                 '4002',     0,     80,  'B02', 'M'),  // NEW
  row('200318',  'ADAPTOR M20-M25',                  '4002',    55,     55,  'B02'),
  row('200325',  'CRIMP LUG 16MM RING',              '4003',   280,    420,  'C01'),
  row('200333',  'CABLE MARKER SLEEVE 4MM',          '4003',   900,    900,  'C01'),
  row('200341',  'FUSE 2A 5x20MM',                   '1001',   180,    126,  'A06'),
  row('200358',  'FUSE HOLDER PANEL',                '1001',    40,     40,  'A06'),
  row('200366',  'BLANKING PLUG M20',                '4002',   420,    504,  'B02'),
  row('200374',  'TRUNKING LID 40MM',                '4002',    80,     80,  'B02', 'M'),
  row('200381',  'STEEL PANEL 2MM 500x400',          '2005',    10,      4,  'B02'),
]

export const summary = {
  totalTracked:  comparison.length,
  totalFlagged:  comparison.filter(r => r.status === 'FLAGGED').length,
  totalNew:      comparison.filter(r => r.status === 'NEW').length,
  totalMissing:  comparison.filter(r => r.status === 'MISSING').length,
  lastSnapshotDate: today,
}

// 7-day trend data for the mock dev server
const baseDate = new Date()
export const trend = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(baseDate)
  d.setDate(d.getDate() - (6 - i))
  const tracked = 36 + Math.floor(Math.random() * 8)
  const flagged = 2 + Math.floor(Math.random() * 6)
  return {
    snapshotDate: d.toISOString().slice(0, 10),
    totalTracked: tracked,
    flagged,
  }
})
