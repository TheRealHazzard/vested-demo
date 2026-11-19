/**
 * Pure functions that turn TradingBot's raw outputs into what Today shows:
 * the ranked "needs you" list, the net-worth series for each range, and the
 * projected path to the goal. No React in here, so it can be tested alone.
 */
import { inr, shortDate, shortDateYear } from './format'
import type { BenchmarkPoint, VestedData } from './useVestedData'

// ---------- needs you ----------

export interface Need {
  id: string
  hot: boolean
  tag: string
  chip: 'ember' | 'steel' | 'up' | 'plain'
  title: string
  detail: string
  href: string
}

const DAY = 86_400_000

export function buildNeeds(d: VestedData): Need[] {
  const hot: Need[] = []
  const warm: Need[] = []
  const calm: Need[] = []

  if (d.healthProblems.some((p) => p.toLowerCase().includes('broker login'))) {
    hot.push({
      id: 'login',
      hot: true,
      tag: 'Login',
      chip: 'ember',
      title: 'Your broker login expired',
      detail: 'Log in to OpenAlgo with your MPIN and TOTP so the numbers can refresh.',
      href: '#',
    })
  }

  for (const card of d.indmoney?.liabilities.credit_cards ?? []) {
    if (card.total_due <= 0) continue
    hot.push({
      id: `card-${card.name}`,
      hot: true,
      tag: 'Pay',
      chip: 'ember',
      title: `${card.name} bill is due`,
      detail: `${inr(card.total_due)}${card.due_date ? ` by ${shortDate(card.due_date)}` : ''}. Pay it in full.`,
      href: '#',
    })
  }

  for (const h of d.concentration?.holdings ?? []) {
    if (h.weight_pct < 15) continue
    const big = h.weight_pct >= 25
    const item: Need = {
      id: `conc-${h.symbol}`,
      hot: big,
      tag: 'Trim',
      chip: 'ember',
      title: `${h.symbol} is too big`,
      detail: `${h.weight_pct.toFixed(0)}% of everything you hold. One stock should not carry the plan.`,
      href: '#',
    }
    ;(big ? hot : warm).push(item)
  }

  const alloc = d.allocation
  if (alloc) {
    const under = alloc.rows.filter((r) => r.status === 'under')
    if (under.length && alloc.new_money.length) {
      const top = alloc.new_money[0]
      warm.push({
        id: 'invest',
        hot: false,
        tag: 'Invest',
        chip: 'plain',
        title: `${inr(top.amount)} for ${top.category}`,
        detail: `${top.category} is under its target. This month's money fills the gap first, so nothing has to be sold.`,
        href: '#',
      })
    }
    for (const r of alloc.rows.filter((x) => x.status === 'over')) {
      calm.push({
        id: `over-${r.category}`,
        hot: false,
        tag: 'Hold',
        chip: 'plain',
        title: `Stop adding to ${r.category}`,
        detail: `${r.weight_pct.toFixed(0)}% against a ${r.target_pct}% target.`,
        href: '#',
      })
    }
  }

  const reds = d.usHoldings.filter((h) => h.verdict === 'REVIEW')
  if (reds.length) {
    warm.push({
      id: 'us-review',
      hot: false,
      tag: 'Watch',
      chip: 'steel',
      title: `${reds
        .map((h) => h.ticker)
        .slice(0, 2)
        .join(' and ')} flagged for review`,
      detail: 'A US holding has crossed one of its review rules.',
      href: '#',
    })
  }

  if (d.regime && !d.regime.uptrend) {
    calm.push({
      id: 'regime',
      hot: false,
      tag: 'Watch',
      chip: 'steel',
      title: 'The market is below its trend',
      detail: `Nifty 50 is ${Math.abs(d.regime.pct_above_sma).toFixed(1)}% under its 200-day average.`,
      href: '#',
    })
  }

  const others = d.healthProblems.filter((p) => !p.toLowerCase().includes('broker login'))
  if (others.length) {
    warm.push({
      id: 'health',
      hot: false,
      tag: 'System',
      chip: 'plain',
      title: `${others.length} system check${others.length > 1 ? 's' : ''} failing`,
      detail: others[0],
      href: '#',
    })
  }

  if (d.indmoney && Date.now() - new Date(d.indmoney.fetched_at).getTime() > 30 * DAY) {
    warm.push({
      id: 'stale',
      hot: false,
      tag: 'Sync',
      chip: 'plain',
      title: 'IndMoney data is over a month old',
      detail: 'Sync it so net worth and liabilities are current.',
      href: '#',
    })
  }

  return [...hot, ...warm, ...calm]
}

// ---------- the chart ----------

export type RangeKey = '1M' | '6M' | '1Y' | 'All' | 'Path'

/** The chart is drawn in a fixed box and scaled by CSS, so every range shares one coordinate space. */
export const BOX = { w: 760, h: 290, top: 24, bottom: 262 }

/** One point a finger can land on: where it is drawn, what it is worth, and when. */
export interface ScrubPoint {
  x: number
  y: number
  value: number
  label: string
  /** Set on the few points that mark something worth knowing about. */
  note?: string
}

/** A mark on the line: the biggest day up or down in the range. */
export interface ChartEvent {
  x: number
  y: number
  tone: 'up' | 'down'
  label: string
  note: string
}

export interface Plot {
  scrub: ScrubPoint[]
  events: ChartEvent[]
  line: string
  area: string
  /** The same money in the Nifty, if asked for. */
  bench: string | null
  benchGain: number | null
  benchValue: number | null
  end: { x: number; y: number } | null
  from: string
  to: string
  gain: number | null
  enough: boolean
}

const EMPTY_PLOT: Plot = {
  scrub: [],
  events: [],
  line: '',
  area: '',
  bench: null,
  benchGain: null,
  benchValue: null,
  end: null,
  from: '',
  to: '',
  gain: null,
  enough: false,
}

const RANGE_DAYS: Record<Exclude<RangeKey, 'Path'>, number> = {
  '1M': 31,
  '6M': 183,
  '1Y': 366,
  All: Number.POSITIVE_INFINITY,
}

function toPath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
}

/** The benchmark's value on or before a date (or its first value, for dates before it starts). */
function benchAt(series: BenchmarkPoint[], time: number): number | null {
  if (!series.length) return null
  let value = series[0].value
  for (const p of series) {
    if (new Date(p.date).getTime() > time) break
    value = p.value
  }
  return value
}

/** The biggest single-day rise and fall, when each is large enough to be worth a mark. */
function findEvents(
  pts: VestedData['snapshots'],
  xy: { x: number; y: number }[],
  fmt: (iso: string) => string
): ChartEvent[] {
  let up = { i: -1, pct: 0 }
  let down = { i: -1, pct: 0 }
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1].total_value
    if (!prev) continue
    const pct = ((pts[i].total_value - prev) / prev) * 100
    if (pct > up.pct) up = { i, pct }
    if (pct < down.pct) down = { i, pct }
  }
  const out: ChartEvent[] = []
  const add = (hit: { i: number; pct: number }, tone: 'up' | 'down') => {
    if (hit.i < 0 || Math.abs(hit.pct) < 1) return
    const change = pts[hit.i].total_value - pts[hit.i - 1].total_value
    out.push({
      x: xy[hit.i].x,
      y: xy[hit.i].y,
      tone,
      label: fmt(pts[hit.i].date),
      note: `Biggest one-day ${tone === 'up' ? 'rise' : 'fall'} here: ${hit.pct > 0 ? '+' : '−'}${Math.abs(hit.pct).toFixed(1)}% (${change > 0 ? '+' : '−'}${inr(Math.abs(change))})`,
    })
  }
  add(up, 'up')
  add(down, 'down')
  return out
}

/** Net worth over a range, filling the full width. Fewer than two points means there is nothing honest to draw. */
export function plotRange(
  snapshots: VestedData['snapshots'],
  key: Exclude<RangeKey, 'Path'>,
  bench?: BenchmarkPoint[]
): Plot {
  const latest = snapshots.at(-1)
  if (!latest) return EMPTY_PLOT
  const cutoff = new Date(latest.date).getTime() - RANGE_DAYS[key] * DAY
  const pts = snapshots.filter((s) => new Date(s.date).getTime() >= cutoff)
  if (pts.length < 2) return EMPTY_PLOT
  // A year or more back needs the year to be unambiguous.
  const fmt = key === '1Y' || key === 'All' ? shortDateYear : shortDate
  const t0 = new Date(pts[0].date).getTime()
  const t1 = new Date(pts[pts.length - 1].date).getTime()
  const vals = pts.map((p) => p.total_value)

  // The same starting money, had it been in the Nifty instead.
  const startBench = bench ? benchAt(bench, t0) : null
  const benchVals =
    bench && startBench
      ? pts.map(
          (p) => ((benchAt(bench, new Date(p.date).getTime()) ?? startBench) / startBench) * vals[0]
        )
      : null

  const all = benchVals ? [...vals, ...benchVals] : vals
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const span = hi - lo || 1
  const yOf = (v: number) => BOX.bottom - ((v - lo) / span) * (BOX.bottom - BOX.top - 16) - 8
  const xOf = (iso: string) =>
    t1 === t0 ? 0 : ((new Date(iso).getTime() - t0) / (t1 - t0)) * BOX.w
  const xy = pts.map((p) => ({ x: xOf(p.date), y: yOf(p.total_value) }))
  const line = toPath(xy)
  const end = xy[xy.length - 1]
  const events = findEvents(pts, xy, fmt)
  return {
    scrub: pts.map((p, i) => ({
      x: xy[i].x,
      y: xy[i].y,
      value: p.total_value,
      label: fmt(p.date),
      note: events.find((e) => e.x === xy[i].x && e.y === xy[i].y)?.note,
    })),
    events,
    line,
    area: `${line} L${end.x.toFixed(1)} ${BOX.bottom} L0 ${BOX.bottom} Z`,
    bench: benchVals ? toPath(pts.map((p, i) => ({ x: xOf(p.date), y: yOf(benchVals[i]) }))) : null,
    benchValue: benchVals ? benchVals[benchVals.length - 1] : null,
    benchGain: benchVals ? benchVals[benchVals.length - 1] - vals[0] : null,
    end,
    from: fmt(pts[0].date),
    to: 'Today',
    gain: vals[vals.length - 1] - vals[0],
    enough: true,
  }
}

// ---------- the path to the goal ----------

export const ASSUMED_RETURN = 7
export const HORIZON_MONTHS = 180

/** Month-by-month value, saving a fixed amount each month and compounding monthly. */
export function simulate(
  start: number,
  monthly: number,
  annualPct: number,
  /** An optional one-off fall (a fraction, 0.35 for 35%) at a given month. */
  shock?: { month: number; fall: number }
): number[] {
  const m = (1 + annualPct / 100) ** (1 / 12) - 1
  const out = [start]
  let w = start
  for (let t = 1; t <= HORIZON_MONTHS; t++) {
    w = w * (1 + m) + monthly
    if (shock && t === shock.month) w *= 1 - shock.fall
    out.push(w)
  }
  return out
}

/**
 * The monthly saving that lands exactly on the goal after `months`, at a steady yearly return.
 * The closed form of the same compounding `simulate` uses, so dragging the goal date and reading
 * back the saving always agrees with the drawn line.
 */
export function requiredMonthly(
  start: number,
  goal: number,
  months: number,
  annualPct: number
): number {
  const m = (1 + annualPct / 100) ** (1 / 12) - 1
  const g = (1 + m) ** months
  if (m === 0) return Math.max((goal - start) / months, 0)
  return Math.max(((goal - start * g) * m) / (g - 1), 0)
}

export function monthsToGoal(series: number[], goal: number): number | null {
  const i = series.findIndex((v) => v >= goal)
  return i < 0 ? null : i
}

export function yearOf(monthsFromNow: number, now = new Date()): number {
  return new Date(now.getFullYear(), now.getMonth() + monthsFromNow, 1).getFullYear()
}

function monthLabel(monthsFromNow: number, now = new Date()): string {
  return new Date(now.getFullYear(), now.getMonth() + monthsFromNow, 1).toLocaleDateString(
    'en-IN',
    { month: 'short', year: 'numeric' }
  )
}

export interface PathPlot {
  scrub: ScrubPoint[]
  history: string
  historyArea: string
  today: { x: number; y: number }
  base: string
  cone: string
  goalY: number
  goalHit: { x: number; y: number } | null
  goalYear: number | null
  earliestYear: number | null
  latestYear: number | null
  fromLabel: string
  toLabel: string
}

export const TODAY_X = 200

/** History squeezed into the left quarter, then the projection fanning out to the goal. */
export function plotPath(
  snapshots: VestedData['snapshots'],
  start: number,
  goal: number,
  monthly: number,
  returnPct: number = ASSUMED_RETURN,
  shock?: { month: number; fall: number }
): PathPlot {
  const base = simulate(start, monthly, returnPct, shock)
  const hi = simulate(start, monthly, returnPct + 3, shock)
  const lo = simulate(start, monthly, Math.max(returnPct - 3, 1), shock)
  const vals = snapshots.map((s) => s.total_value)
  const lowest = Math.min(start, ...(vals.length ? vals : [start]))
  const top = Math.max(goal * 1.08, start)
  const yOf = (v: number) =>
    BOX.bottom -
    ((Math.min(Math.max(v, lowest), top) - lowest) / (top - lowest || 1)) *
      (BOX.bottom - BOX.top - 20) -
    6
  const xOf = (m: number) => TODAY_X + (m / HORIZON_MONTHS) * (BOX.w - TODAY_X)
  const step = (s: number[]) =>
    s.map((v, m) => ({ x: xOf(m), y: yOf(v) })).filter((_, m) => m % 3 === 0 || m === s.length - 1)
  // Nothing past the goal is interesting, so each line stops at it.
  const upTo = (s: number[]) => {
    const i = monthsToGoal(s, goal)
    return (i === null ? s : s.slice(0, i + 1)).map((v) => Math.min(v, goal))
  }

  let histPts: { x: number; y: number }[] = []
  if (snapshots.length >= 2) {
    const t0 = new Date(snapshots[0].date).getTime()
    const t1 = new Date(snapshots[snapshots.length - 1].date).getTime()
    histPts = snapshots.map((s) => ({
      x: t1 === t0 ? 0 : ((new Date(s.date).getTime() - t0) / (t1 - t0)) * TODAY_X,
      y: yOf(s.total_value),
    }))
  }
  const today = { x: TODAY_X, y: yOf(start) }
  const history = toPath(histPts.length ? [...histPts.slice(0, -1), today] : [today])
  const hitMonth = monthsToGoal(base, goal)
  const lastMonth = hitMonth ?? HORIZON_MONTHS
  const scrub: ScrubPoint[] = [
    ...snapshots.map((snap, i) => ({
      x: histPts[i]?.x ?? 0,
      y: histPts[i]?.y ?? today.y,
      value: snap.total_value,
      label: shortDate(snap.date),
    })),
    ...base.slice(1, lastMonth + 1).map((v, i) => ({
      x: xOf(i + 1),
      y: yOf(Math.min(v, goal)),
      value: v,
      label: monthLabel(i + 1),
    })),
  ]
  const upper = step(upTo(hi))
  const lower = step(upTo(lo)).reverse()
  const cone = `${toPath(upper)} ${lower.map((p) => `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')} Z`
  const earliest = monthsToGoal(hi, goal)
  const latest = monthsToGoal(lo, goal)
  return {
    scrub,
    history,
    historyArea: `${history} L${TODAY_X} ${BOX.bottom} L0 ${BOX.bottom} Z`,
    today,
    base: toPath(step(upTo(base))),
    cone,
    goalY: yOf(goal),
    goalHit: hitMonth === null ? null : { x: xOf(hitMonth), y: yOf(goal) },
    goalYear: hitMonth === null ? null : yearOf(hitMonth),
    earliestYear: earliest === null ? null : yearOf(earliest),
    latestYear: latest === null ? null : yearOf(latest),
    fromLabel: snapshots[0] ? shortDate(snapshots[0].date) : '',
    toLabel: String(yearOf(HORIZON_MONTHS)),
  }
}
