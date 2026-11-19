/**
 * The Plan page's arithmetic: when you reach the goal, what each milestone is and when,
 * what a market fall would cost, and whether a purchase is affordable. Pure functions
 * over the same compounding the chart draws.
 */
import { HORIZON_MONTHS, monthsToGoal, simulate, yearOf } from './derive'

/** The stress test: a 35% fall about fourteen months out, then normal returns. */
export const CRASH = { month: 14, fall: 0.35 }
/** The cushion of living costs to keep as cash, as a number of months. */
export const RESERVE_FLOOR_MONTHS = 6

export interface PlanInputs {
  start: number
  goal: number
  monthly: number
  returnPct: number
  crash: boolean
}

export interface Milestone {
  pct: number
  amount: number
  /** Month from now it is reached, 0 if already, null if beyond the horizon. */
  months: number | null
}

export interface PlanModel {
  series: number[]
  goalMonths: number | null
  goalYear: number | null
  yearsAway: number | null
  milestones: Milestone[]
  /** How many months the stress test pushes the goal back, if it is still reachable. */
  crashDelay: number | null
}

export function planModel(i: PlanInputs): PlanModel {
  const series = simulate(i.start, i.monthly, i.returnPct, i.crash ? CRASH : undefined)
  const goalMonths = monthsToGoal(series, i.goal)
  const calm = simulate(i.start, i.monthly, i.returnPct)
  const calmMonths = monthsToGoal(calm, i.goal)
  return {
    series,
    goalMonths,
    goalYear: goalMonths === null ? null : yearOf(goalMonths),
    yearsAway: goalMonths === null ? null : goalMonths / 12,
    milestones: [0.25, 0.5, 0.75, 1].map((pct) => ({
      pct,
      amount: i.goal * pct,
      months: monthsToGoal(series, i.goal * pct),
    })),
    crashDelay:
      i.crash && goalMonths !== null && calmMonths !== null ? goalMonths - calmMonths : null,
  }
}

export interface AffordInputs {
  amount: number
  liquid: number
  annualExpenses: number | null
  start: number
  goal: number
  monthly: number
  returnPct: number
}

export interface AffordResult {
  ok: boolean
  /** Months of living costs left in liquid money afterwards, null if expenses are unknown. */
  reserveAfter: number | null
  /** How many months later the goal lands, null if it cannot be worked out. */
  delayMonths: number | null
  shareOfLiquid: number
}

export function afford(i: AffordInputs): AffordResult {
  const monthlyCost = i.annualExpenses ? i.annualExpenses / 12 : null
  const reserveAfter = monthlyCost ? (i.liquid - i.amount) / monthlyCost : null
  const before = monthsToGoal(simulate(i.start, i.monthly, i.returnPct), i.goal)
  const after = monthsToGoal(simulate(i.start - i.amount, i.monthly, i.returnPct), i.goal)
  return {
    ok: i.amount <= i.liquid && (reserveAfter === null || reserveAfter >= RESERVE_FLOOR_MONTHS),
    reserveAfter,
    delayMonths: before !== null && after !== null ? after - before : null,
    shareOfLiquid: i.liquid > 0 ? (i.amount / i.liquid) * 100 : 100,
  }
}

export const PLAN_HORIZON_YEARS = HORIZON_MONTHS / 12
