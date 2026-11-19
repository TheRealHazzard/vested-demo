/**
 * What the bots are saying, shaped for the Signals page: this week's momentum picks (and
 * whether you already own them), how each strategy is doing, and the verdict on the
 * sentiment experiment. Verdicts are plain and honest: "No edge found" is a result, not a gap.
 */
import { signedPct } from './format'
import type { VestedData } from './useVestedData'

export type SignalTab = 'Live' | 'Strategies' | 'Lab'
export const SIGNAL_TABS: SignalTab[] = ['Live', 'Strategies', 'Lab']

export interface Pick {
  rank: number
  symbol: string
  momentum: number | null
  owned: boolean
}

export function picks(d: VestedData, limit = 5): Pick[] {
  const owned = new Set([
    ...d.indiaHoldings.map((h) => h.symbol.toUpperCase()),
    ...d.usHoldings.map((h) => h.ticker.toUpperCase()),
  ])
  return d.leaders.slice(0, limit).map((l, i) => ({
    rank: i + 1,
    symbol: l.symbol,
    momentum: l.momentum,
    owned: owned.has(l.symbol.toUpperCase().replace(/\.NS$/, '')),
  }))
}

export type StrategyVerdict = 'Ahead' | 'Behind' | 'Running'

export interface StrategyRow {
  id: string
  name: string
  note: string
  /** Return in percent. */
  result: number
  /** The plain approach it is compared with, in percent, if there is one. */
  against: number | null
  detail: string | null
  verdict: StrategyVerdict
}

export function strategies(d: VestedData): StrategyRow[] {
  const rows: StrategyRow[] = []
  const bt = d.algo?.trailing_stop_backtest
  if (bt) {
    rows.push({
      id: 'trailing',
      name: 'Trailing stop',
      note: `A ${d.algo?.trailing_stop_pct ?? '?'}% stop on each holding, replayed on past prices${bt.folds ? ` (${bt.folds})` : ''}`,
      result: bt.return_pct,
      against: bt.baseline_return_pct,
      detail: `Sharpe ${bt.sharpe.toFixed(2)} against ${bt.baseline_sharpe.toFixed(2)}. Worst fall ${bt.max_dd_pct.toFixed(0)}% against ${bt.baseline_max_dd_pct.toFixed(0)}%.`,
      verdict:
        bt.return_pct > bt.baseline_return_pct && bt.sharpe > bt.baseline_sharpe
          ? 'Ahead'
          : 'Behind',
    })
  }
  for (const s of d.sims) {
    rows.push({
      id: `sim-${s.id}`,
      name: s.name,
      note: `Paper money since ${s.started_date}`,
      result: s.return_pct,
      against: null,
      detail: s.description || null,
      verdict: 'Running',
    })
  }
  return rows
}

export type EdgeKind = 'none' | 'promising' | 'early'

export interface EdgeView {
  kind: EdgeKind
  headline: string
  verdict: string
  metrics: { label: string; value: string; negative: boolean }[]
  halves: { label: string; value: number }[]
  rule: string | null
}

/** The sentiment experiment, in the words a person would use. */
export function edgeView(d: VestedData): EdgeView | null {
  const e = d.edge
  if (!e) return null
  const v = e.verdict.toLowerCase()
  const kind: EdgeKind = v.startsWith('promising')
    ? 'promising'
    : v.startsWith('not enough')
      ? 'early'
      : 'none'
  const r = e.rule
  const headline =
    kind === 'promising'
      ? 'Reddit mood looks promising. Keep watching.'
      : kind === 'early'
        ? 'Not enough data to judge Reddit mood yet.'
        : 'Reddit mood did not beat the market.'
  const metrics: EdgeView['metrics'] = []
  if (r) {
    metrics.push({ label: 'Events', value: String(r.events), negative: false })
    if (r.net_mean !== null) {
      metrics.push({
        label: 'Net per trade',
        value: signedPct(r.net_mean * 100, 2),
        negative: r.net_mean < 0,
      })
    }
    if (r.hit_rate !== null) {
      metrics.push({
        label: 'Hit rate',
        value: `${(r.hit_rate * 100).toFixed(0)}%`,
        negative: false,
      })
    }
  }
  const halves: EdgeView['halves'] = []
  if (r?.net_first_half !== null && r?.net_first_half !== undefined) {
    halves.push({ label: 'First half', value: r.net_first_half * 100 })
  }
  if (r?.net_second_half !== null && r?.net_second_half !== undefined) {
    halves.push({ label: 'Second half', value: r.net_second_half * 100 })
  }
  const rule =
    e.minEvents !== null && e.minT !== null
      ? `A verdict of promising needs at least ${e.minEvents} events, a profit after costs, a t-statistic above ${e.minT}, and a profit in both halves.`
      : null
  return { kind, headline, verdict: e.verdict, metrics, halves, rule }
}

export function signalsHeadline(
  d: VestedData,
  tab: SignalTab
): { lead: string; em: string; tail: string } {
  if (tab === 'Live') {
    const n = d.leaders.length ? Math.min(d.leaders.length, 5) : 0
    return n
      ? { lead: `${n} picks this week. `, em: 'No orders', tail: ' placed.' }
      : { lead: 'Nothing on the ', em: 'leaderboard', tail: ' yet.' }
  }
  if (tab === 'Strategies') {
    const rows = strategies(d)
    const ahead = rows.filter((r) => r.verdict === 'Ahead').length
    return rows.length === 0
      ? { lead: 'No strategies ', em: 'running', tail: ' yet.' }
      : ahead > 0
        ? { lead: '', em: `${ahead} of ${rows.length}`, tail: ' beat the plain approach.' }
        : { lead: 'None of them ', em: 'beat', tail: ' the plain approach yet.' }
  }
  const v = edgeView(d)
  if (!v) return { lead: 'The lab has ', em: 'nothing', tail: ' to report yet.' }
  return v.kind === 'none'
    ? { lead: 'Reddit mood ', em: 'did not', tail: ' beat the market.' }
    : v.kind === 'promising'
      ? { lead: 'Reddit mood looks ', em: 'promising.', tail: '' }
      : { lead: 'Too ', em: 'early', tail: ' to judge Reddit mood.' }
}
