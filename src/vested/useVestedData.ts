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
  verdict: 'REVIEW' | 'WATCH' | 'HOLD'
}

export interface EdgeSummary {
  verdict: string
}

export interface VestedData {
  loaded: boolean
  snapshots: Snapshot[]
  fire: Fire | null
  allocation: TargetAllocation | null
  indmoney: Indmoney | null
  healthProblems: string[]
  regime: Regime | null
  concentration: Concentration | null
  usHoldings: UsHolding[]
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
const latest = snapshots[snapshots.length - 1].total_value

const SAMPLE: VestedData = {
  loaded: true,
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
  concentration: { holdings: [{ symbol: 'Reliance', weight_pct: 14 }, { symbol: 'HDFC Bank', weight_pct: 18 }], top2_pct: 32 },
  usHoldings: [
    { ticker: 'NVDA', value_inr: 900_000, day_change_pct: 2.4, verdict: 'HOLD' },
    { ticker: 'MSFT', value_inr: 700_000, day_change_pct: -1.1, verdict: 'HOLD' },
    { ticker: 'VOO', value_inr: 600_000, day_change_pct: 0.6, verdict: 'HOLD' },
    { ticker: 'TSLA', value_inr: 300_000, day_change_pct: -2.9, verdict: 'REVIEW' },
  ],
  edge: { verdict: 'No edge found. Do not trade it.' },
}

/** The demo has no server: it always shows the same sample data. */
export function useVestedData(): VestedData {
  return SAMPLE
}
