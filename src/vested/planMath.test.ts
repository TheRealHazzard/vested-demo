import { describe, expect, it } from 'vitest'
import { afford, planModel } from './planMath'

const base = { start: 18_400_000, goal: 45_000_000, monthly: 50_000, returnPct: 7, crash: false }

describe('planModel', () => {
  it('finds the goal year and the milestones in order', () => {
    const m = planModel(base)
    expect(m.goalMonths).not.toBeNull()
    expect(m.yearsAway).toBeGreaterThan(8)
    expect(m.yearsAway).toBeLessThan(12)
    const months = m.milestones.map((x) => x.months ?? Number.POSITIVE_INFINITY)
    expect([...months].sort((a, b) => a - b)).toEqual(months)
    expect(m.milestones[0].months).toBe(0)
  })

  it('a market fall pushes the goal back', () => {
    const calm = planModel(base)
    const hit = planModel({ ...base, crash: true })
    expect(hit.goalMonths ?? 0).toBeGreaterThan(calm.goalMonths ?? 0)
    expect(hit.crashDelay).toBeGreaterThan(0)
  })

  it('saving more brings the goal closer', () => {
    expect(planModel({ ...base, monthly: 150_000 }).goalMonths ?? 999).toBeLessThan(
      planModel(base).goalMonths ?? 0
    )
  })
})

describe('afford', () => {
  const inputs = { ...base, amount: 400_000, liquid: 12_100_000, annualExpenses: 1_580_000 }

  it('says yes while the cushion holds and shows the cost to the goal date', () => {
    const r = afford(inputs)
    expect(r.ok).toBe(true)
    expect(r.reserveAfter).toBeCloseTo((12_100_000 - 400_000) / (1_580_000 / 12), 1)
    expect(r.delayMonths).toBeGreaterThanOrEqual(0)
    expect(r.shareOfLiquid).toBeCloseTo(3.3, 1)
  })

  it('says no when it would eat into the cushion', () => {
    expect(afford({ ...inputs, amount: 11_500_000 }).ok).toBe(false)
  })

  it('says no when it is more than the liquid money', () => {
    expect(afford({ ...inputs, amount: 20_000_000 }).ok).toBe(false)
  })
})
