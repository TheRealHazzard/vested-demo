import { describe, expect, it } from 'vitest'
import { buildNeeds, monthsToGoal, plotRange, simulate } from './derive'
import { emptyData } from './testData'

const base = emptyData

describe('buildNeeds', () => {
  it('is empty when everything is fine', () => {
    expect(buildNeeds(base)).toEqual([])
  })

  it('puts urgent items first', () => {
    const needs = buildNeeds({
      ...base,
      healthProblems: ['IndMoney broker login expired'],
      concentration: { holdings: [{ symbol: 'ABC', weight_pct: 18 }], top2_pct: 30 },
    })
    expect(needs.map((n) => n.tag)).toEqual(['Login', 'Trim'])
    expect(needs[0].hot).toBe(true)
    expect(needs[1].hot).toBe(false)
  })

  it('turns an under-target bucket into an invest prompt', () => {
    const needs = buildNeeds({
      ...base,
      allocation: {
        liquid_total: 1,
        band_pp: 5,
        monthly_investment: 1,
        rows: [
          {
            category: 'Gold',
            value: 1,
            weight_pct: 9,
            target_pct: 15,
            drift_pp: -6,
            status: 'under',
          },
        ],
        new_money: [{ category: 'Gold', amount: 24000 }],
      },
    })
    expect(needs[0].title).toBe('Rs 24,000 for Gold')
  })
})

describe('plotRange', () => {
  const snaps = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
      total_value: 100 + i,
      illiquid_assets_value: 0,
      liabilities_value: null,
    }))

  it('refuses to draw fewer than two points', () => {
    expect(plotRange(snaps(1), 'All').enough).toBe(false)
    expect(plotRange([], 'All').enough).toBe(false)
  })

  it('fills the width and reports the gain', () => {
    const p = plotRange(snaps(10), 'All')
    expect(p.enough).toBe(true)
    expect(p.end?.x).toBeCloseTo(760)
    expect(p.gain).toBe(9)
  })
})

describe('simulate', () => {
  it('compounds monthly and adds savings', () => {
    const s = simulate(100, 10, 12)
    expect(s[0]).toBe(100)
    expect(s[1]).toBeGreaterThan(110)
    expect(monthsToGoal(s, 200)).not.toBeNull()
    expect(monthsToGoal(s, 1e12)).toBeNull()
  })
})
