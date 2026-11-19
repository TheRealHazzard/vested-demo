import { describe, expect, it } from 'vitest'
import { plotRange, requiredMonthly, simulate } from './derive'
import { moveStory, yearSplit } from './insights'
import { emptyData } from './testData'

describe('moveStory', () => {
  it('names the biggest movers and who they are', () => {
    const s = moveStory({
      ...emptyData,
      usHoldings: [
        { ticker: 'AAA', value_inr: 1, day_change_pct: 2.4, verdict: 'HOLD' },
        { ticker: 'BBB', value_inr: 1, day_change_pct: -2.9, verdict: 'HOLD' },
      ],
    })
    expect(s).toContain('BBB −2.9%')
    expect(s).toContain('AAA +2.4%')
    expect(s).toContain('India prices land after the close')
  })

  it('says nothing when there is no US data at all', () => {
    expect(moveStory(emptyData)).toBeNull()
  })

  it('says it was quiet when nothing moved', () => {
    expect(
      moveStory({
        ...emptyData,
        usHoldings: [{ ticker: 'A', value_inr: 1, day_change_pct: 0.1, verdict: 'HOLD' }],
      })
    ).toContain('barely moved')
  })
})

describe('yearSplit', () => {
  const snaps = (n: number, a: number, b: number) =>
    Array.from({ length: n }, (_, i) => ({
      date: new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10),
      total_value: a + ((b - a) * i) / (n - 1),
      illiquid_assets_value: 0,
      liabilities_value: null,
    }))

  it('splits the gain into what was added and what grew', () => {
    const s = yearSplit({
      ...emptyData,
      snapshots: snaps(366, 1_000_000, 3_000_000),
      allocation: {
        liquid_total: 1,
        band_pp: 5,
        monthly_investment: 50_000,
        rows: [],
        new_money: [],
      },
    })
    expect(s).toContain('Rs 20.0 L')
    expect(s).toContain('Rs 6.0 L')
    expect(s).toContain('Rs 14.0 L is growth')
  })

  it('does not guess when there is less than most of a year of history', () => {
    expect(yearSplit({ ...emptyData, snapshots: snaps(60, 1, 2) })).toBeNull()
  })
})

describe('requiredMonthly', () => {
  it('saves exactly enough to land on the goal in the chosen month', () => {
    const start = 18_400_000
    const goal = 45_000_000
    const monthly = requiredMonthly(start, goal, 96, 7)
    const series = simulate(start, monthly, 7)
    expect(series[96]).toBeGreaterThan(goal * 0.999)
    expect(series[96]).toBeLessThan(goal * 1.001)
  })

  it('needs nothing when growth alone gets there', () => {
    expect(requiredMonthly(1_000_000, 1_100_000, 120, 7)).toBe(0)
  })
})

describe('plotRange events and benchmark', () => {
  const base = Array.from({ length: 40 }, (_, i) => ({
    date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
    total_value: 100 + i + (i === 20 ? 10 : 0) - (i === 30 ? 8 : 0),
    illiquid_assets_value: 0,
    liabilities_value: null,
  }))

  it('marks the biggest day up and the biggest day down', () => {
    const p = plotRange(base, 'All')
    expect(p.events.map((e) => e.tone).sort()).toEqual(['down', 'up'])
    expect(p.events.find((e) => e.tone === 'down')?.note).toContain('fall')
  })

  it('rebases the benchmark to the same starting money', () => {
    const bench = base.map((s, i) => ({ date: s.date, value: 20_000 + i * 100 }))
    const p = plotRange(base, 'All', bench)
    expect(p.bench).not.toBeNull()
    expect(p.benchValue).toBeCloseTo((100 * (20_000 + 39 * 100)) / 20_000, 0)
  })
})
