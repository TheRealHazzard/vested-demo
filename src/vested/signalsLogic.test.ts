import { describe, expect, it } from 'vitest'
import { edgeView, picks, signalsHeadline, strategies } from './signalsLogic'
import { emptyData } from './testData'

describe('picks', () => {
  it('marks the ones you already own', () => {
    const list = picks({
      ...emptyData,
      leaders: [
        { symbol: 'TRENT', momentum: 31 },
        { symbol: 'BEL.NS', momentum: 38 },
      ],
      indiaHoldings: [
        {
          symbol: 'BEL',
          value: 1,
          weight_pct: 1,
          verdict: 'HOLD',
          reasons: [],
          momentum_6mo: null,
        },
      ],
    })
    expect(list.map((p) => [p.symbol, p.owned])).toEqual([
      ['TRENT', false],
      ['BEL.NS', true],
    ])
    expect(list[0].rank).toBe(1)
  })
})

describe('strategies', () => {
  it('judges a backtest against its plain baseline', () => {
    const rows = strategies({
      ...emptyData,
      algo: {
        regime_uptrend: true,
        trailing_stop_pct: 12,
        trailing_stop_backtest: {
          sharpe: 0.9,
          return_pct: 14,
          max_dd_pct: -18,
          baseline_sharpe: 0.7,
          baseline_return_pct: 9,
          baseline_max_dd_pct: -25,
          folds: '5 folds',
          note: '',
        },
      },
    })
    expect(rows[0].verdict).toBe('Ahead')
  })

  it('does not call a paper simulation a win', () => {
    const rows = strategies({
      ...emptyData,
      sims: [
        {
          id: 'a',
          name: 'Momentum 5',
          description: '',
          started_date: '2026-01-01',
          starting_cash: 1,
          current_value: 2,
          return_pct: 4,
        },
      ],
    })
    expect(rows[0].verdict).toBe('Running')
  })
})

describe('edgeView', () => {
  const edge = (verdict: string) => ({
    ...emptyData,
    edge: {
      verdict,
      rule: {
        events: 146,
        net_mean: -0.0036,
        hit_rate: 0.43,
        t_net: -1,
        net_first_half: -0.002,
        net_second_half: -0.005,
      },
      minEvents: 100,
      minT: 3,
      posts: 18316,
    },
  })

  it('says no edge plainly and keeps the numbers', () => {
    const v = edgeView(edge('No edge found. Do not trade it.'))
    expect(v?.kind).toBe('none')
    expect(v?.headline).toContain('did not beat')
    expect(v?.metrics.find((m) => m.label === 'Net per trade')?.negative).toBe(true)
    expect(v?.halves).toHaveLength(2)
  })

  it('tells promising and early apart', () => {
    expect(edgeView(edge('Promising: keep watching'))?.kind).toBe('promising')
    expect(edgeView(edge('Not enough data yet'))?.kind).toBe('early')
  })

  it('has a headline for every tab even with nothing', () => {
    for (const t of ['Live', 'Strategies', 'Lab'] as const) {
      const h = signalsHeadline(emptyData, t)
      expect(h.em.length).toBeGreaterThan(0)
    }
  })
})
