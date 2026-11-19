/**
 * The three working parts of the Plan page, shared by the phone and wide layouts:
 * the milestones, the "what if" controls, and the "can I afford it" check.
 */
import { useId } from 'react'
import { inr } from '../format'
import { CRASH, RESERVE_FLOOR_MONTHS } from '../planMath'
import type { PlanState } from '../usePlan'

function whenText(months: number | null): string {
  if (months === null) return 'After 15 years'
  if (months === 0) return 'Reached'
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return String(d.getFullYear())
}

export function Milestones({ p }: { p: PlanState }) {
  const id = useId()
  if (!p.model) return null
  return (
    <section className="vm-section" aria-labelledby={id}>
      <div className="vm-sechead">
        <h2 id={id}>Milestones</h2>
      </div>
      <div className="vm-group">
        {p.model.milestones.map((m) => (
          <div key={m.pct} className="vm-row">
            <span className="vm-rowtext">
              <span className="vm-rowtitle">
                {m.pct === 1 ? 'The goal' : `${m.pct * 100}% of the goal`}
              </span>
              <span className="vm-sub">{inr(m.amount)}</span>
            </span>
            <span className={m.months === 0 ? 'vm-up' : 'vm-dim'}>{whenText(m.months)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function WhatIf({ p }: { p: PlanState }) {
  const id = useId()
  const stress = new Date()
  stress.setMonth(stress.getMonth() + CRASH.month)
  return (
    <section className="vm-section" aria-labelledby={`${id}-h`}>
      <div className="vm-sechead">
        <h2 id={`${id}-h`}>What if</h2>
      </div>
      <div className="vm-group vm-form">
        <div className="vm-field">
          <div className="vm-field-top">
            <label htmlFor={`${id}-save`}>Invested each month</label>
            <b>{inr(p.monthly)}</b>
          </div>
          <input
            id={`${id}-save`}
            className="vm-range"
            type="range"
            min={0}
            max={Math.max(300_000, Math.ceil((p.baseMonthly * 3) / 10_000) * 10_000)}
            step={5_000}
            value={Math.round(p.monthly)}
            onChange={(e) => p.setMonthly(Number(e.target.value))}
          />
          {Math.round(p.monthly) !== Math.round(p.baseMonthly) ? (
            <button type="button" className="vm-textbtn vm-left" onClick={p.resetMonthly}>
              Back to {inr(p.baseMonthly)}
            </button>
          ) : (
            <span className="vm-cap">Today you invest {inr(p.baseMonthly)}.</span>
          )}
        </div>
        <div className="vm-field">
          <div className="vm-field-top">
            <label htmlFor={`${id}-ret`}>Yearly return</label>
            <b>{p.returnPct}%</b>
          </div>
          <input
            id={`${id}-ret`}
            className="vm-range"
            type="range"
            min={4}
            max={14}
            step={1}
            value={p.returnPct}
            onChange={(e) => p.setReturnPct(Number(e.target.value))}
          />
          <span className="vm-cap">7% is a cautious guess.</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={p.crash}
          className="vm-switchrow"
          onClick={() => p.setCrash(!p.crash)}
        >
          <span className="vm-rowtext">
            <span className="vm-rowtitle">Stress test</span>
            <span className="vm-sub">
              A {CRASH.fall * 100}% fall around{' '}
              {stress.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}, then normal
              returns
            </span>
          </span>
          <span className="vm-switch" aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}

export function Afford({ p }: { p: PlanState }) {
  const id = useId()
  const r = p.purchase
  return (
    <section className="vm-section" aria-labelledby={`${id}-h`}>
      <div className="vm-sechead">
        <h2 id={`${id}-h`}>Can I afford it?</h2>
      </div>
      <div className="vm-group vm-form">
        <div className="vm-field">
          <label htmlFor={`${id}-amt`} className="vm-cap">
            Amount
          </label>
          <div className="vm-amount">
            <span className="vm-dim">Rs</span>
            <input
              id={`${id}-amt`}
              inputMode="numeric"
              value={p.amountText}
              onChange={(e) => p.setAmountText(e.target.value)}
            />
          </div>
        </div>
        {r ? (
          <div className={`vm-verdict ${r.ok ? 'is-ok' : 'is-no'}`}>
            <p className="vm-rowtitle">{r.ok ? 'You can afford this' : 'Not comfortably'}</p>
            <p className="vm-sub">
              {r.reserveAfter !== null
                ? `It leaves ${Math.max(r.reserveAfter, 0).toFixed(1)} months of expenses in cash (your floor is ${RESERVE_FLOOR_MONTHS}). `
                : ''}
              {r.delayMonths !== null && r.delayMonths > 0
                ? `Your goal date moves back about ${r.delayMonths} month${r.delayMonths === 1 ? '' : 's'}. `
                : 'It does not change your goal date. '}
              That is {r.shareOfLiquid.toFixed(1)}% of your liquid money.
            </p>
          </div>
        ) : (
          <span className="vm-cap">
            Enter an amount to check it against your cash and your goal.
          </span>
        )}
      </div>
    </section>
  )
}
