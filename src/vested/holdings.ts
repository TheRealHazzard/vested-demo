/**
 * One list of everything you own, built from the four places TradingBot keeps it:
 * Indian stocks, mutual funds, US holdings and everything else (gold, EPF and so on).
 * Pure functions, so the ranking and the verdict wording can be tested on their own.
 */
import type { VestedData } from './useVestedData'

export type Lens = 'All' | 'India' | 'Funds' | 'US' | 'Other'
export type Verdict = 'Trim' | 'Review' | 'Watch' | 'Keep'

export const LENSES: Lens[] = ['All', 'India', 'Funds', 'US', 'Other']

export interface Holding {
  id: string
  name: string
  lens: Exclude<Lens, 'All'>
  /** Longer than the lens: "India equity", "Mutual fund", "Gold". */
  kind: string
  value: number
  /** Percent of everything listed. */
  share: number
  today: number | null
  sixMonth: number | null
  verdict: Verdict | null
  /** Plain words: why this verdict, or that there is nothing to do. */
  why: string
}

const VERDICT: Record<string, Verdict> = {
  TRIM: 'Trim',
  REVIEW: 'Review',
  WATCH: 'Watch',
  HOLD: 'Keep',
}

/** Funds come back with long registry names; keep the part a person would say. */
export function shortFundName(name: string): string {
  return name
    .replace(/\s*-\s*(direct|regular)\b.*$/i, '')
    .replace(/\s+(direct|regular)\s+(plan|growth).*$/i, '')
    .replace(/\s+fund$/i, '')
    .trim()
}

export function buildHoldings(d: VestedData): Holding[] {
  const rows: Omit<Holding, 'share'>[] = []

  for (const h of d.indiaHoldings) {
    rows.push({
      id: `in-${h.symbol}`,
      name: h.symbol,
      lens: 'India',
      kind: 'India equity',
      value: h.value,
      today: null,
      sixMonth: h.momentum_6mo === null ? null : h.momentum_6mo * 100,
      verdict: VERDICT[h.verdict] ?? null,
      why: h.reasons.length ? h.reasons.join(' ') : 'No flags. Nothing to do.',
    })
  }

  for (const f of d.funds) {
    rows.push({
      id: `mf-${f.scheme_name}`,
      name: shortFundName(f.scheme_name),
      lens: 'Funds',
      kind: f.scheme_category ?? 'Mutual fund',
      value: f.value,
      today: null,
      sixMonth: null,
      verdict: null,
      why: 'Funds are judged on cost and overlap in Signals, not on a single day.',
    })
  }

  for (const u of d.usHoldings) {
    rows.push({
      id: `us-${u.ticker}`,
      name: u.ticker,
      lens: 'US',
      kind: 'US holding',
      value: u.value_inr,
      today: u.day_change_pct,
      sixMonth: null,
      verdict: VERDICT[u.verdict] ?? null,
      why: u.reasons?.length ? u.reasons.join(' ') : 'No flags. Nothing to do.',
    })
  }

  for (const a of d.otherAssets) {
    rows.push({
      id: `ot-${a.name}`,
      name: a.name,
      lens: 'Other',
      kind: a.category,
      value: a.value,
      today: null,
      sixMonth: null,
      verdict: null,
      why: a.note || (a.liquid ? 'Counted as liquid.' : 'Not counted as liquid money.'),
    })
  }

  const total = rows.reduce((sum, r) => sum + r.value, 0) || 1
  return rows
    .map((r) => ({ ...r, share: (r.value / total) * 100 }))
    .sort((a, b) => b.value - a.value)
}

export function lensCounts(all: Holding[]): Record<Lens, number> {
  return {
    All: all.length,
    India: all.filter((h) => h.lens === 'India').length,
    Funds: all.filter((h) => h.lens === 'Funds').length,
    US: all.filter((h) => h.lens === 'US').length,
    Other: all.filter((h) => h.lens === 'Other').length,
  }
}

/** The question this page answers, in one sentence for the title. */
export function offBalance(d: VestedData): number {
  return d.allocation?.rows.filter((r) => r.status !== 'on target').length ?? 0
}

/** Where each target boundary falls along a 0 to 100 ribbon (the last, at 100, is left out). */
export function targetBoundaries(rows: { target_pct: number }[]): number[] {
  const out: number[] = []
  let run = 0
  for (const r of rows.slice(0, -1)) {
    run += r.target_pct
    out.push(run)
  }
  return out
}
