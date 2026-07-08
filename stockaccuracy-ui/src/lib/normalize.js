// ─── normalise API field names (PascalCase or camelCase) ────────────────────
export function norm(r) {
  return {
    materialNumber: r.materialNumber ?? r.MaterialNumber ?? '',
    materialDesc:   r.materialDesc   ?? r.MaterialDesc   ?? '',
    sLoc:           r.sLoc           ?? r.SLoc           ?? '',
    qtyYesterday:   r.qtyYesterday   ?? r.QtyYesterday   ?? 0,
    qtyToday:       r.qtyToday       ?? r.QtyToday       ?? 0,
    delta:          r.delta          ?? r.Delta          ?? 0,
    pctChange:      r.pctChange      ?? r.PctChange      ?? 0,
    status:         r.status         ?? r.Status         ?? '',
    abcClass:       r.abcClass       ?? r.AbcClass       ?? null,
    usageCount:     r.usageCount     ?? r.UsageCount     ?? null,
    baseUnit:       r.baseUnit       ?? r.BaseUnit       ?? '',
    mrpController:  r.mrpController  ?? r.MRPController  ?? null,
    todayDate:      r.todayDate      ?? r.TodayDate,
    yesterdayDate:  r.yesterdayDate  ?? r.YesterdayDate,
    unitValue:      r.unitValue      ?? r.UnitValue      ?? null,
  }
}

export function iid(mat, sloc) { return `${mat}__${sloc}` }

export function exportRowsCsv(rows, filename) {
  const esc = (v) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const headers = [
    'MaterialNumber', 'MaterialDesc', 'SLoc', 'AbcClass',
    'QtyYesterday', 'QtyToday', 'Delta', 'PctChange', 'Status',
  ]
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      esc(r.materialNumber), esc(r.materialDesc), esc(r.sLoc), esc(r.abcClass ?? ''),
      r.qtyYesterday, r.qtyToday, r.delta, r.pctChange, esc(r.status),
    ].join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
