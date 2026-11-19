export interface Snapshot {
  date: string
  total_value: number
  illiquid_assets_value: number
  liabilities_value: number | null
}

export interface AllocationRow {
  category: string
  value: number
  weight_pct: number
  target_pct: number
  drift_pp: number
  status: 'over' | 'under' | 'on target'
}

export interface TargetAllocation {
  liquid_total: number
  rows: AllocationRow[]
  band_pp: number
  monthly_investment: number
  new_money: { category: string; amount: number }[]
}

export interface Fire {
  net_worth: number
  annual_expenses: number | null
  fire_number: number | null
  implied_fire_number: number | null
  progress_pct: number | null
}

export interface Indmoney {
  fetched_at: string
  liabilities: {
    total: number
    credit_cards: { name: string; total_due: number; due_date?: string }[]
  }
}

export interface Regime {
  pct_above_sma: number
  uptrend: boolean
}

export interface Concentration {
  holdings: { symbol: string; weight_pct: number }[]
  top2_pct: number
}

export interface UsHolding {
  ticker: string
  value_inr: number
  day_change_pct: number | null
  pnl_pct?: number
  verdict: 'REVIEW' | 'WATCH' | 'HOLD'
  reasons?: string[]
}

export interface IndiaHolding {
  symbol: string
  value: number
  weight_pct: number
  verdict: 'TRIM' | 'REVIEW' | 'WATCH' | 'HOLD'
  reasons: string[]
  momentum_6mo: number | null
}

export interface MutualFund {
  scheme_name: string
  value: number
  scheme_category: string | null
}

export interface OtherAsset {
  name: string
  category: string
  value: number
  liquid: number
  note: string
}

export interface BenchmarkPoint {
  date: string
  value: number
}

export interface Benchmark {
  start_date: string
  start_value: number
  nifty: BenchmarkPoint[]
  gold: BenchmarkPoint[]
  fd: BenchmarkPoint[]
}

/** One name on the momentum leaderboard, 6-month return in percent. */
export interface LeaderPick {
  symbol: string
  momentum: number | null
}

export interface AlgoBacktest {
  sharpe: number
  return_pct: number
  max_dd_pct: number
  baseline_sharpe: number
  baseline_return_pct: number
  baseline_max_dd_pct: number
  folds: string
  note: string
}

export interface AlgoComparison {
  regime_uptrend: boolean
  trailing_stop_pct: number
  trailing_stop_backtest: AlgoBacktest | null
}

export interface Simulation {
  id: string
  name: string
  description: string
  started_date: string
  starting_cash: number
  current_value: number
  return_pct: number
}

export interface EdgeRule {
  events: number
  net_mean: number | null
  hit_rate: number | null
  t_net: number | null
  net_first_half: number | null
  net_second_half: number | null
}

export interface EdgeSummary {
  verdict: string
  rule: EdgeRule | null
  minEvents: number | null
  minT: number | null
  posts: number | null
}

export interface VestedData {
  loaded: boolean
  /** When these numbers were fetched (ms), so the page can say how fresh they are. */
  asOf: number | null
  /** True while the numbers on screen came from the last visit and a refresh is under way. */
  refreshing: boolean
  snapshots: Snapshot[]
  fire: Fire | null
  allocation: TargetAllocation | null
  indmoney: Indmoney | null
  healthProblems: string[]
  regime: Regime | null
  concentration: Concentration | null
  usHoldings: UsHolding[]
  indiaHoldings: IndiaHolding[]
  funds: MutualFund[]
  otherAssets: OtherAsset[]
  benchmark: Benchmark | null
  leaders: LeaderPick[]
  algo: AlgoComparison | null
  sims: Simulation[]
  edge: EdgeSummary | null
}

/** Deterministic sample series so the demo looks the same on every visit. */
function series(): Snapshot[] {
  const out: Snapshot[] = []
  let v = 15_200_000
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (let i = 400; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000)
    v *= 1 + (rand() - 0.46) * 0.004 + 0.0008
    // Two real-looking days: a sharp fall and a sharp jump, so the chart has something to mark.
    if (i === 300) v *= 0.972
    if (i === 150) v *= 1.026
    out.push({
      date: d.toISOString().slice(0, 10),
      total_value: Math.round(v),
      illiquid_assets_value: 6_300_000,
      liabilities_value: 210_000,
    })
  }
  // Land exactly on the figure the rest of the demo is built around.
  const scale = 15_800_000 / out[out.length - 1].total_value
  return out.map((x) => ({ ...x, total_value: Math.round(x.total_value * scale) }))
}

const snapshots = series()

/** A quieter index to compare against, on the same dates. */
function niftySeries() {
  let v = 22_000
  return snapshots.map((x, i) => ({
    date: x.date,
    value: Math.round((v *= 1 + Math.sin(i / 7) * 0.002 + 0.0003)),
  }))
}
const latest = snapshots[snapshots.length - 1].total_value

const SAMPLE: VestedData = {
  loaded: true,
  asOf: Date.now(),
  refreshing: false,
  snapshots,
  fire: {
    net_worth: latest + 2_600_000,
    annual_expenses: 1_580_000,
    fire_number: 45_000_000,
    implied_fire_number: 39_500_000,
    progress_pct: 41,
  },
  allocation: {
    liquid_total: 12_100_000,
    band_pp: 5,
    monthly_investment: 50_000,
    rows: [
      { category: 'India equity', value: 7_000_000, weight_pct: 58, target_pct: 50, drift_pp: 8, status: 'over' },
      { category: 'US equity', value: 2_660_000, weight_pct: 22, target_pct: 25, drift_pp: -3, status: 'on target' },
      { category: 'Gold', value: 1_090_000, weight_pct: 9, target_pct: 15, drift_pp: -6, status: 'under' },
      { category: 'Cash and debt', value: 1_330_000, weight_pct: 11, target_pct: 10, drift_pp: 1, status: 'on target' },
    ],
    new_money: [{ category: 'Gold', amount: 24_000 }],
  },
  indmoney: {
    fetched_at: new Date().toISOString(),
    liabilities: {
      total: 210_000,
      credit_cards: [
        {
          name: 'Sample card',
          total_due: 48_200,
          due_date: new Date(Date.now() + 6 * 86_400_000).toISOString().slice(0, 10),
        },
      ],
    },
  },
  healthProblems: [],
  regime: { pct_above_sma: 5.8, uptrend: true },
  concentration: { holdings: [{ symbol: 'Reliance', weight_pct: 14 }, { symbol: 'HDFCBANK', weight_pct: 18 }], top2_pct: 32 },
  usHoldings: [
    { ticker: 'NVDA', value_inr: 900_000, day_change_pct: 2.4, verdict: 'HOLD', reasons: ['Up a lot this year. Nothing to do.'] },
    { ticker: 'MSFT', value_inr: 700_000, day_change_pct: -1.1, verdict: 'HOLD' },
    { ticker: 'VOO', value_inr: 600_000, day_change_pct: 0.6, verdict: 'HOLD' },
    { ticker: 'TSLA', value_inr: 300_000, day_change_pct: -2.9, verdict: 'REVIEW' },
  ],
  indiaHoldings: [
    { symbol: 'RELIANCE', value: 1_720_000, weight_pct: 14, verdict: 'TRIM', reasons: ['It is 14% of your liquid money and your limit is 10%.', 'Momentum is positive, so this is about size, not about the company.'], momentum_6mo: 0.061 },
    { symbol: 'HDFCBANK', value: 1_180_000, weight_pct: 10, verdict: 'HOLD', reasons: [], momentum_6mo: 0.097 },
    { symbol: 'INFY', value: 890_000, weight_pct: 7, verdict: 'HOLD', reasons: [], momentum_6mo: 0.032 },
    { symbol: 'IRCTC', value: 340_000, weight_pct: 3, verdict: 'WATCH', reasons: ['Three negative headlines since Monday, including an index removal.', 'It is a small position, so there is no urgency.'], momentum_6mo: -0.04 },
  ],
  funds: [
    { scheme_name: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth', value: 1_460_000, scheme_category: 'Flexi cap' },
    { scheme_name: 'UTI Nifty 50 Index Fund - Direct Plan - Growth', value: 910_000, scheme_category: 'Index' },
  ],
  otherAssets: [
    { name: 'Sovereign Gold Bond', category: 'Gold', value: 1_090_000, liquid: 1, note: 'Gold is 6 points under its 15% target. This month’s Rs 24,000 goes here.' },
    { name: 'EPF', category: 'Retirement', value: 3_100_000, liquid: 0, note: '' },
  ],
  benchmark: {
    start_date: snapshots[0].date,
    start_value: 22_000,
    nifty: niftySeries(),
    gold: [],
    fd: [],
  },
  leaders: [
    { symbol: 'BEL.NS', momentum: 38 },
    { symbol: 'TRENT.NS', momentum: 31 },
    { symbol: 'PERSISTENT.NS', momentum: 27 },
    { symbol: 'RELIANCE.NS', momentum: 6.1 },
    { symbol: 'SUNPHARMA.NS', momentum: 22 },
  ],
  algo: {
    regime_uptrend: true,
    trailing_stop_pct: 12,
    trailing_stop_backtest: {
      sharpe: 0.91,
      return_pct: 14.2,
      max_dd_pct: -17.5,
      baseline_sharpe: 0.72,
      baseline_return_pct: 9.1,
      baseline_max_dd_pct: -24.8,
      folds: '5 folds',
      note: '',
    },
  },
  sims: [
    {
      id: 'm5',
      name: 'Momentum, top 5',
      description: 'Monthly rebalance on paper money.',
      started_date: '2026-01-02',
      starting_cash: 1_000_000,
      current_value: 1_042_000,
      return_pct: 4.2,
    },
    {
      id: 'dip',
      name: 'Quality dip-buy',
      description: '',
      started_date: '2026-03-02',
      starting_cash: 1_000_000,
      current_value: 1_031_000,
      return_pct: 3.1,
    },
  ],
  edge: {
    verdict: 'No edge found. Do not trade it.',
    rule: {
      events: 146,
      net_mean: -0.0036,
      hit_rate: 0.43,
      t_net: -1.2,
      net_first_half: -0.0021,
      net_second_half: -0.0051,
    },
    minEvents: 100,
    minT: 3,
    posts: 18316,
  },
}

/** The demo has no server: it always shows the same sample data. */
export function useVestedData(): VestedData {
  return SAMPLE
}
