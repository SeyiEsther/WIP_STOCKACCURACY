// ─── normalize.js — smooth over inconsistent field names from the API ────────
//
// Why this file exists: depending on how the backend serialises a row, a field
// can arrive either as "MaterialNumber" (PascalCase) or "materialNumber"
// (camelCase). Rather than checking for both everywhere in the UI, we run every
// row through norm() once so the rest of the app can rely on a single, tidy
// camelCase shape. The `??` operator means "use the left value, or the right one
// if the left is null/undefined".

// ─── normalise API field names (PascalCase or camelCase) ────────────────────
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
    abcClass:       r.abcClass       ?? r.aBCClass ?? r.ABCClass ?? r.AbcClass ?? null,
  }
}

// A material only becomes unique when paired with its storage location, so we
// build a single "identity" string (e.g. "433901__0001") to use as a lookup key
// — for example when remembering which rows have been investigated.
export function iid(mat, sloc) { return `${mat}__${sloc}` }
