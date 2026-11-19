import { useMemo, useState } from 'react'
import { ASSUMED_RETURN, plotPath, requiredMonthly } from './derive'
import { afford, CRASH, planModel } from './planMath'
import type { VestedData } from './useVestedData'

/** Everything the Plan page needs, for both layouts: the inputs you can change and what they give. */
export function usePlan(data: VestedData) {
  const latest = data.snapshots.at(-1)
  const start = data.fire?.net_worth ?? latest?.total_value ?? 0
  const goal = data.fire?.fire_number ?? null
  const baseMonthly = data.allocation?.monthly_investment ?? 0

  const [monthlyEdit, setMonthlyEdit] = useState<number | null>(null)
  const [returnPct, setReturnPct] = useState(ASSUMED_RETURN)
  const [crash, setCrash] = useState(false)
  const [amountText, setAmountText] = useState('400000')

  const monthly = monthlyEdit ?? baseMonthly
  const ready = goal !== null && goal > 0 && start > 0

  const model = useMemo(
    () => (ready && goal !== null ? planModel({ start, goal, monthly, returnPct, crash }) : null),
    [ready, goal, start, monthly, returnPct, crash]
  )
  const path = useMemo(
    () =>
      ready && goal !== null
        ? plotPath(data.snapshots, start, goal, monthly, returnPct, crash ? CRASH : undefined)
        : null,
    [ready, goal, data.snapshots, start, monthly, returnPct, crash]
  )

  const amount = Number(amountText.replace(/[^0-9.]/g, '')) || 0
  const purchase = useMemo(
    () =>
      ready && goal !== null && amount > 0
        ? afford({
            amount,
            liquid: data.allocation?.liquid_total ?? 0,
            annualExpenses: data.fire?.annual_expenses ?? null,
            start,
            goal,
            monthly,
            returnPct,
          })
        : null,
    [ready, goal, amount, data.allocation, data.fire, start, monthly, returnPct]
  )

  const percent = data.fire?.progress_pct ?? (goal ? Math.min((start / goal) * 100, 100) : null)

  return {
    ready,
    start,
    goal,
    percent,
    monthly,
    baseMonthly,
    returnPct,
    crash,
    amountText,
    amount,
    model,
    path,
    purchase,
    setMonthly: (v: number) => setMonthlyEdit(Math.max(0, v)),
    resetMonthly: () => setMonthlyEdit(null),
    setReturnPct,
    setCrash,
    setAmountText,
    /** Dragging the goal marker to a month works out the saving that would land there. */
    dragGoalTo: (months: number | null) => {
      if (months === null || goal === null) return setMonthlyEdit(null)
      setMonthlyEdit(requiredMonthly(start, goal, months, returnPct))
    },
  }
}

export type PlanState = ReturnType<typeof usePlan>
