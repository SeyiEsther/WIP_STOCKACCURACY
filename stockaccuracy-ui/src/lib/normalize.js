export function norm(r) {
  return {
    materialNumber: r.materialNumber ?? r.MaterialNumber,
    materialDesc:   r.materialDesc   ?? r.MaterialDesc,
    sLoc:           r.sLoc           ?? r.SLoc,
    qtyYesterday:   r.qtyYesterday   ?? r.QtyYesterday,
    qtyToday:       r.qtyToday       ?? r.QtyToday,
    delta:          r.delta          ?? r.Delta,
    pctChange:      r.pctChange      ?? r.PctChange,
    status:         r.status         ?? r.Status,
    baseUnit:       r.baseUnit       ?? r.BaseUnit,
    mrpController:  r.mrpController  ?? r.MRPController,
    todayDate:      r.todayDate      ?? r.TodayDate,
    yesterdayDate:  r.yesterdayDate  ?? r.YesterdayDate,
    unitValue:      r.unitValue      ?? r.UnitValue ?? null,
  }
}

export function iid(mat, sloc) { return `${mat}__${sloc}` }
