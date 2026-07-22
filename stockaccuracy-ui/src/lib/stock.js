// ─── stock.js — the two rules that decide how a row is labelled ──────────────
//
// These helpers are kept in one place so the table, the charts and the
// notification panel all classify a row the exact same way. If the definition of
// "flagged" ever needs to change, it changes here once and everywhere follows.

// ─── shared stock-status logic ──────────────────────────────────────────────
import { iid } from './normalize.js'

// A row is "flagged" when its absolute % change exceeds the threshold.
export function isFlagged(row, threshold) {
  return Math.abs(row?.pctChange ?? 0) > threshold
}

// Derive the display status for a comparison row.
// NEW / MISSING come straight from the snapshot; otherwise a flagged row is
// UP / DOWN (or INVESTIGATED once acknowledged), and everything else is OK.
export function deriveStatus(row, threshold, investigated) {
  if (row.status === 'NEW')     return 'NEW'
  if (row.status === 'MISSING') return 'MISSING'
  if (isFlagged(row, threshold)) {
    if (investigated?.[iid(row.materialNumber, row.sLoc)]) return 'INVESTIGATED'
    return (row.delta ?? 0) >= 0 ? 'UP' : 'DOWN'
  }
  return 'OK'
}
