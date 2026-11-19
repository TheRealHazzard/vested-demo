import { describe, expect, it } from 'vitest'
import { buildHoldings, lensCounts, shortFundName } from './holdings'
import type { VestedData } from './useVestedData'

const base: VestedData = {
  loaded: true,
  snapshots: [],
  fire: null,
  allocation: null,
  indmoney: null,
  healthProblems: [],
  regime: null,
  concentration: null,
  usHoldings: [],
  indiaHoldings: [],
  funds: [],
  otherAssets: [],
  edge: null,
}

describe('buildHoldings', () => {
  it('merges every source, biggest first, with shares that add to 100', () => {
    const list = buildHoldings({
      ...base,
      indiaHoldings: [
        {
          symbol: 'AAA',
          value: 600,
          weight_pct: 0,
          verdict: 'TRIM',
          reasons: ['Too big.'],
          momentum_6mo: 0.1,
        },
      ],
      funds: [
        {
          scheme_name: 'Some Flexi Cap Fund - Direct Plan - Growth',
          value: 300,
          scheme_category: null,
        },
      ],
      usHoldings: [{ ticker: 'BBB', value_inr: 100, day_change_pct: -2, verdict: 'HOLD' }],
    })
    expect(list.map((h) => h.name)).toEqual(['AAA', 'Some Flexi Cap', 'BBB'])
    expect(list.reduce((s, h) => s + h.share, 0)).toBeCloseTo(100)
    expect(list[0].verdict).toBe('Trim')
    expect(list[0].sixMonth).toBeCloseTo(10)
    expect(list[2].verdict).toBe('Keep')
    expect(list[2].today).toBe(-2)
  })

  it('says so when there is nothing to flag', () => {
    const [h] = buildHoldings({
      ...base,
      indiaHoldings: [
        {
          symbol: 'AAA',
          value: 1,
          weight_pct: 0,
          verdict: 'HOLD',
          reasons: [],
          momentum_6mo: null,
        },
      ],
    })
    expect(h.why).toBe('No flags. Nothing to do.')
    expect(h.sixMonth).toBeNull()
  })

  it('counts each lens', () => {
    const list = buildHoldings({
      ...base,
      otherAssets: [{ name: 'Gold', category: 'Gold', value: 5, liquid: 1, note: '' }],
      usHoldings: [{ ticker: 'X', value_inr: 1, day_change_pct: null, verdict: 'WATCH' }],
    })
    expect(lensCounts(list)).toEqual({ All: 2, India: 0, Funds: 0, US: 1, Other: 1 })
  })
})

describe('shortFundName', () => {
  it('drops the plan and option suffixes', () => {
    expect(shortFundName('Parag Parikh Flexi Cap Fund - Direct Plan - Growth')).toBe(
      'Parag Parikh Flexi Cap'
    )
  })
})
